import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3, Eye, Trash2, AlertTriangle } from "lucide-react";
import type { Owner, Session } from "@/types";
import { OwnerStatus } from "@/types";
import { computeOwner } from "@/utils/calculate";
import { formatUSD, formatPercent } from "@/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OwnerCardProps {
  owner: Owner;
  session: Session;
  onDelete: (ownerId: string) => void;
}

export function OwnerCard({ owner, session, onDelete }: OwnerCardProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const computed = computeOwner(owner, session);

  if (confirmDelete) {
    return (
      <div className="bg-danger/5 border border-danger/30 rounded-xl p-4 animate-fade-in">
        <p className="text-sm text-gray-300 mb-3">
          Delete{" "}
          <span className="font-semibold text-white">"{owner.name}"</span>?
          Freight will be recalculated for all remaining owners.
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(owner.id)}>
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-white/6 rounded-xl p-4 transition-all duration-200 hover:border-white/15">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">{owner.name}</h4>
            {owner.status === OwnerStatus.FINALISED ? (
              <Badge variant="finalised">Finalised</Badge>
            ) : (
              <Badge variant="draft">Draft</Badge>
            )}
            {owner.pdf.needsRegen && (
              <Badge variant="warning">
                <AlertTriangle size={10} /> PDF outdated
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {owner.items.length} item{owner.items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-white/3 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
            Cartons
          </p>
          <p className="font-mono text-sm text-white">
            {computed.totalCartons}
          </p>
        </div>
        <div className="text-center p-2 bg-white/3 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
            CBM
          </p>
          <p className="font-mono text-sm text-white">
            {computed.totalCBM.toFixed(4)}
          </p>
        </div>
        <div className="text-center p-2 bg-white/3 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
            Share
          </p>
          <p className="font-mono text-sm text-brand">
            {formatPercent(computed.cbmPercent)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-white/3 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
            Goods
          </p>
          <p className="font-mono text-xs text-white">
            {formatUSD(computed.totalGoodsUSD)}
          </p>
        </div>
        <div className="text-center p-2 bg-white/3 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
            Freight
          </p>
          <p className="font-mono text-xs text-white">
            {formatUSD(computed.freightShareUSD)}
          </p>
        </div>
        <div className="text-center p-2 bg-brand-dim rounded-lg border border-brand/10">
          <p className="text-[10px] text-brand/70 uppercase tracking-wider mb-0.5">
            Total
          </p>
          <p className="font-mono text-xs text-brand font-semibold">
            {formatUSD(computed.grandTotalUSD)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          icon={<Edit3 size={14} />}
          onClick={() =>
            navigate(`/sessions/${session.id}/owners/${owner.id}/edit`)
          }
        >
          Edit
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          icon={<Eye size={14} />}
          onClick={() =>
            navigate(`/sessions/${session.id}/owners/${owner.id}/review`)
          }
        >
          Review
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => setConfirmDelete(true)}
          className="text-gray-500 hover:text-danger"
        >
          {""}
        </Button>
      </div>
    </div>
  );
}
