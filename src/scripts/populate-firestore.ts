// To run this script, execute: `npm run db:populate`

import admin from 'firebase-admin';
import { firebaseConfig } from '../firebase/config';
import path from 'path';
import type { User, Building, Room, Booking, Message, Transaction, WithId, Conversation } from '../lib/types';
import { 
    mockUsers, 
    mockBuildings, 
    mockRooms, 
    mockBookings, 
    mockMessages, 
    mockTransactions, 
    mockConversations 
} from '../lib/placeholder-data';


// IMPORTANT: Download your service account key from the Firebase console
// and save it as `serivceAccountKey.json` in the root of your project.
// This file is git-ignored, so it won't be committed to your repository.
const serviceAccount = require(path.resolve(process.cwd(), 'serivceAccountKey.json'));

// --- MAIN SCRIPT LOGIC ---

if (require.main === module) {
  // This block will only run when the script is executed directly.
  
  // Safely initialize the Firebase app, preventing duplicate app errors.
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https:///${firebaseConfig.projectId}.firebaseio.com`,
      projectId: firebaseConfig.projectId,
    });
  }

  const db = admin.firestore();
  const auth = admin.auth();
  
  async function deleteCollection(collectionPath: string) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.limit(500).get();
    if (snapshot.empty) {
      return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    // Recurse to delete remaining documents
    await deleteCollection(collectionPath);
  }

  async function clearAllData() {
    console.log('--- Clearing All Existing Data ---');
    try {
      const listUsersResult = await auth.listUsers(1000);
      if (listUsersResult.users.length > 0) {
        const uidsToDelete = listUsersResult.users.map((u) => u.uid);
        await auth.deleteUsers(uidsToDelete);
        console.log(`- Successfully deleted ${uidsToDelete.length} users from Firebase Auth.`);
      } else {
        console.log('- No users to delete from Firebase Auth.');
      }
    } catch (error) {
      console.error('Error deleting auth users:', error);
    }
    
    // List of all top-level collections to be cleared
    const collections = ['users', 'buildings', 'rooms', 'bookings', 'conversations', 'messages', 'transactions'];
    for (const collectionName of collections) {
      console.log(`- Deleting collection: ${collectionName}`);
      await deleteCollection(collectionName);
    }
    
    console.log('--- Finished Clearing Data ---\n');
  }

  const populateFirestore = async () => {
    console.log('Initializing Firebase Admin SDK...');
    await clearAllData();
    console.log('Starting Firestore data population...');

    // 1. Populate Users
    console.log('Populating users...');
    await Promise.all(mockUsers.map(user => 
        auth.createUser({
            uid: user.id,
            email: user.email,
            password: user.password,
            displayName: user.name,
            photoURL: user.avatarUrl,
        }).catch(error => console.error(`Error creating auth user ${user.name}:`, error))
    ));
    
    const userBatch = db.batch();
    mockUsers.forEach(user => {
        const userRef = db.collection('users').doc(user.id);
        const { password, ...userData } = user;
        userBatch.set(userRef, { ...userData, dateJoined: new Date().toISOString() });
    });
    await userBatch.commit();
    console.log(`- Added ${mockUsers.length} users.`);

    // 2. Populate Buildings
    console.log('Populating buildings...');
    const buildingBatch = db.batch();
    mockBuildings.forEach(building => {
        const buildingRef = db.collection('buildings').doc(building.id);
        buildingBatch.set(buildingRef, building);
    });
    await buildingBatch.commit();
    console.log(`- Added ${mockBuildings.length} buildings.`);

    // 3. Populate Rooms
    console.log('Populating rooms...');
    const roomBatch = db.batch();
    mockRooms.forEach(room => {
        const roomRef = db.collection('rooms').doc(room.id);
        roomBatch.set(roomRef, room);
    });
    await roomBatch.commit();
    console.log(`- Added ${mockRooms.length} rooms.`);

    // 4. Populate Bookings
    console.log('Populating bookings...');
    const bookingBatch = db.batch();
    mockBookings.forEach(booking => {
        const bookingRef = db.collection('bookings').doc(booking.id);
        bookingBatch.set(bookingRef, booking);
    });
    await bookingBatch.commit();
    console.log(`- Added ${mockBookings.length} bookings.`);

    // 5. Populate Conversations & Messages
    console.log('Populating conversations and messages...');
    mockConversations.forEach(async (convo) => {
        const conversationRef = db.collection('conversations').doc(convo.id);
        await conversationRef.set({
            ...convo,
            lastMessage: {
                ...convo.lastMessage,
                timestamp: admin.firestore.Timestamp.fromDate(new Date(convo.lastMessage.timestamp as string)),
            }
        });
    });

    const messagesBatch = db.batch();
    mockMessages.forEach(msg => {
      const msgRef = db.collection('messages').doc(msg.id);
      messagesBatch.set(msgRef, {
        ...msg,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(msg.timestamp as string)),
      });
    });
    await messagesBatch.commit();
    console.log(`- Added ${mockConversations.length} conversation(s) and ${mockMessages.length} messages.`);

    // 6. Populate Transactions
    console.log('Populating transactions...');
    const transactionBatch = db.batch();
    mockTransactions.forEach(transaction => {
      const transactionRef = db.collection('transactions').doc(transaction.id);
      transactionBatch.set(transactionRef, transaction);
    });

    await transactionBatch.commit();
    console.log(`- Added ${mockTransactions.length} transactions.`);

    console.log('\nFirestore data population finished successfully!');
  };


  populateFirestore().catch((error) => {
      console.error('An error occurred during Firestore population:', error);
      process.exit(1);
  });
}
