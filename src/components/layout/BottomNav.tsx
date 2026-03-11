import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Container } from "lucide-react";

const tabs = [
  { path: "/sessions", label: "Sessions", icon: LayoutDashboard },
  { path: "/sessions", label: "Container", icon: Container },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on main dashboard pages
  const showNav =
    location.pathname === "/sessions" || location.pathname === "/";

  if (!showNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card/90 backdrop-blur-xl border-t border-white/6 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`
                flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200
                ${isActive ? "text-brand" : "text-gray-500 hover:text-gray-300"}
              `}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
