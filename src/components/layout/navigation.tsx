"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  const links = [
    { href: "/home", label: "Início", Icon: Home },
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
    <nav aria-label="Navegação principal">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
        Seu espaço
      </p>
      <div className="space-y-1">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
              pathname === href
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon
              size={18}
              className={pathname === href ? "text-orange-400" : ""}
            />
            {label}
          </Link>
        ))}
      </div>
      <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
        Em construção
      </p>
      <div className="space-y-1">
        {[
          { label: "Comunicação", Icon: MessageSquare },
          { label: "Desenvolvimento", Icon: TrendingUp },
          { label: "Academy", Icon: GraduationCap },
          { label: "Cultura", Icon: Heart },
        ].map(({ label, Icon }) => (
          <span
            key={label}
            className="flex items-center gap-3 px-3 py-3 text-sm text-white/35"
          >
            <Icon size={18} />
            {label}
            <span className="ml-auto text-[9px] uppercase">Em breve</span>
          </span>
        ))}
      </div>
    </nav>
  );
}
