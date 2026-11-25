"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, FileText, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Body } from "../documents/body";
import { FileCard } from "../documents/file-card";
import { type Scope } from "../career/model";
import { type CultureState, latest } from "./model";
import { useCulture, useCultureReading } from "./store";
export function CultureManual({
  state,
  scope,
  source = "Cultura",
  compact = false,
}: {
  state: CultureState;
  scope: Scope;
  source?: "Cultura" | "Onboarding";
  compact?: boolean;
}) {
  const reading = useCultureReading(state, scope),
    v = latest(state),
    m = v?.content.manual,
    [chapter, setChapter] = useState(""),
    [pdf, setPdf] = useState(false),
    [checked, setChecked] = useState(false);
  const selected = m?.chapters.find((c) => c.id === chapter) ?? m?.chapters[0],
    id = `culture-manual:${m?.version}`,
    receipt = reading.value.find((r) => r.manualId === id);
  if (scope.contract === "PJ")
    return (
      <p className="rounded-2xl border bg-card p-6 text-sm leading-7">
        O Manual de Cultura e a ciência de compromissos são destinados a CLT e
        Estágio. Parceiros acessam a apresentação institucional e os recursos
        pertinentes à parceria.
      </p>
    );
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-[#191918] p-7 text-white">
        <div>
          <BookOpen className="text-orange-300" />
          <h2 className="mt-4 text-2xl font-semibold">
            {m?.title ?? "Manual de Cultura"}
          </h2>
          <p className="mt-3 text-sm text-stone-300">
            {m?.ready
              ? `Manual v${m.version} · leitura digital e registro local de ciência`
              : "Documento oficial ainda não disponibilizado"}
          </p>
        </div>
        <Link
          href="/cultura"
          className="inline-flex items-center gap-2 text-sm text-orange-200 underline"
        >
          Central de Cultura <ArrowUpRight size={15} />
        </Link>
      </header>
      {!m?.ready ? (
        <p className="rounded-xl border border-dashed p-6 text-sm leading-7">
          O Manual de Cultura não está disponível nesta demonstração. O RH
          poderá inserir o PDF e organizar os capítulos antes de publicar.
          Nenhuma ciência é exigida sobre conteúdos ausentes.
        </p>
      ) : (
        <>
          {!compact && (
            <div className="grid gap-5 md:grid-cols-[230px_1fr]">
              <nav
                aria-label="Capítulos do Manual de Cultura"
                className="space-y-2 rounded-xl border bg-card p-4"
              >
                {m.chapters.map((ch, i) => (
                  <button
                    key={ch.id}
                    aria-pressed={selected?.id === ch.id}
                    onClick={() => {
                      setChapter(ch.id);
                      setPdf(false);
                    }}
                    className={`block w-full rounded-lg p-3 text-left text-sm ${selected?.id === ch.id && !pdf ? "bg-accent text-primary" : "hover:bg-muted"}`}
                  >
                    <span className="mr-2 text-xs opacity-50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {ch.title}
                  </button>
                ))}
                {m.pdf && (
                  <Button
                    className="mt-3 w-full"
                    variant="outline"
                    onClick={() => setPdf(true)}
                  >
                    <FileText size={16} />
                    Visualizar PDF
                  </Button>
                )}
              </nav>
              <article className="min-w-0 rounded-2xl border bg-card p-6">
                {pdf && m.pdf ? (
                  <iframe
                    title="PDF do Manual de Cultura"
                    src={m.pdf.url}
                    className="h-[560px] w-full rounded-xl border"
                  />
                ) : selected ? (
                  <>
                    <p className="text-xs uppercase tracking-wider text-primary">
                      Manual · v{m.version}
                    </p>
                    <h3 className="mb-7 mt-4 text-2xl font-semibold">
                      {selected.title}
                    </h3>
                    <Body blocks={selected.blocks} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Utilize o PDF para consultar este manual.
                  </p>
                )}
              </article>
            </div>
          )}
          {m.pdf && <FileCard file={m.pdf} />}
          <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
            {reading.error && (
              <p role="alert" className="mb-3 text-sm text-destructive">
                {reading.error}
              </p>
            )}
            {receipt ? (
              <>
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 size={18} />
                  Ciência registrada · manual v{receipt.manualVersion}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(receipt.at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  (Brasília) · origem: {receipt.source}. O mesmo registro
                  aparece em Cultura e Onboarding.
                </p>
              </>
            ) : (
              <>
                <label className="flex items-start gap-3 text-sm leading-6">
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  Li a versão {m.version} do manual disponibilizado.
                </label>
                <Button
                  className="mt-4"
                  disabled={!reading.ready || !checked}
                  onClick={() => reading.confirm(source, id)}
                >
                  Registrar ciência de leitura
                </Button>
              </>
            )}
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Ciência de leitura demonstrativa, não assinatura ou garantia de
              compreensão. Autoria e horário são locais. Nova versão do manual
              preserva as ciências anteriores, sem concluir etapas
              automaticamente.
            </p>
          </div>
          {reading.value.length > 0 && (
            <details className="rounded-xl border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Meu histórico de leitura ({reading.value.length})
              </summary>
              {reading.value.map((r) => (
                <p key={r.id} className="mt-3 text-xs text-muted-foreground">
                  Manual v{r.manualVersion} · {r.source} ·{" "}
                  {new Date(r.at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </p>
              ))}
            </details>
          )}
        </>
      )}
    </section>
  );
}
export function OnboardingCulture({
  scope,
  initial,
  ownProcess,
}: {
  scope: Scope;
  initial: CultureState;
  ownProcess: boolean;
}) {
  const local = useCulture(initial, scope);
  if (scope.contract === "PJ") return null;
  return (
    <div className="my-5">
      {ownProcess ? (
        <>
          <h3 className="mb-4 font-semibold">
            Manual de Cultura · leitura compartilhada
          </h3>
          {local.ready ? (
            <CultureManual
              state={local.state}
              scope={scope}
              source="Onboarding"
              compact
            />
          ) : (
            <p role="status">Carregando manual…</p>
          )}
        </>
      ) : (
        <div className="rounded-xl border p-4 text-sm">
          <Link className="text-primary underline" href="/cultura">
            Consultar Manual de Cultura
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            A ciência só pode ser registrada pelo próprio profissional. O
            acompanhamento atual não altera nem presume a leitura de outra
            pessoa.
          </p>
        </div>
      )}
    </div>
  );
}
