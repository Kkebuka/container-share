import { type ReactNode } from "react";

interface BadgeProps {
  variant: "draft" | "finalised" | "warning" | "error" | "info";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  draft: "bg-warning-dim text-warning border-warning/20",
  finalised: "bg-success-dim text-success border-success/20",
  warning: "bg-warning-dim text-warning border-warning/20",
  error: "bg-danger-dim text-danger border-danger/20",
  info: "bg-brand-dim text-brand border-brand/20",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
      inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold
      rounded-full border transition-colors
      ${variantStyles[variant]}
      ${className}
    `}
    >
      {children}
    </span>
  );
}
