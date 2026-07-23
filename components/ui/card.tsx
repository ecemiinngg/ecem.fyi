import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pixel-panel rounded-md p-6 transition-transform duration-150 hover:-translate-y-1 hover:border-accent",
        className
      )}
      {...props}
    />
  );
}
