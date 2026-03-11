import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  glow = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        bg-surface-card border border-white/[0.06] rounded-2xl p-5
        transition-all duration-200
        ${glow ? "shadow-lg shadow-brand/5 border-brand/20" : ""}
        ${onClick ? "cursor-pointer hover:border-white/15 hover:bg-surface-card/80 active:scale-[0.99]" : ""}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
