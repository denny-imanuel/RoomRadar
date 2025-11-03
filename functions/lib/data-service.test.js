"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const data_service_1 = require("./data-service");
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
            const userData = { id: "user-1", name: "Test User", firstName: "Test", lastName: "User", email: "test@test.com", role: "tenant", dateJoined: "2024-01-01", avatarUrl: "" };
            mockGet.mockResolvedValue({
                exists: true,
                id: 'user-1',
                data: () => userData,
            });
            const user = await (0, data_service_1.getUserById)('user-1');
            expect(user).toEqual(Object.assign(Object.assign({}, userData), { id: 'user-1' }));
            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith('user-1');
        });
        it('should return undefined if user not found', async () => {
            mockGet.mockResolvedValue({ exists: false });
            const user = await (0, data_service_1.getUserById)('non-existent-user');
            expect(user).toBeUndefined();
            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith('non-existent-user');
        });
    });
    describe('createOrUpdateBuilding', () => {
        it('should create a new building if no ID is provided', async () => {
            const buildingData = {
                name: 'New Building',
                address: '123 New St',
            };
            // Mock the return value of the 'add' call
            const newDocRef = {
                id: 'new-building-id',
                get: jest.fn().mockResolvedValue({
                    exists: true,
                    id: 'new-building-id',
                    data: () => (Object.assign(Object.assign({}, buildingData), { ownerId: 'owner-1' })),
                }),
            };
            mockAdd.mockResolvedValue(newDocRef);
            const newBuilding = await (0, data_service_1.createOrUpdateBuilding)(buildingData, 'owner-1');
            expect(mockCollection).toHaveBeenCalledWith('buildings');
            expect(mockAdd).toHaveBeenCalledWith(Object.assign(Object.assign({}, buildingData), { ownerId: 'owner-1' }));
            expect(newBuilding.id).toBe('new-building-id');
            expect(newBuilding.name).toBe('New Building');
        });
        it('should update an existing building if an ID is provided', async () => {
            const buildingData = {
                id: 'building-1',
                name: 'Updated Building Name',
            };
            // Mock the get call for the update
            const updatedDoc = {
                id: 'building-1',
                data: () => (Object.assign(Object.assign({}, buildingData), { ownerId: 'owner-1' })),
            };
            mockGet.mockResolvedValue(Object.assign({ exists: true }, updatedDoc));
            const result = await (0, data_service_1.createOrUpdateBuilding)(buildingData, 'owner-1');
            expect(mockCollection).toHaveBeenCalledWith('buildings');
            expect(mockDoc).toHaveBeenCalledWith('building-1');
            expect(mockUpdate).toHaveBeenCalledWith(Object.assign(Object.assign({}, buildingData), { ownerId: 'owner-1' }));
            expect(result.id).toBe('building-1');
            expect(result.name).toBe('Updated Building Name');
        });
    });
});
//# sourceMappingURL=data-service.test.js.map