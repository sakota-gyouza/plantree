import { ImageResponse } from "next/og";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prefectures } from "@/data/prefectures";

export const runtime = "nodejs";
export const alt = "Plantree - 旅行プラン";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const categoryEmoji: Record<string, string> = {
  shrine: "⛩️",
  temple: "🏛️",
  food: "🍽️",
  cafe: "☕",
  shopping: "🛍️",
  nature: "🌿",
  museum: "🏛️",
  hotel: "🏨",
  station: "🚉",
  photo: "📷",
  transport: "🚌",
  park: "🌳",
  amusement: "🎡",
  other: "📍",
};

export default async function OGImage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: tripData } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("is_public", true)
    .single();

  if (!tripData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFF8F0",
            fontSize: 40,
            color: "#4A4A4A",
          }}
        >
          プランが見つかりません
        </div>
      ),
      { ...size }
    );
  }

  const { data: spotRows } = await supabase
    .from("spots")
    .select("name, icon, time")
    .eq("trip_id", tripId)
    .order("day", { ascending: true })
    .order("order", { ascending: true })
    .limit(8);

  const spots = (spotRows ?? []) as { name: string; icon: string; time: string | null }[];
  const pref = prefectures[tripData.prefecture_code];
  const prefName = pref?.name ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 50%, #FFD3B6 100%)",
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#FF9A8B",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            🌳 Plantree
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: "22px",
              color: "#9B9B9B",
              background: "rgba(255,255,255,0.6)",
              padding: "6px 16px",
              borderRadius: "20px",
            }}
          >
            📍 {prefName}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: "#4A4A4A",
            lineHeight: 1.2,
            marginBottom: "32px",
            display: "flex",
          }}
        >
          {tripData.name}
        </div>

        {/* Spots */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
          }}
        >
          {spots.map((spot, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255,255,255,0.7)",
                borderRadius: "16px",
                padding: "12px 20px",
                fontSize: "24px",
                color: "#4A4A4A",
              }}
            >
              <span>{categoryEmoji[spot.icon] || "📍"}</span>
              <span style={{ fontWeight: 600 }}>{spot.name}</span>
              {spot.time && (
                <span style={{ marginLeft: "auto", color: "#9B9B9B", fontSize: "20px" }}>
                  {spot.time}
                </span>
              )}
            </div>
          ))}
          {(spotRows ?? []).length === 0 && (
            <div style={{ display: "flex", fontSize: "24px", color: "#9B9B9B" }}>
              スポットを計画中...
            </div>
          )}
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "16px",
          }}
        >
          <div style={{ fontSize: "20px", color: "#9B9B9B", display: "flex" }}>
            {tripData.days > 1 ? `${tripData.days}日間` : "日帰り"}
            {spots.length > 0 ? ` ・ ${spots.length}スポット` : ""}
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#FF9A8B",
              fontWeight: 700,
              display: "flex",
            }}
          >
            plantree-opal.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
