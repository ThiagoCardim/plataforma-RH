import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";
import { getSupabaseConfig } from "@/lib/env";
export const dynamic = "force-dynamic";
export const metadata = { title: "Acesso" };
export default function LoginPage() {
  const configured = !!getSupabaseConfig();
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-sidebar p-8 text-white md:p-12 lg:p-16">
        <Brand dark />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-1/4 size-[480px] rotate-[-25deg] rounded-[100px] border-[65px] border-white/[0.03]"
        />
        <div className="relative my-14 max-w-lg lg:my-24">
          <span className="mb-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-orange-400">
            <span className="size-1.5 rounded-full bg-orange-400" />
            Gente que constrói
          </span>
          <h1 className="text-4xl font-medium leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">
            Grandes projetos
            <br />
            começam com
            <br />
            <span className="text-orange-400">pessoas.</span>
          </h1>
          <p className="mt-7 max-w-sm text-sm leading-7 text-white/60">
            Um espaço para conectar nossa equipe, desenvolver talentos e
            construir o futuro da YouCon.
          </p>
        </div>
        <div className="relative flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/50">
          <span>Nossa gente. Nossa construção.</span>
          <ArrowUpRight size={18} />
        </div>
      </section>
      <section className="flex flex-col items-center justify-center bg-card px-6 py-12 md:px-12">
        <div className="w-full max-w-[390px]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-primary">
            Bem-vindo à YouCon People
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Seu próximo passo
            <br />
            começa aqui.
          </h2>
          <p className="mb-8 mt-4 text-sm leading-6 text-muted-foreground">
            Acesse seu espaço e faça parte dessa construção.
          </p>
          {!configured && (
            <div
              role="status"
              className="mb-6 rounded-lg border border-orange-200 bg-accent p-4 text-sm leading-6"
            >
              <strong className="block text-accent-foreground">
                Acesso em preparação
              </strong>
              <span className="text-muted-foreground">
                A autenticação ainda não foi configurada. O login será liberado
                após a conexão com o Supabase.
              </span>
            </div>
          )}
          <LoginForm configured={configured} />
          <div className="mt-10 flex items-center justify-center gap-2 border-t pt-6 text-xs text-muted-foreground">
            <ShieldCheck size={15} />
            Ambiente de acesso restrito
          </div>
        </div>
        <p className="mt-12 text-[11px] text-muted-foreground">
          YouCon People · Fundação técnica · Etapa 01
        </p>
      </section>
    </main>
  );
}
