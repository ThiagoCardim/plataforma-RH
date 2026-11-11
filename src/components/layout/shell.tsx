import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Navigation } from "./navigation";
import { logout, switchOrganization } from "@/components/auth/actions";
import { Button } from "@/components/ui/button";
import { hasPermission, roleLabels } from "@/modules/access/policy";
import type { getAccess } from "@/modules/access/server";
type Access = Awaited<ReturnType<typeof getAccess>>;
export function Shell({
  access,
  children,
}: {
  access: Access;
  children: React.ReactNode;
}) {
  const navigation = (
    <Navigation
      management={hasPermission(access.permissions, "people.management.view")}
      dashboard={hasPermission(access.permissions, "people.dashboard.view")}
    />
  );
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar px-5 py-8 lg:flex">
        <div className="px-3">
          <Brand dark />
        </div>
        <div className="my-8 flex items-center gap-3 rounded-lg border border-white/10 px-3 py-3 text-white">
          <Building2 size={18} className="text-white/50" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">
              {access.organization.name}
            </p>
            <p className="mt-1 text-[10px] text-white/40">
              Seu ambiente de trabalho
            </p>
          </div>
        </div>
        {navigation}
        <div className="mt-auto border-t border-white/10 px-3 pt-6 text-[10px] leading-5 text-white/40">
          Pessoas no centro.
          <br />O futuro em construção.
        </div>
      </aside>
      <header className="flex min-h-20 items-center justify-between gap-4 border-b bg-card px-5 md:px-10">
        <div className="flex items-center gap-3">
          <details className="relative lg:hidden">
            <summary
              aria-label="Abrir navegação"
              className="list-none rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu size={22} />
            </summary>
            <div className="absolute left-0 top-12 z-30 w-64 rounded-xl bg-sidebar p-5 shadow-xl">
              {navigation}
            </div>
          </details>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Seu espaço / <span className="text-foreground">YouCon People</span>
          </span>
          <span className="text-sm font-semibold sm:hidden">YouCon People</span>
        </div>
        <details className="relative">
          <summary className="flex list-none items-center gap-3 rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {access.displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-left md:block">
              <span className="block max-w-44 truncate text-xs font-semibold">
                {access.displayName}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {access.roles.map((role) => roleLabels[role]).join(" · ") ||
                  "Sem papel atribuído"}
              </span>
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </summary>
          <div className="absolute right-0 top-14 z-30 w-72 rounded-xl border bg-card p-4 shadow-lg">
            <p className="mb-3 break-words text-xs text-muted-foreground">
              {access.user.email}
            </p>
            {access.memberships.length > 1 && (
              <form action={switchOrganization} className="mb-4 space-y-2">
                <label htmlFor="organization" className="text-xs">
                  Organização
                </label>
                <select
                  id="organization"
                  name="organization_id"
                  defaultValue={access.organization.id}
                  className="w-full rounded-lg border p-2 text-xs"
                >
                  {access.memberships.map((m, i) => (
                    <option key={m.id} value={m.organization_id}>
                      {m.organization_id === access.organization.id
                        ? access.organization.name
                        : `Organização ${i + 1} · ${m.organization_id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" type="submit">
                  Trocar organização
                </Button>
              </form>
            )}
            <form action={logout}>
              <Button variant="outline" className="w-full" type="submit">
                <LogOut />
                Sair da plataforma
              </Button>
            </form>
          </div>
        </details>
      </header>
      <main id="main-content" className="mx-auto max-w-[1440px] p-5 md:p-10">
        {children}
      </main>
      <footer className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t py-6 text-[10px] text-muted-foreground md:mx-10">
        <span>YouCon People · Construindo nossa jornada</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={12} />
          Ambiente restrito · Etapa 01
        </span>
      </footer>
    </div>
  );
}
