import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Alert({
  className,
  variant = "info",
  ...props
}: ComponentProps<"div"> & { variant?: "info" | "error" | "success" }) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border p-4 text-sm leading-6",
        variant === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : variant === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "bg-muted text-foreground",
        className,
      )}
      {...props}
    />
  );
}
