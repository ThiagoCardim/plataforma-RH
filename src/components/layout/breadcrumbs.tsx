"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
export function Breadcrumbs() {
  const pathname = usePathname();
  const dashboard = pathname === "/gente-gestao/dashboard";
  const management = pathname.startsWith("/gente-gestao");
  const people = pathname.startsWith("/gente-gestao/pessoas");
  const personPage = people && pathname !== "/gente-gestao/pessoas";
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
        {(dashboard || personPage) && (
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
            : people
              ? pathname.endsWith("/nova")
                ? "Cadastrar pessoa"
                : pathname.endsWith("/editar")
                  ? "Editar pessoa"
                  : personPage
                    ? "Ficha da pessoa"
                    : "Pessoas"
              : management
                ? "Gente & Gestão"
                : "Início"}
        </li>
      </ol>
    </nav>
  );
}
