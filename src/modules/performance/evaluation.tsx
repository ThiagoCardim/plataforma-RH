"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Plus,
  Copy,
  Settings2,
  ShieldCheck,
  CalendarDays,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Modal } from "@/modules/onboarding/components";
import { EntityForm, type Field } from "@/modules/career/components";
import { type Scope, admin, uid, dateNow } from "@/modules/career/model";
import {
  type PerformanceState,
  type Evaluation,
  type Answer,
  type Kind,
  type Template,
  type Cycle,
  type Responsibility,
  type Diary,
  mayEvaluate,
  compatible,
  score,
  evaluationLabel,
  criterionResult,
  saveTemplate,
  saveCycle,
  createEvaluation,
  saveEvaluation,
  reviewEvaluation,
  releaseEvaluation,
  saveResponsibility,
  stopResponsibility,
  completeOccurrence,
  addDiary,
  consolidate,
} from "./model";
import { usePerformance } from "./store";
import {
  Notice,
  Tabs,
  Stat,
  Events,
  GoalBar,
  Empty,
  TemplateEditor,
  fmt,
} from "./components";
import { IntegrationEditor, type BridgeTargets } from "./integration-editor";
const allTabs = [
  "Visão Geral",
  "Desempenho Operacional",
  "Desempenho Comportamental",
  "Desempenho dos Setores",
  "Desempenho das Lideranças",
  "Modelos e Critérios",
  "Histórico",
];
const options = (rows: { id: string; name: string }[]) =>
  rows.map((x) => ({ value: x.id, label: x.name }));
