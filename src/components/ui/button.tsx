import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:opacity-85 active:opacity-75",
        outline:
          "border border-border bg-transparent hover:bg-muted active:bg-muted/70",
        ghost: "hover:bg-muted active:bg-muted/70",
        // The primary CTA: a small abstract multi-color blend echoing the
        // page backdrop. Never plain yellow — that color stays reserved
        // for the one small accent shape in the backdrop and category tags.
        abstract:
          "text-white bg-[radial-gradient(circle_at_15%_25%,var(--blob-navy)_0%,transparent_55%),radial-gradient(circle_at_88%_20%,var(--blob-orange)_0%,transparent_60%),radial-gradient(circle_at_80%_88%,var(--blob-coral)_0%,transparent_60%),radial-gradient(circle_at_12%_85%,var(--blob-teal)_0%,transparent_60%),linear-gradient(135deg,var(--blob-purple),var(--blob-navy))] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] hover:brightness-110 hover:scale-[1.02] active:brightness-95 active:scale-[0.98]",
        link: "underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-[13px] rounded-lg",
        lg: "h-12 px-6 text-base rounded-2xl",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
