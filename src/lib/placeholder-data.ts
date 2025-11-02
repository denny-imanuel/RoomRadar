

import type { User, Building, Room, Booking, Message, Transaction, Conversation, Notification, WithId } from './types';

// --- MOCK DATA (Fully defined with IDs) ---

export const mockUsers: WithId<Omit<User, 'id' | 'dateJoined'>>[] & { password?: string }[] = [
  {
    id: 'user-1',
    name: 'Alex Tenant',
    firstName: 'Alex',
    lastName: 'Tenant',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex-tenant',
    email: 'alex.tenant@example.com',
    phone: '+1234567890',
    profilePicture: 'https://i.pravatar.cc/150?u=alex-tenant',
    whatsapp: '+1234567890',
    role: 'tenant',
    password: 'password',
  },
  {
    id: 'user-2',
    name: 'Brian Landlord',
    firstName: 'Brian',
    lastName: 'Landlord',
    avatarUrl: 'https://i.pravatar.cc/150?u=brian-landlord',
    email: 'brian.landlord@example.com',
    phone: '+1987654321',
    profilePicture: 'https://i.pravatar.cc/150?u=brian-landlord',
    whatsapp: '+1987654321',
    role: 'landlord',
    password: 'password',
  },
];

export const mockBuildings: WithId<Building>[] = [
  { id: 'building-1', name: 'The Urban Nest', ownerId: 'user-2', address: '123 Main St, Anytown, USA', description: 'A modern downtown building with great amenities.', images: ['https://picsum.photos/seed/bldg1/600/400', 'https://picsum.photos/seed/room1/600/400'], lat: 34.0522, lng: -118.2437, checkIn: '14:00', checkOut: '11:00' },
  { id: 'building-2', name: 'Seaside Villas', ownerId: 'user-2', address: '789 Ocean Blvd, Beachtown, USA', description: 'Beautiful villas with stunning ocean views.', images: ['https://picsum.photos/seed/bldg3/600/400', 'https://picsum.photos/seed/room5/600/400'], lat: 33.985, lng: -118.466, checkIn: '16:00', checkOut: '10:00' },
  { id: 'building-3', name: 'City Center Suites', ownerId: 'user-2', address: '200 Central Plaza, Metropolis, USA', description: 'Luxury suites in the heart of the city.', images: ['https://picsum.photos/seed/bldg5/600/400', 'https://picsum.photos/seed/room9/600/400'], lat: 34.05, lng: -118.24, checkIn: '14:30', checkOut: '11:30' },
];

export const mockRooms: WithId<Room>[] = [
    { id: 'room-1', buildingId: 'building-1', ownerId: 'user-2', name: 'Cozy Single Room', price: 800, priceMonthly: 800, priceWeekly: 250, priceDaily: 40, depositMonthly: 800, depositWeekly: 100, depositDaily: 50, images: ['https://picsum.photos/seed/room1/600/400'], amenities: ['wifi', 'air-conditioner', 'table-chair'], roomType: 'single', bookedDates: [{ from: '2024-05-01', to: '2024-05-31' }] },
    { id: 'room-2', buildingId: 'building-1', ownerId: 'user-2', name: 'Spacious Double', price: 1200, priceMonthly: 1200, priceWeekly: 350, priceDaily: 60, depositMonthly: 1200, depositWeekly: 150, depositDaily: 75, images: ['https://picsum.photos/seed/room2/600/400'], amenities: ['wifi', 'air-conditioner', 'bathroom', 'wardrobe-storage'], roomType: 'double', bookedDates: [{ from: '2024-11-01', to: '2024-11-30' }] },
    { id: 'room-3', buildingId: 'building-2', ownerId: 'user-2', name: 'Garden View Single', price: 950, priceMonthly: 950, priceWeekly: 280, priceDaily: 45, depositMonthly: 950, images: ['https://picsum.photos/seed/room3/600/400'], amenities: ['wifi', 'heater', 'bed-mattress'], roomType: 'single', bookedDates: [{ from: '2025-01-05', to: '2025-01-12' }] },
];

