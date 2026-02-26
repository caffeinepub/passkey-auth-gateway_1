import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Copy,
  ArrowLeft,
  Zap,
  Key,
  Webhook,
  Code2,
  BarChart3,
  AlertTriangle,
  BookOpen,
  FileCode,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TocEntry {
  id: string;
  label: string;
  icon: React.ReactNode;
  sub?: { id: string; label: string }[];
}

// ─── TOC Structure ────────────────────────────────────────────────────────────

const TOC: TocEntry[] = [
  {
    id: "quick-start",
    label: "Quick Start",
    icon: <Zap className="w-3.5 h-3.5" />,
    sub: [
      { id: "qs-step1", label: "1. Sign up" },
      { id: "qs-step2", label: "2. Get API key" },
      { id: "qs-step3", label: "3. Call verifyAuth" },
      { id: "qs-step4", label: "4. Handle response" },
    ],
  },
  {
    id: "auth-flow",
    label: "Authentication Flow",
    icon: <Key className="w-3.5 h-3.5" />,
  },
  {
    id: "api-reference",
    label: "API Reference",
    icon: <Code2 className="w-3.5 h-3.5" />,
    sub: [
      { id: "api-verify", label: "verifyAuth()" },
      { id: "api-session", label: "validateSession()" },
    ],
  },
  {
    id: "webhook-events",
    label: "Webhook Events",
    icon: <Webhook className="w-3.5 h-3.5" />,
    sub: [
      { id: "wh-registered", label: "user.registered" },
      { id: "wh-authenticated", label: "user.authenticated" },
      { id: "wh-failed", label: "auth.failed" },
    ],
  },
  {
    id: "idl-candid",
    label: "IDL / Candid",
    icon: <FileCode className="w-3.5 h-3.5" />,
    sub: [
      { id: "idl-hosted", label: "Hosted file" },
      { id: "idl-usage", label: "Usage" },
    ],
  },
  {
    id: "canister-attestation",
    label: "Canister Attestation",
    icon: <BadgeCheck className="w-3.5 h-3.5" />,
  },
  {
    id: "code-examples",
    label: "Code Examples",
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  {
    id: "rate-limits",
    label: "Rate Limits",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
  },
  {
    id: "error-reference",
    label: "Error Reference",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
];

// ─── Code block helper ────────────────────────────────────────────────────────

function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-[oklch(0.13_0.02_240)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[oklch(0.16_0.02_240)]">
        <span className="text-xs font-mono text-muted-foreground tracking-wide uppercase">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
        <code className="text-foreground/90">{code.trim()}</code>
      </pre>
    </div>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 text-2xl font-display font-semibold mb-4 pt-10 first:pt-0 flex items-center gap-3 text-foreground"
    >
      {children}
    </h2>
  );
}

function SubHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="scroll-mt-28 text-lg font-display font-semibold mb-3 mt-8 text-foreground/90"
    >
      {children}
    </h3>
  );
}

// ─── Inline code helper ───────────────────────────────────────────────────────

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-muted text-foreground/90 border border-border">
      {children}
    </code>
  );
}

// ─── Function call badge helper ───────────────────────────────────────────────

function FnBadge({ label }: { label: string }) {
  return (
    <Badge
      className="bg-primary/15 text-primary border-primary/30 font-mono text-xs"
      variant="outline"
    >
      {label}
    </Badge>
  );
}

// ─── Prose paragraph helper ───────────────────────────────────────────────────

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
      {children}
    </p>
  );
}

// ─── Code content ─────────────────────────────────────────────────────────────

