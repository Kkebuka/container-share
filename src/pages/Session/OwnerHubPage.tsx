import { useParams, useNavigate } from "react-router-dom";
import { Plus, FileText, Settings, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { computeSession } from "@/utils/calculate";
import { formatUSD, formatCBM, formatPercent } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { OwnerCard } from "@/components/session/OwnerCard";
import { AuditStatus } from "@/types";

export function OwnerHubPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { addToast } = useToast();

  const session = state.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div>
        <PageHeader title="Session Not Found" backTo="/sessions" />
        <EmptyState
          title="Session not found"
          description="This session may have been deleted."
        />
      </div>
    );
  }

  const computed = computeSession(session);
  const utilisation =
    session.constants.containerCBM > 0
      ? (computed.sumOwnerCBM / session.constants.containerCBM) * 100
      : 0;

  const handleDeleteOwner = (ownerId: string) => {
    const owner = session.owners.find((o) => o.id === ownerId);
    dispatch({
      type: "DELETE_OWNER",
      payload: { sessionId: session.id, ownerId },
    });
    addToast(
      `${owner?.name || "Owner"} removed. Freight recalculated.`,
      "success",
    );
  };

  const finalisedCount = session.owners.filter(
    (o) => o.status === "FINALISED",
  ).length;

  return (
    <div>
      <PageHeader
        title={session.name}
        backTo="/sessions"
        rightAction={
          <button
            onClick={() => navigate(`/sessions/${session.id}/setup`)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            aria-label="Edit session"
          >
            <Settings size={18} />
          </button>
        }
      />

      <div className="px-4 max-w-2xl mx-auto py-4 space-y-4">
        {/* Constants strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>
            Freight:{" "}
            <span className="font-mono text-white">
              {formatUSD(session.constants.freightUSD)}
            </span>
          </span>
          <span className="text-white/20">·</span>
          <span>
            Container:{" "}
            <span className="font-mono text-white">
              {formatCBM(session.constants.containerCBM)}
            </span>
          </span>
        </div>

        {/* Summary card */}
        {session.owners.length > 0 && (
          <Card glow>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Owners
                </p>
                <p className="font-mono text-white font-semibold">
                  {session.owners.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Cartons
                </p>
                <p className="font-mono text-white">
                  {computed.sumOwnerCartons}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Loaded CBM
                </p>
                <p className="font-mono text-white">
                  {formatCBM(computed.sumOwnerCBM)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Goods
                </p>
                <p className="font-mono text-white">
                  {formatUSD(computed.sumOwnerGoodsUSD)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Freight
                </p>
                <p className="font-mono text-white">
                  {formatUSD(computed.sumOwnerFreightUSD)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-brand/70 uppercase tracking-wider mb-0.5">
                  Grand Total
                </p>
                <p className="font-mono text-brand font-semibold">
                  {formatUSD(computed.sumOwnerGrandTotalUSD)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Container Utilisation</span>
                <span className="font-mono text-white">
                  {formatPercent(utilisation)}
                </span>
              </div>
              <ProgressBar value={utilisation} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {computed.auditStatus === AuditStatus.OK ? (
                <Badge variant="finalised">✓ All good</Badge>
              ) : (
                <Badge variant="warning">⚠ {computed.auditMessages[0]}</Badge>
              )}
            </div>
          </Card>
        )}

        {/* Owner list */}
        {session.owners.length === 0 ? (
          <EmptyState
            icon={<Users size={28} className="text-gray-600" />}
            title="No owners yet"
            description="Add an owner to start entering items and calculating freight shares."
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={() => navigate(`/sessions/${session.id}/owners/new`)}
              >
                Add Owner
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {session.owners.length} owner
              {session.owners.length !== 1 ? "s" : ""}
            </p>
            {session.owners.map((owner) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                session={session}
                onDelete={handleDeleteOwner}
              />
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className="space-y-3 pt-4 pb-8">
          <Button
            fullWidth
            size="lg"
            icon={<Plus size={18} />}
            onClick={() => navigate(`/sessions/${session.id}/owners/new`)}
          >
            Add Owner
          </Button>
          {finalisedCount > 0 && (
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              icon={<FileText size={18} />}
              onClick={() => navigate(`/sessions/${session.id}/report`)}
            >
              View Audit Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
