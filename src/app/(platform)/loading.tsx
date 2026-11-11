import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div role="status" aria-label="Carregando seu espaço" className="space-y-6">
      <Skeleton className="h-10 w-1/2 rounded bg-muted" />
      <Skeleton className="h-64 rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-xl bg-muted" />
        <Skeleton className="h-40 rounded-xl bg-muted" />
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
