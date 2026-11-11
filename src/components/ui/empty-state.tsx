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
    <Card className="flex flex-col items-center px-6 py-12 text-center md:py-16">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border bg-background text-primary">
        <Icon size={25} aria-hidden="true" />
      </span>
      <Badge>{label}</Badge>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </Card>
  );
}
