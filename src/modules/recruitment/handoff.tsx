"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Scope } from "../career/model";
import { type State as OnboardingState } from "../onboarding/model";
import { loadLocalDemo } from "../local-demo/use-local-demo";
import { type State, projection } from "./model";
import { adoptOnboarding } from "./handoff-model";
export function RecruitmentAdmissions({
  scope,
  target,
  change,
}: {
  scope: Scope;
  target: OnboardingState;
  change: (s: OnboardingState) => void;
}) {
  const [source, setSource] = useState<State | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!scope.rh) return;
    let alive = true;
    loadLocalDemo<State>(`recruitment-v1:${scope.key}`)
      .then((s) => {
        if (s && alive) setSource(projection(s, scope));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [scope]);
  if (!scope.rh || !source?.handoffs.length) return null;
  return (
    <section className="my-5 space-y-4 rounded-2xl border border-orange-200 bg-orange-50/30 p-5">
      <h2 className="text-lg font-semibold">
        Admissões preparadas no Recrutamento
      </h2>
      <p className="text-xs leading-6 text-muted-foreground">
        Somente contratações fictícias formalizadas pelo RH. Reutiliza nome
        autorizado e metadados da vaga, sem copiar currículo, perfil, notas ou
        criar conta real.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {source.handoffs
        .filter((h) => Object.keys(h.fields).length)
        .map((h) => {
          const exists = target.processes.some((p) => p.sources.includes(h.id));
          return (
            <article
              key={h.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <div>
                <p className="font-medium">{h.fields.name}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {exists
                    ? "Onboarding já iniciado sem duplicidade"
                    : "Dados autorizados aguardando revisão"}
                </p>
              </div>
              <Button
                disabled={exists}
                variant="outline"
                onClick={() => {
                  try {
                    change(adoptOnboarding(target, source, scope, h.id));
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {exists ? "Já iniciado" : "Iniciar Onboarding demonstrativo"}
              </Button>
            </article>
          );
        })}
    </section>
  );
}
