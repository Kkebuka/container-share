import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Package,
  Users,
  MoreVertical,
  Trash2,
  Copy,
  Edit3,
} from "lucide-react";
import type { Session } from "@/types";
import { formatUSD, formatCBM, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OwnerStatus } from "@/types";

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
  onDuplicate: (session: Session) => void;
}

export function SessionCard({
  session,
  onDelete,
  onDuplicate,
}: SessionCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const draftCount = session.owners.filter(
    (o) => o.status === OwnerStatus.DRAFT,
  ).length;
  const ownerCount = session.owners.length;

  if (confirmDelete) {
    return (
      <Card className="border-danger/30 bg-danger/5">
        <p className="text-sm text-gray-300 mb-4">
          Delete{" "}
          <span className="font-semibold text-white">"{session.name}"</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(session.id)}
          >
            Delete
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex-1 min-w-0"
          onClick={() => navigate(`/sessions/${session.id}/owners`)}
          role="button"
        >
          <h3 className="font-semibold text-white truncate mb-1 group-hover:text-brand transition-colors">
            {session.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar size={12} />
            <span>{formatDate(session.date)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div className="text-gray-400">Freight</div>
            <div className="text-white font-mono text-right">
              {formatUSD(session.constants.freightUSD)}
            </div>
            <div className="text-gray-400">Container</div>
            <div className="text-white font-mono text-right">
              {formatCBM(session.constants.containerCBM)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={12} />
              <span>
                {ownerCount} owner{ownerCount !== 1 ? "s" : ""}
              </span>
              {draftCount > 0 && (
                <span className="text-warning">· {draftCount} draft</span>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 bg-surface-elevated border border-white/10 rounded-xl shadow-2xl py-1.5 animate-fade-in">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/sessions/${session.id}/setup`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Edit3 size={14} /> Rename / Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(session);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/6">
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          icon={<Package size={14} />}
          onClick={() => navigate(`/sessions/${session.id}/owners`)}
        >
          Open Session
        </Button>
      </div>
    </Card>
  );
}
