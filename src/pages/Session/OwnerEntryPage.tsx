import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowRight, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { generateId } from "@/utils/ids";
import { computeItem } from "@/utils/calculate";
import { formatUSD } from "@/utils/format";
import { OwnerStatus } from "@/types";
import type { Item, Owner } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ItemRow } from "@/components/session/ItemRow";
import { OwnerTotalsCard } from "@/components/session/OwnerTotalsCard";

export function OwnerEntryPage() {
  const { id, ownerId } = useParams<{ id: string; ownerId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { addToast } = useToast();

  const session = state.sessions.find((s) => s.id === id);
  const existingOwner = ownerId
    ? session?.owners.find((o) => o.id === ownerId)
    : null;
  const isEdit = !!existingOwner;

  const [ownerName, setOwnerName] = useState(existingOwner?.name || "");
  const [items, setItems] = useState<Item[]>(existingOwner?.items || []);

  // Item form state
  const [itemNo, setItemNo] = useState("");
  const [cartons, setCartons] = useState("");
  const [cbmPerCarton, setCbmPerCarton] = useState("");
  const [pricePerCarton, setPricePerCarton] = useState("");
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const itemNoRef = useRef<HTMLInputElement>(null);

  // Sync from existing owner when it loads
  useEffect(() => {
    if (existingOwner) {
      setOwnerName(existingOwner.name);
      setItems(existingOwner.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-400">Session not found</div>
    );
  }

  // Build a temporary session with current items for live preview
  const tempOwner: Owner = {
    id: existingOwner?.id || "temp",
    name: ownerName || "New Owner",
    status: OwnerStatus.DRAFT,
    items,
    createdAt: existingOwner?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pdf: existingOwner?.pdf || { lastGeneratedAt: null, needsRegen: false },
  };

  const tempSession = {
    ...session,
    owners: existingOwner
      ? session.owners.map((o) => (o.id === existingOwner.id ? tempOwner : o))
      : [...session.owners, tempOwner],
  };

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

  const checkDuplicate = (): boolean => {
    const dup = items.find(
      (i) => i.itemNo.toLowerCase() === itemNo.trim().toLowerCase(),
    );
    if (dup) {
      setDupWarning(itemNo.trim());
      return true;
    }
    return false;
  };

  const addItem = () => {
    if (!validateItem()) return;

    const newItem: Item = {
      id: generateId("item"),
      itemNo: itemNo.trim(),
      cartons: parseInt(cartons),
      cbmPerCarton: parseFloat(cbmPerCarton),
      pricePerCartonUSD: parseFloat(pricePerCarton),
    };
    setItems((prev) => [...prev, newItem]);
    clearItemForm();
    setDupWarning(null);
    itemNoRef.current?.focus();
  };

  const handleAddItem = () => {
    if (!validateItem()) return;
    if (checkDuplicate()) return;
    addItem();
  };

  const handleAddAnyway = () => {
    addItem();
  };

  const clearItemForm = () => {
    setItemNo("");
    setCartons("");
    setCbmPerCarton("");
    setPricePerCarton("");
    setItemErrors({});
    setDupWarning(null);
  };

  const handleUpdateItem = (updatedItem: Item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSaveAndReview = () => {
    if (!ownerName.trim()) {
      addToast("Please enter an owner name", "warning");
      return;
    }
    if (items.length === 0) {
      addToast("Please add at least one item", "warning");
      return;
    }

    const now = new Date().toISOString();
    const owner: Owner = {
      id: existingOwner?.id || generateId("own"),
      name: ownerName.trim(),
      status: existingOwner?.status || OwnerStatus.DRAFT,
      items,
      createdAt: existingOwner?.createdAt || now,
      updatedAt: now,
      pdf: existingOwner?.pdf || { lastGeneratedAt: null, needsRegen: false },
    };

    if (isEdit) {
      dispatch({
        type: "UPDATE_OWNER",
        payload: { sessionId: session.id, owner },
      });
    } else {
      dispatch({
        type: "ADD_OWNER",
        payload: { sessionId: session.id, owner },
      });
    }

    addToast("Freight shares recalculated for all owners ✓", "success");
    navigate(`/sessions/${session.id}/owners/${owner.id}/review`);
  };

  const handleCancel = () => {
    if (items.length > 0 && !isEdit) {
      setShowDiscard(true);
    } else {
      navigate(`/sessions/${session.id}/owners`);
    }
  };

  // Computed totals for live table
  const computedItems = items.map(computeItem);
  const totalCartons = computedItems.reduce((s, i) => s + i.cartons, 0);
  const totalCBM = computedItems.reduce((s, i) => s + i.totalCBM, 0);
  const totalUSD = computedItems.reduce((s, i) => s + i.totalUSD, 0);

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit: ${existingOwner.name}` : "Add Owner"}
        backTo={`/sessions/${session.id}/owners`}
      />

      <div className="px-4 max-w-2xl mx-auto py-4 space-y-5">
        {/* Owner Name */}
        <Input
          label="Owner Name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="e.g. Fatima Bello"
          className="text-lg! font-semibold!"
        />

        {/* Item Entry Form */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Add Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                ref={itemNoRef}
                label="Item No. / Description"
                value={itemNo}
                onChange={(e) => {
                  setItemNo(e.target.value);
                  setDupWarning(null);
                }}
                placeholder="e.g. ITEM-001"
                error={itemErrors.itemNo}
                tooltip="A reference code, e.g. ITEM-001 or 'Phone Chargers'"
              />
            </div>
            <Input
              label="Number of Cartons"
              type="number"
              value={cartons}
              onChange={(e) => setCartons(e.target.value)}
              placeholder="e.g. 5"
              error={itemErrors.cartons}
            />
            <Input
              label="CBM per Carton"
              type="number"
              step="0.0001"
              value={cbmPerCarton}
              onChange={(e) => setCbmPerCarton(e.target.value)}
              placeholder="e.g. 0.0500"
              error={itemErrors.cbm}
              tooltip="Volume of one carton in cubic meters."
            />
            <div className="col-span-2">
              <Input
                label="Price per Carton (USD)"
                type="number"
                step="0.01"
                value={pricePerCarton}
                onChange={(e) => setPricePerCarton(e.target.value)}
                placeholder="e.g. 80.00"
                error={itemErrors.price}
                tooltip="Cost of one carton in US dollars."
              />
            </div>
          </div>

          {/* Duplicate warning */}
          {dupWarning && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-xl animate-fade-in">
              <AlertTriangle
                size={16}
                className="text-warning shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm text-warning">
                  Item No. "{dupWarning}" already exists for this owner.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setDupWarning(null)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Edit Existing
                  </button>
                  <button
                    onClick={handleAddAnyway}
                    className="text-xs text-warning hover:text-white transition-colors font-medium"
                  >
                    Add Anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button
              size="md"
              fullWidth
              icon={<Plus size={16} />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </div>
        </Card>

        {/* Live Item Table */}
        {items.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-white/6">
            <table className="w-full text-left min-w-160">
              <thead>
                <tr className="bg-surface-elevated/50 text-[10px] text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5 font-medium">#</th>
                  <th className="px-2 py-2.5 font-medium">Item No</th>
                  <th className="px-2 py-2.5 font-medium text-right">Ctns</th>
                  <th className="px-2 py-2.5 font-medium text-right">
                    CBM/Ctn
                  </th>
                  <th className="px-2 py-2.5 font-medium text-right">
                    Tot. CBM
                  </th>
                  <th className="px-2 py-2.5 font-medium text-right">
                    Price/Ctn
                  </th>
                  <th className="px-2 py-2.5 font-medium text-right">
                    Tot. Price
                  </th>
                  <th className="px-2 py-2.5 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {items.map((item, idx) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={idx}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-success/5 border-t border-success/20">
                  <td className="px-3 py-3 text-xs font-bold text-success">
                    Σ
                  </td>
                  <td className="px-2 py-3 text-xs text-success font-semibold">
                    TOTALS
                  </td>
                  <td className="px-2 py-3 font-mono text-sm text-success text-right font-bold">
                    {totalCartons}
                  </td>
                  <td className="px-2 py-3"></td>
                  <td className="px-2 py-3 font-mono text-sm text-success text-right font-bold">
                    {totalCBM.toFixed(4)}
                  </td>
                  <td className="px-2 py-3"></td>
                  <td className="px-2 py-3 font-mono text-sm text-success text-right font-bold">
                    {formatUSD(totalUSD)}
                  </td>
                  <td className="px-2 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Live Owner Summary */}
        {items.length > 0 && (
          <OwnerTotalsCard owner={tempOwner} session={tempSession} />
        )}

        {/* Bottom buttons */}
        <div className="flex gap-3 pt-4 pb-8">
          <Button
            variant="ghost"
            size="lg"
            className="flex-1"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="flex-1"
            icon={<ArrowRight size={18} />}
            onClick={handleSaveAndReview}
            disabled={!ownerName.trim() || items.length === 0}
          >
            Review Owner
          </Button>
        </div>
      </div>

      {/* Discard confirmation */}
      <BottomSheet
        open={showDiscard}
        onClose={() => setShowDiscard(false)}
        title="Discard Changes?"
      >
        <p className="text-sm text-gray-300 mb-4">
          You have unsaved items. Are you sure you want to discard?
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setShowDiscard(false)}
          >
            Stay
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => navigate(`/sessions/${session.id}/owners`)}
          >
            Discard
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
