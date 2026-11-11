import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@/modules/access/server", () => ({ requirePermission: vi.fn() }));
import { requirePermission } from "@/modules/access/server";
import Home from "@/app/(platform)/home/page";
import Management from "@/app/(platform)/gente-gestao/page";
import Dashboard from "@/app/(platform)/gente-gestao/dashboard/page";
const guard = vi.mocked(requirePermission);
beforeEach(() => vi.clearAllMocks());
describe("presentation respects existing access boundaries", () => {
  for (const role of [
    "professional",
    "leadership",
    "hr",
    "director",
  ] as const) {
    it(`shows only authorized Home shortcuts for ${role}`, async () => {
      const managerial = role === "hr" || role === "director";
      guard.mockResolvedValue({
        displayName: "Pessoa de revisão",
        organization: { name: "Organização sintética" },
        membership: { contract_type: "pj" },
        roles: [role],
        permissions: managerial
          ? ["home.view", "people.management.view", "people.dashboard.view"]
          : ["home.view"],
      } as Awaited<ReturnType<typeof requirePermission>>);
      const html = renderToStaticMarkup(await Home());
      expect(guard).toHaveBeenCalledWith("home.view");
      expect(html.includes('href="/gente-gestao"')).toBe(managerial);
      expect(html.includes('href="/gente-gestao/dashboard"')).toBe(managerial);
      expect(html).toContain("Prestador PJ");
      expect(html).toContain("Papéis de acesso");
      expect(html).not.toMatch(/férias|13º|saldo de benefícios/i);
      expect(html).toContain(
        "O módulo de comunicação ainda não está disponível",
      );
    });
  }
  it("keeps the management page server guard", async () => {
    guard.mockRejectedValue(new Error("access denied"));
    await expect(Management()).rejects.toThrow("access denied");
    expect(guard).toHaveBeenCalledWith("people.management.view");
  });
  it("keeps the dashboard page server guard", async () => {
    guard.mockRejectedValue(new Error("access denied"));
    await expect(Dashboard()).rejects.toThrow("access denied");
    expect(guard).toHaveBeenCalledWith("people.dashboard.view");
  });
});
