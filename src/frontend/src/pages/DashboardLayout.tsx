import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, LayoutDashboard, Webhook, Settings as SettingsIcon } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCurrentTenant, useGetUserRole } from "../hooks/useQueries";
import Dashboard from "./Dashboard";
import Webhooks from "./Webhooks";
import Settings from "./Settings";

type Page = "dashboard" | "webhooks" | "settings";

export default function DashboardLayout() {
  const { clear } = useInternetIdentity();
  const { data: tenant } = useGetCurrentTenant();
  const { data: userRole } = useGetUserRole();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={clear}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-display font-semibold text-lg">
                  PasskeyAuth
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
          <div className="container mx-auto px-6 py-2 flex gap-2">
            <Button
              variant={currentPage === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("dashboard")}
              className="gap-2 flex-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              variant={currentPage === "webhooks" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("webhooks")}
              className="gap-2 flex-1"
            >
              <Webhook className="w-4 h-4" />
              Webhooks
            </Button>
            {userRole !== "Viewer" && (
              <Button
                variant={currentPage === "settings" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage("settings")}
                className="gap-2 flex-1"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        {currentPage === "dashboard" ? (
          <Dashboard />
        ) : currentPage === "webhooks" ? (
          <Webhooks />
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
