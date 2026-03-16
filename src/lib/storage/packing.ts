import { PackingStorageAdapter } from "./packingTypes";
import { PackingLocalAdapter } from "./packingLocalAdapter";
import { PackingSupabaseAdapter } from "./packingSupabaseAdapter";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getPackingStorage(
  supabase?: SupabaseClient
): PackingStorageAdapter {
  if (supabase) {
    return new PackingSupabaseAdapter(supabase);
  }
  return new PackingLocalAdapter();
}
