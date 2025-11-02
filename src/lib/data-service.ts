
'use client';

import {
  mockBookings,
  mockBuildings,
  mockConversations,
  mockMessages,
  mockRooms,
  mockUsers,
  mockTransactions,
} from '@/lib/placeholder-data';
import type { Booking, Building, Conversation, Message, Room, User, WithId, Transaction, Notification } from '@/lib/types';
import { format, differenceInCalendarDays } from 'date-fns';
import { createXenditPayment, createXenditPayout, PaymentMethodType } from './xendit-service';

// Create a mutable in-memory store for transactions to simulate a database
let transactionsStore: WithId<Transaction>[] = [...mockTransactions];

let notificationsStore: WithId<Notification>[] = [
    {
      id: 'notif-1',
      userId: 'user-2',
      type: 'new_booking',
      message: 'Alex Tenant has booked "Cozy Single Room" in The Urban Nest.',
      link: '/bookings/booking-1',
      read: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'new_message',
      message: 'You have a new message from Brian Landlord.',
      link: '/messages?recipientId=user-2',
      read: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 119).toISOString(),
    },
    {
      id: 'notif-3',
      userId: 'user-2',
      type: 'new_message',
      message: 'You have a new message from Alex Tenant regarding parking.',
      link: '/messages?recipientId=user-1',
      read: true,
      date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    },
];


// --- READ OPERATIONS ---

export async function getUsers(): Promise<WithId<User>[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockUsers;
}

export async function getUserById(id: string): Promise<WithId<User> | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockUsers.find(u => u.id === id);
}

export async function getBuildings(): Promise<WithId<Building>[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockBuildings;
}

export async function getBuildingById(id: string): Promise<WithId<Building> | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockBuildings.find(b => b.id === id);
}

export async function getRooms(): Promise<WithId<Room>[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockRooms;
}

export async function getRoomById(id: string): Promise<WithId<Room> | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockRooms.find(r => r.id === id);
}

export async function getRoomsByBuildingId(buildingId: string): Promise<WithId<Room>[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockRooms.filter(r => r.buildingId === buildingId);
}

export async function getBuildingsWithRooms(): Promise<(WithId<Building> & { rooms: WithId<Room>[] })[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const buildings = await getBuildings();
  const rooms = await getRooms();
  return buildings.map(building => ({
    ...building,
    rooms: rooms.filter(room => room.buildingId === building.id),
  }));
}

export async function getLandlordListings(ownerId: string): Promise<(WithId<Building> & { rooms: WithId<Room>[] })[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const allBuildings = await getBuildingsWithRooms();
    return allBuildings.filter(b => b.ownerId === ownerId);
}

export async function getBookingById(id: string): Promise<WithId<Booking> | undefined> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockBookings.find(b => b.id === id);
}

export async function getBookingDetails(bookingId: string) {
    await new Promise(resolve => setTimeout(resolve, 150));
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
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockBookings.filter(b => b.userId === userId);
}

export async function getLandlordBookings(landlordId: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const ownedBuildings = mockBuildings.filter(b => b.ownerId === landlordId);
    const ownedBuildingIds = ownedBuildings.map(b => b.id);
    const allBookings = mockBookings.filter(b => ownedBuildingIds.includes(b.buildingId));

    const tenantIds = [...new Set(allBookings.map(b => b.userId))];
    const tenants: Record<string, User> = {};
    for (const id of tenantIds) {
        const tenant = await getUserById(id);
        if (tenant) {
            tenants[id] = tenant;
        }
    }
    
    return { bookings: allBookings, tenants };
}

export async function getNewBookingPageData(buildingId: string, roomId: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const building = await getBuildingById(buildingId);
    const room = await getRoomById(roomId);
    return { building, room };
}

export async function getConversationsForUser(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const userConversations = mockConversations.filter(c => c.participants.includes(userId));

    const allParticipantIds = userConversations.flatMap(c => c.participants);
    const uniqueIds = [...new Set(allParticipantIds)];
    const participants: Record<string, User> = {};

    for (const id of uniqueIds) {
        const user = await getUserById(id);
        if (user) {
            participants[id] = user;
        }
    }
    return { conversations: userConversations, participants };
}

export async function getMessagesForConversation(conversationId: string): Promise<WithId<Message>[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const messages = mockMessages.filter(m => m.conversationId === conversationId);
    return messages.sort((a, b) => new Date(a.timestamp as string).getTime() - new Date(b.timestamp as string).getTime());
}

