import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/components/auth/actions";
export default function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center">
        <ShieldX className="mx-auto mb-5 text-primary" size={36} />
        <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
        <p className="my-4 text-sm leading-6 text-muted-foreground">
          Seu acesso não possui permissão para este espaço ou não está vinculado
          a uma organização ativa. Solicite orientação ao RH.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/home">Ir para o início</Link>
          </Button>
          <form action={logout}>
            <Button>Voltar ao login</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
