"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { SharingService, TripMember } from "@/lib/services/sharingService";

export function useTripMembers(tripId: string) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);

  const getService = useCallback(() => {
    return new SharingService(createClient());
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const data = await getService().getMembers(tripId);
    setMembers(data);
    setLoading(false);
  }, [user, tripId, getService]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMember = async (
    userId: string,
    role: "editor" | "viewer" = "editor"
  ) => {
    await getService().addMember(tripId, userId, role);
    await refresh();
  };

  const removeMember = async (userId: string) => {
    await getService().removeMember(tripId, userId);
    await refresh();
  };

  const updateRole = async (userId: string, role: "editor" | "viewer") => {
    await getService().updateRole(tripId, userId, role);
    await refresh();
  };

  return {
    members,
    loading,
    addMember,
    removeMember,
    updateRole,
    refresh,
  };
}
