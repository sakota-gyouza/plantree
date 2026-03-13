import type { SupabaseClient } from "@supabase/supabase-js";
import { Trip, Spot } from "@/types/trip";
import { StorageAdapter } from "./types";
import { generateId } from "@/lib/utils/id";

interface SpotRow {
  id: string;
  trip_id: string;
  name: string;
  notes: string | null;
  icon: string;
  time: string | null;
  position_x: number;
  position_y: number;
  lat: number | null;
  lon: number | null;
  color: string | null;
  order: number;
  day: number;
  no_pin: boolean | null;
  created_at: string;
  updated_at: string;
}

interface TripRow {
  id: string;
  name: string;
  prefecture_code: number;
  sub_region: string | null;
  date: string | null;
  days: number;
  day_infos: unknown;
  owner_id: string;
  created_at: string;
  updated_at: string;
  spots?: SpotRow[];
}

function spotFromRow(row: SpotRow): Spot {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? undefined,
    icon: row.icon as Spot["icon"],
    time: row.time ?? undefined,
    position: { x: row.position_x, y: row.position_y },
    lat: row.lat ?? undefined,
    lon: row.lon ?? undefined,
    color: row.color ?? undefined,
    order: row.order,
    day: row.day,
    noPin: row.no_pin ?? undefined,
  };
}

function tripFromRow(row: TripRow): Trip {
  const spotRows = (row.spots ?? []) as SpotRow[];
  return {
    id: row.id,
    name: row.name,
    prefectureCode: row.prefecture_code,
    subRegion: row.sub_region ?? undefined,
    date: row.date ?? undefined,
    days: row.days,
    dayInfos: (row.day_infos as Trip["dayInfos"]) ?? undefined,
    spots: spotRows.map(spotFromRow).sort((a, b) => a.order - b.order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAdapter implements StorageAdapter {
  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  async getTrips(): Promise<Trip[]> {
    const userId = await this.getUserId();

    // 自分のトリップ
    const { data: ownTrips } = await this.supabase
      .from("trips")
      .select("*, spots(*)")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    // 共有されたトリップ
    const { data: memberRows } = await this.supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", userId);

    const memberTripIds = (memberRows ?? []).map(
      (m: { trip_id: string }) => m.trip_id
    );
    let sharedTrips: TripRow[] = [];
    if (memberTripIds.length > 0) {
      const { data } = await this.supabase
        .from("trips")
        .select("*, spots(*)")
        .in("id", memberTripIds)
        .order("updated_at", { ascending: false });
      sharedTrips = (data ?? []) as TripRow[];
    }

    const all = [...((ownTrips ?? []) as TripRow[]), ...sharedTrips];
    return all.map(tripFromRow);
  }

  async getTrip(id: string): Promise<Trip | null> {
    const { data } = await this.supabase
      .from("trips")
      .select("*, spots(*)")
      .eq("id", id)
      .single();

    if (!data) return null;
    return tripFromRow(data as TripRow);
  }

  async createTrip(
    data: Omit<Trip, "id" | "createdAt" | "updatedAt">
  ): Promise<Trip> {
    const userId = await this.getUserId();
    const id = generateId();

    const { data: row, error } = await this.supabase
      .from("trips")
      .insert({
        id,
        name: data.name,
        prefecture_code: data.prefectureCode,
        sub_region: data.subRegion ?? null,
        date: data.date ?? null,
        days: data.days,
        day_infos: data.dayInfos ?? [],
        owner_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return tripFromRow({ ...(row as TripRow), spots: [] });
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.prefectureCode !== undefined)
      updateData.prefecture_code = updates.prefectureCode;
    if (updates.subRegion !== undefined)
      updateData.sub_region = updates.subRegion;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.days !== undefined) updateData.days = updates.days;
    if (updates.dayInfos !== undefined)
      updateData.day_infos = updates.dayInfos;

    const { error } = await this.supabase
      .from("trips")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    const trip = await this.getTrip(id);
    if (!trip) throw new Error("Trip not found after update");
    return trip;
  }

  async deleteTrip(id: string): Promise<void> {
    const { error } = await this.supabase.from("trips").delete().eq("id", id);
    if (error) throw error;
  }

  async addSpot(tripId: string, spot: Omit<Spot, "id">): Promise<Spot> {
    const id = generateId();
    const { data, error } = await this.supabase
      .from("spots")
      .insert({
        id,
        trip_id: tripId,
        name: spot.name,
        notes: spot.notes ?? null,
        icon: spot.icon,
        time: spot.time ?? null,
        position_x: spot.position.x,
        position_y: spot.position.y,
        lat: spot.lat ?? null,
        lon: spot.lon ?? null,
        color: spot.color ?? null,
        order: spot.order,
        day: spot.day,
        no_pin: spot.noPin ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    // トリップのupdated_atも更新
    await this.supabase
      .from("trips")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", tripId);

    return spotFromRow(data as SpotRow);
  }

  async updateSpot(
    tripId: string,
    spotId: string,
    updates: Partial<Spot>
  ): Promise<Spot> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.position !== undefined) {
      updateData.position_x = updates.position.x;
      updateData.position_y = updates.position.y;
    }
    if (updates.lat !== undefined) updateData.lat = updates.lat;
    if (updates.lon !== undefined) updateData.lon = updates.lon;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.day !== undefined) updateData.day = updates.day;
    if (updates.noPin !== undefined) updateData.no_pin = updates.noPin;

    const { data, error } = await this.supabase
      .from("spots")
      .update(updateData)
      .eq("id", spotId)
      .select()
      .single();

    if (error) throw error;

    await this.supabase
      .from("trips")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", tripId);

    return spotFromRow(data as SpotRow);
  }

  async deleteSpot(tripId: string, spotId: string): Promise<void> {
    const { error } = await this.supabase
      .from("spots")
      .delete()
      .eq("id", spotId);
    if (error) throw error;

    await this.supabase
      .from("trips")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", tripId);
  }

  async reorderSpots(tripId: string, spotIds: string[]): Promise<void> {
    // バッチ更新: 各スポットのorderを更新
    const updates = spotIds.map((id, index) =>
      this.supabase.from("spots").update({ order: index }).eq("id", id)
    );

    await Promise.all(updates);

    await this.supabase
      .from("trips")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", tripId);
  }
}
