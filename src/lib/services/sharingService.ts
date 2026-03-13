import type { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "@/types/friend";

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: "editor" | "viewer";
  profile: Profile;
}

interface MemberRow {
  id: string;
  trip_id: string;
  user_id: string;
  role: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    email: string | null;
  };
}

export class SharingService {
  constructor(private supabase: SupabaseClient) {}

  async getMembers(tripId: string): Promise<TripMember[]> {
    const { data } = await this.supabase
      .from("trip_members")
      .select("*, profiles!user_id(*)")
      .eq("trip_id", tripId);

    return (data ?? []).map((row: MemberRow) => ({
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role as "editor" | "viewer",
      profile: {
        id: row.profiles.id,
        displayName: row.profiles.display_name,
        avatarUrl: row.profiles.avatar_url ?? undefined,
        email: row.profiles.email ?? undefined,
      },
    }));
  }

  async addMember(
    tripId: string,
    userId: string,
    role: "editor" | "viewer" = "editor"
  ): Promise<void> {
    const { error } = await this.supabase.from("trip_members").insert({
      trip_id: tripId,
      user_id: userId,
      role,
    });
    if (error) throw error;
  }

  async removeMember(tripId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async updateRole(
    tripId: string,
    userId: string,
    role: "editor" | "viewer"
  ): Promise<void> {
    const { error } = await this.supabase
      .from("trip_members")
      .update({ role })
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}
