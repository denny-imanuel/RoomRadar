
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import "dotenv/config";

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

import * as dataService from "./data-service";

// A wrapper to add basic error handling for callable functions
const onCall = <T, R>(handler: (data: T, context: functions.https.CallableContext) => Promise<R>) => {
  return functions.https.onCall(async (data: T, context) => {
    try {
      return await handler(data, context);
    } catch (error) {
      const logger = functions.logger;
      logger.error("Unhandled error in callable function:", error);

      // Handle specific error types if needed
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      // Re-throw other errors as internal
      throw new functions.https.HttpsError("internal", "An unexpected error occurred.", {
        originalMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
};

// --- READ FUNCTIONS ---
export const getUserById = onCall(dataService.getUserById);
export const getBuildingsWithRooms = onCall(dataService.getBuildingsWithRooms);
export const getLandlordListings = onCall(dataService.getLandlordListings);
export const getBuildingById = onCall(dataService.getBuildingById);
export const getRoomById = onCall(dataService.getRoomById);
export const getTenantBookings = onCall(dataService.getTenantBookings);
export const getLandlordBookings = onCall(dataService.getLandlordBookings);
export const getBookingDetails = onCall(dataService.getBookingDetails);
export const getNewBookingPageData = onCall(async (data: { buildingId: string, roomId: string }) => ({
  building: await dataService.getBuildingById(data.buildingId),
  room: await dataService.getRoomById(data.roomId),
}));
export const getConversationsForUser = onCall(dataService.getConversationsForUser);
export const getMessagesForConversation = onCall(dataService.getMessagesForConversation);
export const getUserTransactions = onCall(dataService.getUserTransactions);
export const getUserBalance = onCall(dataService.getUserBalance);
export const getNotificationsForUser = onCall(dataService.getNotificationsForUser);

// --- WRITE FUNCTIONS ---
export const createOrUpdateBuilding = onCall((data: { buildingData: any, ownerId: string }) => dataService.createOrUpdateBuilding(data.buildingData, data.ownerId));
export const createOrUpdateRoom = onCall((data: { roomData: any, buildingId: string, ownerId: string }) => dataService.createOrUpdateRoom(data.roomData, data.buildingId, data.ownerId));
export const confirmBooking = onCall(dataService.confirmBooking);
export const approveBooking = onCall(dataService.approveBooking);
export const declineBooking = onCall(dataService.declineBooking);
export const cancelBooking = onCall(dataService.cancelBooking);
export const sendMessage = onCall((data: { conversationId: string, senderId: string, text: string }) => dataService.sendMessage(data.conversationId, data.senderId, data.text));
export const updateUserProfile = onCall((data: { userId: string, profileData: any }) => dataService.updateUserProfile(data.userId, data.profileData));
export const initiateTopUp = onCall((data: { userId: string, amount: number, paymentMethodType: any, channelCode: any }) => dataService.initiateTopUp(data.userId, data.amount, data.paymentMethodType, data.channelCode));
export const completeTopUpTransaction = onCall((data: { userId: string, amount: number }) => dataService.completeTopUpTransaction(data.userId, data.amount));
export const createWithdrawalTransaction = onCall((data: { userId: string, amount: number }) => dataService.createWithdrawalTransaction(data.userId, data.amount));
export const markNotificationAsRead = onCall((data: { userId: string, notificationId: string }) => dataService.markNotificationAsRead(data.userId, data.notificationId));
