# ContainerShare PWA — Codebase Documentation

**Version:** 1.0.0  
**Last Updated:** March 7, 2026

This document provides detailed documentation of the ContainerShare PWA codebase patterns, conventions, and architecture to guide development and AI coding assistants.

---

## 📋 Table of Contents

1. [Code Style & TypeScript Patterns](#code-style--typescript-patterns)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Project-Specific Conventions](#project-specific-conventions)
4. [Tailwind CSS v4 Usage](#tailwind-css-v4-usage)
5. [PWA Configuration](#pwa-configuration)
6. [Build & Development Commands](#build--development-commands)

---

## 🎨 Code Style & TypeScript Patterns

### TypeScript Configuration

**Strict mode enabled** with aggressive linting:

- [tsconfig.app.json](tsconfig.app.json#L19-L22): `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`
- Path aliases: `@/*` maps to `src/*` ([tsconfig.app.json](tsconfig.app.json#L17-L18))
- Target: ES2020, JSX: react-jsx ([tsconfig.app.json](tsconfig.app.json#L3-L14))

### Component Patterns

#### Functional Components with TypeScript

All components use **functional components with explicit typing**:

```tsx
// src/components/ui/Button.tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  // ... rest
}: ButtonProps) {
  /* ... */
}
```

#### forwardRef Pattern for Input Components

Input components use `forwardRef` for ref forwarding ([src/components/ui/Input.tsx](src/components/ui/Input.tsx#L12-L14)):

```tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, tooltip, icon, className = "", id, ...props }, ref) => {
    // ... implementation
  },
);
Input.displayName = "Input";
```

#### Event Handler Naming

- Use `handle` prefix for event handlers: `handleDeleteOwner`, `handleSaveAndReview` ([src/pages/Session/OwnerEntryPage.tsx](src/pages/Session/OwnerEntryPage.tsx#L150-L170))
- Use `on` prefix for callback props: `onDelete`, `onClose` ([src/components/session/OwnerCard.tsx](src/components/session/OwnerCard.tsx#L12-L15))

### Type Organization

**Separation of concerns** in [src/types/index.ts](src/types/index.ts):

1. **Enums** (lines 3-16): `OwnerStatus`, `AllocationBasis`, `AuditStatus`
2. **Core data models** (lines 18-54): Raw stored data (`Item`, `Owner`, `Session`)
3. **Computed types** (lines 56-84): Derived runtime data (`ItemComputed`, `OwnerComputed`, `SessionComputed`) — **NEVER stored**
4. **Storage types** (lines 86-90): `StorageData` with version
5. **App state types** (lines 92-122): `AppState`, `AppAction` discriminated union for reducer

**Key convention:** Computed types extend base types and are derived at render time, never persisted to localStorage.

### Error Handling

**No try-catch in React components** — errors handled in utility functions:

- [src/utils/storage.ts](src/utils/storage.ts#L9-L18): `try-catch` in `loadSessions()` with fallback to `[]`
- [src/utils/storage.ts](src/utils/storage.ts#L23-L27): Throws `"STORAGE_FULL"` error (not caught in components)
- **Silent failures** for non-critical operations: `saveDraft()` ([src/utils/storage.ts](src/utils/storage.ts#L55-L58))

### Function Signatures

**Pure computation functions** in [src/utils/calculate.ts](src/utils/calculate.ts):

```typescript
// Pure functions - no side effects
export function computeItem(item: Item): ItemComputed {
  /* ... */
}
export function computeOwnerRaw(owner: Owner): {
  totalCartons;
  totalCBM;
  totalGoodsUSD;
} {
  /* ... */
}
export function computeOwner(owner: Owner, session: Session): OwnerComputed {
  /* ... */
}
export function computeSession(session: Session): SessionComputed {
  /* ... */
}

// Helper functions
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
```

---

## 🏗️ Architecture & Data Flow

### State Management: Context + useReducer

**Pattern:** Context API with `useReducer` for global state ([src/context/AppContext.tsx](src/context/AppContext.tsx))

```tsx
// State structure
interface AppState {
  sessions: Session[];
  activeSessionId: string | null;
  activeOwnerId: string | null;
}

// Reducer pattern (lines 21-60)
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_SESSIONS": /* ... */
    case "CREATE_SESSION": /* ... */
    case "UPDATE_SESSION": /* ... */
    // ... 11 action types total
  }
}

// Custom hook (lines 199-203)
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
```

**Usage in components** ([src/pages/Session/OwnerHubPage.tsx](src/pages/Session/OwnerHubPage.tsx#L18-L19)):

```tsx
const { state, dispatch } = useApp();
const session = state.sessions.find((s) => s.id === id);

// Dispatching actions
dispatch({
  type: "DELETE_OWNER",
  payload: { sessionId: session.id, ownerId },
});
```

### Toast Notifications: Separate Context

**Pattern:** Dedicated context for UI notifications ([src/context/ToastContext.tsx](src/context/ToastContext.tsx))

```tsx
// Auto-dismiss after 4000ms (line 24)
setTimeout(() => {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}, 4000);

// Usage pattern
const { addToast } = useToast();
addToast("Freight shares recalculated for all owners ✓", "success");
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   localStorage                      │
│         (SESSIONS_KEY, DRAFT_KEY)                  │
└──────────────────┬──────────────────────────────────┘
                   │ storage.ts (load/save)
                   ▼
        ┌──────────────────────┐
        │   AppContext         │
        │   (useReducer)       │  ◄── Dispatches actions
        └──────────┬───────────┘
                   │ state.sessions
                   ▼
        ┌──────────────────────┐
        │   Page Components    │  ◄── Read session data
        │   (useApp hook)      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   calculate.ts       │  ◄── Compute freight shares
        │   (pure functions)   │      (round2/round4 + adjustment)
        └──────────────────────┘
```

### util/ Organization

| File                                   | Purpose                                            | Key Functions                                                                         |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [calculate.ts](src/utils/calculate.ts) | **Freight calculations** with rounding adjustments | `computeItem()`, `computeOwner()`, `computeSession()`, `round2()`, `round4()`         |
| [storage.ts](src/utils/storage.ts)     | **localStorage wrapper** with versioning           | `loadSessions()`, `saveSessions()`, `saveSession()`, `saveDraft()`, `clearDraft()`    |
| [format.ts](src/utils/format.ts)       | **Display formatting**                             | `formatUSD()`, `formatCBM()`, `formatPercent()`, `formatDate()`, `sanitiseFilename()` |
| [pdf.ts](src/utils/pdf.ts)             | **jsPDF generation** (557 lines)                   | `generateOwnerInvoicePDF()`, `generateAuditReportPDF()`                               |
| [ids.ts](src/utils/ids.ts)             | **ID generation**                                  | `generateId(prefix)` → `${prefix}_${timestamp}_${random5}`                            |

### Routing Structure

**React Router v7** with `HashRouter` for PWA compatibility ([src/main.tsx](src/main.tsx#L9)):

```tsx
<HashRouter>
  <AppProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AppProvider>
</HashRouter>
```

**Route definitions** ([src/App.tsx](src/App.tsx#L15-L27)):

```
/                           → Navigate to /sessions
/sessions                   → DashboardPage
/sessions/new               → SessionSetupPage (create)
/sessions/:id/setup         → SessionSetupPage (edit)
/sessions/:id/owners        → OwnerHubPage
/sessions/:id/owners/new    → OwnerEntryPage
/sessions/:id/owners/:ownerId/edit   → OwnerEntryPage
/sessions/:id/owners/:ownerId/review → OwnerReviewPage
/sessions/:id/report        → SessionReportPage
*                           → NotFound
```

### Component Structure

```
src/components/
├── layout/
│   ├── BottomNav.tsx       — Bottom navigation (only on /sessions)
│   └── PageHeader.tsx      — Sticky header with back button
├── session/
│   ├── AuditSummary.tsx    — Session audit card
│   ├── ItemRow.tsx         — Editable item row
│   ├── OwnerCard.tsx       — Owner summary card
│   ├── OwnerTotalsCard.tsx — Live totals preview
│   └── SessionCard.tsx     — Session list card
└── ui/
    ├── Badge.tsx           — Status badges (5 variants)
    ├── BottomSheet.tsx     — Modal sheet from bottom
    ├── Button.tsx          — 4 variants, 3 sizes
    ├── Card.tsx            — Base card with glow option
    ├── EmptyState.tsx      — Empty state with action
    ├── Input.tsx           — Labeled input with tooltip
    ├── ProgressBar.tsx     — Animated progress bar
    ├── Select.tsx          — Custom select component
    └── Toast.tsx           — Toast notification container
```

---

## 🔧 Project-Specific Conventions

### 1. Calculation Logic: Rounding & Adjustment Pattern

**Critical pattern** in [src/utils/calculate.ts](src/utils/calculate.ts#L40-L60):

```typescript
// All currency rounded to 2 decimals, CBM to 4 decimals
const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

// FREIGHT ALLOCATION WITH LAST-OWNER ADJUSTMENT
const rawShares = ownerRaws.map((o) =>
  basisCBM > 0 ? (o.totalCBM / basisCBM) * freightUSD : 0,
);

// Round each share
const roundedShares = rawShares.map((s) => round2(s));
const sumRounded = round2(roundedShares.reduce((s, v) => s + v, 0));

// Last owner absorbs rounding discrepancy (lines 54-58)
const adjustment = round2(freightUSD - sumRounded);
if (roundedShares.length > 0) {
  roundedShares[roundedShares.length - 1] = round2(
    roundedShares[roundedShares.length - 1] + adjustment,
  );
}
```

**Why:** Ensures freight sum **EXACTLY** matches input freight, avoiding $0.01-$0.03 discrepancies.

### 2. PDF Generation Pattern

**Dark theme throughout** using RGB tuples ([src/utils/pdf.ts](src/utils/pdf.ts#L13-L19)):

```typescript
const DARK_BG: [number, number, number] = [15, 23, 42];
const CARD_BG: [number, number, number] = [30, 41, 59];
const BRAND: [number, number, number] = [59, 130, 246];
```

**Auto-table styling** ([src/utils/pdf.ts](src/utils/pdf.ts#L75-L106)):

- Theme: `"plain"` (not grid)
- Font: `"courier"` for numeric columns, `"helvetica"` for text
- Column alignment: `halign: "right"` for all numeric values
- Footer row uses `SUCCESS` color for totals

### 3. localStorage Strategy

**Three keys** in [src/utils/storage.ts](src/utils/storage.ts#L3-L6):

1. `containershare_sessions_v1` — Array of all sessions
2. `containershare_draft_v1` — Current active session (auto-saved on changes)
3. `containershare_version` — App version for migration

**Auto-save draft** on every state change ([src/context/AppContext.tsx](src/context/AppContext.tsx#L183-L188)):

```tsx
useEffect(() => {
  if (state.activeSessionId) {
    const active = state.sessions.find((s) => s.id === state.activeSessionId);
    if (active) saveDraft(active);
  }
}, [state.sessions, state.activeSessionId]);
```

### 4. ID Generation Pattern

**Prefixed timestamp + random** ([src/utils/ids.ts](src/utils/ids.ts#L1-L3)):

```typescript
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Usage: generateId("own") → "own_1709817600000_a3x9k"
```

Prefixes used: `"sess"`, `"own"`, `"item"`, `"toast"`

### 5. Owner Status & PDF Tracking

**Owner has status and PDF metadata** ([src/types/index.ts](src/types/index.ts#L26-L39)):

```typescript
export interface Owner {
  id: string;
  name: string;
  status: OwnerStatus; // "DRAFT" | "FINALISED"
  items: Item[];
  createdAt: string;
  updatedAt: string;
  pdf: OwnerPdfMeta; // Track if PDF needs regeneration
}

export interface OwnerPdfMeta {
  lastGeneratedAt: string | null;
  needsRegen: boolean; // Set to true when items change
}
```

**Auto-invalidation** when items change ([src/context/AppContext.tsx](src/context/AppContext.tsx#L112-L118)):

```tsx
case "ADD_ITEM":
  return {
    ...session,
    owners: session.owners.map((o) =>
      o.id === action.payload.ownerId
        ? {
            ...o,
            items: [...o.items, action.payload.item],
            pdf: { ...o.pdf, needsRegen: o.pdf.lastGeneratedAt !== null }
          }
        : o
    ),
  };
```

### 6. Validation & Error Messages

**Client-side validation in forms** ([src/pages/Session/OwnerEntryPage.tsx](src/pages/Session/OwnerEntryPage.tsx#L83-L92)):

```tsx
const validateItem = (): boolean => {
  const errs: Record<string, string> = {};
  if (!itemNo.trim()) errs.itemNo = "Item number is required";
  const c = parseInt(cartons);
  if (isNaN(c) || c < 1) errs.cartons = "Must be ≥ 1";
  const cbm = parseFloat(cbmPerCarton);
  if (isNaN(cbm) || cbm <= 0) errs.cbm = "Must be > 0";
  const price = parseFloat(pricePerCarton);
  if (isNaN(price) || price < 0) errs.price = "Must be ≥ 0";
  setItemErrors(errs);
  return Object.keys(errs).length === 0;
};
```

**Audit messages** ([src/utils/calculate.ts](src/utils/calculate.ts#L74-L88)):

```typescript
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
if (Math.abs(adjustment) > 0.05) {
  auditMessages.push(
    `Rounding adjustment of $${adjustment.toFixed(2)} applied to last owner.`,
  );
}
```

### 7. Confirmation Patterns

**In-place confirmation UI** ([src/components/session/OwnerCard.tsx](src/components/session/OwnerCard.tsx#L24-L39)):

```tsx
const [confirmDelete, setConfirmDelete] = useState(false);

if (confirmDelete) {
  return (
    <div className="bg-danger/5 border border-danger/30 rounded-xl p-4 animate-fade-in">
      <p className="text-sm text-gray-300 mb-3">
        Delete <span className="font-semibold text-white">"{owner.name}"</span>?
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
```

**BottomSheet for discard warnings** ([src/pages/Session/OwnerEntryPage.tsx](src/pages/Session/OwnerEntryPage.tsx#L200-L205)):

```tsx
<BottomSheet
  open={showDiscard}
  onClose={() => setShowDiscard(false)}
  title="Discard changes?"
>
  {/* ... */}
</BottomSheet>
```

---

## 🎨 Tailwind CSS v4 Usage

### Migration to v4 @theme

**Uses Tailwind CSS v4** with new `@theme` directive ([src/index.css](src/index.css#L1-L60)):

```css
@import "tailwindcss";

@theme {
  --color-surface: #0f172a;
  --color-surface-card: #1e293b;
  --color-surface-elevated: #293548;
  --color-surface-input: #1e293b;
  --color-brand: #3b82f6;
  --color-brand-dark: #2563eb;
  --color-brand-dim: rgba(59, 130, 246, 0.12);
  /* ... */
}
```

**Also defined in tailwind.config.ts** (compatibility layer?) ([tailwind.config.ts](tailwind.config.ts#L7-L25))

### Custom Design Tokens

| Token              | Value                   | Usage                  |
| ------------------ | ----------------------- | ---------------------- |
| `surface`          | `#0F172A`               | App background         |
| `surface-card`     | `#1E293B`               | Card backgrounds       |
| `surface-elevated` | `#293548`               | Hover states           |
| `brand`            | `#3B82F6`               | Primary blue           |
| `brand-dim`        | `rgba(59,130,246,0.12)` | Brand with 12% opacity |
| `success`          | `#10B981`               | Green for finalised    |
| `warning`          | `#F59E0B`               | Orange for warnings    |
| `danger`           | `#EF4444`               | Red for errors         |

### Custom Animations

**Defined in @theme** ([src/index.css](src/index.css#L20-L60)):

```css
--animate-slide-up: slideUp 0.3s ease-out;
--animate-fade-in: fadeIn 0.2s ease-out;
--animate-toast-in: toastIn 0.3s ease-out;
--animate-toast-out: toastOut 0.3s ease-in forwards;
```

**Usage in classes:**

```tsx
className = "animate-slide-up"; // BottomSheet entrance
className = "animate-fade-in"; // Toast/Card entrance
className = "animate-toast-out"; // Toast exit
```

### Custom Fonts

**Inter + JetBrains Mono** ([index.html](index.html#L14-L17), [src/index.css](src/index.css#L17-L18)):

```css
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

**Usage:**

- `font-sans` — All body text (default)
- `font-mono` — Numeric values: `className="font-mono text-sm"`

### Scrollbar Styling

**Custom dark scrollbars** ([src/index.css](src/index.css#L76-L92)):

```css
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
```

### Dynamic Viewport Height

**Uses `100dvh`** for mobile compatibility ([src/index.css](src/index.css#L67)):

```css
body {
  min-height: 100dvh;
}
```

### Utility Class Patterns

**Consistent spacing:**

- Card padding: `p-5` (20px)
- Page padding: `px-4` (16px horizontal)
- Gap between cards: `space-y-4` or `gap-4`

**Container pattern:**

```tsx
<div className="px-4 max-w-2xl mx-auto py-4 space-y-4">
```

**Touch-friendly heights:**

- Button: `h-11` (sm), `h-[52px]` (lg)
- Input: `h-[52px]`

---

## 📱 PWA Configuration

### Vite PWA Plugin

**Setup** in [vite.config.ts](vite.config.ts#L12-L39):

```typescript
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["icon-192.png", "icon-512.png"],
  manifest: {
    name: "ContainerShare",
    short_name: "ContainerShare",
    description: "Groupage container freight calculator",
    theme_color: "#0F172A",
    background_color: "#0F172A",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    runtimeCaching: [
      /* Google Fonts caching */
    ],
  },
});
```

### Manifest Settings

- **Display mode:** `standalone` (hides browser chrome)
- **Orientation:** `portrait` (mobile-first)
- **Theme color:** `#0F172A` (dark blue)

### Icons

**Required files:**

- `public/icon-192.png` (192×192)
- `public/icon-512.png` (512×512)

### HashRouter for PWA

**Uses `HashRouter`** instead of `BrowserRouter` ([src/main.tsx](src/main.tsx#L9)):

```tsx
<HashRouter>  {/* Not BrowserRouter — PWA compat */}
```

**Why:** Avoids 404s on direct access in PWA context where server routing isn't available.

### Viewport Meta

**Mobile-optimized** ([index.html](index.html#L8-L10)):

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
<meta name="theme-color" content="#0F172A" />
```

### Service Worker

**Auto-update strategy:** Service worker auto-updates on new versions without user prompt.

---

## 🛠️ Build & Development Commands

### Available Scripts

From [package.json](package.json#L6-L10):

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start Vite dev server (default port 5173)  |
| `npm run build`   | TypeScript compile + Vite production build |
| `npm run lint`    | Run ESLint on codebase                     |
| `npm run preview` | Preview production build locally           |

### Key Dependencies

**Core** ([package.json](package.json#L11-L17)):

- `react@19.2.0` + `react-dom@19.2.0`
- `react-router-dom@7.13.1`
- `lucide-react@0.577.0` (icons)
- `jspdf@4.2.0` + `jspdf-autotable@5.0.7` (PDF generation)

**Dev** ([package.json](package.json#L18-L32)):

- `vite@7.3.1`
- `tailwindcss@4.2.1` + `@tailwindcss/postcss@4.2.1` (Tailwind v4!)
- `typescript@5.9.3`
- `vite-plugin-pwa@1.2.0`

### ESLint Configuration

**Flat config** ([eslint.config.js](eslint.config.js)):

```javascript
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
  },
]);
```

### TypeScript Project Structure

**Composite project** ([tsconfig.json](tsconfig.json#L3-L5)):

```jsonc
{
  "references": [
    { "path": "./tsconfig.app.json" }, // Main app config
    { "path": "./tsconfig.node.json" }, // Vite config
  ],
}
```

---

## 📝 Quick Reference

### Icon Library

**Only use lucide-react** ([package.json](package.json#L14)):

```tsx
import { Plus, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
```

### Formatting Functions

Always use utility functions for display:

```typescript
import {
  formatUSD,
  formatCBM,
  formatPercent,
  formatDate,
} from "@/utils/format";

formatUSD(1234.56); // "$1,234.56"
formatCBM(15.1234); // "15.1234 CBM"
formatPercent(45.67); // "45.67%"
formatDate("2026-03-07"); // "7 March 2026" (en-NG locale)
```

### Common Patterns

**Get active session:**

```tsx
const { state } = useApp();
const { id } = useParams<{ id: string }>();
const session = state.sessions.find((s) => s.id === id);
```

**Dispatch with toast:**

```tsx
const { dispatch } = useApp();
const { addToast } = useToast();

dispatch({ type: "UPDATE_OWNER", payload: { sessionId, owner } });
addToast("Owner updated successfully", "success");
```

**Compute freight:**

```tsx
import { computeOwner, computeSession } from "@/utils/calculate";

const ownerComputed = computeOwner(owner, session);
const sessionComputed = computeSession(session);
```

---

## 🎯 Summary

ContainerShare PWA is a **mobile-first, offline-capable** freight calculator with:

- **React 19 + TypeScript** with strict mode
- **Context + useReducer** for state management (no Redux/Zustand)
- **Tailwind CSS v4** with `@theme` directive
- **jsPDF** for dark-themed invoice generation
- **localStorage** with auto-save draft mechanism
- **PWA** with offline support via Vite PWA plugin
- **HashRouter** for PWA compatibility
- **lucide-react** for icons (no other icon libraries)
- **Critical business logic:** Freight allocation with **last-owner rounding adjustment** to ensure exact totals

All computation happens client-side with no backend — fully functional offline after first load.

---

**End of Documentation**
