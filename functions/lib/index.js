"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationAsRead = exports.createWithdrawalTransaction = exports.completeTopUpTransaction = exports.initiateTopUp = exports.updateUserProfile = exports.sendMessage = exports.cancelBooking = exports.declineBooking = exports.approveBooking = exports.confirmBooking = exports.createOrUpdateRoom = exports.createOrUpdateBuilding = exports.getNotificationsForUser = exports.getUserBalance = exports.getUserTransactions = exports.getMessagesForConversation = exports.getConversationsForUser = exports.getNewBookingPageData = exports.getBookingDetails = exports.getLandlordBookings = exports.getTenantBookings = exports.getRoomById = exports.getBuildingById = exports.getLandlordListings = exports.getBuildingsWithRooms = exports.getUserById = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
require("dotenv/config");
admin.initializeApp();
const dataService = __importStar(require("./data-service"));
// A wrapper to add basic error handling for callable functions
const onCall = (handler) => {
    return functions.https.onCall(async (data, context) => {
        try {
            return await handler(data, context);
        }
        catch (error) {
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
exports.getUserById = onCall(dataService.getUserById);
exports.getBuildingsWithRooms = onCall(dataService.getBuildingsWithRooms);
exports.getLandlordListings = onCall(dataService.getLandlordListings);
exports.getBuildingById = onCall(dataService.getBuildingById);
exports.getRoomById = onCall(dataService.getRoomById);
exports.getTenantBookings = onCall(dataService.getTenantBookings);
exports.getLandlordBookings = onCall(dataService.getLandlordBookings);
exports.getBookingDetails = onCall(dataService.getBookingDetails);
exports.getNewBookingPageData = onCall(async (data) => ({
    building: await dataService.getBuildingById(data.buildingId),
    room: await dataService.getRoomById(data.roomId),
}));
exports.getConversationsForUser = onCall(dataService.getConversationsForUser);
exports.getMessagesForConversation = onCall(dataService.getMessagesForConversation);
exports.getUserTransactions = onCall(dataService.getUserTransactions);
exports.getUserBalance = onCall(dataService.getUserBalance);
exports.getNotificationsForUser = onCall(dataService.getNotificationsForUser);
// --- WRITE FUNCTIONS ---
exports.createOrUpdateBuilding = onCall((data) => dataService.createOrUpdateBuilding(data.buildingData, data.ownerId));
exports.createOrUpdateRoom = onCall((data) => dataService.createOrUpdateRoom(data.roomData, data.buildingId, data.ownerId));
exports.confirmBooking = onCall(dataService.confirmBooking);
exports.approveBooking = onCall(dataService.approveBooking);
exports.declineBooking = onCall(dataService.declineBooking);
exports.cancelBooking = onCall(dataService.cancelBooking);
exports.sendMessage = onCall((data) => dataService.sendMessage(data.conversationId, data.senderId, data.text));
exports.updateUserProfile = onCall((data) => dataService.updateUserProfile(data.userId, data.profileData));
exports.initiateTopUp = onCall((data) => dataService.initiateTopUp(data.userId, data.amount, data.paymentMethodType, data.channelCode));
exports.completeTopUpTransaction = onCall((data) => dataService.completeTopUpTransaction(data.userId, data.amount));
exports.createWithdrawalTransaction = onCall((data) => dataService.createWithdrawalTransaction(data.userId, data.amount));
exports.markNotificationAsRead = onCall((data) => dataService.markNotificationAsRead(data.userId, data.notificationId));
//# sourceMappingURL=index.js.map