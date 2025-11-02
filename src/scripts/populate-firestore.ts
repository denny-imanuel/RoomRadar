// To run this script, execute: `npm run db:populate`

import admin from 'firebase-admin';
import { firebaseConfig } from '../src/firebase/config';
import path from 'path';
import type { User, Building, Room, Booking, Message, Transaction, WithId, Conversation } from '../src/lib/types';

// IMPORTANT: Download your service account key from the Firebase console
// and save it as `serivceAccountKey.json` in the root of your project.
// This file is git-ignored, so it won't be committed to your repository.
const serviceAccount = require(path.resolve(process.cwd(), 'serivceAccountKey.json'));

// --- MOCK DATA (Fully defined with IDs) ---

export const users: WithId<Omit<User, 'id' | 'dateJoined'>>[] = [
  {
    id: 'user-1',
    name: 'Alex Tenant',
    firstName: 'Alex',
    lastName: 'Tenant',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex-tenant',
    email: 'alex.tenant@example.com',
    phone: '+1234567890',
    profilePicture: 'https://i.pravatar.cc/150?u=alex-tenant',
    whatsapp: '+1234567890',
    role: 'tenant',
  },
  {
    id: 'user-2',
    name: 'Brian Landlord',
    firstName: 'Brian',
    lastName: 'Landlord',
    avatarUrl: 'https://i.pravatar.cc/150?u=brian-landlord',
    email: 'brian.landlord@example.com',
    phone: '+1987654321',
    profilePicture: 'https://i.pravatar.cc/150?u=brian-landlord',
    whatsapp: '+1987654321',
    role: 'landlord',
  },
];

export const buildings: WithId<Omit<Building, 'id' | 'ownerId'>>[] = [
  { id: 'building-1', name: 'The Urban Nest', address: '123 Main St, Anytown, USA', description: 'A modern downtown building with great amenities.', images: ['https://picsum.photos/seed/bldg1/600/400', 'https://picsum.photos/seed/room1/600/400'], lat: 34.0522, lng: -118.2437, checkIn: '14:00', checkOut: '11:00' },
  { id: 'building-2', name: 'Seaside Villas', address: '789 Ocean Blvd, Beachtown, USA', description: 'Beautiful villas with stunning ocean views.', images: ['https://picsum.photos/seed/bldg3/600/400', 'https://picsum.photos/seed/room5/600/400'], lat: 33.985, lng: -118.466, checkIn: '16:00', checkOut: '10:00' },
  { id: 'building-3', name: 'City Center Suites', address: '200 Central Plaza, Metropolis, USA', description: 'Luxury suites in the heart of the city.', images: ['https://picsum.photos/seed/bldg5/600/400', 'https://picsum.photos/seed/room9/600/400'], lat: 34.05, lng: -118.24, checkIn: '14:30', checkOut: '11:30' },
];

export const rooms: WithId<Omit<Room, 'id' | 'ownerId'>>[] = [
    { id: 'room-1', buildingId: 'building-1', name: 'Cozy Single Room', price: 800, priceMonthly: 800, priceWeekly: 250, priceDaily: 40, depositMonthly: 800, depositWeekly: 100, depositDaily: 50, images: ['https://picsum.photos/seed/room1/600/400'], amenities: ['wifi', 'air-conditioner', 'table-chair'], roomType: 'single', bookedDates: [{ from: '2024-05-01', to: '2024-05-31' }] },
    { id: 'room-2', buildingId: 'building-1', name: 'Spacious Double', price: 1200, priceMonthly: 1200, priceWeekly: 350, priceDaily: 60, depositMonthly: 1200, depositWeekly: 150, depositDaily: 75, images: ['https://picsum.photos/seed/room2/600/400'], amenities: ['wifi', 'air-conditioner', 'bathroom', 'wardrobe-storage'], roomType: 'double', bookedDates: [{ from: '2024-11-01', to: '2024-11-30' }] },
    { id: 'room-3', buildingId: 'building-2', name: 'Garden View Single', price: 950, priceMonthly: 950, priceWeekly: 280, priceDaily: 45, depositMonthly: 950, images: ['https://picsum.photos/seed/room3/600/400'], amenities: ['wifi', 'heater', 'bed-mattress'], roomType: 'single', bookedDates: [{ from: '2025-01-05', to: '2025-01-12' }] },
];

