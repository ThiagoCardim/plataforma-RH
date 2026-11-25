import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoRecruitment, baseForm } from "@/modules/recruitment/fixtures";
import { demoOnboarding } from "@/modules/onboarding/fixtures";
import { type Scope } from "@/modules/career/model";
import { adoptOnboarding } from "@/modules/recruitment/handoff-model";
import {
  type State,
  allowedView,
  funnelConversion,
  projection,
  saveJob,
  jobState,
  duplicateJob,
  saveCandidate,
  duplicates,
  linkCandidate,
  updateStage,
  moveApplication,
  assign,
  revokeAssignment,
  addNote,
  schedule,
  saveForm,
  visibleFields,
  validateFields,
  saveTemplate,
  inviteAssessment,
  answerAssessment,
  match,
  analyzeBatch,
  talentSearch,
  emptyFilters,
  saveFilter,
  saveRule,
  decide,
  saveOffer,
  offerState,
  requestException,
  reviewException,
  formalize,
  prepareHandoff,
  privacySettings,
  erase,
  submitCareer,
} from "@/modules/recruitment/model";
const rh: Scope = {
  org: "org-a",
  user: "rh",
  name: "RH fictício",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
  key: "rh",
};
const dir = {
  ...rh,
  rh: false,
  director: true,
  user: "director",
  key: "director",
};
const leader = {
  ...rh,
  rh: false,
  leader: true,
  user: "leader",
  key: "leader",
};
const member = { ...rh, rh: false, user: "member" };
const s0 = () => demoRecruitment(rh);
const job = "rec-job-0",
  app = "rec-application-0",
  person = "rec-candidate-0";
