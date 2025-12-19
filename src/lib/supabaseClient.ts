// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
console.log("SUPABASE URL present?", !!import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY present?", !!import.meta.env.VITE_SUPABASE_ANON_KEY);


// Create only if configured (prevents runtime crash on Vercel when envs are missing)
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel Environment Variables (Production + Preview) and redeploy."
  );
}
