import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

const buttonVariants = cva(
  "pixel-press inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-2 border-foreground bg-gradient-to-r from-accent to-accent-2 text-background shadow-[4px_4px_0_rgba(0,0,0,0.45)] hover:brightness-110",
        outline:
          "border-2 border-border bg-background-alt text-foreground shadow-[4px_4px_0_rgba(0,0,0,0.35)] hover:border-accent/60",
        ghost: "text-muted transition-colors hover:text-foreground hover:bg-white/5",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

interface LinkButtonProps
  extends ComponentProps<typeof Link>,
    VariantProps<typeof buttonVariants> {}

export function LinkButton({
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
