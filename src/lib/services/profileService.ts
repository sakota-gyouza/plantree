import type { SupabaseClient } from "@supabase/supabase-js";

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  async uploadAvatar(file: File): Promise<string> {
    const userId = await this.getUserId();
    const ext = file.name.split(".").pop() || "png";
    const filePath = `${userId}/avatar_${Date.now()}.${ext}`;

    // 既存ファイルを上書き
    const { error } = await this.supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = this.supabase.storage.from("avatars").getPublicUrl(filePath);

    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

    // profilesテーブルも更新
    await this.supabase
      .from("profiles")
      .update({ avatar_url: urlWithCacheBust })
      .eq("id", userId);

    return urlWithCacheBust;
  }

  async getAvatarUrl(): Promise<string | null> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    return data?.avatar_url ?? null;
  }
}
