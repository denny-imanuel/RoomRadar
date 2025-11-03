
// To run this script, execute: `npm run verify:backend`

import { firebaseConfig } from '@/firebase/config';
import {
    mockUsers,
    mockBuildings,
    mockRooms,
    mockBookings,
    mockConversations,
    mockMessages,
    mockTransactions,
    mockNotifications
} from '@/lib/placeholder-data';
import { User, Building, Room, Booking, Conversation, Message, Transaction, Notification, WithId } from '../lib/types';

const projectId = firebaseConfig.projectId;
const region = 'us-central1'; // Assuming from previous deployment logs

let hasError = false;

async function callFunction(functionName: string, data: any): Promise<any> {
    const url = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Function ${functionName} failed with status ${response.status}: ${errorText}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse.result;
}

async function verifyFunctions() {
    console.log("--- Verifying Deployed Firebase Functions ---");

    // --- Verify getUserById ---
    try {
        console.log("Verifying getUserById...");
        const targetUser = mockUsers[0];
        const resultUser = await callFunction('getUserById', targetUser.id) as WithId<User>;
        if (resultUser.id === targetUser.id && resultUser.email === targetUser.email) {
            console.log("✅ getUserById returned correct data.");
        } else {
            console.error("❌ getUserById verification failed.", { expected: targetUser.id, got: resultUser });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getUserById:", error);
        hasError = true;
    }
    
    // --- Verify getBuildingById ---
    try {
        console.log("\nVerifying getBuildingById...");
        const targetBuilding = mockBuildings[0];
        const resultBuilding = await callFunction('getBuildingById', targetBuilding.id) as WithId<Building>;
        if (resultBuilding.id === targetBuilding.id && resultBuilding.name === targetBuilding.name) {
            console.log("✅ getBuildingById returned correct data.");
        } else {
            console.error("❌ getBuildingById verification failed.", { expected: targetBuilding.id, got: resultBuilding });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getBuildingById:", error);
        hasError = true;
    }

    // --- Verify getRoomById ---
    try {
        console.log("\nVerifying getRoomById...");
        const targetRoom = mockRooms[0];
        const resultRoom = await callFunction('getRoomById', targetRoom.id) as WithId<Room>;
        if (resultRoom.id === targetRoom.id && resultRoom.name === targetRoom.name) {
            console.log("✅ getRoomById returned correct data.");
        } else {
            console.error("❌ getRoomById verification failed.", { expected: targetRoom.id, got: resultRoom });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getRoomById:", error);
        hasError = true;
    }

    // --- Verify getBuildingsWithRooms ---
    try {
        console.log("\nVerifying getBuildingsWithRooms...");
        const result = await callFunction('getBuildingsWithRooms', {}) as (WithId<Building> & { rooms: WithId<Room>[] })[];
        if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0].rooms)) {
            console.log("✅ getBuildingsWithRooms returned correct data format.");
        } else {
            console.error("❌ getBuildingsWithRooms verification failed. Expected an array of buildings with rooms, got:", result);
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getBuildingsWithRooms:", error);
        hasError = true;
    }

    // --- Verify getLandlordListings ---
    try {
        console.log("\nVerifying getLandlordListings...");
        const landlord = mockUsers.find(u => u.role === 'landlord');
        if (!landlord) throw new Error("No landlord found in mock data");

        const result = await callFunction('getLandlordListings', landlord.id) as (WithId<Building> & { rooms: WithId<Room>[] })[];
        if (Array.isArray(result) && result.every(b => b.ownerId === landlord.id && Array.isArray(b.rooms))) {
            console.log("✅ getLandlordListings returned correct data.");
        } else {
            console.error("❌ getLandlordListings verification failed.", { landlordId: landlord.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getLandlordListings:", error);
        hasError = true;
    }
    
    // --- Verify getTenantBookings ---
    try {
        console.log("\nVerifying getTenantBookings...");
        const tenant = mockUsers.find(u => u.role === 'tenant');
        if (!tenant) throw new Error("No tenant found in mock data for tenant bookings check.");

        const result = await callFunction('getTenantBookings', tenant.id) as WithId<Booking>[];
        if (result.length > 0 && result.every(b => (b as any).userId === tenant.id)) {
            console.log("✅ getTenantBookings returned correct data.");
        } else {
            console.error("❌ getTenantBookings verification failed.", { tenantId: tenant.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getTenantBookings:", error);
        hasError = true;
    }
    
    // --- Verify getLandlordBookings ---
    try {
        console.log("\nVerifying getLandlordBookings...");
        const landlord = mockUsers.find(u => u.role === 'landlord');
        if (!landlord) throw new Error("No landlord found in mock data");
        const result = await callFunction('getLandlordBookings', landlord.id) as { bookings: WithId<Booking>[], tenants: Record<string, User> };
        if (result && Array.isArray(result.bookings) && typeof result.tenants === 'object') {
            console.log("✅ getLandlordBookings returned correct data format.");
        } else {
            console.error("❌ getLandlordBookings verification failed.", { landlordId: landlord.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getLandlordBookings:", error);
        hasError = true;
    }

    // --- Verify getBookingDetails ---
    try {
        console.log("\nVerifying getBookingDetails...");
        const targetBooking = mockBookings[0];
        const result = await callFunction('getBookingDetails', targetBooking.id) as { booking: WithId<Booking>, building: WithId<Building>, room: WithId<Room>, tenant: WithId<User>, landlord: WithId<User> };
        if (result && result.booking && result.booking.id === targetBooking.id && result.building && result.room && result.tenant && result.landlord) {
            console.log("✅ getBookingDetails returned correct data.");
        } else {
            console.error("❌ getBookingDetails verification failed.", { bookingId: targetBooking.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getBookingDetails:", error);
        hasError = true;
    }
    
    // --- Verify getNewBookingPageData ---
     try {
        console.log("\nVerifying getNewBookingPageData...");
        const targetRoom = mockRooms[0];
        const result = await callFunction('getNewBookingPageData', { buildingId: targetRoom.buildingId, roomId: targetRoom.id }) as { building: WithId<Building>, room: WithId<Room> };
        if (result && result.building && result.room && result.building.id === targetRoom.buildingId && result.room.id === targetRoom.id) {
            console.log("✅ getNewBookingPageData returned correct data.");
        } else {
            console.error("❌ getNewBookingPageData verification failed.", { buildingId: targetRoom.buildingId, roomId: targetRoom.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getNewBookingPageData:", error);
        hasError = true;
    }

    // --- Verify getConversationsForUser ---
    try {
        console.log("\nVerifying getConversationsForUser...");
        const targetUser = mockUsers[0]; // A user that has conversations
        const result = await callFunction('getConversationsForUser', targetUser.id) as { conversations: WithId<Conversation>[], participants: Record<string, User> };
        if (result && Array.isArray(result.conversations) && typeof result.participants === 'object') {
            console.log("✅ getConversationsForUser returned correct data format.");
        } else {
            console.error("❌ getConversationsForUser verification failed.", { userId: targetUser.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getConversationsForUser:", error);
        hasError = true;
    }

    // --- Verify getMessagesForConversation ---
    try {
        console.log("\nVerifying getMessagesForConversation...");
        const targetConversation = mockConversations[0];
        const result = await callFunction('getMessagesForConversation', targetConversation.id) as WithId<Message>[];
        if (Array.isArray(result) && result.every(m => m.conversationId === targetConversation.id)) {
            console.log("✅ getMessagesForConversation returned correct data.");
        } else {
            console.error("❌ getMessagesForConversation verification failed.", { conversationId: targetConversation.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getMessagesForConversation:", error);
        hasError = true;
    }

    // --- Verify getUserTransactions ---
    try {
        console.log("\nVerifying getUserTransactions...");
        const targetUser = mockUsers[0];
        const result = await callFunction('getUserTransactions', targetUser.id) as WithId<Transaction>[];
        if (Array.isArray(result) && result.every(t => t.userId === targetUser.id)) {
            console.log("✅ getUserTransactions returned correct data.");
        } else {
            console.error("❌ getUserTransactions verification failed.", { userId: targetUser.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getUserTransactions:", error);
        hasError = true;
    }
    
    // --- Verify getNotificationsForUser ---
    try {
        console.log("\nVerifying getNotificationsForUser...");
        const targetUser = mockUsers[0];
        const result = await callFunction('getNotificationsForUser', targetUser.id) as WithId<Notification>[];
        if (Array.isArray(result) && result.every(n => n.userId === targetUser.id)) {
            console.log("✅ getNotificationsForUser returned correct data.");
        } else {
            console.error("❌ getNotificationsForUser verification failed.", { userId: targetUser.id, got: result });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getNotificationsForUser:", error);
        hasError = true;
    }

    // --- Verify getUserBalance ---
    try {
        console.log("\nVerifying getUserBalance...");
        const targetUser = mockUsers[0];
        const balance = await callFunction('getUserBalance', targetUser.id) as number;

        if (typeof balance === 'number') {
            console.log(`✅ getUserBalance returned a balance of: ${balance}`);
        } else {
            console.error("❌ getUserBalance verification failed. Expected a number, got:", balance);
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying getUserBalance:", error);
        hasError = true;
    }

    if (hasError) {
        console.error("\n--- Firebase Function verification failed with errors. ---");
        process.exit(1);
    } else {
        console.log("\n--- All read-only Firebase Function verifications passed! ---");
    }
}

verifyFunctions().catch(err => {
    console.error("An unexpected error occurred during verification:", err);
    process.exit(1);
});
