import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoCulture } from "@/modules/culture/fixtures";
import { demoPerformance } from "@/modules/performance/fixtures";
import { type Scope } from "@/modules/career/model";
import {
  latest,
  projection,
  saveDraft,
  publish,
  restoreVersion,
  confirmReading,
  culturalRecognitions,
  type CultureState,
  type Receipt,
} from "@/modules/culture/model";
const rh: Scope = {
  user: "hr",
  name: "RH demonstrativo",
  org: "org-a",
  key: "rh",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
};
const employee = { ...rh, rh: false, user: "employee", key: "employee" };
const leader = { ...employee, leader: true, user: "leader" };
const pj = { ...employee, contract: "PJ" as const, user: "pj" };
const intern = { ...employee, contract: "Estágio" as const };
const state = () => demoCulture(rh);
function manual(s = state()) {
  const d = structuredClone(latest(s)!.content);
  d.manual = {
    ...d.manual,
    ready: true,
    chapters: [
      {
        id: "chapter-one",
        title: "Manual fictício",
        blocks: [
          {
            id: "text-one",
            type: "text",
            text: "Somente uma demonstração. Não é conteúdo institucional.",
          },
        ],
      },
    ],
  };
  return publish(saveDraft(s, rh, d), rh, "Publicar manual de teste");
}
function changeManual(s: CultureState, text = "Edição fictícia revisada") {
  const d = structuredClone(latest(s)!.content);
  d.manual.chapters[0].blocks[0].text = text;
  return publish(saveDraft(s, rh, d), rh, "Nova edição do manual");
}
describe("Cultura: projeções e curadoria institucional", () => {
  it("uses only the given values/goals and leaves unknown institutional facts unfilled", () => {
    const s = state(),
      d = latest(s)!.content;
    expect(
      d.sections
        .find((x) => x.layout === "Valores")!
        .items.map((i) => [i.title, i.group]),
    ).toEqual([
      ["Postura de Dono", "Alicerce da cultura"],
      ["Melhoria Contínua", "Alicerce da cultura"],
      ["Atitude", "Como vivemos na prática"],
      ["Sede de Crescimento", "Como vivemos na prática"],
      ["Lealdade", "Como vivemos na prática"],
    ]);
    expect(d.manual.ready).toBe(false);
    expect(d.sections.find((x) => x.layout === "Timeline")!.items).toEqual([]);
    expect(
      d.sections.find((x) => x.layout === "Jornada")!.items[0].current,
    ).toBeUndefined();
  });
  it.each([employee, leader, pj])(
    "denies management to non-manager $user",
    (c) => {
      const s = state();
      expect(() => saveDraft(s, c, latest(s)!.content)).toThrow(/exclusiva/);
      expect(() => publish(s, c, "Test")).toThrow();
      expect(() => restoreVersion(s, c, s.versions[0].id)).toThrow();
    },
  );
  it.each([rh, { ...rh, rh: false, director: true }])(
    "allows RH/Director to draft and publish without mutating earlier versions",
    (c) => {
      const s = state(),
        d = structuredClone(latest(s)!.content);
      d.hero.title = "Banner oficial de teste";
      const saved = saveDraft(s, c, d);
      expect(latest(saved)!.content.hero.title).not.toBe(d.hero.title);
      const published = publish(saved, c, "Atualização do banner");
      expect(latest(published)!.content.hero.title).toBe(d.hero.title);
      expect(published.versions[0]).toEqual(s.versions[0]);
      expect(published.draft).toBeUndefined();
    },
  );
  it("never serializes drafts or previous confidential versions to readers", () => {
    const s = state(),
      d = structuredClone(latest(s)!.content);
    d.hero.title = "SEGREDO DO RASCUNHO";
    const projected = projection(saveDraft(s, rh, d), employee);
    expect(projected.versions).toHaveLength(1);
    expect(projected.draft).toBeUndefined();
    expect(JSON.stringify(projected)).not.toContain("SEGREDO");
    expect(projected.events).toEqual([]);
  });
  it("hides employee sections and the manual for PJ even when sections exist in storage", () => {
    const view = projection(manual(), pj);
    expect(latest(view)!.content.manual).toMatchObject({
      ready: false,
      chapters: [],
      version: 0,
    });
    expect(
      latest(view)!.content.sections.every(
        (s) =>
          s.partnerRelevant &&
          !["Valores", "Rituais", "Hall", "Limites"].includes(s.layout),
      ),
    ).toBe(true);
    expect(
      latest(view)!.content.sections.some((s) => s.layout === "Apresentação"),
    ).toBe(true);
  });
  it("prevents accidental cultural commitments/PJ inclusion and requires explicit partnership relevance", () => {
    const s = state(),
      d = structuredClone(latest(s)!.content);
    d.sections.find((x) => x.layout === "Rituais")!.contracts.push("PJ");
    expect(() => saveDraft(s, rh, d)).toThrow(/destinados/);
    const intro = d.sections.find((x) => x.layout === "Apresentação")!;
    d.sections = d.sections.filter((s) => s.layout !== "Rituais");
    intro.partnerRelevant = false;
    expect(() => saveDraft(s, rh, d)).toThrow(/parceria/);
  });
  it("hides disabled or unauthorized sections and retains the published section order", () => {
    const s = state(),
      d = structuredClone(latest(s)!.content);
    d.sections.reverse();
    d.sections[0].visible = false;
    d.sections[1].contracts = ["Estágio"];
    const published = publish(saveDraft(s, rh, d), rh, "Ordem e audiência");
    const seen = latest(projection(published, employee))!.content.sections;
    expect(seen[0].id).toBe(d.sections[2].id);
    expect(
      seen.some((x) => x.id === d.sections[0].id || x.id === d.sections[1].id),
    ).toBe(false);
  });
  it("rejects organization spoofing across projection, publication, recovery and reading", () => {
    const s = manual(),
      other = { ...rh, org: "org-b" };
    for (const fn of [
      () => projection(s, other),
      () => saveDraft(s, other, latest(s)!.content),
      () => publish(s, other, "Test"),
      () => restoreVersion(s, other, s.versions[0].id),
      () => confirmReading(s, other, [], "Cultura", "culture-manual:2"),
    ])
      expect(fn).toThrow(/Organização/);
  });
  it("validates target/current without inventing progress or allowing misleading numbers", () => {
    const s = state(),
      d = structuredClone(latest(s)!.content),
      item = d.sections.find((x) => x.layout === "Jornada")!.items[0];
    item.current = 1001;
    expect(() => saveDraft(s, rh, d)).toThrow(/superar/);
    item.current = -1;
    expect(() => saveDraft(s, rh, d)).toThrow(/negativos/);
  });
  it("validates files, URLs, PDF types and content readiness before publication", () => {
    const s = state(),
      d = structuredClone(latest(s)!.content);
    d.sections[0].blocks = [
      { id: "bad", type: "link", text: "Unsafe", url: "javascript:alert(1)" },
    ];
    expect(() => saveDraft(s, rh, d)).toThrow(/inválido/);
    d.sections[0].blocks = [{ id: "video", type: "video", text: "Video" }];
    const saved = saveDraft(s, rh, d);
    expect(() => publish(saved, rh, "Test")).toThrow(/arquivo/);
    d.sections[0].blocks = [];
    d.manual.ready = true;
    expect(() => publish(saveDraft(s, rh, d), rh, "Test")).toThrow(
      /manual PDF/,
    );
    d.manual.pdf = {
      id: "bad",
      name: "evil.html",
      type: "text/html",
      size: 30,
      url: "blob:test",
    };
    expect(() => saveDraft(s, rh, d)).toThrow(/PDF/);
  });
});
describe("Manual versioning and a single Culture/Onboarding reading ledger", () => {
  it.each([employee, intern])(
    "records one actual-user receipt per version across both entrypoints $contract",
    (c) => {
      const s = manual(),
        id = `culture-manual:${latest(s)!.content.manual.version}`;
      const first = confirmReading(s, c, [], "Cultura", id);
      const repeated = confirmReading(s, c, first, "Onboarding", id);
      expect(repeated).toEqual(first);
      expect(repeated[0]).toMatchObject({
        user: c.user,
        org: c.org,
        source: "Cultura",
        contract: c.contract,
      });
    },
  );
  it("does not accept confirmation for absent or obsolete manuals or for PJ", () => {
    expect(() =>
      confirmReading(state(), employee, [], "Cultura", "culture-manual:1"),
    ).toThrow(/não disponível/);
    expect(() =>
      confirmReading(manual(), employee, [], "Cultura", "culture-manual:1"),
    ).toThrow(/mudou/);
    expect(() =>
      confirmReading(manual(), pj, [], "Cultura", "culture-manual:2"),
    ).toThrow(/PJ/);
  });
  it("new manual versions preserve earlier receipt content/time/source", () => {
    let s = manual();
    let rows = confirmReading(
      s,
      employee,
      [],
      "Onboarding",
      "culture-manual:2",
    );
    const original = structuredClone(rows[0]);
    s = changeManual(s);
    rows = confirmReading(s, employee, rows, "Cultura", "culture-manual:3");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(original);
    expect(rows[1].source).toBe("Cultura");
  });
  it("a page/visual publication does not demand duplicate manual acknowledgement", () => {
    let s = manual();
    const version = latest(s)!.content.manual.version,
      d = structuredClone(latest(s)!.content);
    d.hero.title = "Nova apresentação";
    s = publish(saveDraft(s, rh, d), rh, "Apenas apresentação");
    expect(latest(s)!.content.manual.version).toBe(version);
  });
  it("same local file identity survives object URL rehydration but replacement/link changes create a version", () => {
    let s = manual(),
      d = structuredClone(latest(s)!.content);
    d.manual.pdf = {
      id: "stable-pdf",
      name: "demo.pdf",
      type: "application/pdf",
      size: 100,
      url: "blob:first",
    };
    s = publish(saveDraft(s, rh, d), rh, "PDF");
    const n = latest(s)!.content.manual.version;
    d = structuredClone(latest(s)!.content);
    d.manual.pdf!.url = "blob:rehydrated";
    s = publish(saveDraft(s, rh, d), rh, "Recarregou");
    expect(latest(s)!.content.manual.version).toBe(n);
    d = structuredClone(latest(s)!.content);
    d.manual.pdf!.id = "replacement-pdf";
    s = publish(saveDraft(s, rh, d), rh, "Substituiu");
    expect(latest(s)!.content.manual.version).toBe(n + 1);
    d = structuredClone(latest(s)!.content);
    d.manual.chapters[0].blocks.push({
      id: "reference",
      type: "link",
      text: "Referência",
      url: "https://example.com/one",
    });
    s = publish(saveDraft(s, rh, d), rh, "Referência");
    const m = latest(s)!.content.manual.version;
    d = structuredClone(latest(s)!.content);
    d.manual.chapters[0].blocks.at(-1)!.url = "https://example.com/two";
    s = publish(saveDraft(s, rh, d), rh, "Link atualizado");
    expect(latest(s)!.content.manual.version).toBe(m + 1);
  });
  it("recovery is only a draft; publishing a historical manual is another new revision", () => {
    let s = manual();
    const old = latest(s)!;
    s = changeManual(s);
    const current = latest(s)!;
    s = restoreVersion(s, rh, old.id);
    expect(latest(s)).toEqual(current);
    expect(s.draft!.manual.chapters).toEqual(old.content.manual.chapters);
    s = publish(s, rh, "Recuperação revisada");
    expect(latest(s)!.content.manual.version).toBe(
      current.content.manual.version + 1,
    );
  });
  it("does not accept or retain another account/organization receipt", () => {
    const s = manual(),
      foreign = {
        id: "foreign",
        org: "org-b",
        user: "someone",
        contract: "CLT",
        manualVersion: 2,
        manualId: "culture-manual:2",
        title: "Other",
        at: "2026-01-01",
        source: "Cultura",
      } satisfies Receipt;
    const rows = confirmReading(
      s,
      employee,
      [foreign],
      "Cultura",
      "culture-manual:2",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].user).toBe(employee.user);
  });
});
describe("Cultural Hall is a published, read-only projection", () => {
  it("shares only published cultural messages, never evaluations, negatives, drafts or new awards", () => {
    const s = demoPerformance(rh),
      before = structuredClone(s);
    const view = culturalRecognitions(s, employee);
    expect(view.length).toBeGreaterThan(0);
    for (const x of view) {
      expect(Object.keys(x).sort()).toEqual(["id", "message", "month", "name"]);
      expect(s.awards.find((a) => a.id === x.id)!.status).toBe("Publicado");
    }
    expect(s).toEqual(before);
    expect(culturalRecognitions(s, pj)).toEqual([]);
    expect(() =>
      culturalRecognitions(s, { ...employee, org: "other" }),
    ).toThrow();
  });
});
