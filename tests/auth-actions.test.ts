import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signOut: vi.fn(), deleteCookie: vi.fn() }));
vi.mock("@/lib/env", () => ({
  getSupabaseConfig: () => ({
    url: "https://example.supabase.co",
    key: "sb_publishable_test",
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signOut: mocks.signOut } }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ delete: mocks.deleteCookie }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
import { logout } from "@/components/auth/actions";
beforeEach(() => vi.resetAllMocks());
describe("logout on a shared Auth project", () => {
  it("uses local session scope and does not sign out all applications", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    expect(mocks.deleteCookie).toHaveBeenCalledExactlyOnceWith(
      "youcon-organization",
    );
  });
  it("reports a signout failure without pretending to have ended the session", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("unavailable") });
    await expect(logout()).rejects.toThrow(
      "Não foi possível encerrar a sessão",
    );
    expect(mocks.deleteCookie).not.toHaveBeenCalled();
  });
});
