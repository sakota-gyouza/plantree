import type { SupabaseClient } from "@supabase/supabase-js";
import { Profile, Friendship } from "@/types/friend";

interface ProfileRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  friend_code: string | null;
}

function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    email: row.email ?? undefined,
    friendCode: row.friend_code ?? undefined,
  };
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester?: ProfileRow;
  addressee?: ProfileRow;
}

function friendshipFromRow(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status as Friendship["status"],
    createdAt: row.created_at,
    requester: row.requester ? profileFromRow(row.requester) : undefined,
    addressee: row.addressee ? profileFromRow(row.addressee) : undefined,
  };
}

export class FriendService {
  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  async searchUsers(query: string): Promise<Profile[]> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("profiles")
      .select("*")
      .ilike("friend_code", query.trim())
      .neq("id", userId)
      .limit(10);

    return (data ?? []).map(profileFromRow);
  }

  async getMyFriendCode(): Promise<string | null> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("profiles")
      .select("friend_code")
      .eq("id", userId)
      .single();

    return data?.friend_code ?? null;
  }

  async sendRequest(addresseeId: string): Promise<Friendship> {
    const userId = await this.getUserId();
    const { data, error } = await this.supabase
      .from("friendships")
      .insert({
        requester_id: userId,
        addressee_id: addresseeId,
      })
      .select("*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)")
      .single();

    if (error) throw error;
    return friendshipFromRow(data as FriendshipRow);
  }

  async acceptRequest(friendshipId: string): Promise<void> {
    const { error } = await this.supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (error) throw error;
  }

  async rejectRequest(friendshipId: string): Promise<void> {
    const { error } = await this.supabase
      .from("friendships")
      .update({ status: "rejected" })
      .eq("id", friendshipId);

    if (error) throw error;
  }

  async removeFriend(friendshipId: string): Promise<void> {
    const { error } = await this.supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) throw error;
  }

  async getFriends(): Promise<Friendship[]> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("friendships")
      .select(
        "*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)"
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    return (data ?? []).map(friendshipFromRow);
  }

  async getPendingRequests(): Promise<Friendship[]> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("friendships")
      .select(
        "*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)"
      )
      .eq("status", "pending")
      .eq("addressee_id", userId);

    return (data ?? []).map(friendshipFromRow);
  }

  async getSentRequests(): Promise<Friendship[]> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("friendships")
      .select(
        "*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)"
      )
      .eq("status", "pending")
      .eq("requester_id", userId);

    return (data ?? []).map(friendshipFromRow);
  }

  /** フレンドのProfileリストを返す（自分以外のプロフィール） */
  async getFriendProfiles(): Promise<Profile[]> {
    const userId = await this.getUserId();
    const friends = await this.getFriends();
    return friends.map((f) => {
      if (f.requesterId === userId) {
        return f.addressee!;
      }
      return f.requester!;
    });
  }
}
