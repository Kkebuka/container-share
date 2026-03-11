import { type SelectHTMLAttributes, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  label: string;
  options: SelectOption[];
  error?: string;
  tooltip?: string;
}

export function Select({
  label,
  options,
  error,
  tooltip,
  className = "",
  id,
  ...props
}: SelectProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-300 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              tabIndex={-1}
              aria-label="More info"
            >
              <HelpCircle size={14} />
            </button>
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs text-gray-200 bg-surface-elevated border border-white/10 rounded-lg shadow-xl animate-fade-in">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface-elevated" />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full h-13 bg-surface-input border rounded-xl px-4 pr-10 text-white
            appearance-none transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand
            ${error ? "border-danger focus:ring-danger/50" : "border-white/10 hover:border-white/20"}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-surface-card"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
      </div>
      {error && (
        <p className="text-xs text-danger flex items-center gap-1 animate-fade-in">
          <span className="inline-block w-1 h-1 rounded-full bg-danger" />
          {error}
        </p>
      )}
    </div>
  );
}
