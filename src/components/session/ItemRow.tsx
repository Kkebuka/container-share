import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Item } from "@/types";
import { computeItem } from "@/utils/calculate";
import { formatUSD } from "@/utils/format";

interface ItemRowProps {
  item: Item;
  index: number;
  onUpdate: (item: Item) => void;
  onDelete: (itemId: string) => void;
}

export function ItemRow({ item, index, onUpdate, onDelete }: ItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editValues, setEditValues] = useState({
    itemNo: item.itemNo,
    cartons: item.cartons.toString(),
    cbmPerCarton: item.cbmPerCarton.toString(),
    pricePerCartonUSD: item.pricePerCartonUSD.toString(),
  });

  const computed = computeItem(item);

  const handleSave = () => {
    const cartons = parseInt(editValues.cartons);
    const cbm = parseFloat(editValues.cbmPerCarton);
    const price = parseFloat(editValues.pricePerCartonUSD);
    if (
      !editValues.itemNo.trim() ||
      isNaN(cartons) ||
      cartons < 1 ||
      isNaN(cbm) ||
      cbm <= 0 ||
      isNaN(price) ||
      price < 0
    )
      return;

    onUpdate({
      ...item,
      itemNo: editValues.itemNo.trim(),
      cartons,
      cbmPerCarton: cbm,
      pricePerCartonUSD: price,
    });
    setEditing(false);
  };

  if (confirmDelete) {
    return (
      <tr className="bg-danger/5">
        <td colSpan={8} className="px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-300">
              Delete{" "}
              <span className="font-semibold text-white">"{item.itemNo}"</span>?
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-3 py-1.5 text-xs rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  if (editing) {
    return (
      <tr className="bg-brand/5 border-l-2 border-l-brand">
        <td className="px-3 py-2 font-mono text-xs text-gray-500">
          {index + 1}
        </td>
        <td className="px-2 py-2">
          <input
            className="w-full bg-surface-input border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:border-brand focus:outline-none"
            value={editValues.itemNo}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, itemNo: e.target.value }))
            }
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            className="w-20 bg-surface-input border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono text-right focus:border-brand focus:outline-none"
            value={editValues.cartons}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, cartons: e.target.value }))
            }
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            step="0.0001"
            className="w-24 bg-surface-input border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono text-right focus:border-brand focus:outline-none"
            value={editValues.cbmPerCarton}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, cbmPerCarton: e.target.value }))
            }
          />
        </td>
        <td className="px-2 py-2 font-mono text-xs text-gray-400 text-right">
          —
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            step="0.01"
            className="w-24 bg-surface-input border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white font-mono text-right focus:border-brand focus:outline-none"
            value={editValues.pricePerCartonUSD}
            onChange={(e) =>
              setEditValues((v) => ({
                ...v,
                pricePerCartonUSD: e.target.value,
              }))
            }
          />
        </td>
        <td className="px-2 py-2 font-mono text-xs text-gray-400 text-right">
          —
        </td>
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-white/2 transition-colors">
      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
        {index + 1}
      </td>
      <td className="px-2 py-2.5 text-sm text-white truncate max-w-30">
        {item.itemNo}
      </td>
      <td className="px-2 py-2.5 font-mono text-sm text-white text-right">
        {item.cartons}
      </td>
      <td className="px-2 py-2.5 font-mono text-sm text-white text-right">
        {item.cbmPerCarton.toFixed(4)}
      </td>
      <td className="px-2 py-2.5 font-mono text-sm text-white text-right">
        {computed.totalCBM.toFixed(4)}
      </td>
      <td className="px-2 py-2.5 font-mono text-sm text-white text-right">
        {formatUSD(item.pricePerCartonUSD)}
      </td>
      <td className="px-2 py-2.5 font-mono text-sm text-white text-right">
        {formatUSD(computed.totalUSD)}
      </td>
      <td className="px-2 py-2.5">
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditValues({
                itemNo: item.itemNo,
                cartons: item.cartons.toString(),
                cbmPerCarton: item.cbmPerCarton.toString(),
                pricePerCartonUSD: item.pricePerCartonUSD.toString(),
              });
              setEditing(true);
            }}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-danger/10 text-gray-500 hover:text-danger transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
