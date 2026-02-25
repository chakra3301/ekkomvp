import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit]",
  {
    variants: {
      variant: {
        // Default – same look as modal background (glass-modal)
        default: "btn-liquid-glass text-foreground active:scale-[0.98]",
        destructive: "btn-liquid-glass text-red-600 dark:text-red-400 active:scale-[0.98]",
        outline: "btn-liquid-glass text-foreground active:scale-[0.98]",
        secondary: "btn-liquid-glass text-foreground active:scale-[0.98]",
        ghost: "btn-liquid-glass text-foreground hover:opacity-90 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "btn-liquid-glass text-primary dark:text-primary-foreground active:scale-[0.98]",
        glass: "btn-liquid-glass text-foreground active:scale-[0.98]",
        "glass-primary": "btn-liquid-glass text-primary dark:text-primary-foreground active:scale-[0.98]",
        "glass-accent": "btn-liquid-glass text-foreground active:scale-[0.98]",
        "glass-ghost": "btn-liquid-glass text-foreground hover:opacity-90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
