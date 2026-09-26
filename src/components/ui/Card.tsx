import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "glass" | "spatial" | "glow" | "goldBorder";
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
    default: "glass-card",
    subtle: "bg-surface-subtle/70 backdrop-blur-md border border-white/5",
    glass: "glass-card",
    spatial: "glass-spatial",
    glow: "glass-card border-primary/40 shadow-glow",
    goldBorder: "glass-card border-2 border-primary/60",
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
