"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from "lucide-react";
import {
  type State,
  type Scope,
  type Occurrence,
  type Payload,
  type Period,
  type Report,
  type Agreement,
  type Person,
  periods,
  weekdays,
  day,
  shift,
  blank,
  requiredPeriods,
  canRegister,
  occurrence,
  canReview,
  submissionStatus,
  reviewStatus,
} from "./model";
export const dateLabel = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export const stamp = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-xs font-semibold text-orange-800">
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function StatusBadge({ text }: { text: string }) {
  return (
    <Badge
      className={
        text === "Validado" || text === "Autorizado"
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : text === "Não entregue no prazo"
            ? "border-rose-100 bg-rose-50 text-rose-800"
            : text === "Em esclarecimento" || text === "Pendente"
              ? "border-amber-100 bg-amber-50 text-amber-800"
              : ""
      }
    >
      {text}
    </Badge>
  );
}
export function ScheduleForm({
  kind,
  state,
  scope,
  date,
  save,
  close,
}: {
  kind: "agreement" | "combined" | "signal";
  state: State;
  scope: Scope;
  date: string;
  save: (input: {
    person: string;
    date: string;
    period: Period;
    reason: string;
    mode: Agreement["mode"];
    start: string;
    end: string;
    weekdays: number[];
  }) => boolean;
  close: () => void;
}) {
  const options = state.people.filter((p) =>
    kind === "signal"
      ? p.user === scope.user
      : kind === "agreement"
        ? scope.mode === "rh"
        : canRegister(scope, p),
  );
  options.sort(
    (a, b) =>
      Number(
        kind === "agreement"
          ? state.agreements.some((x) => x.person === a.id && x.end >= day())
          : !!occurrence(state, a.id, date),
      ) -
      Number(
        kind === "agreement"
          ? state.agreements.some((x) => x.person === b.id && x.end >= day())
          : !!occurrence(state, b.id, date),
      ),
  );
  const [person, setPerson] = useState(options[0]?.id ?? "");
  const [selected, setSelected] = useState(date < day() ? day() : date);
  const [period, setPeriod] = useState<Period>("Dia completo");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<Agreement["mode"]>("Híbrido fixo");
  const [end, setEnd] = useState(shift(day(), 90));
  const [days, setDays] = useState<number[]>([1, 3]);
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save({
          person,
          date: selected,
          period,
          reason,
          mode,
          start: selected,
          end,
          weekdays: days,
        });
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-xs leading-5">
        {kind === "signal"
          ? "Sinalize sua necessidade. A data aparecerá como pendente até a confirmação da liderança ou do RH."
          : kind === "combined"
            ? "Registre o combinado já autorizado. O responsável pela autorização será sua conta autenticada; não há envio ou integração com WhatsApp."
            : "Defina a vigência e os dias habituais. Remoto permanente fica dispensado do relatório; híbrido fixo gera obrigação em cada ocorrência autorizada."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs sm:col-span-2">
          Profissional
          <Select
            aria-label="Profissional da escala"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            required
          >
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.contract} · {p.sector}
              </option>
            ))}
          </Select>
        </label>
        {kind === "agreement" && (
          <label className="text-xs sm:col-span-2">
            Modalidade
            <Select
              aria-label="Modalidade do acordo"
              value={mode}
              onChange={(e) => {
                const m = e.target.value as Agreement["mode"];
                setMode(m);
                if (m === "Remoto permanente") setDays([1, 2, 3, 4, 5]);
              }}
            >
              <option>Híbrido fixo</option>
              <option>Remoto permanente</option>
            </Select>
          </label>
        )}
        <label className="text-xs">
          {kind === "agreement" ? "Início da vigência" : "Data do home office"}
          <Input
            aria-label="Data da escala"
            type="date"
            required
            min={day()}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Período
          <Select
            aria-label="Período da escala"
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          >
            {periods.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </label>
        {kind === "agreement" && (
          <label className="text-xs">
            Fim da vigência
            <Input
              aria-label="Fim da vigência"
              type="date"
              required
              min={selected}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        )}
      </div>
      {kind === "agreement" ? (
        <fieldset className="rounded-xl border bg-card p-4">
          <legend className="px-1 text-xs font-semibold">
            Dias habituais da semana
          </legend>
          <div className="flex flex-wrap gap-4">
            {weekdays.map((w, i) => (
              <label key={w} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={days.includes(i)}
                  onChange={(e) =>
                    setDays(
                      e.target.checked
                        ? [...days, i]
                        : days.filter((d) => d !== i),
                    )
                  }
                />
                {w}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            A vigência considera apenas estes dias. Trocas e cancelamentos de
            datas específicas preservam as próximas semanas.
          </p>
        </fieldset>
      ) : (
        <label className="block text-xs">
          Justificativa resumida / referência do combinado
          <Textarea
            aria-label="Justificativa do combinado"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: combinado com a liderança para concentrar uma revisão de projeto."
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">
        {kind === "signal" ? "Sinalizado" : "Registrado"} por {scope.name}.
        Apenas pessoas do seu escopo estão disponíveis.
      </p>
      <footer className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!options.length}>
          {kind === "signal"
            ? "Sinalizar data"
            : kind === "agreement"
              ? "Cadastrar acordo"
              : "Registrar combinado"}
        </Button>
      </footer>
    </form>
  );
}
export function OccurrenceChange({
  occ,
  save,
}: {
  occ: Occurrence;
  save: (reason: string, target?: string) => boolean;
}) {
  const [swap, setSwap] = useState(false),
    [reason, setReason] = useState(""),
    [target, setTarget] = useState(shift(occ.date, 1));
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(reason, swap ? target : undefined);
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-sm">
        {dateLabel(occ.date)} · {occ.period}. A alteração vale somente para esta
        ocorrência. Um rascunho existente permanece no histórico, com a
        obrigação dispensada.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={swap}
          onChange={(e) => setSwap(e.target.checked)}
        />
        Trocar por outra data
      </label>
      {swap && (
        <label className="block text-xs">
          Nova data
          <Input
            aria-label="Nova data da troca"
            type="date"
            min={day()}
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
      )}
      <label className="block text-xs">
        Motivo
        <Textarea
          aria-label="Motivo da alteração"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <Button type="submit">
        {swap ? "Confirmar troca" : "Cancelar ocorrência"}
      </Button>
    </form>
  );
}
export function ReportPanel({
  scope,
  person,
  occ,
  report,
  active,
  now,
  save,
  note,
  review,
  rules,
}: {
  scope: Scope;
  person: Person;
  occ: Occurrence;
  report?: Report;
  active: boolean;
  now: Date;
  save: (payload: Payload, submit: boolean) => boolean;
  note: (text: string) => boolean;
  review: (action: "approve" | "clarify" | "comment", text: string) => boolean;
  rules: () => void;
}) {
  const [payload, set] = useState<Payload>(() =>
    structuredClone(report?.draft ?? blank(occ.period)),
  );
  const [comment, setComment] = useState("");
  const own = person.user === scope.user;
  const writable =
    own &&
    active &&
    occ.date === day(now) &&
    !report?.original &&
    occ.status === "Autorizado" &&
    occ.requiresReport;
  const displayed = report?.original?.payload ?? payload;
  const edit = (id: string, patch: Partial<Payload["activities"][number]>) =>
    set((p) => ({
      ...p,
      activities: p.activities.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }));
  const allowedReview = !!report && canReview(scope, person, report);
  const late = !report?.original && occ.date < day(now) && active;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <Avatar name={person.name} />
          <div>
            <h3 className="text-lg font-semibold">{person.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateLabel(occ.date)} · {occ.period} · {person.sector}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge text={submissionStatus(occ, report, now, active)} />
          {report?.original && <StatusBadge text={reviewStatus(report)} />}
        </div>
      </header>
      <div className="rounded-xl border bg-card p-4 text-xs leading-5">
        <p>
          {report?.original
            ? `Envio original de ${report.original.name} em ${stamp(report.original.at)}. Este conteúdo permanece preservado.`
            : writable
              ? "Envie hoje até 23h59 de Brasília. Você pode salvar rascunhos durante o dia."
              : !active
                ? "Ocorrência alterada ou cancelada. O registro anterior está preservado e não gera nova obrigação."
                : late
                  ? "O prazo do envio original encerrou. Uma justificativa posterior não apaga o atraso."
                  : "O preenchimento fica disponível no próprio dia do home office autorizado."}
        </p>
        <Button size="sm" variant="ghost" onClick={rules}>
          Ler regras aplicáveis
        </Button>
      </div>
      {requiredPeriods(occ.period).map((period) => (
        <section
          className="space-y-3 rounded-xl border bg-card p-4"
          key={period}
        >
          <h4 className="flex items-center gap-2 font-semibold">
            <Clock3 size={16} className="text-primary" />
            {period}
          </h4>
          {displayed.activities
            .filter((a) => a.period === period)
            .map((a, i) => (
              <div
                key={a.id}
                className="space-y-3 rounded-lg border bg-background p-4"
              >
                {writable ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold">
                        Atividade {i + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remover atividade ${period} ${i + 1}`}
                        disabled={
                          payload.activities.filter((x) => x.period === period)
                            .length <= 1
                        }
                        onClick={() =>
                          set({
                            ...payload,
                            activities: payload.activities.filter(
                              (x) => x.id !== a.id,
                            ),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <label className="block text-xs">
                      Atividade, projeto ou demanda
                      <Input
                        aria-label={`Projeto ${period} ${i + 1}`}
                        value={a.project}
                        onChange={(e) =>
                          edit(a.id, { project: e.target.value })
                        }
                        placeholder="Ex.: projeto Aurora — revisão da etapa inicial"
                      />
                    </label>
                    <label className="block text-xs">
                      O que realizei
                      <Textarea
                        aria-label={`Trabalho ${period} ${i + 1}`}
                        value={a.work}
                        onChange={(e) => edit(a.id, { work: e.target.value })}
                        placeholder="Descreva objetivamente o trabalho realizado."
                      />
                    </label>
                    <label className="block text-xs">
                      Resultado ou avanço
                      <Textarea
                        aria-label={`Resultado ${period} ${i + 1}`}
                        value={a.result}
                        onChange={(e) => edit(a.id, { result: e.target.value })}
                        placeholder="O que avançou ou foi concluído?"
                      />
                    </label>
                    <label className="block text-xs">
                      Link ou referência (opcional)
                      <Input
                        aria-label={`Referência ${period} ${i + 1}`}
                        value={a.reference}
                        onChange={(e) =>
                          edit(a.id, { reference: e.target.value })
                        }
                        placeholder="https://…"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <h5 className="text-sm font-semibold">
                      {a.project || "Atividade não preenchida"}
                    </h5>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {a.work || "Sem descrição."}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      <strong>Resultado:</strong> {a.result || "Não informado."}
                    </p>
                    {/^https?:\/\//i.test(a.reference) && (
                      <a
                        href={a.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Abrir referência da entrega
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}
          {writable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                set({
                  ...payload,
                  activities: [
                    ...payload.activities,
                    {
                      id: crypto.randomUUID(),
                      period,
                      project: "",
                      work: "",
                      result: "",
                      reference: "",
                    },
                  ],
                })
              }
            >
              <Plus />
              Atividade da {period.toLowerCase()}
            </Button>
          )}
        </section>
      ))}
      <section className="rounded-xl border bg-card p-4">
        {writable ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={payload.hasBlocker}
                onChange={(e) =>
                  set({ ...payload, hasBlocker: e.target.checked })
                }
              />
              Ficou alguma pendência ou impedimento?
            </label>
            {payload.hasBlocker && (
              <label className="mt-3 block text-xs">
                Explique brevemente
                <Textarea
                  aria-label="Pendências e impedimentos"
                  value={payload.blocker}
                  onChange={(e) => set({ ...payload, blocker: e.target.value })}
                />
              </label>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap text-sm">
            <strong>Pendências:</strong>{" "}
            {displayed.hasBlocker
              ? displayed.blocker || "Não detalhadas."
              : "Nenhuma informada."}
          </p>
        )}
      </section>
      {writable && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => save(payload, false)}>
            Salvar rascunho
          </Button>
          <Button onClick={() => save(payload, true)}>
            <CheckCircle2 />
            Enviar relatório de hoje
          </Button>
        </div>
      )}
      {allowedReview && (
        <section className="space-y-3 rounded-xl border border-orange-200 bg-accent p-4">
          <h4 className="font-semibold">
            {report?.review === "leader"
              ? "Revisão da liderança"
              : "Validação do RH"}
          </h4>
          <label className="block text-xs">
            Comentário de revisão
            <Textarea
              aria-label="Comentário de revisão"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (review("comment", comment)) setComment("");
              }}
            >
              Registrar comentário
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (review("clarify", comment)) setComment("");
              }}
            >
              Pedir esclarecimento
            </Button>
            <Button
              onClick={() => {
                if (review("approve", comment)) setComment("");
              }}
            >
              {report?.review === "leader"
                ? "Conferir e encaminhar ao RH"
                : "Validar relatório pelo RH"}
            </Button>
          </div>
        </section>
      )}
      {own && report?.original && (
        <p className="text-xs text-muted-foreground">
          A revisão será feita por outro aprovador autorizado. Você não pode
          validar seu próprio relatório.
        </p>
      )}
      {own && active && (late || report?.clarification) && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h4 className="flex items-center gap-2 font-semibold">
            <MessageSquare size={16} />
            {late ? "Justificativa de atraso" : "Complementação solicitada"}
          </h4>
          <p className="text-xs text-muted-foreground">
            {late
              ? "Este registro não será um envio original nem converterá o atraso em entrega pontual."
              : "Sua resposta será registrada separadamente, preservando o original e seu horário."}
          </p>
          <Textarea
            aria-label="Complementação ou justificativa"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              if (note(comment)) setComment("");
            }}
          >
            {late ? "Registrar justificativa" : "Enviar complementação"}
          </Button>
        </section>
      )}
      <section className="rounded-xl border bg-card p-4">
        <h4 className="mb-4 font-semibold">Histórico e complementações</h4>
        {report?.notes.length ? (
          report.notes.map((n) => (
            <article
              key={n.id}
              className="mb-4 border-l-2 border-orange-200 pl-3"
            >
              <p className="text-xs font-semibold">{n.kind}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                {n.text}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {n.name} · {stamp(n.at)}
              </p>
            </article>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhuma revisão ou complementação registrada.
          </p>
        )}
      </section>
    </div>
  );
}
