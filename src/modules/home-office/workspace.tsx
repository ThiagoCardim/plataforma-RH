"use client";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileCheck2,
  Clock3,
  Users,
  BookOpen,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/modules/onboarding/components";
import { useLocalDemo } from "@/modules/local-demo/use-local-demo";
import {
  type State,
  type Scope,
  type Occurrence,
  day,
  shift,
  weekday,
  validDay,
  key,
  weekdays,
  project,
  canRegister,
  occurrence,
  occurrences,
  reportRows,
  submissionStatus,
  reviewStatus,
  registerDay,
  approveDay,
  cancelOrSwap,
  addAgreement,
  endAgreement,
  saveReport,
  reviewReport,
  appendOwnNote,
  editRules,
  activeReport,
} from "./model";
import {
  ScheduleForm,
  OccurrenceChange,
  ReportPanel,
  Avatar,
  StatusBadge,
  dateLabel,
  stamp,
} from "./components";
export function HomeOfficeWorkspace({
  initial,
  scope,
}: {
  initial: State;
  scope: Scope;
}) {
  const {
    value: state,
    setValue: set,
    ready,
    error: storageError,
  } = useLocalDemo(scope.key, initial, (s) => project(s, scope));
  const [now, setNow] = useState(
    () => new Date(initial.events[0]?.at ?? "2026-01-01T12:00:00Z"),
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const today = day(now),
    rh = scope.mode === "rh",
    manage = rh || scope.mode === "leader";
  const [tab, setTab] = useState("Escalas"),
    [month, setMonth] = useState(today.slice(0, 7)),
    [selectedDay, setSelectedDay] = useState(today);
  const [sector, setSector] = useState(""),
    [leader, setLeader] = useState(""),
    [personFilter, setPersonFilter] = useState("");
  const [from, setFrom] = useState(shift(today, -14)),
    [to, setTo] = useState(shift(today, 7)),
    [sendFilter, setSendFilter] = useState(""),
    [reviewFilter, setReviewFilter] = useState("");
  const [schedule, setSchedule] = useState<
      "agreement" | "combined" | "signal" | null
    >(null),
    [changing, setChanging] = useState<Occurrence | null>(null),
    [ending, setEnding] = useState<string | null>(null),
    [stop, setStop] = useState(today);
  const [selectedReport, setSelectedReport] = useState<{
      person: string;
      date: string;
    } | null>(null),
    [ruleId, setRuleId] = useState<string | null>(null),
    [editingRules, setEditingRules] = useState(false),
    [rulesText, setRulesText] = useState("");
  const [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const modal = !!(schedule || changing || ending || selectedReport || ruleId);
  function clear() {
    setError("");
    setNotice("");
  }
  function act(fn: (s: State) => State, message: string) {
    try {
      const next = fn(state);
      set(next);
      setError("");
      setNotice(message);
      setNow(new Date());
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  function openReport(person: string, date: string) {
    clear();
    setSelectedReport({ person, date });
  }
  const filteredPeople = state.people.filter(
    (p) =>
      (!sector || p.sector === sector) &&
      (!leader || p.leader === leader) &&
      (!personFilter || p.id === personFilter),
  );
  const allowed = new Set(filteredPeople.map((p) => p.id));
  const own = state.people.find((p) => p.user === scope.user),
    ownToday = own ? occurrence(state, own.id, today) : undefined;
  const first = month + "-01",
    gridStart = shift(first, -weekday(first));
  const grid = Array.from({ length: 42 }, (_, i) => shift(gridStart, i));
  const monthOccurrences = occurrences(state, grid[0], grid.at(-1)!).filter(
    (o) => allowed.has(o.person),
  );
  const selectedOccurrences = monthOccurrences.filter(
    (o) => o.date === selectedDay,
  );
  const validRange =
    validDay(from) &&
    validDay(to) &&
    from <= to &&
    (Date.parse(to) - Date.parse(from)) / 86400000 <= 400;
  const rows = validRange
    ? reportRows(state, from, to).filter((row) => allowed.has(row.o.person))
    : [];
  const displayed = rows.filter(
    (row) =>
      (!sendFilter ||
        submissionStatus(row.o, row.r, now, row.active) === sendFilter) &&
      (!reviewFilter || reviewStatus(row.r) === reviewFilter),
  );
  const todayRows = reportRows(state, today, today).filter((row) =>
    allowed.has(row.o.person),
  );
  const todayRemote = occurrences(state, today, today).filter(
    (o) => allowed.has(o.person) && o.status === "Autorizado",
  );
  const stats = [
    ["Remotos hoje", todayRemote.length, Users],
    [
      "Para enviar hoje",
      todayRows.filter((row) => row.active && !row.r?.original).length,
      Clock3,
    ],
    [
      "Não entregues no prazo",
      rows.filter(
        (row) =>
          submissionStatus(row.o, row.r, now, row.active) ===
          "Não entregue no prazo",
      ).length,
      Clock3,
    ],
    [
      "Aguardando liderança",
      rows.filter(
        (row) => reviewStatus(row.r) === "Enviado e aguardando liderança",
      ).length,
      FileCheck2,
    ],
    [
      "Aguardando RH",
      rows.filter((row) => reviewStatus(row.r) === "Aguardando RH").length,
      FileCheck2,
    ],
    [
      "Em esclarecimento",
      rows.filter((row) => reviewStatus(row.r) === "Em esclarecimento").length,
      BookOpen,
    ],
  ] as const;
  const record = selectedReport
    ? state.reports.find(
        (r) => r.id === key(selectedReport.person, selectedReport.date),
      )
    : undefined;
  const reportOccurrence =
    record?.occurrence ??
    (selectedReport
      ? occurrence(state, selectedReport.person, selectedReport.date)
      : undefined);
  const reportPerson = selectedReport
    ? state.people.find((p) => p.id === selectedReport.person)
    : undefined;
  const shownRule = state.rules.find((r) => r.id === ruleId),
    currentRules = state.rules.at(-1);
  const feedback = (
    <>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 text-xs text-emerald-800">
          {notice}
        </p>
      )}
    </>
  );
  if (!ready) return <p role="status">Carregando Home Office demonstrativo…</p>;
  return (
    <div className="relative w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-accent p-4 text-xs leading-5 text-accent-foreground">
        <div>
          <strong>Demonstração local · dados fictícios</strong>
          <p>
            Salvo apenas neste navegador, conta e organização. Sem mensagens,
            ponto, folha ou integração com WhatsApp.
          </p>
          <p>
            Prazo demonstrativo pelo relógio local. A garantia definitiva
            dependerá de validação no servidor.
          </p>
        </div>
        <Badge>
          {rh
            ? "RH / Diretoria"
            : scope.mode === "leader"
              ? "Minha equipe"
              : "Minha escala"}
        </Badge>
      </div>
      {storageError && (
        <p role="alert" className="text-sm text-destructive">
          {storageError}
        </p>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">
            Pessoas / Acordos e acompanhamento
          </p>
          <h1 className="page-title">Home Office</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Escalas claras. Combinados visíveis. Entregas com contexto.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (
              window.confirm(
                "Restaurar somente a demonstração de Home Office e descartar alterações locais?",
              )
            ) {
              set(initial);
              clear();
            }
          }}
        >
          <RotateCcw />
          Restaurar demonstração
        </Button>
      </header>
      <nav
        aria-label="Abas do Home Office"
        className="flex gap-1 border-b pb-2"
      >
        {["Escalas", "Relatórios", "Regras"].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "secondary" : "ghost"}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              clear();
            }}
          >
            {t}
          </Button>
        ))}
      </nav>
      {!modal && feedback}
      {tab !== "Regras" && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {stats.map(([label, n, Icon]) => (
              <article key={label} className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex justify-between gap-2 text-muted-foreground">
                  <span className="text-[11px] leading-4">{label}</span>
                  <Icon size={16} className="shrink-0 text-primary" />
                </div>
                <p className="text-2xl font-semibold">{n}</p>
              </article>
            ))}
          </section>
          <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
            <label className="text-xs">
              Setor
              <Select
                aria-label="Filtrar setor"
                value={sector}
                onChange={(e) => {
                  setSector(e.target.value);
                  setPersonFilter("");
                }}
              >
                <option value="">Todos os setores</option>
                {[...new Set(state.people.map((p) => p.sector))].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </label>
            <label className="text-xs">
              Liderança
              <Select
                aria-label="Filtrar liderança"
                value={leader}
                onChange={(e) => {
                  setLeader(e.target.value);
                  setPersonFilter("");
                }}
              >
                <option value="">Todas as lideranças</option>
                {[
                  ...new Map(
                    state.people.map((p) => [p.leader, p.leaderName]),
                  ).entries(),
                ].map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs">
              Profissional
              <Select
                aria-label="Filtrar profissional"
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
              >
                <option value="">Todos do meu escopo</option>
                {state.people
                  .filter(
                    (p) =>
                      (!sector || p.sector === sector) &&
                      (!leader || p.leader === leader),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
            </label>
          </div>
        </>
      )}
      {tab === "Escalas" && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-gradient-to-r from-orange-50 to-white p-5">
            <div>
              <p className="text-sm font-semibold">
                {ownToday?.status === "Autorizado"
                  ? ownToday.requiresReport
                    ? "Seu relatório de hoje já está disponível"
                    : "Sua escala de hoje é remoto permanente"
                  : "Seu dia, com clareza"}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {ownToday?.status === "Autorizado" && !ownToday.requiresReport
                  ? "Você está dispensado do relatório diário."
                  : ownToday?.status === "Pendente"
                    ? "Sua data está sinalizada e aguarda confirmação."
                    : "Híbrido e eventual autorizado exigem envio no próprio dia até 23h59 de Brasília."}
              </p>
            </div>
            {ownToday?.status === "Autorizado" &&
              ownToday.requiresReport &&
              own && (
                <Button onClick={() => openReport(own.id, today)}>
                  <FileCheck2 />
                  Meu relatório de hoje
                </Button>
              )}
            {own && (
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  setSchedule("signal");
                }}
              >
                Sinalizar data
              </Button>
            )}
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Mês anterior"
                onClick={() => {
                  const d = new Date(first + "T12:00:00Z");
                  d.setUTCMonth(d.getUTCMonth() - 1);
                  const m = d.toISOString().slice(0, 7);
                  setMonth(m);
                  setSelectedDay(m + "-01");
                }}
              >
                <ChevronLeft />
              </Button>
              <label className="sr-only" htmlFor="home-month">
                Mês do calendário
              </label>
              <Input
                id="home-month"
                aria-label="Mês do calendário"
                type="month"
                value={month}
                className="w-44"
                onChange={(e) => {
                  if (/^\d{4}-\d{2}$/.test(e.target.value)) {
                    setMonth(e.target.value);
                    setSelectedDay(e.target.value + "-01");
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Próximo mês"
                onClick={() => {
                  const d = new Date(first + "T12:00:00Z");
                  d.setUTCMonth(d.getUTCMonth() + 1);
                  const m = d.toISOString().slice(0, 7);
                  setMonth(m);
                  setSelectedDay(m + "-01");
                }}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMonth(today.slice(0, 7));
                  setSelectedDay(today);
                }}
              >
                Hoje
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {rh && (
                <Button
                  variant="outline"
                  onClick={() => {
                    clear();
                    setSchedule("agreement");
                  }}
                >
                  <Plus />
                  Cadastrar acordo
                </Button>
              )}
              {manage && (
                <Button
                  onClick={() => {
                    clear();
                    setSchedule("combined");
                  }}
                >
                  <Plus />
                  Registrar home office combinado
                </Button>
              )}
            </div>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
            <section
              aria-label="Calendário de home office"
              className="min-w-0 overflow-hidden rounded-xl border bg-card"
            >
              <div className="grid grid-cols-7 border-b bg-muted/70">
                {weekdays.map((w) => (
                  <p
                    className="p-2 text-center text-[11px] font-semibold text-muted-foreground"
                    key={w}
                  >
                    {w}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {grid.map((d) => {
                  const items = monthOccurrences.filter(
                    (o) => o.date === d && o.status !== "Cancelado",
                  );
                  return (
                    <button
                      key={d}
                      aria-label={`Selecionar dia ${d}`}
                      aria-pressed={selectedDay === d}
                      onClick={() => setSelectedDay(d)}
                      className={`min-h-24 min-w-0 border-b border-r p-1.5 text-left align-top transition-colors hover:bg-orange-50 sm:min-h-28 ${selectedDay === d ? "bg-orange-50 ring-1 ring-inset ring-orange-300" : ""} ${d.slice(0, 7) !== month ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`mb-2 inline-flex size-6 items-center justify-center rounded-full text-xs ${d === today ? "bg-primary font-semibold text-white" : "text-muted-foreground"}`}
                      >
                        {Number(d.slice(-2))}
                      </span>
                      <span className="hidden space-y-1 sm:block">
                        {items.slice(0, 2).map((o) => (
                          <span
                            key={o.person}
                            className={`block truncate rounded px-1 py-1 text-[10px] ${o.status === "Pendente" ? "border border-dashed border-amber-300 bg-amber-50 text-amber-800" : o.source === "Remoto permanente" ? "bg-violet-50 text-violet-700" : "bg-orange-100/70 text-orange-800"}`}
                          >
                            {state.people.find((p) => p.id === o.person)?.name}
                          </span>
                        ))}
                        {items.length > 2 && (
                          <span className="block text-[10px] text-muted-foreground">
                            +{items.length - 2} pessoas
                          </span>
                        )}
                      </span>
                      {items.length > 0 && (
                        <span className="block text-[10px] text-primary sm:hidden">
                          {items.length} remoto{items.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 p-3 text-[10px] text-muted-foreground">
                <span>🟠 Híbrido / eventual autorizado</span>
                <span>🟣 Permanente · sem relatório</span>
                <span>◌ Pendente de confirmação</span>
              </div>
            </section>
            <aside
              tabIndex={0}
              aria-label="Escala do dia"
              className="max-h-[780px] space-y-3 overflow-y-auto rounded-xl border bg-card p-4"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} className="text-primary" />
                {dateLabel(selectedDay)}
              </h2>
              {selectedOccurrences.length ? (
                selectedOccurrences.map((o) => {
                  const p = state.people.find((p) => p.id === o.person)!;
                  const r = state.reports.find(
                    (r) => r.id === key(p.id, o.date),
                  );
                  return (
                    <article
                      className="space-y-3 rounded-xl border bg-background p-3"
                      key={o.person}
                    >
                      <div className="flex gap-2">
                        <Avatar name={p.name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {p.contract} · {p.sector}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge text={o.status} />
                        <Badge>{o.period}</Badge>
                      </div>
                      <p className="text-[11px] leading-5 text-muted-foreground">
                        {o.source} ·{" "}
                        {o.status === "Autorizado"
                          ? o.requiresReport
                            ? "Relatório obrigatório"
                            : "Dispensado de relatório"
                          : "Sem obrigação de relatório"}
                        {o.approvedBy &&
                          ` · autorização: ${o.approvedName ? o.approvedName : o.approvedBy === scope.user ? scope.name : "aprovador demonstrativo"}`}
                      </p>
                      {o.status === "Autorizado" && o.requiresReport && (
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge text={submissionStatus(o, r, now)} />
                          {r?.original && (
                            <StatusBadge text={reviewStatus(r)} />
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {o.status === "Autorizado" && o.requiresReport && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReport(p.id, o.date)}
                          >
                            {p.user === scope.user &&
                            o.date === today &&
                            !r?.original
                              ? "Preencher relatório"
                              : "Ver relatório"}
                          </Button>
                        )}
                        {o.status === "Pendente" &&
                          canRegister(scope, p) &&
                          o.date >= today && (
                            <Button
                              size="sm"
                              onClick={() =>
                                act(
                                  (s) => approveDay(s, scope, o.sourceId),
                                  "Data confirmada e incluída nas obrigações de relatório.",
                                )
                              }
                            >
                              Confirmar data
                            </Button>
                          )}
                        {canRegister(scope, p) &&
                          o.status !== "Cancelado" &&
                          o.date >= today &&
                          !r?.original && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                clear();
                                setChanging(o);
                              }}
                            >
                              Trocar / cancelar
                            </Button>
                          )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-lg border border-dashed p-5 text-xs leading-5 text-muted-foreground">
                  Nenhum registro para esta data e os filtros selecionados.
                </p>
              )}
            </aside>
          </div>
          <details className="rounded-xl border bg-card p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              Acordos e vigências ·{" "}
              {state.agreements.filter((a) => allowed.has(a.person)).length}{" "}
              registros
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {state.agreements
                .filter((a) => allowed.has(a.person))
                .map((a) => (
                  <article className="rounded-xl border p-4" key={a.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {state.people.find((p) => p.id === a.person)?.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.mode} · {a.period}
                        </p>
                      </div>
                      <Badge>
                        {a.end < today ? "Encerrado" : "Vigente / programado"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs">
                      {dateLabel(a.start)} a {dateLabel(a.end)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {a.weekdays.map((d) => weekdays[d]).join(" · ")} · regras
                      v{state.rules.find((r) => r.id === a.rule)?.number}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          clear();
                          setRuleId(a.rule);
                        }}
                      >
                        Ler regras do acordo
                      </Button>
                      {rh && a.end >= today && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            clear();
                            setEnding(a.id);
                            setStop(a.start > today ? a.start : today);
                          }}
                        >
                          Encerrar vigência
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          </details>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="section-title mb-4">Histórico de combinados</h2>
            <div className="max-h-72 space-y-4 overflow-y-auto">
              {state.events.slice(0, 20).map((e) => (
                <article
                  key={e.id}
                  className="border-l-2 border-orange-200 pl-3"
                >
                  <p className="text-sm leading-5">
                    {e.person && (
                      <strong>
                        {state.people.find((p) => p.id === e.person)?.name}{" "}
                        ·{" "}
                      </strong>
                    )}
                    {e.text}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {e.name} · {stamp(e.at)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      {tab === "Relatórios" && (
        <>
          <div>
            <h2 className="section-title">Acompanhamentos e validações</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Conteúdo objetivo por período. O envio e a revisão possuem estados
              separados; complementações não substituem o original.
            </p>
          </div>
          <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs">
              De
              <Input
                aria-label="Relatórios de"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-xs">
              Até
              <Input
                aria-label="Relatórios até"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <label className="text-xs">
              Envio
              <Select
                aria-label="Filtrar estado do envio"
                value={sendFilter}
                onChange={(e) => setSendFilter(e.target.value)}
              >
                <option value="">Todos os envios</option>
                {[
                  "Rascunho",
                  "Pendente de envio",
                  "Não entregue no prazo",
                  "Enviado",
                  "Ocorrência cancelada",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </label>
            <label className="text-xs">
              Revisão
              <Select
                aria-label="Filtrar revisão"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
              >
                <option value="">Todas as revisões</option>
                {[
                  "Enviado e aguardando liderança",
                  "Aguardando RH",
                  "Em esclarecimento",
                  "Validado",
                  "Sem envio original",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </label>
          </div>
          {!validRange && (
            <p role="alert" className="text-sm text-destructive">
              Selecione um intervalo válido de até 400 dias.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {displayed.length} registros encontrados · estados calculados no
            horário de Brasília
          </p>
          <div
            className="overflow-x-auto rounded-xl border bg-card"
            role="region"
            aria-label="Tabela de relatórios"
            tabIndex={0}
          >
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Relatórios de home office</caption>
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {[
                    "Profissional",
                    "Data / período",
                    "Envio",
                    "Revisão",
                    "",
                  ].map((v, i) => (
                    <th className="p-4" key={i}>
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(({ o, r, active }) => {
                  const p = state.people.find((p) => p.id === o.person)!;
                  return (
                    <tr key={key(o.person, o.date)} className="border-t">
                      <td className="min-w-44 p-4">
                        <p className="font-semibold">{p.name}</p>
                        <p className="mt-1 text-muted-foreground">
                          {p.sector} · {p.contract}
                        </p>
                      </td>
                      <td className="min-w-36 p-4">
                        {dateLabel(o.date)}
                        <p className="mt-1 text-muted-foreground">{o.period}</p>
                      </td>
                      <td className="p-4">
                        <StatusBadge
                          text={submissionStatus(o, r, now, active)}
                        />
                      </td>
                      <td className="p-4">
                        <StatusBadge text={reviewStatus(r)} />
                        {!active && (
                          <p className="mt-1 text-muted-foreground">
                            Obrigação dispensada; histórico preservado.
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Abrir relatório ${p.name} ${o.date}`}
                          onClick={() => openReport(p.id, o.date)}
                        >
                          Abrir
                          <ArrowRight />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!displayed.length && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum relatório para os filtros selecionados.
              </p>
            )}
          </div>
        </>
      )}
      {tab === "Regras" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <section className="rounded-xl border bg-card p-5 md:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Regras de Home Office</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Versão {currentRules?.number} ·{" "}
                  {currentRules && stamp(currentRules.at)}
                </p>
              </div>
              {rh && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingRules(!editingRules);
                    setRulesText(currentRules?.text ?? "");
                    clear();
                  }}
                >
                  {editingRules ? "Cancelar edição" : "Editar regras"}
                </Button>
              )}
            </div>
            {editingRules && rh ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-accent p-3 text-xs leading-5">
                  A nova versão será aplicada a novos registros. Acordos e
                  relatórios anteriores preservam as regras de origem. Os
                  critérios operacionais desta demonstração, inclusive o prazo,
                  continuam os mesmos.
                </p>
                <Textarea
                  aria-label="Texto das regras"
                  className="min-h-[440px]"
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (
                      act(
                        (s) => editRules(s, scope, rulesText),
                        "Nova versão de regras publicada; histórico anterior preservado.",
                      )
                    )
                      setEditingRules(false);
                  }}
                >
                  Publicar nova versão
                </Button>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-7">
                {currentRules?.text}
              </p>
            )}
          </section>
          <aside className="space-y-3 rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Versões preservadas</h3>
            {[...state.rules].reverse().map((r) => (
              <button
                className="block w-full rounded-lg border p-3 text-left hover:border-primary"
                key={r.id}
                onClick={() => {
                  clear();
                  setRuleId(r.id);
                }}
              >
                <p className="text-sm font-semibold">Regras v{r.number}</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  {r.by} · {stamp(r.at)}
                </p>
              </button>
            ))}
          </aside>
        </div>
      )}
      {schedule && (
        <Modal
          title={
            schedule === "agreement"
              ? "Cadastrar acordo de Home Office"
              : schedule === "signal"
                ? "Sinalizar data de Home Office"
                : "Registrar home office combinado"
          }
          close={() => {
            setSchedule(null);
            clear();
          }}
        >
          {feedback}
          <ScheduleForm
            kind={schedule}
            state={state}
            scope={scope}
            date={selectedDay}
            close={() => {
              setSchedule(null);
              clear();
            }}
            save={(input) => {
              const success = act(
                (s) =>
                  schedule === "agreement"
                    ? addAgreement(s, scope, {
                        person: input.person,
                        mode: input.mode,
                        start: input.start,
                        end: input.end,
                        period: input.period,
                        weekdays: input.weekdays,
                      })
                    : registerDay(s, scope, {
                        person: input.person,
                        date: input.date,
                        period: input.period,
                        reason: input.reason,
                        signal: schedule === "signal",
                      }),
                "Registro salvo neste navegador.",
              );
              if (success) {
                setSelectedDay(input.date);
                setMonth(input.date.slice(0, 7));
                setSchedule(null);
              }
              return success;
            }}
          />
        </Modal>
      )}
      {changing && (
        <Modal
          title="Trocar ou cancelar ocorrência"
          close={() => {
            setChanging(null);
            clear();
          }}
        >
          {feedback}
          <OccurrenceChange
            occ={changing}
            save={(reason, target) => {
              const success = act(
                (s) =>
                  cancelOrSwap(
                    s,
                    scope,
                    changing.person,
                    changing.date,
                    reason,
                    target,
                  ),
                "Ocorrência atualizada; as próximas semanas foram preservadas.",
              );
              if (success) setChanging(null);
              return success;
            }}
          />
        </Modal>
      )}
      {ending && (
        <Modal
          title="Encerrar vigência do acordo"
          close={() => {
            setEnding(null);
            clear();
          }}
        >
          {feedback}
          <p className="mb-4 text-sm leading-6">
            As datas anteriores permanecem no histórico. Não é possível encerrar
            retroativamente ou apagar um envio original.
          </p>
          <label className="block text-xs">
            Encerrar a partir de
            <Input
              aria-label="Encerrar a partir de"
              type="date"
              min={today}
              value={stop}
              onChange={(e) => setStop(e.target.value)}
            />
          </label>
          <Button
            className="mt-4"
            onClick={() => {
              if (
                act(
                  (s) => endAgreement(s, scope, ending, stop),
                  "Vigência encerrada; histórico preservado.",
                )
              )
                setEnding(null);
            }}
          >
            Confirmar encerramento do acordo
          </Button>
        </Modal>
      )}
      {selectedReport && reportOccurrence && reportPerson && (
        <Modal
          title="Relatório de Home Office"
          close={() => {
            setSelectedReport(null);
            clear();
          }}
        >
          {feedback}
          <ReportPanel
            key={key(selectedReport.person, selectedReport.date)}
            scope={scope}
            person={reportPerson}
            occ={reportOccurrence}
            report={record}
            active={
              record
                ? activeReport(state, record)
                : reportOccurrence.status === "Autorizado" &&
                  reportOccurrence.requiresReport
            }
            now={now}
            save={(payload, submit) =>
              act(
                (s) =>
                  saveReport(
                    s,
                    scope,
                    selectedReport.person,
                    selectedReport.date,
                    payload,
                    submit,
                  ),
                submit
                  ? "Relatório enviado no prazo; aguardando liderança."
                  : "Rascunho salvo neste navegador.",
              )
            }
            note={(text) =>
              act(
                (s) =>
                  appendOwnNote(
                    s,
                    scope,
                    selectedReport.person,
                    selectedReport.date,
                    text,
                  ),
                "Registro separado salvo; original e prazo preservados.",
              )
            }
            review={(action, text) =>
              act(
                (s) =>
                  reviewReport(
                    s,
                    scope,
                    key(selectedReport.person, selectedReport.date),
                    action,
                    text,
                  ),
                "Revisão registrada com autor e data.",
              )
            }
            rules={() => setRuleId(reportOccurrence.rule)}
          />
        </Modal>
      )}
      {shownRule && (
        <Modal
          title={`Regras aplicáveis · v${shownRule.number}`}
          close={() => setRuleId(null)}
        >
          <p className="mb-5 text-xs text-muted-foreground">
            {shownRule.by} · {stamp(shownRule.at)}. Esta versão permanece
            vinculada ao registro original.
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7">
            {shownRule.text}
          </p>
        </Modal>
      )}
    </div>
  );
}
