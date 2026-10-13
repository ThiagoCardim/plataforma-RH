"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "./types";
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Autenticação não configurada.");
  return createBrowserClient<Database>(config.url, config.key);
}
