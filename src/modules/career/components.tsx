"use client";
import { useState } from "react";
import {
  GitBranch,
  ArrowUpRight,
  Focus,
  Minus,
  Plus,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import {
  type CareerRole,
  type CareerState,
  type Movement,
  type Kind,
  brl,
  cents,
  kinds,
  impact,
  monthly,
  dateNow,
} from "./model";
export function CareerMap({
  roles,
  current,
  select,
}: {
  roles: CareerRole[];
  current?: string;
  select: (r: CareerRole) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const branches = ["Técnica", "Base", "Liderança"] as const;
  const levels = [...new Set(roles.map((r) => r.level))].sort((a, b) => b - a);
  const widths = branches.map(
    (b) =>
      Math.max(
        1,
        ...levels.map(
          (l) => roles.filter((r) => r.branch === b && r.level === l).length,
        ),
      ) * 240,
  );
  const width = widths.reduce((a, b) => a + b, 0),
    height = Math.max(300, levels.length * 145 + 50);
  const nodes = roles.map((r) => {
    const lane = branches.indexOf(r.branch),
      group = roles.filter((x) => x.branch === r.branch && x.level === r.level);
    const offset = widths.slice(0, lane).reduce((a, b) => a + b, 0);
    return {
      r,
      x:
        offset +
        (widths[lane] - group.length * 240) / 2 +
        group.findIndex((x) => x.id === r.id) * 240 +
        120,
      y: levels.indexOf(r.level) * 145 + 36,
    };
  });
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch size={18} className="text-primary" />
          Mapa de possibilidades
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Reduzir mapa"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          >
            <Minus />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Restaurar zoom do mapa"
            onClick={() => setZoom(1)}
          >
            <Focus />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Ampliar mapa"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
          >
            <Plus />
          </Button>
        </div>
      </header>
      <div className="flex flex-wrap justify-center gap-5 px-4 pt-4 text-[11px]">
        <span className="text-violet-700">● Caminho técnico</span>
        <span className="text-stone-600">● Base compartilhada</span>
        <span className="text-emerald-700">● Caminho de liderança</span>
      </div>
      <div
        className="max-w-full overflow-x-auto p-4"
        role="region"
        aria-label="Mapa interativo de carreira"
        tabIndex={0}
      >
        <div
          style={{ width: width * zoom, height: height * zoom, margin: "auto" }}
        >
          <div
            className="relative origin-top-left"
            style={{ width, height, transform: `scale(${zoom})` }}
          >
            <svg
              width={width}
              height={height}
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            >
              {nodes.map((n) => {
                const parent = nodes.find((p) => p.r.id === n.r.parent);
                if (!parent) return null;
                return (
                  <path
                    key={n.r.id}
                    d={`M ${parent.x} ${parent.y + 48} C ${parent.x} ${parent.y - 10}, ${n.x} ${n.y + 140}, ${n.x} ${n.y + 96}`}
                    fill="none"
                    stroke={
                      n.r.branch === "Técnica"
                        ? "#c4b5fd"
                        : n.r.branch === "Liderança"
                          ? "#a7d8c0"
                          : "#d6d3d1"
                    }
                    strokeWidth={2.5}
                  />
                );
              })}
            </svg>
            {nodes.map(({ r, x, y }) => (
              <button
                key={r.id}
                aria-label={`Explorar cargo ${r.title} ${r.levelName}`}
                aria-pressed={r.id === current}
                onClick={() => select(r)}
                className={`absolute w-[216px] rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none ${r.id === current ? "border-2 border-orange-500 ring-4 ring-orange-50" : r.branch === "Técnica" ? "border-violet-100 hover:border-violet-400" : r.branch === "Liderança" ? "border-emerald-100 hover:border-emerald-400" : "border-stone-200 hover:border-orange-300"}`}
                style={{ left: x - 108, top: y }}
              >
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.id === current ? "Seu cargo atual" : r.levelName}
                </p>
                <h3 className="text-sm font-semibold">{r.title}</h3>
                <p className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  {r.competencies.length} competências
                  <ArrowUpRight
                    size={14}
                    className={r.id === current ? "text-primary" : ""}
                  />
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="border-t p-4 text-xs leading-5 text-muted-foreground">
        Estrutura de possibilidades, sem previsão, proximidade ou garantia de
        promoção. Nenhum percurso é automático por tempo, cursos, certificações
        ou conclusão de PDI.
      </p>
    </section>
  );
}
export function RoleDetails({ role }: { role: CareerRole }) {
  return (
    <div className="space-y-6">
      <div>
        <Badge>
          {role.branch} · {role.levelName}
        </Badge>
        <h3 className="mt-3 text-2xl font-semibold">{role.title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Responsabilidades", role.responsibilities],
          ["Requisitos de atuação", role.requirements],
        ].map(([title, items]) => (
          <section
            className="rounded-xl border bg-card p-4"
            key={title as string}
          >
            <h4 className="mb-3 font-semibold">{title as string}</h4>
            <ul className="space-y-3">
              {(items as string[]).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm leading-6">
                  <CheckCircle2
                    size={15}
                    className="mt-1 shrink-0 text-primary"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section>
        <h4 className="mb-3 font-semibold">Competências esperadas</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {role.competencies.map((c, i) => (
            <details
              key={i}
              className="rounded-xl border bg-gradient-to-br from-white to-violet-50/40 p-4"
            >
              <summary className="cursor-pointer text-sm font-semibold">
                {c.name}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {c.description}
              </p>
            </details>
          ))}
        </div>
      </section>
      <p className="rounded-xl bg-accent p-4 text-xs leading-5">
        Explore conhecimentos e responsabilidades com sua liderança. Este card
        não abre solicitação de promoção nem representa compromisso de
        movimentação.
      </p>
    </div>
  );
}
export type Field = {
  key: string;
  label: string;
  type?:
    "text" | "number" | "money" | "date" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
};
export function EntityForm({
  fields,
  initial,
  save,
  label = "Salvar",
  description,
}: {
  fields: Field[];
  initial: Record<string, string>;
  save: (data: Record<string, string>) => boolean;
  label?: string;
  description?: string;
}) {
  const [data, set] = useState(initial);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(data);
      }}
    >
      {description && (
        <p className="rounded-xl bg-accent p-4 text-xs leading-5">
          {description}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.type === "checkbox" ? (
            <label
              key={f.key}
              className="flex items-center gap-2 text-sm sm:col-span-2"
            >
              <input
                type="checkbox"
                aria-label={f.label}
                checked={data[f.key] === "true"}
                onChange={(e) =>
                  set({ ...data, [f.key]: String(e.target.checked) })
                }
              />
              {f.label}
            </label>
          ) : (
            <label
              key={f.key}
              className={`block text-xs ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
            >
              {f.label}
              {f.type === "textarea" ? (
                <Textarea
                  aria-label={f.label}
                  value={data[f.key] ?? ""}
                  required={f.required !== false}
                  onChange={(e) => set({ ...data, [f.key]: e.target.value })}
                />
              ) : f.type === "select" ? (
                <Select
                  aria-label={f.label}
                  value={data[f.key] ?? ""}
                  onChange={(e) => set({ ...data, [f.key]: e.target.value })}
                >
                  {f.options?.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  aria-label={f.label}
                  type={f.type === "money" ? "number" : (f.type ?? "text")}
                  step={
                    f.type === "money"
                      ? "0.01"
                      : f.type === "number"
                        ? "any"
                        : undefined
                  }
                  value={data[f.key] ?? ""}
                  required={f.required !== false}
                  onChange={(e) => set({ ...data, [f.key]: e.target.value })}
                />
              )}
            </label>
          ),
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit">{label}</Button>
      </div>
    </form>
  );
}
export function ImpactCards({ value }: { value: ReturnType<typeof impact> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        [value.monthly, "Impacto adicional mensal"],
        [value.annual, "Impacto adicional em 12 meses"],
        [value.reserve, "Reserva para o ciclo"],
      ].map(([n, l]) => (
        <div className="rounded-xl border bg-white p-4" key={l as string}>
          <p className="text-[11px] text-muted-foreground">{l as string}</p>
          <p className="mt-2 text-lg font-semibold">{brl(n as number)}</p>
        </div>
      ))}
    </div>
  );
}
export function MovementEditor({
  state,
  initial,
  save,
}: {
  state: CareerState;
  initial?: Movement;
  save: (
    input: Pick<
      Movement,
      | "id"
      | "person"
      | "cycle"
      | "kind"
      | "proposed"
      | "targetRole"
      | "effective"
      | "merit"
    >,
  ) => boolean;
}) {
  const f = state.finance!;
  const [personId, setPerson] = useState(
    initial?.person ?? state.people[0]?.id ?? "",
  );
  const person = state.people.find((p) => p.id === personId)!;
  const [kind, setKind] = useState<Kind>(
    initial?.kind ?? kinds(person.contract)[0],
  );
  const [amount, setAmount] = useState(
    String(
      (initial?.proposed ??
        (f.compensation.find((c) => c.person === personId)?.gross ?? 0) +
          50000) / 100,
    ),
  );
  const [cycleId, setCycle] = useState(
    initial?.cycle ?? f.cycles.find((c) => c.status === "Aberto")?.id ?? "",
  );
  const [target, setTarget] = useState(initial?.targetRole ?? "");
  const [effective, setEffective] = useState(initial?.effective ?? dateNow());
  const [merit, setMerit] = useState(initial?.merit ?? "");
  const cycle = f.cycles.find((c) => c.id === cycleId),
    current =
      initial?.current ??
      f.compensation.find((c) => c.person === personId)?.gross ??
      0;
  const rates = initial?.rates ?? f.rates[person.contract];
  let quote: ReturnType<typeof impact> | undefined;
  let quoteError = "";
  try {
    quote = impact({
      current,
      proposed: cents(amount),
      rates,
      months: initial?.months ?? cycle?.months ?? 12,
    });
  } catch (e) {
    quoteError = (e as Error).message;
  }
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (quote)
          save({
            id: initial?.id ?? crypto.randomUUID(),
            person: personId,
            cycle: cycleId,
            kind,
            proposed: cents(amount),
            targetRole: kind === "Promoção" ? target : "",
            effective,
            merit,
          });
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-xs leading-5">
        Análise confidencial do RH. Valores e percentuais são fictícios e
        parametrizáveis; não representam obrigações definitivas de encargos ou
        provisões. Nenhum efeito ocorre em folha, contrato ou vínculo real.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs">
          Profissional / contratada
          <Select
            aria-label="Pessoa da análise"
            disabled={!!initial}
            value={personId}
            onChange={(e) => {
              const p = state.people.find((p) => p.id === e.target.value)!;
              setPerson(p.id);
              setKind(kinds(p.contract)[0]);
              setTarget("");
              setAmount(
                String(
                  ((f.compensation.find((c) => c.person === p.id)?.gross ?? 0) +
                    50000) /
                    100,
                ),
              );
            }}
          >
            {state.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.contract}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Tipo de reconhecimento
          <Select
            aria-label="Tipo de reconhecimento"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setTarget("");
            }}
          >
            {kinds(person.contract).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Ciclo
          <Select
            aria-label="Ciclo de reconhecimento"
            disabled={!!initial}
            value={cycleId}
            onChange={(e) => setCycle(e.target.value)}
          >
            {f.cycles
              .filter((c) => c.status === "Aberto" || c.id === initial?.cycle)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </label>
        <label className="text-xs">
          Valor bruto mensal proposto
          <Input
            aria-label="Valor bruto mensal proposto"
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        {kind === "Promoção" && (
          <label className="text-xs">
            Cargo de destino
            <Select
              aria-label="Cargo de destino"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Selecione um cargo publicado</option>
              {state.roles
                .filter((r) => r.published && r.id !== person.role)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ·{" "}
                    {state.sectors.find((s) => s.id === r.sector)?.name}
                  </option>
                ))}
            </Select>
          </label>
        )}
        <label className="text-xs">
          Data de efeito simulada
          <Input
            aria-label="Data de efeito simulada"
            type="date"
            required
            value={effective}
            onChange={(e) => setEffective(e.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Atual: {brl(current)} bruto · Encargos ilustrativos {rates.charges}% ·
        Provisões mensais equivalentes {rates.provisions}% · Reserva de{" "}
        {initial?.months ?? cycle?.months ?? 12} meses. Parâmetros ficam
        preservados na análise.
      </p>
      {quote ? (
        <>
          <ImpactCards value={quote} />
          <div className="rounded-xl border bg-card p-4 text-xs leading-6">
            <p>Diferença bruta mensal: {brl(quote.gross)}</p>
            <p>Diferença de encargos: {brl(quote.charges)}</p>
            <p>Diferença de provisões: {brl(quote.provisions)}</p>
            <p>
              Custo mensal total atual: {brl(monthly(current, rates).total)}.
            </p>
            <p>
              O impacto anual corresponde a 12 vezes a diferença mensal.
              Provisões são parâmetros mensais equivalentes e não são somadas
              novamente ao anual.
            </p>
          </div>
        </>
      ) : (
        <p role="alert" className="text-sm text-destructive">
          {quoteError}
        </p>
      )}
      <label className="block text-xs">
        Fundamentos de mérito e evidências
        <Textarea
          aria-label="Fundamentos de mérito"
          value={merit}
          onChange={(e) => setMerit(e.target.value)}
          placeholder="Contextualize contribuições, qualidade, responsabilidades e evidências. Não há progressão automática."
        />
      </label>
      <Button type="submit" disabled={!quote || !cycleId}>
        <Sparkles />
        Salvar análise confidencial
      </Button>
    </form>
  );
}
