import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <EmptyState
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        action={
          <Button
            icon={<Home size={16} />}
            onClick={() => navigate("/sessions")}
          >
            Go to Dashboard
          </Button>
        }
      />
    </div>
  );
}
