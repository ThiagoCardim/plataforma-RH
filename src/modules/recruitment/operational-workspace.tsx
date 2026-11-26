"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Columns3,
  List,
  Paperclip,
  GripVertical,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice, Events, Empty } from "../performance/components";
import { TextField, Pick, Check, AreaField } from "../academy/components";
import { type Scope, type Contract, dateNow } from "../career/model";
import {
  type State,
  type Candidate,
  saveCandidate,
  decide,
  assign,
  revokeAssignment,
  duplicates,
  updateStage,
  visibleStageFields,
} from "./model";
import { useRecruitment } from "./store";
import {
  type WorkflowView,
  workflowViews,
  clearWorkflowFilters,
  experienceLevels,
} from "./workflow-types";
import {
  currentCycles,
  stageOf,
  selectProcesses,
  moveCentral,
  reactivateCycle,
  attachVacancy,
  validateExperience,
  rehireEligibility,
  saveWorkflowQuery,
} from "./workflow-model";
import { daysBetween } from "./workflow-insights";
import {
  type WorkflowProps,
  choices,
  SideSheet,
  AdvancedFilters,
} from "./workflow-ui";
import { CandidateEditor, newCandidate } from "./editors";
import { CandidatePanel } from "./candidate-panel";
import { CandidateForm, StageField } from "./forms";
import { MatchDesk } from "./match-desk";
import { AdmissionBoard } from "./admission-board";
import { VacancyDesk } from "./vacancy-desk";
import { InsightsDesk } from "./insights-desk";
import { WorkflowSettings } from "./workflow-settings";
import { ResumeDatabase } from "./resume-database";
import { ResumeDetails } from "./resume-details";
import { TalentStar } from "./resume-components";
import {
  registerResume,
  submitResumeIntake,
  eligibleResumes,
  archiveProcesses,
} from "./resume-model";
import "./recruitment.css";
export function OperationalWorkspace({
  initial,
  scope,
  view,
  assessment,
  assessmentToken,
}: {
  initial: State;
  scope: Scope;
  view: WorkflowView;
  assessment?: string;
  assessmentToken?: string;
}) {
  const local = useRecruitment(initial, scope),
    { state, act } = local,
    [filters, setFilters] = useState(clearWorkflowFilters),
    [advanced, setAdvanced] = useState(false),
    [mode, setMode] = useState("Kanban"),
    [selected, setSelected] = useState<string[]>([]),
    [candidate, setCandidate] = useState<string>(),
    [edit, setEdit] = useState<Candidate>(),
    [modal, setModal] = useState(""),
    [target, setTarget] = useState(""),
    [reason, setReason] = useState(""),
    [copied, setCopied] = useState(false),
    [queryName, setQueryName] = useState(""),
    [queryDismissed, setQueryDismissed] = useState(false);
  const queryAssessment =
    scope.rh && !queryDismissed
      ? state.assessments.find(
          (a) => a.id === assessment && a.token === assessmentToken,
        )
      : undefined;
  const opened = candidate ?? queryAssessment?.candidate;
  const props = { state, scope, act, error: local.error, notice: local.notice },
    bank = view === "talentos",
    process = view === "processo-seletivo",
    apps = selectProcesses(state, filters, false);
  const selectedApps = state.applications.filter((a) =>
      selected.includes(a.id),
    ),
    selectedPeople = selectedApps.length
      ? selectedApps.map((a) => a.candidate)
      : apps.map((a) => a.candidate);
  const open = (id: string) => {
    if (scope.rh || scope.leader) setCandidate(id);
  };
  const close = () => {
    setCandidate(undefined);
    setEdit(undefined);
    setModal("");
    setQueryDismissed(true);
  };
  const move = (ids: string[], stage: string) => {
    setSelected(ids);
    setTarget(stage);
    setReason("");
    setModal("move");
  };
  const card = (a: State["applications"][number]) => {
    const p = state.candidates.find((p) => p.id === a.candidate)!;
    const show = (key: string) => state.central!.cards.includes(key),
      prior = state.employments!.some((e) => e.candidate === p.id),
      dupes = scope.rh ? duplicates(state, p) : [];
    const st = stageOf(state, a.stage);
    return (
      <article
        key={a.id}
        className="ats-card"
        draggable={scope.rh && a.status !== "Contratada"}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", a.id);
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <div className="flex items-center justify-between gap-2">
          {scope.rh ? (
            <Check
              label={`Selecionar ${p.name}`}
              checked={selected.includes(a.id)}
              onChange={(yes) =>
                setSelected(
                  yes
                    ? [...selected, a.id]
                    : selected.filter((id) => id !== a.id),
                )
              }
            />
          ) : (
            <Badge>{a.contract}</Badge>
          )}
          {scope.rh && <TalentStar {...props} candidate={p} />}
          <GripVertical size={13} className="text-muted-foreground" />
        </div>
        <button
          className="mt-2 w-full text-left"
          disabled={scope.director && !scope.rh}
          onClick={() => open(p.id)}
        >
          <strong className="text-sm">{p.name}</strong>
          {show("city") && (
            <p className="mt-1 text-xs text-muted-foreground">
              {p.city || "Visão gerencial"} · {a.contract}
            </p>
          )}
          {show("area") && <p className="mt-1 text-xs">{p.sector}</p>}
          {show("experience") && p.experience && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Declarado: {p.experience}
            </p>
          )}
          {show("job") && (
            <p className="mt-2 truncate text-xs text-primary">{a.jobTitle}</p>
          )}
        </button>
        {show("tags") && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {show("attachments") && (
            <span className="flex items-center gap-1">
              <Paperclip size={11} />
              {
                new Set(
                  [p.cv, p.portfolio, ...Object.values(a.answerFiles)].flatMap(
                    (f) => (f ? [f.id] : []),
                  ),
                ).size
              }
            </span>
          )}
          {show("stageTime") && <span>{daysBetween(a.entered)}d na etapa</span>}
          {show("totalTime") && (
            <span>{daysBetween(a.created)}d no processo</span>
          )}
        </div>
        {show("alerts") && (
          <div className="mt-2 text-[11px] text-amber-700">
            {p.retentionUntil < dateNow() && (
              <p>Retenção vencida · revisar finalidade</p>
            )}
            {prior && <p>Já trabalhou na YouCon · revisar histórico</p>}
            {dupes.length > 0 && <p>Possível duplicidade · revisar cadastro</p>}
            {st && daysBetween(a.entered) > st.days && (
              <p>Prazo de acompanhamento excedido</p>
            )}
            {a.status === "Ativa" && st?.kind === "hired" && (
              <p>Aprovação RH · vínculo ainda não ativo</p>
            )}
            {st?.tasks.some(
              (t) => t.required && !a.checks[`${a.stage}:${t.id}`],
            ) && <p>Atividades pendentes</p>}
          </div>
        )}
        {scope.rh && (
          <details className="mt-3">
            <summary className="cursor-pointer text-[11px] text-primary">
              Mover card
            </summary>
            <Pick
              label={`Mover ${p.name}`}
              value={a.stage}
              options={state.central!.stages}
              onChange={(target) => move([a.id], target)}
            />
          </details>
        )}
      </article>
    );
  };
  if (!local.ready)
    return <p role="status">Preparando processo centralizado…</p>;
  return (
    <div className="ats-shell ats-operational min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Recrutamento e Seleção
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {workflowViews.find(([v]) => v === view)?.[1]}
          </h1>
        </div>
        {scope.rh && (
          <Button
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  "Restaurar apenas os exemplos locais de Recrutamento deste usuário e organização?",
                )
              )
                act(() => initial);
            }}
          >
            Restaurar exemplos
          </Button>
        )}
      </header>
      <p className="rounded-lg border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        Demonstração protegida · dados e arquivos fictícios apenas neste
        navegador, usuário, organização e perfil. Sem coleta pública,
        sincronização, mensagens, APIs externas ou alterações de vínculos e
        acessos reais.
      </p>
      <Notice error={local.error} notice={local.notice} />
      {process && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
            {scope.rh && (
              <>
                <Button
                  onClick={() => {
                    setEdit(newCandidate(state.privacy.days));
                    setModal("create");
                  }}
                >
                  <Plus size={15} />
                  Cadastrar currículo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setModal("intake");
                    setCopied(false);
                  }}
                >
                  Compartilhar formulário
                </Button>
              </>
            )}
            <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border px-3 py-2">
              <Search size={15} />
              <input
                className="min-w-0 w-full bg-transparent text-sm outline-none"
                aria-label="Pesquisar candidatos"
                placeholder="Pesquisar candidatos…"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </label>
            <Button variant="ghost" onClick={() => setAdvanced(!advanced)}>
              <SlidersHorizontal size={15} />
              Filtros avançados
            </Button>
            {scope.rh && (
              <Button variant="outline" onClick={() => setModal("match")}>
                <Sparkles size={15} />
                YouCon Match
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setMode(mode === "Kanban" ? "Tabela" : "Kanban")}
            >
              {mode === "Kanban" ? <List size={16} /> : <Columns3 size={16} />}{" "}
              {mode === "Kanban" ? "Tabela" : bank ? "Cards" : "Kanban"}
            </Button>
            {scope.rh && (
              <Link
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-primary"
                href="/recrutamento/configuracoes"
              >
                <Settings2 size={15} />
                Gerenciar processo
              </Link>
            )}
          </div>
          {advanced && (
            <>
              <AdvancedFilters
                filters={filters}
                change={setFilters}
                state={state}
              />
              {scope.rh && (
                <div className="flex flex-wrap items-end gap-3">
                  <TextField
                    label="Nome da busca combinada"
                    value={queryName}
                    onChange={setQueryName}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      act((s) =>
                        saveWorkflowQuery(s, scope, queryName, filters),
                      )
                    }
                  >
                    Salvar busca
                  </Button>
                  <Pick
                    label="Buscas salvas"
                    value=""
                    options={[
                      { id: "", name: "Selecionar busca" },
                      ...(state.workflowQueries ?? []).map((q) => ({
                        id: q.id,
                        name: q.name,
                      })),
                      ...state.filters.map((q) => ({
                        id: "legacy:" + q.id,
                        name: q.name + " · anterior",
                      })),
                    ]}
                    onChange={(id) => {
                      const q = state.workflowQueries?.find((q) => q.id === id);
                      if (q) setFilters(q.filters);
                      else {
                        const old = state.filters.find(
                          (q) => "legacy:" + q.id === id,
                        )?.value;
                        if (old)
                          setFilters({
                            ...clearWorkflowFilters(),
                            search: old.search,
                            sector: old.sector,
                            education: old.education,
                            level: old.experience,
                            skills: old.skills,
                            software: old.software,
                            city: old.city,
                            availability: old.availability,
                            contract: old.contract,
                            origin: old.source,
                            from: old.from,
                            until: old.until,
                            job: old.job,
                          });
                      }
                    }}
                  />
                </div>
              )}

              <Pick
                label="Processos arquivados"
                value={filters.archived ?? ""}
                options={[
                  { id: "", name: "Ocultar arquivados" },
                  { id: "include", name: "Incluir arquivados" },
                  { id: "only", name: "Somente arquivados" },
                ]}
                onChange={(v) => {
                  setFilters({
                    ...filters,
                    archived: v as "" | "include" | "only",
                  });
                  if (v) setMode("Tabela");
                }}
              />
              <Button
                variant="ghost"
                onClick={() => setFilters(clearWorkflowFilters())}
              >
                Limpar filtros
              </Button>
            </>
          )}
          {selected.length > 0 && scope.rh && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 p-3 text-sm">
              <strong>{selected.length} selecionados</strong>
              <Button
                variant="outline"
                onClick={() => {
                  setModal("move");
                  setTarget(state.central!.stages[0].id);
                  setReason("");
                }}
              >
                Mover em lote
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setModal("attach");
                  setTarget("");
                }}
              >
                Vincular vaga / vínculo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setModal("reactivate");
                  setReason("");
                }}
              >
                Reativar selecionados
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setModal("archive");
                  setReason("");
                }}
              >
                Arquivar processos encerrados
              </Button>
              <Button variant="ghost" onClick={() => setSelected([])}>
                Limpar seleção
              </Button>
            </div>
          )}
          {mode === "Tabela" ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs">
                  <tr>
                    <th className="p-3">Seleção</th>
                    <th>Profissional</th>
                    <th>Área / vínculo</th>
                    <th>Experiência declarada</th>
                    <th>Etapa</th>
                    <th>Vaga</th>
                    <th>Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => {
                    const p = state.candidates.find(
                      (p) => p.id === a.candidate,
                    )!;
                    return (
                      <tr key={a.id} className="border-t">
                        <td className="p-3">
                          {scope.rh && (
                            <Check
                              label={`Selecionar ${p.name}`}
                              checked={selected.includes(a.id)}
                              onChange={(yes) =>
                                setSelected(
                                  yes
                                    ? [...selected, a.id]
                                    : selected.filter((id) => id !== a.id),
                                )
                              }
                            />
                          )}
                        </td>
                        <td>
                          <button
                            className="text-primary"
                            disabled={!scope.rh && !scope.leader}
                            onClick={() => open(p.id)}
                          >
                            {p.name}
                          </button>
                        </td>
                        <td>
                          {a.sector} · {a.contract}
                        </td>
                        <td className="max-w-48 text-xs">{p.experience}</td>
                        <td>
                          {stageOf(state, a.stage)?.name ??
                            a.stages.find((st) => st.id === a.stage)?.name}
                          {a.archived && <Badge>Arquivado</Badge>}
                        </td>
                        <td>{a.jobTitle}</td>
                        <td>{daysBetween(a.created)} dias</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : bank ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {apps.map(card)}
            </div>
          ) : (
            <div
              className="ats-board"
              tabIndex={0}
              role="region"
              aria-label="Kanban central de candidatos"
            >
              {state.central!.stages.map((st) => (
                <section
                  key={st.id}
                  className="ats-column"
                  onDragOver={(e) => {
                    if (scope.rh) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (scope.rh) {
                      const id = e.dataTransfer.getData("text/plain");
                      move(selected.includes(id) ? selected : [id], st.id);
                    }
                  }}
                >
                  <header
                    className="ats-column-head"
                    style={{ borderTopColor: st.color }}
                  >
                    <h2>{st.name}</h2>
                    <Badge>
                      {apps.filter((a) => a.stage === st.id).length}
                    </Badge>
                  </header>
                  <div className="space-y-2 p-2">
                    {apps.filter((a) => a.stage === st.id).map(card)}
                  </div>
                </section>
              ))}
            </div>
          )}
          {!apps.length && (
            <Empty>
              {bank
                ? "Nenhum talento selecionado neste recorte. Somente o RH inclui currículos no Banco."
                : "Nenhum processo corresponde aos filtros."}
            </Empty>
          )}
        </>
      )}
      {view === "talentos" && (
        <ResumeDatabase
          {...props}
          open={open}
          create={() => {
            setEdit(newCandidate(state.privacy.days));
            setModal("create");
          }}
        />
      )}
      {view === "vagas" && <VacancyDesk {...props} />}
      {view === "admissao" && <AdmissionBoard {...props} />}
      {view === "indicadores" && <InsightsDesk {...props} />}
      {view === "configuracoes" && <WorkflowSettings {...props} />}
      {opened && (
        <SideSheet title="Ficha do candidato" close={close}>
          <Notice error={local.error} notice={local.notice} />
          <div className="space-y-6">
            {scope.rh && <ResumeDetails {...props} id={opened} />}
            {scope.rh && (
              <CandidateOperations
                {...props}
                id={opened}
                edit={() => {
                  setEdit(state.candidates.find((p) => p.id === opened));
                  setModal("edit");
                }}
              />
            )}
            <CandidatePanel
              key={opened}
              {...props}
              id={opened}
              close={close}
              initialAssessment={queryAssessment?.id}
            />
          </div>
        </SideSheet>
      )}
      {edit && (
        <SideSheet
          title={
            modal === "create"
              ? "Cadastrar currículo em Entrada"
              : "Editar cadastro do talento"
          }
          close={() => {
            setEdit(undefined);
            setModal("");
          }}
        >
          <CandidateEditor
            initial={edit}
            save={(p) => {
              if (act((s) => registerResume(s, scope, p, modal === "create"))) {
                setEdit(undefined);
                setModal("");
              }
            }}
          />
        </SideSheet>
      )}
      {modal === "intake" && (
        <SideSheet title="Compartilhar formulário geral" close={close}>
          <div className="space-y-4">
            <p className="text-sm">
              Formulário independente e protegido para testes. Nenhuma coleta
              pública está habilitada. No mesmo navegador e conta, os envios
              entram em Entrada, sem escolher vaga.
            </p>
            <p className="text-xs text-muted-foreground">
              {state.central!.privacyNotice}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      location.origin + "/candidatura-demonstrativa",
                    );
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "Link protegido copiado" : "Copiar link protegido"}
              </Button>
              <Link
                href="/candidatura-demonstrativa"
                target="_blank"
                className="p-2 text-sm text-primary underline"
              >
                Abrir formulário independente
              </Link>
            </div>
            <CandidateForm
              form={state.forms.find((f) => f.id === state.central!.formId)!}
              submit={(answers, files, consent) => {
                const next = act((s) =>
                  submitResumeIntake(s, scope, answers, files, consent),
                );
                if (next) setModal("");
              }}
            />
          </div>
        </SideSheet>
      )}
      {modal === "match" && (
        <SideSheet title="YouCon Match · análise de evidências" close={close}>
          <MatchDesk
            {...props}
            candidates={
              selected.length
                ? selectedPeople
                : eligibleResumes(state).map((p) => p.id)
            }
          />
        </SideSheet>
      )}
      {["move", "reactivate"].includes(modal) && (
        <SideSheet
          title={
            modal === "move"
              ? "Movimentar candidatos"
              : "Reativar processo seletivo"
          }
          close={() => setModal("")}
        >
          <div className="space-y-4">
            {modal === "move" && (
              <Pick
                label="Etapa de destino"
                value={target}
                options={state.central!.stages}
                onChange={setTarget}
              />
            )}
            <AreaField
              label="Motivo da movimentação"
              value={reason}
              onChange={setReason}
            />
            <p className="text-xs">
              {selectedApps
                .map(
                  (a) =>
                    state.candidates.find((p) => p.id === a.candidate)?.name,
                )
                .join(" · ")}
              . Histórico preservado; etapas podem ser puladas.
            </p>
            <Button
              onClick={() => {
                const result = act((s) =>
                  modal === "move"
                    ? moveCentral(s, scope, selected, target, reason)
                    : selected.reduce(
                        (next, id) => reactivateCycle(next, scope, id, reason),
                        s,
                      ),
                );
                if (result) {
                  setSelected([]);
                  setModal("");
                }
              }}
            >
              Confirmar movimentação
            </Button>
          </div>
        </SideSheet>
      )}
      {modal === "archive" && (
        <SideSheet
          title="Arquiver processos encerrados"
          close={() => setModal("")}
        >
          <div className="space-y-4">
            <p className="text-sm">
              Arquivar remove os cards do quadro operacional e preserva cadastro
              e histórico. Não encerra vínculos ou admissões.
            </p>
            <AreaField
              label="Motivo do arquivamento"
              value={reason}
              onChange={setReason}
            />
            <Button
              onClick={() => {
                if (act((s) => archiveProcesses(s, scope, selected, reason))) {
                  setSelected([]);
                  setModal("");
                }
              }}
            >
              Confirmar arquivamento local
            </Button>
          </div>
        </SideSheet>
      )}
      {modal === "attach" && (
        <SideSheet
          title="Vinculação opcional de vaga"
          close={() => setModal("")}
        >
          <Pick
            label="Vaga para selecionados"
            value={target}
            onChange={setTarget}
            options={[
              { id: "", name: "Sem vaga vinculada" },
              ...state.jobs
                .filter(
                  (j) => !j.cancelled && !j.filledAt && j.state !== "Encerrada",
                )
                .map((j) => ({ id: j.id, name: j.title })),
            ]}
          />
          <Button
            onClick={() => {
              if (act((s) => attachVacancy(s, scope, selected, target))) {
                setModal("");
                setSelected([]);
              }
            }}
          >
            Salvar vinculação
          </Button>
        </SideSheet>
      )}
    </div>
  );
}
function CandidateOperations({
  state,
  scope,
  act,
  id,
  edit,
}: WorkflowProps & { id: string; edit: () => void }) {
  const p = state.candidates.find((p) => p.id === id)!,
    a = currentCycles(state).find((a) => a.candidate === id),
    [reason, setReason] = useState(""),
    [tagsDraft, setTagsDraft] = useState(p.tags.join(", ")),
    [eligibility, setEligibility] = useState(p.rehire?.eligible ?? "A revisar");
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-semibold">Triagem e relacionamento</h3>
        <Button variant="outline" onClick={edit}>
          Editar cadastro e evidências
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Experiência autodeclarada: {p.experience || "Não informada"} · resposta
        original preservada.
      </p>
      <Pick
        label="Experiência validada pelo RH"
        value={p.validatedLevel ?? "A confirmar"}
        options={choices(["A confirmar", ...experienceLevels])}
        onChange={(v) => act((s) => validateExperience(s, scope, id, v))}
      />
      {a && (
        <>
          <Pick
            label="Vaga vinculada opcional"
            value={a.job}
            options={[
              { id: "", name: "Sem vaga vinculada" },
              ...state.jobs
                .filter(
                  (j) =>
                    (!j.cancelled && !j.filledAt && j.state !== "Encerrada") ||
                    j.id === a.job,
                )
                .map((j) => ({ id: j.id, name: j.title })),
            ]}
            onChange={(job) => act((s) => attachVacancy(s, scope, [a.id], job))}
          />
          {!a.job && (
            <Pick
              label="Modalidade pretendida para admissão"
              value={a.contract}
              options={choices(p.contracts)}
              onChange={(v) =>
                act((s) => attachVacancy(s, scope, [a.id], "", v as Contract))
              }
            />
          )}
        </>
      )}
      <TextField
        label="Tags do candidato (separadas por vírgula)"
        value={tagsDraft}
        onChange={setTagsDraft}
      />
      <Button
        variant="outline"
        onClick={() =>
          act((s) =>
            saveCandidate(s, scope, {
              ...p,
              tags: tagsDraft
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            }),
          )
        }
      >
        Salvar etiquetas do candidato
      </Button>
      {a?.status === "Ativa" && (
        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
          <AreaField
            label="Parecer do RH para continuidade e proposta"
            value={reason}
            onChange={setReason}
          />
          <Button
            variant="outline"
            onClick={() => act((s) => decide(s, scope, a.id, true, reason))}
          >
            Aprovar continuidade e proposta
          </Button>
        </div>
      )}
      <p className="text-xs">Sugestões: {state.central!.tags.join(" · ")}</p>
      {a && (
        <>
          <h4 className="text-sm font-medium">
            Campos e checklist da etapa atual
          </h4>
          {visibleStageFields(stageOf(state, a.stage)!, a.fields).map((f) => (
            <StageField
              key={f.id}
              field={f}
              value={a.fields[`${a.stage}:${f.id}`] ?? ""}
              change={(v) =>
                act((s) =>
                  updateStage(
                    s,
                    scope,
                    a.id,
                    { ...a.fields, [`${a.stage}:${f.id}`]: v },
                    a.checks,
                  ),
                )
              }
            />
          ))}
          {(stageOf(state, a.stage)?.tasks ?? []).map((t) => (
            <Check
              key={t.id}
              label={t.title + (t.required ? " *" : "")}
              checked={!!a.checks[`${a.stage}:${t.id}`]}
              onChange={(yes) =>
                act((s) =>
                  updateStage(s, scope, a.id, a.fields, {
                    ...a.checks,
                    [`${a.stage}:${t.id}`]: yes,
                  }),
                )
              }
            />
          ))}
        </>
      )}
      {a && (
        <AssignmentControls
          state={state}
          scope={scope}
          act={act}
          application={a.id}
        />
      )}
      <details className="rounded-lg bg-muted/50 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Histórico de relacionamento ·{" "}
          {state.applications.filter((a) => a.candidate === id).length} ciclos
        </summary>
        <div className="mt-4 space-y-3">
          {state
            .employments!.filter((e) => e.candidate === id)
            .map((e) => (
              <p key={e.id} className="text-xs">
                {e.contract}: {e.status} · início {e.start}{" "}
                {e.end ? `· término ${e.end}` : ""}
              </p>
            ))}
          <Events
            events={state.relationships!.filter((r) => r.candidate === id)}
          />
          <Pick
            label="Elegibilidade para recontratação"
            value={eligibility}
            options={choices(["A revisar", "Elegível", "Não elegível"])}
            onChange={(v) => setEligibility(v as typeof eligibility)}
          />
          <AreaField
            label="Justificativa da revisão de elegibilidade"
            value={reason}
            onChange={setReason}
          />
          <Button
            variant="outline"
            onClick={() =>
              act((s) => rehireEligibility(s, scope, id, eligibility, reason))
            }
          >
            Registrar revisão do RH
          </Button>
        </div>
      </details>
    </section>
  );
}

