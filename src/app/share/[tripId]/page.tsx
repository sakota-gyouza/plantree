import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPrefecture, prefectures } from "@/data/prefectures";
import { Trip, Spot } from "@/types/trip";
import { SharePageClient } from "./SharePageClient";

interface SpotRow {
  id: string;
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
}

interface TripRow {
  id: string;
  name: string;
  prefecture_code: number;
  sub_region: string | null;
  date: string | null;
  days: number;
  day_infos: unknown;
  cover_image_url: string | null;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

async function getPublicTrip(tripId: string): Promise<{ trip: Trip; ownerName: string } | null> {
  const supabase = await createServerSupabaseClient();

  const { data: tripData } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("is_public", true)
    .single();

  if (!tripData) return null;
  const row = tripData as TripRow;

  const { data: spotRows } = await supabase
    .from("spots")
    .select("*")
    .eq("trip_id", tripId)
    .order("order", { ascending: true });

  const spots: Spot[] = ((spotRows ?? []) as SpotRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    notes: r.notes ?? undefined,
    icon: r.icon as Spot["icon"],
    time: r.time ?? undefined,
    position: { x: r.position_x, y: r.position_y },
    lat: r.lat ?? undefined,
    lon: r.lon ?? undefined,
    color: r.color ?? undefined,
    order: r.order,
    day: r.day,
    noPin: r.no_pin ?? undefined,
  }));

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", row.owner_id)
    .single();

  const trip: Trip = {
    id: row.id,
    name: row.name,
    prefectureCode: row.prefecture_code,
    subRegion: row.sub_region ?? undefined,
    date: row.date ?? undefined,
    days: row.days,
    dayInfos: (row.day_infos as Trip["dayInfos"]) ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    spots,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return { trip, ownerName: profile?.display_name ?? "ユーザー" };
}

export async function generateMetadata({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const result = await getPublicTrip(tripId);

  if (!result) {
    return { title: "プランが見つかりません" };
  }

  const { trip } = result;
  const pref = prefectures[trip.prefectureCode];
  const prefName = pref?.name ?? "";
  const spotCount = trip.spots.length;

  return {
    title: `${trip.name} - Plantree`,
    description: `${prefName}の旅行プラン${spotCount > 0 ? ` (${spotCount}スポット)` : ""}`,
    openGraph: {
      title: `${trip.name} - Plantree`,
      description: `${prefName}の旅行プラン${spotCount > 0 ? ` (${spotCount}スポット)` : ""}`,
      siteName: "Plantree",
      type: "website",
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const result = await getPublicTrip(tripId);

  if (!result) {
    notFound();
  }

  const { trip, ownerName } = result;
  const prefecture = getPrefecture(trip.prefectureCode, trip.subRegion);

  if (!prefecture) {
    notFound();
  }

  return <SharePageClient trip={trip} prefecture={prefecture} ownerName={ownerName} />;
}
