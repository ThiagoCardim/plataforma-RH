"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { routeLabel } from "@/modules/navigation/catalog";
export function Breadcrumbs() {
  const pathname = usePathname();
  const personPage = pathname.startsWith("/gente-gestao/pessoas/");
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
        {personPage && (
          <>
            <li>
              <Link href="/gente-gestao" className="hover:text-primary">
                Colaboradores
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={12} />
            </li>
          </>
        )}
        <li aria-current="page" className="font-medium text-foreground">
          {routeLabel(pathname)}
        </li>
      </ol>
    </nav>
  );
}
