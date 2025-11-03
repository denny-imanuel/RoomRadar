
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import "dotenv/config";

admin.initializeApp();

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
export const getNewBookingPageData = onCall(async ({ buildingId, roomId }) => ({
  building: await dataService.getBuildingById(buildingId),
  room: await dataService.getRoomById(roomId),
}));
export const getConversationsForUser = onCall(dataService.getConversationsForUser);
export const getMessagesForConversation = onCall(dataService.getMessagesForConversation);
export const getUserTransactions = onCall(dataService.getUserTransactions);
export const getUserBalance = onCall(dataService.getUserBalance);
export const getNotificationsForUser = onCall(dataService.getNotificationsForUser);

// --- WRITE FUNCTIONS ---
export const createOrUpdateBuilding = onCall(({ buildingData, ownerId }) => dataService.createOrUpdateBuilding(buildingData, ownerId));
export const createOrUpdateRoom = onCall(({ roomData, buildingId, ownerId }) => dataService.createOrUpdateRoom(roomData, buildingId, ownerId));
export const confirmBooking = onCall(dataService.confirmBooking);
export const approveBooking = onCall(dataService.approveBooking);
export const declineBooking = onCall(dataService.declineBooking);
export const cancelBooking = onCall(dataService.cancelBooking);
export const sendMessage = onCall(({ conversationId, senderId, text }) => dataService.sendMessage(conversationId, senderId, text));
export const updateUserProfile = onCall(({ userId, profileData }) => dataService.updateUserProfile(userId, profileData));
export const initiateTopUp = onCall(({ userId, amount, paymentMethodType, channelCode }) => dataService.initiateTopUp(userId, amount, paymentMethodType, channelCode));
export const completeTopUpTransaction = onCall(({ userId, amount }) => dataService.completeTopUpTransaction(userId, amount));
export const createWithdrawalTransaction = onCall(({ userId, amount }) => dataService.createWithdrawalTransaction(userId, amount));
export const markNotificationAsRead = onCall(({ userId, notificationId }) => dataService.markNotificationAsRead(userId, notificationId));
