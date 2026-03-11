// ─── Enums ───────────────────────────────────────────────────────────────────

export enum OwnerStatus {
  DRAFT = "DRAFT",
  FINALISED = "FINALISED",
}

export enum AuditStatus {
  OK = "OK",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

// ─── Core data models (raw — what gets stored) ────────────────────────────────

export interface Item {
  id: string;
  itemNo: string;
  cartons: number;
  cbmPerCarton: number;
  pricePerCartonUSD: number;
}

export interface OwnerPdfMeta {
  lastGeneratedAt: string | null;
  needsRegen: boolean;
}

export interface Owner {
  id: string;
  name: string;
  status: OwnerStatus;
  items: Item[];
  createdAt: string;
  updatedAt: string;
  pdf: OwnerPdfMeta;
}

export interface SessionConstants {
  freightUSD: number;
  containerCBM: number;
}

export interface Session {
  id: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  constants: SessionConstants;
  owners: Owner[];
}

// ─── Computed types (derived at render time — never stored) ──────────────────

export interface ItemComputed extends Item {
  totalCBM: number;
  totalUSD: number;
}

export interface OwnerComputed {
  ownerId: string;
  totalCartons: number;
  totalCBM: number;
  totalGoodsUSD: number;
  freightShareUSD: number;
  grandTotalUSD: number;
  cbmPercent: number;
}

export interface SessionComputed {
  basisCBM: number;
  sumOwnerCartons: number;
  sumOwnerCBM: number;
  sumOwnerGoodsUSD: number;
  sumOwnerFreightUSD: number;
  sumOwnerGrandTotalUSD: number;
  unassignedCBM: number;
  freightRoundingAdjustmentUSD: number;
  auditStatus: AuditStatus;
  auditMessages: string[];
}

// ─── Storage types ────────────────────────────────────────────────────────────

export interface StorageData {
  sessions: Session[];
  version: string;
}

// ─── UI / App state types ─────────────────────────────────────────────────────

export interface AppState {
  sessions: Session[];
  activeSessionId: string | null;
  activeOwnerId: string | null;
}

export type AppAction =
  | { type: "LOAD_SESSIONS"; payload: Session[] }
  | { type: "CREATE_SESSION"; payload: Session }
  | { type: "UPDATE_SESSION"; payload: Session }
  | { type: "DELETE_SESSION"; payload: string }
  | { type: "SET_ACTIVE_SESSION"; payload: string | null }
  | { type: "SET_ACTIVE_OWNER"; payload: string | null }
  | { type: "ADD_OWNER"; payload: { sessionId: string; owner: Owner } }
  | { type: "UPDATE_OWNER"; payload: { sessionId: string; owner: Owner } }
  | { type: "DELETE_OWNER"; payload: { sessionId: string; ownerId: string } }
  | { type: "FINALISE_OWNER"; payload: { sessionId: string; ownerId: string } }
  | {
      type: "ADD_ITEM";
      payload: { sessionId: string; ownerId: string; item: Item };
    }
  | {
      type: "UPDATE_ITEM";
      payload: { sessionId: string; ownerId: string; item: Item };
    }
  | {
      type: "DELETE_ITEM";
      payload: { sessionId: string; ownerId: string; itemId: string };
    };

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "warning" | "error";
}
