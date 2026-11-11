import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  UserRound,
  Users,
  ChartNoAxesCombined,
  MessageSquare,
  Layers3,
} from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import {
  contractLabels,
  futureModules,
  hasPermission,
  roleLabels,
} from "@/modules/access/policy";
import { personalName } from "@/lib/presentation/display-name";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export const metadata = { title: "Início" };
export default async function Home() {
  const access = await requirePermission("home.view");
  const name = personalName(access.displayName);
  return (
    <div className="home-composition space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker mb-2">Seu ponto de conexão</p>
          <h1 className="page-title">
            {name ? `Olá, ${name.split(" ")[0]}.` : "Bom ter você aqui."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Um espaço para pessoas que constroem juntas.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="size-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          {access.organization.name}
        </span>
      </div>
      <section
        className="institutional-strip relative isolate overflow-hidden rounded-2xl bg-sidebar px-6 py-6 text-white sm:px-8"
        aria-label="Nossa essência"
      >
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-400">
              A essência YouCon
            </p>
            <h2 className="text-2xl font-medium leading-tight tracking-tight sm:text-[28px]">
              Grandes projetos começam
              <br className="hidden sm:block" /> com{" "}
              <span className="text-orange-400">pessoas.</span>
            </h2>
          </div>
          <p className="max-w-52 text-xs leading-5 text-white/65">
            Conexão, colaboração e espaço para crescer. Essa é a nossa
            construção.
          </p>
        </div>
        <div className="architectural-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.65fr)]">
        <div className="space-y-6">
          <section aria-labelledby="quick-access-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="quick-access-title" className="section-title">
                Acessos rápidos
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Seu dia a dia
              </span>
            </div>
            <Card className="overflow-hidden divide-y">
              <a href="#meu-espaco" className="access-row group">
                <span className="access-icon">
                  <UserRound size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    Meu Espaço
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Seu vínculo e seus acessos, em um só lugar.
                  </span>
                </span>
                <ArrowRight
                  size={18}
                  className="access-arrow"
                  aria-hidden="true"
                />
              </a>
              {hasPermission(access.permissions, "people.management.view") && (
                <Link href="/gente-gestao" className="access-row group">
                  <span className="access-icon">
                    <Users size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Gente & Gestão
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Espaço gerencial em preparação.
                    </span>
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="access-arrow"
                    aria-hidden="true"
                  />
                </Link>
              )}
              {hasPermission(access.permissions, "people.dashboard.view") && (
                <Link
                  href="/gente-gestao/dashboard"
                  className="access-row group"
                >
                  <span className="access-icon">
                    <ChartNoAxesCombined size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Dashboard gerencial
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Visão gerencial em preparação.
                    </span>
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="access-arrow"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </Card>
          </section>
          <section
            className="communication-note flex items-start gap-4 border-l-2 border-primary/50 py-1 pl-5"
            aria-labelledby="communication-title"
          >
            <MessageSquare
              size={19}
              className="mt-0.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="communication-title" className="text-sm font-semibold">
                  Por dentro da YouCon
                </h2>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Em breve
                </span>
              </div>
              <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                O módulo de comunicação ainda não está disponível. As novidades
                terão seu lugar aqui.
              </p>
            </div>
          </section>
        </div>
        <Card
          id="meu-espaco"
          className="profile-card scroll-mt-6 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="section-title">Meu Espaço</h2>
            <UserRound
              size={17}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <dl className="space-y-4 p-5 text-sm">
            <div>
              <dt className="profile-label">Organização</dt>
              <dd className="mt-1.5 font-medium">{access.organization.name}</dd>
            </div>
            <div>
              <dt className="profile-label">Vínculo contratual</dt>
              <dd className="mt-1.5 font-medium">
                {contractLabels[access.membership.contract_type]}
              </dd>
            </div>
            <div>
              <dt className="profile-label">Papéis de acesso</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {access.roles.length
                  ? access.roles.map((role) => (
                      <Badge
                        key={role}
                        className="border-transparent bg-accent text-accent-foreground"
                      >
                        {roleLabels[role]}
                      </Badge>
                    ))
                  : "Sem papel atribuído"}
              </dd>
            </div>
          </dl>
          <p className="border-t bg-background/60 px-5 py-3 text-[11px] leading-5 text-muted-foreground">
            Informações vinculadas à sua organização.
          </p>
        </Card>
      </div>
      <section
        className="future-strip flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5"
        aria-label="Próximos espaços"
      >
        <span className="inline-flex items-center gap-2 text-xs font-medium">
          <Layers3
            size={15}
            className="text-muted-foreground"
            aria-hidden="true"
          />
          Em breve
        </span>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {futureModules
            .filter((module) => module.icon !== "communication")
            .map((module) => (
              <li key={module.name} className="text-xs text-muted-foreground">
                {module.name}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
