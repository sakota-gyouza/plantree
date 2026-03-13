"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trip, Spot } from "@/types/trip";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTrip, OnlineUser } from "./useRealtimeTrip";

export function useSpots(tripId: string) {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  const getStorageAdapter = useCallback(() => {
    if (user) {
      return getStorage(createClient());
    }
    return getStorage();
  }, [user]);

  const refresh = useCallback(async () => {
    const data = await getStorageAdapter().getTrip(tripId);
    setTrip(data);
    setLoading(false);
  }, [tripId, getStorageAdapter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // リアルタイム同期コールバック
  const handleTripUpdate = useCallback((updates: Partial<Trip>) => {
    setTrip((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const handleSpotsChange = useCallback(
    (updater: (prev: Spot[]) => Spot[]) => {
      setTrip((prev) => {
        if (!prev) return prev;
        return { ...prev, spots: updater(prev.spots) };
      });
    },
    []
  );

  // リアルタイム接続（ログイン時のみ）
  const { onlineUsers } = useRealtimeTrip(
    user
      ? {
          tripId,
          onTripUpdate: handleTripUpdate,
          onSpotsChange: handleSpotsChange,
        }
      : { tripId, onTripUpdate: () => {}, onSpotsChange: () => {} }
  );

  const spots = trip?.spots ?? [];

  const addSpot = async (spot: Omit<Spot, "id">) => {
    await getStorageAdapter().addSpot(tripId, spot);
    // ログイン時はRealtimeが自動反映、未ログイン時は手動refresh
    if (!user) await refresh();
  };

  const updateSpot = async (spotId: string, updates: Partial<Spot>) => {
    await getStorageAdapter().updateSpot(tripId, spotId, updates);
    if (!user) await refresh();
  };

  const deleteSpot = async (spotId: string) => {
    await getStorageAdapter().deleteSpot(tripId, spotId);
    if (!user) await refresh();
  };

  const reorderSpots = async (spotIds: string[]) => {
    await getStorageAdapter().reorderSpots(tripId, spotIds);
    if (!user) await refresh();
  };

  return {
    trip,
    spots,
    loading,
    addSpot,
    updateSpot,
    deleteSpot,
    reorderSpots,
    refresh,
    onlineUsers: user ? onlineUsers : ([] as OnlineUser[]),
  };
}
