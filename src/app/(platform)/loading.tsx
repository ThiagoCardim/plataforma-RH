import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div role="status" aria-label="Carregando seu espaço" className="space-y-6">
      <Skeleton className="h-10 w-1/2 rounded bg-muted" />
      <Skeleton className="h-36 rounded-2xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
        <Skeleton className="h-56 rounded-xl bg-muted" />
        <Skeleton className="h-56 rounded-xl bg-muted" />
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
