export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando seu espaço"
      className="animate-pulse space-y-6"
    >
      <div className="h-10 w-1/2 rounded bg-muted" />
      <div className="h-64 rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
