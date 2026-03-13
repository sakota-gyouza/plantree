import { Trip, Spot } from "@/types/trip";

export interface StorageAdapter {
  getTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  createTrip(trip: Omit<Trip, "id" | "createdAt" | "updatedAt">): Promise<Trip>;
  updateTrip(id: string, updates: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;

  addSpot(tripId: string, spot: Omit<Spot, "id">): Promise<Spot>;
  updateSpot(tripId: string, spotId: string, updates: Partial<Spot>): Promise<Spot>;
  deleteSpot(tripId: string, spotId: string): Promise<void>;
  reorderSpots(tripId: string, spotIds: string[]): Promise<void>;
}
