import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  UserRound,
  ChartNoAxesCombined,
  GraduationCap,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import {
  contractLabels,
  futureModules,
  hasPermission,
  roleLabels,
} from "@/modules/access/policy";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export const metadata = { title: "Início" };
const icons = {
  communication: MessageSquare,
  development: TrendingUp,
  academy: GraduationCap,
  culture: Heart,
};
export default async function Home() {
  const access = await requirePermission("home.view");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Seu dia, suas conexões"
        title={`Olá, ${access.displayName.split(" ")[0]}.`}
        description="Bem-vindo ao seu espaço de conexão, desenvolvimento e crescimento."
      >
        <Badge>{access.organization.name}</Badge>
      </PageHeader>
      <section className="relative overflow-hidden rounded-2xl bg-sidebar p-6 text-white md:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 size-96 rotate-12 rounded-[90px] border-[50px] border-white/[0.03]"
        />
        <div className="relative max-w-lg">
          <span className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-400">
            <Sparkles size={14} />
            Juntos, construímos o futuro
          </span>
          <h2 className="text-2xl font-medium leading-tight tracking-tight md:text-3xl">
            Pessoas que conectam.
            <br />
            Projetos que transformam.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
            Estamos construindo um espaço para cuidar da nossa gente e criar
            novas possibilidades, juntos.
          </p>
          <a
            href="#seu-espaco"
            className="mt-5 inline-flex items-center gap-3 text-xs font-semibold text-orange-400"
          >
            Conheça seu espaço
            <ArrowRight size={16} />
          </a>
        </div>
        <span className="absolute bottom-8 right-10 hidden text-[10px] uppercase tracking-[0.3em] text-white/30 md:block">
          O futuro se constrói com gente
        </span>
      </section>
      <section aria-labelledby="quick-access-title">
        <div className="mb-4">
          <h2 id="quick-access-title" className="text-lg font-semibold">
            Acessos rápidos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Os espaços disponíveis para você.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="#meu-espaco"
            className="group rounded-2xl border bg-card p-5 shadow-[var(--shadow-surface)] transition-colors hover:border-primary/50"
          >
            <UserRound
              className="mb-5 text-primary"
              size={22}
              aria-hidden="true"
            />
            <span className="flex items-center justify-between text-sm font-semibold">
              Meu Espaço
              <ArrowUpRight size={17} aria-hidden="true" />
            </span>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Consulte seu vínculo e seus acessos.
            </p>
          </a>
          {hasPermission(access.permissions, "people.management.view") && (
            <Link
              href="/gente-gestao"
              className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-surface)] transition-colors hover:border-primary/50"
            >
              <Users
                className="mb-5 text-primary"
                size={22}
                aria-hidden="true"
              />
              <span className="flex items-center justify-between text-sm font-semibold">
                Gente & Gestão
                <ArrowUpRight size={17} aria-hidden="true" />
              </span>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Conheça o espaço de gestão de pessoas.
              </p>
              <Badge className="mt-3">Módulo em preparação</Badge>
            </Link>
          )}
          {hasPermission(access.permissions, "people.dashboard.view") && (
            <Link
              href="/gente-gestao/dashboard"
              className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-surface)] transition-colors hover:border-primary/50"
            >
              <ChartNoAxesCombined
                className="mb-5 text-primary"
                size={22}
                aria-hidden="true"
              />
              <span className="flex items-center justify-between text-sm font-semibold">
                Dashboard gerencial
                <ArrowUpRight size={17} aria-hidden="true" />
              </span>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                O futuro espaço de visão gerencial.
              </p>
              <Badge className="mt-3">Módulo em preparação</Badge>
            </Link>
          )}
        </div>
      </section>
      <section
        id="seu-espaco"
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Novas possibilidades</h2>
            <span className="text-xs text-muted-foreground">Em construção</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {futureModules.map((module) => {
              const Icon = icons[module.icon];
              return (
                <Card key={module.name} className="p-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-muted p-2.5">
                      <Icon size={20} className="text-muted-foreground" />
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      Em breve
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold">{module.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {module.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="space-y-5">
          <Card id="meu-espaco" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Meu Espaço</CardTitle>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Seu vínculo e seus acessos atuais.
              </p>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-xs">
                <div>
                  <dt className="mb-1 text-muted-foreground">Organização</dt>
                  <dd className="font-medium">{access.organization.name}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-muted-foreground">
                    Vínculo contratual
                  </dt>
                  <dd className="font-medium">
                    {contractLabels[access.membership.contract_type]}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-muted-foreground">
                    Papéis de acesso
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {access.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-md bg-muted px-2 py-1"
                      >
                        {roleLabels[role]}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center gap-2 border-t pt-4 text-[10px] text-muted-foreground">
                <ShieldCheck size={14} />
                Permissões vinculadas à sua organização
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <UserRound size={22} className="mb-4 text-primary" />
              <h2 className="text-sm font-semibold">Seu espaço vai crescer</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Novas informações pessoais estarão disponíveis aqui em etapas
                futuras. Nenhum cadastro adicional está disponível no momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <section aria-labelledby="communication-title" className="space-y-4">
        <h2 id="communication-title" className="text-lg font-semibold">
          Comunicação interna
        </h2>
        <EmptyState
          icon={MessageSquare}
          title="Um lugar para ficar por dentro"
          description="O módulo de comunicação ainda não está disponível. Quando estiver pronto, as novidades da YouCon terão espaço aqui."
        />
      </section>
    </div>
  );
}
