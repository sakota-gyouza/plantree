import type { SupabaseClient } from "@supabase/supabase-js";
import { PackingItem } from "@/types/packing";
import { PackingStorageAdapter } from "./packingTypes";
import { generateId } from "@/lib/utils/id";

interface PackingItemRow {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  checked: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

function fromRow(row: PackingItemRow): PackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    name: row.name,
    checked: row.checked,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PackingSupabaseAdapter implements PackingStorageAdapter {
  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    const { data, error } = await this.supabase
      .from("packing_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("order", { ascending: true });
    if (error) throw error;
    return (data as PackingItemRow[]).map(fromRow);
  }

  async addPackingItem(tripId: string, name: string): Promise<PackingItem> {
    const userId = await this.getUserId();
    const id = generateId();
    const { data: existing } = await this.supabase
      .from("packing_items")
      .select("order")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .order("order", { ascending: false })
      .limit(1);
    const nextOrder =
      existing && existing.length > 0 ? existing[0].order + 1 : 0;

    const { data, error } = await this.supabase
      .from("packing_items")
      .insert({
        id,
        trip_id: tripId,
        user_id: userId,
        name,
        order: nextOrder,
      })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as PackingItemRow);
  }

  async updatePackingItem(
    itemId: string,
    updates: Partial<Pick<PackingItem, "name" | "checked" | "order">>
  ): Promise<PackingItem> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.checked !== undefined) updateData.checked = updates.checked;
    if (updates.order !== undefined) updateData.order = updates.order;

    const { data, error } = await this.supabase
      .from("packing_items")
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as PackingItemRow);
  }

  async deletePackingItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from("packing_items")
      .delete()
      .eq("id", itemId);
    if (error) throw error;
  }

  async reorderPackingItems(itemIds: string[]): Promise<void> {
    const updates = itemIds.map((id, index) =>
      this.supabase
        .from("packing_items")
        .update({ order: index })
        .eq("id", id)
    );
    await Promise.all(updates);
  }
}
