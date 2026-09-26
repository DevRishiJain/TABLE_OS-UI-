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
    default: "glass-pill text-gray-200 border-white/10",
    neutral: "bg-white/5 backdrop-blur-md text-gray-300 border border-white/10",
    success: "bg-emerald-500/15 backdrop-blur-md text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    warning: "bg-yellow-500/15 backdrop-blur-md text-yellow-300 border border-yellow-500/40 shadow-sm shadow-yellow-500/10",
    amber: "bg-amber-500/15 backdrop-blur-md text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10",
    error: "bg-red-500/15 backdrop-blur-md text-red-300 border border-red-500/40 shadow-sm shadow-red-500/10",
    gold: "bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/50 font-semibold shadow-sm shadow-amber-500/15",
    blue: "bg-sky-500/15 backdrop-blur-md text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/10",
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
