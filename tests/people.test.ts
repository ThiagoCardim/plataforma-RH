import { describe, expect, it } from "vitest";
import { createDemoPeople } from "@/modules/people/demo-data";
import {
  currentEngagement,
  draftFromPerson,
  filterPeople,
  hasOverlap,
  personStatus,
  simulateSave,
  validateDraft,
} from "@/modules/people/model";
const fixtures = createDemoPeople("org-a");
const blankFilters = { search: "", department: "", type: "", status: "" };
describe("in-memory people contract", () => {
  it("keeps account, person and historical contracts independent", () => {
    expect(fixtures.some((p) => p.access === "none")).toBe(true);
    expect(fixtures[0].engagements).toHaveLength(2);
    expect(currentEngagement(fixtures[0])?.start).toBe("2026-03-02");
    expect(
      fixtures.every(
        (p) =>
          p.engagements.filter(
            (e) => e.start <= "2026-11-13" && (!e.end || e.end >= "2026-11-13"),
          ).length <= 1,
      ),
    ).toBe(true);
  });
  it("normalizes accent and case search and applies combined filters within organization", () => {
    const all = [...fixtures, ...createDemoPeople("org-b")];
    expect(
      filterPeople(all, "org-a", { ...blankFilters, search: "ANDRE" }).map(
        (p) => p.name,
      ),
    ).toEqual(["André Cenário"]);
    expect(
      filterPeople(all, "org-a", {
        ...blankFilters,
        type: "pj",
        status: "Vigente",
        department: "Engenharia",
      }),
    ).toHaveLength(1);
    expect(filterPeople(all, "org-c", blankFilters)).toEqual([]);
  });
  it("rejects invalid dates, catalogs, contact and required fields", () => {
    const draft = draftFromPerson();
    expect(validateDraft(draft)).toMatchObject({
      name: expect.any(String),
      start: expect.any(String),
      position: expect.any(String),
      department: expect.any(String),
      unit: expect.any(String),
    });
    expect(
      validateDraft({
        ...draftFromPerson(fixtures[0]),
        start: "2026-02-30",
        department: "foreign",
        email: "wrong",
      }),
    ).toMatchObject({
      start: expect.any(String),
      department: expect.any(String),
      email: expect.any(String),
    });
  });
  it("creates a new person without Auth, with optional contact and conditional details", () => {
    const draft = {
      ...draftFromPerson(fixtures[0]),
      name: "Nova Exemplo",
      email: "",
      phone: "",
      type: "pj" as const,
      detail: "Consultoria demonstrativa",
    };
    const result = simulateSave(fixtures, "org-a", draft, "demo-new");
    expect("person" in result).toBe(true);
    if (!("person" in result)) return;
    expect(result.person.access).toBe("none");
    expect(result.person.engagements[0].type).toBe("pj");
    expect(fixtures).toHaveLength(14);
  });
  it("edits a current engagement without erasing old contracts or previous events", () => {
    const before = JSON.stringify(fixtures[0]);
    const draft = {
      ...draftFromPerson(fixtures[0]),
      department: "Engenharia",
      leader: "Helena Traço",
      position: "Coordenação de projetos",
    };
    const result = simulateSave(
      fixtures,
      "org-a",
      draft,
      "event-edit",
      fixtures[0].id,
    );
    expect("person" in result).toBe(true);
    if (!("person" in result)) return;
    expect(JSON.stringify(fixtures[0])).toBe(before);
    expect(result.person.engagements[0]).toEqual(fixtures[0].engagements[0]);
    expect(result.person.history.slice(0, fixtures[0].history.length)).toEqual(
      fixtures[0].history,
    );
    expect(result.person.history.slice(-4).map((e) => e.title)).toEqual([
      "Alteração de setor",
      "Alteração de cargo ou função",
      "Alteração de liderança",
      "Edição cadastral simulada",
    ]);
  });
  it("rejects cross-organization IDs and changing type or initial date", () => {
    expect(
      simulateSave(
        fixtures,
        "org-b",
        draftFromPerson(fixtures[0]),
        "event",
        fixtures[0].id,
      ),
    ).toHaveProperty("errors.form");
    expect(
      simulateSave(
        fixtures,
        "org-a",
        { ...draftFromPerson(fixtures[0]), type: "pj" },
        "event",
        fixtures[0].id,
      ),
    ).toHaveProperty("errors.form");
    expect(
      simulateSave(
        fixtures,
        "org-a",
        { ...draftFromPerson(fixtures[0]), start: "2026-01-01" },
        "event",
        fixtures[0].id,
      ),
    ).toHaveProperty("errors.form");
  });
  it("preserves ended engagements and labels scheduled relations separately", () => {
    expect(personStatus(fixtures[5])).toBe("Encerrado");
    expect(
      simulateSave(
        fixtures,
        "org-a",
        draftFromPerson(fixtures[5]),
        "event",
        fixtures[5].id,
      ),
    ).toHaveProperty("errors.form");
    const result = simulateSave(
      fixtures,
      "org-a",
      { ...draftFromPerson(fixtures[0]), start: "2027-01-01" },
      "new-scheduled",
    );
    if (!("person" in result)) throw new Error("Expected scheduled fixture");
    expect(personStatus(result.person)).toBe("Programado");
    expect(currentEngagement(result.person)).toBeUndefined();
  });
  it("rejects overlap of inclusive periods while permitting re-entry after end", () => {
    const first = fixtures[0].engagements[0];
    expect(
      hasOverlap([first], { ...first, id: "next", start: first.end! }),
    ).toBe(true);
    expect(
      hasOverlap([first], {
        ...first,
        id: "next",
        start: "2026-01-01",
        end: undefined,
      }),
    ).toBe(false);
  });
});
