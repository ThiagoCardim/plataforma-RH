import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm text-primary">404</p>
        <h1 className="my-4 text-2xl font-semibold">Página não encontrada</h1>
        <Button asChild>
          <Link href="/home">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}
