import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pixel-panel p-6 transition-[transform,border-color] duration-150 group-hover:-translate-y-1 group-hover:border-accent group-focus-visible:border-accent",
        className
      )}
      {...props}
    />
  );
}
