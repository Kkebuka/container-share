import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { generateId } from "@/utils/ids";
import type { Session } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function SessionSetupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { addToast } = useToast();

  const existing = id ? state.sessions.find((s) => s.id === id) : null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || "");
  const [date, setDate] = useState(
    existing?.date || new Date().toISOString().split("T")[0],
  );
  const [freightUSD, setFreightUSD] = useState(
    existing?.constants.freightUSD.toString() || "",
  );
  const [containerCBM, setContainerCBM] = useState(
    existing?.constants.containerCBM.toString() || "",
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync from existing session when it loads
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDate(existing.date);
      setFreightUSD(existing.constants.freightUSD.toString());
      setContainerCBM(existing.constants.containerCBM.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasOwners = (existing?.owners.length ?? 0) > 0;
  const constantsChanged =
    existing &&
    (parseFloat(freightUSD) !== existing.constants.freightUSD ||
      parseFloat(containerCBM) !== existing.constants.containerCBM);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!date) errs.date = "Date is required";
    const freight = parseFloat(freightUSD);
    if (isNaN(freight) || freight < 0)
      errs.freight = "Enter a valid freight cost (≥ 0)";
    const cbm = parseFloat(containerCBM);
    if (isNaN(cbm) || cbm <= 0)
      errs.cbm = "Enter a valid container capacity (> 0)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date().toISOString();
    const sessionName =
      name.trim() ||
      `Session · ${new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`;

    const session: Session = {
      id: existing?.id || generateId("ses"),
      name: sessionName,
      date,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      constants: {
        freightUSD: parseFloat(freightUSD),
        containerCBM: parseFloat(containerCBM),
      },
      owners:
        existing?.owners.map((o) =>
          constantsChanged
            ? {
                ...o,
                pdf: { ...o.pdf, needsRegen: o.pdf.lastGeneratedAt !== null },
              }
            : o,
        ) || [],
    };

    dispatch({
      type: isEdit ? "UPDATE_SESSION" : "CREATE_SESSION",
      payload: session,
    });

    if (isEdit && constantsChanged && hasOwners) {
      addToast(
        "Session updated — freight recalculated for all owners",
        "warning",
      );
    } else {
      addToast(isEdit ? "Session updated" : "Session created", "success");
    }

    navigate(`/sessions/${session.id}/owners`);
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Session" : "New Session"}
        backTo={isEdit ? `/sessions/${id}/owners` : "/sessions"}
      />

      <form
        onSubmit={handleSubmit}
        className="px-4 max-w-2xl mx-auto py-6 space-y-5"
      >
        {/* Edit warning */}
        {isEdit && hasOwners && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl animate-fade-in">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-warning font-semibold">
                This session has {existing?.owners.length} owner(s)
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Changing freight or allocation basis will recalculate all
                freight shares. Previously downloaded PDFs will be outdated.
              </p>
            </div>
          </div>
        )}

        <Input
          label="Session Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lagos March Shipment"
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />

        <Input
          label="Total Freight Cost (USD)"
          type="number"
          step="0.01"
          value={freightUSD}
          onChange={(e) => setFreightUSD(e.target.value)}
          placeholder="e.g. 3500"
          error={errors.freight}
          tooltip="This is the actual freight cost for all goods being shipped. It is NOT a container hire charge. Every owner pays their proportional share."
        />

        <Input
          label="Container Invoice CBM"
          type="number"
          step="0.0001"
          value={containerCBM}
          onChange={(e) => setContainerCBM(e.target.value)}
          placeholder="e.g. 28"
          error={errors.cbm}
          tooltip="Total CBM from the container invoice - used as the basis for proportional freight allocation among traders."
        />

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            fullWidth
            icon={<ArrowRight size={18} />}
          >
            {isEdit ? "Save Changes" : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
