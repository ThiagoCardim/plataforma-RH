import { ChartNoAxesCombined } from "lucide-react";
import { requirePermission } from "@/modules/access/server";
import { Card } from "@/components/ui/card";
export const metadata = { title: "Dashboard gerencial" };
export default async function Dashboard() {
  await requirePermission("people.dashboard.view");
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        RH e Diretoria
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Dashboard gerencial</h1>
      <Card className="mt-8 p-12 text-center">
        <ChartNoAxesCombined
          className="mx-auto mb-4 text-muted-foreground"
          size={30}
        />
        <h2 className="font-semibold">Sem indicadores disponíveis</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Os indicadores serão definidos e conectados a dados reais em uma etapa
          futura.
        </p>
      </Card>
    </div>
  );
}
