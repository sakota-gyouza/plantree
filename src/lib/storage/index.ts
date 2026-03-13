import { StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./localStorage";
import { SupabaseAdapter } from "./supabaseAdapter";
import type { SupabaseClient } from "@supabase/supabase-js";

let localInstance: StorageAdapter | null = null;
let supabaseInstance: StorageAdapter | null = null;

export function getStorage(supabase?: SupabaseClient): StorageAdapter {
  if (supabase) {
    if (!supabaseInstance) {
      supabaseInstance = new SupabaseAdapter(supabase);
    }
    return supabaseInstance;
  }
  if (!localInstance) {
    localInstance = new LocalStorageAdapter();
  }
  return localInstance;
}

export type { StorageAdapter };
