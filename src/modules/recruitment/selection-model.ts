import { type Scope, assert, dateNow, uid } from "../career/model";
import {
  type State,
  type Candidate,
  type Field,
  type Form,
  guard,
  ev,
  validateFields,
  visibleFields,
} from "./model";
import { type PipelineStage } from "./workflow-types";
import { moveCentral, savePipeline } from "./workflow-model";
import { registerResume } from "./resume-model";
export const selectionMappings = [
  "name",
  "email",
  "phone",
  "city",
  "sector",
  "education",
  "experience",
  "skills",
  "software",
  "availability",
  "source",
  "referral",
] as const;
export type SelectionConfig = {
  cardColor: string;
  profileFields: Field[];
  history: { at: string; by: string; fields: Field[] }[];
};
export function defaultSelectionConfig(): SelectionConfig {
  return {
    cardColor: "#f97316",
    profileFields: selectionMappings.map((mapping) => ({
      id: "selection-" + mapping,
      label: (
        {
          name: "Nome completo",
          email: "E-mail",
          phone: "Telefone/WhatsApp",
          city: "Localização",
          sector: "Setor de interesse",
          education: "Formação",
          experience: "Experiência",
          skills: "Competências técnicas",
          software: "Softwares",
          availability: "Disponibilidade",
          source: "Origem",
          referral: "Indicação ou referência",
        } as const
      )[mapping],
      mapping,
      type:
        mapping === "email"
          ? "E-mail"
          : mapping === "phone"
            ? "Telefone"
            : "Texto",
      options: [],
      required: ["name", "email"].includes(mapping),
    })),
    history: [],
  };
}
export const selectionConfig = (s: State) =>
  s.central!.selection ?? defaultSelectionConfig();