export function EvaluationWorkspace({
  initial,
  scope,
  bridgeTargets,
  goals = false,
}: {
  initial: PerformanceState;
  scope: Scope;
  bridgeTargets: BridgeTargets;
  goals?: boolean;
}) {
  const { state, ready, act, error, notice, clear } = usePerformance(
      initial,
      scope,
    ),
    management = admin(scope),
    evaluator = management || scope.leader;
  const [tab, setTab] = useState(
      goals ? "Desempenho das Lideranças" : "Visão Geral",
    ),
    [sector, setSector] = useState(""),
    [person, setPerson] = useState(""),
    [functionId, setFunction] = useState(""),
    [cycle, setCycle] = useState(""),
    [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null),
    [templateEdit, setTemplateEdit] = useState<Template | null | undefined>(
      undefined,
    ),
    [cycleEdit, setCycleEdit] = useState<Cycle | null | undefined>(undefined),
    [creating, setCreating] = useState(false),
    [link, setLink] = useState<string | null>(null),
    [extra, setExtra] = useState<"responsibility" | "diary" | null>(null),
    [occurrence, setOccurrence] = useState<string | null>(null);
  const [createPerson, setCreatePerson] = useState(""),
    [createTemplate, setCreateTemplate] = useState(""),
    [createCycle, setCreateCycle] = useState(""),
    [leader, setLeader] = useState("");
  const tabs = management
    ? allTabs
    : scope.leader
      ? allTabs.filter((x) => !["Desempenho das Lideranças"].includes(x))
      : [
          "Visão Geral",
          "Desempenho Operacional",
          "Desempenho Comportamental",
          "Histórico",
        ];
  const e = state.evaluations.find((x) => x.id === selected),
    o = state.occurrences.find((x) => x.id === occurrence),
    linked = state.evaluations.find((x) => x.id === link);
  const filtered = state.evaluations.filter((e) => {
    const p = state.people.find((p) => p.id === e.person);
    return (
      p &&
      (!sector || p.sector === sector) &&
      (!functionId || p.functionId === functionId) &&
      (!cycle || e.cycle.id === cycle) &&
      (!person || p.id === person) &&
      (!query ||
        p.name
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")))
    );
  });
  const kind: Kind | undefined =
    tab === "Desempenho Operacional"
      ? "Operacional"
      : tab === "Desempenho Comportamental"
        ? "Comportamental"
        : tab === "Desempenho das Lideranças"
          ? "Liderança"
          : undefined;
  const evaluations = filtered.filter((e) => !kind || e.template.kind === kind);
  const selectablePeople = state.people.filter((p) =>
    mayEvaluate(state, scope, p, kind ?? "Operacional"),
  );
  const chosen = state.people.find((p) => p.id === createPerson),
    availableTemplates = state.templates.filter(
      (t) =>
        chosen &&
        compatible(t, chosen) &&
        mayEvaluate(state, scope, chosen, t.kind) &&
        (!kind || t.kind === kind),
    );
  const message = <Notice error={error} notice={notice} />;
  const open = (id: string) => {
    clear();
    setSelected(id);
  };
  function begin() {
    clear();
    setCreating(true);
    setCreatePerson(selectablePeople[0]?.id ?? "");
    setCreateTemplate("");
    setCreateCycle(state.cycles.find((c) => c.state === "Aberto")?.id ?? "");
  }
  const [leadMonth, setLeadMonth] = useState(dateNow().slice(0, 7));
  const leaders = state.people.filter((p) => p.isLeader && p.contract !== "PJ"),
    leadId = leader || leaders[0]?.id,
    leaderOccurrences = state.occurrences.filter(
      (o) => o.person === leadId && o.due.startsWith(leadMonth),
    ),
    diary = state.diary.filter(
      (d) => d.person === leadId && d.date.startsWith(leadMonth),
    );
  function action(
    fn: (s: PerformanceState) => PerformanceState,
    text?: string,
    close?: () => void,
  ) {
    if (act(fn, text)) close?.();
  }
  const f = (
    key: string,
    label: string,
    type: Field["type"] = "text",
    opts?: Field["options"],
  ): Field => ({ key, label, type, options: opts });
  if (!ready) return <p role="status">Carregando desempenho demonstrativo…</p>;
  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <div className="rounded-xl border border-orange-200 bg-accent p-4 text-sm leading-6">
        <strong>Demonstração local · avaliações e reconhecimentos</strong>
        <p>
          Dados fictícios salvos apenas neste navegador, conta e organização.
          Sem sincronização, avisos, portal operacional ou efeitos financeiros
          reais.
        </p>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">
            Desempenho / Clareza que desenvolve
          </p>
          <h1 className="page-title">
            {goals ? "Metas dos Líderes" : "Avaliação de Desempenho"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Contexto para reconhecer entregas. Conversas para construir
            evolução.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Restaurar a base local de Avaliação, Metas e Hall? As referências já vinculadas ao PDI e à carreira são preservadas.",
                )
              )
                action(() => initial, "Exemplos restaurados.");
            }}
          >
            Restaurar exemplos
          </Button>
          {evaluator && (
            <Button onClick={begin}>
              <Plus size={16} />
              Nova avaliação
            </Button>
          )}
        </div>
      </header>
      {goals ? (
        <div className="rounded-xl bg-violet-50 p-4 text-sm leading-6">
          Esta é a mesma base de responsabilidades e acompanhamento usada em
          Desempenho das Lideranças.{" "}
          <Link
            className="font-semibold text-primary underline"
            href="/avaliacao-de-desempenho"
          >
            Abrir Avaliação de Desempenho
          </Link>
        </div>
      ) : (
        <Tabs
          items={tabs}
          value={tab}
          change={(t) => {
            setTab(t);
            clear();
          }}
          label="Abas da Avaliação de Desempenho"
        />
      )}
      {!(
        e ||
        templateEdit !== undefined ||
        cycleEdit !== undefined ||
        creating ||
        extra ||
        o ||
        linked
      ) && message}
      {tab === "Visão Geral" && (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 p-7 text-white sm:p-9">
            <BarChart3 className="mb-5 text-orange-300" size={28} />
            <p className="text-sm font-medium uppercase tracking-widest text-orange-200">
              Expectativas claras, desenvolvimento contínuo
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight">
              Olhe além dos números.
              <br />
              Entenda o contexto de cada entrega.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-300">
              {evaluator
                ? "Indicadores contextualizados por função e vínculo, validação humana e critérios preservados em cada ciclo."
                : "Aqui aparecem somente suas avaliações finalizadas e liberadas. Resultados são pontos de conversa e desenvolvimento, sem promessa de promoção."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/pdi">Acessar PDI</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/hall-de-destaques">
                  Explorar Hall de Destaques
                </Link>
              </Button>
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Avaliações no contexto" value={filtered.length} />
            <Stat
              label="Em validação do RH"
              value={filtered.filter((e) => e.status === "Em validação").length}
            />
            <Stat
              label="Finalizadas e liberadas"
              value={filtered.filter((e) => e.status === "Publicada").length}
            />
            <Stat
              label="Critérios preservados"
              value="Por versão"
              note="Sem progressão automática"
            />
          </div>
        </>
      )}
      {tab !== "Desempenho das Lideranças" && tab !== "Modelos e Critérios" && (
        <section
          aria-label="Filtros de desempenho"
          className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <label className="text-sm">
            Pesquisar profissional
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar neste contexto"
            />
          </label>
          {evaluator && (
            <>
              <label className="text-sm">
                Setor
                <Select
                  aria-label="Setor"
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value);
                    setFunction("");
                  }}
                >
                  <option value="">Todos no meu escopo</option>
                  {state.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-sm">
                Função / serviço
                <Select
                  aria-label="Função / serviço"
                  value={functionId}
                  onChange={(e) => setFunction(e.target.value)}
                >
                  <option value="">Todas no setor</option>
                  {state.areas
                    .filter((a) => !sector || a.id === sector)
                    .flatMap((a) => a.functions)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </Select>
              </label>
            </>
          )}
          <label className="text-sm">
            Ciclo de avaliação
            <Select
              aria-label="Ciclo de avaliação"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
            >
              <option value="">Todos os ciclos</option>
              {[
                ...new Map(
                  state.evaluations.map((e) => [e.cycle.id, e.cycle]),
                ).values(),
              ].map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
        </section>
      )}
      {[
        "Visão Geral",
        "Desempenho Operacional",
        "Desempenho Comportamental",
      ].includes(tab) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">
              {kind ?? "Avaliações e próximos passos"}
            </h2>
            {tab === "Desempenho Operacional" && (
              <Badge>Para PJ: Indicadores de Entregas Contratuais</Badge>
            )}
          </div>
          {tab === "Desempenho Comportamental" && (
            <p className="rounded-xl bg-violet-50 p-4 text-sm leading-6">
              Postura de Dono · Sede de Crescimento · Melhoria Contínua ·
              Lealdade · Atitude. Exclusivo de CLT e Estágio. Não observado/Não
              aplicável é excluído do cálculo e exige contexto.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {evaluations.map((e) => {
              const p = state.people.find((p) => p.id === e.person)!;
              return (
                <button
                  key={e.id}
                  onClick={() => open(e.id)}
                  className="group rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <Badge>{e.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {p.contract}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {evaluationLabel(e, p)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {state.areas.find((a) => a.id === p.sector)?.name} ·{" "}
                    {
                      state.areas
                        .find((a) => a.id === p.sector)
                        ?.functions.find((f) => f.id === p.functionId)?.name
                    }
                  </p>
                  <div className="my-5">
                    <GoalBar
                      label="Resultado contextualizado"
                      value={score(e)}
                      note={
                        score(e) === null
                          ? "Sem critérios observados"
                          : `Modelo v${e.template.version} · pesos demonstrativos`
                      }
                    />
                  </div>
                  <p className="border-t pt-3 text-xs text-muted-foreground">
                    {e.cycle.name}
                  </p>
                </button>
              );
            })}
          </div>
          {!evaluations.length && (
            <Empty>
              Nenhuma avaliação neste filtro. Avaliações ainda não liberadas não
              aparecem para o profissional.
            </Empty>
          )}
        </>
      )}
      {tab === "Desempenho dos Setores" && (
        <>
          <p className="rounded-xl bg-accent p-4 text-sm leading-6">
            Compare o cumprimento das expectativas da própria função. Volumes
            absolutos de atividades diferentes não são somados ou ranqueados.
            Marketing e Comercial têm indicadores distintos dentro de Revenue.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {state.areas
              .filter((a) => !sector || a.id === sector)
              .map((a) => {
                const list = filtered.filter(
                  (e) =>
                    e.template.kind === "Operacional" &&
                    state.people.find((p) => p.id === e.person)?.sector ===
                      a.id &&
                    ["Publicada", "Validada"].includes(e.status),
                );
                return (
                  <section
                    key={a.id}
                    className={`rounded-2xl border bg-card p-6 ${sector || a.functions.length > 1 ? "lg:col-span-2" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">{a.name}</h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSector(a.id);
                          setTab("Desempenho Operacional");
                        }}
                      >
                        Explorar
                      </Button>
                    </div>
                    <div
                      className={
                        a.functions.length > 1
                          ? "grid gap-4 md:grid-cols-2"
                          : ""
                      }
                    >
                      {a.functions.map((fun) => {
                        const rows = list.filter(
                          (e) =>
                            state.people.find((p) => p.id === e.person)
                              ?.functionId === fun.id,
                        );
                        const observed = rows
                          .map(score)
                          .filter((n): n is number => n !== null);
                        return (
                          <details
                            key={fun.id}
                            className="mt-5 rounded-xl border p-4"
                            open
                          >
                            <summary className="cursor-pointer text-sm font-semibold">
                              {fun.name} · {rows.length} avaliações
                            </summary>
                            {!rows.length ? (
                              <p className="mt-3 text-sm text-muted-foreground">
                                Sem resultados validados neste contexto.
                              </p>
                            ) : (
                              <div className="mt-4 space-y-5">
                                <GoalBar
                                  label="Cumprimento das expectativas"
                                  value={
                                    observed.length
                                      ? observed.reduce((a, b) => a + b, 0) /
                                        observed.length
                                      : null
                                  }
                                  note="Média de proporções normalizadas; sem comparar volume de funções distintas"
                                />
                                {[
                                  "Entregas",
                                  "Qualidade",
                                  "Prazos",
                                  "Complexidade",
                                  "Resultados",
                                ].map((d) => {
                                  const numbers = rows
                                    .flatMap((e) =>
                                      e.template.criteria
                                        .filter((c) => c.dimension === d)
                                        .map((cr) => {
                                          const ans = e.answers.find(
                                            (a) => a.criterion === cr.id,
                                          );
                                          return ans
                                            ? criterionResult(
                                                e.template,
                                                ans,
                                                cr,
                                              )
                                            : null;
                                        }),
                                    )
                                    .filter((x): x is number => x !== null);
                                  return (
                                    <GoalBar
                                      key={d}
                                      label={
                                        d === "Entregas"
                                          ? "Produtividade contextualizada"
                                          : d
                                      }
                                      value={
                                        numbers.length
                                          ? numbers.reduce((a, b) => a + b, 0) /
                                            numbers.length
                                          : null
                                      }
                                      note="Realizado em relação à meta específica; teto demonstrativo de 100%"
                                    />
                                  );
                                })}
                                <FunctionHistory rows={rows} open={open} />
                                <div className="space-y-2 border-t pt-4">
                                  <h3 className="text-sm font-semibold">
                                    Contribuição individual · mesma função
                                  </h3>
                                  {rows.map((e) => (
                                    <button
                                      key={e.id}
                                      onClick={() => open(e.id)}
                                      className="flex w-full justify-between rounded-lg bg-muted p-3 text-left text-sm"
                                    >
                                      <span>
                                        {
                                          state.people.find(
                                            (p) => p.id === e.person,
                                          )?.name
                                        }{" "}
                                        · {e.cycle.name}
                                      </span>
                                      <strong>{fmt(score(e))}</strong>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </details>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
          </div>
        </>
      )}
      {tab === "Histórico" && (
        <section className="space-y-6 rounded-2xl border bg-card p-6">
          <h2 className="section-title">
            Evolução por pessoa e tipo de avaliação
          </h2>
          <label className="block max-w-lg text-sm">
            Profissional no histórico
            <Select
              aria-label="Profissional no histórico"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            >
              <option value="">Selecione para comparar ciclos</option>
              {state.people
                .filter((p) => state.evaluations.some((e) => e.person === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </label>
          {person ? (
            (["Operacional", "Comportamental", "Liderança"] as Kind[]).map(
              (k) => {
                const rows = filtered
                  .filter(
                    (e) =>
                      e.person === person &&
                      e.template.kind === k &&
                      ["Validada", "Publicada"].includes(e.status),
                  )
                  .sort((a, b) => a.cycle.start.localeCompare(b.cycle.start));
                return (
                  rows.length > 0 && (
                    <div key={k} className="rounded-xl border p-5">
                      <h3 className="mb-5 font-semibold">
                        {state.people.find((p) => p.id === person)?.contract ===
                        "PJ"
                          ? "Indicadores de Entregas Contratuais"
                          : k}
                      </h3>
                      <div className="flex gap-4 overflow-x-auto">
                        {rows.map((e) => (
                          <button
                            key={e.id}
                            className="min-w-40 flex-1 rounded-xl bg-gradient-to-t from-orange-50 to-white p-4 text-left"
                            onClick={() => open(e.id)}
                          >
                            <p className="text-xs text-muted-foreground">
                              {e.cycle.name}
                            </p>
                            <div className="my-4 flex h-28 items-end">
                              <div
                                className="w-full rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-300"
                                style={{ height: `${score(e) ?? 0}%` }}
                              />
                            </div>
                            <strong>{fmt(score(e))}</strong>
                            <p className="mt-2 text-xs">
                              Modelo v{e.template.version}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                );
              },
            )
          ) : (
            <Events events={filtered.flatMap((e) => e.events)} />
          )}
          <p className="text-sm text-muted-foreground">
            Cada avaliação mantém seu modelo e escala de origem. Mudanças de
            critérios exigem análise de comparabilidade; o gráfico não
            representa prontidão para promoção.
          </p>
        </section>
      )}
      {tab === "Modelos e Critérios" && evaluator && (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="section-title">
                Modelos que respeitam cada contexto
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pesos, escalas, metas e periodicidades são configuráveis e
                demonstrativos.
              </p>
            </div>
            {scope.rh && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    clear();
                    setCycleEdit(null);
                  }}
                >
                  <CalendarDays size={16} />
                  Novo ciclo
                </Button>
                <Button
                  onClick={() => {
                    clear();
                    setTemplateEdit(null);
                  }}
                >
                  <Plus size={16} />
                  Novo modelo
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.templates.map((t) => (
              <article key={t.id} className="rounded-2xl border bg-card p-5">
                <Badge>
                  {t.kind} · v{t.version}
                </Badge>
                <h3 className="mt-4 text-lg font-semibold">{t.name}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.criteria.length} critérios · {t.periodicity}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.contracts.join(" · ")}
                </p>
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Ver critérios e perguntas
                  </summary>
                  {t.criteria.map((c) => (
                    <div
                      key={c.id}
                      className="mt-3 border-l-2 border-orange-200 pl-3"
                    >
                      <p>
                        {c.name} · peso {c.weight}
                      </p>
                      <p className="mt-1 text-muted-foreground">{c.question}</p>
                      {t.kind === "Operacional" && (
                        <p className="mt-1">
                          Meta {c.target} {c.unit} · {c.direction}
                        </p>
                      )}
                    </div>
                  ))}
                </details>
                {scope.rh && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        clear();
                        setTemplateEdit(t);
                      }}
                    >
                      <Settings2 size={14} />
                      Personalizar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        clear();
                        setTemplateEdit({
                          ...structuredClone(t),
                          id: uid(),
                          version: 0,
                          name: t.name + " · cópia",
                        });
                      }}
                    >
                      <Copy size={14} />
                      Duplicar
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="mb-4 font-semibold">Ciclos configuráveis</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {state.cycles.map((c) => (
                <article key={c.id} className="rounded-xl border p-4">
                  <Badge>{c.state}</Badge>
                  <h4 className="mt-3 font-semibold">{c.name}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {c.start} a {c.end}
                  </p>
                  {scope.rh && (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        clear();
                        setCycleEdit(c);
                      }}
                    >
                      Configurar ciclo
                    </Button>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      {tab === "Desempenho das Lideranças" && management && (
        <>
          <section className="rounded-3xl bg-gradient-to-br from-stone-950 to-violet-950 p-7 text-white">
            <ShieldCheck size={28} className="text-orange-300" />
            <h2 className="mt-4 text-2xl font-semibold">
              Acompanhamento contínuo, com contexto.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
              Responsabilidades recorrentes, evidências e conversas alimentam a
              consolidação. O diário é confidencial, exclusivo de RH e
              Diretoria.
            </p>
            <Link
              className="mt-4 inline-block text-sm font-semibold text-orange-200 underline"
              href={goals ? "/avaliacao-de-desempenho" : "/metas-dos-lideres"}
            >
              {goals
                ? "Abrir avaliação completa"
                : "Abrir Metas dos Líderes · mesma base local"}
            </Link>
          </section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="min-w-60 text-sm">
              Liderança acompanhada
              <Select
                aria-label="Liderança acompanhada"
                value={leadId ?? ""}
                onChange={(e) => setLeader(e.target.value)}
              >
                {leaders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm">
              Mês do acompanhamento
              <Input
                type="month"
                value={leadMonth}
                onChange={(e) => setLeadMonth(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  setExtra("diary");
                }}
              >
                Registrar acontecimento
              </Button>
              <Button
                onClick={() => {
                  clear();
                  setExtra("responsibility");
                }}
              >
                <Plus size={16} />
                Responsabilidade recorrente
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Ocorrências geradas"
              value={leaderOccurrences.length}
            />
            <Stat
              label="Concluídas"
              value={leaderOccurrences.filter((o) => o.done).length}
            />
            <Stat
              label="Pendências fora do prazo"
              value={
                leaderOccurrences.filter(
                  (o) => !o.cancelled && !o.done && o.due < dateNow(),
                ).length
              }
            />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <section className="space-y-3 rounded-2xl border bg-card p-5">
              <h3 className="mb-4 text-lg font-semibold">
                Responsabilidades e prazos
              </h3>
              {state.responsibilities
                .filter((r) => r.person === leadId)
                .map((r) => (
                  <details key={r.id} className="rounded-xl border p-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {r.name} · {r.frequency}
                    </summary>
                    <p className="mt-3 text-sm">
                      {r.start} a {r.endedOn ?? r.end} · {r.criterion}
                    </p>
                    {!r.endedOn && (
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Encerrar apenas ocorrências futuras, preservando os registros existentes?",
                            )
                          )
                            action((s) => stopResponsibility(s, scope, r.id));
                        }}
                      >
                        Encerrar recorrência futura
                      </Button>
                    )}
                  </details>
                ))}
              {leaderOccurrences
                .sort((a, b) => a.due.localeCompare(b.due))
                .map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      clear();
                      setOccurrence(o.id);
                    }}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left hover:bg-accent"
                  >
                    <span>
                      <strong className="text-sm">{o.name}</strong>
                      <span className="mt-2 block text-xs text-muted-foreground">
                        Até {o.due}
                      </span>
                    </span>
                    <Badge>
                      {o.cancelled
                        ? "Cancelada"
                        : o.done
                          ? "Concluída"
                          : o.due < dateNow()
                            ? "Fora do prazo"
                            : "Pendente"}
                    </Badge>
                  </button>
                ))}
              {!leaderOccurrences.length && (
                <Empty>
                  Cadastre uma responsabilidade para gerar automaticamente suas
                  ocorrências.
                </Empty>
              )}
            </section>
            <aside className="space-y-4">
              <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
                <h3 className="mb-4 font-semibold">
                  Diário confidencial de acompanhamento
                </h3>
                {diary.map((d) => (
                  <article
                    key={d.id}
                    className="mb-4 rounded-xl border bg-card p-4"
                  >
                    <Badge>{d.type}</Badge>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {d.text}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {d.by} · {d.date}
                    </p>
                  </article>
                ))}
                {!diary.length && (
                  <p className="text-sm text-muted-foreground">
                    Sem registros neste contexto.
                  </p>
                )}
              </section>
              <section className="rounded-2xl border bg-card p-5">
                <h3 className="mb-4 font-semibold">
                  Avaliação final da liderança
                </h3>
                {state.evaluations
                  .filter(
                    (e) =>
                      e.person === leadId && e.template.kind === "Liderança",
                  )
                  .map((e) => (
                    <div key={e.id} className="space-y-3">
                      <p className="text-sm">
                        {e.template.name} · {e.cycle.name} · {e.status}
                      </p>
                      <Button variant="outline" onClick={() => open(e.id)}>
                        Abrir avaliação da liderança
                      </Button>
                      {["Rascunho", "Ajustes solicitados"].includes(
                        e.status,
                      ) && (
                        <Button
                          onClick={() =>
                            action(
                              (s) => consolidate(s, scope, e.id),
                              "Informações consolidadas no rascunho, sem atribuição automática de nota.",
                            )
                          }
                        >
                          Consolidar acompanhamento
                        </Button>
                      )}
                    </div>
                  ))}
                {!state.evaluations.some(
                  (e) => e.person === leadId && e.template.kind === "Liderança",
                ) && (
                  <Button onClick={begin}>Criar avaliação da liderança</Button>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
      {e && (
        <Modal
          title={`Avaliação · ${state.people.find((p) => p.id === e.person)?.name}`}
          close={() => {
            setSelected(null);
            clear();
          }}
        >
          {message}
          <EvaluationDetail
            key={e.id + ":" + e.status}
            evaluation={e}
            state={state}
            scope={scope}
            save={(answers, send) =>
              action(
                (s) => saveEvaluation(s, scope, e.id, answers, send),
                send ? "Avaliação enviada ao RH." : "Rascunho salvo.",
              )
            }
            review={(approve, comment) =>
              action(
                (s) => reviewEvaluation(s, scope, e.id, approve, comment),
                "Parecer registrado.",
              )
            }
            release={() =>
              action(
                (s) => releaseEvaluation(s, scope, e.id),
                "Avaliação liberada manualmente.",
              )
            }
            connect={() => {
              clear();
              setSelected(null);
              setLink(e.id);
            }}
          />
        </Modal>
      )}
      {templateEdit !== undefined && scope.rh && (
        <Modal
          title="Personalizar modelo de avaliação"
          close={() => setTemplateEdit(undefined)}
        >
          {message}
          <TemplateEditor
            state={state}
            initial={templateEdit ?? undefined}
            save={(v) => {
              const ok = act((s) => saveTemplate(s, scope, v));
              if (ok) setTemplateEdit(undefined);
              return ok;
            }}
          />
        </Modal>
      )}
      {cycleEdit !== undefined && scope.rh && (
        <Modal
          title="Configurar ciclo de avaliação"
          close={() => setCycleEdit(undefined)}
        >
          {message}
          <EntityForm
            fields={[
              f("name", "Nome do ciclo"),
              f("start", "Início do ciclo", "date"),
              f("end", "Fim do ciclo", "date"),
              f("state", "Situação do ciclo", "select", [
                { value: "Aberto", label: "Aberto" },
                { value: "Encerrado", label: "Encerrado" },
              ]),
            ]}
            initial={{
              name: cycleEdit?.name ?? "",
              start: cycleEdit?.start ?? dateNow(),
              end: cycleEdit?.end ?? dateNow(),
              state: cycleEdit?.state ?? "Aberto",
            }}
            save={(d) => {
              const ok = act((s) =>
                saveCycle(s, scope, {
                  id: cycleEdit?.id ?? uid(),
                  name: d.name,
                  start: d.start,
                  end: d.end,
                  state: d.state as Cycle["state"],
                }),
              );
              if (ok) setCycleEdit(undefined);
              return ok;
            }}
          />
        </Modal>
      )}
      {creating && (
        <Modal
          title="Nova avaliação contextualizada"
          close={() => setCreating(false)}
        >
          {message}
          <div className="space-y-4">
            <label className="block text-sm">
              Profissional avaliado
              <Select
                aria-label="Profissional avaliado"
                value={createPerson}
                onChange={(e) => {
                  setCreatePerson(e.target.value);
                  setCreateTemplate("");
                }}
              >
                <option value="">Selecione</option>
                {selectablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.contract}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm">
              Modelo da avaliação
              <Select
                aria-label="Modelo da avaliação"
                value={createTemplate}
                onChange={(e) => setCreateTemplate(e.target.value)}
              >
                <option value="">Selecione um modelo compatível</option>
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm">
              Ciclo para avaliar
              <Select
                aria-label="Ciclo para avaliar"
                value={createCycle}
                onChange={(e) => setCreateCycle(e.target.value)}
              >
                <option value="">Selecione</option>
                {state.cycles
                  .filter((c) => c.state === "Aberto")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </label>
            <p className="text-sm text-muted-foreground">
              O modelo será copiado integralmente para preservar perguntas,
              metas, pesos e escala deste registro.
            </p>
            <Button
              onClick={() =>
                action(
                  (s) =>
                    createEvaluation(
                      s,
                      scope,
                      createPerson,
                      createTemplate,
                      createCycle,
                    ),
                  "Avaliação criada como rascunho.",
                  () => setCreating(false),
                )
              }
            >
              Criar rascunho
            </Button>
          </div>
        </Modal>
      )}
      {extra && management && (
        <Modal
          title={
            extra === "responsibility"
              ? "Nova responsabilidade recorrente"
              : "Registro confidencial da liderança"
          }
          close={() => setExtra(null)}
        >
          {message}
          {extra === "responsibility" ? (
            <EntityForm
              fields={[
                f(
                  "person",
                  "Liderança responsável",
                  "select",
                  options(leaders),
                ),
                f("name", "Nome da responsabilidade"),
                f("criterion", "Expectativa / critério de gestão", "textarea"),
                f("start", "Primeira ocorrência", "date"),
                f("end", "Fim da recorrência", "date"),
                f(
                  "frequency",
                  "Frequência",
                  "select",
                  ["Semanal", "Quinzenal", "Mensal", "Personalizada"].map(
                    (x) => ({ value: x, label: x }),
                  ),
                ),
                f("interval", "Intervalo personalizado (dias)", "number"),
              ]}
              initial={{
                person: leadId ?? "",
                name: "",
                criterion: "",
                start: dateNow(),
                end: dateNow(),
                frequency: "Semanal",
                interval: "7",
              }}
              description="Gera ocorrências automaticamente até a vigência (máximo 366 dias). Mensal preserva o dia original e ajusta meses curtos. Alterações de calendário exigem encerrar a recorrência futura e criar outra, preservando o histórico."
              save={(d) => {
                const ok = act((s) =>
                  saveResponsibility(s, scope, {
                    id: uid(),
                    person: d.person,
                    name: d.name,
                    criterion: d.criterion,
                    start: d.start,
                    end: d.end,
                    frequency: d.frequency as Responsibility["frequency"],
                    interval: Number(d.interval),
                  }),
                );
                if (ok) setExtra(null);
                return ok;
              }}
            />
          ) : (
            <EntityForm
              fields={[
                f(
                  "person",
                  "Liderança do registro",
                  "select",
                  options(leaders),
                ),
                f("date", "Data do acontecimento", "date"),
                f(
                  "type",
                  "Tipo do registro",
                  "select",
                  ["Feedback", "Acontecimento", "Diário confidencial"].map(
                    (x) => ({ value: x, label: x }),
                  ),
                ),
                f("text", "Registro confidencial", "textarea"),
              ]}
              initial={{
                person: leadId ?? "",
                date: dateNow(),
                type: "Diário confidencial",
                text: "",
              }}
              save={(d) => {
                const ok = act((s) =>
                  addDiary(s, scope, {
                    person: d.person,
                    date: d.date,
                    text: d.text,
                    type: d.type as Diary["type"],
                  }),
                );
                if (ok) setExtra(null);
                return ok;
              }}
            />
          )}
        </Modal>
      )}
      {o && management && (
        <Modal
          title="Ocorrência da responsabilidade"
          close={() => setOccurrence(null)}
        >
          {message}
          <h3 className="mb-3 font-semibold">
            {o.name} · {o.due}
          </h3>
          {!o.cancelled && (
            <EntityForm
              key={o.id + o.events.length}
              fields={[
                f("evidence", "Evidência da ocorrência", "textarea"),
                f("feedback", "Feedback de acompanhamento", "textarea"),
                f("done", "Marcar como concluída", "checkbox"),
              ]}
              initial={{
                evidence: o.evidence,
                feedback: o.feedback,
                done: String(o.done),
              }}
              save={(d) => {
                const ok = act((s) =>
                  completeOccurrence(
                    s,
                    scope,
                    o.id,
                    d.done === "true",
                    d.evidence,
                    d.feedback,
                  ),
                );
                return ok;
              }}
            />
          )}
          <div className="mt-6">
            <Events events={o.events} />
          </div>
        </Modal>
      )}
      {linked && (
        <Modal
          title="Conectar avaliação ao desenvolvimento"
          close={() => setLink(null)}
        >
          <IntegrationEditor
            state={state}
            scope={scope}
            evaluation={linked}
            initial={bridgeTargets}
            done={() => setLink(null)}
          />
        </Modal>
      )}
    </div>
  );
}
function EvaluationDetail({
  evaluation: e,
  state,
  scope,
  save,
  review,
  release,
  connect,
}: {
  evaluation: Evaluation;
  state: PerformanceState;
  scope: Scope;
  save: (a: Answer[], send: boolean) => void;
  review: (approve: boolean, comment: string) => void;
  release: () => void;
  connect: () => void;
}) {
  const p = state.people.find((p) => p.id === e.person)!,
    editable =
      mayEvaluate(state, scope, p, e.template.kind) &&
      ["Rascunho", "Ajustes solicitados"].includes(e.status);
  const [answers, set] = useState(() => structuredClone(e.answers)),
    [comment, setComment] = useState("");
  const patch = (id: string, v: Partial<Answer>) =>
    set(answers.map((a) => (a.criterion === id ? { ...a, ...v } : a)));
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-violet-950 p-6 text-white">
        <Badge>
          {e.status} · {p.contract}
        </Badge>
        <h3 className="mt-4 text-xl font-semibold">{evaluationLabel(e, p)}</h3>
        <p className="mt-2 text-sm text-stone-300">
          {e.template.name} · v{e.template.version} · {e.cycle.name}
        </p>
        <p className="mt-4 text-3xl font-semibold">
          {fmt(score({ ...e, answers }))}
        </p>
        <p className="mt-2 text-xs text-stone-300">
          Resultado privado, com pesos e escala demonstrativos. Não representa
          prontidão ou garantia de promoção.
        </p>
      </div>
      {e.consolidation && admin(scope) && (
        <details className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Consolidação confidencial do acompanhamento
          </summary>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
            {e.consolidation}
          </p>
        </details>
      )}
      {e.template.criteria.map((cr, i) => {
        const a = answers.find((a) => a.criterion === cr.id)!;
        return (
          <section key={cr.id} className="space-y-3 rounded-xl border p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h4 className="font-semibold">{cr.name}</h4>
              <Badge>Peso {cr.weight}</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {cr.question}
            </p>
            {e.template.kind === "Operacional" ? (
              <p className="text-sm">
                Meta:{" "}
                <strong>
                  {cr.target} {cr.unit}
                </strong>{" "}
                · {cr.direction}
              </p>
            ) : (
              <p className="text-sm">
                Escala configurada: {e.template.min} a {e.template.max} ·{" "}
                {cr.dimension}
              </p>
            )}
            {editable ? (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={a.value === null}
                    onChange={(v) =>
                      patch(cr.id, {
                        value: v.target.checked
                          ? null
                          : e.template.kind === "Operacional"
                            ? 0
                            : e.template.min,
                      })
                    }
                  />
                  Não observado/Não aplicável · {i + 1}
                </label>
                {a.value !== null && (
                  <label className="block text-sm">
                    {e.template.kind === "Operacional"
                      ? "Realizado"
                      : "Resposta"}{" "}
                    · critério {i + 1}
                    <Input
                      type="number"
                      step="any"
                      min={
                        e.template.kind === "Operacional" ? 0 : e.template.min
                      }
                      max={
                        e.template.kind === "Operacional"
                          ? undefined
                          : e.template.max
                      }
                      value={a.value}
                      onChange={(v) =>
                        patch(cr.id, {
                          value:
                            v.target.value === ""
                              ? null
                              : Number(v.target.value),
                        })
                      }
                    />
                  </label>
                )}
                <label className="block text-sm">
                  Justificativa · critério {i + 1}
                  <Textarea
                    aria-label={`Justificativa · critério ${i + 1}`}
                    value={a.justification}
                    onChange={(v) =>
                      patch(cr.id, { justification: v.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Evidência / referência · critério {i + 1}
                  <Textarea
                    aria-label={`Evidência / referência · critério ${i + 1}`}
                    value={a.evidence}
                    onChange={(v) => patch(cr.id, { evidence: v.target.value })}
                  />
                </label>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {a.value === null
                    ? "Não observado/Não aplicável"
                    : `Realizado/resposta: ${a.value} · cumprimento ${fmt(criterionResult(e.template, a, cr))}`}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {a.justification}
                </p>
                {a.evidence && (
                  <p className="rounded-lg bg-muted p-3 text-sm leading-6">
                    {a.evidence}
                  </p>
                )}
              </>
            )}
          </section>
        );
      })}
      {editable && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => save(answers, false)}>
            Salvar rascunho
          </Button>
          <Button onClick={() => save(answers, true)}>
            Enviar para validação do RH
          </Button>
        </div>
      )}
      {scope.rh && e.status === "Em validação" && (
        <section className="space-y-3 rounded-xl bg-accent p-4">
          <label className="block text-sm">
            Parecer do RH
            <Textarea
              aria-label="Parecer do RH"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => review(true, comment)}>
              Validar avaliação
            </Button>
            <Button variant="outline" onClick={() => review(false, comment)}>
              Solicitar ajustes
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Sem autoaprovação da própria avaliação ou de uma avaliação da sua
            autoria.
          </p>
        </section>
      )}
      {admin(scope) && e.status === "Validada" && (
        <Button onClick={release}>Finalizar e liberar avaliação</Button>
      )}
      {["Validada", "Publicada"].includes(e.status) &&
        (admin(scope) || (scope.leader && p.user !== scope.user)) && (
          <Button variant="outline" onClick={connect}>
            <GitBranch size={16} />
            Conectar ao PDI ou reconhecimento
          </Button>
        )}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Histórico desta avaliação
        </summary>
        <div className="mt-4">
          <Events events={e.events} />
        </div>
      </details>
    </div>
  );
}

function FunctionHistory({
  rows,
  open,
}: {
  rows: Evaluation[];
  open: (id: string) => void;
}) {
  const cycles = [
    ...new Map(rows.map((e) => [e.cycle.id, e.cycle])).values(),
  ].sort((a, b) => a.start.localeCompare(b.start));
  return (
    <details className="rounded-xl bg-muted/50 p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Evolução histórica desta função
      </summary>
      <div className="mt-4 flex gap-3 overflow-x-auto">
        {cycles.map((c) => {
          const scores = rows
              .filter((e) => e.cycle.id === c.id)
              .map(score)
              .filter((n): n is number => n !== null),
            average = scores.length
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : null;
          return (
            <button
              key={c.id}
              className="min-w-40 flex-1 rounded-xl border bg-card p-3 text-left"
              onClick={() => {
                const e = rows.find((e) => e.cycle.id === c.id);
                if (e) open(e.id);
              }}
            >
              <p className="text-xs text-muted-foreground">{c.name}</p>
              <div className="my-3 flex h-20 items-end">
                <div
                  className="w-full rounded-t-lg bg-violet-400"
                  style={{ height: `${average ?? 0}%` }}
                />
              </div>
              <p className="text-sm font-semibold">{fmt(average)}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Expectativas normalizadas por modelo de origem; mudanças de critérios
        exigem revisão de comparabilidade.
      </p>
    </details>
  );
}
