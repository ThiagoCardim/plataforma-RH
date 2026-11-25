"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Sparkles,
  Plus,
  GitBranch,
  CalendarDays,
  ShieldCheck,
  ArrowUpRight,
  FileCheck2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "../onboarding/components";
import { Stat, Tabs, Notice, Empty } from "../performance/components";
import { EntityForm, type Field as EntityField } from "../career/components";
import { TextField, Pick, Check } from "../academy/components";
import { type Scope, uid, dateNow, brl } from "../career/model";
import {
  type State,
  type View,
  type Job,
  type Candidate,
  type TalentFilter,
  type Form,
  type Template,
  type Rule,
  views,
  allowedView,
  funnelConversion,
  emptyFilters,
  saveJob,
  duplicateJob,
  jobState,
  saveCandidate,
  talentSearch,
  saveFilter,
  linkCandidate,
  moveApplication,
  analyzeBatch,
  saveForm,
  saveTemplate,
  saveRule,
  triggers,
  actions,
  reviewException,
  privacySettings,
  submitCareer,
  guard,
} from "./model";
import { useRecruitment } from "./store";
import { JobEditor, CandidateEditor, newCandidate } from "./editors";
import { CandidatePanel } from "./candidate-panel";
import { FormEditor, CandidateForm } from "./forms";
import "./recruitment.css";
const choices = (xs: readonly string[]) => xs.map((x) => ({ id: x, name: x }));
const field = (
  key: string,
  label: string,
  type: EntityField["type"] = "text",
  options?: EntityField["options"],
  required = true,
): EntityField => ({ key, label, type, options, required });
export function RecruitmentWorkspace({
  scope,
  initial,
  view,
  exclusive,
  token,
  assessment,
  assessmentToken,
}: {
  scope: Scope;
  initial: State;
  view: View;
  exclusive?: string;
  token?: string;
  assessment?: string;
  assessmentToken?: string;
}) {
  const local = useRecruitment(initial, scope),
    { state, act } = local,
    [job, setJob] = useState(
      view === "visao-geral" ? "" : (initial.jobs[0]?.id ?? ""),
    ),
    [search, setSearch] = useState(""),
    [sector, setSector] = useState(""),
    [contract, setContract] = useState(""),
    [owner, setOwner] = useState(""),
    [from, setFrom] = useState(""),
    [until, setUntil] = useState(""),
    [mode, setMode] = useState("Kanban"),
    [modelsTab, setModelsTab] = useState("Formulários"),
    [filters, setFilters] = useState<TalentFilter>(emptyFilters),
    [manualSelected, setSelected] = useState<string | undefined>(),
    [queryDismissed, setQueryDismissed] = useState(false),
    [jobEdit, setJobEdit] = useState<Job | undefined>(),
    [candidateEdit, setCandidateEdit] = useState<Candidate | undefined>(),
    [formEdit, setFormEdit] = useState<Form | undefined>(),
    [templateEdit, setTemplateEdit] = useState<Template | undefined>(),
    [ruleEdit, setRuleEdit] = useState<Rule | undefined>(),
    [action, setAction] = useState<{ kind: string; id?: string } | undefined>(),
    [selectedIds, setSelectedIds] = useState<string[]>([]),
    [query, setQuery] = useState(""),
    [natural, setNatural] = useState(""),
    [vacancy, setVacancy] = useState<string | undefined>(exclusive),
    [confirmation, setConfirmation] = useState("");
  const queryAssessment = scope.rh
    ? state.assessments.find(
        (x) => x.id === assessment && x.token === assessmentToken,
      )
    : undefined;
  const selected =
    manualSelected ??
    (!queryDismissed ? queryAssessment?.candidate : undefined);
  const j = state.jobs.find((x) => x.id === job) ?? state.jobs[0],
    jobs = state.jobs.filter(
      (x) =>
        (!job || view === "vagas" || x.id === job) &&
        (!sector || x.sector === sector) &&
        (!contract || x.contract === contract) &&
        (!owner || x.owner === owner),
    ),
    apps = state.applications.filter(
      (a) =>
        (!job || a.job === job) &&
        (!sector || a.sector === sector) &&
        (!contract || a.contract === contract) &&
        (!from || a.created >= from) &&
        (!until || a.created <= until) &&
        (!owner || state.jobs.find((j) => j.id === a.job)?.owner === owner),
    ),
    hired = apps.filter((a) => a.status === "Contratada"),
    active = apps.filter((a) => a.status === "Ativa"),
    talents = scope.rh ? talentSearch(state, filters) : state.candidates;
  const allowedCandidate = (id: string) =>
    scope.rh ||
    state.applications.some(
      (a) =>
        a.candidate === id && a.assigned.includes(scope.user) && scope.leader,
    );
  const modal = !!(
    selected ||
    jobEdit ||
    candidateEdit ||
    formEdit ||
    templateEdit ||
    ruleEdit ||
    action
  );
  function close() {
    setQueryDismissed(true);
    setSelected(undefined);
    setJobEdit(undefined);
    setCandidateEdit(undefined);
    setFormEdit(undefined);
    setTemplateEdit(undefined);
    setRuleEdit(undefined);
    setAction(undefined);
  }
  const message = <Notice error={local.error} notice={local.notice} />;
  const opts = (rows: { id: string; name: string }[]) =>
    rows.map((x) => ({ value: x.id, label: x.name }));
  function jobButton(x: Job) {
    return (
      <button
        key={x.id}
        aria-label={`Selecionar vaga ${x.title}`}
        onClick={() => setJob(x.id)}
        className={`ats-job-card rounded-2xl border p-5 text-left transition-shadow hover:shadow-lg ${j?.id === x.id ? "border-orange-300 bg-orange-50/50" : "bg-card"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <BriefcaseBusiness size={22} className="text-primary" />
          <Badge>{x.state}</Badge>
        </div>
        <h3 className="mt-5 text-lg font-semibold">{x.title}</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          {x.sector} · {x.contract} · {x.positions} posições
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {
            state.applications.filter(
              (a) => a.job === x.id && a.status === "Ativa",
            ).length
          }{" "}
          candidaturas ativas · previsão {x.forecast}
        </p>
      </button>
    );
  }
  function openCandidate(id: string) {
    close();
    if (allowedCandidate(id)) setSelected(id);
  }
  function candidateCard(a: State["applications"][number]) {
    const p = state.candidates.find((p) => p.id === a.candidate);
    if (!p || p.erased) return null;
    return (
      <article
        key={a.id}
        draggable={scope.rh && a.status === "Ativa"}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", a.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className="ats-candidate space-y-3 rounded-xl border bg-card p-4 shadow-sm"
      >
        <button
          className="w-full text-left"
          onClick={() => openCandidate(p.id)}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-sm font-semibold text-primary">
              {p.name.slice(0, 1)}
            </span>
            <GripVertical size={15} className="text-muted-foreground" />
          </div>
          <h4 className="mt-4 text-sm font-semibold">{p.name}</h4>
          <p className="mt-2 text-xs text-muted-foreground">
            {p.city || "Dados gerenciais"} · {a.contract}
          </p>
        </button>
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Desde {a.entered} · {a.status}
        </p>
        {scope.rh && a.status === "Ativa" && (
          <Pick
            label={`Mover ${p.name}`}
            value={a.stage}
            options={j?.stages.map((s) => ({ id: s.id, name: s.name })) ?? []}
            onChange={(target) =>
              act((s) =>
                moveApplication(
                  s,
                  scope,
                  a.id,
                  target,
                  "Movimentação manual pelo seletor do Kanban.",
                ),
              )
            }
          />
        )}
      </article>
    );
  }
  if (!local.ready)
    return <p role="status">Preparando Recrutamento e Seleção…</p>;
  return (
    <div className="ats-shell min-w-0 space-y-6">
      <div className="rounded-xl border border-orange-200 bg-accent p-4 text-xs leading-6">
        <strong>
          Recrutamento demonstrativo · dados inteiramente fictícios.
        </strong>{" "}
        Alterações e arquivos ficam neste navegador, usuário, organização e
        perfil. Sem sincronização entre contas, coleta pública, APIs de IA,
        mensagens, decisões ou contratações reais.
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">
            Recrutamento / Pessoas que constroem o próximo capítulo
          </p>
          <h1 className="page-title mt-3">
            {views.find(([id]) => id === view)?.[1]}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {scope.rh
              ? "Curadoria humana em cada decisão. Uma jornada conectada, do primeiro contato à admissão."
              : scope.director
                ? "Acompanhamento gerencial e financeiro, com dados pessoais e instrumentos restritos ao RH."
                : "Somente candidaturas e avaliações técnicas designadas pelo RH."}
          </p>
        </div>
        {scope.rh && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  confirm(
                    "Restaurar apenas os exemplos de Recrutamento deste escopo? Não altera os demais módulos.",
                  )
                )
                  act(() => initial, "Exemplos de Recrutamento restaurados.");
              }}
            >
              Restaurar exemplos
            </Button>
            {view === "vagas" && (
              <Button
                onClick={() => {
                  close();
                  setJobEdit({
                    ...structuredClone(state.jobs[0]),
                    id: uid(),
                    title: "",
                    state: "Rascunho",
                    token: uid(),
                    created: dateNow(),
                    closed: undefined,
                  });
                }}
              >
                <Plus size={16} />
                Nova vaga
              </Button>
            )}
            {view === "talentos" && (
              <Button
                onClick={() => {
                  close();
                  setCandidateEdit(newCandidate());
                }}
              >
                <Plus size={16} />
                Novo talento
              </Button>
            )}
          </div>
        )}
      </header>
      <nav
        aria-label="Áreas de Recrutamento"
        className="flex gap-2 overflow-x-auto border-b pb-3"
      >
        {views
          .filter(([v]) => allowedView(scope, v))
          .map(([v, label]) => (
            <Link
              key={v}
              href={`/recrutamento/${v}`}
              aria-current={view === v ? "page" : undefined}
              className={`shrink-0 rounded-xl px-4 py-3 text-sm font-medium ${view === v ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </Link>
          ))}
      </nav>
      {message}
      {["visao-geral", "vagas"].includes(view) && (
        <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-6">
          <Pick
            label="Vaga no acompanhamento"
            value={job}
            onChange={setJob}
            options={[
              { id: "", name: "Todas as vagas" },
              ...state.jobs.map((j) => ({ id: j.id, name: j.title })),
            ]}
          />
          <Pick
            label="Setor no acompanhamento"
            value={sector}
            onChange={setSector}
            options={[
              { id: "", name: "Todos os setores" },
              ...choices([...new Set(state.jobs.map((j) => j.sector))]),
            ]}
          />
          <Pick
            label="Vínculo no acompanhamento"
            value={contract}
            onChange={setContract}
            options={[
              { id: "", name: "Todos os vínculos" },
              ...choices(["CLT", "Estágio", "PJ"]),
            ]}
          />
          <Pick
            label="Responsável no acompanhamento"
            value={owner}
            onChange={setOwner}
            options={[
              { id: "", name: "Todos os responsáveis" },
              ...choices([...new Set(state.jobs.map((j) => j.owner))]),
            ]}
          />
          <TextField
            label="Candidaturas a partir de"
            type="date"
            value={from}
            onChange={setFrom}
          />
          <TextField
            label="Candidaturas até"
            type="date"
            value={until}
            onChange={setUntil}
          />
        </div>
      )}
      {view === "visao-geral" && (
        <>
          <section className="ats-hero relative overflow-hidden rounded-[26px] bg-stone-950 p-7 text-white sm:p-10">
            <div className="relative z-10 grid gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="text-xs uppercase tracking-[.22em] text-orange-200">
                  Da intenção ao próximo encontro
                </p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight">
                  Talento encontra oportunidade.
                  <br />
                  <span className="text-orange-300">
                    Você conduz a jornada.
                  </span>
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-stone-300">
                  Organize vagas, conversas e evidências com clareza. Nenhum
                  algoritmo decide quem avança.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [
                    "Vagas publicadas",
                    jobs.filter((j) => j.state === "Publicada").length,
                  ],
                  ["Candidaturas ativas", active.length],
                  [
                    "Previstas",
                    jobs.filter((j) => j.state === "Prevista").length,
                  ],
                  ["Contratações", hired.length],
                ].map(([label, n]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/5 p-5"
                  >
                    <p className="text-3xl font-semibold">{n}</p>
                    <p className="mt-3 text-xs text-stone-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Vagas encerradas"
              value={jobs.filter((j) => j.state === "Encerrada").length}
            />
            <Stat
              label="Entrevistas agendadas"
              value={
                state.interviews.filter(
                  (i) =>
                    i.state === "Agendada" &&
                    apps.some((a) => a.id === i.application),
                ).length
              }
            />
            <Stat
              label="Tempo médio de contratação"
              value={
                hired.length
                  ? `${Math.round(hired.reduce((n, a) => n + (Date.parse(a.hiredAt!) - Date.parse(a.created)) / 86400000, 0) / hired.length)} dias`
                  : "Sem contratação no recorte"
              }
            />
            <Stat
              label="Propostas em andamento"
              value={
                state.offers.filter(
                  (o) =>
                    ["Preparação", "Enviada (simulação)"].includes(o.state) &&
                    apps.some((a) => a.id === o.application),
                ).length
              }
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-5 rounded-2xl border bg-card p-6">
              <h2 className="section-title">Funil e conversão por etapa</h2>
              <p className="text-xs leading-6 text-muted-foreground">
                Passagens registradas por candidatura, sem inferir que uma etapa
                foi concluída apenas pela posição atual.
              </p>
              {(j?.stages ?? []).map((st, i, all) => {
                const count = apps.filter((a) =>
                    a.visits.some((v) => v.stage === st.id),
                  ).length,
                  conversion = funnelConversion(
                    apps,
                    st.id,
                    i ? all[i - 1].id : undefined,
                  );
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setAction({ kind: "stage-list", id: st.id });
                    }}
                    className="block w-full text-left"
                  >
                    <GoalBar
                      label={st.name}
                      value={count}
                      target={apps.length || 1}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {count} passagens ·{" "}
                      {conversion === null ? "—" : `${conversion}%`} sobre{" "}
                      {i ? "a etapa anterior" : "as inscrições"}
                    </p>
                  </button>
                );
              })}
            </section>
            <section className="space-y-5 rounded-2xl border bg-card p-6">
              <h2 className="section-title">Origem dos talentos no recorte</h2>
              {[
                ...new Set(
                  apps.map(
                    (a) =>
                      state.candidates.find((p) => p.id === a.candidate)
                        ?.source || "Informação gerencial",
                  ),
                ),
              ].map((source) => (
                <GoalBar
                  key={source}
                  label={source}
                  value={
                    apps.filter(
                      (a) =>
                        (state.candidates.find((p) => p.id === a.candidate)
                          ?.source || "Informação gerencial") === source,
                    ).length
                  }
                  target={apps.length || 1}
                />
              ))}
              {(scope.rh || scope.director) && (
                <div className="rounded-xl bg-muted p-5">
                  <p className="text-xs text-muted-foreground">
                    Custo cadastrado das vagas filtradas / contratação
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {hired.length
                      ? brl(
                          jobs.reduce((n, j) => n + (j.cost ?? 0), 0) /
                            hired.length,
                        )
                      : "Aguardando contratação"}
                  </p>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    Custos fictícios do cadastro das vagas; sem integração
                    contábil ou rateio definitivo.
                  </p>
                </div>
              )}
            </section>
          </div>
          {(scope.rh || scope.director) && (
            <section className="space-y-4 rounded-2xl border bg-card p-6">
              <h2 className="section-title">Exceções financeiras</h2>
              {state.exceptions.map((x) => (
                <article
                  key={x.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {brl(x.amount)} · {x.state}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {
                        state.applications.find((a) => a.id === x.application)
                          ?.jobTitle
                      }
                    </p>
                    <p className="mt-3 text-sm">{x.reason}</p>
                    {x.comment && (
                      <p className="mt-3 text-sm">Parecer: {x.comment}</p>
                    )}
                  </div>
                  {scope.director && x.state === "Pendente" && (
                    <Button
                      variant="outline"
                      onClick={() => setAction({ kind: "exception", id: x.id })}
                    >
                      Revisar exceção financeira
                    </Button>
                  )}
                </article>
              ))}
            </section>
          )}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="section-title">Calendário local de entrevistas</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {state.interviews
                .filter((x) => apps.some((a) => a.id === x.application))
                .map((x) => (
                  <article key={x.id} className="rounded-xl border p-4">
                    <CalendarDays size={20} className="text-primary" />
                    <p className="mt-3 text-sm font-medium">{x.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {x.date} · {x.time} Brasília · {x.state}
                    </p>
                  </article>
                ))}
            </div>
          </section>
        </>
      )}
      {view === "vagas" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map(jobButton)}
          </div>
          {j && (
            <section className="space-y-5 rounded-2xl border bg-card p-5">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="section-title">{j.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {j.state} ·{" "}
                    {j.visibility === "Link exclusivo"
                      ? "Acesso por link exclusivo protegido"
                      : "Listada apenas na prévia protegida"}{" "}
                    · r{j.revision}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scope.rh && (
                    <>
                      <Button variant="outline" onClick={() => setJobEdit(j)}>
                        Editar vaga
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => act((s) => duplicateJob(s, scope, j.id))}
                      >
                        Duplicar vaga
                      </Button>
                      {j.state !== "Encerrada" && (
                        <>
                          <Button
                            onClick={() =>
                              act((s) => jobState(s, scope, j.id, "Publicada"))
                            }
                          >
                            Publicar vaga local
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              act((s) => jobState(s, scope, j.id, "Pausada"))
                            }
                          >
                            Pausar vaga
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  "Encerrar a vaga demonstrativa, preservando os processos e seu histórico?",
                                )
                              )
                                act((s) =>
                                  jobState(s, scope, j.id, "Encerrada"),
                                );
                            }}
                          >
                            Encerrar vaga
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Tabs
                    label="Visualização das candidaturas"
                    items={["Kanban", "Lista"]}
                    value={mode}
                    change={setMode}
                  />
                </div>
              </header>
              {(scope.rh || scope.director) && (
                <p className="text-xs text-muted-foreground">
                  Orçamento mensal aprovado {brl(j.budget ?? 0)} · custo de
                  seleção {brl(j.cost ?? 0)}
                </p>
              )}
              {scope.rh && j.visibility === "Link exclusivo" && (
                <Link
                  className="block break-all rounded-xl bg-muted p-3 text-xs text-primary underline"
                  href={`/recrutamento/carreiras?vaga=${j.id}&acesso=${j.token}`}
                >
                  Abrir oportunidade exclusiva na demonstração protegida
                </Link>
              )}
              <TextField
                label="Pesquisar candidaturas desta vaga"
                value={search}
                onChange={setSearch}
              />
              {mode === "Kanban" ? (
                <div
                  className="ats-board flex gap-4 overflow-x-auto pb-4"
                  aria-label="Kanban de recrutamento"
                >
                  {j.stages.map((st) => (
                    <section
                      key={st.id}
                      data-stage={st.id}
                      aria-label={`Etapa ${st.name}`}
                      className="w-[265px] shrink-0 space-y-3 rounded-2xl bg-muted/55 p-3"
                      onDragOver={(e) => {
                        if (scope.rh) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (scope.rh)
                          act((s) =>
                            moveApplication(
                              s,
                              scope,
                              e.dataTransfer.getData("text/plain"),
                              st.id,
                              "Movimentação manual por arrastar e soltar.",
                            ),
                          );
                      }}
                    >
                      <header className="flex items-center justify-between px-1 py-3">
                        <h3 className="text-sm font-semibold">{st.name}</h3>
                        <Badge>
                          {
                            state.applications.filter(
                              (a) => a.job === j.id && a.stage === st.id,
                            ).length
                          }
                        </Badge>
                      </header>
                      {state.applications
                        .filter(
                          (a) =>
                            a.job === j.id &&
                            a.stage === st.id &&
                            state.candidates.some(
                              (p) =>
                                p.id === a.candidate &&
                                !p.erased &&
                                p.name
                                  .toLowerCase()
                                  .includes(search.toLowerCase()),
                            ),
                        )
                        .map(candidateCard)}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Candidaturas da vaga</caption>
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="p-3">Talento</th>
                        <th>Etapa</th>
                        <th>Status</th>
                        <th>Responsáveis designados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.applications
                        .filter((a) => a.job === j.id)
                        .map((a) => (
                          <tr key={a.id} className="border-b">
                            <td className="p-3">
                              {scope.rh || scope.leader ? (
                                <button
                                  className="font-medium text-primary underline"
                                  onClick={() => openCandidate(a.candidate)}
                                >
                                  {
                                    state.candidates.find(
                                      (p) => p.id === a.candidate,
                                    )?.name
                                  }
                                </button>
                              ) : (
                                state.candidates.find(
                                  (p) => p.id === a.candidate,
                                )?.name
                              )}
                            </td>
                            <td>
                              {j.stages.find((s) => s.id === a.stage)?.name}
                            </td>
                            <td>{a.status}</td>
                            <td>{a.assigned.join(", ") || "A definir"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {scope.rh && (
                <Button
                  variant="outline"
                  onClick={() => setAction({ kind: "link", id: j.id })}
                >
                  Vincular talento do banco
                </Button>
              )}
            </section>
          )}
        </>
      )}
      {view === "talentos" && scope.rh && (
        <>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setAction({ kind: "privacy" })}
            >
              <ShieldCheck size={16} />
              Finalidade e retenção
            </Button>
            <Pick
              label="Consulta salva de talentos"
              value=""
              onChange={(id) => {
                const x = state.filters.find((x) => x.id === id);
                if (x) setFilters(x.value);
              }}
              options={[
                { id: "", name: "Selecione uma consulta salva" },
                ...state.filters.map((x) => ({ id: x.id, name: x.name })),
              ]}
            />
            <Button
              variant="outline"
              onClick={() => setAction({ kind: "filter" })}
            >
              Salvar combinação de filtros
            </Button>
            <Button variant="ghost" onClick={() => setFilters(emptyFilters())}>
              Limpar filtros
            </Button>
          </div>
          <details className="rounded-2xl border bg-card p-5" open>
            <summary className="cursor-pointer font-semibold">
              Busca avançada e filtros combináveis
            </summary>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  ["search", "Buscar talento"],
                  ["sector", "Setor no banco"],
                  ["education", "Formação no banco"],
                  ["experience", "Experiência no banco"],
                  ["skills", "Competências no banco"],
                  ["software", "Softwares no banco"],
                  ["city", "Localização no banco"],
                  ["availability", "Disponibilidade no banco"],
                  ["salary", "Pretensão até (R$)"],
                  ["source", "Origem no banco"],
                ] as const
              ).map(([k, label]) => (
                <TextField
                  key={k}
                  label={label}
                  value={filters[k]}
                  type={k === "salary" ? "number" : "text"}
                  onChange={(v) => setFilters({ ...filters, [k]: v })}
                />
              ))}
              <Pick
                label="Vínculo no banco"
                value={filters.contract}
                onChange={(v) => setFilters({ ...filters, contract: v })}
                options={[
                  { id: "", name: "Todos" },
                  ...choices(["CLT", "Estágio", "PJ"]),
                ]}
              />
              <Pick
                label="Vaga de compatibilidade no banco"
                value={filters.job}
                onChange={(v) => setFilters({ ...filters, job: v })}
                options={[
                  { id: "", name: "Sem análise por vaga" },
                  ...state.jobs.map((j) => ({ id: j.id, name: j.title })),
                ]}
              />
              <TextField
                label="Compatibilidade demonstrativa mínima (%)"
                type="number"
                min="0"
                value={filters.compatibility}
                onChange={(v) => setFilters({ ...filters, compatibility: v })}
              />
              <TextField
                label="Cadastro a partir de"
                type="date"
                value={filters.from}
                onChange={(v) => setFilters({ ...filters, from: v })}
              />
              <TextField
                label="Cadastro até"
                type="date"
                value={filters.until}
                onChange={(v) => setFilters({ ...filters, until: v })}
              />
            </div>
          </details>
          <p className="text-sm text-muted-foreground">
            {talents.length} talentos no recorte ·{" "}
            {
              state.candidates.filter(
                (p) => !p.erased && p.retentionUntil < dateNow(),
              ).length
            }{" "}
            cadastros com retenção a revisar
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {talents.map((p) => (
              <article
                key={p.id}
                className="ats-talent rounded-2xl border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-lg font-semibold text-primary">
                    {p.name[0]}
                  </div>
                  <Badge>{p.contracts.join(" / ")}</Badge>
                </div>
                <button
                  onClick={() => openCandidate(p.id)}
                  className="mt-5 block text-left"
                >
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {p.sector} · {p.city}
                  </p>
                </button>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  {p.skills || "Competências a confirmar"} ·{" "}
                  {p.software || "Softwares a confirmar"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCandidate(p.id)}
                  >
                    Abrir ficha
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCandidateEdit(p)}
                  >
                    Editar talento
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAction({ kind: "link-person", id: p.id })}
                  >
                    Vincular a vaga
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!talents.length && (
            <Empty>Nenhum talento neste conjunto de filtros.</Empty>
          )}
        </>
      )}
      {view === "match" && scope.rh && (
        <>
          <section className="ats-match rounded-[26px] bg-stone-950 p-7 text-white sm:p-10">
            <div className="flex items-center gap-3 text-orange-200">
              <Sparkles />
              <p className="text-xs uppercase tracking-[.22em]">
                Inteligência de recrutamento · simulação local
              </p>
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight">
              Evidências para uma conversa melhor.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-300">
              Compatibilidade demonstrativa calculada por regras locais. Sem
              modelo de IA, envio de currículo, diagnóstico, decisão ou
              movimentação automática. Informações ausentes pedem confirmação.
            </p>
          </section>
          <div className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
            <Pick
              label="Vaga para YouCon Match"
              value={job}
              onChange={setJob}
              options={state.jobs
                .filter((j) => j.state !== "Encerrada")
                .map((j) => ({ id: j.id, name: j.title }))}
            />
            <TextField
              label="Busca em linguagem natural (simulação por termos)"
              value={natural}
              onChange={setNatural}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setQuery(natural)}>
                Buscar no banco por termos
              </Button>
              <Button
                onClick={() =>
                  act(
                    (s) => analyzeBatch(s, scope, j.id, selectedIds),
                    "Análise demonstrativa registrada; nenhuma decisão ou movimentação foi realizada.",
                  )
                }
              >
                Analisar selecionados ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  act((s) =>
                    analyzeBatch(
                      s,
                      scope,
                      j.id,
                      state.candidates
                        .filter(
                          (p) => !p.erased && p.contracts.includes(j.contract),
                        )
                        .map((p) => p.id),
                    ),
                  )
                }
              >
                Analisar lote compatível com o vínculo
              </Button>
            </div>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            Percentual considera o peso dos requisitos documentados; cobertura
            mostra o quanto se sabe. Baixa cobertura não significa baixa
            competência. Não use percentuais isolados para decidir.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.candidates
              .filter((p) => !p.erased && p.contracts.includes(j.contract))
              .filter((p) =>
                query
                  .toLowerCase()
                  .split(/\s+/)
                  .filter(
                    (t) =>
                      t.length > 2 &&
                      ![
                        "com",
                        "para",
                        "que",
                        "dos",
                        "das",
                        "uma",
                        "por",
                        "em",
                      ].includes(t),
                  )
                  .every((t) =>
                    [
                      p.name,
                      p.city,
                      p.education,
                      p.experience,
                      p.skills,
                      p.software,
                      p.availability,
                      p.summary,
                    ]
                      .join(" ")
                      .toLowerCase()
                      .includes(t),
                  ),
              )
              .map((p) => {
                const result = state.analyses.find(
                  (x) =>
                    x.job === j.id &&
                    x.candidate === p.id &&
                    x.jobRevision === j.revision,
                );
                return (
                  <article
                    key={p.id}
                    className="space-y-4 rounded-2xl border bg-card p-5"
                  >
                    <Check
                      label={`Selecionar ${p.name} para comparar`}
                      checked={selectedIds.includes(p.id)}
                      onChange={(yes) =>
                        setSelectedIds(
                          yes
                            ? [...selectedIds, p.id]
                            : selectedIds.filter((x) => x !== p.id),
                        )
                      }
                    />
                    <button
                      className="text-left"
                      onClick={() => openCandidate(p.id)}
                    >
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {p.city} · {p.skills || "Informações a confirmar"}
                      </p>
                    </button>
                    {result ? (
                      <>
                        <p className="text-4xl font-semibold tracking-tight text-primary">
                          {result.result.percentage === null
                            ? "—"
                            : `${result.result.percentage}%`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cobertura documental {result.result.coverage}% · vaga
                          r{result.jobRevision}
                        </p>
                        {result.result.criteria.map((r) => (
                          <details
                            key={r.criterion.id}
                            className="rounded-xl border p-3"
                          >
                            <summary className="cursor-pointer text-xs font-medium">
                              {r.criterion.expected} · {r.status}
                              {r.criterion.mandatory ? " · obrigatório" : ""}
                            </summary>
                            <p className="mt-3 text-xs leading-6 text-muted-foreground">
                              {r.evidence}
                            </p>
                          </details>
                        ))}
                        <details className="rounded-xl bg-accent/40 p-4">
                          <summary className="cursor-pointer text-xs font-medium">
                            Resumo e perguntas sugeridas
                          </summary>
                          <p className="mt-3 text-xs leading-6">
                            {result.result.summary}
                          </p>
                          {result.result.questions.map((q) => (
                            <p className="mt-3 text-xs leading-6" key={q}>
                              {q}
                            </p>
                          ))}
                        </details>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aguardando análise nesta revisão de critérios.
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        act((s) => analyzeBatch(s, scope, j.id, [p.id]))
                      }
                    >
                      Analisar este currículo fictício
                    </Button>
                  </article>
                );
              })}
          </div>
          {selectedIds.length > 1 && (
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="section-title">Comparação lado a lado</h2>
              <p className="mt-3 text-xs text-muted-foreground">
                Mesma vaga e revisão. Apenas evidências profissionais; nenhuma
                classificação definitiva.
              </p>
              <div className="mt-5 flex gap-4 overflow-x-auto pb-3">
                {selectedIds.map((id) => {
                  const p = state.candidates.find((p) => p.id === id),
                    r = state.analyses.find(
                      (x) =>
                        x.candidate === id &&
                        x.job === j.id &&
                        x.jobRevision === j.revision,
                    );
                  return p ? (
                    <article
                      key={id}
                      className="w-64 shrink-0 rounded-xl border p-4"
                    >
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="mt-4 text-sm">
                        {r
                          ? `${r.result.percentage ?? "—"}% · cobertura ${r.result.coverage}%`
                          : "Analise a revisão atual"}
                      </p>
                      {r?.result.criteria.map((x) => (
                        <p className="mt-3 text-xs" key={x.criterion.id}>
                          {x.criterion.expected}: {x.status}
                        </p>
                      ))}
                    </article>
                  ) : null;
                })}
              </div>
            </section>
          )}
        </>
      )}
      {view === "modelos" && scope.rh && (
        <>
          <Tabs
            label="Modelos de recrutamento"
            items={[
              "Formulários",
              "Modelos e instrumentos",
              "Automações",
              "Integrações preparadas",
            ]}
            value={modelsTab}
            change={setModelsTab}
          />
          {modelsTab === "Formulários" && (
            <>
              <Button
                onClick={() =>
                  setFormEdit({
                    ...structuredClone(state.forms[0]),
                    id: uid(),
                    name: "Novo formulário",
                  })
                }
              >
                Criar formulário
              </Button>
              <div className="grid gap-4 sm:grid-cols-2">
                {state.forms.map((f) => (
                  <article
                    key={f.id}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <h3 className="text-lg font-semibold">{f.name}</h3>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {f.fields.length} campos · v{f.version}
                    </p>
                    <Button
                      className="mt-5"
                      variant="outline"
                      onClick={() => setFormEdit(f)}
                    >
                      Editar formulário {f.name}
                    </Button>
                  </article>
                ))}
              </div>
            </>
          )}
          {modelsTab === "Modelos e instrumentos" && (
            <>
              <Button
                onClick={() =>
                  setTemplateEdit({
                    id: uid(),
                    name: "",
                    kind: "Entrevista",
                    body: "",
                    questions: [],
                    version: 0,
                  })
                }
              >
                Novo modelo
              </Button>
              <div className="grid gap-4 sm:grid-cols-2">
                {state.templates.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <Badge>
                      {t.kind} · v{t.version}
                    </Badge>
                    <h3 className="mt-4 text-lg font-semibold">{t.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {t.body}
                    </p>
                    <div className="mt-5 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setTemplateEdit(t)}
                      >
                        Personalizar modelo
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          act((s) =>
                            saveTemplate(s, scope, {
                              ...t,
                              id: uid(),
                              name: t.name + " · cópia",
                            }),
                          )
                        }
                      >
                        Duplicar modelo
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {modelsTab === "Automações" && (
            <>
              <div className="rounded-xl bg-accent p-5 text-sm leading-7">
                Configure gatilho, condição e ação. Os fluxos registram
                intenções locais e checklists da candidatura; não enviam
                mensagens, não movimentam pessoas por Match e não aprovam
                propostas ou contratações.
              </div>
              <Button
                onClick={() =>
                  setRuleEdit({
                    id: uid(),
                    name: "Nova automação",
                    trigger: "Nova candidatura",
                    action: "Criar card",
                    sector: "",
                    contract: "",
                    active: false,
                  })
                }
              >
                Nova automação
              </Button>
              <div className="grid gap-4 sm:grid-cols-2">
                {state.rules.map((r) => (
                  <article
                    key={r.id}
                    className="space-y-4 rounded-2xl border bg-card p-5"
                  >
                    <p className="text-xs uppercase tracking-wider text-primary">
                      {r.active ? "Ativa na simulação" : "Desativada"}
                    </p>
                    <div className="flex items-center gap-3">
                      <GitBranch size={20} />
                      <h3 className="font-semibold">{r.trigger}</h3>
                    </div>
                    <p className="pl-8 text-sm">→ {r.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.sector || "Todos os setores"} ·{" "}
                      {r.contract || "Todos os vínculos"}
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setRuleEdit(r)}>
                        Editar automação
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          act((s) =>
                            saveRule(s, scope, { ...r, active: !r.active }),
                          )
                        }
                      >
                        {r.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
              <section className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">Execuções simuladas</h3>
                {[...state.logs].reverse().map((l) => (
                  <p
                    key={l.id}
                    className="mt-4 border-t pt-4 text-xs leading-6"
                  >
                    {l.action} · {new Date(l.at).toLocaleString("pt-BR")}
                  </p>
                ))}
                {!state.logs.length && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Realize ações nas candidaturas para testar os gatilhos.
                  </p>
                )}
              </section>
            </>
          )}
          {modelsTab === "Integrações preparadas" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Programa de Indicação de Vagas",
                  "Base Central de Pessoas",
                  "Admissão e contratação",
                  "Onboarding",
                  "Calendário",
                  "Dashboard Gerencial",
                ].map((name) => (
                  <article
                    key={name}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <FileCheck2 size={24} className="text-primary" />
                    <h3 className="mt-4 font-semibold">{name}</h3>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Referências canônicas e dados autorizados preparados. Sem
                      conexão remota, criação de conta, convite ou registro
                      definitivo.
                    </p>
                  </article>
                ))}
              </div>
              {state.handoffs.map((h) => (
                <article key={h.id} className="rounded-xl border p-5">
                  <h3 className="font-semibold">{h.state}</h3>
                  <p className="mt-3 break-all text-xs">{h.id}</p>
                  <p className="mt-3 text-sm">
                    {Object.entries(h.fields)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                  <Link
                    className="mt-4 inline-block text-sm text-primary underline"
                    href="/onboarding-offboarding"
                  >
                    Consultar Onboarding existente
                  </Link>
                </article>
              ))}
            </>
          )}
        </>
      )}
      {view === "carreiras" && scope.rh && (
        <>
          <section className="ats-careers relative overflow-hidden rounded-[28px] bg-stone-950 p-8 text-white sm:p-12">
            <p className="text-xs uppercase tracking-[.24em] text-orange-200">
              YouCon · Carreiras · Prévia protegida
            </p>
            <h2 className="mt-8 max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
              {state.career.title}
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-8 text-stone-300">
              {state.career.intro}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-stone-300">
              {state.career.culture}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 text-sm text-orange-200 underline"
                href="/cultura"
              >
                Conhecer a Cultura <ArrowUpRight size={15} />
              </Link>
              <Button
                variant="outline"
                onClick={() => setAction({ kind: "career-settings" })}
              >
                Personalizar página
              </Button>
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Buscar oportunidades na prévia"
              value={search}
              onChange={setSearch}
            />
            <Pick
              label="Setor da página de carreiras"
              value={sector}
              onChange={setSector}
              options={[
                { id: "", name: "Todos os setores" },
                ...choices([...new Set(state.jobs.map((j) => j.sector))]),
              ]}
            />
          </div>
          {exclusive &&
            !state.jobs.some(
              (j) =>
                j.id === exclusive &&
                j.state === "Publicada" &&
                (j.visibility === "Listada" || j.token === token),
            ) && (
              <p role="alert" className="text-sm text-destructive">
                Oportunidade exclusiva indisponível ou link inválido.
              </p>
            )}
          <div className="grid gap-4 md:grid-cols-2">
            {state.jobs
              .filter(
                (j) =>
                  j.state === "Publicada" &&
                  (j.visibility === "Listada" ||
                    (j.id === exclusive && j.token === token)) &&
                  (!sector || j.sector === sector) &&
                  j.title.toLowerCase().includes(search.toLowerCase()),
              )
              .map((j) => (
                <button
                  key={j.id}
                  onClick={() => {
                    setVacancy(j.id);
                    setConfirmation("");
                  }}
                  className="rounded-2xl border bg-card p-6 text-left hover:border-orange-300"
                >
                  <div className="flex items-center justify-between">
                    <Badge>{j.contract}</Badge>
                    <ArrowUpRight size={20} className="text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{j.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {j.sector} · {j.positions} posições · demonstração
                  </p>
                </button>
              ))}
          </div>
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="section-title">
              Seu talento também pode construir novos caminhos.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Cadastre um perfil fictício no Banco de Talentos para testar o
              formulário geral.
            </p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => {
                setVacancy("bank");
                setConfirmation("");
              }}
            >
              Simular cadastro no Banco de Talentos
            </Button>
          </section>
          {vacancy && (
            <section
              className="space-y-5 rounded-2xl border p-6"
              style={{ borderColor: state.career.color }}
            >
              {vacancy !== "bank" ? (
                (() => {
                  const v = state.jobs.find(
                    (j) =>
                      j.id === vacancy &&
                      j.state === "Publicada" &&
                      (j.visibility === "Listada" ||
                        (j.id === exclusive && j.token === token)),
                  );
                  return v ? (
                    <>
                      <h2 className="section-title">{v.title}</h2>
                      {[
                        v.description,
                        v.activities,
                        v.requirements,
                        v.benefits,
                      ].map((t, i) => (
                        <p
                          key={i}
                          className="whitespace-pre-wrap text-sm leading-7"
                        >
                          {t}
                        </p>
                      ))}
                      <CandidateForm
                        key={v.id + ":" + v.form.version}
                        form={v.form}
                        submit={(a, f, consent) => {
                          if (
                            act((s) =>
                              submitCareer(
                                s,
                                scope,
                                v.id,
                                v.form,
                                a,
                                f,
                                consent,
                                token,
                              ),
                            )
                          )
                            setConfirmation(v.form.message);
                        }}
                      />
                    </>
                  ) : (
                    <Empty>Oportunidade indisponível.</Empty>
                  );
                })()
              ) : (
                <CandidateForm
                  form={state.forms[0]}
                  submit={(a, f, consent) => {
                    if (
                      act((s) =>
                        submitCareer(
                          s,
                          scope,
                          undefined,
                          state.forms[0],
                          a,
                          f,
                          consent,
                        ),
                      )
                    )
                      setConfirmation(state.forms[0].message);
                  }}
                />
              )}
              {confirmation && (
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900"
                >
                  {confirmation}
                </p>
              )}
            </section>
          )}
        </>
      )}
      {modal &&
        selected &&
        allowedCandidate(selected) &&
        state.candidates.some((p) => p.id === selected && !p.erased) && (
          <Modal title="Ficha do candidato" close={close}>
            {message}
            <CandidatePanel
              key={selected}
              id={selected}
              initialAssessment={
                queryAssessment?.candidate === selected
                  ? queryAssessment.id
                  : undefined
              }
              state={state}
              scope={scope}
              act={act}
              close={close}
            />
          </Modal>
        )}
      {jobEdit && scope.rh && (
        <Modal title="Editor de vaga e processo" close={close}>
          {message}
          <JobEditor
            initial={jobEdit}
            state={state}
            save={(x) => {
              if (act((s) => saveJob(s, scope, x))) {
                setJob(x.id);
                close();
              }
            }}
          />
        </Modal>
      )}
      {candidateEdit && scope.rh && (
        <Modal title="Cadastro de talento demonstrativo" close={close}>
          {message}
          <CandidateEditor
            initial={candidateEdit}
            save={(x) => {
              if (act((s) => saveCandidate(s, scope, x))) close();
            }}
          />
        </Modal>
      )}
      {formEdit && scope.rh && (
        <Modal title="Construtor de formulários" close={close}>
          {message}
          <FormEditor
            initial={formEdit}
            save={(x) => {
              if (act((s) => saveForm(s, scope, x))) close();
            }}
          />
        </Modal>
      )}
      {templateEdit && scope.rh && (
        <Modal title="Modelo de recrutamento" close={close}>
          {message}
          <EntityForm
            fields={[
              field("name", "Nome do modelo"),
              field(
                "kind",
                "Tipo do modelo",
                "select",
                opts(
                  choices([
                    "Processo",
                    "DISC",
                    "Temperamentos",
                    "Entrevista",
                    "Avaliação técnica",
                    "Teste prático",
                    "Proposta",
                    "Mensagem",
                    "Motivo de encerramento",
                  ]),
                ),
              ),
              field("body", "Conteúdo do modelo", "textarea"),
              field(
                "questions",
                "Perguntas (uma por linha)",
                "textarea",
                undefined,
                false,
              ),
            ]}
            initial={{
              name: templateEdit.name,
              kind: templateEdit.kind,
              body: templateEdit.body,
              questions: templateEdit.questions.join("\n"),
            }}
            save={(d) => {
              if (
                act((s) =>
                  saveTemplate(s, scope, {
                    ...templateEdit,
                    name: d.name,
                    kind: d.kind as Template["kind"],
                    body: d.body,
                    questions: d.questions.split("\n").filter(Boolean),
                    stages:
                      d.kind === "Processo"
                        ? (templateEdit.stages ?? structuredClone(j.stages))
                        : undefined,
                  }),
                )
              ) {
                close();
                return true;
              }
              return false;
            }}
          />
        </Modal>
      )}
      {ruleEdit && scope.rh && (
        <Modal title="Configurar automação local" close={close}>
          {message}
          <EntityForm
            fields={[
              field("name", "Nome da automação"),
              field("trigger", "Gatilho", "select", opts(choices(triggers))),
              field(
                "action",
                "Ação simulada",
                "select",
                opts(choices(actions)),
              ),
              field("sector", "Condição: setor", "select", [
                { value: "", label: "Todos" },
                ...opts(choices([...new Set(state.jobs.map((j) => j.sector))])),
              ]),
              field("contract", "Condição: vínculo", "select", [
                { value: "", label: "Todos" },
                ...opts(choices(["CLT", "Estágio", "PJ"])),
              ]),
              field("active", "Ativar na simulação", "checkbox"),
            ]}
            initial={{
              name: ruleEdit.name,
              trigger: ruleEdit.trigger,
              action: ruleEdit.action,
              sector: ruleEdit.sector,
              contract: ruleEdit.contract,
              active: String(ruleEdit.active),
            }}
            save={(d) => {
              if (
                act((s) =>
                  saveRule(s, scope, {
                    ...ruleEdit,
                    name: d.name,
                    trigger: d.trigger as Rule["trigger"],
                    action: d.action as Rule["action"],
                    sector: d.sector,
                    contract: d.contract,
                    active: d.active === "true",
                  }),
                )
              ) {
                close();
                return true;
              }
              return false;
            }}
          />
        </Modal>
      )}
      {action && (
        <Modal
          title={
            action.kind === "stage-list"
              ? "Candidaturas na etapa"
              : "Ação de recrutamento"
          }
          close={close}
        >
          {message}
          {action.kind === "stage-list" && (
            <div className="space-y-3">
              {apps
                .filter((a) => a.visits.some((v) => v.stage === action.id))
                .map((a) => (
                  <article key={a.id} className="rounded-xl border p-4">
                    <p className="text-sm">
                      {state.candidates.find((p) => p.id === a.candidate)?.name}{" "}
                      · {a.jobTitle}
                    </p>
                    {!scope.director && (
                      <Button
                        className="mt-3"
                        variant="outline"
                        onClick={() => openCandidate(a.candidate)}
                      >
                        Abrir ficha
                      </Button>
                    )}
                  </article>
                ))}
            </div>
          )}
          {["link", "link-person"].includes(action.kind) && scope.rh && (
            <EntityForm
              fields={[
                field(
                  "candidate",
                  "Talento para vincular",
                  "select",
                  opts(
                    state.candidates
                      .filter((p) => !p.erased)
                      .map((p) => ({ id: p.id, name: p.name })),
                  ),
                ),
                field(
                  "job",
                  "Vaga de destino",
                  "select",
                  opts(
                    state.jobs
                      .filter((j) => j.state !== "Encerrada")
                      .map((j) => ({ id: j.id, name: j.title })),
                  ),
                ),
              ]}
              initial={{
                candidate:
                  action.kind === "link-person"
                    ? action.id!
                    : (state.candidates[0]?.id ?? ""),
                job: action.kind === "link" ? action.id! : (j?.id ?? ""),
              }}
              save={(d) => {
                if (act((s) => linkCandidate(s, scope, d.candidate, d.job))) {
                  close();
                  return true;
                }
                return false;
              }}
              label="Vincular sem duplicar candidatura"
            />
          )}
          {action.kind === "filter" && scope.rh && (
            <EntityForm
              fields={[field("name", "Nome da consulta salva")]}
              initial={{ name: "" }}
              save={(d) => {
                if (act((s) => saveFilter(s, scope, d.name, filters))) {
                  close();
                  return true;
                }
                return false;
              }}
            />
          )}
          {action.kind === "privacy" && scope.rh && (
            <EntityForm
              fields={[
                field("purpose", "Finalidade demonstrativa", "textarea"),
                field("days", "Prazo de retenção sugerido (dias)", "number"),
              ]}
              initial={{
                purpose: state.privacy.purpose,
                days: String(state.privacy.days),
              }}
              save={(d) => {
                if (
                  act((s) =>
                    privacySettings(s, scope, d.purpose, Number(d.days)),
                  )
                ) {
                  close();
                  return true;
                }
                return false;
              }}
              description="Não define uma base legal definitiva. Registros anteriores preservam o prazo e a versão de finalidade utilizados no cadastro."
            />
          )}
          {action.kind === "career-settings" && scope.rh && (
            <EntityForm
              fields={[
                field("title", "Título da página de carreiras"),
                field("intro", "Apresentação institucional", "textarea"),
                field("culture", "Cultura e diferenciais", "textarea"),
                field("color", "Cor principal (hexadecimal)"),
              ]}
              initial={state.career}
              save={(d) => {
                if (
                  act((s) => {
                    guard(s, scope, "hr");
                    if (!/^#[0-9a-f]{6}$/i.test(d.color))
                      throw Error("Use cor hexadecimal válida.");
                    return {
                      ...s,
                      career: {
                        title: d.title,
                        intro: d.intro,
                        culture: d.culture,
                        color: d.color,
                      },
                    };
                  })
                ) {
                  close();
                  return true;
                }
                return false;
              }}
            />
          )}
          {action.kind === "exception" && scope.director && (
            <EntityForm
              fields={[
                field("approve", "Decisão financeira", "select", [
                  { value: "yes", label: "Aprovar exceção" },
                  { value: "no", label: "Recusar exceção" },
                ]),
                field("comment", "Parecer da Diretoria", "textarea"),
              ]}
              initial={{ approve: "yes", comment: "" }}
              save={(d) => {
                if (
                  act((s) =>
                    reviewException(
                      s,
                      scope,
                      action.id!,
                      d.approve === "yes",
                      d.comment,
                    ),
                  )
                ) {
                  close();
                  return true;
                }
                return false;
              }}
              label="Registrar decisão financeira"
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function GoalBar({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number;
}) {
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-orange-500"
          style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
        />
      </div>
    </div>
  );
}