const current = (s: State) => s.applications.find((a) => a.id === app)!;
function accepted() {
  let s = decide(
    s0(),
    rh,
    app,
    true,
    "Parecer humano favorável à continuidade.",
  );
  s = saveOffer(s, rh, app, 500000, "Condições fictícias conferidas.");
  const id = s.offers.find((o) => o.application === app)!.id;
  s = offerState(s, rh, id, "Enviada (simulação)");
  return offerState(s, rh, id, "Aceita");
}
describe("Recruitment authenticated scope and private projections", () => {
  it("only HR has all sections; director/leader have scoped management and employees none", () => {
    expect(allowedView(rh, "match")).toBe(true);
    expect(allowedView(dir, "vagas")).toBe(true);
    expect(allowedView(dir, "talentos")).toBe(false);
    expect(allowedView(leader, "modelos")).toBe(false);
    expect(allowedView(member, "carreiras")).toBe(false);
  });
  it("rejects cross-organization reads and writes", () => {
    const s = s0(),
      c = { ...rh, org: "other" };
    for (const f of [
      () => projection(s, c),
      () => saveJob(s, c, s.jobs[0]),
      () => analyzeBatch(s, c, job, [person]),
      () => linkCandidate(s, c, person, job),
      () => formalize(s, c, app, true),
    ])
      expect(f).toThrow(/Organização/);
  });
  it("directors never receive resumes, DISC, private notes, answers, match analyses or personal identities", () => {
    const s = projection(s0(), dir),
      text = JSON.stringify(s);
    expect(s.candidates[0].name).toBe("Candidato 001");
    expect(s.jobs[0].budget).toBeDefined();
    expect(s.assessments).toEqual([]);
    expect(s.notes).toEqual([]);
    expect(s.analyses).toEqual([]);
    for (const e of s.applications) {
      expect(e.answers).toEqual({});
      expect(e.fields).toEqual({});
    }
    for (const secret of [
      "Resposta fictícia confidencial",
      "Observação confidencial demonstrativa",
      "talento-0@",
      "private-demo-token",
    ])
      expect(text).not.toContain(secret);
  });
  it("leader sees only assigned candidates and shared technical content, never budgets or HR triage fields", () => {
    const s = demoRecruitment(leader);
    expect(s.applications).toHaveLength(2);
    expect(s.candidates).toHaveLength(2);
    expect(
      s.jobs.every((j) => j.budget === undefined && j.cost === undefined),
    ).toBe(true);
    expect(s.offers).toEqual([]);
    expect(s.assessments).toEqual([]);
    expect(s.notes.every((n) => n.kind !== "Confidencial RH" && n.shared)).toBe(
      true,
    );
    expect(
      s.applications.every((a) => Object.keys(a.fields).length === 0),
    ).toBe(true);
    expect(JSON.stringify(s)).not.toContain(
      "Inscrição demonstrativa conferida.",
    );
  });
  it.each([dir, leader, member])("blocks HR-only mutations for $user", (c) => {
    const s = s0();
    for (const f of [
      () => saveJob(s, c, s.jobs[0]),
      () => saveCandidate(s, c, s.candidates[0]),
      () => decide(s, c, app, true, "Test"),
      () => formalize(s, c, app, true),
      () => saveForm(s, c, s.forms[0]),
      () => erase(s, c, person, "Test"),
    ])
      expect(f).toThrow();
  });
  it("RH designates and revokes local leadership access; technical reviewers cannot read or write private notes", () => {
    let s = s0();
    s = assign(s, rh, app, leader.user, true, false);
    let v = projection(s, leader);
    expect(v.applications.map((a) => a.id)).toContain(app);
    s = addNote(s, leader, {
      application: app,
      kind: "Técnica",
      text: "Análise técnica designada.",
      shared: true,
    });
    expect(() =>
      addNote(s, leader, {
        application: app,
        kind: "Confidencial RH",
        text: "No",
        shared: false,
      }),
    ).toThrow();
    expect(() =>
      addNote(s, leader, {
        application: "rec-application-2",
        kind: "Técnica",
        text: "No",
        shared: true,
      }),
    ).toThrow();
    s = revokeAssignment(s, rh, app, leader.user);
    v = projection(s, leader);
    expect(v.applications).toEqual([]);
  });
});
describe("Vacancies, snapshots and human-owned Kanban", () => {
  it("creates and duplicates drafts without copying candidates/offers or closing existing jobs", () => {
    const s = s0(),
      next = duplicateJob(s, rh, job);
    expect(next.jobs[0].id).not.toBe(job);
    expect(next.jobs[0].state).toBe("Rascunho");
    expect(next.applications).toEqual(s.applications);
    expect(next.offers).toEqual(s.offers);
  });
  it("permits publication/pause/closure but no editing/republication of closed jobs", () => {
    let s = jobState(s0(), rh, job, "Pausada");
    expect(s.jobs.find((j) => j.id === job)!.state).toBe("Pausada");
    s = jobState(s, rh, job, "Publicada");
    s = jobState(s, rh, job, "Encerrada");
    expect(() => jobState(s, rh, job, "Publicada")).toThrow();
    expect(() =>
      saveJob(
        s,
        rh,
        s.jobs.find((j) => j.id === job)!,
      ),
    ).toThrow();
  });
  it("occupied stages cannot disappear and later edits preserve candidate stage/form snapshots", () => {
    const s = s0(),
      j = structuredClone(s.jobs[0]);
    j.stages = j.stages.filter((x) => x.id !== "stage-0");
    expect(() => saveJob(s, rh, j)).toThrow(/ocupada/);
    j.stages = structuredClone(s.jobs[0].stages);
    j.stages[0].tasks[0].title = "New future checklist";
    j.form.fields[0].label = "Future question";
    const next = saveJob(s, rh, j);
    expect(current(next).stages[0].tasks[0].title).toBe(
      current(s).stages[0].tasks[0].title,
    );
    expect(current(next).form).toEqual(current(s).form);
  });
  it("requires checklists, fields and reason before advancing; backwards movement preserves history", () => {
    let s = s0();
    s = updateStage(s, rh, app, {}, {});
    expect(() => moveApplication(s, rh, app, "stage-1", "Move")).toThrow(
      /obrigatórios/,
    );
    s = updateStage(s, rh, app, {}, { "stage-0:check-0": true });
    expect(() => moveApplication(s, rh, app, "stage-1", "Move")).toThrow(
      /campos/,
    );
    s = updateStage(
      s,
      rh,
      app,
      { "stage-0:summary": "Contexto profissional conferido." },
      { "stage-0:check-0": true },
    );
    expect(() => moveApplication(s, rh, app, "stage-1", "")).toThrow(/motivo/);
    s = moveApplication(s, rh, app, "stage-1", "RH revisou");
    expect(current(s).visits.at(-1)!.stage).toBe("stage-1");
    expect(moveApplication(s, rh, app, "stage-1", "Again")).toBe(s);
    s = moveApplication(s, rh, app, "stage-0", "Revisão adicional");
    expect(current(s).events.at(-1)!.text).toContain("Revisão adicional");
  });
  it("one candidate can join multiple jobs while repeated same-job linking is idempotent", () => {
    let s = s0();
    const n = s.applications.length;
    s = linkCandidate(s, rh, person, job);
    expect(s.applications).toHaveLength(n);
    s = linkCandidate(s, rh, "rec-candidate-7", job);
    expect(s.applications).toHaveLength(n + 1);
    s = linkCandidate(s, rh, "rec-candidate-7", "rec-job-1");
    expect(s.applications).toHaveLength(n + 2);
    expect(() => linkCandidate(s, rh, person, "rec-job-1")).toThrow(
      /incompatíveis/,
    );
  });
  it("scheduling creates only local calendar data and automation log; no external communication", () => {
    const s = schedule(s0(), rh, {
      application: app,
      title: "Entrevista fictícia",
      date: "2027-01-20",
      time: "14:00",
      responsible: "RH",
      note: "Contexto",
      state: "Agendada",
    });
    expect(s.interviews).toHaveLength(2);
    expect(s.logs.at(-1)!.action).toContain("calendário local");
    expect(s).not.toHaveProperty("emailsSent");
  });
});
describe("Forms, talent database and professional evidence only", () => {
  it("identifies likely duplicates without silent merging and supports combined saved filters", () => {
    let s = s0();
    expect(duplicates(s, { ...s.candidates[0], id: "other" })).toHaveLength(1);
    const f = {
      ...emptyFilters(),
      software: "Revit",
      city: "Curitiba",
      contract: "PJ",
    };
    expect(
      talentSearch(s, f).every(
        (p) => p.software.includes("Revit") && p.city === "Curitiba",
      ),
    ).toBe(true);
    s = saveFilter(s, rh, "Consulta fictícia", f);
    expect(s.filters[0].value).toEqual(f);
  });
  it("supports conditional visibility and refuses cycles/reordered dependencies", () => {
    const form = baseForm();
    form.fields.push({
      id: "extra",
      label: "Qual software?",
      mapping: "software",
      required: true,
      type: "Texto",
      options: [],
      condition: { field: "field-sector", equals: "Engenharia" },
    });
    validateFields(form.fields);
    expect(
      visibleFields(form, { "field-sector": "Arquitetura" }).some(
        (f) => f.id === "extra",
      ),
    ).toBe(false);
    expect(
      visibleFields(form, { "field-sector": "Engenharia" }).some(
        (f) => f.id === "extra",
      ),
    ).toBe(true);
    const reversed = {
      ...form,
      fields: [form.fields.at(-1)!, ...form.fields.slice(0, -1)],
    };
    expect(() => validateFields(reversed.fields)).toThrow(/anteriores/);
  });
  it("saves customizable forms separately; prior application answers remain bound to original form", () => {
    const s = s0(),
      f = structuredClone(s.forms[0]);
    f.fields[0].label = "Novo rótulo";
    const next = saveForm(s, rh, f);
    expect(next.forms[0].version).toBe(2);
    expect(current(next).form.fields[0].label).not.toBe("Novo rótulo");
  });
  it("protected career submission validates actual canonical form, consent and exclusive token; deduplicates email", () => {
    let s = s0();
    const j = s.jobs[0],
      a = {
        "field-name": "Teste Público Fictício",
        "field-email": "talento-teste@exemplo.invalid",
        "field-sector": "Arquitetura",
      };
    expect(() => submitCareer(s, rh, j.id, j.form, a, {}, false)).toThrow(
      /fictício/,
    );
    expect(() =>
      submitCareer(s, rh, "rec-job-1", s.jobs[1].form, a, {}, true, "wrong"),
    ).toThrow(/exclusivo/);
    s = submitCareer(s, rh, j.id, j.form, a, {}, true);
    const count = s.candidates.length,
      n = s.applications.length;
    s = submitCareer(s, rh, j.id, j.form, a, {}, true);
    expect(s.candidates).toHaveLength(count);
    expect(s.applications).toHaveLength(n);
    expect(
      s.candidates.find((p) => p.email === a["field-email"])!.consent,
    ).toContain("finalidade v1");
  });
  it("rejects remote resume storage and leaves imports local/manual", () => {
    const s = s0(),
      p = {
        ...s.candidates[0],
        cv: {
          id: "remote",
          name: "x.pdf",
          type: "application/pdf",
          size: 20,
          url: "https://example.com/real-cv.pdf",
        },
      };
    expect(() => saveCandidate(s, rh, p)).toThrow(/local/);
  });
  it("Match distinguishes documented, explicitly unmet, missing and conflicting evidence", () => {
    const s = s0(),
      j = s.jobs[0],
      p = s.candidates.find((p) => p.id === "rec-candidate-2")!,
      r = match(j, p);
    expect(r.criteria.find((x) => x.criterion.expected === "BIM")!.status).toBe(
      "Comprovado",
    );
    expect(
      r.criteria.find((x) => x.criterion.expected === "Revit")!.status,
    ).toBe("Não atendido");
    expect(
      r.criteria.find((x) => x.criterion.expected === "30 dias")!.status,
    ).toBe("Não informado");
    const conflicting = match(j, {
      ...p,
      claims: [
        ...p.claims,
        {
          id: "conflict",
          field: "Softwares",
          value: "Revit",
          status: "Documentado",
          source: "Outra fonte fictícia",
        },
      ],
    });
    expect(conflicting.criteria[1].status).toBe("Não informado");
    expect(match(j, { ...p, claims: [] }).percentage).toBeNull();
  });
  it("missing mandatory information never rejects or moves a candidate; batch analysis snapshots and preserves job revision", () => {
    const s = s0(),
      next = analyzeBatch(s, rh, job, [person, "rec-candidate-2"]);
    expect(next.analyses).toHaveLength(2);
    expect(next.applications).toEqual(s.applications);
    expect(next.candidates).toEqual(s.candidates);
    expect(next.offers).toEqual(s.offers);
    expect(next.analyses[0].result.coverage).toBe(0);
  });
  it.each([
    "idade",
    "gênero",
    "raça",
    "religião",
    "deficiência",
    "estado civil",
    "aparência",
  ])("refuses protected/irrelevant criterion %s", (expected) => {
    const s = s0(),
      j = {
        ...s.jobs[0],
        criteria: [
          {
            id: "bad",
            field: "Competências" as const,
            expected,
            weight: 20,
            mandatory: true,
          },
        ],
      };
    expect(() => saveJob(s, rh, j)).toThrow(/características/);
  });
  it("questionnaire links/answers are individual, versioned, RH-only, without diagnosis", () => {
    let s = s0();
    s = inviteAssessment(s, rh, person, "template-0");
    const x = s.assessments[0];
    expect(x.token).toBeTruthy();
    expect(
      inviteAssessment(s, rh, person, "template-0").assessments,
    ).toHaveLength(s.assessments.length);
    expect(() =>
      answerAssessment(s, leader, x.id, { "0": "A", "1": "B" }),
    ).toThrow();
    s = answerAssessment(s, rh, x.id, {
      "0": "Resposta fictícia A",
      "1": "Resposta fictícia B",
    });
    expect(s.assessments[0].completedAt).toBeTruthy();
    expect(s.assessments[0]).not.toHaveProperty("diagnosis");
    const model = {
      ...s.templates.find((t) => t.id === "template-0")!,
      body: "Versão futura",
    };
    s = saveTemplate(s, rh, model);
    expect(s.assessments[0].template.version).toBe(1);
  });
});
describe("Automations, financial gates and explicit admission", () => {
  it("automation toggles/conditions are local and cannot make hiring decisions", () => {
    let s = s0();
    s = saveRule(s, rh, { ...s.rules[0], active: false });
    s = linkCandidate(s, rh, "rec-candidate-7", job);
    expect(s.logs).toEqual([]);
    s = decide(s, rh, app, true, "Continuidade humana");
    expect(
      s.offers.some((o) => o.application === app && o.state === "Preparação"),
    ).toBe(true);
    expect(current(s).status).toBe("Ativa");
    expect(current(s).stage).toBe("stage-0");
  });
  it("proposal cannot be prepared without RH approval or sent with an incomplete automated draft", () => {
    const s = s0();
    expect(() => saveOffer(s, rh, app, 500000, "Condições")).toThrow(/aprovar/);
    const next = decide(s, rh, app, true, "Conferido");
    const offer = next.offers.find((o) => o.application === app)!;
    expect(() => offerState(next, rh, offer.id, "Enviada (simulação)")).toThrow(
      /valor/,
    );
  });
  it("above-budget proposal needs director review of the exact amount and distinct actor", () => {
    let s = decide(s0(), rh, app, true, "Conferido");
    s = saveOffer(s, rh, app, 750000, "Condições");
    let offer = s.offers.find((o) => o.application === app)!;
    expect(() => offerState(s, rh, offer.id, "Enviada (simulação)")).toThrow(
      /Diretoria/,
    );
    s = requestException(
      s,
      rh,
      app,
      750000,
      "Justificativa financeira fictícia",
    );
    const x = s.exceptions[0];
    expect(() => reviewException(s, rh, x.id, true, "Test")).toThrow();
    expect(() =>
      reviewException(s, { ...rh, director: true }, x.id, true, "Test"),
    ).toThrow(/distinto/);
    s = reviewException(s, dir, x.id, true, "Viabilidade conferida.");
    s = offerState(s, rh, offer.id, "Enviada (simulação)");
    offer = s.offers.find((o) => o.id === offer.id)!;
    expect(offer.state).toBe("Enviada (simulação)");
  });
  it("formalization needs all gates, explicit confirmation, available positions and HR; repeating is idempotent", () => {
    let s = accepted();
    expect(() => formalize(s, rh, app, false)).toThrow(/Confirme/);
    expect(() => formalize(s, dir, app, true)).toThrow();
    s = formalize(s, rh, app, true);
    expect(current(s).status).toBe("Contratada");
    expect(formalize(s, rh, app, true)).toBe(s);
    expect(s).not.toHaveProperty("authUsers");
  });
  it("authorized handoff and Onboarding reuse canonical data exactly once, without identity/account creation", () => {
    let s = formalize(accepted(), rh, app, true);
    expect(() => prepareHandoff(s, rh, app, ["name", "cv"])).toThrow(/campos/);
    s = prepareHandoff(s, rh, app, ["name", "email"]);
    expect(prepareHandoff(s, rh, app, ["name"]).handoffs).toHaveLength(1);
    const target = demoOnboarding({
        mode: "rh",
        user: rh.user,
        name: rh.name,
        key: "test-onboarding",
      }),
      next = adoptOnboarding(target, s, rh, s.handoffs[0].id);
    expect(next.processes).toHaveLength(target.processes.length + 1);
    expect(next.processes[0].name).toBe(s.handoffs[0].fields.name);
    expect(next.processes[0].user).toMatch(/^unlinked:/);
    expect(next.processes[0]).not.toHaveProperty("email");
    expect(adoptOnboarding(next, s, rh, s.handoffs[0].id)).toBe(next);
    expect(() => adoptOnboarding(next, s, dir, s.handoffs[0].id)).toThrow();
  });
  it("privacy changes preserve prior retention; erasure removes personal data, files, notes, profile and analysis snapshots", () => {
    let s = analyzeBatch(s0(), rh, job, [person]);
    const old = s.candidates[0].retentionUntil;
    s = privacySettings(s, rh, "Finalidade local revisada", 30);
    expect(s.candidates[0].retentionUntil).toBe(old);
    s = erase(s, rh, person, "Pedido de teste");
    const text = JSON.stringify(s);
    expect(s.candidates.find((p) => p.id === person)!.name).toBe(
      "Cadastro removido",
    );
    expect(text).not.toContain("talento-0@exemplo.invalid");
    expect(text).not.toContain("Observação confidencial demonstrativa");
    expect(text).not.toContain("Resposta fictícia confidencial");
    expect(s.analyses).toEqual([]);
    expect(s.candidates.filter((p) => p.erased)).toHaveLength(1);
  });
});

