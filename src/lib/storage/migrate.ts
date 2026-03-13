import type { SupabaseClient } from "@supabase/supabase-js";
import { Trip } from "@/types/trip";

const STORAGE_KEY = "plantree_trips";
const MIGRATED_KEY = "plantree_migrated";

export async function migrateLocalData(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_KEY, "true");
    return;
  }

  const trips: Trip[] = JSON.parse(raw);
  if (trips.length === 0) {
    localStorage.setItem(MIGRATED_KEY, "true");
    return;
  }

  for (const trip of trips) {
    // トリップを挿入（既に存在する場合はスキップ）
    const { error: tripError } = await supabase.from("trips").upsert(
      {
        id: trip.id,
        name: trip.name,
        prefecture_code: trip.prefectureCode,
        sub_region: trip.subRegion ?? null,
        date: trip.date ?? null,
        days: trip.days,
        day_infos: trip.dayInfos ?? [],
        owner_id: userId,
        created_at: trip.createdAt,
        updated_at: trip.updatedAt,
      },
      { onConflict: "id" }
    );

    if (tripError) {
      console.error("Failed to migrate trip:", trip.id, tripError);
      continue;
    }

    // スポットを挿入
    for (const spot of trip.spots) {
      const { error: spotError } = await supabase.from("spots").upsert(
        {
          id: spot.id,
          trip_id: trip.id,
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
        },
        { onConflict: "id" }
      );

      if (spotError) {
        console.error("Failed to migrate spot:", spot.id, spotError);
      }
    }
  }

  localStorage.setItem(MIGRATED_KEY, "true");
}
