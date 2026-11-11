import Link from "next/link";
import { cn } from "@/lib/utils";
/** Route-based tabs use links, rather than implying an interactive tabpanel. */
export function LinkTabs({
  label,
  items,
  activeHref,
}: {
  label: string;
  items: readonly { label: string; href: string }[];
  activeHref: string;
}) {
  return (
    <nav aria-label={label} className="overflow-x-auto border-b">
      <ul className="flex min-w-max gap-6">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.href === activeHref ? "page" : undefined}
              className={cn(
                "block border-b-2 px-1 py-3 text-sm",
                item.href === activeHref
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