describe("Conditional internal step fields", () => {
  it("requires only currently visible fields before manual advancement", () => {
    let s = s0();
    const a = current(s),
      step = a.stages[0];
    step.fields = [
      {
        id: "choice",
        label: "Precisa de confirmação?",
        type: "Seleção",
        options: ["Sim", "Não"],
        required: true,
        mapping: "",
      },
      {
        id: "explain",
        label: "Contexto adicional",
        type: "Parágrafo",
        options: [],
        required: true,
        mapping: "",
        condition: { field: "choice", equals: "Sim" },
      },
    ];
    s = updateStage(
      s,
      rh,
      app,
      { "stage-0:choice": "Não" },
      { "stage-0:check-0": true },
    );
    expect(
      moveApplication(
        s,
        rh,
        app,
        "stage-1",
        "RH confirmou a etapa.",
      ).applications.find((x) => x.id === app)!.stage,
    ).toBe("stage-1");
    s = updateStage(
      s,
      rh,
      app,
      { "stage-0:choice": "Sim" },
      { "stage-0:check-0": true },
    );
    expect(() =>
      moveApplication(s, rh, app, "stage-1", "RH confirmou."),
    ).toThrow(/campos/);
  });
});

describe("Funnel conversion with skipped steps", () => {
  it("does not inflate the previous-step conversion or exceed 100 percent", () => {
    const a = current(s0()),
      rows = [
        {
          ...a,
          id: "skip",
          visits: [
            { stage: "stage-0", at: "x" },
            { stage: "stage-2", at: "x" },
          ],
        },
        {
          ...a,
          id: "previous",
          visits: [
            { stage: "stage-0", at: "x" },
            { stage: "stage-1", at: "x" },
          ],
        },
      ];
    expect(funnelConversion(rows, "stage-2", "stage-1")).toBe(0);
    expect(funnelConversion(rows, "stage-0")).toBe(100);
    expect(funnelConversion(rows, "stage-3", "never")).toBeNull();
  });
});

describe("Attachments shared via application answers", () => {
  it("requires explicit resume/file permission even when textual answers are shared", () => {
    let s = s0();
    const a = s.applications.find((x) => x.id === app)!;
    a.answerFiles = {
      "field-cv": {
        id: "cv-secret",
        name: "cv-private.pdf",
        size: 20,
        type: "application/pdf",
        url: "blob:private-cv",
      },
    };
    s = assign(s, rh, app, leader.user, false, true);
    const denied = projection(s, leader);
    expect(denied.applications[0].answers).not.toEqual({});
    expect(denied.applications[0].answerFiles).toEqual({});
    expect(JSON.stringify(denied)).not.toContain("private-cv");
    s = assign(s, rh, app, leader.user, true, true);
    expect(
      projection(s, leader).applications[0].answerFiles["field-cv"].id,
    ).toBe("cv-secret");
  });
});
