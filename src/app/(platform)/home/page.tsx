import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
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
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Conexão · Desenvolvimento · Cultura
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Olá, {access.displayName.split(" ")[0]}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bem-vindo ao seu espaço na YouCon.
          </p>
        </div>
        <span className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          {access.organization.name}
        </span>
      </div>
      <section className="relative overflow-hidden rounded-2xl bg-sidebar p-7 text-white md:p-10">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 size-96 rotate-12 rounded-[90px] border-[50px] border-white/[0.03]"
        />
        <div className="relative max-w-lg">
          <span className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-400">
            <Sparkles size={14} />
            Nossa jornada está começando
          </span>
          <h2 className="text-3xl font-medium leading-tight tracking-tight md:text-4xl">
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
            className="mt-7 inline-flex items-center gap-3 text-xs font-semibold text-orange-400"
          >
            Conheça seu espaço
            <ArrowRight size={16} />
          </a>
        </div>
        <span className="absolute bottom-8 right-10 hidden text-[10px] uppercase tracking-[0.3em] text-white/30 md:block">
          O futuro se constrói com gente
        </span>
      </section>
      <section id="seu-espaco" className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Seu espaço, suas possibilidades
            </h2>
            <span className="text-xs text-muted-foreground">Em construção</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {futureModules.map((module) => {
              const Icon = icons[module.icon];
              return (
                <Card key={module.name} className="p-5">
                  <div className="mb-5 flex items-center justify-between">
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
          {hasPermission(access.permissions, "people.management.view") && (
            <Link
              href="/gente-gestao"
              className="mt-4 flex items-center gap-4 rounded-xl border border-orange-200 bg-accent p-5"
            >
              <Users className="text-primary" size={22} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold">
                  Base de Gente & Gestão
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Espaço exclusivo para RH e Diretoria.
                </p>
              </div>
              <ArrowUpRight className="text-primary" size={18} />
            </Link>
          )}
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Seu vínculo com a YouCon</CardTitle>
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
              <BookOpen size={22} className="mb-4 text-primary" />
              <h2 className="text-sm font-semibold">
                Uma construção em etapas
              </h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Este é o início da YouCon People. Novos espaços serão
                disponibilizados conforme a evolução da plataforma.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <Card className="flex flex-col items-center p-8 text-center">
        <MessageSquare size={25} className="mb-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Nenhuma comunicação publicada</h2>
        <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
          Quando o módulo de comunicação estiver disponível, você encontrará as
          novidades da YouCon aqui.
        </p>
      </Card>
      {hasPermission(access.permissions, "people.dashboard.view") && (
        <Button asChild variant="outline">
          <Link href="/gente-gestao/dashboard">
            Espaço do dashboard gerencial
            <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  );
}
