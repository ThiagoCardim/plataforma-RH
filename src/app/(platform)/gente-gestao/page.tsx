import { Users } from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
export const metadata = { title: "Gente & Gestão" };
export default async function Management() {
  await requirePermission("people.management.view");
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Gestão de pessoas"
        title="Gente & Gestão"
        description="Um espaço para cuidar das pessoas e acompanhar suas jornadas na organização."
      >
        <Badge>Exclusivo · RH e Diretoria</Badge>
      </PageHeader>
      <EmptyState
        icon={Users}
        title="O próximo capítulo da nossa gente"
        description="A base de pessoas será disponibilizada em uma próxima etapa. Os cadastros e as jornadas de gestão ainda não estão disponíveis."
      />
      <p className="text-xs text-muted-foreground">
        Este espaço respeita as permissões da sua organização.
      </p>
    </div>
  );
}
