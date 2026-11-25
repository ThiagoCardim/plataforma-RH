"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Meter } from "@/modules/onboarding/components";
import { Plus, Trash2 } from "lucide-react";
import {
  type PerformanceState,
  type Template,
  type Criterion,
  type Event,
  values,
  dimensions,
} from "./model";
import { uid, type Contract } from "../career/model";
export function Notice({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}
    </>
  );
}
export function Tabs({
  items,
  value,
  change,
  label,
}: {
  items: string[];
  value: string;
  change: (s: string) => void;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b pb-2"
    >
      {items.map((x) => (
        <Button
          key={x}
          variant={x === value ? "secondary" : "ghost"}
          aria-pressed={x === value}
          onClick={() => change(x)}
        >
          {x}
        </Button>
      ))}
    </nav>
  );
}
export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </article>
  );
}
export function Events({ events }: { events: Event[] }) {
  return (
    <div className="space-y-4">
      {[...events].reverse().map((e) => (
        <div key={e.id} className="border-l-2 border-orange-200 pl-4">
          <p className="text-sm leading-6">{e.text}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {e.by} · {new Date(e.at).toLocaleString("pt-BR")}
          </p>
        </div>
      ))}
    </div>
  );
}
export const fmt = (n: number | null) =>
  n === null ? "Não observado" : `${Math.round(n)}%`;
