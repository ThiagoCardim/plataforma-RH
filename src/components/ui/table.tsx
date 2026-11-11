import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Table({
  caption,
  className,
  children,
  ...props
}: ComponentProps<"table"> & { caption: string }) {
  return (
    <div
      className="overflow-x-auto rounded-xl border bg-card"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table
        className={cn(
          "w-full border-collapse text-left text-sm [&_th]:border-b [&_th]:bg-muted [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:px-4 [&_td]:py-4 [&_tbody_tr:last-child_td]:border-b-0",
          className,
        )}
        {...props}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}
