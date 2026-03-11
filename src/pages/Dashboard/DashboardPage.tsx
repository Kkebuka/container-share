import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Container, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { isStorageAvailable, loadDraft, clearDraft } from "@/utils/storage";
import { generateId } from "@/utils/ids";
import type { Session } from "@/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SessionCard } from "@/components/session/SessionCard";

export function DashboardPage() {
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [storageAvail] = useState(() => isStorageAvailable());
  const [draftRestore, setDraftRestore] = useState<Session | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  // Check for draft recovery on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && !state.sessions.find((s) => s.id === draft.id)) {
      setDraftRestore(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleRestoreDraft = () => {
    if (draftRestore) {
      dispatch({ type: "CREATE_SESSION", payload: draftRestore });
      clearDraft();
      setDraftRestore(null);
      addToast("Draft session restored", "success");
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftRestore(null);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_SESSION", payload: id });
    addToast("Session deleted", "success");
  };

  const handleDuplicate = (session: Session) => {
    const now = new Date().toISOString();
    const dup: Session = {
      ...session,
      id: generateId("ses"),
      name: `${session.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      owners: session.owners.map((o) => ({
        ...o,
        id: generateId("own"),
        createdAt: now,
        updatedAt: now,
        pdf: { lastGeneratedAt: null, needsRegen: false },
        items: o.items.map((i) => ({ ...i, id: generateId("item") })),
      })),
    };
    dispatch({ type: "CREATE_SESSION", payload: dup });
    addToast("Session duplicated", "success");
  };

  const handleInstall = async () => {
    if (installPrompt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (installPrompt as any).prompt();
      setInstallPrompt(null);
    }
  };

  const sorted = [...state.sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/6">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Container size={22} className="text-brand" />
            <h1 className="text-lg font-bold bg-linear-to-r from-brand to-blue-400 bg-clip-text text-transparent">
              ContainerShare
            </h1>
          </div>
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => navigate("/sessions/new")}
          >
            New Session
          </Button>
        </div>
      </header>

      <div className="px-4 max-w-2xl mx-auto py-4 space-y-4">
        {/* Storage warning */}
        {!storageAvail && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-warning font-semibold">
                Local storage is unavailable
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Data will not be saved. Try opening in a regular browser window.
              </p>
            </div>
          </div>
        )}

        {/* Install banner */}
        {installPrompt && (
          <div className="flex items-center justify-between p-4 bg-brand-dim border border-brand/20 rounded-xl">
            <div>
              <p className="text-sm text-white font-medium">
                Install ContainerShare
              </p>
              <p className="text-xs text-gray-400">Use offline as an app</p>
            </div>
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
          </div>
        )}

        {/* Sessions list */}
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Container size={28} className="text-gray-600" />}
            title="No sessions yet"
            description="Create a session to start splitting a shared container across traders."
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={() => navigate("/sessions/new")}
              >
                New Session
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {sorted.length} session{sorted.length !== 1 ? "s" : ""}
            </p>
            {sorted.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Draft restore sheet */}
      <BottomSheet
        open={draftRestore !== null}
        onClose={handleDiscardDraft}
        title="Unsaved Session Found"
      >
        <p className="text-sm text-gray-300 mb-4">
          You have an unsaved session draft:{" "}
          <span className="font-semibold text-white">
            "{draftRestore?.name}"
          </span>
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={handleDiscardDraft}>
            Discard
          </Button>
          <Button fullWidth onClick={handleRestoreDraft}>
            Restore
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
