// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // This makes failures obvious during dev
  console.warn(
    "[Supabase] Missing env vars. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY exist in .env.local"
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
