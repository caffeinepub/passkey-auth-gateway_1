import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ServerCrash,
} from "lucide-react";
import { useGetCanisterAttestation } from "../hooks/useQueries";

const CANISTER_ID = "lep6p-paaaa-aaaai-q5v4q-cai";
const ICP_DASHBOARD_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function CopyButton({ text, title = "Copy" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 shrink-0"
            aria-label={title}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{copied ? "Copied!" : title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Attestation Row ─────────────────────────────────────────────────────────

function AttestationRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-32">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
        <span
          className={`text-sm text-right break-all ${
            mono ? "font-mono text-foreground/90" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {copyable && <CopyButton text={value} title={`Copy ${label}`} />}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VerifyPage() {
  const { data: attestation, isLoading, error } = useGetCanisterAttestation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-base">Avantkey</span>
          <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30 ml-auto">
            Verification
          </Badge>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center py-16 px-6">
        <div className="w-full max-w-lg space-y-6">
          {/* Page heading */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 border border-success/20 mx-auto">
              <Shield className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              Verified on Internet Computer
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              This is cryptographic proof that Avantkey runs on ICP
              infrastructure, not a centralized server. The canister ID below is
              publicly verifiable on the ICP dashboard.
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Fetching attestation from canister…
                </span>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <Card className="border-destructive/40">
              <CardContent className="flex items-start gap-3 py-6">
                <ServerCrash className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">
                    Could not reach canister
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The attestation endpoint is temporarily unavailable. You can
                    still verify the canister directly on the ICP dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attestation card */}
          {attestation && !isLoading && (
            <Card className="shadow-sm border-success/20">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <CardTitle className="font-display text-base">
                      Attestation
                    </CardTitle>
                  </div>
                  <Badge className="bg-success/15 text-success border-success/30 text-xs" variant="outline">
                    Live
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Retrieved directly from the on-chain canister
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-5 pb-2">
                <AttestationRow
                  label="Canister ID"
                  value={attestation.canisterId || CANISTER_ID}
                  mono
                  copyable
                />
                <AttestationRow
                  label="Network"
                  value={attestation.network}
                />
                <AttestationRow
                  label="Version"
                  value={attestation.version}
                  mono
                />
                <AttestationRow
                  label="Verified At"
                  value={formatTimestamp(attestation.timestamp)}
                />
                <div className="py-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">
                    Message
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {attestation.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Static canister ID card (always visible as fallback) */}
          {!attestation && !isLoading && (
            <Card>
              <CardContent className="py-5 px-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground shrink-0 w-32">Canister ID</span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-sm font-mono text-foreground/90 break-all text-right">
                      {CANISTER_ID}
                    </span>
                    <CopyButton text={CANISTER_ID} title="Copy canister ID" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ICP Dashboard CTA */}
          <Button
            asChild
            size="lg"
            className="w-full gap-2"
          >
            <a
              href={ICP_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Verify on ICP Dashboard
            </a>
          </Button>

          {/* Info note */}
          <div className="flex items-start gap-2 p-4 rounded-lg border border-border bg-muted/30">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              The ICP dashboard shows real-time canister metadata including
              controller principals, cycle balance, and module hash. These
              records are maintained by the Internet Computer protocol and cannot
              be spoofed or altered.
            </p>
          </div>

          {/* Back to app link */}
          <div className="text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Avantkey
            </a>
          </div>
        </div>
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
