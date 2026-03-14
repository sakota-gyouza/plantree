"use client";

import { useState, useEffect, useCallback } from "react";
import { Friendship, Profile } from "@/types/friend";
import { FriendService } from "@/lib/services/friendService";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [myFriendCode, setMyFriendCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getService = useCallback(() => {
    return new FriendService(createClient());
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const service = getService();
    const [f, p, s, code] = await Promise.all([
      service.getFriends(),
      service.getPendingRequests(),
      service.getSentRequests(),
      service.getMyFriendCode(),
    ]);
    setFriends(f);
    setPendingRequests(p);
    setSentRequests(s);
    setMyFriendCode(code);
    setLoading(false);
  }, [user, getService]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const searchUsers = async (query: string): Promise<Profile[]> => {
    return getService().searchUsers(query);
  };

  const sendRequest = async (addresseeId: string) => {
    await getService().sendRequest(addresseeId);
    await refresh();
  };

  const acceptRequest = async (friendshipId: string) => {
    await getService().acceptRequest(friendshipId);
    await refresh();
  };

  const rejectRequest = async (friendshipId: string) => {
    await getService().rejectRequest(friendshipId);
    await refresh();
  };

  const removeFriend = async (friendshipId: string) => {
    await getService().removeFriend(friendshipId);
    await refresh();
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    myFriendCode,
    loading,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refresh,
  };
}
