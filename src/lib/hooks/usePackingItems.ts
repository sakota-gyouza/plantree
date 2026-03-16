"use client";

import { useState, useEffect, useCallback } from "react";
import { PackingItem } from "@/types/packing";
import { getPackingStorage } from "@/lib/storage/packing";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export function usePackingItems(tripId: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getAdapter = useCallback(() => {
    if (user) return getPackingStorage(createClient());
    return getPackingStorage();
  }, [user]);

  const refresh = useCallback(async () => {
    try {
      const data = await getAdapter().getPackingItems(tripId);
      setItems(data);
    } catch (err) {
      console.error("Failed to load packing items:", err);
    } finally {
      setLoading(false);
    }
  }, [tripId, getAdapter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (name: string) => {
    await getAdapter().addPackingItem(tripId, name);
    await refresh();
  };

  const toggleItem = async (itemId: string, checked: boolean) => {
    await getAdapter().updatePackingItem(itemId, { checked });
    await refresh();
  };

  const deleteItem = async (itemId: string) => {
    await getAdapter().deletePackingItem(itemId);
    await refresh();
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return {
    items,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    checkedCount,
    totalCount: items.length,
  };
}
