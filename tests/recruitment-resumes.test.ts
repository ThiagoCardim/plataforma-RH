import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { type Scope, dateNow } from "@/modules/career/model";
import {
  type State,
  type Candidate,
  saveOffer,
  decide,
} from "@/modules/recruitment/model";
import { demoWorkflow } from "@/modules/recruitment/workflow-fixtures";
import { demoResumeDatabase } from "@/modules/recruitment/resume-fixtures";
import {
  upgradeResumeDatabase,
  projectResumeDatabase,
  recordResumeChanges,
  freshness,
  saveResumeConfig,
  toggleTalent,
  recordContact,
  archiveProcesses,
  runArchiveRules,
  resumeCandidates,
  eligibleResumes,
  createUpdateRequests,
  revokeUpdateRequest,
  updateProjection,
  applyResumeUpdate,
  profileOf,
  registerResume,
  submitResumeIntake,
  openDuplicateReview,
  resolveDuplicate,
  purgeExpiredRevisions,
  resumeDuplicates,
} from "@/modules/recruitment/resume-model";
import {
  currentCycles,
  moveCentral,
  reactivateCycle,
  savePipeline,
} from "@/modules/recruitment/workflow-model";
import { clearWorkflowFilters } from "@/modules/recruitment/workflow-types";
import {
  startResumeProcess,
  eraseResumeData,
} from "@/modules/recruitment/resume-operations";
import {
  parseSpreadsheet,
  previewImport,
  commitDemoImport,
} from "@/modules/recruitment/resume-import";
const rh: Scope = {
  org: "org-a",
  user: "hr",
  name: "RH fictício",
  key: "rh",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
};
const dir = { ...rh, rh: false, director: true, user: "director" },
  leader = { ...rh, rh: false, leader: true, user: "leader" };
const s0 = () => upgradeResumeDatabase(demoWorkflow(rh), rh),
  person = "rec-candidate-0",
  app = "rec-application-0";
const profile = (s: State, id = person) =>
  profileOf(s.candidates.find((p) => p.id === id)!);
