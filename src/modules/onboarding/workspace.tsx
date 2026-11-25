"use client";
import { AcademyReferences } from "@/modules/academy/links";
import type { Scope as AcademyScope } from "@/modules/career/model";
import { useState } from "react";
import {
  ArrowRight,
  Plus,
  Search,
  Users,
  Clock3,
  CheckCircle2,
  Layers,
  GripVertical,
  MoreHorizontal,
  CalendarDays,
  RotateCcw,
  Sparkles,
  Archive,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { useLocalDemo } from "@/modules/local-demo/use-local-demo";
import {
  type State,
  type Termination,
  type Scope,
  type Process,
  type Template,
  type Stage,
  type Contract,
  project,
  progress,
  overdue,
  compose,
  defaultDuration,
  canManage,
  canComplete,
  newStage,
  sectors,
  jobs,
} from "./model";
import { Modal, Meter, StageEditor, StageContents } from "./components";
const onboardingTracks = [
  ["institutional", "Trilha institucional", "RH"],
  ["technical", "Trilha técnica", "Liderança"],
] as const;
const dates = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
const stageDate = (p: Process, s: Stage) =>
  new Date(new Date(p.start + "T12:00:00").getTime() + s.days * 86400000)
    .toISOString()
    .slice(0, 10);
export function OnboardingWorkspace({
  initial,
  scope,
  academyScope,
}: {
  initial: State;
  scope: Scope;
  academyScope?: AcademyScope;
}) {
  const offboarding = scope.journey === "offboarding";
  const title = offboarding ? "Offboarding" : "Onboarding";
  const listTab = offboarding ? "Offboardings" : "Onboardings";
  const modelTab = offboarding
    ? "Modelos de Offboarding"
    : "Modelos de Onboarding";
  const tracks = (
    offboarding
      ? ([
          ["institutional", "Trilha RH", "RH"],
          ["technical", "Trilha operacional", "Liderança"],
        ] as const)
      : onboardingTracks
  ).filter(
    ([kind]) => !offboarding || scope.mode === "rh" || kind === "technical",
  );
  const firstTrack =
    offboarding && scope.mode !== "rh" ? "technical" : "institutional";
  const {
    value: state,
    setValue: set,
    ready,
    error,
  } = useLocalDemo(scope.key, initial, (s) => project(s, scope));
  const [tab, setTab] = useState("Visão Geral");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [contract, setContract] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [track, setTrack] = useState<"institutional" | "technical">(firstTrack);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    stage: Stage;
    template?: string;
    process?: string;
    track: "institutional" | "technical";
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const rh = scope.mode === "rh";
  const professional = scope.mode === "professional";
  const process = state.processes.find((p) => p.id === selected);
  const template = state.templates.find((t) => t.id === templateId);
  const visible = state.processes.filter(
    (p) =>
      (!query ||
        p.name
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR"))) &&
      (!sector || p.sector === sector) &&
      (!contract || p.contract === contract),
  );
  const active = visible.filter((p) => !p.archived && p.column !== "done");
  const allStages = (p: Process) => [...p.institutional, ...p.technical];
  const pending = (p: Process) =>
    allStages(p)
      .flatMap((s) => s.tasks)
      .filter((t) => t.required && !t.done).length;
  const late = active.filter((p) => allStages(p).some((s) => overdue(p, s)));
  function update(
    fn: (s: State) => State,
    text: string,
    id?: string,
    eventTrack?: Template["track"],
  ) {
    const event = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      actor: scope.name,
      text,
      process: id,
      track: eventTrack,
    };
    set((s) => ({ ...fn(s), events: [event, ...s.events] }));
    setNotice(text);
  }
  function updateProcess(
    p: Process,
    patch: Partial<Process>,
    text: string,
    eventTrack?: Template["track"],
  ) {
    update(
      (s) => ({
        ...s,
        processes: s.processes.map((x) =>
          x.id === p.id ? { ...x, ...patch } : x,
        ),
      }),
      text,
      p.id,
      eventTrack,
    );
  }
  function move(id: string, column: string) {
    const p = state.processes.find((p) => p.id === id);
    if (!rh || !p || p.archived || !state.columns.some((c) => c.id === column))
      return;
    if (column === "done" && pending(p)) {
      setNotice(
        "Conclua as atividades obrigatórias das duas trilhas antes de finalizar.",
      );
      return;
    }
    if (p.column === column) return;
    updateProcess(
      p,
      { column },
      `${p.name} movido para ${state.columns.find((c) => c.id === column)?.name}.`,
    );
  }
  function patchStage(
    p: Process,
    kind: typeof track,
    stage: Stage,
    completion = false,
  ) {
    const old = p[kind].find((s) => s.id === stage.id);
    if (
      offboarding &&
      !rh &&
      (old?.owner !== "Liderança" ||
        stage.owner !== "Liderança" ||
        kind !== "technical")
    )
      return;
    if (
      !old ||
      !(completion
        ? canComplete(scope, p, kind, old)
        : canManage(scope, p, kind))
    )
      return;
    updateProcess(
      p,
      { [kind]: p[kind].map((s) => (s.id === stage.id ? stage : s)) },
      `${completion ? "Atividades atualizadas" : "Etapa editada"}: ${stage.name} · ${kind === "technical" ? (offboarding ? "trilha operacional" : "trilha técnica") : offboarding ? "trilha RH" : "trilha institucional"}.`,
      kind,
    );
  }
  function saveTemplate(t: Template, text: string) {
    if (
      !rh &&
      (scope.mode !== "leader" ||
        t.track !== "technical" ||
        t.leader !== scope.user)
    )
      return;
    update(
      (s) => ({
        ...s,
        templates: s.templates.some((x) => x.id === t.id)
          ? s.templates.map((x) => (x.id === t.id ? t : x))
          : [t, ...s.templates],
      }),
      text,
    );
  }
  function createTemplate() {
    const t: Template = {
      id: crypto.randomUUID(),
      name: offboarding
        ? "Novo modelo de offboarding"
        : "Novo modelo de onboarding",
      termination: offboarding ? "Voluntário" : undefined,
      track: rh ? "institutional" : "technical",
      contract: "CLT",
      sector: "Todos",
      job: "Todos",
      leader: scope.user,
      status: "Rascunho",
      version: 1,
      stages: [
        {
          ...newStage(offboarding),
          ...(offboarding && rh ? { owner: "RH" as const } : {}),
        },
      ],
    };
    saveTemplate(t, "Modelo demonstrativo criado.");
    setTemplateId(t.id);
  }
  if (!ready) return <p role="status">Carregando sua demonstração local…</p>;
  return (
    <div className="relative w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      {offboarding && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          <strong>Simulação de Offboarding.</strong> Nenhum desligamento,
          rescisão ou revogação de acesso é executado. RH e liderança possuem
          trilhas separadas; apenas etapas operacionais atribuídas são
          disponibilizadas à liderança.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-accent p-4 text-xs leading-5 text-accent-foreground">
        <div>
          <strong>Ambiente demonstrativo · dados fictícios</strong>
          <p>
            Salvo apenas neste navegador e nesta conta/organização. Sem
            sincronização, convites ou gravação remota.
          </p>
        </div>
        <Badge>
          {rh
            ? "Gestão RH / Diretoria"
            : professional
              ? "Minhas atividades"
              : "Minha liderança"}
        </Badge>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (
              window.confirm(
                "Restaurar os dados fictícios desta demonstração? As alterações locais serão descartadas.",
              )
            ) {
              set(initial);
              setSelected(null);
              setTemplateId(null);
              setNotice("Demonstração restaurada neste navegador.");
            }
          }}
        >
          <RotateCcw />
          Restaurar demonstração
        </Button>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">
            {offboarding
              ? "Pessoas / Encerramentos e continuidade"
              : "Pessoas / Jornadas de integração"}
          </p>
          <h1 className="page-title">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {offboarding
              ? "Encerramentos organizados. Continuidade com cuidado."
              : "Uma chegada acolhedora. Uma jornada com direção."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rh && (
            <Button variant="outline" onClick={() => setColumnsOpen(true)}>
              <Layers />
              Personalizar quadro
            </Button>
          )}
          {rh && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              {offboarding ? "Novo offboarding" : "Novo onboarding"}
            </Button>
          )}
        </div>
      </header>
      <nav
        aria-label={`Abas do ${title.toLowerCase()}`}
        className="flex gap-1 overflow-x-auto border-b pb-2"
      >
        {["Visão Geral", listTab, modelTab, "Histórico"].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "secondary" : "ghost"}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </nav>
      <p className="text-xs text-emerald-800" role="status">
        {notice}
      </p>
      {(tab === "Visão Geral" || tab === listTab) && (
        <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
          <label className="relative text-xs">
            Buscar profissional
            <Search
              size={14}
              className="absolute bottom-3.5 left-3 text-muted-foreground"
            />
            <Input
              aria-label="Buscar profissional"
              className="pl-9"
              placeholder="Nome do profissional…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Setor
            <Select
              aria-label="Filtrar setor"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="">Todos os setores</option>
              {sectors.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </label>
          <label className="text-xs">
            Vínculo
            <Select
              aria-label="Filtrar vínculo"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
            >
              <option value="">Todos os vínculos</option>
              {["CLT", "Estágio", "PJ"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </label>
        </div>
      )}
      {tab === "Visão Geral" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                Users,
                active.length,
                "Jornadas em andamento",
                "bg-orange-50 text-orange-700",
              ],
              [
                Clock3,
                late.length,
                "Com prazos pendentes",
                "bg-rose-50 text-rose-700",
              ],
              [
                CheckCircle2,
                visible.filter((p) => p.archived || p.column === "done").length,
                "Jornadas concluídas",
                "bg-emerald-50 text-emerald-700",
              ],
              [
                Layers,
                active.length
                  ? Math.round(
                      active.reduce((n, p) => n + progress(allStages(p)), 0) /
                        active.length,
                    )
                  : 0,
                "Progresso médio (%)",
                "bg-violet-50 text-violet-700",
              ],
            ].map(([Icon, n, label, color]) => {
              const I = Icon as typeof Users;
              return (
                <article
                  className="rounded-xl border bg-card p-5"
                  key={String(label)}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {String(label)}
                    </span>
                    <span className={`rounded-lg p-2 ${color}`}>
                      <I size={18} />
                    </span>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">
                    {String(n)}
                  </p>
                </article>
              );
            })}
          </section>
          <section className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-violet-50 p-6 md:p-8">
            <div className="max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles size={16} />
                Duas trilhas, uma jornada
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {offboarding
                  ? "Continuidade dos projetos."
                  : "Conexão com a cultura."}
                <br />
                {offboarding
                  ? "Cuidado em cada encerramento."
                  : "Confiança para começar."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {offboarding
                  ? "RH acompanha as pendências administrativas e contratuais. A liderança cuida da transferência de conhecimento, dos projetos e dos equipamentos. Tudo aqui é apenas uma simulação local."
                  : "A trilha institucional aproxima as pessoas da YouCon. A trilha técnica conecta cada profissional às ferramentas, às entregas e à sua equipe."}
              </p>
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => setTab(listTab)}
              >
                Explorar jornadas
                <ArrowRight />
              </Button>
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="section-title mb-4">
                Atenção aos próximos passos
              </h2>
              {active.length ? (
                active
                  .slice()
                  .sort(
                    (a, b) =>
                      Number(allStages(b).some((s) => overdue(b, s))) -
                      Number(allStages(a).some((s) => overdue(a, s))),
                  )
                  .slice(0, 4)
                  .map((p) => (
                    <button
                      className="flex w-full items-center gap-3 border-t py-4 text-left hover:bg-muted/40"
                      key={p.id}
                      onClick={() => {
                        setSelected(p.id);
                        setTrack(firstTrack);
                      }}
                    >
                      <Avatar name={p.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.sector} · {pending(p)} atividades obrigatórias
                          pendentes
                        </p>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  ))
              ) : (
                <Empty text="Nenhuma jornada para os filtros selecionados." />
              )}
            </section>
            <section className="rounded-xl border bg-card p-5">
              <h2 className="section-title mb-4">Movimentos recentes</h2>
              <Events events={state.events.slice(0, 5)} />
            </section>
          </div>
        </>
      )}
      {tab === listTab && (
        <>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <p>
              {visible.filter((p) => !p.archived).length} jornadas no quadro
            </p>
            <p>
              {rh
                ? "Arraste os cards ou use o seletor de coluna em cada card."
                : "Abra um card para acompanhar suas atividades autorizadas."}
            </p>
          </div>
          <div
            className="flex w-full max-w-full items-start gap-4 overflow-x-auto pb-5"
            aria-label="Quadro Kanban"
          >
            {state.columns.map((column) => {
              const cards = visible.filter(
                (p) => !p.archived && p.column === column.id,
              );
              return (
                <section
                  key={column.id}
                  data-column={column.id}
                  aria-label={column.name}
                  className={`min-h-96 w-[290px] shrink-0 rounded-xl border bg-stone-100/80 p-3 ${drag ? "border-dashed" : ""}`}
                  onDragOver={(e) => {
                    if (rh) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    move(e.dataTransfer.getData("text/plain"), column.id);
                    setDrag(null);
                  }}
                >
                  <header className="mb-4 flex items-center justify-between px-1 py-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: column.color }}
                      />
                      {column.name}
                      <span className="rounded-md bg-white px-2 py-0.5 text-xs text-muted-foreground">
                        {cards.length}
                      </span>
                    </h2>
                    <MoreHorizontal
                      size={16}
                      className="text-muted-foreground"
                    />
                  </header>
                  <div className="space-y-3">
                    {cards.map((p) => (
                      <article
                        key={p.id}
                        draggable={rh}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", p.id);
                          setDrag(p.id);
                        }}
                        onDragEnd={() => setDrag(null)}
                        className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <Badge>{p.contract}</Badge>
                          {rh && (
                            <GripVertical
                              aria-label="Arrastar card"
                              size={16}
                              className="cursor-grab text-muted-foreground"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelected(p.id);
                            setTrack(firstTrack);
                          }}
                          className="mb-4 flex w-full items-center gap-3 text-left"
                        >
                          <Avatar name={p.name} />
                          <div>
                            <h3 className="text-sm font-semibold hover:text-primary">
                              {p.name}
                            </h3>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {p.job} · {p.sector}
                            </p>
                          </div>
                        </button>
                        <div className="space-y-3">
                          {tracks.map(([kind, label]) => (
                            <div key={kind}>
                              <p className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                                <span>{label}</span>
                                <span>{progress(p[kind])}%</span>
                              </p>
                              <Meter
                                value={progress(p[kind])}
                                color={
                                  kind === "technical"
                                    ? "bg-violet-400"
                                    : "bg-orange-400"
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-between gap-2 border-t pt-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            {dates(p.start)} · {p.duration} dias
                          </span>
                          <span
                            className={
                              allStages(p).some((s) => overdue(p, s))
                                ? "text-rose-700"
                                : ""
                            }
                          >
                            {pending(p)} pendências
                          </span>
                        </div>
                        {rh && (
                          <Select
                            aria-label={`Mover ${p.name}`}
                            className="mt-3 text-xs"
                            value={p.column}
                            onChange={(e) => move(p.id, e.target.value)}
                          >
                            {state.columns.map((c) => (
                              <option value={c.id} key={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </article>
                    ))}
                    {!cards.length && (
                      <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                        {rh
                          ? "Solte uma jornada aqui"
                          : "Nenhuma jornada nesta fase"}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === modelTab && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Biblioteca de modelos</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                {offboarding
                  ? "Modelos RH e operacionais por setor, vínculo e tipo de desligamento."
                  : "Institucionais por vínculo. Técnicos por setor, cargo e vínculo."}
                Apenas versões aprovadas são combinadas.
              </p>
            </div>
            {!professional && (
              <Button onClick={createTemplate}>
                <Plus />
                Criar modelo
              </Button>
            )}
          </div>
          {professional ? (
            <Empty text="Modelos são administrados pelo RH e pelas lideranças. Suas atividades estão em Onboardings." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className="rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary"
                >
                  <div className="mb-5 flex justify-between">
                    <span
                      className={`rounded-lg p-2 ${t.track === "technical" ? "bg-violet-50 text-violet-600" : "bg-orange-50 text-orange-600"}`}
                    >
                      <Layers size={20} />
                    </span>
                    <Badge>{t.status}</Badge>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.track === "technical"
                      ? offboarding
                        ? "Trilha operacional"
                        : "Trilha técnica"
                      : offboarding
                        ? "Trilha RH"
                        : "Trilha institucional"}{" "}
                    · v{t.version}
                  </p>
                  <h3 className="mt-2 text-base font-semibold">{t.name}</h3>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t.contract} · {t.sector} · {t.job}
                    {t.termination && ` · ${t.termination}`}
                  </p>
                  <p className="mt-5 border-t pt-3 text-xs">
                    {t.stages.length} etapas{" "}
                    <span className="float-right text-primary">
                      Editar modelo →
                    </span>
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {tab === "Histórico" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="section-title mb-4">Jornadas concluídas</h2>
            {state.processes
              .filter((p) => p.archived || p.column === "done")
              .map((p) => (
                <div
                  className="flex items-center gap-3 border-t py-4"
                  key={p.id}
                >
                  <Avatar name={p.name} />
                  <button
                    className="flex-1 text-left"
                    onClick={() => setSelected(p.id)}
                  >
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.contract} · {p.sector} · {p.duration} dias
                    </p>
                  </button>
                  {rh && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateProcess(
                          p,
                          { archived: false, column: state.columns[0].id },
                          `Jornada de ${p.name} reaberta.`,
                        )
                      }
                    >
                      <RotateCcw />
                      Reabrir
                    </Button>
                  )}
                </div>
              ))}
            {!state.processes.some(
              (p) => p.archived || p.column === "done",
            ) && <Empty text="As jornadas concluídas aparecerão aqui." />}
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="section-title mb-4">Histórico de atividades</h2>
            <Events events={state.events} />
          </section>
        </div>
      )}
      {process && (
        <Modal
          title={`Jornada de ${process.name}`}
          close={() => {
            setSelected(null);
            setEditing(null);
          }}
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={process.name} />
              <div>
                <h3 className="text-xl font-semibold">{process.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {process.contract} · {process.sector} · {process.job}
                  {process.termination && ` · ${process.termination}`}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Início {dates(process.start)} · {process.duration} dias ·{" "}
                  {process.leaderName}
                </p>
              </div>
            </div>
            <Badge>{pending(process)} obrigatórias pendentes</Badge>
          </div>
          {!offboarding && academyScope && (
            <AcademyReferences
              scope={academyScope}
              kind="onboarding"
              target={process.id}
            />
          )}
          {rh && (
            <div className="mb-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
              <label className="text-xs">
                Duração da jornada (dias)
                <Input
                  aria-label="Duração da jornada"
                  type="number"
                  min={1}
                  max={730}
                  value={process.duration}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (n >= 1 && n <= 730)
                      updateProcess(
                        process,
                        { duration: n },
                        `Duração de ${process.name} ajustada para ${n} dias.`,
                      );
                  }}
                />
              </label>
              <p className="self-center text-xs leading-5 text-muted-foreground">
                {offboarding
                  ? "Prazos demonstrativos e personalizáveis; não são orientação legal ou contratual. Marcar tarefas não desliga pessoas, não cancela contratos e não revoga acessos."
                  : "CLT: padrão 90 dias · Estágio: padrão 60 dias · PJ: duração combinada. Os prazos das etapas são contados a partir do início."}
              </p>
            </div>
          )}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {tracks.map(([kind, label, owner]) => (
              <button
                key={kind}
                onClick={() => setTrack(kind)}
                className={`rounded-xl border p-4 text-left ${track === kind ? "border-primary bg-accent" : "bg-card"}`}
              >
                <p className="flex justify-between text-sm font-semibold">
                  {label}
                  <span>{progress(process[kind])}%</span>
                </p>
                <p className="my-2 text-xs text-muted-foreground">
                  {owner} · {process[kind].length} etapas autorizadas
                </p>
                <Meter
                  value={progress(process[kind])}
                  color={
                    kind === "technical" ? "bg-violet-400" : "bg-orange-400"
                  }
                />
              </button>
            ))}
          </div>
          {editing?.process === process.id ? (
            <StageEditor
              offboarding={offboarding}
              operationalOnly={offboarding && !rh}
              administrativeOnly={
                offboarding && editing.track === "institutional"
              }
              key={editing.stage.id}
              initial={editing.stage}
              cancel={() => setEditing(null)}
              save={(s) => {
                patchStage(process, editing.track, s);
                setEditing(null);
              }}
            />
          ) : (
            <div className="space-y-4">
              {process[track].map((s, i) => {
                const allowed =
                  !process.archived &&
                  process.column !== "done" &&
                  canComplete(scope, process, track, s);
                return (
                  <details
                    key={s.id}
                    open={i === 0}
                    className="group overflow-hidden rounded-xl border bg-card"
                  >
                    <summary className="cursor-pointer p-5">
                      <span className="text-sm font-semibold">
                        {i + 1}. {s.name}
                      </span>
                      <span className="ml-3 text-xs text-muted-foreground">
                        {s.owner} · até {dates(stageDate(process, s))}
                      </span>
                      {overdue(process, s) && (
                        <span className="ml-2 text-xs text-rose-700">
                          Prazo pendente
                        </span>
                      )}
                    </summary>
                    <div className="space-y-4 border-t p-5">
                      <div className="flex items-center justify-between">
                        <Badge>{progress([s])}% da etapa</Badge>
                        {canManage(scope, process, track) &&
                          !process.archived &&
                          process.column !== "done" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditing({
                                  stage: s,
                                  process: process.id,
                                  track,
                                })
                              }
                            >
                              Editar etapa
                            </Button>
                          )}
                      </div>
                      {s.tasks.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm"
                        >
                          <input
                            className="mt-1"
                            type="checkbox"
                            disabled={!allowed}
                            checked={t.done}
                            onChange={(e) =>
                              patchStage(
                                process,
                                track,
                                {
                                  ...s,
                                  tasks: s.tasks.map((x) =>
                                    x.id === t.id
                                      ? { ...x, done: e.target.checked }
                                      : x,
                                  ),
                                },
                                true,
                              )
                            }
                          />
                          <span
                            className={
                              t.done ? "text-muted-foreground line-through" : ""
                            }
                          >
                            {t.title}
                            {t.required && (
                              <span className="ml-2 text-[10px] text-primary">
                                Obrigatória
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                      <StageContents
                        stage={s}
                        editable={allowed}
                        onChange={(next) =>
                          patchStage(process, track, next, true)
                        }
                      />
                    </div>
                  </details>
                );
              })}
              {!process[track].length && (
                <Empty text="Não há atividades autorizadas para você nesta trilha." />
              )}
              {canManage(scope, process, track) &&
                !process.archived &&
                process.column !== "done" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const s = newStage(offboarding);
                      if (offboarding && track === "institutional")
                        s.owner = "RH";
                      updateProcess(
                        process,
                        { [track]: [...process[track], s] },
                        `Etapa adicionada à jornada de ${process.name}.`,
                      );
                      setEditing({ stage: s, process: process.id, track });
                    }}
                  >
                    <Plus />
                    Adicionar etapa
                  </Button>
                )}
            </div>
          )}
          <section className="mt-6 rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">
              Histórico desta jornada
            </h3>
            <Events
              events={state.events.filter((e) => e.process === process.id)}
            />
            {process.sources.length > 0 && (
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Modelos de origem: {process.sources.join(" + ")}. Alterar um
                modelo não modifica jornadas já criadas.
              </p>
            )}
          </section>
          {rh && !process.archived && (
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => {
                if (pending(process)) {
                  setNotice("Existem atividades obrigatórias pendentes.");
                  return;
                }
                updateProcess(
                  process,
                  { archived: true, column: "done" },
                  `Jornada de ${process.name} concluída e arquivada.`,
                );
                setSelected(null);
              }}
            >
              <Archive />
              Concluir e arquivar jornada
            </Button>
          )}
        </Modal>
      )}
      {template && !professional && (
        <Modal
          title="Editor de modelo"
          close={() => {
            setTemplateId(null);
            setEditing(null);
          }}
        >
          {editing?.template === template.id ? (
            <StageEditor
              offboarding={offboarding}
              operationalOnly={offboarding && !rh}
              administrativeOnly={
                offboarding && editing.track === "institutional"
              }
              key={editing.stage.id}
              initial={editing.stage}
              cancel={() => setEditing(null)}
              save={(stage) => {
                saveTemplate(
                  {
                    ...template,
                    version: template.version + 1,
                    status: "Em revisão",
                    stages: template.stages.map((s) =>
                      s.id === stage.id ? stage : s,
                    ),
                  },
                  `Etapa do modelo ${template.name} atualizada; nova revisão necessária.`,
                );
                setEditing(null);
              }}
            />
          ) : (
            <div className="space-y-5">
              <p className="rounded-xl bg-accent p-4 text-xs leading-5">
                {offboarding
                  ? "Modelos operacionais precisam de aprovação do RH."
                  : "Modelos técnicos precisam de aprovação do RH."}{" "}
                Alterações criam uma nova revisão e não modificam processos em
                andamento.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs sm:col-span-2">
                  Nome do modelo
                  <Input
                    aria-label="Nome do modelo"
                    value={template.name}
                    onChange={(e) =>
                      saveTemplate(
                        {
                          ...template,
                          name: e.target.value,
                          status: "Rascunho",
                        },
                        "Nome do modelo atualizado.",
                      )
                    }
                  />
                </label>
                <label className="text-xs">
                  Trilha
                  <Select
                    aria-label="Trilha do modelo"
                    disabled={!rh}
                    value={template.track}
                    onChange={(e) =>
                      saveTemplate(
                        {
                          ...template,
                          track: e.target.value as Template["track"],
                          status: "Rascunho",
                        },
                        "Trilha do modelo alterada.",
                      )
                    }
                  >
                    <option value="institutional">
                      {offboarding ? "RH" : "Institucional"}
                    </option>
                    <option value="technical">
                      {offboarding ? "Operacional" : "Técnica"}
                    </option>
                  </Select>
                </label>
                <label className="text-xs">
                  Vínculo
                  <Select
                    aria-label="Vínculo do modelo"
                    value={template.contract}
                    onChange={(e) =>
                      saveTemplate(
                        {
                          ...template,
                          contract: e.target.value as Contract,
                          status: "Rascunho",
                        },
                        "Vínculo do modelo alterado.",
                      )
                    }
                  >
                    {["CLT", "Estágio", "PJ"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs">
                  Setor
                  <Select
                    aria-label="Setor do modelo"
                    disabled={
                      !offboarding && template.track === "institutional"
                    }
                    value={template.sector}
                    onChange={(e) =>
                      saveTemplate(
                        {
                          ...template,
                          sector: e.target.value,
                          status: "Rascunho",
                        },
                        "Setor do modelo alterado.",
                      )
                    }
                  >
                    {["Todos", ...sectors].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs">
                  Cargo
                  <Select
                    aria-label="Cargo do modelo"
                    disabled={
                      !offboarding && template.track === "institutional"
                    }
                    value={template.job}
                    onChange={(e) =>
                      saveTemplate(
                        {
                          ...template,
                          job: e.target.value,
                          status: "Rascunho",
                        },
                        "Cargo do modelo alterado.",
                      )
                    }
                  >
                    {["Todos", ...jobs].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                </label>
              </div>
              {offboarding && (
                <label className="block text-xs">
                  Tipo de desligamento
                  <Select
                    aria-label="Tipo de desligamento do modelo"
                    value={template.termination ?? "Voluntário"}
                    onChange={(e) =>
                      saveTemplate(
                        {
                          ...template,
                          termination: e.target.value as Termination,
                          status: "Rascunho",
                        },
                        "Tipo de desligamento do modelo atualizado.",
                      )
                    }
                  >
                    <option>Voluntário</option>
                    <option>Involuntário</option>
                  </Select>
                </label>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">Etapas do modelo</h3>
                <Badge>
                  {template.status} · v{template.version}
                </Badge>
              </div>
              {template.stages.map((s, i) => (
                <div
                  className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4"
                  key={s.id}
                >
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold">
                      {i + 1}. {s.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.owner} · dia {s.days} · {s.tasks.length} atividades
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!i}
                    aria-label={`Subir etapa ${i + 1}`}
                    onClick={() => {
                      const stages = [...template.stages];
                      [stages[i - 1], stages[i]] = [stages[i], stages[i - 1]];
                      saveTemplate(
                        {
                          ...template,
                          stages,
                          status: "Em revisão",
                          version: template.version + 1,
                        },
                        "Etapas reordenadas.",
                      );
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditing({
                        stage: s,
                        template: template.id,
                        track: template.track,
                      })
                    }
                  >
                    Editar etapa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Excluir etapa ${i + 1}`}
                    onClick={() =>
                      saveTemplate(
                        {
                          ...template,
                          stages: template.stages.filter((x) => x.id !== s.id),
                          status: "Em revisão",
                          version: template.version + 1,
                        },
                        "Etapa removida do modelo.",
                      )
                    }
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  saveTemplate(
                    {
                      ...template,
                      stages: [
                        ...template.stages,
                        {
                          ...newStage(offboarding),
                          ...(offboarding && template.track === "institutional"
                            ? { owner: "RH" as const }
                            : {}),
                        },
                      ],
                      status: "Em revisão",
                      version: template.version + 1,
                    },
                    "Etapa adicionada ao modelo.",
                  )
                }
              >
                <Plus />
                Adicionar etapa ao modelo
              </Button>
              <footer className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const t = {
                      ...structuredClone(template),
                      id: crypto.randomUUID(),
                      name: `${template.name} · cópia`,
                      leader: scope.user,
                      status: "Rascunho" as const,
                      version: 1,
                    };
                    saveTemplate(t, "Modelo duplicado como rascunho.");
                    setTemplateId(t.id);
                  }}
                >
                  Duplicar modelo
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    saveTemplate(
                      { ...template, status: "Em revisão" },
                      "Modelo enviado à revisão do RH.",
                    )
                  }
                >
                  Enviar para revisão
                </Button>
                {rh && (
                  <Button
                    onClick={() => {
                      if (!template.name.trim() || !template.stages.length) {
                        setNotice(
                          "Informe nome e ao menos uma etapa para aprovar o modelo.",
                        );
                        return;
                      }
                      saveTemplate(
                        { ...template, status: "Aprovado" },
                        `RH aprovou o modelo ${template.name}.`,
                      );
                    }}
                  >
                    Aprovar modelo
                  </Button>
                )}
              </footer>
            </div>
          )}
        </Modal>
      )}
      {creating && (
        <Modal
          title={offboarding ? "Novo offboarding" : "Novo onboarding"}
          close={() => setCreating(false)}
        >
          <NewProcess
            state={state}
            scope={scope}
            save={(p) => {
              if (!rh) return;
              update(
                (s) => ({ ...s, processes: [p, ...s.processes] }),
                `Jornada de ${p.name} criada com modelos aprovados.`,
                p.id,
              );
              setCreating(false);
              setTab(listTab);
              setSelected(p.id);
            }}
          />
        </Modal>
      )}
      {columnsOpen && rh && (
        <Modal title="Personalizar quadro" close={() => setColumnsOpen(false)}>
          <p className="mb-5 text-sm text-muted-foreground">
            Personalize nomes, cores e ordem das fases. A fase Concluído mantém
            a validação das atividades obrigatórias.
          </p>
          <div className="space-y-3">
            {state.columns.map((c, i) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3"
              >
                <input
                  type="color"
                  aria-label={`Cor da coluna ${i + 1}`}
                  value={c.color}
                  onChange={(e) =>
                    update(
                      (s) => ({
                        ...s,
                        columns: s.columns.map((x) =>
                          x.id === c.id ? { ...x, color: e.target.value } : x,
                        ),
                      }),
                      "Cor da coluna atualizada.",
                    )
                  }
                />
                <Input
                  className="min-w-40 flex-1"
                  aria-label={`Nome da coluna ${i + 1}`}
                  value={c.name}
                  onChange={(e) =>
                    update(
                      (s) => ({
                        ...s,
                        columns: s.columns.map((x) =>
                          x.id === c.id ? { ...x, name: e.target.value } : x,
                        ),
                      }),
                      "Coluna renomeada.",
                    )
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!i}
                  aria-label={`Subir coluna ${i + 1}`}
                  onClick={() => {
                    const columns = [...state.columns];
                    [columns[i - 1], columns[i]] = [columns[i], columns[i - 1]];
                    update((s) => ({ ...s, columns }), "Colunas reordenadas.");
                  }}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={
                    c.id === "done" ||
                    state.processes.some((p) => p.column === c.id)
                  }
                  onClick={() =>
                    update(
                      (s) => ({
                        ...s,
                        columns: s.columns.filter((x) => x.id !== c.id),
                      }),
                      "Coluna vazia removida.",
                    )
                  }
                >
                  Excluir
                </Button>
              </div>
            ))}
          </div>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() =>
              update(
                (s) => ({
                  ...s,
                  columns: [
                    ...s.columns,
                    {
                      id: crypto.randomUUID(),
                      name: "Nova fase",
                      color: "#94a3b8",
                    },
                  ],
                }),
                "Coluna criada.",
              )
            }
          >
            <Plus />
            Adicionar coluna
          </Button>
        </Modal>
      )}
    </div>
  );
}
function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-100 text-xs font-semibold text-orange-800">
      {name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
function Events({ events }: { events: State["events"] }) {
  return (
    <div className="max-h-96 space-y-4 overflow-y-auto">
      {events.length ? (
        events.map((e) => (
          <div key={e.id} className="border-l-2 border-orange-200 pl-4">
            <p className="text-sm leading-5">{e.text}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {e.actor} · {new Date(e.at).toLocaleString("pt-BR")}
            </p>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma atividade registrada nesta demonstração.
        </p>
      )}
    </div>
  );
}
function NewProcess({
  state,
  scope,
  save,
}: {
  state: State;
  scope: Scope;
  save: (p: Process) => void;
}) {
  const offboarding = scope.journey === "offboarding";
  const [termination, setTermination] = useState<Termination>("Voluntário");
  const [name, setName] = useState("");
  const [contract, setContract] = useState<Contract>("CLT");
  const [sector, setSector] = useState(sectors[0]);
  const [job, setJob] = useState(jobs[0]);
  const [duration, setDuration] = useState(offboarding ? 30 : 90);
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  let sources: string[] = [];
  try {
    sources = compose(
      state.templates,
      contract,
      sector,
      job,
      offboarding ? termination : undefined,
    ).sources;
  } catch {}
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (!name.trim() || duration < 1 || duration > 730 || !start)
            throw Error(
              "Informe nome, início e duração válida entre 1 e 730 dias.",
            );
          const tracks = compose(
            state.templates,
            contract,
            sector,
            job,
            offboarding ? termination : undefined,
          );
          save({
            ...tracks,
            id: crypto.randomUUID(),
            name: name.trim(),
            user: `fictional-${crypto.randomUUID()}`,
            leader: scope.user,
            leaderName: "Liderança demonstrativa",
            sector,
            job,
            contract,
            termination: offboarding ? termination : undefined,
            start,
            duration,
            column: state.columns[0].id,
            archived: false,
          });
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-xs leading-5">
        Cadastre apenas um profissional fictício. Esta jornada não cria conta,
        convite ou vínculo real. A liderança é demonstrativa e não representa
        uma atribuição de acesso remoto.
      </p>
      {offboarding && (
        <label className="block text-xs">
          Tipo de desligamento
          <Select
            aria-label="Tipo de desligamento"
            value={termination}
            onChange={(e) => setTermination(e.target.value as Termination)}
          >
            <option>Voluntário</option>
            <option>Involuntário</option>
          </Select>
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs sm:col-span-2">
          Nome do profissional
          <Input
            aria-label="Nome do profissional"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Ana Demo"
          />
        </label>
        <label className="text-xs">
          Vínculo
          <Select
            aria-label="Vínculo da jornada"
            value={contract}
            onChange={(e) => {
              const c = e.target.value as Contract;
              setContract(c);
              setDuration(offboarding ? 30 : defaultDuration(c));
            }}
          >
            {["CLT", "Estágio", "PJ"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Setor
          <Select
            aria-label="Setor da jornada"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            {sectors.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Cargo
          <Select
            aria-label="Cargo da jornada"
            value={job}
            onChange={(e) => setJob(e.target.value)}
          >
            {jobs.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Data de início
          <Input
            aria-label="Data de início"
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Duração em dias
          <Input
            aria-label="Duração em dias"
            type="number"
            min={1}
            max={730}
            required
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">
          Combinação automática de modelos
        </h3>
        {sources.length ? (
          sources.map((source) => (
            <p key={source} className="mt-2 flex gap-2 text-sm">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {source}
            </p>
          ))
        ) : (
          <p className="text-sm text-destructive">
            Nenhuma combinação aprovada. Solicite aprovação dos modelos ao RH.
          </p>
        )}
      </section>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!sources.length}>
        Criar jornada demonstrativa
      </Button>
    </form>
  );
}
