"use client";
import Link from "next/link";
import { type Scope, admin } from "../career/model";
import { type EvaluationReference } from "./model";
import { useLocalDemo } from "../local-demo/use-local-demo";
export function useEvaluationReferences(scope: Scope) {
  return useLocalDemo<EvaluationReference[]>(
    `evaluation-links-v1:${scope.key}`,
    [],
    (rows) => rows.filter((r) => r.org === scope.org),
  );
}
export function EvaluationReferences({
  scope,
  target,
  targetId,
}: {
  scope: Scope;
  target: EvaluationReference["target"];
  targetId: string;
}) {
  const { value, ready, error } = useEvaluationReferences(scope);
  const rows = value.filter(
    (r) => r.target === target && r.targetId === targetId,
  );
  if (!ready) return null;
  return (
    <section className="mt-4 space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <h4 className="text-sm font-semibold">
        Evidências vinculadas da Avaliação de Desempenho
      </h4>
      {error && <p className="text-sm text-rose-800">{error}</p>}
      {rows.length ? (
        rows.map((r) => (
          <article key={r.id} className="rounded-lg border bg-card p-3">
            <p className="text-sm font-semibold">{r.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {r.summary}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {r.by} · {new Date(r.at).toLocaleDateString("pt-BR")} · referência
              local, sem ação automática
            </p>
          </article>
        ))
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Nenhuma referência vinculada nesta conta. Uma avaliação validada pode
          ser conectada manualmente, sem alterar o plano, reservar orçamento ou
          sugerir promoção.
        </p>
      )}
      {(admin(scope) || scope.contract !== "PJ") && (
        <Link
          className="inline-block text-sm font-medium text-primary underline"
          href="/avaliacao-de-desempenho"
        >
          Consultar avaliações
        </Link>
      )}
    </section>
  );
}
