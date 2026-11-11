import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
}));
vi.mock("@supabase/ssr", async (importOriginal) => {
  const original = await importOriginal<typeof import("@supabase/ssr")>();
  return {
    ...original,
    createServerClient: vi.fn(original.createServerClient),
    createBrowserClient: vi.fn(original.createBrowserClient),
  };
});
import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { createClient as serverClient } from "@/lib/supabase/server";
import { createClient as browserClient } from "@/lib/supabase/client";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

const requests: { url: string; schema: string | null }[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  requests.length = 0;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: String(input),
        schema: new Headers(init?.headers).get("Accept-Profile"),
      });
      return new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("shared project client boundaries", () => {
  it("sends server queries to People, never to the shared public profiles", async () => {
    const client = await serverClient();
    const result = await client.from("profiles").select("user_id");
    expect(result.error).toBeNull();
    expect(requests).toEqual([
      {
        url: "https://example.supabase.co/rest/v1/profiles?select=user_id",
        schema: "youcon_people",
      },
    ]);
    expect(createServerClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        db: { schema: "youcon_people" },
        cookieOptions: { name: "youcon-people-auth" },
      }),
    );
  });
  it("uses the same schema and separate auth storage in the browser", async () => {
    const client = browserClient();
    expect((await client.from("memberships").select("id")).error).toBeNull();
    expect(requests[0].schema).toBe("youcon_people");
    expect(createBrowserClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        db: { schema: "youcon_people" },
        cookieOptions: { name: "youcon-people-auth" },
      }),
    );
  });
  it("refreshes only the People cookie namespace in proxy", async () => {
    const response = await proxy(
      new NextRequest("https://people.example/home"),
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(createServerClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        db: { schema: "youcon_people" },
        cookieOptions: { name: "youcon-people-auth" },
      }),
    );
    expect(requests).toHaveLength(0);
  });
});
