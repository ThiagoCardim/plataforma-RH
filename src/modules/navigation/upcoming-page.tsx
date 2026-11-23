import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { upcomingModules, type UpcomingModuleId } from "./catalog";
import { navigationIcons } from "./icons";
export async function renderUpcomingPage(id: UpcomingModuleId) {
  await requirePermission("people.management.view");
  const entry = upcomingModules[id];
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={entry.group}
        title={entry.label}
        description={entry.description}
      />
      <EmptyState
        icon={navigationIcons[entry.icon]}
        label="Em preparação"
        title="O próximo passo começa aqui"
        description="Este espaço já faz parte da sua navegação. As funcionalidades serão disponibilizadas em uma próxima etapa."
      />
      <Button variant="ghost" size="sm" asChild>
        <Link href="/home">
          <ArrowLeft aria-hidden="true" />
          Voltar ao Início
        </Link>
      </Button>
    </div>
  );
}
