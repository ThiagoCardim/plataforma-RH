"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pick, AreaField, Check } from "../academy/components";
import { type WorkflowProps } from "./workflow-ui";
import {
  type DuplicateReview,
  type ResumeField,
  resumeFields,
} from "./resume-types";
import { resolveDuplicate } from "./resume-model";
import { profileLabels } from "./resume-components";
export function DuplicateReviewPanel({ state, scope, act }: WorkflowProps) {
  const [id, setId] = useState(
      state.duplicateReviews!.find((r) => r.state === "Pendente")?.id ?? "",
    ),
    [choices, setChoices] = useState<NonNullable<DuplicateReview["choices"]>>(
      {},
    ),
    [note, setNote] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const r = state.duplicateReviews!.find((r) => r.id === id),
    left = state.candidates.find((p) => p.id === r?.left),
    right = r?.incoming ?? state.candidates.find((p) => p.id === r?.right);
  const rows = [
    ...resumeFields,
    "availabilityStatus",
    "cv",
    "portfolio",
  ] as const;
  const display = (p: typeof left, key: (typeof rows)[number]) =>
    p
      ? key === "cv" || key === "portfolio"
        ? (p[key]?.name ?? "Sem arquivo")
        : p[key as ResumeField] || "Não informado"
      : "Indisponível";
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-accent p-3 text-xs leading-6">
        Nome, e-mail ou telefone semelhantes sinalizam uma possível duplicidade.
        Nenhuma unificação é automática. Escolha os campos e confirme a
        identidade; todos os processos, propostas, avaliações, admissões e
        desligamentos serão preservados. Convites abertos são revogados ao
        unificar.
      </p>
      <Pick
        label="Revisão de duplicidade"
        value={id}
        options={[
          { id: "", name: "Selecione" },
          ...state.duplicateReviews!.map((r) => ({
            id: r.id,
            name: `${state.candidates.find((p) => p.id === r.left)?.name} ↔ ${r.incoming?.name ?? state.candidates.find((p) => p.id === r.right)?.name} · ${r.state}`,
          })),
        ]}
        onChange={(v) => {
          setId(v);
          setChoices({});
          setNote("");
          setConfirmed(false);
        }}
      />
      {r && left && right ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4 text-sm">
              <strong>Cadastro principal · {left.name}</strong>
              <p className="mt-2 text-xs">
                {left.source} · primeiro cadastro {left.created}
              </p>
            </div>
            <div className="rounded-xl border p-4 text-sm">
              <strong>
                {r.incoming ? "Dados recebidos" : "Outro cadastro"} ·{" "}
                {right.name}
              </strong>
              <p className="mt-2 text-xs">
                {right.source} · primeiro cadastro {right.created}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3">Campo</th>
                  <th>Principal</th>
                  <th>Recebido / outro</th>
                  <th>Manter</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((key) => (
                  <tr key={key} className="border-t">
                    <th className="p-3">{profileLabels[key]}</th>
                    <td className="max-w-48 break-words pr-3">
                      {display(left, key)}
                    </td>
                    <td className="max-w-48 break-words pr-3">
                      {display(right, key)}
                    </td>
                    <td className="min-w-36 p-2">
                      <Pick
                        label={`Manter ${profileLabels[key]}`}
                        value={choices[key] ?? "left"}
                        options={[
                          { id: "left", name: "Principal" },
                          { id: "right", name: "Recebido / outro" },
                        ]}
                        onChange={(v) =>
                          setChoices({
                            ...choices,
                            [key]: v as "left" | "right",
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs">
            Vínculos de interesse, tags e evidências profissionais são reunidos.
            O primeiro cadastro mantém a data mais antiga; o histórico das duas
            origens permanece disponível.
          </p>
          {r.state === "Pendente" ? (
            <>
              <AreaField
                label="Justificativa da revisão de duplicidade"
                value={note}
                onChange={setNote}
              />
              <Check
                label="Revisei a identidade e os campos antes de decidir"
                checked={confirmed}
                onChange={setConfirmed}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!confirmed || !note.trim()}
                  onClick={() =>
                    act((s) =>
                      resolveDuplicate(s, scope, id, true, choices, note),
                    )
                  }
                >
                  Unificar registros revisados
                </Button>
                <Button
                  variant="outline"
                  disabled={!confirmed || !note.trim()}
                  onClick={() =>
                    act((s) =>
                      resolveDuplicate(s, scope, id, false, choices, note),
                    )
                  }
                >
                  Manter registros separados
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm">
              {r.state} · {r.note} · {r.by}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecione uma revisão. Cadastros alterados/unificados precisam de uma
          nova comparação.
        </p>
      )}
    </div>
  );
}
