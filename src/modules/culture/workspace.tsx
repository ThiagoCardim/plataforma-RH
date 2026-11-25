"use client";
import { useEffect, useState } from "react";
import { BookOpen, History, Eye, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "../onboarding/components";
import { Tabs, Notice } from "../performance/components";
import { type PerformanceState } from "../performance/model";
import { type Scope, admin } from "../career/model";
import { loadLocalDemo } from "../local-demo/use-local-demo";
import {
  type CultureState,
  type CultureContent,
  type Version,
  type CulturalRecognition,
  latest,
  restoreVersion,
  culturalRecognitions,
} from "./model";
import { useCulture } from "./store";
import { CultureLanding } from "./landing";
import { CultureManual } from "./manual";
import { CultureEditor } from "./editor";
import "./culture.css";
export function CultureWorkspace({
  scope,
  initial,
  initialRecognitions,
}: {
  scope: Scope;
  initial: CultureState;
  initialRecognitions: CulturalRecognition[];
}) {
  const local = useCulture(initial, scope),
    [tab, setTab] = useState("Nossa Cultura"),
    [editEpoch, setEditEpoch] = useState(0),
    [preview, setPreview] = useState<CultureContent | null>(null),
    [version, setVersion] = useState<Version | null>(null),
    [recognitions, setRecognitions] = useState(initialRecognitions);
  const v = latest(local.state);
  useEffect(() => {
    let active = true;
    const key = `${admin(scope) ? "performance-hall-v1" : "published-hall-v1"}:${scope.key}`;
    loadLocalDemo<PerformanceState>(key)
      .then((s) => {
        if (active && s) setRecognitions(culturalRecognitions(s, scope));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [scope]);
  if (!local.ready) return <p role="status">Preparando a Cultura YouCon…</p>;
  return (
    <div className="culture-shell min-w-0 space-y-6">
      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 text-xs leading-6">
        <strong>Estrutura institucional em demonstração local.</strong> O manual
        oficial não está entre os anexos disponíveis. Textos pendentes,
        fotografias e marcos estão sinalizados para curadoria; nenhum resultado
        ou relato real foi presumido. Alterações e ciências ficam neste
        navegador, conta, organização e perfil, sem sincronização ou
        notificações reais.
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">
            Políticas / Pertencimento e propósito
          </p>
          <h1 className="page-title mt-3">Cultura</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-600" />
          Versão publicada {v?.number ?? "—"}
          {admin(scope) && local.state.draft && (
            <span className="rounded-full bg-orange-100 px-3 py-2 text-orange-900">
              Rascunho salvo
            </span>
          )}
        </div>
      </header>
      <Tabs
        label="Abas da Cultura"
        items={[
          "Nossa Cultura",
          "Manual de Cultura",
          ...(admin(scope) ? ["Gerenciar Cultura"] : []),
        ]}
        value={tab}
        change={setTab}
      />
      <Notice error={local.error} notice={local.notice} />
      {tab === "Nossa Cultura" && v && (
        <CultureLanding
          content={v.content}
          scope={scope}
          recognitions={recognitions}
          manual={() => setTab("Manual de Cultura")}
        />
      )}
      {tab === "Manual de Cultura" && (
        <CultureManual
          key={v?.content.manual.version}
          state={local.state}
          scope={scope}
        />
      )}
      {tab === "Gerenciar Cultura" && admin(scope) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
            <div>
              <p className="font-semibold">
                Uma cultura viva, com história preservada
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Publicações são versionadas. Consulte e recupere conteúdos como
                rascunho.
              </p>
            </div>
            <Button variant="outline" onClick={() => setVersion(v ?? null)}>
              <History size={16} />
              Consultar versões
            </Button>
          </div>
          <CultureEditor
            key={`${v?.id}:${editEpoch}`}
            state={local.state}
            scope={scope}
            act={local.act}
            preview={setPreview}
          />
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Histórico de publicações</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[...local.state.versions].reverse().map((x) => (
                <button
                  key={x.id}
                  onClick={() => setVersion(x)}
                  className="rounded-xl border p-4 text-left hover:bg-accent"
                >
                  <span className="text-xs font-semibold text-primary">
                    VERSÃO {x.number} · manual v{x.content.manual.version}
                  </span>
                  <p className="mt-3 text-sm">{x.note}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {x.by} ·{" "}
                    {new Date(x.at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      {preview && admin(scope) && (
        <Modal
          title="Prévia editorial privada da Cultura"
          close={() => setPreview(null)}
        >
          <p className="mb-5 rounded-xl bg-accent p-4 text-sm leading-6">
            Conteúdo de edição, sem publicação ou mudança de perfil. A
            visibilidade final respeita o vínculo autenticado e as regras de
            parceria.
          </p>
          <CultureLanding
            content={preview}
            scope={scope}
            editorial
            recognitions={recognitions}
            manual={() => setPreview(null)}
          />
        </Modal>
      )}
      {version && admin(scope) && (
        <Modal
          title={`Publicação cultural v${version.number}`}
          close={() => setVersion(null)}
        >
          <div className="space-y-5">
            <p className="text-sm leading-7">{version.note}</p>
            <p className="text-xs text-muted-foreground">
              {version.by} · manual v{version.content.manual.version} · versão
              preservada
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPreview(version.content);
                  setVersion(null);
                }}
              >
                <Eye size={16} />
                Visualizar versão
              </Button>
              <Button
                onClick={() => {
                  if (
                    local.act(
                      (s) => restoreVersion(s, scope, version.id),
                      "Versão recuperada como rascunho. Publicação separada necessária.",
                    )
                  ) {
                    setVersion(null);
                    setEditEpoch((n) => n + 1);
                    setTab("Gerenciar Cultura");
                  }
                }}
              >
                Recuperar como rascunho
              </Button>
            </div>
            {version.content.manual.pdf && (
              <a
                href={version.content.manual.pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary underline"
              >
                <BookOpen size={16} />
                Consultar PDF desta versão <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