const JS_EXAMPLE = `import { HttpAgent, Actor } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { idlFactory } from 'https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js'

// 1. Authenticate with Internet Identity
const authClient = await AuthClient.create()
await authClient.login({ identityProvider: 'https://identity.ic0.app' })

// 2. Get the user's principal
const identity = authClient.getIdentity()
const principalText = identity.getPrincipal().toText()

// 3. Call Avantkey's verifyAuth canister function
const agent = new HttpAgent({ identity, host: 'https://ic0.app' })
const avantkey = Actor.createActor(idlFactory, {
  agent,
  canisterId: 'lep6p-paaaa-aaaai-q5v4q-cai'
})

const result = await avantkey.verifyAuth(
  process.env.AVANTKEY_API_KEY,
  principalText
)

const { sessionToken, userId, expiresAt, isNewUser } = result
// Store sessionToken in your session/cookie`;

const NODEJS_EXAMPLE = `// Server-side session validation (Node.js)
import { HttpAgent, Actor } from '@dfinity/agent'

// Download avantkey.did.js from the hosted URL and place in your project, or
// dynamically import (requires Node 18+ with fetch support):
const { idlFactory } = await import(
  'https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js'
)

const agent = new HttpAgent({ host: 'https://ic0.app' })
const avantkey = Actor.createActor(idlFactory, {
  agent,
  canisterId: 'lep6p-paaaa-aaaai-q5v4q-cai'
})

// Validate a session token from your frontend
const session = await avantkey.validateSession(
  process.env.AVANTKEY_API_KEY,
  req.cookies.sessionToken
)

if (!session.valid) {
  return res.status(401).json({ error: 'session_expired' })
}
// session.userId is the verified user identity`;

const VERIFY_RESPONSE_OK = `{
  sessionToken: "st_eyJhbGciOiJIUzI1NiJ9...",
  userId:       "usr_abc123",
  expiresAt:    1740564000000000000n,   // nanoseconds (bigint)
  isNewUser:    true
}`;

const VERIFY_RESPONSE_ERR = `// Throws an agent error if the API key is invalid:
// "Call was rejected: Reject code: 4, Reject text: unauthorized"

// Or returns an Err variant for rate limiting:
{ err: "rate_limit_exceeded" }`;

const SESSION_RESPONSE_OK = `{
  userId:    "usr_abc123",
  valid:     true,
  expiresAt: 1740564000000000000n   // nanoseconds (bigint)
}`;

const SESSION_RESPONSE_ERR = `{
  userId:    "",
  valid:     false,
  expiresAt: 0n
}`;

const WEBHOOK_REGISTERED = `{
  "event": "user.registered",
  "timestamp": "2026-02-26T10:00:00Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "userId": "usr_abc123",
    "principal": "2vxsx-fae",
    "registeredAt": "2026-02-26T10:00:00Z"
  }
}`;

const WEBHOOK_AUTHENTICATED = `{
  "event": "user.authenticated",
  "timestamp": "2026-02-26T10:00:00Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "userId": "usr_abc123",
    "principal": "2vxsx-fae",
    "sessionToken": "st_eyJhbGciOiJIUzI1NiJ9...",
    "authenticatedAt": "2026-02-26T10:00:00Z"
  }
}`;

const WEBHOOK_FAILED = `{
  "event": "auth.failed",
  "timestamp": "2026-02-26T10:00:00Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "reason": "expired_delegation",
    "attemptedAt": "2026-02-26T10:00:00Z"
  }
}`;

const ATTESTATION_EXAMPLE = `// Node.js — verify canister attestation
import { HttpAgent, Actor } from '@dfinity/agent'
import { idlFactory } from 'https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js'

const agent = new HttpAgent({ host: 'https://ic0.app' })
const avantkey = Actor.createActor(idlFactory, {
  agent,
  canisterId: 'lep6p-paaaa-aaaai-q5v4q-cai'
})

const attestation = await avantkey.getCanisterAttestation()
console.log(attestation.canisterId) // lep6p-paaaa-aaaai-q5v4q-cai
console.log(attestation.network)    // Internet Computer Mainnet
console.log(attestation.version)    // Current canister version
console.log(attestation.message)    // Human-readable attestation statement

// Verify manually:
// https://dashboard.internetcomputer.org/canister/lep6p-paaaa-aaaai-q5v4q-cai`;