const freshCandidate = (s = s0()): Candidate => ({
  ...structuredClone(s.candidates[0]),
  id: crypto.randomUUID(),
  name: "Pessoa Nova Fictícia",
  email: "nova-cv@exemplo.invalid",
  phone: "(00) 93333-9999",
});
function invitation() {
  return createUpdateRequests(s0(), rh, [person]);
}
describe("Base central de currículos", () => {
  it("atualiza idempotentemente sem perder a antiga seleção de talentos e seu histórico", () => {
    const old = demoWorkflow(rh),
      s = upgradeResumeDatabase(old, rh);
    expect(s.central!.stages).toHaveLength(12);
    expect(s.central!.stages.some((st) => st.kind === "bank")).toBe(false);
    const bank = old.applications.find((a) => a.stage === "pipeline-9")!;
    expect(s.candidates.find((p) => p.id === bank.candidate)?.talent).toBe(
      true,
    );
    expect(s.applications.find((a) => a.id === bank.id)?.archived).toBeTruthy();
    expect(s.applications.find((a) => a.id === bank.id)?.visits).toEqual(
      bank.visits,
    );
    expect(s.notes).toEqual(old.notes);
    expect(upgradeResumeDatabase(s, rh)).toBe(s);
  });
  it("reúne todos os candidatos, inclusive sem processo ou fora da seleção", () => {
    const s = demoResumeDatabase(rh);
    expect(
      resumeCandidates(s, "Todos os currículos", clearWorkflowFilters()),
    ).toHaveLength(s.candidates.length);
    expect(
      resumeCandidates(s, "Todos os currículos", clearWorkflowFilters()).some(
        (p) => p.id === "resume-only-demo",
      ),
    ).toBe(true);
    expect(
      currentCycles(s).some((a) => a.candidate === "rec-candidate-1"),
    ).toBe(false);
  });
  it("estrela não movimenta, encerra ou cria processos e aparece como filtro", () => {
    const old = s0(),
      s = toggleTalent(old, rh, person);
    expect(s.applications).toEqual(old.applications);
    expect(
      resumeCandidates(s, "Talentos selecionados", clearWorkflowFilters()).some(
        (p) => p.id === person,
      ),
    ).toBe(true);
    expect(
      toggleTalent(s, rh, person).candidates.find((p) => p.id === person)
        ?.talent,
    ).toBe(false);
  });
  it("recusa reintrodução de Banco como etapa no novo fluxo", () => {
    const s = s0();
    expect(() =>
      savePipeline(s, rh, {
        ...s.central!,
        stages: [
          ...s.central!.stages,
          {
            id: "new-bank",
            name: "Banco",
            kind: "bank",
            color: "#123456",
            days: 3,
            fields: [],
            tasks: [],
          },
        ],
      }),
    ).toThrow(/classificação/);
  });
  it.each([
    ["2026-08-26", "Atualizado"],
    ["2026-08-25", "Regular"],
    ["2026-05-26", "Regular"],
    ["2026-05-25", "Atualização recomendada"],
    ["2025-11-26", "Atualização recomendada"],
    ["2025-11-25", "Desatualizado"],
  ])(
    "atualidade de %s respeita meses e limites inclusivos",
    (resumeUpdated, label) => {
      const s = s0(),
        p = { ...s.candidates[0], resumeUpdated };
      expect(freshness(p, s.resumeConfig!, "2026-11-26").label).toBe(label);
    },
  );
  it("meses com dias diferentes não estouram para o mês seguinte", () => {
    const s = s0();
    expect(
      freshness(
        { ...s.candidates[0], resumeUpdated: "2026-01-31" },
        { ...s.resumeConfig!, months: [1, 2, 3] },
        "2026-02-28",
      ).label,
    ).toBe("Atualizado");
  });
  it("intervalos inválidos não são salvos e o RH pode personalizar regras", () => {
    const s = s0();
    expect(() =>
      saveResumeConfig(s, rh, { ...s.resumeConfig!, months: [6, 3, 12] }),
    ).toThrow();
    expect(
      saveResumeConfig(s, rh, { ...s.resumeConfig!, months: [1, 4, 8] })
        .resumeConfig?.months,
    ).toEqual([1, 4, 8]);
  });
  it("registra contato, situação e lembrete sem fingir atualização do currículo", () => {
    const s = s0(),
      p = s.candidates.find((p) => p.id === person)!;
    const next = recordResumeChanges(
      s,
      recordContact(
        s,
        rh,
        person,
        "Retorno fictício",
        "Empregado, mas aberto a propostas",
        dateNow(),
      ),
      rh,
    );
    expect(
      next.candidates.find((p) => p.id === person)?.lastContact,
    ).toBeTruthy();
    expect(next.candidates.find((p) => p.id === person)?.resumeUpdated).toBe(
      p.resumeUpdated,
    );
    expect(next.resumeHistory).toHaveLength(s.resumeHistory!.length);
    expect(
      resumeCandidates(next, "Todos os currículos", {
        ...clearWorkflowFilters(),
        availability: "Empregado, mas aberto",
      }).map((p) => p.id),
    ).toContain(person);
  });
  it("edição conserva primeiro cadastro e versão anterior do CV sem versões duplicadas no store", () => {
    const s = s0(),
      p = s.candidates.find((p) => p.id === person)!,
      cv = {
        id: "cv-new",
        name: "cv-v2.pdf",
        size: 30,
        type: "application/pdf",
        url: "blob:cv-new",
      };
    const changed = registerResume(s, rh, {
      ...p,
      city: "Cidade fictícia",
      cv,
    });
    const next = recordResumeChanges(s, changed, rh);
    expect(
      next.resumeHistory!.filter((h) => h.candidate === person),
    ).toHaveLength(2);
    expect(
      next.resumeHistory!.filter((h) => h.candidate === person)[0].profile.city,
    ).toBe(p.city);
    expect(next.candidates.find((p) => p.id === person)?.created).toBe(
      p.created,
    );
  });
  it("Match considera base sem processos e exclui cadastro expirado ou sem interesse", () => {
    let s = registerResume(s0(), rh, freshCandidate(), false);
    const p = s.candidates[0];
    expect(eligibleResumes(s).some((x) => x.id === p.id)).toBe(true);
    s = {
      ...s,
      candidates: s.candidates.map((x) =>
        x.id === p.id
          ? { ...x, availabilityStatus: "Sem interesse no momento" }
          : x,
      ),
    };
    expect(eligibleResumes(s).some((x) => x.id === p.id)).toBe(false);
  });
});
describe("Convites locais temporários e privacidade", () => {
  it("gera links individuais criptograficamente aleatórios, org-bound e revoga convite anterior", () => {
    let s = invitation();
    const old = s.resumeRequests![0];
    expect(old.token).toHaveLength(64);
    s = createUpdateRequests(s, rh, [person]);
    expect(s.resumeRequests![0].token).not.toBe(old.token);
    expect(s.resumeRequests!.find((r) => r.id === old.id)?.state).toBe(
      "Revogada",
    );
    expect(() => updateProjection(s, rh, old.id, old.token)).toThrow();
  });
  it("projeção do formulário não contém avaliações, notas, validação RH, pretensão ou vínculos internos", () => {
    const s = invitation(),
      r = s.resumeRequests![0],
      dto = updateProjection(s, rh, r.id, r.token);
    expect(Object.keys(dto).sort()).toEqual([
      "expires",
      "profile",
      "request",
      "revision",
    ]);
    for (const field of [
      "expected",
      "validatedLevel",
      "rehire",
      "talent",
      "org",
      "notes",
      "assessments",
      "applications",
      "claims",
    ])
      expect(dto.profile).not.toHaveProperty(field);
  });
  it("consome uma vez, atualiza o mesmo cadastro e mantém processos, ofertas e autoria interna", () => {
    const s = invitation(),
      r = s.resumeRequests![0],
      p = s.candidates.find((p) => p.id === person)!;
    const next = applyResumeUpdate(
      s,
      rh,
      r.id,
      r.token,
      { ...profile(s), city: "Cidade Nova Fictícia" },
      true,
    );
    expect(next.candidates).toHaveLength(s.candidates.length);
    expect(next.candidates.find((p) => p.id === person)?.created).toBe(
      p.created,
    );
    expect(next.candidates.find((p) => p.id === person)?.resumeUpdated).toBe(
      dateNow(),
    );
    expect(next.applications).toEqual(s.applications);
    expect(next.notes).toEqual(s.notes);
    expect(next.offers).toEqual(s.offers);
    expect(next.resumeRequests![0].state).toBe("Utilizada");
    expect(() =>
      applyResumeUpdate(next, rh, r.id, r.token, profile(next), true),
    ).toThrow();
  });
  it("confirmação sem mudanças também registra nova versão e contato recebido", () => {
    const s = invitation(),
      r = s.resumeRequests![0],
      next = applyResumeUpdate(s, rh, r.id, r.token, profile(s), true);
    expect(next.resumeHistory!.length).toBe(s.resumeHistory!.length + 1);
    expect(next.resumeContacts![0].candidate).toBe(person);
  });
  it("bloqueia token inválido, organização, prazo, revogação e ausência de confirmação", () => {
    const s = invitation(),
      r = s.resumeRequests![0];
    expect(() => updateProjection(s, rh, r.id, "wrong")).toThrow();
    expect(() =>
      updateProjection(s, { ...rh, org: "org-b" }, r.id, r.token),
    ).toThrow();
    expect(() => updateProjection(s, rh, r.id, r.token, r.expires)).toThrow();
    expect(() =>
      applyResumeUpdate(
        revokeUpdateRequest(s, rh, r.id),
        rh,
        r.id,
        r.token,
        profile(s),
        true,
      ),
    ).toThrow();
    expect(() =>
      applyResumeUpdate(s, rh, r.id, r.token, profile(s), false),
    ).toThrow();
  });
  it("não permite que payload substitua identidade, organização ou campos internos", () => {
    const s = invitation(),
      r = s.resumeRequests![0],
      p = s.candidates.find((p) => p.id === person)!,
      data = {
        ...profile(s),
        id: "outra-pessoa",
        org: "org-b",
        expected: 999999999,
        talent: true,
        validatedLevel: "ADMIN",
        created: "1900-01-01",
      };
    const next = applyResumeUpdate(s, rh, r.id, r.token, data, true),
      saved = next.candidates.find((p) => p.id === person)!;
    expect(next.org).toBe(s.org);
    expect(saved.id).toBe(person);
    expect(saved.expected).toBe(p.expected);
    expect(saved.created).toBe(p.created);
    expect(saved.validatedLevel).toBe(p.validatedLevel);
  });
  it("impede sobreposição de edição por link emitido antes da última revisão RH", () => {
    const s = invitation(),
      r = s.resumeRequests![0],
      p = s.candidates.find((p) => p.id === person)!,
      next = registerResume(s, rh, {
        ...p,
        skills: "Atualização RH documentada",
      });
    expect(() =>
      applyResumeUpdate(next, rh, r.id, r.token, profile(s), true),
    ).toThrow(/mudou/);
  });
  it.each([dir, leader, { ...rh, rh: false }])(
    "nega operações a perfis sem RH",
    (c) => {
      const s = invitation(),
        r = s.resumeRequests![0];
      expect(() => createUpdateRequests(s, c, [person])).toThrow();
      expect(() =>
        applyResumeUpdate(s, c, r.id, r.token, profile(s), true),
      ).toThrow();
      expect(() => toggleTalent(s, c, person)).toThrow();
    },
  );
  it("projeções Diretoria/liderança eliminam todos os novos registros privados", () => {
    const s = invitation();
    for (const c of [dir, leader]) {
      const p = projectResumeDatabase(s, c);
      expect(p.resumeHistory).toEqual([]);
      expect(p.resumeRequests).toEqual([]);
      expect(p.resumeContacts).toEqual([]);
      expect(p.duplicateReviews).toEqual([]);
      expect(
        p.candidates.every(
          (p) => p.talent === undefined && p.availabilityStatus === undefined,
        ),
      ).toBe(true);
    }
  });
});
describe("Duplicidades revisadas pelo RH", () => {
  it("recebimento por formulário detecta duplicidade e não unifica nem sobrescreve", () => {
    const s = s0(),
      p = s.candidates.find((p) => p.id === person)!;
    const next = submitResumeIntake(
      s,
      rh,
      {
        "field-name": p.name,
        "field-email": p.email,
        "field-sector": "Engenharia",
        "field-city": "Outra cidade",
      },
      {},
      true,
    );
    expect(next.candidates).toEqual(s.candidates);
    expect(next.applications).toEqual(s.applications);
    expect(next.duplicateReviews![0].incoming?.city).toBe("Outra cidade");
  });
  it("campos personalizados recebidos em duplicidade permanecem no histórico após revisão", () => {
    let s = s0();
    const f = s.forms.find((f) => f.id === s.central!.formId)!;
    s = {
      ...s,
      forms: s.forms.map((x) =>
        x.id === f.id
          ? {
              ...x,
              fields: [
                ...x.fields,
                {
                  id: "custom-demo",
                  label: "Resposta adicional",
                  type: "Texto",
                  mapping: "",
                  options: [],
                  required: false,
                },
              ],
            }
          : x,
      ),
    };
    s = submitResumeIntake(
      s,
      rh,
      {
        "field-name": "Alex Demo",
        "field-email": "talento-0@exemplo.invalid",
        "field-sector": "Arquitetura",
        "custom-demo": "Resposta fictícia preservada",
      },
      {},
      true,
    );
    const r = s.duplicateReviews![0];
    s = resolveDuplicate(s, rh, r.id, true, {}, "Identidade conferida");
    expect(
      s.resumeHistory!.some(
        (h) =>
          h.receivedForm?.answers["custom-demo"] ===
          "Resposta fictícia preservada",
      ),
    ).toBe(true);
  });
  it("identifica nome, e-mail normalizado e telefone brasileiro com código de país", () => {
    const s = s0(),
      p = s.candidates[0];
    expect(
      resumeDuplicates(s, {
        ...freshCandidate(s),
        email: " " + p.email.toUpperCase() + " ",
      }).map((x) => x.id),
    ).toContain(p.id);
    expect(
      resumeDuplicates(s, {
        ...freshCandidate(s),
        phone: "+55" + p.phone.replace(/\D/g, ""),
      }).map((x) => x.id),
    ).toContain(p.id);
    expect(
      resumeDuplicates(s, {
        ...freshCandidate(s),
        name: "  " + p.name.toUpperCase() + "  ",
      }).map((x) => x.id),
    ).toContain(p.id);
  });
  it("permite manter cadastros separados com justificativa e processo distinto", () => {
    const s = s0(),
      p = { ...freshCandidate(s), phone: s.candidates[0].phone };
    const queued = registerResume(s, rh, p),
      r = queued.duplicateReviews![0];
    const next = resolveDuplicate(
      queued,
      rh,
      r.id,
      false,
      {},
      "Homônimos conferidos, pessoas distintas.",
    );
    expect(next.candidates.some((x) => x.id === p.id)).toBe(true);
    expect(next.applications.some((a) => a.candidate === p.id)).toBe(true);
    expect(next.duplicateReviews![0].state).toBe("Separados");
  });
  it("unifica conforme campos escolhidos, preservando ciclos, propostas, instrumentos e data mais antiga", () => {
    let s = s0();
    const right = "rec-candidate-2",
      rightApp = s.applications.find((a) => a.candidate === right)!.id;
    const p = s.candidates.find((p) => p.id === person)!,
      r = s.candidates.find((p) => p.id === right)!;
    s = decide(s, rh, rightApp, true, "Parecer fictício");
    s = saveOffer(s, rh, rightApp, 10000, "Proposta preservada");
    s = openDuplicateReview(s, rh, person, right);
    const before = structuredClone(s),
      next = resolveDuplicate(
        s,
        rh,
        s.duplicateReviews![0].id,
        true,
        { city: "right", email: "right" },
        "Identidade conferida pelo RH",
      );
    expect(next.candidates.find((p) => p.id === person)?.email).toBe(r.email);
    expect(next.candidates.find((p) => p.id === person)?.created).toBe(
      [p.created, r.created].sort()[0],
    );
    expect(next.candidates.find((p) => p.id === right)?.mergedInto).toBe(
      person,
    );
    expect(next.applications.map((a) => a.id).sort()).toEqual(
      before.applications.map((a) => a.id).sort(),
    );
    expect(next.offers).toEqual(before.offers);
    expect(next.applications.find((a) => a.id === rightApp)?.candidate).toBe(
      person,
    );
    expect(
      resumeCandidates(next, "Todos os currículos", clearWorkflowFilters())
        .length,
    ).toBe(before.candidates.length - 1);
    const versions = next
      .resumeHistory!.filter((h) => h.candidate === person)
      .map((h) => h.version);
    expect(new Set(versions).size).toBe(versions.length);
  });
  it("duas contratações locais ativas impedem unificação e não causam alterações parciais", () => {
    let s = s0();
    s = {
      ...s,
      employments: ["rec-candidate-0", "rec-candidate-2"].map(
        (candidate, i) => ({
          id: "e" + i,
          org: s.org,
          candidate,
          application: "a" + i,
          admission: "ad" + i,
          job: "",
          contract: "CLT",
          start: dateNow(),
          confirmedAt: new Date().toISOString(),
          status: "Ativo",
          origin: "Teste",
        }),
      ),
    };
    s = openDuplicateReview(s, rh, person, "rec-candidate-2");
    const before = structuredClone(s);
    expect(() =>
      resolveDuplicate(s, rh, s.duplicateReviews![0].id, true, {}, "Revisado"),
    ).toThrow(/Dois vínculos/);
    expect(s).toEqual(before);
  });
  it("revoga convites de ambos ao unificar e rejeita repetir decisão fechada", () => {
    let s = createUpdateRequests(s0(), rh, [person, "rec-candidate-2"]);
    s = openDuplicateReview(s, rh, person, "rec-candidate-2");
    const id = s.duplicateReviews![0].id,
      next = resolveDuplicate(s, rh, id, true, {}, "Identidade revisada");
    expect(next.resumeRequests!.every((r) => r.state === "Revogada")).toBe(
      true,
    );
    expect(() =>
      resolveDuplicate(next, rh, id, true, {}, "Novamente"),
    ).toThrow();
  });
});
describe("Arquivamento, retenção e importação local", () => {
  it("retira processos encerrados da operação, conserva no Banco e reabre nova oportunidade", () => {
    let s = s0();
    s = moveCentral(s, rh, [app], "pipeline-11", "Resultado negativo fictício");
    s = archiveProcesses(s, rh, [app], "Processo encerrado revisado");
    expect(currentCycles(s).some((a) => a.id === app)).toBe(false);
    expect(
      resumeCandidates(s, "Arquivados", clearWorkflowFilters()).some(
        (p) => p.id === person,
      ),
    ).toBe(true);
    const next = reactivateCycle(s, rh, app, "Nova oportunidade");
    expect(next.applications.find((a) => a.id === app)?.status).toBe(
      "Encerrada",
    );
    expect(
      currentCycles(next).some((a) => a.candidate === person && a.id !== app),
    ).toBe(true);
  });
  it("não arquiva processo ativo ou encerra vínculos/admissões ao arquivar", () => {
    const s = s0(),
      before = structuredClone(s);
    expect(() => archiveProcesses(s, rh, [app], "teste")).toThrow();
    expect(s).toEqual(before);
    const bank = s.applications.find((a) => a.archived)!;
    const next = archiveProcesses(s, rh, [bank.id], "teste");
    expect(next.employments).toEqual(s.employments);
    expect(next.admissions).toEqual(s.admissions);
  });
  it("regra automática só executa quando habilitada, é idempotente e preserva ativos", () => {
    let s = s0();
    s = moveCentral(s, rh, [app], "pipeline-11", "Encerrado fictício");
    s = {
      ...s,
      applications: s.applications.map((a) =>
        a.id === app
          ? {
              ...a,
              entered: "2020-01-01",
              closedAt: "2020-01-01T12:00:00Z",
              visits: [{ stage: a.stage, at: "2020-01-01T12:00:00Z" }],
            }
          : a,
      ),
    };
    expect(
      runArchiveRules(s, rh).applications.find((a) => a.id === app)?.archived,
    ).toBeUndefined();
    s = saveResumeConfig(s, rh, {
      ...s.resumeConfig!,
      autoArchive: true,
      archiveDays: 30,
    });
    const next = runArchiveRules(s, rh);
    expect(
      next.applications.find((a) => a.id === app)?.archived?.automatic,
    ).toBe(true);
    expect(runArchiveRules(next, rh)).toBe(next);
  });
  it("começa seleção para currículo sem processo sem alterar o cadastro", () => {
    const s = registerResume(s0(), rh, freshCandidate(), false),
      p = s.candidates[0];
    const next = startResumeProcess(s, rh, p.id, "Oportunidade demonstrativa");
    expect(next.applications.length).toBe(s.applications.length + 1);
    expect(next.candidates.length).toBe(s.candidates.length);
    expect(() => startResumeProcess(next, rh, p.id, "Duplicado")).toThrow(
      /ativo/,
    );
  });
  it("arquivados de ciclos anteriores continuam consultáveis e não substituem processo ativo", () => {
    let s = moveCentral(s0(), rh, [app], "pipeline-11", "Encerramento");
    s = archiveProcesses(s, rh, [app], "Histórico");
    s = reactivateCycle(s, rh, app, "Nova oportunidade");
    expect(currentCycles(s, true).some((a) => a.id === app && a.archived)).toBe(
      true,
    );
    expect(() => reactivateCycle(s, rh, app, "Não substituir o atual")).toThrow(
      /outro processo/,
    );
  });
  it("idade da etapa não antecipa arquivamento de um encerramento recente", () => {
    let s = moveCentral(s0(), rh, [app], "pipeline-11", "Encerrado hoje");
    s = {
      ...s,
      applications: s.applications.map((a) =>
        a.id === app
          ? {
              ...a,
              entered: "2020-01-01",
              visits: [{ stage: a.stage, at: "2020-01-01T12:00:00Z" }],
            }
          : a,
      ),
    };
    s = saveResumeConfig(s, rh, {
      ...s.resumeConfig!,
      autoArchive: true,
      archiveDays: 1,
    });
    expect(
      runArchiveRules(s, rh).applications.find((a) => a.id === app)?.archived,
    ).toBeUndefined();
  });
  it("CSV suporta BOM, aspas, delimitadores, escapes e linhas internas", () => {
    const table = parseSpreadsheet(
      '\ufeffNome;Email;Resumo\r\n"Nome; Exemplo";a@exemplo.invalid;"Uma linha\nOutra ""linha"""',
    );
    expect(table.rows[0]).toEqual([
      "Nome; Exemplo",
      "a@exemplo.invalid",
      'Uma linha\nOutra "linha"',
    ]);
    expect(() => parseSpreadsheet('Nome;Email\n"sem fechar')).toThrow();
  });
  it("importação demanda mapeamento, revisão e dados fictícios; não chama APIs ou inicia processos", () => {
    const s = s0(),
      table = parseSpreadsheet(
        "Nome;Email\nNovo CSV;novo-csv@exemplo.invalid\nAlex Demo;talento-0@exemplo.invalid",
      ),
      mapping = { "0": "name", "1": "email" };
    expect(
      previewImport(s, table, mapping, "Pipefy demo")[1].matches.length,
    ).toBeGreaterThan(0);
    expect(() =>
      commitDemoImport(
        s,
        rh,
        table,
        mapping,
        "Pipefy demo",
        "demo.csv",
        [2, 3],
        false,
        "import1",
      ),
    ).toThrow();
    const next = commitDemoImport(
      s,
      rh,
      table,
      mapping,
      "Pipefy demo",
      "demo.csv",
      [2, 3],
      true,
      "import1",
    );
    expect(next.importReports![0].created).toBe(1);
    expect(next.importReports![0].reviews).toBe(1);
    expect(next.applications).toEqual(s.applications);
    expect(next.candidates.length).toBe(s.candidates.length + 1);
    expect(
      commitDemoImport(
        next,
        rh,
        table,
        mapping,
        "Pipefy demo",
        "demo.csv",
        [2, 3],
        true,
        "import1",
      ),
    ).toBe(next);
  });
  it("duplicidades dentro da planilha também aguardam revisão, sem unificação", () => {
    const s = s0(),
      table = parseSpreadsheet(
        "Nome,Email\nNome Novo,novo@exemplo.invalid\nNome Novo,novo@exemplo.invalid",
      ),
      next = commitDemoImport(
        s,
        rh,
        table,
        { "0": "name", "1": "email" },
        "Pipefy demo",
        "d.csv",
        [2, 3],
        true,
        "im2",
      );
    expect(next.importReports![0].created).toBe(1);
    expect(next.importReports![0].reviews).toBe(1);
  });
  it("falha de linha inválida é atômica e linhas ignoradas são relatadas", () => {
    const s = s0(),
      table = parseSpreadsheet(
        "Nome;Email\nNome;email-ruim\nNome 2;bom@exemplo.invalid",
      ),
      mapping = { "0": "name", "1": "email" };
    expect(() =>
      commitDemoImport(
        s,
        rh,
        table,
        mapping,
        "Demo",
        "d.csv",
        [2, 3],
        true,
        "x",
      ),
    ).toThrow();
    const next = commitDemoImport(
      s,
      rh,
      table,
      mapping,
      "Demo",
      "d.csv",
      [3],
      true,
      "x",
    );
    expect(next.importReports![0].skipped).toBe(1);
    expect(() =>
      previewImport(s, table, { "0": "name", "1": "name" }, "Demo"),
    ).toThrow();
  });
  it("motivos privados do arquivamento não vazam às projeções gerenciais ou técnicas", () => {
    let s = moveCentral(s0(), rh, [app], "pipeline-11", "Resultado fictício");
    s = archiveProcesses(
      s,
      rh,
      [app],
      "Observação confidencial de arquivamento",
    );
    const p = projectResumeDatabase(s, dir);
    expect(p.applications.find((a) => a.id === app)?.archived?.reason).toBe("");
    expect(p.applications.find((a) => a.id === app)?.archived?.by).toBe("");
  });
  it("limpeza por retenção e anonimização abrangem novas estruturas privadas", () => {
    let s = invitation();
    s = recordContact(
      s,
      rh,
      person,
      "Nota privada de contato",
      "Disponível para oportunidades",
      "",
    );
    s = {
      ...s,
      resumeHistory: s.resumeHistory!.map((h) =>
        h.candidate === person ? { ...h, until: "2000-01-01" } : h,
      ),
    };
    s = purgeExpiredRevisions(s, rh);
    expect(
      s.resumeHistory!.find((h) => h.candidate === person)?.profile,
    ).toEqual({});
    const next = eraseResumeData(s, rh, person, "Eliminação demonstrativa");
    expect(next.resumeRequests!.some((r) => r.candidate === person)).toBe(
      false,
    );
    expect(next.resumeContacts!.some((r) => r.candidate === person)).toBe(
      false,
    );
    expect(
      next.candidates.find((p) => p.id === person)?.talent,
    ).toBeUndefined();
  });
});
