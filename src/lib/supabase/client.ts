"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "./types";
import { peopleSupabaseOptions } from "./options";
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Autenticação não configurada.");
  return createBrowserClient<Database, "youcon_people">(
    config.url,
    config.key,
    peopleSupabaseOptions,
  );
}
