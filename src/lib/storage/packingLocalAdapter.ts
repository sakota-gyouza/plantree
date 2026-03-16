import { PackingItem } from "@/types/packing";
import { PackingStorageAdapter } from "./packingTypes";
import { generateId } from "@/lib/utils/id";

const PACKING_KEY_PREFIX = "plantree_packing_";

export class PackingLocalAdapter implements PackingStorageAdapter {
  private read(tripId: string): PackingItem[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(PACKING_KEY_PREFIX + tripId);
    return raw ? JSON.parse(raw) : [];
  }

  private write(tripId: string, items: PackingItem[]): void {
    localStorage.setItem(PACKING_KEY_PREFIX + tripId, JSON.stringify(items));
  }

  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    return this.read(tripId).sort((a, b) => a.order - b.order);
  }

  async addPackingItem(tripId: string, name: string): Promise<PackingItem> {
    const items = this.read(tripId);
    const now = new Date().toISOString();
    const item: PackingItem = {
      id: generateId(),
      tripId,
      userId: "local",
      name,
      checked: false,
      order: items.length,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    this.write(tripId, items);
    return item;
  }

  async updatePackingItem(
    itemId: string,
    updates: Partial<Pick<PackingItem, "name" | "checked" | "order">>
  ): Promise<PackingItem> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PACKING_KEY_PREFIX)) continue;
      const tripId = key.replace(PACKING_KEY_PREFIX, "");
      const items = this.read(tripId);
      const idx = items.findIndex((it) => it.id === itemId);
      if (idx !== -1) {
        items[idx] = {
          ...items[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.write(tripId, items);
        return items[idx];
      }
    }
    throw new Error("Packing item not found");
  }

  async deletePackingItem(itemId: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PACKING_KEY_PREFIX)) continue;
      const tripId = key.replace(PACKING_KEY_PREFIX, "");
      const items = this.read(tripId);
      const filtered = items.filter((it) => it.id !== itemId);
      if (filtered.length !== items.length) {
        this.write(tripId, filtered);
        return;
      }
    }
  }

  async reorderPackingItems(itemIds: string[]): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PACKING_KEY_PREFIX)) continue;
      const tripId = key.replace(PACKING_KEY_PREFIX, "");
      const items = this.read(tripId);
      if (items.some((it) => itemIds.includes(it.id))) {
        const map = new Map(items.map((it) => [it.id, it]));
        const reordered = itemIds
          .filter((id) => map.has(id))
          .map((id, idx) => ({ ...map.get(id)!, order: idx }));
        const rest = items.filter((it) => !itemIds.includes(it.id));
        this.write(tripId, [...reordered, ...rest]);
        return;
      }
    }
  }
}
