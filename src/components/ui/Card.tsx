import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "glass" | "glow" | "goldBorder";
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  hoverable = false,
  ...props
}) => {
  const variantStyles = {
    default: "bg-surface border border-surface-border",
    subtle: "bg-surface-subtle border border-surface-border/50",
    glass: "glass-card",
    glow: "bg-surface border border-primary/40 shadow-glow",
    goldBorder: "bg-surface border-2 border-primary/60",
  };

  const hoverStyles = hoverable
    ? "transition-all duration-200 hover:border-surface-border hover:bg-surface-hover hover:scale-[1.01] cursor-pointer"
    : "";

  return (
    <div
      className={`rounded-2xl p-5 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
