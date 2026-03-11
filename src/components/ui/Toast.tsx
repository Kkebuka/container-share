import { CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const toastStyles = {
  success: {
    bg: "bg-success/10 border-success/30",
    icon: CheckCircle,
    iconColor: "text-success",
  },
  warning: {
    bg: "bg-warning/10 border-warning/30",
    icon: AlertTriangle,
    iconColor: "text-warning",
  },
  error: {
    bg: "bg-danger/10 border-danger/30",
    icon: XCircle,
    iconColor: "text-danger",
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 z-100 flex flex-col gap-2 pointer-events-none sm:left-auto sm:w-96">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl border
              backdrop-blur-xl shadow-2xl animate-toast-in
              ${style.bg}
            `}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${style.iconColor}`} />
            <p className="flex-1 text-sm text-white/90">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
