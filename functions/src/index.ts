
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import "dotenv/config";
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

import * as dataService from "./data-service";

// A wrapper to add basic error handling and CORS for HTTP request functions
const onRequest = <T, R>(
  handler: (data: T) => Promise<R>
) => {
  return functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        // Assuming the actual data is in the `data` property of the body
        const result = await handler(req.body.data);
        res.status(200).json({ data: result });
      } catch (error) {
        const logger = functions.logger;
        logger.error("Unhandled error in onRequest function:", error);

        if (error instanceof functions.https.HttpsError) {
          res.status(error.httpErrorCode.status).json({
            error: {
              message: error.message,
              details: error.details,
              status: error.code,
            },
          });
        } else {
          const message = error instanceof Error ? error.message : "Unknown error";
          res.status(500).json({
            error: {
              message: "An unexpected error occurred.",
              details: { originalMessage: message },
              status: "INTERNAL",
            },
          });
        }
      }
    });
  });
};

// --- READ FUNCTIONS ---
export const getUserById = onRequest(dataService.getUserById);
export const getBuildingsWithRooms = onRequest(dataService.getBuildingsWithRooms);
export const getLandlordListings = onRequest(dataService.getLandlordListings);
export const getBuildingById = onRequest(dataService.getBuildingById);
export const getRoomById = onRequest(dataService.getRoomById);
export const getTenantBookings = onRequest(dataService.getTenantBookings);
export const getLandlordBookings = onRequest(dataService.getLandlordBookings);
export const getBookingDetails = onRequest(dataService.getBookingDetails);
export const getNewBookingPageData = onRequest(async (data: { buildingId: string, roomId: string }) => ({
  building: await dataService.getBuildingById(data.buildingId),
  room: await dataService.getRoomById(data.roomId),
}));
export const getConversationsForUser = onRequest(dataService.getConversationsForUser);
export const getMessagesForConversation = onRequest(dataService.getMessagesForConversation);
export const getUserTransactions = onRequest(dataService.getUserTransactions);
export const getUserBalance = onRequest(dataService.getUserBalance);
export const getNotificationsForUser = onRequest(dataService.getNotificationsForUser);

// --- WRITE FUNCTIONS ---
export const createOrUpdateBuilding = onRequest((data: { buildingData: any, ownerId: string }) => dataService.createOrUpdateBuilding(data.buildingData, data.ownerId));
export const createOrUpdateRoom = onRequest((data: { roomData: any, buildingId: string, ownerId: string }) => dataService.createOrUpdateRoom(data.roomData, data.buildingId, data.ownerId));
export const confirmBooking = onRequest(dataService.confirmBooking);
export const approveBooking = onRequest(dataService.approveBooking);
export const declineBooking = onRequest(dataService.declineBooking);
export const cancelBooking = onRequest(dataService.cancelBooking);
export const sendMessage = onRequest((data: { conversationId: string, senderId: string, text: string }) => dataService.sendMessage(data.conversationId, data.senderId, data.text));
export const updateUserProfile = onRequest((data: { userId: string, profileData: any }) => dataService.updateUserProfile(data.userId, data.profileData));
export const initiateTopUp = onRequest((data: { userId: string, amount: number, paymentMethodType: any, channelCode: any }) => dataService.initiateTopUp(data.userId, data.amount, data.paymentMethodType, data.channelCode));
export const completeTopUpTransaction = onRequest((data: { userId: string, amount: number }) => dataService.completeTopUpTransaction(data.userId, data.amount));
export const createWithdrawalTransaction = onRequest((data: { userId: string, amount: number }) => dataService.createWithdrawalTransaction(data.userId, data.amount));
export const markNotificationAsRead = onRequest((data: { userId: string, notificationId: string }) => dataService.markNotificationAsRead(data.userId, data.notificationId));