export function GoalBar({
  label,
  value,
  note,
}: {
  label: string;
  value: number | null;
  note: string;
}) {
  return (
    <div className="space-y-2">
      <p className="flex justify-between gap-4 text-sm">
        <span>{label}</span>
        <strong>
          {value === null ? "Não observado" : `${Math.round(value)}%`}
        </strong>
      </p>
      <Meter
        value={Math.max(0, Math.min(100, value ?? 0))}
        color="bg-orange-500"
      />
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed p-8 text-center text-sm leading-6 text-muted-foreground">
      {children}
    </p>
  );
}
export function TemplateEditor({
  state,
  initial,
  save,
}: {
  state: PerformanceState;
  initial?: Template;
  save: (t: Template) => boolean;
}) {
  const [t, set] = useState<Template>(() =>
    initial
      ? structuredClone(initial)
      : {
          id: uid(),
          name: "",
          kind: "Operacional",
          sector: state.areas[0].id,
          functionId: "",
          contracts: ["CLT", "Estágio"],
          leaderPerson: "",
          min: 1,
          max: 5,
          version: 0,
          updatedAt: "",
          periodicity: "Mensal · demonstrativa",
          criteria: [
            {
              id: uid(),
              name: "Entregas acordadas",
              dimension: "Entregas",
              question: "O que foi entregue frente ao acordado para a função?",
              weight: 1,
              target: 10,
              direction: "Maior é melhor",
              unit: "entregas",
            },
          ],
        },
  );
  const patch = (data: Partial<Template>) => set({ ...t, ...data });
  const criterion = (id: string, data: Partial<Criterion>) =>
    patch({
      criteria: t.criteria.map((c) => (c.id === id ? { ...c, ...data } : c)),
    });
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(t);
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        Configurações ilustrativas. Alterações criam nova versão do modelo;
        avaliações existentes preservam sua cópia. PJ utiliza exclusivamente
        indicadores de entregas contratuais.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Nome do modelo
          <Input
            required
            value={t.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Tipo de avaliação
          <Select
            aria-label="Tipo de avaliação"
            value={t.kind}
            onChange={(e) => {
              const kind = e.target.value as Template["kind"];
              patch({
                kind,
                contracts:
                  kind === "Operacional"
                    ? t.contracts
                    : t.contracts.filter((c) => c !== "PJ"),
                criteria: t.criteria.map((c, i) => ({
                  ...c,
                  dimension:
                    kind === "Comportamental"
                      ? values[i % 5]
                      : kind === "Operacional"
                        ? dimensions[i % 5]
                        : "Gestão",
                })),
                leaderPerson: "",
              });
            }}
          >
            {["Operacional", "Comportamental", "Liderança"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Setor do modelo
          <Select
            aria-label="Setor do modelo"
            value={t.sector}
            onChange={(e) =>
              patch({
                sector: e.target.value,
                functionId: "",
                leaderPerson: "",
              })
            }
          >
            <option value="">Todos os setores</option>
            {state.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Função do modelo
          <Select
            aria-label="Função do modelo"
            value={t.functionId}
            onChange={(e) => patch({ functionId: e.target.value })}
          >
            <option value="">Todas as funções do setor</option>
            {state.areas
              .find((a) => a.id === t.sector)
              ?.functions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </Select>
        </label>
        <label className="text-sm">
          Periodicidade
          <Input
            required
            value={t.periodicity}
            onChange={(e) => patch({ periodicity: e.target.value })}
          />
        </label>
        {t.kind === "Liderança" && (
          <label className="text-sm">
            Modelo personalizado para
            <Select
              aria-label="Modelo personalizado para"
              value={t.leaderPerson}
              onChange={(e) => patch({ leaderPerson: e.target.value })}
            >
              <option value="">Lideranças elegíveis do setor</option>
              {state.people
                .filter(
                  (p) =>
                    p.isLeader &&
                    p.contract !== "PJ" &&
                    (!t.sector || p.sector === t.sector),
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </label>
        )}
        {t.kind !== "Operacional" && (
          <>
            <label className="text-sm">
              Mínimo da escala
              <Input
                type="number"
                step="any"
                value={t.min}
                onChange={(e) => patch({ min: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Máximo da escala
              <Input
                type="number"
                step="any"
                value={t.max}
                onChange={(e) => patch({ max: Number(e.target.value) })}
              />
            </label>
          </>
        )}
      </div>
      <fieldset className="flex flex-wrap gap-5">
        <legend className="mb-3 text-sm font-semibold">
          Vínculos elegíveis
        </legend>
        {(["CLT", "Estágio", "PJ"] as Contract[]).map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={t.contracts.includes(c)}
              disabled={c === "PJ" && t.kind !== "Operacional"}
              onChange={(e) =>
                patch({
                  contracts: e.target.checked
                    ? [...t.contracts, c]
                    : t.contracts.filter((x) => x !== c),
                })
              }
            />
            {c}
          </label>
        ))}
      </fieldset>
      {t.criteria.map((c, i) => (
        <section key={c.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <Badge>Critério {i + 1}</Badge>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Remover critério ${i + 1}`}
              onClick={() =>
                patch({ criteria: t.criteria.filter((x) => x.id !== c.id) })
              }
            >
              <Trash2 size={16} />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Nome do critério {i + 1}
              <Input
                required
                value={c.name}
                onChange={(e) => criterion(c.id, { name: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Dimensão do critério {i + 1}
              {t.kind === "Liderança" ? (
                <Input
                  value={c.dimension}
                  onChange={(e) =>
                    criterion(c.id, { dimension: e.target.value })
                  }
                />
              ) : (
                <Select
                  aria-label={`Dimensão do critério ${i + 1}`}
                  value={c.dimension}
                  onChange={(e) =>
                    criterion(c.id, { dimension: e.target.value })
                  }
                >
                  {(t.kind === "Operacional" ? dimensions : values).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </Select>
              )}
            </label>
            <label className="text-sm sm:col-span-2">
              Pergunta do critério {i + 1}
              <Textarea
                aria-label={`Pergunta do critério ${i + 1}`}
                required
                value={c.question}
                onChange={(e) => criterion(c.id, { question: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Peso do critério {i + 1}
              <Input
                type="number"
                min="0.01"
                step="any"
                value={c.weight}
                onChange={(e) =>
                  criterion(c.id, { weight: Number(e.target.value) })
                }
              />
            </label>
            {t.kind === "Operacional" && (
              <>
                <label className="text-sm">
                  Meta do critério {i + 1}
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={c.target}
                    onChange={(e) =>
                      criterion(c.id, { target: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="text-sm">
                  Unidade do critério {i + 1}
                  <Input
                    required
                    value={c.unit}
                    onChange={(e) => criterion(c.id, { unit: e.target.value })}
                  />
                </label>
                <label className="text-sm">
                  Sentido do critério {i + 1}
                  <Select
                    aria-label={`Sentido do critério ${i + 1}`}
                    value={c.direction}
                    onChange={(e) =>
                      criterion(c.id, {
                        direction: e.target.value as Criterion["direction"],
                      })
                    }
                  >
                    <option>Maior é melhor</option>
                    <option>Menor é melhor</option>
                  </Select>
                </label>
              </>
            )}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            patch({
              criteria: [
                ...t.criteria,
                {
                  id: uid(),
                  name: "",
                  question: "",
                  dimension:
                    t.kind === "Operacional"
                      ? "Entregas"
                      : t.kind === "Comportamental"
                        ? values[0]
                        : "Gestão",
                  weight: 1,
                  target: 1,
                  direction: "Maior é melhor",
                  unit: "unidade",
                },
              ],
            })
          }
        >
          <Plus size={16} />
          Adicionar critério
        </Button>
        <Button type="submit">Salvar modelo</Button>
      </div>
    </form>
  );
}
