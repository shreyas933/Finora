import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
          {
            "bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-[0_0_20px_rgba(129,1,0,0.45)] active:shadow-[0_0_8px_rgba(129,1,0,0.3)] active:scale-[0.98]": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/95 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:shadow-[0_0_8px_rgba(239,68,68,0.25)] active:scale-[0.98]": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] active:scale-[0.98]": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-[0.98]": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-10 px-5 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

