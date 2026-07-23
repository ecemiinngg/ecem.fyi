import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "hud-chip inline-flex items-center rounded-sm bg-background-alt px-3 py-1 text-[10px] text-muted",
        className
      )}
      {...props}
    />
  );
}