export const bookings: WithId<Omit<Booking, 'id'>>[] = [
  { id: 'booking-1', userId: 'user-1', roomId: 'room-1', buildingId: 'building-1', buildingName: 'The Urban Nest', roomName: 'Cozy Single Room', checkIn: '2024-05-01', checkOut: '2024-05-31', totalPrice: 1808.00, imageUrl: 'https://picsum.photos/seed/bldg1-room1/600/400', status: 'confirmed' },
  { id: 'booking-2', userId: 'user-1', roomId: 'room-3', buildingId: 'building-2', buildingName: 'Seaside Villas', roomName: 'Garden View Single', checkIn: '2025-01-05', checkOut: '2025-01-12', totalPrice: 616.00, imageUrl: 'https://picsum.photos/seed/bldg3-room1/600/400', status: 'confirmed' },
  { id: 'booking-3', userId: 'user-1', roomId: 'room-2', buildingId: 'building-1', buildingName: 'The Urban Nest', roomName: 'Spacious Double', checkIn: '2024-11-01', checkOut: '2024-11-30', totalPrice: 2640.00, imageUrl: 'https://picsum.photos/seed/bldg1-room2/600/400', status: 'confirmed' },
  { id: 'booking-4', userId: 'user-1', roomId: 'room-1', buildingId: 'building-1', buildingName: 'The Urban Nest', buildingAddress: '123 Main St, Anytown, USA', roomName: 'Cozy Single Room', checkIn: '2024-07-01', checkOut: '2024-07-31', totalPrice: 2250, imageUrl: 'https://picsum.photos/seed/bldg1-room1-pending1/600/400', status: 'pending' },
  { id: 'booking-5', userId: 'user-1', roomId: 'room-2', buildingId: 'building-1', buildingName: 'The Urban Nest', buildingAddress: '123 Main St, Anytown, USA', roomName: 'Spacious Double', checkIn: '2024-12-15', checkOut: '2025-01-15', totalPrice: 2640, imageUrl: 'https://picsum.photos/seed/bldg1-room2-pending2/600/400', status: 'pending' },
  { id: 'booking-6', userId: 'user-1', roomId: 'room-3', buildingId: 'building-2', buildingName: 'Seaside Villas', buildingAddress: '789 Ocean Blvd, Beachtown, USA', roomName: 'Garden View Single', checkIn: '2024-09-01', checkOut: '2024-09-08', totalPrice: 562, imageUrl: 'https://picsum.photos/seed/bldg3-room1-pending3/600/400', status: 'pending' },
];

export const messages: WithId<Omit<Message, 'id'>>[] = [
    { id: 'msg-1', conversationId: 'user-1_user-2', senderId: 'user-1', text: 'Hi Brian, is the Cozy Single Room at The Urban Nest available for May?', timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 120) },
    { id: 'msg-2', conversationId: 'user-1_user-2', senderId: 'user-2', text: 'Hi Alex, yes it is. I see you\'ve just booked it. Let me know if you have any questions!', timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 119) },
    { id: 'msg-3', conversationId: 'user-1_user-2', senderId: 'user-1', text: 'Great, thanks! Just wanted to confirm if parking is included?', timestamp: admin.firestore.Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 96) },
];

