import { Skeleton } from "@/components/ui/skeleton";
export default function LoadingPeople() {
  return (
    <div
      role="status"
      aria-label="Carregando Base Central"
      className="space-y-5"
    >
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-80 w-full" />
      <span className="sr-only">Carregando pessoas…</span>
    </div>
  );
}
