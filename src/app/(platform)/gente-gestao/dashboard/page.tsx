import { ChartNoAxesCombined } from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
export const metadata = { title: "Dashboard gerencial" };
export default async function Dashboard() {
  await requirePermission("people.dashboard.view");
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestão de pessoas"
        title="Dashboard gerencial"
        description="Uma visão integrada para apoiar decisões sobre pessoas, desenvolvimento e crescimento."
      >
        <Badge>Exclusivo · RH e Diretoria</Badge>
      </PageHeader>
      <EmptyState
        icon={ChartNoAxesCombined}
        title="Novas perspectivas, em breve"
        description="Os indicadores ainda não estão disponíveis. Este espaço receberá informações reais quando o módulo gerencial for implementado."
      />
      <p className="text-center text-xs text-muted-foreground">
        Os indicadores serão apresentados conforme as permissões da sua
        organização.
      </p>
    </div>
  );
}