export async function getUserTransactions(userId: string): Promise<WithId<Transaction>[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return transactionsStore.filter(t => t.userId === userId);
}

export async function getUserBalance(userId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userTransactions = transactionsStore.filter(t => t.userId === userId);
    
    const balance = userTransactions.reduce((acc, txn) => {
        if (txn.status !== 'Completed') {
            return acc; // Only count completed transactions for the final balance
        }

        switch(txn.type) {
            case 'Top-up':
            case 'Payout': // This is income for the user
                return acc + txn.amount;
            case 'Withdrawal':
            case 'Rent Payment':
            case 'Cancellation Fee':
                 return acc - txn.amount;
            default:
                return acc;
        }
    }, 0);
    
    return balance;
}

export async function getNotificationsForUser(userId: string): Promise<WithId<Notification>[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return notificationsStore
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


// --- WRITE OPERATIONS ---

export async function createOrUpdateBuilding(buildingData: Partial<Building>, ownerId: string): Promise<WithId<Building>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (buildingData.id) {
        // Update
        const index = mockBuildings.findIndex(b => b.id === buildingData.id);
        if (index !== -1) {
            mockBuildings[index] = { ...mockBuildings[index], ...buildingData } as WithId<Building>;
            return mockBuildings[index];
        }
    } 
    // Create
    const newBuilding: WithId<Building> = {
        id: `building-${Date.now()}`,
        ...buildingData,
        ownerId,
    } as WithId<Building>;
    mockBuildings.push(newBuilding);
    return newBuilding;
}

export async function createOrUpdateRoom(roomData: Partial<Room>, buildingId: string, ownerId: string): Promise<WithId<Room>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const submissionData = {
      ...roomData,
      bookedDates: roomData.bookedDates?.map(range => ({
        from: format(new Date(range.from), 'yyyy-MM-dd'),
        to: range.to ? format(new Date(range.to), 'yyyy-MM-dd') : undefined,
      })),
    };

    if (roomData.id) {
        // Update
        const index = mockRooms.findIndex(r => r.id === roomData.id);
        if (index !== -1) {
            mockRooms[index] = { ...mockRooms[index], ...submissionData } as WithId<Room>;
            return mockRooms[index];
        }
    }

    // Create
    const newRoom: WithId<Room> = {
        id: `room-${Date.now()}`,
        ...submissionData,
        buildingId,
        ownerId,
    } as WithId<Room>;
    mockRooms.push(newRoom);
    return newRoom;
}


export async function confirmBooking(bookingDetails: {
  userId: string;
  buildingId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const room = await getRoomById(bookingDetails.roomId);
  const building = await getBuildingById(bookingDetails.buildingId);
  const tenant = await getUserById(bookingDetails.userId);

  if (!room || !building || !tenant) {
    throw new Error('Room, building, or user not found');
  }

  const newBookingId = `booking-${Date.now()}`;

  const newBooking: WithId<Booking> = {
    id: newBookingId,
    ...bookingDetails,
    buildingName: building.name,
    roomName: room.name,
    buildingAddress: building.address,
    imageUrl: building.images[0] || '',
    status: 'pending', // Set status to pending
  };

  mockBookings.push(newBooking);

  // Create a pending transaction to hold the funds
  const newTransaction: WithId<Transaction> = {
    id: `txn-${Date.now()}`,
    userId: bookingDetails.userId,
    bookingId: newBookingId,
    type: 'Rent Payment',
    amount: bookingDetails.totalPrice,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
  };
  transactionsStore.push(newTransaction);
  
  // Create notification for the landlord
  const landlordNotification: WithId<Notification> = {
    id: `notif-${Date.now()}`,
    userId: building.ownerId,
    type: 'new_booking',
    message: `${tenant.name} has requested to book "${room.name}" in ${building.name}.`,
    link: `/bookings`,
    read: false,
    date: new Date().toISOString(),
  };
  notificationsStore.push(landlordNotification);


  console.log('New booking request created (mock):', newBooking);
  console.log('New pending transaction created (mock):', newTransaction);

  return newBooking;
}

export async function approveBooking(bookingId: string): Promise<WithId<Booking>> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) throw new Error('Booking not found');

  const booking = mockBookings[bookingIndex];
  if (booking.status !== 'pending') throw new Error('Booking is not pending');

  const transactionIndex = transactionsStore.findIndex(t => t.bookingId === bookingId && t.status === 'pending');
  if (transactionIndex === -1) throw new Error('Pending transaction for this booking not found');

  // Update booking status
  booking.status = 'confirmed';

  // Update transaction status
  transactionsStore[transactionIndex].status = 'Completed';

  // Create payout for landlord
  const building = await getBuildingById(booking.buildingId);
  if (!building) throw new Error('Building associated with booking not found');
  
  const landlordPayout: WithId<Transaction> = {
    id: `txn-${Date.now()}`,
    userId: building.ownerId,
    bookingId: booking.id,
    type: 'Payout',
    amount: booking.totalPrice,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
  };
  transactionsStore.push(landlordPayout);

  console.log(`Booking ${bookingId} approved. Payment completed. Payout to landlord created.`);

  return booking;
}

