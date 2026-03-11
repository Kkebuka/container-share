import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-surface active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20",
    secondary:
      "bg-surface-elevated hover:bg-surface-elevated/80 text-gray-200 border border-white/10",
    ghost: "bg-transparent hover:bg-white/5 text-gray-300",
    danger:
      "bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-[52px] px-6 text-base gap-2.5",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
