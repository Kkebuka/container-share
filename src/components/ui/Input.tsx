import {
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
} from "react";
import { HelpCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  tooltip?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, tooltip, icon, className = "", id, ...props }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-300"
          >
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
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-13 bg-surface-input border rounded-xl px-4 text-white
              placeholder:text-gray-600 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand
              ${icon ? "pl-10" : ""}
              ${error ? "border-danger focus:ring-danger/50" : "border-white/10 hover:border-white/20"}
              ${className}
            `}
            {...props}
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
  },
);

Input.displayName = "Input";
