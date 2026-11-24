import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoOnboarding } from "@/modules/onboarding/fixtures";
import {
  compose,
  defaultDuration,
  project,
  canManage,
  canComplete,
  progress,
  overdue,
  type Scope,
} from "@/modules/onboarding/model";
const rh: Scope = {
  mode: "rh",
  user: "test-rh",
  name: "RH fictício",
  key: "test",
};
describe("Local onboarding rules", () => {
  it("defaults to CLT 90 days, intern 60 and editable PJ 30", () => {
    expect(defaultDuration("CLT")).toBe(90);
    expect(defaultDuration("Estágio")).toBe(60);
    expect(defaultDuration("PJ")).toBe(30);
  });
  it("composes approved models as independent process snapshots", () => {
    const state = demoOnboarding(rh);
    const c = compose(state.templates, "CLT", "Arquitetura", "Analista");
    expect(c.sources).toHaveLength(2);
    c.institutional[0].tasks[0].done = true;
    expect(state.templates[0].stages[0].tasks[0].done).toBe(false);
    expect(c.sources.join()).not.toContain("Ateliê");
  });
  it("prefers approved sector/job specificity", () => {
    const s = demoOnboarding(rh);
    s.templates.at(-1)!.status = "Aprovado";
    expect(
      compose(s.templates, "CLT", "Arquitetura", "Analista").sources[1],
    ).toContain("Ateliê");
  });
  it("refuses creation without both approved tracks", () => {
    expect(() => compose([], "PJ", "Operações", "Analista")).toThrow(
      "aprovados",
    );
  });
  it("limits leader ownership and technical write scope", () => {
    const leader = { ...rh, mode: "leader" as const };
    const state = demoOnboarding(leader);
    expect(state.processes).toHaveLength(4);
    expect(state.templates.every((t) => t.track === "technical")).toBe(true);
    const p = state.processes[0];
    expect(canManage(leader, p, "institutional")).toBe(false);
    expect(canManage(leader, p, "technical")).toBe(true);
    expect(canManage({ ...leader, user: "another" }, p, "technical")).toBe(
      false,
    );
  });
  it("projects only own authorized activities to professionals", () => {
    const professional = { ...rh, mode: "professional" as const };
    const state = project(demoOnboarding(rh), professional);
    expect(state.processes).toHaveLength(1);
    expect(state.templates).toHaveLength(0);
    expect(
      state.processes[0].institutional.every(
        (s) => s.public && s.owner === "Profissional",
      ),
    ).toBe(true);
    const p = state.processes[0];
    expect(
      canComplete(professional, p, "institutional", p.institutional[0]),
    ).toBe(true);
    expect(canManage(professional, p, "technical")).toBe(false);
  });
  it("tracks progress and overdue required tasks", () => {
    const p = demoOnboarding(rh).processes[0];
    expect(progress(p.institutional)).toBe(0);
    expect(overdue(p, p.institutional[0], new Date("2100-01-01"))).toBe(true);
    p.institutional.forEach((s) => s.tasks.forEach((t) => (t.done = true)));
    expect(progress(p.institutional)).toBe(100);
    expect(overdue(p, p.institutional[0], new Date("2100-01-01"))).toBe(false);
  });
});