export const transactions: WithId<Omit<Transaction, 'id'>>[] = [
  { id: 'txn-1', userId: 'user-1', type: 'Top-up', amount: 2000, date: '2024-02-25', status: 'Completed' },
  { id: 'txn-2', userId: 'user-1', bookingId: 'booking-1', type: 'Rent Payment', amount: 1808.00, date: '2024-05-01', status: 'Completed' },
  { id: 'txn-3', userId: 'user-2', bookingId: 'booking-1', type: 'Payout', amount: 1808.00, date: '2024-05-01', status: 'Completed' },
  { id: 'txn-4', userId: 'user-1', bookingId: 'booking-4', type: 'Rent Payment', amount: 2250, date: '2024-06-20', status: 'pending' },
  { id: 'txn-5', userId: 'user-1', bookingId: 'booking-5', type: 'Rent Payment', amount: 2640, date: '2024-06-20', status: 'pending' },
  { id: 'txn-6', userId: 'user-1', bookingId: 'booking-6', type: 'Rent Payment', amount: 562, date: '2024-06-20', status: 'pending' },
];

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
    await Promise.all(users.map(user => 
        auth.createUser({
            uid: user.id,
            email: user.email,
            password: 'password', // All mock users will have this password
            displayName: user.name,
            photoURL: user.avatarUrl,
        }).catch(error => console.error(`Error creating auth user ${user.name}:`, error))
    ));
    
    const userBatch = db.batch();
    users.forEach(user => {
        const userRef = db.collection('users').doc(user.id);
        const { id, ...userData } = user;
        userBatch.set(userRef, { ...userData, id: user.id, dateJoined: new Date().toISOString() });
    });
    await userBatch.commit();
    console.log(`- Added ${users.length} users.`);

    // 2. Populate Buildings
    console.log('Populating buildings...');
    const buildingBatch = db.batch();
    buildings.forEach(building => {
        const buildingRef = db.collection('buildings').doc(building.id);
        buildingBatch.set(buildingRef, { ...building, ownerId: 'user-2' }); // All owned by Brian
    });
    await buildingBatch.commit();
    console.log(`- Added ${buildings.length} buildings.`);

    // 3. Populate Rooms
    console.log('Populating rooms...');
    const roomBatch = db.batch();
    rooms.forEach(room => {
        const roomRef = db.collection('rooms').doc(room.id);
        roomBatch.set(roomRef, { ...room, ownerId: 'user-2' }); // All owned by Brian
    });
    await roomBatch.commit();
    console.log(`- Added ${rooms.length} rooms.`);

    // 4. Populate Bookings
    console.log('Populating bookings...');
    const bookingBatch = db.batch();
    bookings.forEach(booking => {
        const bookingRef = db.collection('bookings').doc(booking.id);
        bookingBatch.set(bookingRef, booking);
    });
    await bookingBatch.commit();
    console.log(`- Added ${bookings.length} bookings.`);

    // 5. Populate Conversations & Messages
    console.log('Populating conversations and messages...');
    const conversationId = 'user-1_user-2';
    const conversationRef = db.collection('conversations').doc(conversationId);
    const lastMessage = messages[messages.length - 1];
    await conversationRef.set({
      id: conversationId,
      participants: ['user-1', 'user-2'],
      lastMessage: {
        text: lastMessage.text,
        timestamp: lastMessage.timestamp,
        senderId: lastMessage.senderId
      }
    } as Conversation);

    const messagesBatch = db.batch();
    messages.forEach(msg => {
      const msgRef = db.collection('messages').doc(msg.id);
      messagesBatch.set(msgRef, msg);
    });
    await messagesBatch.commit();
    console.log(`- Added 1 conversation and ${messages.length} messages.`);

    // 6. Populate Transactions
    console.log('Populating transactions...');
    const transactionBatch = db.batch();
    transactions.forEach(transaction => {
      const transactionRef = db.collection('transactions').doc(transaction.id);
      transactionBatch.set(transactionRef, transaction);
    });

    await transactionBatch.commit();
    console.log(`- Added ${transactions.length} transactions.`);

    console.log('\nFirestore data population finished successfully!');
  };


  populateFirestore().catch((error) => {
      console.error('An error occurred during Firestore population:', error);
      process.exit(1);
  });
}

    