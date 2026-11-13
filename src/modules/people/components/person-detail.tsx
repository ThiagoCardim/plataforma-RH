"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  History,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePeopleDemo } from "./demo-provider";
import {
  BackToPeople,
  DetailGrid,
  MissingPerson,
  PersonAvatar,
  StatusBadge,
} from "./person-ui";
import {
  contractNames,
  currentEngagement,
  formatDate,
  peoplePath,
} from "../model";
const tabs = [
  "Resumo",
  "Dados cadastrais",
  "Histórico profissional",
  "Acesso",
] as const;
type Tab = (typeof tabs)[number];
export function PersonDetail({ personId }: { personId: string }) {
  const { people, organizationId, canEdit, lastSavedId } = usePeopleDemo();
  const [tab, setTab] = useState<Tab>("Resumo");
  const person = people.find(
    (p) => p.id === personId && p.organizationId === organizationId,
  );
  if (!person) return <MissingPerson />;
  const current = currentEngagement(person);
  const engagement = current ?? person.engagements.at(-1);
  const history = [...person.history].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const accessLabel = {
    none: "Sem conta de acesso",
    enabled: "Acesso People habilitado",
    revoked: "Acesso People bloqueado",
    exception: "Exceção administrativa documentada",
  }[person.access];
  return (
    <div className="space-y-6">
      <div>
        <BackToPeople />
        {lastSavedId === personId && (
          <p
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            Simulação concluída nesta sessão. Nenhum dado foi gravado
            definitivamente.
          </p>
        )}
        <header className="person-profile rounded-2xl border bg-card p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <PersonAvatar name={person.name} large />
              <div className="min-w-0">
                <p className="section-kicker mb-2">
                  {person.code} · Pessoa fictícia
                </p>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {person.name}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {engagement?.position || "Função não informada"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge person={person} />
              {canEdit && current && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`${peoplePath}/${person.id}/editar`}>
                    <Pencil aria-hidden="true" />
                    Editar pessoa
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3">
            {[
              [Building2, "Setor", engagement?.department],
              [
                UserRound,
                "Vínculo",
                engagement && contractNames[engagement.type],
              ],
              [
                CalendarDays,
                current ? "Início do vínculo vigente" : "Último início",
                formatDate(engagement?.start),
              ],
            ].map(([Icon, label, value]) => {
              const Symbol = Icon as typeof Building2;
              return (
                <div key={label as string} className="flex items-start gap-2.5">
                  <Symbol
                    size={16}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {label as string}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {value as string}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </header>
      </div>
      <nav aria-label="Seções da ficha" className="overflow-x-auto border-b">
        <div className="flex min-w-max gap-6">
          {tabs.map((name) => (
            <button
              type="button"
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
              className={`border-b-2 px-1 py-3 text-sm ${tab === name ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {name}
            </button>
          ))}
        </div>
      </nav>
      <section aria-label={tab} key={tab} className="people-panel">
        {tab === "Resumo" && (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="section-title">
                    {current
                      ? "Vínculo principal vigente"
                      : "Último vínculo profissional"}
                  </h2>
                  <Badge>{engagement && contractNames[engagement.type]}</Badge>
                </div>
                <DetailGrid
                  items={[
                    ["Cargo / função", engagement?.position],
                    ["Setor", engagement?.department],
                    ["Unidade", engagement?.unit],
                    [
                      engagement?.type === "pj"
                        ? "Responsável contratual"
                        : "Liderança",
                      engagement?.leader,
                    ],
                    ["Data de início", formatDate(engagement?.start)],
                    [
                      "Data de encerramento",
                      engagement?.end
                        ? formatDate(engagement.end)
                        : "Não encerrado",
                    ],
                  ]}
                />
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h2 className="section-title mb-4">
                  Uma trajetória, várias etapas.
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {person.engagements.length}{" "}
                  {person.engagements.length > 1
                    ? "vínculos registrados"
                    : "vínculo registrado"}{" "}
                  neste exemplo. Encerramentos e reingressos preservam a
                  trajetória anterior.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => setTab("Histórico profissional")}
                >
                  <History aria-hidden="true" />
                  Explorar histórico
                  <ArrowUpRight aria-hidden="true" />
                </Button>
              </div>
            </div>
            <aside className="rounded-xl border bg-card p-6">
              <ShieldCheck
                size={22}
                className="mb-4 text-primary"
                aria-hidden="true"
              />
              <h2 className="section-title">Pessoa ≠ conta</h2>
              <p className="mt-3 text-sm font-medium">{accessLabel}</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                O cadastro existe independentemente de login. Associar uma conta
                não concede papéis automaticamente.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setTab("Acesso")}
              >
                Ver situação de acesso
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </aside>
          </div>
        )}
        {tab === "Dados cadastrais" && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="section-title mb-6">Identificação e contato</h2>
              <DetailGrid
                items={[
                  ["Nome completo", person.name],
                  ["Nome de exibição", person.displayName],
                  ["Identificação interna", person.code],
                  ["E-mail profissional", person.email],
                  ["Telefone profissional", person.phone],
                ]}
              />
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h2 className="section-title mb-6">Informações do vínculo</h2>
              <DetailGrid
                items={[
                  ["Tipo", engagement && contractNames[engagement.type]],
                  ["Complemento contratual", engagement?.detail],
                  ["Situação", current ? "Vigente" : "Sem vínculo vigente"],
                ]}
              />
              <p className="mt-6 border-t pt-4 text-xs leading-6 text-muted-foreground">
                {engagement?.type === "pj"
                  ? "Prestação de serviço PJ. Sem atribuição de obrigações ou benefícios de empregado."
                  : engagement?.type === "intern"
                    ? "Relação de estágio. Termo, supervisão e demais complementos serão tratados na integração futura."
                    : "Dados trabalhistas completos não são coletados nesta demonstração."}
              </p>
            </div>
          </div>
        )}
        {tab === "Histórico profissional" && (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="section-title">Linha do tempo profissional</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Eventos ilustrativos, sem auditoria real. Os anteriores não são
                removidos pela edição simulada.
              </p>
              <ol className="mt-7 space-y-0">
                {history.map((event) => (
                  <li
                    key={event.id}
                    className="timeline-event relative ml-2 border-l pb-7 pl-7 last:border-transparent last:pb-0"
                  >
                    <span
                      className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-primary ring-4 ring-accent"
                      aria-hidden="true"
                    />
                    <p className="text-[11px] font-medium text-muted-foreground">
                      <time dateTime={event.date}>
                        {formatDate(event.date)}
                      </time>{" "}
                      ·{" "}
                      {event.origin === "fixture"
                        ? "Exemplo fictício"
                        : "Simulação local"}
                    </p>
                    <h3 className="mt-1.5 text-sm font-semibold">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {event.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="rounded-xl border bg-card p-5">
              <h2 className="section-title mb-5">Vínculos preservados</h2>
              <ul className="space-y-5">
                {[...person.engagements].reverse().map((e) => (
                  <li key={e.id}>
                    <p className="text-sm font-medium">
                      {contractNames[e.type]}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {formatDate(e.start)} →{" "}
                      {e.end ? formatDate(e.end) : "Em aberto"}
                    </p>
                    <p className="mt-1 text-xs">{e.position}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
        {tab === "Acesso" && (
          <div className="max-w-3xl rounded-xl border bg-card p-6">
            <h2 className="section-title mb-5">Situação de acesso · exemplo</h2>
            <Badge>{accessLabel}</Badge>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Ao encerrar um vínculo, o acesso deverá ser bloqueado somente na
              YouCon People. Exceções administrativas precisarão de
              justificativa e rastreabilidade.
            </p>
            <div className="mt-5 rounded-lg bg-muted p-4 text-xs leading-6">
              Esta tela apenas representa a regra aprovada. Nenhuma conta é
              criada, nenhuma sessão é revogada e nenhum acesso real é alterado.
              A conta e as sessões das outras aplicações são preservadas.
            </div>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              Solicitações cadastrais e aprovações serão implementadas depois:
              RH revisa; Diretoria poderá decidir excepcionalmente pedidos de
              profissionais do RH, sem autoaprovação. Exportações gerenciais
              também ficam para uma próxima etapa.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
