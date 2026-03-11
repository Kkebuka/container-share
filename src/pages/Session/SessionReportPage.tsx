import { useParams, useNavigate } from "react-router-dom";
import { Download, Plus, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { computeSession, computeOwner } from "@/utils/calculate";
import { formatUSD, formatPercent } from "@/utils/format";
import { OwnerStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuditSummary } from "@/components/session/AuditSummary";
import { generateOwnerInvoicePDF, generateAuditReportPDF } from "@/utils/pdf";

export function SessionReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { addToast } = useToast();

  const session = state.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div>
        <PageHeader title="Session Not Found" backTo="/sessions" />
        <EmptyState title="Session not found" />
      </div>
    );
  }

  const computed = computeSession(session);

  const handleDownloadOwnerPDF = (ownerId: string) => {
    const owner = session.owners.find((o) => o.id === ownerId);
    if (!owner) return;
    try {
      generateOwnerInvoicePDF(session, owner);
      dispatch({
        type: "UPDATE_OWNER",
        payload: {
          sessionId: session.id,
          owner: {
            ...owner,
            pdf: {
              lastGeneratedAt: new Date().toISOString(),
              needsRegen: false,
            },
          },
        },
      });
      addToast(`Invoice PDF downloaded for ${owner.name}`, "success");
    } catch {
      addToast("PDF could not be generated. Please try again.", "error");
    }
  };

  const handleDownloadAuditReport = () => {
    try {
      generateAuditReportPDF(session);
      addToast("Audit report PDF downloaded", "success");
    } catch {
      addToast("PDF could not be generated. Please try again.", "error");
    }
  };

  return (
    <div>
      <PageHeader title={session.name} backTo={`/sessions/${id}/owners`} />

      <div className="px-4 max-w-2xl mx-auto py-4 space-y-4">
        {session.owners.length === 0 ? (
          <EmptyState
            title="No owners yet"
            description="Add owners to generate a report."
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={() => navigate(`/sessions/${id}/owners/new`)}
              >
                Add Owner
              </Button>
            }
          />
        ) : (
          <>
            {/* Audit summary */}
            <AuditSummary session={session} computed={computed} />

            {/* All-owners table */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-300 mb-4">
                All Owners Summary
              </h3>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left min-w-175">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-white/6">
                      <th className="py-2 px-2 font-medium">Owner</th>
                      <th className="py-2 px-2 font-medium text-right">Ctns</th>
                      <th className="py-2 px-2 font-medium text-right">CBM</th>
                      <th className="py-2 px-2 font-medium text-right">
                        CBM %
                      </th>
                      <th className="py-2 px-2 font-medium text-right">
                        Goods ($)
                      </th>
                      <th className="py-2 px-2 font-medium text-right">
                        Freight ($)
                      </th>
                      <th className="py-2 px-2 font-medium text-right">
                        Total ($)
                      </th>
                      <th className="py-2 px-2 font-medium text-center">
                        Status
                      </th>
                      <th className="py-2 px-2 font-medium text-center">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/3">
                    {session.owners.map((owner) => {
                      const oc = computeOwner(owner, session);
                      return (
                        <tr
                          key={owner.id}
                          className="text-sm hover:bg-white/2 transition-colors"
                        >
                          <td className="py-2.5 px-2 text-white font-medium truncate max-w-30">
                            {owner.name}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-right text-white">
                            {oc.totalCartons}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-right text-white">
                            {oc.totalCBM.toFixed(4)}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-right text-brand">
                            {formatPercent(oc.cbmPercent)}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-right text-white">
                            {formatUSD(oc.totalGoodsUSD)}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-right text-white">
                            {formatUSD(oc.freightShareUSD)}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-right text-white font-semibold">
                            {formatUSD(oc.grandTotalUSD)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {owner.pdf.needsRegen ? (
                              <Badge variant="warning">
                                <AlertTriangle size={10} />
                              </Badge>
                            ) : owner.status === OwnerStatus.FINALISED ? (
                              <Badge variant="finalised">✓</Badge>
                            ) : (
                              <Badge variant="draft">Draft</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleDownloadOwnerPDF(owner.id)}
                              className="p-1.5 rounded-lg hover:bg-brand/10 text-gray-500 hover:text-brand transition-colors"
                              title={`Download ${owner.name}'s invoice`}
                            >
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 font-bold text-sm bg-brand/5">
                      <td className="py-3 px-2 text-brand">TOTALS</td>
                      <td className="py-3 px-2 font-mono text-right text-white">
                        {computed.sumOwnerCartons}
                      </td>
                      <td className="py-3 px-2 font-mono text-right text-white">
                        {computed.sumOwnerCBM.toFixed(4)}
                      </td>
                      <td className="py-3 px-2 font-mono text-right text-brand">
                        100%
                      </td>
                      <td className="py-3 px-2 font-mono text-right text-white">
                        {formatUSD(computed.sumOwnerGoodsUSD)}
                      </td>
                      <td className="py-3 px-2 font-mono text-right text-white">
                        {formatUSD(computed.sumOwnerFreightUSD)}
                      </td>
                      <td className="py-3 px-2 font-mono text-right text-brand font-bold">
                        {formatUSD(computed.sumOwnerGrandTotalUSD)}
                      </td>
                      <td className="py-3 px-2"></td>
                      <td className="py-3 px-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* Bottom actions */}
            <div className="space-y-3 pt-4 pb-8">
              <Button
                fullWidth
                size="lg"
                icon={<Download size={18} />}
                onClick={handleDownloadAuditReport}
              >
                Download Full Audit Report
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                icon={<Plus size={18} />}
                onClick={() => navigate(`/sessions/${id}/owners/new`)}
              >
                Add Another Owner
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