const WEBHOOK_SIG_VERIFY = `// Node.js — verify webhook signature
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return \`sha256=\${expected}\` === signature
}

// In your Express handler:
app.post('/webhook', (req, res) => {
  const sig = req.headers['x-avantkey-signature']
  const raw = JSON.stringify(req.body)

  if (!verifyWebhookSignature(raw, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'invalid_signature' })
  }

  const { event, data } = req.body
  // handle event...
  res.sendStatus(200)
})`;

// ─── Main Docs Component ──────────────────────────────────────────────────────

interface DocsProps {
  onBack?: () => void;
}

export default function Docs({ onBack }: DocsProps) {
  const [activeSection, setActiveSection] = useState<string>("quick-start");
  const contentRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to track active section
  useEffect(() => {
    const allIds = TOC.flatMap((entry) => [
      entry.id,
      ...(entry.sub?.map((s) => s.id) ?? []),
    ]);

    const observers: IntersectionObserver[] = [];

    const handleIntersect =
      (id: string) => (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        }
      };

    for (const id of allIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(handleIntersect(id), {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      });
      obs.observe(el);
      observers.push(obs);
    }

    return () => { observers.forEach((o) => { o.disconnect(); }); };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back button (when accessed from landing page) */}
      {onBack && (
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              v1.0
            </Badge>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-3">
            Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Integrate Avantkey's passkey authentication gateway into your
            application. No passwords. No breaches.
          </p>
          <Separator className="mt-8" />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-12 items-start relative">
          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
            <nav>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                On this page
              </p>
              <ul className="space-y-0.5">
                {TOC.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(entry.id)}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        activeSection === entry.id
                          ? "text-primary bg-primary/8 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={
                          activeSection === entry.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        {entry.icon}
                      </span>
                      {entry.label}
                    </button>
                    {entry.sub && (
                      <ul className="ml-6 mt-0.5 space-y-0.5">
                        {entry.sub.map((sub) => (
                          <li key={sub.id}>
                            <button
                              type="button"
                              onClick={() => scrollToSection(sub.id)}
                              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                activeSection === sub.id
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {sub.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main
            ref={contentRef}
            className="flex-1 min-w-0 max-w-3xl"
          >
            {/* ── Quick Start ──────────────────────────────────────────── */}
            <SectionHeading id="quick-start">
              <Zap className="w-6 h-6 text-primary" />
              Quick Start
            </SectionHeading>
            <P>
              Get Avantkey running in your app in under 5 minutes. You'll need
              an Internet Identity anchor to sign up.
            </P>

            <div className="space-y-6">
              {/* Step 1 */}
              <div
                id="qs-step1"
                className="scroll-mt-28 flex gap-4 p-5 rounded-lg border border-border bg-card"
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">
                    Sign up with Internet Identity
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Visit{" "}
                    <InlineCode>avantkey.com</InlineCode> and click{" "}
                    <strong>Sign Up Free</strong>. Authenticate with your
                    Internet Identity anchor. A tenant is created automatically
                    on first login — no forms, no email verification.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                id="qs-step2"
                className="scroll-mt-28 flex gap-4 p-5 rounded-lg border border-border bg-card"
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">
                    Get your API key
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Go to the <strong>Dashboard</strong> tab. Click{" "}
                    <strong>Generate API Key</strong>. Copy the key — it starts
                    with <InlineCode>pk_live_</InlineCode> and is only shown
                    once. Store it in an environment variable.
                  </p>
                  <div className="mt-3">
                    <CodeBlock
                      language="env"
                      code={`AVANTKEY_API_KEY=pk_live_your_key_here`}
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                id="qs-step3"
                className="scroll-mt-28 flex gap-4 p-5 rounded-lg border border-border bg-card"
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm mb-1">
                    Call <InlineCode>verifyAuth</InlineCode> on the canister
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    After your user authenticates with Internet Identity, call
                    Avantkey's <InlineCode>verifyAuth</InlineCode> canister
                    function directly via the ICP agent. Pass your API key and
                    the user's principal text. You get back a{" "}
                    <InlineCode>sessionToken</InlineCode>,{" "}
                    <InlineCode>userId</InlineCode>, and a flag indicating
                    whether this is a new user.
                  </p>
                  <CodeBlock
                    language="javascript"
                    code={`import { HttpAgent, Actor } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { idlFactory } from 'https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js'

const authClient = await AuthClient.create()
await authClient.login({ identityProvider: 'https://identity.ic0.app' })

const identity = authClient.getIdentity()
const principalText = identity.getPrincipal().toText()

const agent = new HttpAgent({ identity, host: 'https://ic0.app' })
const avantkey = Actor.createActor(idlFactory, {
  agent,
  canisterId: 'lep6p-paaaa-aaaai-q5v4q-cai'
})

const { sessionToken, userId, isNewUser } = await avantkey.verifyAuth(
  process.env.AVANTKEY_API_KEY,
  principalText
)`}
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div
                id="qs-step4"
                className="scroll-mt-28 flex gap-4 p-5 rounded-lg border border-border bg-card"
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm mb-1">
                    Handle the response (and optionally configure webhooks)
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Store the <InlineCode>sessionToken</InlineCode> in your
                    session/cookie. Call{" "}
                    <InlineCode>validateSession()</InlineCode> on subsequent
                    requests to confirm the user is still authenticated.
                    Optionally, configure a webhook URL in the dashboard to
                    receive real-time auth events.
                  </p>
                  <CodeBlock
                    language="javascript"
                    code={`// Store sessionToken after verifyAuth
setCookie('avantkey_session', sessionToken)

// Later: validate on the server using validateSession()
const session = await avantkey.validateSession(
  process.env.AVANTKEY_API_KEY,
  req.cookies.avantkey_session
)
if (!session.valid) return res.status(401).send('Unauthorized')`}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* ── Authentication Flow ──────────────────────────────────── */}
            <SectionHeading id="auth-flow">
              <Key className="w-6 h-6 text-primary" />
              Authentication Flow
            </SectionHeading>

            <P>
              Avantkey uses{" "}
              <strong>Internet Identity</strong> — the Internet Computer's
              native passkey system — as its authentication backbone. There are
              no passwords, no password databases, and no credential leaks.
            </P>

            <div className="my-6 rounded-lg border border-border overflow-hidden">
              <div className="bg-card px-5 py-4 border-b border-border">
                <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  End-to-end flow
                </p>
              </div>
              <div className="divide-y divide-border">
                {[
                  {
                    step: "1",
                    title: "Your app initiates login",
                    desc: 'Call Internet Identity\'s auth client. The user is prompted to authenticate with a passkey — Face ID, Touch ID, Windows Hello, or a hardware key.',
                  },
                  {
                    step: "2",
                    title: "Internet Identity issues a delegation",
                    desc: "On success, Internet Identity returns a cryptographic delegation chain — a signed proof of identity. No passwords involved at any point.",
                  },
                  {
                    step: "3",
                    title: "Your app calls verifyAuth() on the canister",
                    desc: "Pass your API key and the user's principal text to Avantkey's verifyAuth canister function via the ICP agent SDK. The call goes directly to the on-chain canister — no intermediate servers.",
                  },
                  {
                    step: "4",
                    title: "Avantkey returns a verified identity",
                    desc: "We return a stable userId, the user's principal (their on-chain identity), and a session token your app can use for subsequent requests.",
                  },
                  {
                    step: "5",
                    title: "Webhooks fire (if configured)",
                    desc: "Avantkey sends a signed webhook payload to your endpoint — user.registered on first login, user.authenticated on repeat logins, auth.failed on failures.",
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 px-5 py-4 bg-card/50">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-muted-foreground">
                        {step}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-info/30 bg-info/5 flex gap-3">
              <span className="text-info mt-0.5 shrink-0">ℹ</span>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">
                  No passwords, ever.
                </strong>{" "}
                Avantkey never stores, hashes, or transmits passwords. The
                cryptographic keys used for passkey authentication never leave
                the user's device. There is no password database to breach.
              </p>
            </div>

            <Separator className="my-10" />

            {/* ── API Reference ─────────────────────────────────────────── */}
            <SectionHeading id="api-reference">
              <Code2 className="w-6 h-6 text-primary" />
              API Reference
            </SectionHeading>

            {/* ICP Architecture note */}
            <div className="mb-6 p-4 rounded-lg border border-primary/25 bg-primary/5 flex gap-3">
              <span className="text-primary mt-0.5 shrink-0 text-base">⛓</span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  ICP canister architecture
                </p>
                <p className="text-sm text-muted-foreground">
                  Avantkey exposes its API as <strong>ICP canister functions</strong>,
                  not a traditional REST API. Calls go directly to the on-chain
                  canister at{" "}
                  <InlineCode>lep6p-paaaa-aaaai-q5v4q-cai</InlineCode> via the{" "}
                  <InlineCode>@dfinity/agent</InlineCode> SDK. This gives you
                  zero-infrastructure overhead, cryptographic request
                  verification, and decentralized identity guarantees — no
                  middle-tier servers to compromise.
                </p>
              </div>
            </div>

            {/* verifyAuth() */}
            <SubHeading id="api-verify">verifyAuth()</SubHeading>
            <P>
              Verify an Internet Identity principal and create or retrieve the
              user's Avantkey session. Returns a session token your app can
              store and later validate.
            </P>

            <div className="rounded-lg border border-border overflow-hidden mb-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
                <FnBadge label="canister.call" />
                <InlineCode>avantkey.verifyAuth(apiKey, principalText)</InlineCode>
              </div>

              <div className="p-4 space-y-4 bg-card/30">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Function signature (Motoko)
                  </p>
                  <CodeBlock
                    language="motoko"
                    code={`public shared func verifyAuth(
  apiKey     : Text,    // Your pk_live_... API key
  principalText : Text  // User's II principal as text (e.g. "2vxsx-fae")
) : async {
  sessionToken : Text;
  userId       : Text;
  expiresAt    : Int;   // Nanoseconds since epoch
  isNewUser    : Bool;
}`}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Parameters
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Parameter</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-xs">apiKey</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">string</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          Your <InlineCode>pk_live_...</InlineCode> API key from the dashboard
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">principalText</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">string</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          The authenticated user's principal as text — obtained
                          via <InlineCode>identity.getPrincipal().toText()</InlineCode>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Return values
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono bg-success/10 text-success border-success/30 shrink-0"
                  >
                    Ok
                  </Badge>
                  <div className="flex-1">
                    <CodeBlock language="javascript" code={VERIFY_RESPONSE_OK} />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono bg-destructive/10 text-destructive border-destructive/30 shrink-0"
                  >
                    Err
                  </Badge>
                  <div className="flex-1">
                    <CodeBlock language="javascript" code={VERIFY_RESPONSE_ERR} />
                  </div>
                </div>
              </div>
            </div>

            {/* validateSession() */}
            <SubHeading id="api-session">validateSession()</SubHeading>
            <P>
              Validate an existing session token. Use this on your server for
              every authenticated request to confirm the user's session is still
              active.
            </P>

            <div className="rounded-lg border border-border overflow-hidden mb-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
                <FnBadge label="canister.call" />
                <InlineCode>avantkey.validateSession(apiKey, sessionToken)</InlineCode>
              </div>

              <div className="p-4 space-y-4 bg-card/30">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Function signature (Motoko)
                  </p>
                  <CodeBlock
                    language="motoko"
                    code={`public shared func validateSession(
  apiKey       : Text,  // Your pk_live_... API key
  sessionToken : Text   // Token returned from verifyAuth()
) : async {
  userId    : Text;
  valid     : Bool;
  expiresAt : Int;      // Nanoseconds since epoch
}`}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Parameters
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Parameter</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-xs">apiKey</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">string</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          Your <InlineCode>pk_live_...</InlineCode> API key from the dashboard
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">sessionToken</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">string</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          The session token previously returned by{" "}
                          <InlineCode>verifyAuth()</InlineCode>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-semibold text-muted-foreground">
                Return values
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono bg-success/10 text-success border-success/30 shrink-0"
                  >
                    valid
                  </Badge>
                  <div className="flex-1">
                    <CodeBlock language="javascript" code={SESSION_RESPONSE_OK} />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono bg-destructive/10 text-destructive border-destructive/30 shrink-0"
                  >
                    expired
                  </Badge>
                  <div className="flex-1">
                    <CodeBlock language="javascript" code={SESSION_RESPONSE_ERR} />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* ── Webhook Events ────────────────────────────────────────── */}
            <SectionHeading id="webhook-events">
              <Webhook className="w-6 h-6 text-primary" />
              Webhook Events
            </SectionHeading>

            <P>
              Configure a webhook URL in your dashboard to receive real-time
              notifications for authentication events. Each delivery is signed
              with HMAC-SHA256 using your webhook secret.
            </P>

            <div className="p-4 rounded-lg border border-border bg-card mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Signature header
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Every webhook request includes an{" "}
                <InlineCode>X-Avantkey-Signature</InlineCode> header. Always
                verify this before processing the payload.
              </p>
              <CodeBlock language="text" code={`X-Avantkey-Signature: sha256=<hmac_hex>`} />
            </div>

            {/* user.registered */}
            <SubHeading id="wh-registered">user.registered</SubHeading>
            <P>
              Fired when an end-user authenticates with Avantkey for the first
              time (new user registration).
            </P>
            <CodeBlock language="json" code={WEBHOOK_REGISTERED} />

            {/* user.authenticated */}
            <SubHeading id="wh-authenticated">user.authenticated</SubHeading>
            <P>
              Fired on every successful authentication for an existing user.
              Includes the session token issued for this login.
            </P>
            <CodeBlock language="json" code={WEBHOOK_AUTHENTICATED} />

            {/* auth.failed */}
            <SubHeading id="wh-failed">auth.failed</SubHeading>
            <P>
              Fired when an authentication attempt fails. The{" "}
              <InlineCode>reason</InlineCode> field identifies the failure cause.
            </P>
            <CodeBlock language="json" code={WEBHOOK_FAILED} />

            <div className="mt-6">
              <p className="text-sm font-semibold mb-3">
                Signature verification (Node.js)
              </p>
              <CodeBlock language="javascript" code={WEBHOOK_SIG_VERIFY} />
            </div>

            <div className="mt-4 p-4 rounded-lg border border-warning/30 bg-warning/5 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Retry logic.</strong>{" "}
                Failed deliveries are retried 4 times with exponential backoff:
                immediately, +15s, +1m, +5m. Return a{" "}
                <InlineCode>2xx</InlineCode> status code to acknowledge receipt.
              </p>
            </div>

            <Separator className="my-10" />

            {/* ── IDL / Candid ──────────────────────────────────────────── */}
            <SectionHeading id="idl-candid">
              <FileCode className="w-6 h-6 text-primary" />
              IDL / Candid
            </SectionHeading>

            <P>
              To call the Avantkey canister via the{" "}
              <InlineCode>@dfinity/agent</InlineCode> SDK, you need the
              Candid Interface Description Language (IDL) factory — the{" "}
              <InlineCode>idlFactory</InlineCode> function that describes every
              canister method and its types. Avantkey hosts this file for you.
            </P>

            {/* Hosted file */}
            <SubHeading id="idl-hosted">Hosted file</SubHeading>
            <P>
              The canonical IDL is served directly from the canister and is
              always up to date with the deployed version.
            </P>
            <CodeBlock
              language="text"
              code={`https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js`}
            />

            <div className="mt-4 p-4 rounded-lg border border-border bg-card text-sm text-muted-foreground">
              <strong className="text-foreground">Alternatively</strong>, download the file and bundle it with your
              project to avoid a runtime fetch:{" "}
              <a
                href="/avantkey.did.js"
                download
                className="text-primary hover:underline font-mono text-xs"
              >
                avantkey.did.js
              </a>
            </div>

            {/* Usage */}
            <SubHeading id="idl-usage">Usage</SubHeading>
            <P>
              Import <InlineCode>idlFactory</InlineCode> and pass it to{" "}
              <InlineCode>Actor.createActor()</InlineCode> alongside the canister
              ID. Two import styles are shown below.
            </P>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Browser (ES module)
                </p>
                <CodeBlock
                  language="javascript"
                  code={`import { idlFactory } from 'https://lep6p-paaaa-aaaai-q5v4q-cai.raw.icp0.io/avantkey.did.js'

const avantkey = Actor.createActor(idlFactory, {
  agent,
  canisterId: 'lep6p-paaaa-aaaai-q5v4q-cai'
})`}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Local file (bundler / Node.js)
                </p>
                <CodeBlock
                  language="javascript"
                  code={`// After downloading avantkey.did.js into your project:
import { idlFactory } from './avantkey.did.js'

const avantkey = Actor.createActor(idlFactory, {
  agent,
  canisterId: 'lep6p-paaaa-aaaai-q5v4q-cai'
})`}
                />
              </div>
            </div>

            <Separator className="my-10" />

            {/* ── Canister Attestation ──────────────────────────────────── */}
            <SectionHeading id="canister-attestation">
              <BadgeCheck className="w-6 h-6 text-primary" />
              Canister Attestation
            </SectionHeading>

            <P>
              Avantkey exposes a public{" "}
              <InlineCode>getCanisterAttestation()</InlineCode> query that
              returns cryptographic proof of our ICP infrastructure. Use this to
              verify we run on Internet Computer, not a centralized server.
            </P>

            <div className="mb-6 p-4 rounded-lg border border-primary/25 bg-primary/5 flex gap-3">
              <span className="text-primary mt-0.5 shrink-0 text-base">⛓</span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  No trust required
                </p>
                <p className="text-sm text-muted-foreground">
                  The attestation is returned directly from the on-chain
                  canister and includes the canister ID, network, version, and
                  timestamp. Cross-reference the canister ID on the ICP
                  dashboard to confirm the deployment is genuine.
                </p>
              </div>
            </div>

            <CodeBlock language="javascript" code={ATTESTATION_EXAMPLE} />

            <div className="mt-4 p-4 rounded-lg border border-border bg-card text-sm text-muted-foreground">
              Or visit our{" "}
              <a
                href="/verify"
                className="text-primary hover:underline font-medium"
                onClick={(e) => { e.preventDefault(); window.location.href = "/verify"; }}
              >
                live attestation page
              </a>{" "}
              to see the current attestation rendered in a browser, with a
              direct link to verify on the ICP dashboard.
            </div>

            <Separator className="my-10" />

            {/* ── Code Examples ─────────────────────────────────────────── */}
            <SectionHeading id="code-examples">
              <BookOpen className="w-6 h-6 text-primary" />
              Code Examples
            </SectionHeading>

            <P>
              Full examples showing the complete authentication flow from
              Internet Identity login to Avantkey verification. Both examples
              use the <InlineCode>@dfinity/agent</InlineCode> SDK to call the
              canister directly.
            </P>

            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="javascript">JavaScript (Browser)</TabsTrigger>
                <TabsTrigger value="nodejs">Node.js / Backend</TabsTrigger>
              </TabsList>
              <TabsContent value="javascript" className="mt-0">
                <CodeBlock language="javascript" code={JS_EXAMPLE} />
              </TabsContent>
              <TabsContent value="nodejs" className="mt-0">
                <CodeBlock language="javascript" code={NODEJS_EXAMPLE} />
              </TabsContent>
            </Tabs>

            <Separator className="my-10" />

            {/* ── Rate Limits ───────────────────────────────────────────── */}
            <SectionHeading id="rate-limits">
              <BarChart3 className="w-6 h-6 text-primary" />
              Rate Limits
            </SectionHeading>

            <P>
              Rate limits are enforced per API key using a sliding window
              algorithm. When exceeded, the API returns a{" "}
              <InlineCode>429</InlineCode> response with a{" "}
              <InlineCode>Retry-After</InlineCode> header.
            </P>

            <div className="rounded-lg border border-border overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Requests / Hour</TableHead>
                    <TableHead>Monthly Active Users</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Free</TableCell>
                    <TableCell className="font-mono text-sm">1,000</TableCell>
                    <TableCell className="font-mono text-sm">1,000</TableCell>
                    <TableCell className="text-success font-semibold">
                      $0/mo
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/3">
                    <TableCell className="font-medium">
                      Pro{" "}
                      <Badge className="ml-1 text-xs bg-primary/20 text-primary border-primary/30">
                        Popular
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">10,000</TableCell>
                    <TableCell className="font-mono text-sm">10,000</TableCell>
                    <TableCell className="text-primary font-semibold">
                      $29/mo
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Enterprise</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      Custom
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      Custom
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Contact us
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <CodeBlock
              language="http"
              code={`HTTP/1.1 429 Too Many Requests
Retry-After: 3600
Content-Type: application/json

{ "error": "rate_limit_exceeded", "retryAfter": 3600 }`}
            />

            <Separator className="my-10" />

            {/* ── Error Reference ───────────────────────────────────────── */}
            <SectionHeading id="error-reference">
              <AlertTriangle className="w-6 h-6 text-primary" />
              Error Reference
            </SectionHeading>

            <P>
              All errors follow a consistent JSON shape with a machine-readable{" "}
              <InlineCode>error</InlineCode> code and a human-readable{" "}
              <InlineCode>message</InlineCode>.
            </P>

            <div className="rounded-lg border border-border overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error Code</TableHead>
                    <TableHead>HTTP Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      code: "invalid_api_key",
                      status: "401",
                      desc: "API key is missing or invalid.",
                    },
                    {
                      code: "rate_limit_exceeded",
                      status: "429",
                      desc: "Too many requests. Check Retry-After header.",
                    },
                    {
                      code: "invalid_token",
                      status: "400",
                      desc: "Delegation token is malformed or unparseable.",
                    },
                    {
                      code: "expired_delegation",
                      status: "401",
                      desc: "User's Internet Identity session has expired.",
                    },
                    {
                      code: "session_expired",
                      status: "401",
                      desc: "Session token is no longer valid.",
                    },
                    {
                      code: "tenant_not_found",
                      status: "404",
                      desc: "API key references a deleted or suspended tenant.",
                    },
                  ].map(({ code, status, desc }) => (
                    <TableRow key={code}>
                      <TableCell>
                        <code className="text-xs font-mono text-foreground/90 bg-muted px-1.5 py-0.5 rounded">
                          {code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${
                            status === "200"
                              ? "text-success border-success/30"
                              : status === "429"
                              ? "text-warning border-warning/30"
                              : status === "400"
                              ? "text-info border-info/30"
                              : "text-destructive border-destructive/30"
                          }`}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {desc}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
              <p className="text-lg font-display font-semibold mb-2">
                Ready to integrate?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up free and get your API key in under 30 seconds.
              </p>
              <Button asChild size="sm">
                <a href="/">Get started →</a>
              </Button>
            </div>

            <div className="mt-12 pb-16 text-center text-sm text-muted-foreground">
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
          </main>
        </div>
      </div>
    </div>
  );
}
