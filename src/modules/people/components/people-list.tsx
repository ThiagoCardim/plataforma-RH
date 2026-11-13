"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Search,
  Users,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/fields";
import { Table } from "@/components/ui/table";
import { usePeopleDemo } from "./demo-provider";
import { PersonAvatar, StatusBadge } from "./person-ui";
import {
  contractNames,
  currentEngagement,
  departments,
  filterPeople,
  formatDate,
  peoplePath,
} from "../model";
const PAGE_SIZE = 8;
export function PeopleList() {
  const { people, organizationId, canEdit } = usePeopleDemo();
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    type: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const scoped = people.filter((p) => p.organizationId === organizationId);
  const filtered = filterPeople(people, organizationId, filters);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const active = scoped.filter((p) => currentEngagement(p));
  function change(field: keyof typeof filters, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }
  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="section-kicker mb-3">Gente & Gestão / Base central</p>
          <h1 className="page-title">Pessoas que constroem.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Uma visão próxima de cada pessoa e de sua trajetória na organização.
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`${peoplePath}/nova`}>
              <Plus aria-hidden="true" />
              Cadastrar pessoa
            </Link>
          </Button>
        )}
      </header>
      <section
        aria-label="Resumo da base demonstrativa"
        className="people-summary grid grid-cols-2 gap-5 border-y py-5 lg:grid-cols-4"
      >
        {[
          ["Pessoas na base", scoped.length, "Cadastros demonstrativos"],
          ["Vínculos vigentes", active.length, "Uma relação ativa por pessoa"],
          [
            "Prestadores PJ",
            active.filter((p) => currentEngagement(p)?.type === "pj").length,
            "Relações de prestação de serviço",
          ],
          [
            "Sem conta de acesso",
            scoped.filter((p) => p.access === "none").length,
            "Cadastro independente de login",
          ],
        ].map(([label, count, description]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {count}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                demo
              </span>
            </p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </section>
      <section aria-labelledby="directory-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="directory-heading" className="section-title">
            Diretório de pessoas
          </h2>
          <span className="text-xs text-muted-foreground">
            Referência dos exemplos: 13 nov. 2026
          </span>
        </div>
        <div className="people-filters grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <label
              htmlFor="people-search"
              className="mb-1.5 block text-xs font-medium"
            >
              Pesquisar pessoa
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="people-search"
                type="search"
                placeholder="Busque pelo nome…"
                value={filters.search}
                onChange={(e) => change("search", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="department-filter"
              className="mb-1.5 block text-xs font-medium"
            >
              Setor
            </label>
            <Select
              id="department-filter"
              value={filters.department}
              onChange={(e) => change("department", e.target.value)}
            >
              <option value="">Todos os setores</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <label
              htmlFor="type-filter"
              className="mb-1.5 block text-xs font-medium"
            >
              Vínculo
            </label>
            <Select
              id="type-filter"
              value={filters.type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">Todos os vínculos</option>
              {Object.entries(contractNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label
              htmlFor="status-filter"
              className="mb-1.5 block text-xs font-medium"
            >
              Situação
            </label>
            <Select
              id="status-filter"
              value={filters.status}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="">Todas as situações</option>
              {["Vigente", "Programado", "Encerrado"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p role="status">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "pessoa encontrada"
              : "pessoas encontradas"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({ search: "", department: "", type: "", status: "" });
              setPage(1);
            }}
          >
            <SlidersHorizontal aria-hidden="true" />
            Limpar filtros
          </Button>
        </div>
        {rows.length ? (
          <Table
            caption="Pessoas fictícias da Base Central"
            className="people-table"
          >
            <thead>
              <tr>
                {[
                  "Pessoa",
                  "Cargo / função",
                  "Setor",
                  "Vínculo",
                  "Situação",
                  "Início",
                  "Ficha",
                ].map((name) => (
                  <th scope="col" key={name}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => {
                const engagement =
                  currentEngagement(person) ?? person.engagements.at(-1);
                return (
                  <tr
                    key={person.id}
                    className="transition-colors hover:bg-background"
                  >
                    <td>
                      <Link
                        href={`${peoplePath}/${person.id}`}
                        className="flex min-w-40 items-center gap-3"
                      >
                        <PersonAvatar name={person.name} />
                        <span>
                          <span className="block font-semibold hover:text-primary">
                            {person.name}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {person.code}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="block min-w-32 text-xs">
                        {engagement?.position}
                      </span>
                    </td>
                    <td className="text-xs">{engagement?.department}</td>
                    <td>
                      <span className="whitespace-nowrap text-xs">
                        {engagement && contractNames[engagement.type]}
                      </span>
                    </td>
                    <td>
                      <StatusBadge person={person} />
                    </td>
                    <td className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(engagement?.start)}
                    </td>
                    <td>
                      <Link
                        href={`${peoplePath}/${person.id}`}
                        aria-label={`Ver ficha de ${person.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-full border hover:border-primary hover:text-primary"
                      >
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="rounded-xl border border-dashed px-6 py-14 text-center">
            <Users
              className="mx-auto mb-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-semibold">Nenhuma pessoa encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente outro nome ou ajuste os filtros para continuar.
            </p>
          </div>
        )}
        <nav
          aria-label="Paginação de pessoas"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground">
            Página {currentPage} de {pageCount} · {rows.length} nesta página
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Próxima
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </nav>
      </section>
    </div>
  );
}
