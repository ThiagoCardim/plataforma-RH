import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/env";
import { peopleSupabaseOptions } from "@/lib/supabase/options";
import type { Database } from "@/lib/supabase/types";
export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (!config) return response;
  const client = createServerClient<Database, "youcon_people">(
    config.url,
    config.key,
    {
      ...peopleSupabaseOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items, headers) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    },
  );
  // Authoritative getUser validation and authorization also run in each protected page.
  await client.auth.getUser();
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
