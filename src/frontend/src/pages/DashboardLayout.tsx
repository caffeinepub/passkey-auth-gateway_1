import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Shield,
  LogOut,
  LayoutDashboard,
  Webhook,
  Settings as SettingsIcon,
  CreditCard,
  Gauge,
  BookOpen,
  ScrollText,
  Menu,
} from "lucide-react";
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

// ─── Nav Item Definition ──────────────────────────────────────────────────────

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

// ─── Sidebar Nav Content ──────────────────────────────────────────────────────

interface SidebarNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  tenantName?: string;
  userRole?: string;
  onLogout: () => void;
}

function SidebarNav({
  currentPage,
  onNavigate,
  tenantName,
  userRole,
  onLogout,
}: SidebarNavProps) {
  const mainNavItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "webhooks", label: "Webhooks", icon: <Webhook className="w-4 h-4" /> },
    { id: "docs", label: "Docs", icon: <BookOpen className="w-4 h-4" /> },
    { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  ];

  if (userRole !== "Viewer") {
    mainNavItems.push({
      id: "settings",
      label: "Settings",
      icon: <SettingsIcon className="w-4 h-4" />,
    });
  }

  const adminNavItems: NavItem[] = [];
  if (userRole === "Admin") {
    adminNavItems.push(
      { id: "cycles", label: "Cycles", icon: <Gauge className="w-4 h-4" /> },
      { id: "audit", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> }
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-base leading-tight">Avantkey</p>
            {tenantName && (
              <p className="text-xs text-muted-foreground font-mono truncate leading-tight mt-0.5">
                {tenantName}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Main navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === item.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Admin section */}
        {adminNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                System
              </p>
            </div>
            {adminNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Logout area */}
      <div className="px-3 pb-4">
        <Separator className="mb-3" />
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: tenant, error: tenantError } = useGetCurrentTenant();
  const { data: userRole } = useGetUserRole();
  const { data: cycleBalance } = useGetCycleBalance();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleRetryConnection = async () => {
    await queryClient.invalidateQueries();
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    clear();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card h-screen sticky top-0 overflow-y-auto">
        <SidebarNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
          tenantName={tenant?.name}
          userRole={userRole}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Main Panel ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-4 h-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarNav
                currentPage={currentPage}
                onNavigate={handleNavigate}
                tenantName={tenant?.name}
                userRole={userRole}
                onLogout={handleLogout}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-sm">Avantkey</span>
          </div>

          {/* Spacer to keep logo centered */}
          <div className="w-8" />
        </div>

        {/* Banners */}
        {showOfflineBanner && <OfflineBanner onRetry={handleRetryConnection} />}
        {userRole === "Admin" && cycleBalance && (
          <CycleWarningBanner
            cycleBalance={cycleBalance}
            onViewDetails={() => handleNavigate("cycles")}
          />
        )}

        {/* Page content */}
        <main
          className={`flex-1 ${
            currentPage === "docs" ? "" : "container mx-auto px-6 py-8"
          }`}
        >
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
        <footer className="border-t border-border py-5 mt-auto">
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
    </div>
  );
}
