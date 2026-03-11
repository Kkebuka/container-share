import type { Owner, Session } from "@/types";
import { computeOwner } from "@/utils/calculate";
import { formatUSD, formatCBM } from "@/utils/format";
import { Card } from "@/components/ui/Card";

interface OwnerTotalsCardProps {
  owner: Owner;
  session: Session;
}

export function OwnerTotalsCard({ owner, session }: OwnerTotalsCardProps) {
  const computed = computeOwner(owner, session);

  return (
    <Card className="border-brand/20 bg-brand/5">
      <h4 className="text-xs font-semibold text-brand uppercase tracking-wider mb-3">
        This Owner
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total CBM</span>
          <span className="font-mono text-white">
            {formatCBM(computed.totalCBM)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Goods Value</span>
          <span className="font-mono text-white">
            {formatUSD(computed.totalGoodsUSD)}
          </span>
        </div>
        <div className="h-px bg-white/10 my-1" />
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Est. Freight Share</span>
          <span className="font-mono text-warning">
            {formatUSD(computed.freightShareUSD)}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-300">Est. Grand Total</span>
          <span className="font-mono text-brand">
            {formatUSD(computed.grandTotalUSD)}
          </span>
        </div>
        <p className="text-[10px] text-gray-600 mt-2">
          * Estimated — freight share may change as more owners are added
        </p>
      </div>
    </Card>
  );
}
