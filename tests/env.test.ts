import { afterEach, describe, it, expect, vi } from "vitest";
import { getSupabaseConfig } from "@/lib/env";
afterEach(() => vi.unstubAllEnvs());
describe("configuration fails closed", () => {
  it("does not enable auth without configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(getSupabaseConfig()).toBeNull();
  });
  it("rejects secret keys accidentally put in public variables", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_example");
    expect(getSupabaseConfig()).toBeNull();
  });
  it("rejects non-HTTPS remote endpoints", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_example",
    );
    expect(getSupabaseConfig()).toBeNull();
  });
  it("accepts a publishable-key configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_example",
    );
    expect(getSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      key: "sb_publishable_example",
    });
  });
});
