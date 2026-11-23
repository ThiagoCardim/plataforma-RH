"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  moduleEntries,
  isNavigationActive,
} from "@/modules/navigation/catalog";
import { navigationIcons } from "@/modules/navigation/icons";
type Item = { href: string; label: string; icon: keyof typeof navigationIcons };
export function Navigation({
  management,
  dashboard,
}: {
  management: boolean;
  dashboard: boolean;
}) {
  const pathname = usePathname();
  const groups: { title: string; links: Item[]; separated?: boolean }[] = [
    {
      title: "Área geral",
      links: [{ href: "/home", label: "Início", icon: "home" }],
    },
    ...(management
      ? ["Pessoas", "Desempenho e Desenvolvimento", "Políticas"].map(
          (title) => ({
            title,
            links: [
              ...(title === "Pessoas"
                ? [
                    {
                      href: "/gente-gestao",
                      label: "Colaboradores",
                      icon: "people" as const,
                    },
                  ]
                : []),
              ...moduleEntries
                .filter(([, module]) => module.group === title)
                .map(([id, module]) => ({
                  href: `/${id}`,
                  label: module.label,
                  icon: module.icon,
                })),
            ],
          }),
        )
      : []),
    ...(dashboard
      ? [
          {
            title: "Visão gerencial",
            separated: true,
            links: [
              {
                href: "/gente-gestao/dashboard",
                label: "Dashboard Gerencial",
                icon: "dashboard" as const,
              },
            ],
          },
        ]
      : []),
  ];
  return (
    <nav
      aria-label="Navegação principal"
      className="min-h-0 flex-1 overflow-y-auto pb-3 sidebar-scroll"
    >
      {groups.map((group) => (
        <div
          key={group.title}
          className={cn(
            "mb-4",
            group.separated && "border-t border-white/10 pt-4",
          )}
        >
          <p className="sidebar-label mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.links.map(({ href, label, icon }) => {
              const Icon = navigationIcons[icon];
              const active = isNavigationActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "sidebar-link flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[13px] transition-colors",
                    active
                      ? "nav-active border-white/10 bg-white/[0.07] font-medium text-white"
                      : "text-white/75 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon
                    size={19}
                    aria-hidden="true"
                    className={cn("shrink-0", active && "text-orange-400")}
                  />
                  <span className="sidebar-label min-w-0 leading-5">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
