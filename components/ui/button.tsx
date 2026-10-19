import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

const buttonVariants = cva(
  "pixel-press inline-flex items-center justify-center gap-2 rounded-none font-mono text-sm font-semibold tracking-wide disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-2 border-[#a5c7f2] bg-[#739bd2] text-[#090b16] shadow-[4px_4px_0_#03040b,inset_0_2px_0_#ffffff25] hover:bg-[#93b5e4]",
        outline:
          "border-2 border-[#796995] bg-[#3d315b] text-foreground shadow-[4px_4px_0_#03040b,inset_0_2px_0_#ffffff10] hover:bg-[#514277]",
        ghost: "text-muted transition-colors hover:text-foreground hover:bg-white/5",
      },
      size: {
        sm: "min-h-9 px-3 py-2 text-xs",
        md: "min-h-11 px-5 py-2.5",
        lg: "min-h-12 px-6 py-3 text-sm",
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
