import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "./types";
export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Autenticação não configurada.");
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server Components are read-only; proxy.ts persists refreshed cookies.
        }
      },
    },
  });
}
