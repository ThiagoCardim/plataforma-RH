import { Building2, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { SidebarFrame } from "./sidebar-frame";
import { Breadcrumbs } from "./breadcrumbs";
import { contractLabels } from "@/modules/access/policy";
import { Navigation } from "./navigation";
import { logout, switchOrganization } from "@/components/auth/actions";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/fields";
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
    <SidebarFrame
      sidebar={
        <>
          <div className="sidebar-brand px-3">
            <Brand dark />
          </div>
          <div className="sidebar-organization my-7 flex items-center gap-3 rounded-xl border border-white/15 px-3 py-3 text-white">
            <Building2 size={18} className="shrink-0 text-white/70" />
            <div className="sidebar-label min-w-0">
              <p className="truncate text-xs font-medium">
                {access.organization.name}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Seu ambiente de trabalho
              </p>
            </div>
          </div>
          {navigation}
          <div className="sidebar-label mt-auto border-t border-white/15 px-3 pt-6 text-xs leading-5 text-white/60">
            Pessoas no centro.
            <br />O futuro em construção.
          </div>
        </>
      }
      header={
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <Breadcrumbs />
          <Disclosure className="relative user-menu">
            <summary
              aria-label="Abrir menu do usuário"
              className="flex list-none items-center gap-3 rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {access.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-44 truncate text-xs font-semibold">
                  {access.displayName}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  Papéis:{" "}
                  {access.roles.map((role) => roleLabels[role]).join(" · ") ||
                    "Sem papel atribuído"}
                </span>
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </summary>
            <div className="absolute right-0 top-14 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-xl border bg-card p-4 shadow-lg">
              <p className="break-words text-sm font-semibold">
                {access.displayName}
              </p>
              <dl className="my-4 space-y-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Vínculo contratual</dt>
                  <dd className="mt-1 font-medium">
                    {contractLabels[access.membership.contract_type]}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Papéis de acesso</dt>
                  <dd className="mt-1 font-medium">
                    {access.roles.map((role) => roleLabels[role]).join(" · ") ||
                      "Sem papel atribuído"}
                  </dd>
                </div>
              </dl>
              <p className="mb-3 break-words text-xs text-muted-foreground">
                {access.user.email}
              </p>
              {access.memberships.length > 1 && (
                <form action={switchOrganization} className="mb-4 space-y-2">
                  <label htmlFor="organization" className="text-xs">
                    Organização
                  </label>
                  <Select
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
                  </Select>
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
          </Disclosure>
        </div>
      }
    >
      <main
        id="main-content"
        className="mx-auto max-w-[1440px] min-w-0 p-5 md:p-10"
      >
        {children}
      </main>
      <footer className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t py-6 text-[10px] text-muted-foreground md:mx-10">
        <span>YouCon People · Construindo nossa jornada</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={12} />
          Ambiente restrito
        </span>
      </footer>
    </SidebarFrame>
  );
}
