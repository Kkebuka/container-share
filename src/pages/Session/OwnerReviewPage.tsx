import { useParams, useNavigate } from "react-router-dom";
import { Download, Check, ArrowLeft, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { computeItem, computeOwner } from "@/utils/calculate";
import { formatUSD } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generateOwnerInvoicePDF } from "@/utils/pdf";

export function OwnerReviewPage() {
  const { id, ownerId } = useParams<{ id: string; ownerId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { addToast } = useToast();

  const session = state.sessions.find((s) => s.id === id);
  const owner = session?.owners.find((o) => o.id === ownerId);

  if (!session || !owner) {
    return (
      <div>
        <PageHeader title="Not Found" backTo={`/sessions/${id}/owners`} />
        <div className="p-8 text-center text-gray-400">Owner not found</div>
      </div>
    );
  }

  const computed = computeOwner(owner, session);
  const computedItems = owner.items.map(computeItem);

  const handleDownloadPDF = () => {
    try {
      generateOwnerInvoicePDF(session, owner);
      // Update PDF meta
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
      addToast("Invoice PDF downloaded", "success");
    } catch {
      addToast("PDF could not be generated. Please try again.", "error");
    }
  };

  const handleFinalise = (goTo: "next" | "report") => {
    dispatch({
      type: "FINALISE_OWNER",
      payload: { sessionId: session.id, ownerId: owner.id },
    });
    addToast(`${owner.name} finalised ✓`, "success");
    if (goTo === "next") {
      navigate(`/sessions/${session.id}/owners/new`);
    } else {
      navigate(`/sessions/${session.id}/report`);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Review: ${owner.name}`}
        backTo={`/sessions/${id}/owners/${ownerId}/edit`}
      />

      <div className="px-4 max-w-2xl mx-auto py-4 space-y-4">
        {/* Needs regen warning */}
        {owner.pdf.needsRegen && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl animate-fade-in">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-warning font-semibold">PDF outdated</p>
              <p className="text-xs text-gray-400 mt-0.5">
                This owner was edited after their last PDF was downloaded.
                Please re-download.
              </p>
            </div>
          </div>
        )}

        {/* Invoice card */}
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/6">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Session</p>
              <p className="text-sm font-semibold text-white">{session.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Date</p>
              <p className="text-sm text-white">
                {new Date(session.date).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-gray-500">Owner</p>
            <p className="text-base font-bold text-white">{owner.name}</p>
            {owner.status === "FINALISED" && (
              <Badge variant="finalised">Finalised</Badge>
            )}
          </div>

          {/* Items table */}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left min-w-130">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-white/6">
                  <th className="py-2 px-2 font-medium">#</th>
                  <th className="py-2 px-2 font-medium">Item No</th>
                  <th className="py-2 px-2 font-medium text-right">Ctns</th>
                  <th className="py-2 px-2 font-medium text-right">CBM/Ctn</th>
                  <th className="py-2 px-2 font-medium text-right">Tot. CBM</th>
                  <th className="py-2 px-2 font-medium text-right">
                    Price/Ctn
                  </th>
                  <th className="py-2 px-2 font-medium text-right">
                    Tot. Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {computedItems.map((item, idx) => (
                  <tr key={item.id} className="text-sm">
                    <td className="py-2 px-2 font-mono text-xs text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-white">{item.itemNo}</td>
                    <td className="py-2 px-2 font-mono text-right text-white">
                      {item.cartons}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-white">
                      {item.cbmPerCarton.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-white">
                      {item.totalCBM.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-white">
                      {formatUSD(item.pricePerCartonUSD)}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-white">
                      {formatUSD(item.totalUSD)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 font-semibold text-sm">
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2 text-gray-300">TOTALS</td>
                  <td className="py-2.5 px-2 font-mono text-right text-white">
                    {computed.totalCartons}
                  </td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2 font-mono text-right text-white">
                    {computed.totalCBM.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2 font-mono text-right text-white">
                    {formatUSD(computed.totalGoodsUSD)}
                  </td>
                </tr>
                <tr className="text-sm">
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2 text-gray-300">Freight</td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2 font-mono text-right text-warning">
                    {formatUSD(computed.freightShareUSD)}
                  </td>
                </tr>
                <tr className="border-t border-white/10 font-bold text-sm bg-brand/5">
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2 text-brand">Total Expense</td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2 font-mono text-right text-white">
                    {formatUSD(computed.grandTotalUSD)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Grand total */}
          <div className="mt-4 pt-4 border-t border-white/6">
            <div className="flex justify-between items-center py-2">
              <span className="text-base font-bold text-white">
                GRAND TOTAL
              </span>
              <span className="text-xl font-bold font-mono text-brand">
                {formatUSD(computed.grandTotalUSD)}
              </span>
            </div>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-3 pb-8">
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            icon={<Download size={18} />}
            onClick={handleDownloadPDF}
          >
            Download Invoice PDF
          </Button>
          <Button
            fullWidth
            size="lg"
            icon={<Check size={18} />}
            onClick={() => handleFinalise("next")}
          >
            Finalise & Next Owner
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            icon={<Check size={18} />}
            onClick={() => handleFinalise("report")}
          >
            Finalise & Go to Report
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate(`/sessions/${id}/owners/${ownerId}/edit`)}
          >
            Back to Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
