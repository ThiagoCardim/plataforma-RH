"use client";
import { useState } from "react";
import { TextField, Pick } from "../academy/components";
import { Button } from "@/components/ui/button";
import { brl } from "../career/model";
import { clearWorkflowFilters } from "./workflow-types";
import { recruitmentInsights } from "./workflow-insights";
import { type WorkflowProps, choices } from "./workflow-ui";
export function InsightsDesk({ state }: WorkflowProps) {
  const [filters, setFilters] = useState(clearWorkflowFilters),
    [stage, setStage] = useState("");
  const data = recruitmentInsights(state, filters);
  const patch = (key: keyof typeof filters, value: string) =>
    setFilters({ ...filters, [key]: value });
  const from = filters.from ? Date.parse(filters.from) : NaN,
    until = filters.until ? Date.parse(filters.until) : NaN,
    span = until - from + 86400000;
  const previous =
    Number.isFinite(span) && span > 0
      ? recruitmentInsights(state, {
          ...filters,
          from: new Date(from - span).toISOString().slice(0, 10),
          until: new Date(from - 86400000).toISOString().slice(0, 10),
        })
      : undefined;
  const list = (title: string, rows: [string, number][]) => (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      {rows.length ? (
        rows.map(([label, n]) => (
          <div key={label} className="mt-3 flex justify-between gap-3 text-sm">
            <span>{label}</span>
            <strong>{n}</strong>
          </div>
        ))
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Dados insuficientes no recorte.
        </p>
      )}
    </section>
  );
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3 xl:grid-cols-6">
        <TextField
          label="Período inicial"
          type="date"
          value={filters.from}
          onChange={(v) => patch("from", v)}
        />
        <TextField
          label="Período final"
          type="date"
          value={filters.until}
          onChange={(v) => patch("until", v)}
        />
        <Pick
          label="Setor dos indicadores"
          value={filters.sector}
          options={choices(["", ...new Set(state.jobs.map((j) => j.sector))])}
          onChange={(v) => patch("sector", v)}
        />
        <Pick
          label="Vaga dos indicadores"
          value={filters.job}
          options={[
            { id: "", name: "Todas" },
            ...state.jobs.map((j) => ({ id: j.id, name: j.title })),
          ]}
          onChange={(v) => patch("job", v)}
        />
        <Pick
          label="Vínculo dos indicadores"
          value={filters.contract}
          options={choices(["", "CLT", "Estágio", "PJ"])}
          onChange={(v) => patch("contract", v)}
        />
        <TextField
          label="Origem dos indicadores"
          value={filters.origin}
          onChange={(v) => patch("origin", v)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          [
            "Currículos recebidos",
            new Set(data.apps.map((a) => a.candidate)).size,
          ],
          ["Qualificados", data.qualified],
          ["Formalizações RH", data.hires.length],
          ["Vagas preenchidas", data.jobs.filter((j) => j.filledAt).length],
          [
            "Aceite de propostas",
            data.acceptance === null ? "Sem dados" : data.acceptance + "%",
          ],
          ["Do Banco de Talentos", data.bankHires],
          [
            "Custo por contratação",
            data.cost === null ? "Sem dados" : brl(data.cost),
          ],
          ["Saídas até 90 dias", data.earlyExits],
        ].map(([label, value]) => (
          <article className="rounded-xl border bg-card p-4" key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {previous
          ? `Comparação com período anterior equivalente: ${previous.apps.length} ciclos e ${previous.hires.length} formalizações; período atual: ${data.apps.length} ciclos e ${data.hires.length} formalizações.`
          : "Defina início e fim para comparar com o período anterior equivalente."}{" "}
        Os resultados são exclusivamente demonstrativos. Passagens puladas não
        são inferidas; percentuais consideram os registros observados.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 font-semibold">
            Funil por passagens registradas
          </h2>
          {data.funnel.map((st) => (
            <button
              key={st.id}
              onClick={() => setStage(stage === st.id ? "" : st.id)}
              className="mb-3 block w-full text-left"
            >
              <span className="flex justify-between gap-3 text-xs">
                <span>{st.name}</span>
                <strong>{st.count}</strong>
              </span>
              <span className="my-2 block h-1.5 rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(st.count / (data.apps.length || 1)) * 100}%`,
                    background: st.color,
                  }}
                />
              </span>
              <span className="text-[11px] text-muted-foreground">
                {st.conversion === null
                  ? "Conversão sem base"
                  : `${st.conversion}% da etapa anterior`}{" "}
                · {st.skipped} passagens sem etapa anterior · média{" "}
                {st.average ?? "—"} dias
              </span>
            </button>
          ))}
          {stage && (
            <div className="rounded-lg bg-muted p-3 text-xs">
              {data.apps
                .filter((a) => a.visits.some((v) => v.stage === stage))
                .map(
                  (a) =>
                    state.candidates.find((p) => p.id === a.candidate)?.name,
                )
                .join(" · ") || "Sem passagens."}
              <Button variant="ghost" onClick={() => setStage("")}>
                Fechar detalhe
              </Button>
            </div>
          )}
        </section>
        <div className="space-y-4">
          {list(
            "Retenção por coorte elegível",
            data.retention
              .filter((r) => r.total)
              .map((r) => [
                `${r.days} dias · ${r.retained}/${r.total}`,
                Math.round((r.retained / r.total) * 100),
              ]),
          )}
          <p className="text-xs text-muted-foreground">
            Somente vínculos confirmados com tempo de observação suficiente. Sem
            coorte madura, não há estimativa de retenção.
          </p>
          {list("Contratações por setor", data.sectors)}
          {list("Contratações por vínculo", data.contracts)}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {list("Origens dos currículos", data.sources)}
        {list("Motivos de recusa", data.declines)}
        {list("Reprovações e desqualificações", data.rejections)}
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold">Efetividade das fontes</h3>
        {data.effectiveness.map((r) => (
          <p className="mt-3 text-sm" key={r.source}>
            {r.source}: {r.hired} contratações / {r.total} ciclos (
            {Math.round((r.hired / r.total) * 100)}%)
          </p>
        ))}
      </section>
    </div>
  );
}
