import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "gold"
    | "amber"
    | "blue"
    | "neutral";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  className = "",
  dot = false,
  ...rest
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-sm font-semibold",
  };

  const variantStyles = {
    default: "bg-surface-border text-gray-300 border border-surface-border",
    neutral: "bg-gray-800/60 text-gray-300 border border-gray-700/50",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    error: "bg-red-500/10 text-red-400 border border-red-500/30",
    gold: "bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold",
    blue: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
  };

  const dotColors = {
    default: "bg-gray-400",
    neutral: "bg-gray-400",
    success: "bg-emerald-400 animate-pulse",
    warning: "bg-yellow-400 animate-pulse",
    amber: "bg-amber-400 animate-pulse",
    error: "bg-red-400 animate-pulse",
    gold: "bg-amber-300 animate-pulse",
    blue: "bg-sky-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
};
