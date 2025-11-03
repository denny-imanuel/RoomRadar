
import * as admin from "firebase-admin";
import type {
  Booking,
  Building,
  Conversation,
  Message,
  Room,
  User,
  WithId,
  Transaction,
  Notification,
} from "./types";
import { differenceInCalendarDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { createXenditPayment, createXenditPayout, PaymentMethodType } from "./xendit-service";

const db = admin.firestore();

// --- READ OPERATIONS ---

export async function getUserById(id: string): Promise<WithId<User> | undefined> {
  const doc = await db.collection("users").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as WithId<User> : undefined;
}

export async function getBuildingById(id: string): Promise<WithId<Building> | undefined> {
  const doc = await db.collection("buildings").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as WithId<Building> : undefined;
}

export async function getRoomById(id: string): Promise<WithId<Room> | undefined> {
  const doc = await db.collection("rooms").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as WithId<Room> : undefined;
}

export async function getRoomsByBuildingId(buildingId: string): Promise<WithId<Room>[]> {
  const snapshot = await db.collection("rooms").where("buildingId", "==", buildingId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Room>));
}

export async function getBuildingsWithRooms(): Promise<(WithId<Building> & { rooms: WithId<Room>[] })[]> {
  const buildingsSnapshot = await db.collection("buildings").get();
  const buildings = buildingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Building>));

  const roomsSnapshot = await db.collection("rooms").get();
  const allRooms = roomsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Room>));

  return buildings.map((building) => ({
    ...building,
    rooms: allRooms.filter((room) => room.buildingId === building.id),
  }));
}

export async function getLandlordListings(ownerId: string): Promise<(WithId<Building> & { rooms: WithId<Room>[] })[]> {
  const buildingsSnapshot = await db.collection("buildings").where("ownerId", "==", ownerId).get();
  const buildings = buildingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Building>));
  if (buildings.length === 0) return [];

  const buildingIds = buildings.map((b) => b.id);
  const roomsSnapshot = await db.collection("rooms").where("buildingId", "in", buildingIds).get();
  const allRooms = roomsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Room>));

  return buildings.map((building) => ({
    ...building,
    rooms: allRooms.filter((room) => room.buildingId === building.id),
  }));
}

export async function getBookingById(id: string): Promise<WithId<Booking> | undefined> {
  const doc = await db.collection("bookings").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as WithId<Booking> : undefined;
}

export async function getBookingDetails(bookingId: string) {
    const booking = await getBookingById(bookingId);
    if (!booking) return null;

    const building = await getBuildingById(booking.buildingId);
    const room = await getRoomById(booking.roomId);
    const tenant = await getUserById(booking.userId);

    if (!building || !room || !tenant) return null;
    
    const landlord = await getUserById(building.ownerId);
    if (!landlord) return null;

    return { booking, building, room, tenant, landlord };
}


export async function getTenantBookings(userId: string): Promise<WithId<Booking>[]> {
  const snapshot = await db.collection("bookings").where("userId", "==", userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Booking>));
}

export async function getLandlordBookings(landlordId: string) {
  const buildingsSnapshot = await db.collection("buildings").where("ownerId", "==", landlordId).get();
  if (buildingsSnapshot.empty) {
    return { bookings: [], tenants: {} };
  }
  const buildingIds = buildingsSnapshot.docs.map((doc) => doc.id);
  const bookingsSnapshot = await db.collection("bookings").where("buildingId", "in", buildingIds).get();
  const bookings = bookingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Booking>));

  if (bookings.length === 0) {
    return { bookings: [], tenants: {} };
  }

  const tenantIds = [...new Set(bookings.map((b) => b.userId))];
  const tenants: Record<string, User> = {};
  const tenantDocs = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", tenantIds).get();
  tenantDocs.forEach((doc) => {
    tenants[doc.id] = doc.data() as User;
  });

  return { bookings, tenants };
}

