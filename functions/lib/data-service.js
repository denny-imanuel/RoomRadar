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
exports.getUserById = getUserById;
exports.getBuildingById = getBuildingById;
exports.getRoomById = getRoomById;
exports.getRoomsByBuildingId = getRoomsByBuildingId;
exports.getBuildingsWithRooms = getBuildingsWithRooms;
exports.getLandlordListings = getLandlordListings;
exports.getBookingById = getBookingById;
exports.getBookingDetails = getBookingDetails;
exports.getTenantBookings = getTenantBookings;
exports.getLandlordBookings = getLandlordBookings;
exports.getConversationsForUser = getConversationsForUser;
exports.getMessagesForConversation = getMessagesForConversation;
exports.getUserTransactions = getUserTransactions;
exports.getUserBalance = getUserBalance;
exports.getNotificationsForUser = getNotificationsForUser;
exports.calculateBookingCosts = calculateBookingCosts;
exports.createOrUpdateBuilding = createOrUpdateBuilding;
exports.createOrUpdateRoom = createOrUpdateRoom;
exports.confirmBooking = confirmBooking;
exports.approveBooking = approveBooking;
exports.declineBooking = declineBooking;
exports.cancelBooking = cancelBooking;
exports.updateUserProfile = updateUserProfile;
exports.sendMessage = sendMessage;
exports.initiateTopUp = initiateTopUp;
exports.completeTopUpTransaction = completeTopUpTransaction;
exports.createWithdrawalTransaction = createWithdrawalTransaction;
exports.markNotificationAsRead = markNotificationAsRead;
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
const xendit_service_1 = require("./xendit-service");
const db = admin.firestore();
// --- READ OPERATIONS ---
async function getUserById(id) {
    const doc = await db.collection("users").doc(id).get();
    return doc.exists ? Object.assign({ id: doc.id }, doc.data()) : undefined;
}
async function getBuildingById(id) {
    const doc = await db.collection("buildings").doc(id).get();
    return doc.exists ? Object.assign({ id: doc.id }, doc.data()) : undefined;
}
async function getRoomById(id) {
    const doc = await db.collection("rooms").doc(id).get();
    return doc.exists ? Object.assign({ id: doc.id }, doc.data()) : undefined;
}
async function getRoomsByBuildingId(buildingId) {
    const snapshot = await db.collection("rooms").where("buildingId", "==", buildingId).get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
}
async function getBuildingsWithRooms() {
    const buildingsSnapshot = await db.collection("buildings").get();
    const buildings = buildingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const roomsSnapshot = await db.collection("rooms").get();
    const allRooms = roomsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return buildings.map((building) => (Object.assign(Object.assign({}, building), { rooms: allRooms.filter((room) => room.buildingId === building.id) })));
}
async function getLandlordListings(ownerId) {
    const buildingsSnapshot = await db.collection("buildings").where("ownerId", "==", ownerId).get();
    const buildings = buildingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    if (buildings.length === 0)
        return [];
    const buildingIds = buildings.map((b) => b.id);
    const roomsSnapshot = await db.collection("rooms").where("buildingId", "in", buildingIds).get();
    const allRooms = roomsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return buildings.map((building) => (Object.assign(Object.assign({}, building), { rooms: allRooms.filter((room) => room.buildingId === building.id) })));
}
async function getBookingById(id) {
    const doc = await db.collection("bookings").doc(id).get();
    return doc.exists ? Object.assign({ id: doc.id }, doc.data()) : undefined;
}
async function getBookingDetails(bookingId) {
    const booking = await getBookingById(bookingId);
    if (!booking)
        return null;
    const building = await getBuildingById(booking.buildingId);
    const room = await getRoomById(booking.roomId);
    const tenant = await getUserById(booking.userId);
    if (!building || !room || !tenant)
        return null;
    const landlord = await getUserById(building.ownerId);
    if (!landlord)
        return null;
    return { booking, building, room, tenant, landlord };
}
async function getTenantBookings(userId) {
    const snapshot = await db.collection("bookings").where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
}
async function getLandlordBookings(landlordId) {
    const buildingsSnapshot = await db.collection("buildings").where("ownerId", "==", landlordId).get();
    if (buildingsSnapshot.empty) {
        return { bookings: [], tenants: {} };
    }
    const buildingIds = buildingsSnapshot.docs.map((doc) => doc.id);
    const bookingsSnapshot = await db.collection("bookings").where("buildingId", "in", buildingIds).get();
    const bookings = bookingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    if (bookings.length === 0) {
        return { bookings: [], tenants: {} };
    }
    const tenantIds = [...new Set(bookings.map((b) => b.userId))];
    const tenants = {};
    const tenantDocs = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", tenantIds).get();
    tenantDocs.forEach((doc) => {
        tenants[doc.id] = doc.data();
    });
    return { bookings, tenants };
}
async function getConversationsForUser(userId) {
    const snapshot = await db.collection("conversations").where("participants", "array-contains", userId).get();
    const conversations = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    if (conversations.length === 0) {
        return { conversations: [], participants: {} };
    }
    const allParticipantIds = conversations.flatMap((c) => c.participants);
    const uniqueIds = [...new Set(allParticipantIds)];
    const participants = {};
    const userDocs = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", uniqueIds).get();
    userDocs.forEach((doc) => {
        participants[doc.id] = doc.data();
    });
    return { conversations, participants };
}
async function getMessagesForConversation(conversationId) {
    const snapshot = await db.collection("messages").where("conversationId", "==", conversationId).orderBy("timestamp", "asc").get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
}
async function getUserTransactions(userId) {
    const snapshot = await db.collection("transactions").where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
}
async function getUserBalance(userId) {
    const snapshot = await db.collection("transactions").where("userId", "==", userId).where("status", "==", "Completed").get();
    const transactions = snapshot.docs.map((doc) => doc.data());
    return transactions.reduce((acc, txn) => {
        switch (txn.type) {
            case "Top-up":
            case "Payout":
                return acc + txn.amount;
            case "Withdrawal":
            case "Rent Payment":
            case "Cancellation Fee":
                return acc - txn.amount;
            default:
                return acc;
        }
    }, 0);
}
async function getNotificationsForUser(userId) {
    const snapshot = await db.collection("notifications").where("userId", "==", userId).orderBy("date", "desc").get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
}
// --- WRITE OPERATIONS ---
function calculateBookingCosts(room, date) {
    const getDays = () => {
        if ((date === null || date === void 0 ? void 0 : date.from) && (date === null || date === void 0 ? void 0 : date.to)) {
            return Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        return 0;
    };
    const calculateRentalPrice = () => {
        const days = getDays();
        if (days <= 0)
            return 0;
        const pricePerDay = room.priceDaily || (room.priceMonthly || 0) / 30;
        return days * pricePerDay;
    };
    const calculateDeposit = () => {
        const days = getDays();
        if (days <= 0)
            return 0;
        if (days >= 28 && room.depositMonthly)
            return room.depositMonthly;
        if (days >= 7 && room.depositWeekly)
            return room.depositWeekly;
        if (room.depositDaily)
            return room.depositDaily;
        if (room.depositMonthly)
            return room.depositMonthly;
        return 0;
    };
    const days = getDays();
    const rentalPrice = calculateRentalPrice();
    const deposit = calculateDeposit();
    const platformFee = rentalPrice * 0.20;
    const totalBookingAmount = rentalPrice + deposit + platformFee;
    return { days, rentalPrice, deposit, platformFee, totalBookingAmount };
}
async function createOrUpdateBuilding(buildingData, ownerId) {
    const collectionRef = db.collection("buildings");
    if (buildingData.id) {
        const docRef = collectionRef.doc(buildingData.id);
        await docRef.update(Object.assign(Object.assign({}, buildingData), { ownerId }));
        const updatedDoc = await docRef.get();
        return Object.assign({ id: updatedDoc.id }, updatedDoc.data());
    }
    else {
        const docRef = await collectionRef.add(Object.assign(Object.assign({}, buildingData), { ownerId }));
        const newDoc = await docRef.get();
        return Object.assign({ id: newDoc.id }, newDoc.data());
    }
}
async function createOrUpdateRoom(roomData, buildingId, ownerId) {
    var _a;
    const collectionRef = db.collection("rooms");
    const submissionData = Object.assign(Object.assign({}, roomData), { buildingId,
        ownerId, bookedDates: (_a = roomData.bookedDates) === null || _a === void 0 ? void 0 : _a.map((range) => ({
            from: (0, date_fns_1.format)(new Date(range.from), "yyyy-MM-dd"),
            to: range.to ? (0, date_fns_1.format)(new Date(range.to), "yyyy-MM-dd") : undefined,
        })) });
    if (roomData.id) {
        const docRef = collectionRef.doc(roomData.id);
        await docRef.update(submissionData);
        const updatedDoc = await docRef.get();
        return Object.assign({ id: updatedDoc.id }, updatedDoc.data());
    }
    else {
        const docRef = await collectionRef.add(submissionData);
        const newDoc = await docRef.get();
        return Object.assign({ id: newDoc.id }, newDoc.data());
    }
}
async function confirmBooking(bookingDetails) {
    const batch = db.batch();
    const room = await getRoomById(bookingDetails.roomId);
    const building = await getBuildingById(bookingDetails.buildingId);
    const tenant = await getUserById(bookingDetails.userId);
    if (!room || !building || !tenant)
        throw new Error("Invalid booking details.");
    const bookingRef = db.collection("bookings").doc();
    const newBooking = Object.assign(Object.assign({}, bookingDetails), { buildingName: building.name, roomName: room.name, buildingAddress: building.address, imageUrl: building.images[0] || "", status: "pending" });
    batch.set(bookingRef, newBooking);
    const transactionRef = db.collection("transactions").doc();
    const newTransaction = {
        userId: bookingDetails.userId,
        bookingId: bookingRef.id,
        type: "Rent Payment",
        amount: bookingDetails.totalPrice,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
    };
    batch.set(transactionRef, newTransaction);
    const landlordNotificationRef = db.collection("notifications").doc();
    const landlordNotification = {
        userId: building.ownerId,
        type: "new_booking",
        message: `${tenant.name} has requested to book "${room.name}" in ${building.name}.`,
        link: "/bookings",
        read: false,
        date: new Date().toISOString(),
    };
    batch.set(landlordNotificationRef, landlordNotification);
    await batch.commit();
    return Object.assign({ id: bookingRef.id }, newBooking);
}
async function approveBooking(bookingId) {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const transactionSnapshot = await db.collection("transactions").where("bookingId", "==", bookingId).where("status", "==", "pending").limit(1).get();
    if (transactionSnapshot.empty) {
        throw new Error("Pending transaction for this booking not found");
    }
    const transactionDoc = transactionSnapshot.docs[0];
    const booking = await getBookingById(bookingId);
    if (!booking || booking.status !== "pending") {
        throw new Error("Booking not found or is not in a pending state.");
    }
    const building = await getBuildingById(booking.buildingId);
    if (!building)
        throw new Error("Building not found.");
    const batch = db.batch();
    batch.update(bookingRef, { status: "confirmed" });
    batch.update(transactionDoc.ref, { status: "Completed" });
    const payoutRef = db.collection("transactions").doc();
    const landlordPayout = {
        userId: building.ownerId,
        bookingId: booking.id,
        type: "Payout",
        amount: booking.totalPrice,
        date: new Date().toISOString().split("T")[0],
        status: "Completed",
    };
    batch.set(payoutRef, landlordPayout);
    await batch.commit();
    booking.status = "confirmed";
    return booking;
}
async function declineBooking(bookingId) {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const transactionSnapshot = await db.collection("transactions").where("bookingId", "==", bookingId).where("status", "==", "pending").limit(1).get();
    const booking = await getBookingById(bookingId);
    if (!booking || booking.status !== "pending") {
        throw new Error("Booking not found or is not in a pending state.");
    }
    const batch = db.batch();
    batch.update(bookingRef, { status: "declined" });
    if (!transactionSnapshot.empty) {
        batch.update(transactionSnapshot.docs[0].ref, { status: "Failed" });
    }
    await batch.commit();
    booking.status = "declined";
    return booking;
}
async function cancelBooking(bookingId) {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const transactionSnapshot = await db.collection("transactions").where("bookingId", "==", bookingId).where("status", "==", "pending").limit(1).get();
    const booking = await getBookingById(bookingId);
    if (!booking || booking.status !== "pending") {
        throw new Error("Booking not found or is not in a pending state.");
    }
    const room = await getRoomById(booking.roomId);
    if (!room)
        throw new Error("Room not found.");
    const batch = db.batch();
    batch.update(bookingRef, { status: "cancelled" });
    if (!transactionSnapshot.empty) {
        const transactionDoc = transactionSnapshot.docs[0];
        batch.update(transactionDoc.ref, { status: "Failed" });
        const days = (0, date_fns_1.differenceInCalendarDays)(new Date(booking.checkOut), new Date(booking.checkIn)) + 1;
        const calculateDeposit = () => {
            if (days >= 28 && room.depositMonthly)
                return room.depositMonthly;
            if (days >= 7 && room.depositWeekly)
                return room.depositWeekly;
            if (room.depositDaily)
                return room.depositDaily;
            return room.depositMonthly || 0;
        };
        const heldAmount = transactionDoc.data().amount;
        const rentalPrice = heldAmount / 1.2;
        const platformFee = rentalPrice * 0.20;
        const deposit = calculateDeposit();
        const cancellationFee = platformFee + deposit;
        const feeRef = db.collection("transactions").doc();
        const feeTransaction = {
            userId: booking.userId,
            bookingId: booking.id,
            type: "Cancellation Fee",
            amount: cancellationFee,
            date: new Date().toISOString().split("T")[0],
            status: "Completed",
        };
        batch.set(feeRef, feeTransaction);
    }
    await batch.commit();
    booking.status = "cancelled";
    return booking;
}
async function updateUserProfile(userId, profileData) {
    const userRef = db.collection("users").doc(userId);
    await userRef.update(profileData);
    const updatedUser = await getUserById(userId);
    if (!updatedUser)
        throw new Error("User not found after update.");
    return updatedUser;
}
async function sendMessage(conversationId, senderId, text) {
    const batch = db.batch();
    const messageRef = db.collection("messages").doc();
    // This object is for writing to Firestore and uses the server timestamp
    const newMessageForDb = {
        conversationId,
        senderId,
        text,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(messageRef, newMessageForDb);
    const conversationRef = db.collection("conversations").doc(conversationId);
    batch.update(conversationRef, {
        lastMessage: {
            text,
            senderId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
    });
    await batch.commit();
    // This object is returned to the client and uses a client-friendly ISO string
    const optimisticMessage = {
        id: messageRef.id,
        conversationId,
        senderId,
        text,
        timestamp: new Date().toISOString(),
    };
    return optimisticMessage;
}
async function initiateTopUp(userId, amount, paymentMethodType, channelCode) {
    const xenditPayment = await (0, xendit_service_1.createXenditPayment)(amount * 15000, "IDR", "ID", channelCode, paymentMethodType);
    if (!xenditPayment.actions || xenditPayment.actions.length === 0) {
        return { type: "SUCCESS" };
    }
    const paymentAction = xenditPayment.actions[0]; // Use 'as any' to bypass strict TS checks for this dynamic object
    if (paymentMethodType === "VIRTUAL_ACCOUNT" && (paymentAction === null || paymentAction === void 0 ? void 0 : paymentAction.virtual_account_number)) {
        return { type: "VA", vaNumber: paymentAction.virtual_account_number };
    }
    if (paymentMethodType === "EWALLET" && (paymentAction === null || paymentAction === void 0 ? void 0 : paymentAction.qr_code)) {
        return { type: "EWALLET", qrCodeUrl: paymentAction.qr_code };
    }
    if (paymentMethodType === "OTC" && (paymentAction === null || paymentAction === void 0 ? void 0 : paymentAction.payment_code)) {
        return { type: "OTC", paymentCode: paymentAction.payment_code };
    }
    return { type: "SUCCESS" };
}
async function completeTopUpTransaction(userId, amount) {
    const batch = db.batch();
    const transactionRef = db.collection("transactions").doc();
    const newTransaction = {
        userId,
        type: "Top-up",
        amount,
        date: new Date().toISOString().split("T")[0],
        status: "Completed",
    };
    batch.set(transactionRef, newTransaction);
    const notificationRef = db.collection("notifications").doc();
    const notification = {
        userId,
        type: "top_up_success",
        message: `You successfully topped up your wallet with $${amount.toFixed(2)}.`,
        link: "/wallet",
        read: false,
        date: new Date().toISOString(),
    };
    batch.set(notificationRef, notification);
    await batch.commit();
    return Object.assign({ id: transactionRef.id }, newTransaction);
}
async function createWithdrawalTransaction(userId, amount) {
    // Call Xendit service to create the payout
    try {
        const channelCode = 'ID_BCA';
        const channelProperties = {
            account_holder_name: 'Mock User',
            account_number: '1234567890'
        };
        await (0, xendit_service_1.createXenditPayout)(amount * 15000, channelCode, channelProperties);
    }
    catch (error) {
        console.error('Failed to initiate Xendit withdrawal.', error);
        throw new Error('Withdrawal service is currently unavailable.');
    }
    const batch = db.batch();
    const transactionRef = db.collection("transactions").doc();
    const newTransaction = {
        userId,
        type: 'Withdrawal',
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
    };
    batch.set(transactionRef, newTransaction);
    const notificationRef = db.collection("notifications").doc();
    const notification = {
        userId,
        type: 'withdrawal_success',
        message: `You successfully withdrew $${amount.toFixed(2)} from your wallet.`,
        link: '/wallet',
        read: false,
        date: new Date().toISOString(),
    };
    batch.set(notificationRef, notification);
    await batch.commit();
    return Object.assign({ id: transactionRef.id }, newTransaction);
}
async function markNotificationAsRead(userId, notificationId) {
    const notificationRef = db.collection("notifications").doc(notificationId);
    await notificationRef.update({ read: true });
    const doc = await notificationRef.get();
    return Object.assign({ id: doc.id }, doc.data());
}
//# sourceMappingURL=data-service.js.map