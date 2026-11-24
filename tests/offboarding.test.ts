import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoOffboarding } from "@/modules/offboarding/fixtures";
import { demoOnboarding } from "@/modules/onboarding/fixtures";
import {
  compose,
  project,
  canComplete,
  progress,
  type Scope,
  type Contract,
  type Termination,
} from "@/modules/onboarding/model";
const rh: Scope = {
  journey: "offboarding",
  mode: "rh",
  user: "demo-rh",
  name: "RH fictício",
  key: "off-demo",
};
describe("Independent offboarding demo", () => {
  for (const contract of ["CLT", "Estágio", "PJ"] as Contract[])
    for (const termination of ["Voluntário", "Involuntário"] as Termination[])
      it(`combines ${contract} ${termination} without mixing exit types`, () => {
        const state = demoOffboarding(rh);
        const c = compose(
          state.templates,
          contract,
          "Operações",
          "Analista",
          termination,
        );
        expect(c.sources).toHaveLength(2);
        expect(c.sources.every((s) => s.includes(termination))).toBe(true);
        expect(
          c.institutional
            .flatMap((s) => s.tasks)
            .some((t) => t.title.includes("revogação fictícia")),
        ).toBe(true);
      });
  it("keeps onboarding and offboarding templates and tasks independent", () => {
    const off = demoOffboarding(rh),
      on = demoOnboarding({ ...rh, journey: "onboarding" });
    off.processes[0].technical[0].tasks[0].done = true;
    expect(on.processes[0].technical[0].tasks[0].done).toBe(false);
    expect(
      off.processes.every((p) => !on.processes.some((o) => o.id === p.id)),
    ).toBe(true);
    expect(off.templates.every((t) => !!t.termination)).toBe(true);
  });
  it("redacts every RH stage, sources, termination type and private event for leaders", () => {
    const state = demoOffboarding(rh);
    state.processes[0].technical.push({
      ...structuredClone(state.processes[0].institutional[0]),
      id: "sensitive-mixed",
    });
    const leader = { ...rh, mode: "leader" as const };
    const view = project(state, leader);
    expect(view.processes).toHaveLength(4);
    for (const p of view.processes) {
      expect(p.institutional).toHaveLength(0);
      expect(p.sources).toHaveLength(0);
      expect(p.termination).toBeUndefined();
      expect(p.technical.every((s) => s.owner === "Liderança")).toBe(true);
    }
    expect(view.events.every((e) => e.track === "technical")).toBe(true);
    expect(JSON.stringify(view)).not.toContain(
      "Pendências administrativas e contratuais",
    );
  });
  it("exposes no offboarding data to professional profiles", () => {
    const view = project(demoOffboarding(rh), { ...rh, mode: "professional" });
    expect(view.processes).toHaveLength(0);
    expect(view.templates).toHaveLength(0);
    expect(view.events).toHaveLength(0);
  });
  it("allows only owned operational completion for leaders", () => {
    const p = demoOffboarding(rh).processes[0];
    const leader = { ...rh, mode: "leader" as const };
    expect(canComplete(leader, p, "institutional", p.institutional[0])).toBe(
      false,
    );
    expect(canComplete(leader, p, "technical", p.technical[0])).toBe(true);
    expect(
      canComplete({ ...leader, user: "other" }, p, "technical", p.technical[0]),
    ).toBe(false);
    expect(canComplete(leader, p, "technical", p.institutional[0])).toBe(false);
  });
  it("requires both administrative and operational tasks for overall completion", () => {
    const p = demoOffboarding(rh).processes[0];
    p.technical.forEach((s) => s.tasks.forEach((t) => (t.done = true)));
    expect(progress([...p.institutional, ...p.technical])).toBeLessThan(100);
    expect(
      p.institutional.some((s) => s.tasks.some((t) => t.required && !t.done)),
    ).toBe(true);
  });
  it("only uses approved sector-specific exit models", () => {
    const state = demoOffboarding(rh);
    expect(
      compose(state.templates, "CLT", "Arquitetura", "Analista", "Voluntário")
        .sources[1],
    ).not.toContain("Transferência de projetos · Arquitetura");
    state.templates.at(-1)!.status = "Aprovado";
    expect(
      compose(state.templates, "CLT", "Arquitetura", "Analista", "Voluntário")
        .sources[1],
    ).toContain("Transferência de projetos · Arquitetura");
    expect(() =>
      compose(
        state.templates.filter((t) => t.termination === "Voluntário"),
        "PJ",
        "Operações",
        "Analista",
        "Involuntário",
      ),
    ).toThrow();
  });
});
