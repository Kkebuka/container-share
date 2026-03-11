interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
  showLabel?: boolean;
  color?: "brand" | "success" | "warning" | "danger";
}

export function ProgressBar({
  value,
  className = "",
  showLabel = false,
  color = "brand",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const colors = {
    brand: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  const barColor =
    clamped > 100 ? "bg-danger" : clamped > 85 ? "bg-warning" : colors[color];

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 text-right font-mono">
          {clamped.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
