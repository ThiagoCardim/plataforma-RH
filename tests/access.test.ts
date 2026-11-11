import { beforeEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), config: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/env", () => ({ getSupabaseConfig: mocks.config }));
import { getAccess, requirePermission } from "@/modules/access/server";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockReturnValue({
    url: "https://example.supabase.co",
    key: "sb_publishable_test",
  });
});
function client(
  grants: string[] = ["home.view"],
  active = true,
  error: unknown = null,
) {
  const answers: Record<string, unknown> = {
    memberships: {
      data: active
        ? [
            {
              id: "membership",
              organization_id: "organization",
              user_id: "user",
              active: true,
              contract_type: "pj",
            },
          ]
        : [],
      error,
    },
    organizations: {
      data: { id: "organization", name: "Fixture organization" },
      error: null,
    },
    profiles: { data: { display_name: "Fixture professional" }, error: null },
    membership_roles: { data: [{ role_code: "leadership" }], error: null },
    role_permissions: {
      data: grants.map((permission_code) => ({ permission_code })),
      error: null,
    },
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "user" } }, error: null }),
    },
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      for (const operation of [
        "select",
        "eq",
        "in",
        "order",
        "single",
        "maybeSingle",
      ])
        builder[operation] = () => builder;
      builder.then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve(answers[table]).then(resolve);
      return builder;
    },
  };
}
describe("server authorization", () => {
  it("redirects to real login when configuration is missing", async () => {
    mocks.config.mockReturnValue(null);
    await expect(getAccess()).rejects.toThrow("REDIRECT:/login");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("does not trust an unvalidated user", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new Error("invalid token"),
        }),
      },
    });
    await expect(getAccess()).rejects.toThrow("REDIRECT:/login");
  });
  it("denies users without an active membership", async () => {
    mocks.createClient.mockResolvedValue(client([], false));
    await expect(getAccess()).rejects.toThrow("REDIRECT:/acesso-negado");
  });
  it("does not silently turn query failures into authorization", async () => {
    mocks.createClient.mockResolvedValue(
      client([], true, new Error("database unavailable")),
    );
    await expect(getAccess()).rejects.toThrow(
      "Não foi possível consultar seus acessos",
    );
  });
  it("blocks a direct management route for leadership", async () => {
    mocks.createClient.mockResolvedValue(client());
    await expect(requirePermission("people.management.view")).rejects.toThrow(
      "REDIRECT:/acesso-negado",
    );
  });
  it("permits home independently of contractual type", async () => {
    mocks.createClient.mockResolvedValue(client());
    expect(
      (await requirePermission("home.view")).membership.contract_type,
    ).toBe("pj");
  });
});