export async function getConversationsForUser(userId: string) {
  const snapshot = await db.collection("conversations").where("participants", "array-contains", userId).get();
  const conversations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Conversation>));

  if (conversations.length === 0) {
    return { conversations: [], participants: {} };
  }

  const allParticipantIds = conversations.flatMap((c) => c.participants);
  const uniqueIds = [...new Set(allParticipantIds)];

  const participants: Record<string, User> = {};
  const userDocs = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", uniqueIds).get();
  userDocs.forEach((doc) => {
    participants[doc.id] = doc.data() as User;
  });

  return { conversations, participants };
}

export async function getMessagesForConversation(conversationId: string): Promise<WithId<Message>[]> {
  const snapshot = await db.collection("messages").where("conversationId", "==", conversationId).orderBy("timestamp", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Message>));
}

export async function getUserTransactions(userId: string): Promise<WithId<Transaction>[]> {
  const snapshot = await db.collection("transactions").where("userId", "==", userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Transaction>));
}

export async function getUserBalance(userId: string): Promise<number> {
  const snapshot = await db.collection("transactions").where("userId", "==", userId).where("status", "==", "Completed").get();
  const transactions = snapshot.docs.map((doc) => doc.data() as Transaction);

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

export async function getNotificationsForUser(userId: string): Promise<WithId<Notification>[]> {
  const snapshot = await db.collection("notifications").where("userId", "==", userId).orderBy("date", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as WithId<Notification>));
}

// --- WRITE OPERATIONS ---

