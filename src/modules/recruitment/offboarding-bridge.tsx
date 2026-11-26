"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField, Pick, Check } from "../academy/components";
import { Notice } from "../performance/components";
import {
  type State as JourneyState,
  type Termination,
} from "../onboarding/model";
import { type Scope, dateNow } from "../career/model";
import { type State } from "./model";
import { useRecruitment } from "./store";
import {
  startRecruitmentOffboarding,
  confirmRecruitmentExit,
} from "./offboarding-model";
import { choices } from "./workflow-ui";
export function RecruitmentOffboarding({
  initial,
  scope,
  target,
  change,
}: {
  initial: State;
  scope: Scope;
  target: JourneyState;
  change: (s: JourneyState) => void;
}) {
  const local = useRecruitment(initial, scope),
    [employment, setEmployment] = useState(""),
    [kind, setKind] = useState<Termination>("Voluntário"),
    [confirmed, setConfirmed] = useState(false),
    [end, setEnd] = useState(dateNow());
  if (!scope.rh || !local.ready) return null;
  const active = local.state.employments!.filter((e) => e.status === "Ativo"),
    linked = target.processes.filter((p) =>
      p.sources.some((s) => s.startsWith("recruitment-employment:")),
    );
  if (!active.length && !linked.length) return null;
  return (
    <details className="my-4 rounded-xl border border-orange-200 bg-orange-50/30 p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Contratações locais · vínculo com Recrutamento
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-xs leading-6">
          Inicie o desligamento a partir deste módulo. Arquivar cards não
          encerra vínculos. Somente o RH confirma a conclusão, após as
          atividades obrigatórias. Nenhuma revogação real de acesso é realizada.
        </p>
        <Notice error={local.error} notice={local.notice} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Pick
            label="Vínculo local para Offboarding"
            value={employment}
            options={[
              { id: "", name: "Selecione" },
              ...active.map((e) => ({
                id: e.id,
                name: `${local.state.candidates.find((p) => p.id === e.candidate)?.name} · ${e.contract}`,
              })),
            ]}
            onChange={setEmployment}
          />
          <Pick
            label="Tipo de desligamento local"
            value={kind}
            options={choices(["Voluntário", "Involuntário"])}
            onChange={(v) => setKind(v as Termination)}
          />
          <Button
            disabled={!employment}
            onClick={() => {
              try {
                change(
                  startRecruitmentOffboarding(
                    target,
                    local.state,
                    scope,
                    employment,
                    kind,
                  ),
                );
                local.act(
                  (s) => s,
                  "Offboarding vinculado ao cadastro original. Atividades e confirmação permanecem neste módulo.",
                );
              } catch (e) {
                local.act(() => {
                  throw e;
                });
              }
            }}
          >
            Iniciar Offboarding vinculado
          </Button>
        </div>
        {linked.length > 0 && (
          <>
            <TextField
              label="Data confirmada do encerramento local"
              type="date"
              value={end}
              onChange={setEnd}
            />
            <Check
              label="RH confirma a conclusão fictícia após conferir todas as atividades"
              checked={confirmed}
              onChange={setConfirmed}
            />
            {linked.map((p) => {
              const e = local.state.employments!.find((e) =>
                p.sources.includes(`recruitment-employment:${e.id}`),
              );
              return (
                <article
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3"
                >
                  <div>
                    <strong className="text-sm">{p.name}</strong>
                    <p className="text-xs">
                      {e?.status} ·{" "}
                      {p.archived
                        ? "Processo arquivado; não confirma encerramento"
                        : "Atividades no card de Offboarding"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={
                      !confirmed || e?.status === "Encerrado" || p.archived
                    }
                    onClick={() =>
                      local.act((s) =>
                        confirmRecruitmentExit(s, scope, p, end, confirmed),
                      )
                    }
                  >
                    {e?.status === "Encerrado"
                      ? "Encerramento confirmado"
                      : "Confirmar conclusão e vínculo encerrado"}
                  </Button>
                </article>
              );
            })}
          </>
        )}
      </div>
    </details>
  );
}
