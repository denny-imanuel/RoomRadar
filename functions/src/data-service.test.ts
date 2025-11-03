
// Mock external dependencies at the very top
jest.mock('./xendit-service'); // Mock the Xendit service to prevent initialization

// Create granular mocks for Firestore methods
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockAdd = jest.fn();
const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
}));

// Mock the entire firebase-admin module
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn().mockReturnValue({
    collection: mockCollection,
  }),
}));

// Now, import the code to be tested
import { getUserById, createOrUpdateBuilding } from './data-service';
import type { User, Building } from "./types";

// Test suite
describe('Backend Data Service', () => {

  beforeEach(() => {
    // Clear the history of all mocks before each test
    mockGet.mockClear();
    mockSet.mockClear();
    mockUpdate.mockClear();
    mockAdd.mockClear();
    mockDoc.mockClear();
    mockCollection.mockClear();
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      const userData: User = { id: "user-1", name: "Test User", firstName: "Test", lastName: "User", email: "test@test.com", role: "tenant", dateJoined: "2024-01-01", avatarUrl: "" };
      mockGet.mockResolvedValue({
        exists: true,
        id: 'user-1',
        data: () => userData,
      });

      const user = await getUserById('user-1');

      expect(user).toEqual({ ...userData, id: 'user-1' });
      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('user-1');
    });

    it('should return undefined if user not found', async () => {
      mockGet.mockResolvedValue({ exists: false });

      const user = await getUserById('non-existent-user');

      expect(user).toBeUndefined();
      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('non-existent-user');
    });
  });

  describe('createOrUpdateBuilding', () => {
    it('should create a new building if no ID is provided', async () => {
      const buildingData: Partial<Building> = {
        name: 'New Building',
        address: '123 New St',
      };

      // Mock the return value of the 'add' call
      const newDocRef = {
        id: 'new-building-id',
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'new-building-id',
          data: () => ({ ...buildingData, ownerId: 'owner-1' }),
        }),
      };
      mockAdd.mockResolvedValue(newDocRef);

      const newBuilding = await createOrUpdateBuilding(buildingData, 'owner-1');

      expect(mockCollection).toHaveBeenCalledWith('buildings');
      expect(mockAdd).toHaveBeenCalledWith({ ...buildingData, ownerId: 'owner-1' });
      expect(newBuilding.id).toBe('new-building-id');
      expect(newBuilding.name).toBe('New Building');
    });

    it('should update an existing building if an ID is provided', async () => {
      const buildingData: Partial<Building> = {
        id: 'building-1',
        name: 'Updated Building Name',
      };

      // Mock the get call for the update
      const updatedDoc = {
        id: 'building-1',
        data: () => ({ ...buildingData, ownerId: 'owner-1' }),
      };
      mockGet.mockResolvedValue({ exists: true, ...updatedDoc });

      const result = await createOrUpdateBuilding(buildingData, 'owner-1');

      expect(mockCollection).toHaveBeenCalledWith('buildings');
      expect(mockDoc).toHaveBeenCalledWith('building-1');
      expect(mockUpdate).toHaveBeenCalledWith({ ...buildingData, ownerId: 'owner-1' });
      expect(result.id).toBe('building-1');
      expect(result.name).toBe('Updated Building Name');
    });
  });
});
