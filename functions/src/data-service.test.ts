
import * as admin from "firebase-admin";
import * as test from "firebase-functions-test";
import { getUserById, createOrUpdateBuilding } from "./data-service";
import type { User, Building } from "./types";

const firebaseTest = test({
  projectId: process.env.FIREBASE_PROJECT_ID,
}, "serviceAccountKey.json");

// Mocking Firestore
const mockDoc = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  collection: jest.fn(() => ({
    doc: mockDoc,
    add: jest.fn().mockResolvedValue({ id: "new-doc-id", get: jest.fn().mockResolvedValue({ id: "new-doc-id", data: () => ({ name: "New Building" }) }) }),
  })),
};

jest.spyOn(admin, "firestore", "get").mockImplementation(() => (() => ({
  collection: (collectionName: string) => ({
    doc: (docId: string) => ({
      get: mockDoc.get,
      set: mockDoc.set,
      update: mockDoc.update,
      collection: mockDoc.collection,
    }),
    add: mockDoc.collection("").add,
  }),
})) as any);

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
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: "user-1",
        data: () => userData,
      });

      const user = await getUserById("user-1");

      expect(user).toEqual({ ...userData, id: "user-1" });
      expect(mockDoc.get).toHaveBeenCalled();
    });

    it("should return undefined if user not found", async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const user = await getUserById("non-existent-user");

      expect(user).toBeUndefined();
      expect(mockDoc.get).toHaveBeenCalled();
    });
  });

  describe("createOrUpdateBuilding", () => {
    it("should create a new building if no ID is provided", async () => {
      const buildingData: Partial<Building> = {
        name: "New Building",
        address: "123 New St",
      };
      
      const newBuilding = await createOrUpdateBuilding(buildingData, "owner-1");

      expect(mockDoc.collection("").add).toHaveBeenCalledWith({
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
        mockDoc.get.mockResolvedValue({
            id: "building-1",
            data: () => ({ name: "Updated Building Name", ownerId: "owner-1" })
        });
        
        await createOrUpdateBuilding(buildingData, "owner-1");

        expect(mockDoc.update).toHaveBeenCalledWith({
            ...buildingData,
            ownerId: "owner-1",
        });
    });
  });
});