export async function declineBooking(bookingId: string): Promise<WithId<Booking>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) throw new Error('Booking not found');

    const booking = mockBookings[bookingIndex];
    if (booking.status !== 'pending') throw new Error('Only pending bookings can be declined.');

    // Update booking status
    booking.status = 'declined';

    // Find and fail the corresponding pending transaction to give a full refund
    const transactionIndex = transactionsStore.findIndex(t => t.bookingId === bookingId && t.status === 'pending');
    if (transactionIndex !== -1) {
        transactionsStore[transactionIndex].status = 'Failed';
        console.log(`Booking ${bookingId} declined. Full refund processed by failing transaction ${transactionsStore[transactionIndex].id}.`);
    } else {
        console.warn(`Could not find a pending transaction to fail for declined booking ${bookingId}`);
    }
    
    return booking;
}

export async function cancelBooking(bookingId: string): Promise<WithId<Booking>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const bookingIndex = mockBookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) throw new Error('Booking not found');

    const booking = mockBookings[bookingIndex];
    if (booking.status !== 'pending') throw new Error('Only pending bookings can be cancelled.');

    // Update booking status
    booking.status = 'cancelled';

    // Find and fail the original pending transaction
    const transactionIndex = transactionsStore.findIndex(t => t.bookingId === bookingId && t.status === 'pending');
    if (transactionIndex !== -1) {
        transactionsStore[transactionIndex].status = 'Failed';
        
        // Calculate penalty (deposit + platform fee)
        const room = await getRoomById(booking.roomId);
        if (!room) throw new Error('Could not find room to calculate cancellation fee');

        const days = differenceInCalendarDays(new Date(booking.checkOut), new Date(booking.checkIn)) + 1;
        
        const calculateDeposit = () => {
            if (days >= 28 && room.depositMonthly) return room.depositMonthly;
            if (days >= 7 && room.depositWeekly) return room.depositWeekly;
            if (room.depositDaily) return room.depositDaily;
            if (room.depositMonthly) return room.depositMonthly; // Fallback
            return 0;
        };

        const heldAmount = transactionsStore[transactionIndex].amount;
        const rentalPrice = heldAmount / 1.2; // Approximate reversal of platform fee addition
        const platformFee = rentalPrice * 0.20;
        const deposit = calculateDeposit();
        const cancellationFee = platformFee + deposit;

        // Create a new transaction for the cancellation fee
        const feeTransaction: WithId<Transaction> = {
            id: `txn-fee-${Date.now()}`,
            userId: booking.userId,
            bookingId: booking.id,
            type: 'Cancellation Fee',
            amount: cancellationFee,
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
        };
        transactionsStore.push(feeTransaction);

        console.log(`Booking ${bookingId} cancelled by tenant. Original transaction ${transactionsStore[transactionIndex].id} failed. Cancellation fee of $${cancellationFee} charged.`);

    } else {
        console.warn(`Could not find a pending transaction to cancel for booking ${bookingId}`);
    }
    
    return booking;
}


export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<WithId<Message>> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const newMsg: WithId<Message> = {
    id: `msg-${Date.now()}`,
    conversationId: conversationId,
    text: text,
    senderId: senderId,
    timestamp: new Date().toISOString(),
  };

  mockMessages.push(newMsg);
  
  // Update last message in conversation
  const convoIndex = mockConversations.findIndex(c => c.id === conversationId);
  if (convoIndex !== -1) {
    mockConversations[convoIndex].lastMessage = {
      text,
      senderId,
      timestamp: newMsg.timestamp,
    };
  }
  
  return newMsg;
}

