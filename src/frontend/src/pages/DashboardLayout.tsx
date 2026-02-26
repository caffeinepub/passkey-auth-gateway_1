import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, LayoutDashboard, Webhook, Settings as SettingsIcon, CreditCard, Gauge, BookOpen, ScrollText } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCurrentTenant, useGetUserRole, useGetCycleBalance } from "../hooks/useQueries";
import Dashboard from "./Dashboard";
import Webhooks from "./Webhooks";
import Billing from "./Billing";
import Settings from "./Settings";
import CyclesPage from "./CyclesPage";
import AuditLog from "./AuditLog";
import Docs from "./Docs";
import CycleWarningBanner from "../components/CycleWarningBanner";
import { OfflineBanner } from "../components/OfflineBanner";
import { useQueryClient } from "@tanstack/react-query";

type Page = "dashboard" | "webhooks" | "billing" | "settings" | "cycles" | "audit" | "docs";

export default function DashboardLayout() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: tenant, error: tenantError } = useGetCurrentTenant();
  const { data: userRole } = useGetUserRole();
  const { data: cycleBalance } = useGetCycleBalance();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Detect if backend is offline by checking tenant error
  useEffect(() => {
    if (tenantError) {
      const errorMessage = tenantError instanceof Error ? tenantError.message : String(tenantError);
      const isOffline =
        errorMessage.toLowerCase().includes("not initialized") ||
        errorMessage.toLowerCase().includes("canister is stopped") ||
        errorMessage.toLowerCase().includes("connection") ||
        errorMessage.toLowerCase().includes("network");
      setShowOfflineBanner(isOffline);
    } else {
      setShowOfflineBanner(false);
    }
  }, [tenantError]);

  // Handle retry connection
  const handleRetryConnection = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Offline Banner */}
      {showOfflineBanner && <OfflineBanner onRetry={handleRetryConnection} />}

      {/* Cycle Warning Banner - Admin Only */}
      {userRole === "Admin" && cycleBalance && (
        <CycleWarningBanner
          cycleBalance={cycleBalance}
          onViewDetails={() => setCurrentPage("cycles")}
        />
      )}

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              type="button"
              onClick={clear}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-display font-semibold text-lg">
                  Avantkey
                </h1>
                {tenant && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {tenant.name}
                  </p>
                )}
              </div>
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2 ml-8">
              <Button
                variant={currentPage === "dashboard" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("dashboard")}
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
              <Button
                variant={currentPage === "webhooks" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("webhooks")}
                className="gap-2"
              >
                <Webhook className="w-4 h-4" />
                Webhooks
              </Button>
              <Button
                variant={currentPage === "docs" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("docs")}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Docs
              </Button>
              <Button
                variant={currentPage === "billing" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("billing")}
                className="gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </Button>
              {userRole === "Admin" && (
                <Button
                  variant={currentPage === "cycles" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage("cycles")}
                  className="gap-2"
                >
                  <Gauge className="w-4 h-4" />
                  Cycles
                </Button>
              )}
              {userRole === "Admin" && (
                <Button
                  variant={currentPage === "audit" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage("audit")}
                  className="gap-2"
                >
                  <ScrollText className="w-4 h-4" />
                  Audit Log
                </Button>
              )}
              {userRole !== "Viewer" && (
                <Button
                  variant={currentPage === "settings" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage("settings")}
                  className="gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </Button>
              )}
            </nav>
          </div>

          <Button variant="outline" onClick={clear} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-border">
          <div className="container mx-auto px-6 py-2 flex gap-2 overflow-x-auto">
            <Button
              variant={currentPage === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("dashboard")}
              className="gap-2 flex-1 min-w-fit"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              variant={currentPage === "webhooks" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("webhooks")}
              className="gap-2 flex-1 min-w-fit"
            >
              <Webhook className="w-4 h-4" />
              Webhooks
            </Button>
            <Button
              variant={currentPage === "docs" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("docs")}
              className="gap-2 flex-1 min-w-fit"
            >
              <BookOpen className="w-4 h-4" />
              Docs
            </Button>
            <Button
              variant={currentPage === "billing" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("billing")}
              className="gap-2 flex-1 min-w-fit"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </Button>
            {userRole === "Admin" && (
              <Button
                variant={currentPage === "cycles" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("cycles")}
                className="gap-2 flex-1 min-w-fit"
              >
                <Gauge className="w-4 h-4" />
                Cycles
              </Button>
            )}
            {userRole === "Admin" && (
              <Button
                variant={currentPage === "audit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("audit")}
                className="gap-2 flex-1 min-w-fit"
              >
                <ScrollText className="w-4 h-4" />
                Audit Log
              </Button>
            )}
            {userRole !== "Viewer" && (
              <Button
                variant={currentPage === "settings" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("settings")}
                className="gap-2 flex-1 min-w-fit"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${currentPage === "docs" ? "" : "container mx-auto px-6 py-8"}`}>
        {currentPage === "dashboard" ? (
          <Dashboard />
        ) : currentPage === "webhooks" ? (
          <Webhooks />
        ) : currentPage === "billing" ? (
          <Billing />
        ) : currentPage === "cycles" ? (
          <CyclesPage />
        ) : currentPage === "audit" ? (
          <AuditLog />
        ) : currentPage === "docs" ? (
          <Docs />
        ) : (
          <Settings />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026. Built with love using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
