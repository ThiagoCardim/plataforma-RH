"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
export function Breadcrumbs() {
  const pathname = usePathname();
  const dashboard = pathname === "/gente-gestao/dashboard";
  const management = pathname === "/gente-gestao";
  return (
    <nav
      aria-label="Localização"
      className="min-w-0 text-xs text-muted-foreground"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/home" className="hover:text-primary">
            YouCon People
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight size={12} />
        </li>
        {dashboard && (
          <>
            <li>
              <Link href="/gente-gestao" className="hover:text-primary">
                Gente & Gestão
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={12} />
            </li>
          </>
        )}
        <li aria-current="page" className="font-medium text-foreground">
          {dashboard
            ? "Dashboard gerencial"
            : management
              ? "Gente & Gestão"
              : "Início"}
        </li>
      </ol>
    </nav>
  );
}
