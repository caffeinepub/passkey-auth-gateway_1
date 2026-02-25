import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Shield, Lock, Zap, CheckCircle } from "lucide-react";

export default function Home() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display font-semibold text-lg">
              PasskeyAuth
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-bold text-5xl sm:text-6xl tracking-tight leading-tight">
              Passkey Authentication
              <br />
              <span className="text-primary">Gateway</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Auth0 alternative for indie hackers and startups. Add decentralized passkey authentication to your apps — 100x cheaper, built on Internet Computer.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="text-base px-8 py-6 font-medium"
            >
              {isLoggingIn ? (
                <>
                  <Lock className="w-5 h-5 mr-2 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Sign in with Internet Identity
                </>
              )}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-sm">
                Passkey-First
              </h3>
              <p className="text-sm text-muted-foreground">
                Built for WebAuthn from the ground up
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-sm">
                Simple Pricing
              </h3>
              <p className="text-sm text-muted-foreground">
                Predictable costs, no surprises
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-sm">
                RBAC Built-In
              </h3>
              <p className="text-sm text-muted-foreground">
                Role-based access control from day one
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
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
