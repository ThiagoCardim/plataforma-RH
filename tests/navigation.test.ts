import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
vi.mock("@/modules/access/server", () => ({ requirePermission: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/gente-gestao/dashboard",
}));
import { requirePermission } from "@/modules/access/server";
import { Navigation } from "@/components/layout/navigation";
import {
  isNavigationActive,
  moduleEntries,
  routeLabel,
} from "@/modules/navigation/catalog";
const guard = vi.mocked(requirePermission);
beforeEach(() => vi.resetAllMocks());
describe("navigation preserves access and existing destinations", () => {
  it("groups the requested modules and keeps the dashboard separate", () => {
    const html = renderToStaticMarkup(
      createElement(Navigation, { management: true, dashboard: true }),
    );
    expect(html.indexOf(">Pessoas<")).toBeLessThan(
      html.indexOf(">Desempenho<"),
    );
    expect(html.indexOf(">Desempenho<")).toBeLessThan(
      html.indexOf(">Políticas<"),
    );
    expect(html.indexOf(">Políticas<")).toBeLessThan(
      html.indexOf(">Visão gerencial<"),
    );
    for (const [, entry] of moduleEntries)
      expect(html).toContain(`aria-label="${entry.label}"`);
    expect(html).toContain('href="/gente-gestao"');
    expect(html).not.toContain("Próximos espaços");
    expect(html).not.toContain("Gente &amp; Gestão");
  });
  it("does not expose managerial links without the existing permissions", () => {
    const html = renderToStaticMarkup(
      createElement(Navigation, { management: false, dashboard: false }),
    );
    expect(html).toContain('href="/home"');
    expect(html).not.toContain("Colaboradores");
    for (const [id] of moduleEntries.filter(
      ([id]) =>
        id !== "politicas-compliance" &&
        id !== "onboarding-offboarding" &&
        id !== "offboarding",
    ))
      expect(html).not.toContain(`href="/${id}"`);
    expect(html).not.toContain("Dashboard Gerencial");
  });
  it("places Offboarding directly after Onboarding and limits its link to managers/leaders", () => {
    const manager = renderToStaticMarkup(
      createElement(Navigation, { management: true, dashboard: false }),
    );
    expect(manager.indexOf('href="/onboarding-offboarding"')).toBeLessThan(
      manager.indexOf('href="/offboarding"'),
    );
    const leader = renderToStaticMarkup(
      createElement(Navigation, {
        management: false,
        dashboard: false,
        operational: true,
      }),
    );
    expect(leader).toContain('href="/offboarding"');
    const professional = renderToStaticMarkup(
      createElement(Navigation, { management: false, dashboard: false }),
    );
    expect(professional).not.toContain('href="/offboarding"');
  });
  it("keeps dashboard access independent of management access", () => {
    const html = renderToStaticMarkup(
      createElement(Navigation, { management: false, dashboard: true }),
    );
    expect(html).toContain("Dashboard Gerencial");
    expect(html).not.toContain("Colaboradores");
  });
  it("only selects Colaboradores for its actual subtree", () => {
    expect(
      isNavigationActive(
        "/gente-gestao/pessoas/demo-1/editar",
        "/gente-gestao",
      ),
    ).toBe(true);
    expect(isNavigationActive("/gente-gestao/dashboard", "/gente-gestao")).toBe(
      false,
    );
    expect(routeLabel("/gente-gestao/pessoas")).toBe("Colaboradores");
    expect(routeLabel("/gente-gestao/pessoas/demo-1")).toBe("Ficha da pessoa");
  });
});
describe("every initial module has a server guard", () => {
  for (const [id, entry] of moduleEntries.filter(
    ([id]) =>
      id !== "politicas-compliance" &&
      id !== "onboarding-offboarding" &&
      id !== "offboarding",
  )) {
    it(`blocks unauthorized direct access to ${entry.label}`, async () => {
      guard.mockRejectedValue(new Error("denied"));
      const { default: Page } = await import(
        `../src/app/(platform)/${id}/page.tsx`
      );
      await expect(Page()).rejects.toThrow("denied");
      expect(guard).toHaveBeenCalledWith("people.management.view");
    });
    it(`renders the initial state for ${entry.label}`, async () => {
      guard.mockResolvedValue(
        {} as Awaited<ReturnType<typeof requirePermission>>,
      );
      const { default: Page } = await import(
        `../src/app/(platform)/${id}/page.tsx`
      );
      const html = renderToStaticMarkup(await Page());
      expect(html).toContain(entry.label);
      expect(html).toContain("Em preparação");
      expect(html).toContain('href="/home"');
    });
  }
});
