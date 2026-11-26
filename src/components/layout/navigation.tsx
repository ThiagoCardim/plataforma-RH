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
  operational = false,
  career = false,
  pdi = false,
  performance = false,
  recruitment = null,
}: {
  management: boolean;
  dashboard: boolean;
  operational?: boolean;
  career?: boolean;
  pdi?: boolean;
  performance?: boolean;
  recruitment?: "hr" | "director" | "leader" | null;
}) {
  const pathname = usePathname();
  const groups: { title: string; links: Item[]; separated?: boolean }[] = [
    {
      title: "Área geral",
      links: [{ href: "/home", label: "Início", icon: "home" }],
    },
    ...(management
      ? ["Pessoas", "Desempenho", "Políticas"].map((title) => ({
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
        }))
      : []),
    ...(!management
      ? [
          {
            title: "Pessoas",
            links: [
              {
                href: "/onboarding-offboarding",
                label: "Onboarding",
                icon: "journey" as const,
              },
              ...(operational
                ? [
                    {
                      href: "/offboarding",
                      label: "Offboarding",
                      icon: "journey" as const,
                    },
                  ]
                : []),
              ...(career
                ? [
                    {
                      href: "/plano-de-carreira",
                      label: "Plano de Carreira",
                      icon: "career" as const,
                    },
                  ]
                : []),
              {
                href: "/home-office",
                label: "Home Office",
                icon: "remote" as const,
              },
            ],
          },
          {
            title: "Desempenho",
            links: [
              ...(performance
                ? [
                    {
                      href: "/avaliacao-de-desempenho",
                      label: "Avaliação de Desempenho",
                      icon: "performance" as const,
                    },
                  ]
                : []),
              {
                href: "/hall-de-destaques",
                label: "Hall de Destaques",
                icon: "trophy" as const,
              },
              {
                href: "/youcon-academy",
                label: "YouCon Academy",
                icon: "academy" as const,
              },
              ...(pdi
                ? [{ href: "/pdi", label: "PDI", icon: "career" as const }]
                : []),
            ],
          },
          {
            title: "Políticas",
            links: moduleEntries
              .filter(
                ([id]) => id === "politicas-compliance" || id === "cultura",
              )
              .map(([id, entry]) => ({
                href: `/${id}`,
                label: entry.label,
                icon: entry.icon,
              })),
          },
        ]
      : []),
    ...(recruitment
      ? [
          {
            title: "Recrutamento e Seleção",
            links: (
              [
                ["processo-seletivo", "Processo Seletivo", "dashboard"],
                ["vagas", "Gestão de Vagas", "referrals"],
                ["admissao", "Admissão Digital", "journey"],
                ["talentos", "Banco de Talentos", "people"],
                ["indicadores", "Indicadores", "goals"],
                ["configuracoes", "Configurações", "policies"],
              ] as const
            )
              .filter(
                ([v]) =>
                  recruitment === "hr" ||
                  (recruitment === "director" &&
                    ["processo-seletivo", "vagas", "indicadores"].includes(
                      v,
                    )) ||
                  (recruitment === "leader" && v === "processo-seletivo"),
              )
              .map(([v, label, icon]) => ({
                href: `/recrutamento/${v}`,
                label,
                icon,
              })),
          },
        ]
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
