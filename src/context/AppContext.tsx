import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import type { AppState, AppAction, Session } from "@/types";
import { OwnerStatus } from "@/types";
import {
  loadSessions,
  saveSession,
  deleteSession,
  saveDraft,
} from "@/utils/storage";

const initialState: AppState = {
  sessions: [],
  activeSessionId: null,
  activeOwnerId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_SESSIONS":
      return { ...state, sessions: action.payload };

    case "CREATE_SESSION":
    case "UPDATE_SESSION": {
      const next = saveSession(action.payload, state.sessions);
      return { ...state, sessions: next };
    }

    case "DELETE_SESSION": {
      const next = deleteSession(action.payload, state.sessions);
      return { ...state, sessions: next, activeSessionId: null };
    }

    case "SET_ACTIVE_SESSION":
      return { ...state, activeSessionId: action.payload };

    case "SET_ACTIVE_OWNER":
      return { ...state, activeOwnerId: action.payload };

    case "ADD_OWNER":
    case "UPDATE_OWNER":
    case "DELETE_OWNER":
    case "FINALISE_OWNER":
    case "ADD_ITEM":
    case "UPDATE_ITEM":
    case "DELETE_ITEM": {
      const updated = mutateSessions(state.sessions, action);
      const sid = getSessionIdFromAction(action);
      if (sid) {
        const targetSession = updated.find((s) => s.id === sid);
        if (targetSession) saveSession(targetSession, updated);
      }
      return { ...state, sessions: updated };
    }

    default:
      return state;
  }
}

function mutateSessions(sessions: Session[], action: AppAction): Session[] {
  return sessions.map((session) => {
    const sid = getSessionIdFromAction(action);
    if (!sid || session.id !== sid) return session;

    const now = new Date().toISOString();

    switch (action.type) {
      case "ADD_OWNER":
        return {
          ...session,
          owners: [...session.owners, action.payload.owner],
          updatedAt: now,
        };

      case "UPDATE_OWNER":
        return {
          ...session,
          owners: session.owners.map((o) =>
            o.id === action.payload.owner.id
              ? { ...action.payload.owner, updatedAt: now }
              : o,
          ),
          updatedAt: now,
        };

      case "DELETE_OWNER":
        return {
          ...session,
          owners: session.owners.filter((o) => o.id !== action.payload.ownerId),
          updatedAt: now,
        };

      case "FINALISE_OWNER":
        return {
          ...session,
          owners: session.owners.map((o) =>
            o.id === action.payload.ownerId
              ? { ...o, status: OwnerStatus.FINALISED, updatedAt: now }
              : o,
          ),
          updatedAt: now,
        };

      case "ADD_ITEM":
        return {
          ...session,
          owners: session.owners.map((o) =>
            o.id === action.payload.ownerId
              ? {
                  ...o,
                  items: [...o.items, action.payload.item],
                  updatedAt: now,
                  pdf: { ...o.pdf, needsRegen: o.pdf.lastGeneratedAt !== null },
                }
              : o,
          ),
          updatedAt: now,
        };

      case "UPDATE_ITEM":
        return {
          ...session,
          owners: session.owners.map((o) =>
            o.id === action.payload.ownerId
              ? {
                  ...o,
                  items: o.items.map((i) =>
                    i.id === action.payload.item.id ? action.payload.item : i,
                  ),
                  updatedAt: now,
                  pdf: { ...o.pdf, needsRegen: o.pdf.lastGeneratedAt !== null },
                }
              : o,
          ),
          updatedAt: now,
        };

      case "DELETE_ITEM":
        return {
          ...session,
          owners: session.owners.map((o) =>
            o.id === action.payload.ownerId
              ? {
                  ...o,
                  items: o.items.filter((i) => i.id !== action.payload.itemId),
                  updatedAt: now,
                  pdf: { ...o.pdf, needsRegen: o.pdf.lastGeneratedAt !== null },
                }
              : o,
          ),
          updatedAt: now,
        };

      default:
        return session;
    }
  });
}

function getSessionIdFromAction(action: AppAction): string | null {
  if (
    "payload" in action &&
    action.payload &&
    typeof action.payload === "object" &&
    "sessionId" in action.payload
  ) {
    return (action.payload as { sessionId: string }).sessionId;
  }
  return null;
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const sessions = loadSessions();
    dispatch({ type: "LOAD_SESSIONS", payload: sessions });
  }, []);

  useEffect(() => {
    if (state.activeSessionId) {
      const active = state.sessions.find((s) => s.id === state.activeSessionId);
      if (active) saveDraft(active);
    }
  }, [state.sessions, state.activeSessionId]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
