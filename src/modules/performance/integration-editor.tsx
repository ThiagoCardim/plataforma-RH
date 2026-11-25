"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/fields";
import {
  type Scope,
  type CareerState,
  projection as careerProjection,
  admin,
} from "../career/model";
import { type PdiState, pdiProjection } from "../pdi/model";
import { loadLocalDemo } from "../local-demo/use-local-demo";
import { useEvaluationReferences } from "../development-links/references";
import { linkEvaluation } from "../development-links/model";
import { type PerformanceState, type Evaluation } from "./model";
export type BridgeTargets = {
  plans: { id: string; person: string; name: string }[];
  cycles: { id: string; name: string }[];
};
export function IntegrationEditor({
  state,
  scope,
  evaluation,
  initial,
  done,
}: {
  state: PerformanceState;
  scope: Scope;
  evaluation: Evaluation;
  initial: BridgeTargets;
  done: () => void;
}) {
  const [targets, setTargets] = useState(initial),
    [target, setTarget] = useState<"pdi" | "recognition">(
      state.people.find((p) => p.id === evaluation.person)?.contract === "PJ"
        ? "recognition"
        : "pdi",
    ),
    [id, setId] = useState(""),
    [summary, setSummary] = useState(""),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const refs = useEvaluationReferences(scope);
  const isPJ =
    state.people.find((p) => p.id === evaluation.person)?.contract === "PJ";
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadLocalDemo<PdiState>(`pdi-v1:${scope.key}`),
      admin(scope)
        ? loadLocalDemo<CareerState>(`career-v1:admin:${scope.key}`)
        : Promise.resolve(undefined),
    ])
      .then(([p, ca]) => {
        if (!alive) return;
        setTargets({
          plans: p
            ? pdiProjection(p, scope).plans.map((x) => ({
                id: x.id,
                person: x.person,
                name: `${p.people.find((v) => v.id === x.person)?.name} · ${x.cycle.name}`,
              }))
            : initial.plans,
          cycles: ca
            ? (careerProjection(ca, scope)
                .finance?.cycles.filter((c) => c.status === "Aberto")
                .map((c) => ({ id: c.id, name: c.name })) ?? [])
            : initial.cycles,
        });
      })
      .catch(() =>
        setError(
          "Não foi possível carregar destinos locais; recarregue e tente novamente.",
        ),
      );
    return () => {
      alive = false;
    };
  }, [scope, initial]);
  const choices =
    target === "pdi"
      ? targets.plans.filter((p) => p.person === evaluation.person)
      : targets.cycles;
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-violet-50 p-4 text-sm leading-6">
        Cria uma referência local revisável no destino. Não cria PDI, não altera
        ações, não recomenda promoção, não gera análise financeira nem
        compromete orçamento. Não há sincronização entre contas.
      </p>
      {saved && (
        <p role="status" className="text-sm text-emerald-800">
          {saved}
        </p>
      )}
      {(error || refs.error) && (
        <p role="alert" className="text-sm text-rose-800">
          {error || refs.error}
        </p>
      )}
      <label className="block text-sm">
        Destino da avaliação
        <Select
          aria-label="Destino da avaliação"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value as typeof target);
            setId("");
          }}
        >
          {!isPJ && <option value="pdi">PDI existente</option>}
          {admin(scope) && (
            <option value="recognition">Ciclo de Reconhecimento</option>
          )}
        </Select>
      </label>
      <label className="block text-sm">
        Plano ou ciclo de destino
        <Select
          aria-label="Plano ou ciclo de destino"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">Selecione</option>
          {choices.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </Select>
      </label>
      {!choices.length && (
        <p className="text-sm text-muted-foreground">
          Não existe destino compatível nesta conta. Cadastre um PDI pela
          liderança ou um ciclo pela gestão no módulo correspondente.
        </p>
      )}
      <label className="block text-sm">
        Síntese para desenvolvimento ou análise
        <Textarea
          aria-label="Síntese para desenvolvimento ou análise"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>
      <Button
        disabled={!refs.ready}
        onClick={() => {
          try {
            if (
              refs.value.some(
                (r) =>
                  r.source === evaluation.id &&
                  r.target === target &&
                  r.targetId === id,
              )
            )
              throw new Error(
                "Esta avaliação já está vinculada a este destino.",
              );
            const r = linkEvaluation(
              state,
              scope,
              evaluation.id,
              target,
              id,
              summary,
            );
            if (!choices.some((x) => x.id === id))
              throw new Error("Destino inválido.");
            refs.setValue([...refs.value, r]);
            setSaved(
              "Referência vinculada localmente. Feche este painel para consultar o destino.",
            );
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Vincular referência local
      </Button>
      <Button variant="outline" onClick={done}>
        Fechar
      </Button>
    </div>
  );
}
