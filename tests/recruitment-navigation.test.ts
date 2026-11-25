import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/recrutamento/vagas",
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
vi.mock("@/modules/career/access", () => ({ careerScope: vi.fn() }));
import { Navigation } from "@/components/layout/navigation";
import { careerScope } from "@/modules/career/access";
import { recruitmentScope } from "@/modules/recruitment/access";
const context = {
  org: "org-a",
  user: "actor",
  name: "Conta fictícia",
  key: "a",
  contract: "CLT" as const,
  rh: false,
  director: false,
  leader: false,
};
describe("Recruitment server guards and independent category", () => {
  it.each(["hr", "director", "leader"] as const)(
    "shows only the allowed recruitment destinations for %s",
    (recruitment) => {
      const html = renderToStaticMarkup(
        createElement(Navigation, {
          management: false,
          dashboard: false,
          recruitment,
        }),
      );
      expect(html).toContain("Recrutamento");
      expect(html).toContain('href="/recrutamento/vagas"');
      expect(html.includes('href="/recrutamento/match"')).toBe(
        recruitment === "hr",
      );
      expect(html).not.toContain('href="/gente-gestao"');
    },
  );
  it("denies direct employee and director access to private talent/AI pages, independent of URL parameters", async () => {
    vi.mocked(careerScope).mockResolvedValue(context);
    await expect(recruitmentScope("carreiras")).rejects.toThrow(
      "/acesso-negado",
    );
    vi.mocked(careerScope).mockResolvedValue({ ...context, director: true });
    await expect(recruitmentScope("match")).rejects.toThrow("/acesso-negado");
    await expect(recruitmentScope("visao-geral")).resolves.toMatchObject({
      director: true,
    });
  });
  it("returns the authenticated RH scope, never an identity chosen by the client", async () => {
    vi.mocked(careerScope).mockResolvedValue({ ...context, rh: true });
    const scope = await recruitmentScope("modelos");
    expect(scope.user).toBe("actor");
    expect(scope.org).toBe("org-a");
  });
});
