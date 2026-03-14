"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TreePine, Clock, MapPin } from "lucide-react";
import { Trip, Spot, DayInfo } from "@/types/trip";
import { PrefectureShape } from "@/data/prefectures";
import { PrefectureMap } from "@/components/prefecture/PrefectureMap";
import { iconMap, colorMap } from "@/components/prefecture/PrefecturePin";

function getDayLabel(day: number, dayInfos?: DayInfo[]): string {
  const info = dayInfos?.[day - 1];
  if (info?.label) return info.label;
  return `${day}日目`;
}

interface SharePageClientProps {
  trip: Trip;
  prefecture: PrefectureShape;
  ownerName: string;
}

export function SharePageClient({ trip, prefecture, ownerName }: SharePageClientProps) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);
  const days = trip.days || 1;
  const currentDay = Math.min(activeDay, days);
  const daySpots = trip.spots.filter(
    (s) => s.day === currentDay || (!s.day && currentDay === 1)
  );

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-20 border-b border-border">
        <button
          onClick={() => router.push("/")}
          className="p-2 -ml-2 rounded-full hover:bg-cream transition-colors text-text-sub hover:text-text"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-text truncate">{trip.name}</h1>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-sub">{prefecture.name}</span>
            <span className="text-xs text-text-sub/50">by {ownerName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-coral">
          <TreePine size={16} />
          <span className="text-xs font-bold">Plantree</span>
        </div>
      </div>

      {/* Map */}
      <div className="px-2 pt-2 pb-1 flex items-center justify-center bg-cream/50">
        <PrefectureMap prefecture={prefecture} spots={trip.spots} />
      </div>

      {/* Timeline (read-only) */}
      <div className="border-t border-border bg-white/50 px-4 py-3 flex-1">
        <h2 className="text-sm font-bold text-text-sub mb-2 px-1">
          タイムライン
        </h2>

        {/* Day tabs */}
        {days > 1 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  day === currentDay
                    ? "bg-coral text-white shadow-sm"
                    : "bg-white text-text-sub hover:bg-peach/30 border border-border"
                }`}
              >
                {getDayLabel(day, trip.dayInfos)}
              </button>
            ))}
          </div>
        )}

        {/* Spots list */}
        {daySpots.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-text-sub text-sm">スポットがありません</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {daySpots.map((spot, index) => (
              <ShareTimelineItem
                key={spot.id}
                spot={spot}
                isLast={index === daySpots.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 py-4 bg-white border-t border-border">
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 rounded-2xl bg-coral text-white font-bold text-sm hover:bg-coral-dark transition-colors"
        >
          Plantreeで旅行プランを作る
        </button>
      </div>
    </div>
  );
}

function ShareTimelineItem({ spot, isLast }: { spot: Spot; isLast: boolean }) {
  const Icon = iconMap[spot.icon] || iconMap.other;
  const color = colorMap[spot.icon] || colorMap.other;

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-peach/60">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-text truncate">
                {spot.name}
              </h4>
              {spot.time && (
                <span className="flex items-center gap-0.5 text-[10px] text-text-sub font-bold flex-shrink-0">
                  <Clock size={9} />
                  {spot.time}
                </span>
              )}
            </div>
            {spot.notes && (
              <p className="text-xs text-text-sub line-clamp-2 mt-0.5">
                {spot.notes}
              </p>
            )}
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex justify-center py-0.5">
          <div className="w-0.5 h-4 bg-peach/50 rounded-full" />
        </div>
      )}
    </div>
  );
}
