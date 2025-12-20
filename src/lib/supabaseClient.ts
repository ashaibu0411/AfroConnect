// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("SUPABASE URL present?", !!supabaseUrl);
  console.warn("SUPABASE KEY present?", !!supabaseAnonKey);
  throw new Error(
    "[Supabase] Missing env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Project Environment Variables (Production + Preview) and redeploy."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
