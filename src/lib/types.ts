

import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  profilePicture?: string;
  email: string;
  phone?: string;
  role: 'tenant' | 'landlord';
  dateJoined: string;
};

export type Room = {
  id: string;
  name: string;
  price: number; // monthly price, for backwards compatibility
  priceMonthly?: number;
  priceWeekly?: number;
  priceDaily?: number;
  depositMonthly?: number;
  depositWeekly?: number;
  depositDaily?: number;
  amenities: string[];
  images: string[];
  roomType: 'single' | 'double' | 'couple' | 'multiple';
  ownerId: string;
  buildingId: string;
  bookedDates?: { from: string, to?: string }[];
};

export type Building = {
  id: string;
  name: string;
  address: string;
  description?: string;
  ownerId: string;
  images: string[];
  lat: number;
  lng: number;
  checkIn?: string;
  checkOut?: string;
};

export type Booking = {
  id: string;
  userId: string;
  buildingId: string;
  roomId: string;
  buildingName: string;
  buildingAddress?: string;
  roomName?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  imageUrl: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'declined';
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | string;
  read?: boolean;
};

export type Conversation = {
  id: string;
  participants: string[];
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp | string;
  };
};

export type Transaction = {
  id: string;
  userId: string;
  bookingId?: string;
  type: 'Top-up' | 'Withdrawal' | 'Rent Payment' | 'Payout' | 'Cancellation Fee';
  amount: number;
  date: string;
  status: 'Completed' | 'pending' | 'Failed';
};

export type Notification = {
  id: string;
  userId: string;
  type: 'new_message' | 'new_booking' | 'booking_update' | 'top_up_success' | 'withdrawal_success';
  message: string;
  link?: string;
  read: boolean;
  date: string;
};

export type WithId<T> = T & { id: string };

    
