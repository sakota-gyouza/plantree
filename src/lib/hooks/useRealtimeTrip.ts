"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Trip, Spot } from "@/types/trip";

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

export interface OnlineUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

interface UseRealtimeTripOptions {
  tripId: string;
  onTripUpdate: (updates: Partial<Trip>) => void;
  onSpotsChange: (updater: (prev: Spot[]) => Spot[]) => void;
}

export function useRealtimeTrip({
  tripId,
  onTripUpdate,
  onSpotsChange,
}: UseRealtimeTripOptions) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`trip:${tripId}`)
      // トリップメタデータの変更
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          onTripUpdate({
            name: row.name as string,
            days: row.days as number,
            dayInfos: row.day_infos as Trip["dayInfos"],
            prefectureCode: row.prefecture_code as number,
            subRegion: (row.sub_region as string) ?? undefined,
            date: (row.date as string) ?? undefined,
          });
        }
      )
      // スポットの追加
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spots",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const newSpot = spotFromRow(payload.new as SpotRow);
          onSpotsChange((prev) => {
            // 重複チェック
            if (prev.some((s) => s.id === newSpot.id)) return prev;
            return [...prev, newSpot].sort((a, b) => a.order - b.order);
          });
        }
      )
      // スポットの更新
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "spots",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const updated = spotFromRow(payload.new as SpotRow);
          onSpotsChange((prev) =>
            prev
              .map((s) => (s.id === updated.id ? updated : s))
              .sort((a, b) => a.order - b.order)
          );
        }
      )
      // スポットの削除
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "spots",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          onSpotsChange((prev) => prev.filter((s) => s.id !== deletedId));
        }
      )
      // Presence: オンラインユーザー
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as unknown as Array<{
            user_id: string;
            display_name: string;
            avatar_url?: string;
          }>;
          for (const p of presences) {
            if (p.user_id !== user.id) {
              users.push({
                userId: p.user_id,
                displayName: p.display_name,
                avatarUrl: p.avatar_url,
              });
            }
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            display_name:
              user.user_metadata?.full_name || user.email || "Unknown",
            avatar_url: user.user_metadata?.avatar_url,
          });
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [tripId, user, onTripUpdate, onSpotsChange, cleanup]);

  return { onlineUsers };
}