export function selectionDemoActor(auth: Scope): Scope {
  assert(
    auth.rh || auth.director || auth.leader,
    "Demonstração restrita aos perfis já autorizados ao Processo Seletivo.",
  );
  return {
    ...auth,
    rh: true,
    director: false,
    leader: false,
    key: `selection-rh-demo:${auth.key}`,
  };
}
export function selectionRoleLabel(c: Scope) {
  return (
    [
      c.rh ? "RH" : null,
      c.director ? "Diretoria" : null,
      c.leader ? "Liderança" : null,
    ]
      .filter(Boolean)
      .join(" / ") || "Sem atribuição de recrutamento"
  );
}
export function saveSelectionConfig(
  s: State,
  c: Scope,
  config: SelectionConfig,
  cards: string[],
): State {
  guard(s, c, "hr");
  assert(/^#[0-9a-f]{6}$/i.test(config.cardColor), "Escolha uma cor válida.");
  validateFields(config.profileFields);
  const mapped = config.profileFields
    .filter((f) => f.mapping)
    .map((f) => f.mapping);
  assert(
    new Set(mapped).size === mapped.length,
    "Cada dado cadastral pode ter apenas um campo mapeado.",
  );
  for (const mapping of ["name", "email"])
    assert(
      config.profileFields.filter((f) => f.mapping === mapping && f.required)
        .length === 1,
      `Mantenha um campo obrigatório de ${mapping === "name" ? "nome" : "e-mail"} para identificar o cadastro.`,
    );
  assert(
    config.profileFields.every(
      (f) =>
        f.type !== "Arquivo" &&
        (!f.mapping ||
          selectionMappings.includes(
            f.mapping as (typeof selectionMappings)[number],
          )),
    ),
    "Use campos cadastrais válidos; os anexos permanecem no editor de currículo.",
  );
  return {
    ...s,
    central: {
      ...s.central!,
      cards: [...new Set(cards)],
      selection: {
        ...structuredClone(config),
        history: [
          ...(s.central!.selection?.history ?? []),
          {
            at: new Date().toISOString(),
            by: c.name,
            fields: structuredClone(selectionConfig(s).profileFields),
          },
        ],
      },
    },
    events: [
      ...s.events,
      ev(
        c,
        "Cores, campos dos cards e ficha do Processo Seletivo atualizados localmente. Valores e definições anteriores preservados.",
      ),
    ],
  };
}
export function saveSelectionPhase(
  s: State,
  c: Scope,
  phase: PipelineStage,
): State {
  guard(s, c, "hr");
  const old = s.central!.stages.find((st) => st.id === phase.id);
  assert(
    !old || old.kind === phase.kind,
    "A edição visual não altera a finalidade da fase.",
  );
  const stages = old
    ? s.central!.stages.map((st) =>
        st.id === phase.id ? structuredClone(phase) : st,
      )
    : [...s.central!.stages, structuredClone(phase)];
  return savePipeline(s, c, { ...s.central!, stages });
}
export function reorderSelectionPhase(
  s: State,
  c: Scope,
  id: string,
  delta: -1 | 1,
): State {
  guard(s, c, "hr");
  const stages = [...s.central!.stages],
    i = stages.findIndex((st) => st.id === id),
    j = i + delta;
  assert(
    i >= 0 && j >= 0 && j < stages.length,
    "A fase já está neste limite do quadro.",
  );
  [stages[i], stages[j]] = [stages[j], stages[i]];
  return savePipeline(s, c, { ...s.central!, stages });
}
export function deleteSelectionPhase(
  s: State,
  c: Scope,
  id: string,
  destination: string,
  confirmed: boolean,
): State {
  guard(s, c, "hr");
  const old = s.central!.stages.find((st) => st.id === id),
    target = s.central!.stages.find((st) => st.id === destination);
  assert(
    old && target && old.id !== target.id && confirmed,
    "Confirme a transferência para outra fase antes de excluir.",
  );
  assert(s.central!.stages.length > 1, "Mantenha pelo menos uma fase.");
  const critical = ["entry", "hired", "declined", "bank"].includes(old.kind);
  assert(
    !critical || ["normal", "qualified", old.kind].includes(target.kind),
    "Escolha uma fase livre para preservar a função de entrada, contratação ou recusa. As demais funções permanecem protegidas.",
  );
  const nextTarget = {
    ...structuredClone(target),
    kind: critical ? old.kind : target.kind,
  };
  const stages = s
    .central!.stages.filter((st) => st.id !== id)
    .map((st) => (st.id === target.id ? nextTarget : st));
  const at = new Date().toISOString();
  const next: State = {
    ...s,
    central: { ...s.central!, stages },
    applications: s.applications.map((a) =>
      a.stage === id
        ? {
            ...a,
            stage: target.id,
            entered: a.historical || a.archived ? a.entered : dateNow(),
            stages: a.stages.some((st) => st.id === target.id)
              ? a.stages
              : [...a.stages, structuredClone(nextTarget)],
            visits:
              a.historical || a.archived
                ? a.visits
                : [...a.visits, { stage: target.id, at }],
            events: [
              ...a.events,
              ev(
                c,
                `Fase ${old.name} excluída; card transferido para ${target.name}, preservando resultado, campos e vínculos.`,
              ),
            ],
          }
        : a,
    ),
    rules: s.rules.map((r) =>
      r.stage === id ? { ...r, stage: target.id } : r,
    ),
    events: [
      ...s.events,
      ev(
        c,
        `Fase ${old.name} excluída com transferência para ${target.name}; automações vinculadas preservadas e redirecionadas, sem execução retroativa.`,
      ),
    ],
  };
  return savePipeline(next, c, next.central!);
}
export function moveSelectionCards(
  s: State,
  c: Scope,
  ids: string[],
  target: string,
  reason: string,
): State {
  guard(s, c, "hr");
  const st = s.central!.stages.find((st) => st.id === target);
  assert(st && reason.trim() && ids.length, "Informe fase, cards e motivo.");
  let next = s;
  for (const id of [...new Set(ids)]) {
    const a = next.applications.find(
      (a) => a.id === id && !a.historical && !a.archived,
    );
    assert(
      a,
      "Card operacional indisponível; reative um ciclo arquivado pela ação específica.",
    );
    if (a.stage === target) continue;
    if (a.status !== "Contratada") {
      next = moveCentral(next, c, [id], target, reason);
      continue;
    }
    next = {
      ...next,
      applications: next.applications.map((x) =>
        x.id === id
          ? {
              ...x,
              stage: target,
              entered: dateNow(),
              stages: x.stages.some((t) => t.id === target)
                ? x.stages
                : [...x.stages, structuredClone(st)],
              visits: [
                ...x.visits,
                { stage: target, at: new Date().toISOString() },
              ],
              events: [
                ...x.events,
                ev(
                  c,
                  `Organização do card formalizado: ${st.name}. ${reason}. Contratação e vínculo preservados.`,
                ),
              ],
            }
          : x,
      ),
    };
  }
  return next;
}
export function deleteSelectionCards(
  s: State,
  c: Scope,
  ids: string[],
  reason: string,
  confirmed: boolean,
): State {
  guard(s, c, "hr");
  assert(
    ids.length && reason.trim() && confirmed,
    "Selecione cards, justifique e confirme a exclusão local.",
  );
  for (const id of ids)
    assert(
      s.applications.some((a) => a.id === id && !a.historical && !a.archived),
      "Card operacional indisponível.",
    );
  const at = new Date().toISOString();
  return {
    ...s,
    applications: s.applications.map((a) =>
      ids.includes(a.id)
        ? {
            ...a,
            status: a.status === "Contratada" ? "Contratada" : "Encerrada",
            closedAt: a.closedAt ?? at,
            archived: {
              at,
              by: c.name,
              reason: `Card excluído do quadro: ${reason}`,
              automatic: false,
            },
            events: [
              ...a.events,
              ev(
                c,
                `Card excluído do quadro operacional. ${reason}. Cadastro, histórico, admissões e vínculos conservados.`,
              ),
            ],
          }
        : a,
    ),
  };
}
export function selectionProfileValues(s: State, id: string) {
  const a =
    s.applications.find(
      (a) => a.candidate === id && !a.historical && !a.archived,
    ) ?? s.applications.find((a) => a.candidate === id);
  return Object.fromEntries(
    selectionConfig(s)
      .profileFields.filter((f) => !f.mapping)
      .map((f) => [
        f.id,
        a?.fields["selection-profile:" + f.id] ?? a?.answers[f.id] ?? "",
      ]),
  );
}
export function saveSelectionCandidate(
  s: State,
  c: Scope,
  p: Candidate,
  extra: Record<string, string>,
  create: boolean,
  color: string,
): State {
  guard(s, c, "hr");
  assert(/^#[0-9a-f]{6}$/i.test(color), "Escolha uma cor válida para o card.");
  const config = selectionConfig(s),
    answers = Object.fromEntries(
      config.profileFields.map((f) => [
        f.id,
        f.mapping
          ? String(p[f.mapping as keyof Candidate] ?? "")
          : (extra[f.id] ?? ""),
      ]),
    );
  const form: Form = {
    id: "selection-profile",
    name: "Ficha do Processo Seletivo",
    version: (config.history.length || 0) + 1,
    fields: config.profileFields,
    color: config.cardColor,
    message: "Ficha demonstrativa local.",
  };
  for (const f of visibleFields(form, answers))
    assert(!f.required || answers[f.id]?.trim(), `Preencha ${f.label}.`);
  let next = registerResume(s, c, p, create);
  const a = next.applications.find(
    (a) => a.candidate === p.id && !a.historical && !a.archived,
  );
  if (a)
    next = {
      ...next,
      applications: next.applications.map((x) =>
        x.id === a.id
          ? {
              ...x,
              fields: {
                ...x.fields,
                ...Object.fromEntries(
                  config.profileFields
                    .filter((f) => !f.mapping)
                    .map((f) => [
                      "selection-profile:" + f.id,
                      extra[f.id] ?? "",
                    ]),
                ),
                "selection:color": color,
              },
            }
          : x,
      ),
    };
  else
    next = {
      ...next,
      duplicateReviews: next.duplicateReviews!.map((r) =>
        r.incoming?.id === p.id
          ? { ...r, intake: { form, answers, files: {} } }
          : r,
      ),
    };
  return next;
}
export function newSelectionPhase(): PipelineStage {
  return {
    id: uid(),
    name: "Nova fase",
    color: "#f97316",
    kind: "normal",
    days: 7,
    fields: [],
    tasks: [],
  };
}
