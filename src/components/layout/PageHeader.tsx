import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  backTo?: string;
  rightAction?: ReactNode;
}

export function PageHeader({ title, backTo, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center h-14 px-4 max-w-2xl mx-auto">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="mr-3 p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold text-white truncate">
          {title}
        </h1>
        {rightAction && <div className="ml-3 shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
}
