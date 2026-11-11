import { Users } from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import { Card } from "@/components/ui/card";
export const metadata = { title: "Gente & Gestão" };
export default async function Management() {
  await requirePermission("people.management.view");
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        RH e Diretoria
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Base de Gente & Gestão</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Espaço reservado para a gestão de pessoas da sua organização.
      </p>
      <Card className="mt-8 p-12 text-center">
        <Users className="mx-auto mb-4 text-muted-foreground" size={30} />
        <h2 className="font-semibold">
          A base será construída na próxima etapa
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Ainda não há cadastros ou dados gerenciais. O cadastro completo de
          pessoas depende de uma nova etapa autorizada.
        </p>
      </Card>
    </div>
  );
}