function AssignmentControls({
  state,
  scope,
  act,
  application,
}: WorkflowProps & { application: string }) {
  const a = state.applications.find((a) => a.id === application)!,
    [leader, setLeader] = useState("leader-demo"),
    [cv, setCV] = useState(a.shareCV),
    [answers, setAnswers] = useState(a.shareAnswers);
  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">
        Designação técnica pela gestão RH
      </summary>
      <div className="mt-3 space-y-3">
        <TextField
          label="Identificador da liderança autorizada (demo)"
          value={leader}
          onChange={setLeader}
        />
        <Check
          label="Compartilhar currículo e portfólio com a liderança designada"
          checked={cv}
          onChange={setCV}
        />
        <Check
          label="Compartilhar respostas do formulário"
          checked={answers}
          onChange={setAnswers}
        />
        <Button
          variant="outline"
          onClick={() =>
            act((s) => assign(s, scope, a.id, leader, cv, answers))
          }
        >
          Designar acesso técnico
        </Button>
        {a.assigned.map((user) => (
          <div
            key={user}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span>{user}</span>
            <Button
              variant="ghost"
              onClick={() => act((s) => revokeAssignment(s, scope, a.id, user))}
            >
              Revogar designação {user}
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Designação somente local, sem criar papéis ou contas. Apenas usuários
          já autenticados com papel de liderança recebem o recorte designado.
          DISC, orçamento e notas confidenciais permanecem restritos.
        </p>
      </div>
    </details>
  );
}
