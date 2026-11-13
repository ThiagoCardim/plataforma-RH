import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { peoplePath, personStatus, type Person } from "../model";
export function PersonAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`person-avatar ${large ? "person-avatar-large" : ""}`}
    >
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")}
    </span>
  );
}
export function StatusBadge({ person }: { person: Person }) {
  const status = personStatus(person);
  return (
    <Badge
      className={
        status === "Vigente"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : ""
      }
    >
      <span
        className={`size-1.5 rounded-full ${status === "Vigente" ? "bg-emerald-600" : "bg-current"}`}
        aria-hidden="true"
      />
      {status}
    </Badge>
  );
}
export function BackToPeople() {
  return (
    <Link
      href={peoplePath}
      className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary"
    >
      <ArrowLeft size={14} aria-hidden="true" />
      Todas as pessoas
    </Link>
  );
}
export function MissingPerson() {
  return (
    <div className="py-12">
      <BackToPeople />
      <h1 className="page-title">Ficha indisponível</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Este exemplo não existe nesta sessão. Cadastros simulados são
        descartados ao recarregar.
      </p>
    </div>
  );
}
export function DetailGrid({
  items,
}: {
  items: [string, string | undefined][];
}) {
  return (
    <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1.5 break-words text-sm font-medium">
            {value || "Não informado"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