export async function updateUserProfile(userId: string, profileData: Partial<User>): Promise<WithId<User>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...profileData } as WithId<User>;
        return mockUsers[userIndex];
    }
    throw new Error('User not found');
}

export async function initiateTopUp(userId: string, amount: number, paymentMethodType: PaymentMethodType, channelCode: string) {
  try {
    const xenditPayment = await createXenditPayment(amount * 15000, 'IDR', 'ID', channelCode, paymentMethodType);
    console.log('Xendit payment request initiated:', xenditPayment);

    // This is where you would handle different payment actions
    // For now, we return the relevant data for the UI
    const paymentAction = xenditPayment.actions?.[0];
    if (paymentMethodType === 'VIRTUAL_ACCOUNT' && paymentAction?.channelProperties?.virtualAccountNumber) {
        return { type: 'VA', vaNumber: paymentAction.channelProperties.virtualAccountNumber };
    }
    if (paymentMethodType === 'EWALLET' && paymentAction?.qrCode) {
        return { type: 'EWALLET', qrCodeUrl: paymentAction.qrCode };
    }
    if (paymentMethodType === 'OTC' && paymentAction?.channelProperties?.paymentCode) {
        return { type: 'OTC', paymentCode: paymentAction.channelProperties.paymentCode };
    }

    // Fallback or if no specific action is needed
    return { type: 'SUCCESS' };

  } catch (error) {
    console.error('Failed to initiate Xendit top-up.', error);
    // Rethrow or handle the error as needed for the UI
    throw new Error('Payment provider is currently unavailable.');
  }
}

export async function completeTopUpTransaction(userId: string, amount: number): Promise<WithId<Transaction>> {
  // For simulation purposes, we'll proceed as if the payment was successful immediately.
  const newTransaction: WithId<Transaction> = {
    id: `txn-topup-${Date.now()}`,
    userId,
    type: 'Top-up',
    amount,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed', // Simulating immediate success
  };
  transactionsStore.push(newTransaction);
  
  const notification: WithId<Notification> = {
    id: `notif-${Date.now()}`,
    userId,
    type: 'top_up_success',
    message: `You successfully topped up your wallet with $${amount.toFixed(2)}.`,
    link: '/wallet',
    read: false,
    date: new Date().toISOString(),
  };
  notificationsStore.push(notification);

  return newTransaction;
}

export async function createWithdrawalTransaction(userId: string, amount: number): Promise<WithId<Transaction>> {
  // Call Xendit service to create the payout
  try {
    // Example payout details. In a real app, these would come from the user's input.
    const channelCode = 'ID_BCA'; 
    const channelProperties = {
      account_holder_name: 'Mock User',
      account_number: '1234567890'
    };
    const xenditPayout = await createXenditPayout(amount * 15000, channelCode, channelProperties); // Example: amount in IDR
    console.log('Xendit payout request initiated:', xenditPayout);
    // In a real app, you would monitor the status of this payout via webhooks or polling.
  } catch (error) {
    console.error('Failed to initiate Xendit withdrawal.', error);
    // Rethrow or handle the error as needed for the UI
    throw new Error('Withdrawal service is currently unavailable.');
  }

  // For simulation purposes, we'll proceed as if the withdrawal was successful immediately.
  const newTransaction: WithId<Transaction> = {
    id: `txn-withdraw-${Date.now()}`,
    userId,
    type: 'Withdrawal',
    amount,
    date: new Date().toISOString().split('T')[0],
    status: 'Completed', // Simulating immediate success
  };
  transactionsStore.push(newTransaction);

  const notification: WithId<Notification> = {
    id: `notif-${Date.now()}`,
    userId,
    type: 'withdrawal_success',
    message: `You successfully withdrew $${amount.toFixed(2)} from your wallet.`,
    link: '/wallet',
    read: false,
    date: new Date().toISOString(),
  };
  notificationsStore.push(notification);

  return newTransaction;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<WithId<Notification>> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const notifIndex = notificationsStore.findIndex(n => n.id === notificationId && n.userId === userId);
    if (notifIndex !== -1) {
        notificationsStore[notifIndex].read = true;
        return notificationsStore[notifIndex];
    }
    throw new Error('Notification not found');
}
