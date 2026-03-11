import { AuditStatus } from "@/types";
import type {
  Item,
  Owner,
  Session,
  ItemComputed,
  OwnerComputed,
  SessionComputed,
} from "@/types";

// ─── Item level ───────────────────────────────────────────────────────────────

export function computeItem(item: Item): ItemComputed {
  return {
    ...item,
    totalCBM: round4(item.cartons * item.cbmPerCarton),
    totalUSD: round2(item.cartons * item.pricePerCartonUSD),
  };
}

// ─── Owner level ──────────────────────────────────────────────────────────────

export function computeOwnerRaw(owner: Owner) {
  const items = owner.items.map(computeItem);
  return {
    totalCartons: items.reduce((s, i) => s + i.cartons, 0),
    totalCBM: round4(items.reduce((s, i) => s + i.totalCBM, 0)),
    totalGoodsUSD: round2(items.reduce((s, i) => s + i.totalUSD, 0)),
  };
}

// ─── Session level ────────────────────────────────────────────────────────────

export function computeSession(session: Session): SessionComputed {
  const { freightUSD, containerCBM } = session.constants;
  const ownerRaws = session.owners.map((o) => ({
    id: o.id,
    ...computeOwnerRaw(o),
  }));

  const sumOwnerCBM = round4(ownerRaws.reduce((s, o) => s + o.totalCBM, 0));

  // Use Container Invoice CBM as basis for freight allocation
  const basisCBM = containerCBM;

  // Per-owner freight shares (full precision first)
  const rawShares = ownerRaws.map((o) =>
    basisCBM > 0 ? (o.totalCBM / basisCBM) * freightUSD : 0,
  );

  // No rounding adjustment - each owner pays exact proportional share
  const roundedShares = rawShares.map((s) => round2(s));

  const sumOwnerFreightUSD = round2(roundedShares.reduce((s, v) => s + v, 0));
  const sumOwnerCartons = ownerRaws.reduce((s, o) => s + o.totalCartons, 0);
  const sumOwnerGoodsUSD = round2(
    ownerRaws.reduce((s, o) => s + o.totalGoodsUSD, 0),
  );
  const sumOwnerGrandTotal = round2(sumOwnerGoodsUSD + sumOwnerFreightUSD);
  const unassignedCBM = round4(containerCBM - sumOwnerCBM);

  // Audit checks
  const auditMessages: string[] = [];
  let auditStatus = AuditStatus.OK;

  if (session.owners.length === 0) {
    auditMessages.push("No owners added yet.");
    auditStatus = AuditStatus.WARNING;
  }
  if (unassignedCBM < -0.001) {
    auditMessages.push(
      `Over capacity by ${Math.abs(unassignedCBM).toFixed(4)} CBM.`,
    );
    auditStatus = AuditStatus.WARNING;
  }

  return {
    basisCBM,
    sumOwnerCartons,
    sumOwnerCBM,
    sumOwnerGoodsUSD,
    sumOwnerFreightUSD,
    sumOwnerGrandTotalUSD: sumOwnerGrandTotal,
    unassignedCBM,
    freightRoundingAdjustmentUSD: 0,
    auditStatus,
    auditMessages,
  };
}

// ─── Get computed data for a single owner ─────────────────────────────────────

export function computeOwner(owner: Owner, session: Session): OwnerComputed {
  const { freightUSD, containerCBM } = session.constants;
  const ownerRaw = computeOwnerRaw(owner);
  const ownerIdx = session.owners.findIndex((o) => o.id === owner.id);

  const allOwnerRaws = session.owners.map((o) => computeOwnerRaw(o));
  // Use Container Invoice CBM as basis
  const basisCBM = containerCBM;

  const allRawShares = allOwnerRaws.map((o) =>
    basisCBM > 0 ? (o.totalCBM / basisCBM) * freightUSD : 0,
  );
  const allRounded = allRawShares.map((s) => round2(s));

  // No rounding adjustment when using Container Invoice CBM
  // Each owner pays exactly their proportional share
  const freightShare = allRounded[ownerIdx];

  return {
    ownerId: owner.id,
    totalCartons: ownerRaw.totalCartons,
    totalCBM: ownerRaw.totalCBM,
    totalGoodsUSD: ownerRaw.totalGoodsUSD,
    freightShareUSD: freightShare,
    grandTotalUSD: round2(ownerRaw.totalGoodsUSD + freightShare),
    cbmPercent: basisCBM > 0 ? round2((ownerRaw.totalCBM / basisCBM) * 100) : 0,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
