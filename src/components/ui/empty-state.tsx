import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { Badge } from "./badge";
export function EmptyState({
  icon: Icon,
  title,
  description,
  label = "Em breve",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  label?: string;
}) {
  return (
    <Card className="empty-state-panel flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-accent text-primary">
        <Icon size={23} aria-hidden="true" />
      </span>
      <div className="max-w-lg">
        <Badge className="border-transparent bg-muted">{label}</Badge>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </Card>
  );
}
