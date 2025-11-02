// To run this script, execute: `npm run db:verify`

import admin from 'firebase-admin';
import { firebaseConfig } from '../firebase/config';
import path from 'path';
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
// and save it as `serviceAccountKey.json` in the root of your project.
const serviceAccount = require(path.resolve(process.cwd(), 'serviceAccountKey.json'));

// Safely initialize the Firebase app, preventing duplicate app errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https:///${firebaseConfig.projectId}.firebaseio.com`,
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();
const auth = admin.auth();

let hasError = false;

async function verifyCollectionCount(collectionPath: string, expectedCount: number, label: string) {
  try {
    const snapshot = await db.collection(collectionPath).get();
    const actualCount = snapshot.size;
    if (actualCount === expectedCount) {
      console.log(`✅ SUCCESS: ${label} count is correct (${actualCount}/${expectedCount}).`);
    } else {
      console.error(`❌ FAILURE: ${label} count is incorrect. Expected ${expectedCount}, but found ${actualCount}.`);
      hasError = true;
    }
  } catch (error) {
    console.error(`❌ ERROR: Could not verify ${label}.`, error);
    hasError = true;
  }
}

async function verifyAuthUsers() {
    console.log('\n--- Verifying Firebase Auth Users ---');
    try {
        const listUsersResult = await auth.listUsers(100);
        const actualCount = listUsersResult.users.length;
        const expectedCount = mockUsers.length;
        if (actualCount === expectedCount) {
            console.log(`✅ SUCCESS: Auth Users count is correct (${actualCount}/${expectedCount}).`);
        } else {
            console.error(`❌ FAILURE: Auth Users count is incorrect. Expected ${expectedCount}, but found ${actualCount}.`);
            hasError = true;
        }
    } catch (error) {
        console.error('❌ ERROR: Could not list Auth users.', error);
        hasError = true;
    }
}

async function verifyAll() {
  console.log('--- Starting Firestore Data Verification ---');

  // Verify Auth Users
  await verifyAuthUsers();

  // Verify top-level collections
  console.log('\n--- Verifying Top-Level Collections ---');
  await verifyCollectionCount('users', mockUsers.length, 'Users Collection');
  await verifyCollectionCount('buildings', mockBuildings.length, 'Buildings Collection');
  await verifyCollectionCount('rooms', mockRooms.length, 'Rooms Collection');
  await verifyCollectionCount('bookings', mockBookings.length, 'Bookings Collection');
  await verifyCollectionCount('transactions', mockTransactions.length, 'Transactions Collection');
  await verifyCollectionCount('conversations', mockConversations.length, 'Conversations Collection');
  await verifyCollectionCount('messages', mockMessages.length, 'Messages Collection');
  
  console.log('\n--- Verification Complete ---');
  if (hasError) {
    console.error('\n❗️ At least one verification check failed. Please review the logs above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All data verification checks passed successfully!');
  }
}

verifyAll().catch(err => {
    console.error("An unexpected error occurred during verification:", err);
    process.exit(1);
});
