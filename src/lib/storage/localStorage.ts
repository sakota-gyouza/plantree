import { Trip, Spot } from "@/types/trip";
import { StorageAdapter } from "./types";
import { generateId } from "@/lib/utils/id";

const STORAGE_KEY = "plantree_trips";

export class LocalStorageAdapter implements StorageAdapter {
  private read(): Trip[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private write(trips: Trip[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }

  async getTrips(): Promise<Trip[]> {
    return this.read();
  }

  async getTrip(id: string): Promise<Trip | null> {
    return this.read().find((t) => t.id === id) ?? null;
  }

  async createTrip(
    data: Omit<Trip, "id" | "createdAt" | "updatedAt">
  ): Promise<Trip> {
    const trips = this.read();
    const now = new Date().toISOString();
    const trip: Trip = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    trips.push(trip);
    this.write(trips);
    return trip;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const trips = this.read();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Trip not found");
    trips[index] = {
      ...trips[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.write(trips);
    return trips[index];
  }

  async deleteTrip(id: string): Promise<void> {
    const trips = this.read().filter((t) => t.id !== id);
    this.write(trips);
  }

  async addSpot(tripId: string, spot: Omit<Spot, "id">): Promise<Spot> {
    const trips = this.read();
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const newSpot: Spot = { ...spot, id: generateId() };
    trip.spots.push(newSpot);
    trip.updatedAt = new Date().toISOString();
    this.write(trips);
    return newSpot;
  }

  async updateSpot(
    tripId: string,
    spotId: string,
    updates: Partial<Spot>
  ): Promise<Spot> {
    const trips = this.read();
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const index = trip.spots.findIndex((s) => s.id === spotId);
    if (index === -1) throw new Error("Spot not found");
    trip.spots[index] = { ...trip.spots[index], ...updates };
    trip.updatedAt = new Date().toISOString();
    this.write(trips);
    return trip.spots[index];
  }

  async deleteSpot(tripId: string, spotId: string): Promise<void> {
    const trips = this.read();
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    trip.spots = trip.spots.filter((s) => s.id !== spotId);
    trip.updatedAt = new Date().toISOString();
    this.write(trips);
  }

  async reorderSpots(tripId: string, spotIds: string[]): Promise<void> {
    const trips = this.read();
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const spotMap = new Map(trip.spots.map((s) => [s.id, s]));
    trip.spots = spotIds.map((id, index) => {
      const spot = spotMap.get(id)!;
      return { ...spot, order: index };
    });
    trip.updatedAt = new Date().toISOString();
    this.write(trips);
  }
}
