
import "dotenv/config"; // Must be the first import to load .env
import * as admin from "firebase-admin";
import test from "firebase-functions-test";

// Initialize the Firebase Admin SDK for testing BEFORE other imports
if (!admin.apps.length) {
  admin.initializeApp();
}

import { getUserById, createOrUpdateBuilding } from "./data-service";
import type { User, Building } from "./types";

const firebaseTest = test({
  projectId: process.env.FIREBASE_PROJECT_ID,
}, "../serviceAccountKey.json"); // Correct path to root directory

// Mocking Firestore
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockAdd = jest.fn().mockResolvedValue({ 
    id: "new-doc-id", 
    get: jest.fn().mockResolvedValue({ 
        exists: true,
        id: "new-doc-id", 
        data: () => ({ name: "New Building" }) 
    }) 
});
const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
}));

jest.spyOn(admin, 'firestore').mockReturnValue({
  collection: mockCollection,
} as unknown as admin.firestore.Firestore);


describe("Backend Data Service", () => {
  afterAll(() => {
    firebaseTest.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return a user if found", async () => {
      const userData: User = { id: "user-1", name: "Test User", firstName: "Test", lastName: "User", email: "test@test.com", role: "tenant", dateJoined: "2024-01-01", avatarUrl: "" };
      mockGet.mockResolvedValue({
        exists: true,
        id: "user-1",
        data: () => userData,
      });

      const user = await getUserById("user-1");

      expect(user).toEqual({ ...userData, id: "user-1" });
      expect(mockCollection).toHaveBeenCalledWith("users");
      expect(mockDoc).toHaveBeenCalledWith("user-1");
      expect(mockGet).toHaveBeenCalled();
    });

    it("should return undefined if user not found", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const user = await getUserById("non-existent-user");

      expect(user).toBeUndefined();
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe("createOrUpdateBuilding", () => {
    it("should create a new building if no ID is provided", async () => {
      const buildingData: Partial<Building> = {
        name: "New Building",
        address: "123 New St",
      };
      
      const newBuilding = await createOrUpdateBuilding(buildingData, "owner-1");

      expect(mockCollection).toHaveBeenCalledWith("buildings");
      expect(mockAdd).toHaveBeenCalledWith({
        ...buildingData,
        ownerId: "owner-1",
      });
      expect(newBuilding.id).toBe("new-doc-id");
      expect(newBuilding.name).toBe("New Building");
    });

    it("should update an existing building if an ID is provided", async () => {
        const buildingData: Partial<Building> = {
            id: "building-1",
            name: "Updated Building Name",
        };
        mockGet.mockResolvedValue({
            exists: true,
            id: "building-1",
            data: () => ({ name: "Updated Building Name", ownerId: "owner-1" })
        });
        
        await createOrUpdateBuilding(buildingData, "owner-1");

        expect(mockCollection).toHaveBeenCalledWith("buildings");
        expect(mockDoc).toHaveBeenCalledWith("building-1");
        expect(mockUpdate).toHaveBeenCalledWith({
            ...buildingData,
            ownerId: "owner-1",
        });
    });
  });
});
