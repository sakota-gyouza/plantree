import { PackingItem } from "@/types/packing";

export interface PackingStorageAdapter {
  getPackingItems(tripId: string): Promise<PackingItem[]>;
  addPackingItem(tripId: string, name: string): Promise<PackingItem>;
  updatePackingItem(
    itemId: string,
    updates: Partial<Pick<PackingItem, "name" | "checked" | "order">>
  ): Promise<PackingItem>;
  deletePackingItem(itemId: string): Promise<void>;
  reorderPackingItems(itemIds: string[]): Promise<void>;
}
