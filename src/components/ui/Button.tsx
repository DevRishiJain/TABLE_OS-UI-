import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold" | "subtle";
  size?: "sm" | "md" | "lg" | "touch";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs font-semibold gap-1.5",
      md: "px-4 py-2.5 text-sm gap-2",
      lg: "px-6 py-3.5 text-base gap-2.5",
      touch: "px-6 py-4 text-lg font-semibold min-h-[60px] gap-3", // KDS & Guard 60px+ targets
    };

    const variantStyles = {
      primary:
        "bg-primary hover:bg-primary-hover text-background font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30",
      gold: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shadow-md shadow-amber-500/20",
      secondary:
        "bg-surface-subtle hover:bg-surface-hover text-gray-200 border border-surface-border",
      subtle:
        "bg-surface hover:bg-surface-subtle text-gray-300 border border-surface-border/50",
      outline:
        "border border-primary/40 hover:border-primary text-primary hover:bg-primary/10",
      ghost: "text-gray-400 hover:text-gray-100 hover:bg-surface-hover",
      danger:
        "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
