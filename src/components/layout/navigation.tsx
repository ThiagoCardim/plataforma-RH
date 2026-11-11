"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Home,
  Users,
  ChartNoAxesCombined,
  MessageSquare,
  GraduationCap,
  Heart,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
export function Navigation({
  management,
  dashboard,
}: {
  management: boolean;
  dashboard: boolean;
}) {
  const pathname = usePathname();
  const general = [{ href: "/home", label: "Início", Icon: Home }];
  const managerial = [
    ...(management
      ? [{ href: "/gente-gestao", label: "Gente & Gestão", Icon: Users }]
      : []),
    ...(dashboard
      ? [
          {
            href: "/gente-gestao/dashboard",
            label: "Dashboard gerencial",
            Icon: ChartNoAxesCombined,
          },
        ]
      : []),
  ];
  return (
    <nav
      aria-label="Navegação principal"
      className="min-h-0 flex-1 overflow-y-auto pb-3 sidebar-scroll"
    >
      {[
        { title: "Área geral", links: general },
        { title: "Gestão de pessoas", links: managerial },
      ]
        .filter((group) => group.links.length)
        .map((group) => (
          <div key={group.title} className="mb-5">
            <p className="sidebar-label mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.links.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-label={label}
                  aria-current={pathname === href ? "page" : undefined}
                  className={cn(
                    "sidebar-link flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[13px] transition-colors",
                    pathname === href
                      ? "nav-active border-white/10 bg-white/[0.07] font-medium text-white"
                      : "text-white/75 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon
                    size={19}
                    aria-hidden="true"
                    className={cn(
                      "shrink-0",
                      pathname === href && "text-orange-400",
                    )}
                  />
                  <span className="sidebar-label">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      <details className="future-navigation border-t border-white/10 pt-4">
        <summary className="sidebar-label flex list-none items-center justify-between rounded-md px-3 py-2 text-[11px] font-medium text-white/65">
          <span>Próximos espaços · Em breve</span>
          <ChevronDown size={13} aria-hidden="true" />
        </summary>
        <div className="space-y-1">
          {[
            { label: "Comunicação", Icon: MessageSquare },
            { label: "Desenvolvimento", Icon: TrendingUp },
            { label: "YouCon Academy", Icon: GraduationCap },
            { label: "Cultura", Icon: Heart },
          ].map(({ label, Icon }) => (
            <span
              key={label}
              title={`${label} · Em breve`}
              className="sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65"
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className="sidebar-label">{label}</span>
            </span>
          ))}
        </div>
      </details>
    </nav>
  );
}
