
// To run this script, execute: `npm run verify:backend-writes`

import { firebaseConfig } from '@/firebase/config';
import { mockUsers } from '@/lib/placeholder-data';
import { User, Building, Room, WithId } from '../lib/types';

const projectId = firebaseConfig.projectId;
const region = 'us-central1';

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

async function verifyWriteFunctions() {
    console.log("--- Verifying Deployed Firebase Write Functions ---");

    const landlord = mockUsers.find(u => u.role === 'landlord');
    if (!landlord) throw new Error("No landlord found in mock data");

    let newBuildingId = '';

    // --- Verify createOrUpdateBuilding ---
    try {
        console.log("\nVerifying createOrUpdateBuilding (Create)...");
        const newBuildingData: Partial<Building> = {
            name: 'Test Building',
            address: '123 Test St',
            description: 'A building for testing',
            images: [],
            lat: 0,
            lng: 0,
            checkIn: '14:00',
            checkOut: '11:00',
        };
        
        const createdBuilding = await callFunction('createOrUpdateBuilding', { buildingData: newBuildingData, ownerId: landlord.id }) as WithId<Building>;
        newBuildingId = createdBuilding.id;

        if (createdBuilding && createdBuilding.id && createdBuilding.name === 'Test Building') {
            console.log(`✅ createOrUpdateBuilding (Create) successful. New building ID: ${createdBuilding.id}`);

            console.log("\nVerifying createOrUpdateBuilding (Update)...");
            const updatedBuildingData = { ...createdBuilding, name: 'Updated Test Building' };
            const updatedBuilding = await callFunction('createOrUpdateBuilding', { buildingData: updatedBuildingData, ownerId: landlord.id }) as WithId<Building>;

            if (updatedBuilding && updatedBuilding.name === 'Updated Test Building') {
                console.log('✅ createOrUpdateBuilding (Update) successful.');
            } else {
                console.error('❌ createOrUpdateBuilding (Update) verification failed.', { got: updatedBuilding });
                hasError = true;
            }
        } else {
            console.error('❌ createOrUpdateBuilding (Create) verification failed.', { got: createdBuilding });
            hasError = true;
        }
    } catch (error) {
        console.error("❌ Error verifying createOrUpdateBuilding:", error);
        hasError = true;
    }

    // --- Verify createOrUpdateRoom ---
    if (!newBuildingId) {
        console.error("\nSkipping createOrUpdateRoom verification because building creation failed.");
        hasError = true;
    } else {
        try {
            console.log("\nVerifying createOrUpdateRoom (Create)...");
            const newRoomData: Partial<Room> = {
                name: 'Test Room',
                price: 500,
                priceDaily: 100,
                amenities: ['wifi'],
                images: [],
                roomType: 'single',
                bookedDates: [],
            };

            const createdRoom = await callFunction('createOrUpdateRoom', { roomData: newRoomData, buildingId: newBuildingId, ownerId: landlord.id }) as WithId<Room>;

            if (createdRoom && createdRoom.id && createdRoom.name === 'Test Room') {
                console.log(`✅ createOrUpdateRoom (Create) successful. New room ID: ${createdRoom.id}`);

                console.log("\nVerifying createOrUpdateRoom (Update)...");
                const updatedRoomData = { ...createdRoom, name: 'Updated Test Room' };
                const updatedRoom = await callFunction('createOrUpdateRoom', { roomData: updatedRoomData, buildingId: newBuildingId, ownerId: landlord.id }) as WithId<Room>;

                if (updatedRoom && updatedRoom.name === 'Updated Test Room') {
                    console.log('✅ createOrUpdateRoom (Update) successful.');
                } else {
                    console.error('❌ createOrUpdateRoom (Update) verification failed.', { got: updatedRoom });
                    hasError = true;
                }
            } else {
                console.error('❌ createOrUpdateRoom (Create) verification failed.', { got: createdRoom });
                hasError = true;
            }
        } catch (error) {
            console.error("❌ Error verifying createOrUpdateRoom:", error);
            hasError = true;
        }
    }

    if (hasError) {
        console.error("\n--- Firebase Write Function verification failed with errors. ---");
        process.exit(1);
    } else {
        console.log("\n--- All tested Firebase Write Function verifications passed! ---");
    }
}

verifyWriteFunctions().catch(err => {
    console.error("An unexpected error occurred during verification:", err);
    process.exit(1);
});
