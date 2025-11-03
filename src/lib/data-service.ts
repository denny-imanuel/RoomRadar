
import { firebaseConfig } from '@/firebase/config';
import { Building, Room, Booking, Conversation, Message, Transaction, Notification, WithId, User } from './types';

const projectId = firebaseConfig.projectId;
const region = 'us-central1';

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
        const errorJson = await response.json();
        console.error(`Function ${functionName} failed with status ${response.status}:`, errorJson.error);
        throw new Error(errorJson.error.message || `Function ${functionName} failed`);
    }

    const jsonResponse = await response.json();
    // The `onRequest` wrapper returns data in a `data` property.
    // The original `onCall` wrapper returned it in `result`.
    // We check for both to be safe.
    return jsonResponse.data ?? jsonResponse.result;
}

// To pass a single primitive value to an onRequest function, you must wrap it in an object
// because the function expects `req.body.data` to be an object.

export const getUserById = (id: string): Promise<WithId<User> | undefined> => callFunction('getUserById', id);
export const getBuildingById = (id: string): Promise<WithId<Building> | undefined> => callFunction('getBuildingById', id);
export const getRoomById = (id: string): Promise<WithId<Room> | undefined> => callFunction('getRoomById', id);
export const getRoomsByBuildingId = (buildingId: string): Promise<WithId<Room>[]> => callFunction('getRoomsByBuildingId', buildingId);
export const getBuildingsWithRooms = (): Promise<(WithId<Building> & { rooms: WithId<Room>[] })[]> => callFunction('getBuildingsWithRooms', {});
export const getLandlordListings = (ownerId: string): Promise<(WithId<Building> & { rooms: WithId<Room>[] })[]> => callFunction('getLandlordListings', ownerId);
export const getBookingById = (id: string): Promise<WithId<Booking> | undefined> => callFunction('getBookingById', id);
export const getBookingDetails = (bookingId: string) => callFunction('getBookingDetails', bookingId);
export const getTenantBookings = (userId: string): Promise<WithId<Booking>[]> => callFunction('getTenantBookings', userId);
export const getLandlordBookings = (landlordId: string) => callFunction('getLandlordBookings', landlordId);
export const getConversationsForUser = (userId: string) => callFunction('getConversationsForUser', userId);
export const getMessagesForConversation = (conversationId: string): Promise<WithId<Message>[]> => callFunction('getMessagesForConversation', conversationId);
export const getUserTransactions = (userId: string): Promise<WithId<Transaction>[]> => callFunction('getUserTransactions', userId);
export const getUserBalance = (userId: string): Promise<number> => callFunction('getUserBalance', userId);
export const getNotificationsForUser = (userId: string): Promise<WithId<Notification>[]> => callFunction('getNotificationsForUser', userId);

// Write operations
export const createOrUpdateBuilding = (buildingData: Partial<Building>, ownerId: string): Promise<WithId<Building>> => callFunction('createOrUpdateBuilding', { buildingData, ownerId });
export const createOrUpdateRoom = (roomData: Partial<Room>, buildingId: string, ownerId: string): Promise<WithId<Room>> => callFunction('createOrUpdateRoom', { roomData, buildingId, ownerId });
export const confirmBooking = (bookingDetails: any) => callFunction('confirmBooking', bookingDetails);
export const approveBooking = (bookingId: string): Promise<WithId<Booking>> => callFunction('approveBooking', bookingId);
export const declineBooking = (bookingId: string): Promise<WithId<Booking>> => callFunction('declineBooking', bookingId);
export const cancelBooking = (bookingId: string): Promise<WithId<Booking>> => callFunction('cancelBooking', bookingId);
export const updateUserProfile = (userId: string, profileData: Partial<User>): Promise<WithId<User>> => callFunction('updateUserProfile', { userId, profileData });
export const sendMessage = (conversationId: string, senderId: string, text: string): Promise<WithId<Message>> => callFunction('sendMessage', { conversationId, senderId, text });
export const initiateTopUp = (userId: string, amount: number, paymentMethodType: any, channelCode: string) => callFunction('initiateTopUp', { userId, amount, paymentMethodType, channelCode });
export const completeTopUpTransaction = (userId: string, amount: number): Promise<WithId<Transaction>> => callFunction('completeTopUpTransaction', { userId, amount });
export const createWithdrawalTransaction = (userId: string, amount: number): Promise<WithId<Transaction>> => callFunction('createWithdrawalTransaction', { userId, amount });
export const markNotificationAsRead = (userId: string, notificationId: string): Promise<WithId<Notification>> => callFunction('markNotificationAsRead', { userId, notificationId });
