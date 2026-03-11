import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "@/components/ui/Toast";
import { BottomNav } from "@/components/layout/BottomNav";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage";
import { SessionSetupPage } from "@/pages/Session/SessionSetupPage";
import { OwnerHubPage } from "@/pages/Session/OwnerHubPage";
import { OwnerEntryPage } from "@/pages/Session/OwnerEntryPage";
import { OwnerReviewPage } from "@/pages/Session/OwnerReviewPage";
import { SessionReportPage } from "@/pages/Session/SessionReportPage";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <div className="min-h-dvh bg-surface text-white flex flex-col">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<DashboardPage />} />
          <Route path="/sessions/new" element={<SessionSetupPage />} />
          <Route path="/sessions/:id/setup" element={<SessionSetupPage />} />
          <Route path="/sessions/:id/owners" element={<OwnerHubPage />} />
          <Route path="/sessions/:id/owners/new" element={<OwnerEntryPage />} />
          <Route
            path="/sessions/:id/owners/:ownerId/edit"
            element={<OwnerEntryPage />}
          />
          <Route
            path="/sessions/:id/owners/:ownerId/review"
            element={<OwnerReviewPage />}
          />
          <Route path="/sessions/:id/report" element={<SessionReportPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
