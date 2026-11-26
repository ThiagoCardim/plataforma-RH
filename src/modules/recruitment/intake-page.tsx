"use client";
import Link from "next/link";
import { useState } from "react";
import { type State } from "./model";
import { type Scope } from "../career/model";
import { useRecruitment } from "./store";
import { Upload } from "../academy/components";
import { FileCard } from "../documents/file-card";
import { saveAdmission } from "./workflow-model";
import { CandidateForm } from "./forms";
import { Notice } from "../performance/components";
import { submitResumeIntake } from "./resume-model";
import { submitAdmissionInfo } from "./workflow-model";
import "./recruitment.css";
export function IntakePage({
  initial,
  scope,
  admission,
  token,
}: {
  initial: State;
  scope: Scope;
  admission?: string;
  token?: string;
}) {
  const local = useRecruitment(initial, scope),
    [sent, setSent] = useState(false),
    x = local.state.admissions!.find(
      (x) =>
        x.id === admission &&
        x.token === token &&
        x.state === "Aberta" &&
        x.contract !== "CLT",
    ),
    form = admission
      ? x?.form
      : local.state.forms.find((f) => f.id === local.state.central!.formId);
  return (
    <main className="ats-shell mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-10">
      <header className="flex justify-between gap-3 border-b pb-5">
        <strong className="text-xl tracking-tight">
          YOUCON<span className="text-primary"> PEOPLE</span>
        </strong>
        <span className="text-xs text-muted-foreground">
          Demonstração protegida
        </span>
      </header>
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        {local.state.central!.privacyNotice} Este link requer autenticação e
        autorização do RH. A futura coleta pública dependerá de implantação e
        revisão específicas.
      </p>
      <Notice error={local.error} notice={local.notice} />
      {!local.ready ? (
        <p role="status">Preparando formulário…</p>
      ) : sent ? (
        <section className="rounded-xl border p-6">
          <h1 className="text-2xl font-semibold">
            {form?.message || "Registro demonstrativo recebido."}
          </h1>
          <p className="mt-4 text-sm">
            {admission
              ? "Informações vinculadas à admissão original."
              : "Currículo recebido sem seleção de vaga. Novos cadastros entram em Entrada; possíveis duplicidades ficam pendentes da revisão do RH, sem unificação automática."}{" "}
            Dados apenas neste navegador e conta; nenhum envio externo.
          </p>
          <Link
            className="mt-5 inline-block text-primary underline"
            href="/recrutamento/processo-seletivo"
          >
            Retornar ao processo
          </Link>
        </section>
      ) : form ? (
        <div className="space-y-4">
          {x &&
            x.rules.map((r) => (
              <section className="space-y-3 rounded-xl border p-4" key={r.id}>
                <h2 className="font-semibold">
                  {r.name} {r.required ? "· obrigatório" : ""}
                </h2>
                <p className="text-xs">{r.instructions}</p>
                <Upload
                  label={`Enviar ${r.name}`}
                  onFile={(file) =>
                    local.act((s) => {
                      const current = s.admissions!.find((a) => a.id === x.id)!;
                      return saveAdmission(s, scope, {
                        ...current,
                        files: { ...current.files, [r.id]: file },
                      });
                    })
                  }
                />
                {x.files[r.id] && <FileCard file={x.files[r.id]} />}
              </section>
            ))}
          <CandidateForm
            form={form}
            submit={(answers, files, consent) => {
              if (!consent) return;
              const result = local.act((s) =>
                admission && x
                  ? submitAdmissionInfo(s, scope, x.id, x.token, answers, files)
                  : submitResumeIntake(s, scope, answers, files, consent),
              );
              if (result) setSent(true);
            }}
          />
        </div>
      ) : (
        <p role="alert">Formulário individual indisponível neste escopo.</p>
      )}
      <footer className="text-xs text-muted-foreground">
        Sem coleta pública de dados reais. Não há sincronização entre contas ou
        dispositivos.
      </footer>
    </main>
  );
}