export function calculateBookingCosts(room: Room, date?: DateRange) {
  const getDays = () => {
    if (date?.from && date?.to) {
      return Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };
  const calculateRentalPrice = () => {
    const days = getDays();
    if (days <= 0) return 0;
    const pricePerDay = room.priceDaily || (room.priceMonthly || 0) / 30;
    return days * pricePerDay;
  };
  const calculateDeposit = () => {
    const days = getDays();
    if (days <= 0) return 0;
    if (days >= 28 && room.depositMonthly) return room.depositMonthly;
    if (days >= 7 && room.depositWeekly) return room.depositWeekly;
    if (room.depositDaily) return room.depositDaily;
    if (room.depositMonthly) return room.depositMonthly;
    return 0;
  };

  const days = getDays();
  const rentalPrice = calculateRentalPrice();
  const deposit = calculateDeposit();
  const platformFee = rentalPrice * 0.20;
  const totalBookingAmount = rentalPrice + deposit + platformFee;

  return { days, rentalPrice, deposit, platformFee, totalBookingAmount };
}

export async function createOrUpdateBuilding(buildingData: Partial<Building>, ownerId: string): Promise<WithId<Building>> {
  const collectionRef = db.collection("buildings");
  if (buildingData.id) {
    const docRef = collectionRef.doc(buildingData.id);
    await docRef.update({ ...buildingData, ownerId });
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as WithId<Building>;
  } else {
    const docRef = await collectionRef.add({ ...buildingData, ownerId });
    const newDoc = await docRef.get();
    return { id: newDoc.id, ...newDoc.data() } as WithId<Building>;
  }
}

export async function createOrUpdateRoom(roomData: Partial<Room>, buildingId: string, ownerId: string): Promise<WithId<Room>> {
  const collectionRef = db.collection("rooms");
  const submissionData = {
    ...roomData,
    buildingId,
    ownerId,
    bookedDates: roomData.bookedDates?.map((range) => ({
      from: format(new Date(range.from), "yyyy-MM-dd"),
      to: range.to ? format(new Date(range.to), "yyyy-MM-dd") : undefined,
    })),
  };

  if (roomData.id) {
    const docRef = collectionRef.doc(roomData.id);
    await docRef.update(submissionData);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as WithId<Room>;
  } else {
    const docRef = await collectionRef.add(submissionData);
    const newDoc = await docRef.get();
    return { id: newDoc.id, ...newDoc.data() } as WithId<Room>;
  }
}

export async function confirmBooking(bookingDetails: {
  userId: string;
  buildingId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  const batch = db.batch();

  const room = await getRoomById(bookingDetails.roomId);
  const building = await getBuildingById(bookingDetails.buildingId);
  const tenant = await getUserById(bookingDetails.userId);
  if (!room || !building || !tenant) throw new Error("Invalid booking details.");

  const bookingRef = db.collection("bookings").doc();
  const newBooking: Omit<WithId<Booking>, "id"> = {
    ...bookingDetails,
    buildingName: building.name,
    roomName: room.name,
    buildingAddress: building.address,
    imageUrl: building.images[0] || "",
    status: "pending",
  };
  batch.set(bookingRef, newBooking);

  const transactionRef = db.collection("transactions").doc();
  const newTransaction: Omit<WithId<Transaction>, "id"> = {
    userId: bookingDetails.userId,
    bookingId: bookingRef.id,
    type: "Rent Payment",
    amount: bookingDetails.totalPrice,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
  };
  batch.set(transactionRef, newTransaction);

  const landlordNotificationRef = db.collection("notifications").doc();
  const landlordNotification: Omit<WithId<Notification>, "id"> = {
    userId: building.ownerId,
    type: "new_booking",
    message: `${tenant.name} has requested to book "${room.name}" in ${building.name}.`,
    link: "/bookings",
    read: false,
    date: new Date().toISOString(),
  };
  batch.set(landlordNotificationRef, landlordNotification);

  await batch.commit();

  return { id: bookingRef.id, ...newBooking };
}

export async function approveBooking(bookingId: string): Promise<WithId<Booking>> {
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
  if (!building) throw new Error("Building not found.");

  const batch = db.batch();
  batch.update(bookingRef, { status: "confirmed" });
  batch.update(transactionDoc.ref, { status: "Completed" });

  const payoutRef = db.collection("transactions").doc();
  const landlordPayout: Omit<WithId<Transaction>, "id"> = {
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

export async function declineBooking(bookingId: string): Promise<WithId<Booking>> {
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

export async function cancelBooking(bookingId: string): Promise<WithId<Booking>> {
  const bookingRef = db.collection("bookings").doc(bookingId);
  const transactionSnapshot = await db.collection("transactions").where("bookingId", "==", bookingId).where("status", "==", "pending").limit(1).get();

  const booking = await getBookingById(bookingId);
  if (!booking || booking.status !== "pending") {
    throw new Error("Booking not found or is not in a pending state.");
  }
  const room = await getRoomById(booking.roomId);
  if (!room) throw new Error("Room not found.");

  const batch = db.batch();
  batch.update(bookingRef, { status: "cancelled" });

  if (!transactionSnapshot.empty) {
    const transactionDoc = transactionSnapshot.docs[0];
    batch.update(transactionDoc.ref, { status: "Failed" });

    const days = differenceInCalendarDays(new Date(booking.checkOut), new Date(booking.checkIn)) + 1;
    const calculateDeposit = () => {
      if (days >= 28 && room.depositMonthly) return room.depositMonthly;
      if (days >= 7 && room.depositWeekly) return room.depositWeekly;
      if (room.depositDaily) return room.depositDaily;
      return room.depositMonthly || 0;
    };
    const heldAmount = transactionDoc.data().amount;
    const rentalPrice = heldAmount / 1.2;
    const platformFee = rentalPrice * 0.20;
    const deposit = calculateDeposit();
    const cancellationFee = platformFee + deposit;

    const feeRef = db.collection("transactions").doc();
    const feeTransaction: Omit<WithId<Transaction>, "id"> = {
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

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<WithId<User>> {
  const userRef = db.collection("users").doc(userId);
  await userRef.update(profileData);
  const updatedUser = await getUserById(userId);
  if (!updatedUser) throw new Error("User not found after update.");
  return updatedUser;
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<WithId<Message>> {
  const batch = db.batch();
  const messageRef = db.collection("messages").doc();
  
  // This object is for writing to Firestore and uses the server timestamp
  const newMessageForDb: Omit<WithId<Message>, "id" | "timestamp"> & { timestamp: admin.firestore.FieldValue } = {
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
  const optimisticMessage: WithId<Message> = {
    id: messageRef.id,
    conversationId,
    senderId,
    text,
    timestamp: new Date().toISOString(),
  };
  
  return optimisticMessage;
}

export async function initiateTopUp(userId: string, amount: number, paymentMethodType: PaymentMethodType, channelCode: string) {
  const xenditPayment = await createXenditPayment(amount * 15000, "IDR", "ID", channelCode, paymentMethodType);
  
  if (!xenditPayment.actions || xenditPayment.actions.length === 0) {
    return { type: "SUCCESS" };
  }
  
  const paymentAction = xenditPayment.actions[0] as any; // Use 'as any' to bypass strict TS checks for this dynamic object
  
  if (paymentMethodType === "VIRTUAL_ACCOUNT" && paymentAction?.virtual_account_number) {
    return { type: "VA", vaNumber: paymentAction.virtual_account_number };
  }
  if (paymentMethodType === "EWALLET" && paymentAction?.qr_code) {
    return { type: "EWALLET", qrCodeUrl: paymentAction.qr_code };
  }
  if (paymentMethodType === "OTC" && paymentAction?.payment_code) {
    return { type: "OTC", paymentCode: paymentAction.payment_code };
  }
  
  return { type: "SUCCESS" };
}

export async function completeTopUpTransaction(userId: string, amount: number): Promise<WithId<Transaction>> {
  const batch = db.batch();
  const transactionRef = db.collection("transactions").doc();
  const newTransaction: Omit<WithId<Transaction>, "id"> = {
    userId,
    type: "Top-up",
    amount,
    date: new Date().toISOString().split("T")[0],
    status: "Completed",
  };
  batch.set(transactionRef, newTransaction);

  const notificationRef = db.collection("notifications").doc();
  const notification: Omit<WithId<Notification>, "id"> = {
    userId,
    type: "top_up_success",
    message: `You successfully topped up your wallet with $${amount.toFixed(2)}.`,
    link: "/wallet",
    read: false,
    date: new Date().toISOString(),
  };
  batch.set(notificationRef, notification);

  await batch.commit();
  return { id: transactionRef.id, ...newTransaction };
}

export async function createWithdrawalTransaction(userId: string, amount: number): Promise<WithId<Transaction>> {
  // Call Xendit service to create the payout
  try {
    const channelCode = 'ID_BCA';
    const channelProperties = {
      account_holder_name: 'Mock User',
      account_number: '1234567890'
    };
    await createXenditPayout(amount * 15000, channelCode, channelProperties);
  } catch (error) {
    console.error('Failed to initiate Xendit withdrawal.', error);
    throw new Error('Withdrawal service is currently unavailable.');
  }

  const batch = db.batch();
  const transactionRef = db.collection("transactions").doc();
  const newTransaction: Omit<WithId<Transaction>, "id"> = {
    userId,
    type: 'Withdrawal',
    amount,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
  };
  batch.set(transactionRef, newTransaction);

  const notificationRef = db.collection("notifications").doc();
  const notification: Omit<WithId<Notification>, "id"> = {
    userId,
    type: 'withdrawal_success',
    message: `You successfully withdrew $${amount.toFixed(2)} from your wallet.`,
    link: '/wallet',
    read: false,
    date: new Date().toISOString(),
  };
  batch.set(notificationRef, notification);

  await batch.commit();
  return { id: transactionRef.id, ...newTransaction };
}


export async function markNotificationAsRead(userId: string, notificationId: string): Promise<WithId<Notification>> {
  const notificationRef = db.collection("notifications").doc(notificationId);
  await notificationRef.update({ read: true });
  const doc = await notificationRef.get();
  return { id: doc.id, ...doc.data() } as WithId<Notification>;
}
