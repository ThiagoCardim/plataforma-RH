"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto my-16 max-w-md rounded-xl border bg-card p-8"
    >
      <h1 className="text-xl font-semibold">
        Não foi possível carregar este espaço
      </h1>
      <p className="my-4 text-sm text-muted-foreground">
        Tente novamente. Se o problema continuar, entre em contato com o RH.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
