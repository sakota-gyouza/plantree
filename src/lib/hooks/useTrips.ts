"use client";

import { useState, useEffect, useCallback } from "react";
import { Trip } from "@/types/trip";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalData } from "@/lib/storage/migrate";

export function useTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const getStorageAdapter = useCallback(() => {
    if (user) {
      return getStorage(createClient());
    }
    return getStorage();
  }, [user]);

  const refresh = useCallback(async () => {
    const data = await getStorageAdapter().getTrips();
    setTrips(data);
    setLoading(false);
  }, [getStorageAdapter]);

  // 初回ログイン時にlocalStorageデータを移行
  useEffect(() => {
    if (user) {
      const supabase = createClient();
      migrateLocalData(supabase, user.id).then(() => refresh());
    } else {
      refresh();
    }
  }, [user, refresh]);

  const createTrip = async (
    data: Omit<Trip, "id" | "createdAt" | "updatedAt">
  ) => {
    const trip = await getStorageAdapter().createTrip(data);
    await refresh();
    return trip;
  };

  const deleteTrip = async (id: string) => {
    await getStorageAdapter().deleteTrip(id);
    await refresh();
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    const trip = await getStorageAdapter().updateTrip(id, updates);
    await refresh();
    return trip;
  };

  return { trips, loading, createTrip, deleteTrip, updateTrip, refresh };
}
