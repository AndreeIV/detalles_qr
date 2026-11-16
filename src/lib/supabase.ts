import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("tu-proyecto-id");

const globalForSupabase = globalThis as unknown as {
  __detallesQrSupabase?: SupabaseClient;
};

function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!globalForSupabase.__detallesQrSupabase) {
    globalForSupabase.__detallesQrSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return globalForSupabase.__detallesQrSupabase;
}

export const supabase: SupabaseClient | null = getSupabaseClient();
