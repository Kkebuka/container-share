import type { Session, SessionComputed } from "@/types";
import { AuditStatus } from "@/types";
import { formatUSD, formatCBM, formatPercent } from "@/utils/format";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface AuditSummaryProps {
  session: Session;
  computed: SessionComputed;
}

export function AuditSummary({ session, computed }: AuditSummaryProps) {
  const utilisation =
    session.constants.containerCBM > 0
      ? (computed.sumOwnerCBM / session.constants.containerCBM) * 100
      : 0;

  return (
    <div className="space-y-4">
      {/* Constants + Utilisation */}
      <Card>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
              Total Freight
            </p>
            <p className="font-mono text-white font-semibold">
              {formatUSD(session.constants.freightUSD)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
              Container Invoice CBM
            </p>
            <p className="font-mono text-white">
              {formatCBM(session.constants.containerCBM)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
              Total Loaded
            </p>
            <p className="font-mono text-white">
              {formatCBM(computed.sumOwnerCBM)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">Container Utilisation</span>
            <span className="font-mono text-white">
              {formatPercent(utilisation)}
            </span>
          </div>
          <ProgressBar
            value={utilisation}
            color={
              utilisation > 100
                ? "danger"
                : utilisation > 85
                  ? "warning"
                  : "brand"
            }
          />
          {computed.unassignedCBM >= 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Unassigned: {formatCBM(computed.unassignedCBM)}
            </p>
          )}
        </div>
      </Card>

      {/* Freight Audit */}
      <Card
        className={
          computed.auditStatus === AuditStatus.OK
            ? "border-success/20"
            : "border-warning/20"
        }
      >
        <div className="flex items-center gap-2 mb-3">
          {computed.auditStatus === AuditStatus.OK ? (
            <>
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm font-semibold text-success">
                Freight Audit — All Good
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-warning" />
              <span className="text-sm font-semibold text-warning">
                Freight Audit — Warning
              </span>
            </>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Freight Input</span>
            <span className="font-mono text-white">
              {formatUSD(session.constants.freightUSD)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Freight Distributed</span>
            <span className="font-mono text-white">
              {formatUSD(computed.sumOwnerFreightUSD)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Variance</span>
            <span className="font-mono text-success">
              {formatUSD(
                Math.abs(
                  session.constants.freightUSD - computed.sumOwnerFreightUSD,
                ),
              )}{" "}
              ✓
            </span>
          </div>
          {computed.freightRoundingAdjustmentUSD !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Rounding Adjustment</span>
              <span className="font-mono text-warning">
                {formatUSD(Math.abs(computed.freightRoundingAdjustmentUSD))} on
                last owner
              </span>
            </div>
          )}
        </div>
        {computed.auditMessages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/6 space-y-1">
            {computed.auditMessages.map((msg, i) => (
              <p
                key={i}
                className="text-xs text-warning flex items-start gap-1.5"
              >
                <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                {msg}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