export const mockBookings: WithId<Booking>[] = [
  { id: 'booking-1', userId: 'user-1', roomId: 'room-1', buildingId: 'building-1', buildingName: 'The Urban Nest', buildingAddress: '123 Main St, Anytown, USA', roomName: 'Cozy Single Room', checkIn: '2024-05-01', checkOut: '2024-05-31', totalPrice: 1808.00, imageUrl: 'https://picsum.photos/seed/bldg1-room1/600/400', status: 'confirmed' },
  { id: 'booking-2', userId: 'user-1', roomId: 'room-3', buildingId: 'building-2', buildingName: 'Seaside Villas', buildingAddress: '789 Ocean Blvd, Beachtown, USA', roomName: 'Garden View Single', checkIn: '2025-01-05', checkOut: '2025-01-12', totalPrice: 616.00, imageUrl: 'https://picsum.photos/seed/bldg3-room1/600/400', status: 'confirmed' },
  { id: 'booking-3', userId: 'user-1', roomId: 'room-2', buildingId: 'building-1', buildingName: 'The Urban Nest', buildingAddress: '123 Main St, Anytown, USA', roomName: 'Spacious Double', checkIn: '2024-11-01', checkOut: '2024-11-30', totalPrice: 2640.00, imageUrl: 'https://picsum.photos/seed/bldg1-room2/600/400', status: 'confirmed' },
  { id: 'booking-4', userId: 'user-1', roomId: 'room-1', buildingId: 'building-1', buildingName: 'The Urban Nest', buildingAddress: '123 Main St, Anytown, USA', roomName: 'Cozy Single Room', checkIn: '2024-07-01', checkOut: '2024-07-31', totalPrice: 2250, imageUrl: 'https://picsum.photos/seed/bldg1-room1-pending1/600/400', status: 'pending' },
  { id: 'booking-5', userId: 'user-1', roomId: 'room-2', buildingId: 'building-1', buildingName: 'The Urban Nest', buildingAddress: '123 Main St, Anytown, USA', roomName: 'Spacious Double', checkIn: '2024-12-15', checkOut: '2025-01-15', totalPrice: 2640, imageUrl: 'https://picsum.photos/seed/bldg1-room2-pending2/600/400', status: 'pending' },
  { id: 'booking-6', userId: 'user-1', roomId: 'room-3', buildingId: 'building-2', buildingName: 'Seaside Villas', buildingAddress: '789 Ocean Blvd, Beachtown, USA', roomName: 'Garden View Single', checkIn: '2024-09-01', checkOut: '2024-09-08', totalPrice: 562, imageUrl: 'https://picsum.photos/seed/bldg3-room1-pending3/600/400', status: 'pending' },
];

export const mockTransactions: WithId<Transaction>[] = [
    { id: 'txn-1', userId: 'user-1', type: 'Top-up', amount: 2000, date: '2024-02-25', status: 'Completed' },
    { id: 'txn-2', userId: 'user-1', bookingId: 'booking-1', type: 'Rent Payment', amount: 1808.00, date: '2024-05-01', status: 'Completed' },
    { id: 'txn-3', userId: 'user-2', bookingId: 'booking-1', type: 'Payout', amount: 1808.00, date: '2024-05-01', status: 'Completed' },
    { id: 'txn-4', userId: 'user-1', bookingId: 'booking-4', type: 'Rent Payment', amount: 2250, date: '2024-06-20', status: 'pending' },
    { id: 'txn-5', userId: 'user-1', bookingId: 'booking-5', type: 'Rent Payment', amount: 2640, date: '2024-06-20', status: 'pending' },
    { id: 'txn-6', userId: 'user-1', bookingId: 'booking-6', type: 'Rent Payment', amount: 562, date: '2024-06-20', status: 'pending' },
];

const now = Date.now();
export const mockMessages: WithId<Message>[] = [
    { id: 'msg-1', conversationId: 'user-1_user-2', senderId: 'user-1', text: 'Hi Brian, is the Cozy Single Room at The Urban Nest available for May?', timestamp: new Date(now - 1000 * 60 * 60 * 120).toISOString() },
    { id: 'msg-2', conversationId: 'user-1_user-2', senderId: 'user-2', text: 'Hi Alex, yes it is. I see you\'ve just booked it. Let me know if you have any questions!', timestamp: new Date(now - 1000 * 60 * 60 * 119).toISOString() },
    { id: 'msg-3', conversationId: 'user-1_user-2', senderId: 'user-1', text: 'Great, thanks! Just wanted to confirm if parking is included?', timestamp: new Date(now - 1000 * 60 * 60 * 96).toISOString() },
];

export const mockConversations: WithId<Conversation>[] = [
  {
    id: 'user-1_user-2',
    participants: ['user-1', 'user-2'],
    lastMessage: {
      text: 'Great, thanks! Just wanted to confirm if parking is included?',
      senderId: 'user-1',
      timestamp: mockMessages[mockMessages.length - 1].timestamp
    }
  }
];

export type { User, Building, Room, Booking, Message, Transaction, Conversation, Notification, WithId };

  

    

    

