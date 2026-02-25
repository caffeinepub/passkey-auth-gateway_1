import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Key,
  Users,
  Webhook,
  Check,
  X,
  AlertTriangle,
  Code,
  Smartphone,
  Zap,
  Building2,
  Copy,
  ChevronRight,
  Globe,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { toast } from "sonner";

// Code samples for the integration section
const jsCodeSample = `// Add authentication in 3 lines of code
import { authenticate } from '@passkey-gateway/sdk'

const user = await authenticate(request, {
  apiKey: 'pk_live_your_key_here'
})`;

const curlCodeSample = `curl https://api.passkey-gateway.com/auth/verify \\
  -H "Authorization: Bearer pk_live_your_key_here" \\
  -d "token=..."`;

export default function LandingPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const [copiedCode, setCopiedCode] = useState(false);
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle CTA click
  const handleGetStarted = () => {
    if (!isAuthenticated) {
      login();
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display font-semibold text-lg">
              PasskeyAuth
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("demo")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </button>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button variant="ghost" size="sm" asChild>
                <a href="/dashboard">Dashboard</a>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleGetStarted}
              disabled={loginStatus === "logging-in"}
            >
              {loginStatus === "logging-in"
                ? "Connecting..."
                : isAuthenticated
                ? "Go to Dashboard"
                : "Sign Up Free"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="container mx-auto px-6 py-24 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Built on Internet Computer
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
                Passkey Authentication
                <br />
                <span className="text-primary">for Developers</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Auth0-grade security, <span className="text-foreground font-semibold">100x cheaper</span>, passkey-first by design.
                The authentication gateway you can actually afford.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" onClick={handleGetStarted} className="gap-2">
                  Start Building Free
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("demo")}
                >
                  Try Live Demo
                </Button>
              </div>

              {/* Social proof badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Passkey-first</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Decentralized</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">$29/mo not $240</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="demo" className="py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  Try It Now
                </h2>
                <p className="text-lg text-muted-foreground">
                  Experience passkey authentication powered by Internet Identity
                </p>
              </div>

              <Card className="shadow-card">
                <CardHeader className="text-center">
                  <CardTitle className="font-display">
                    🔐 Try Passkey Login
                  </CardTitle>
                  <CardDescription>
                    Click below to authenticate with Internet Identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      disabled={loginStatus === "logging-in"}
                      className="min-w-[200px]"
                    >
                      {loginStatus === "logging-in"
                        ? "Authenticating..."
                        : isAuthenticated
                        ? "Authenticated ✓"
                        : "Try Passkey Login"}
                    </Button>
                  </div>

                  {isAuthenticated && (
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-sm text-center font-medium text-success">
                        ✓ Successfully authenticated! Visit your{" "}
                        <a
                          href="/dashboard"
                          className="underline hover:text-success/80"
                        >
                          dashboard
                        </a>{" "}
                        to see your tenant
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      <span>No passwords</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      <span>No email verification</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      <span>Instant authentication</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Everything You Need
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enterprise-grade authentication features at a fraction of the cost
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Passkey-First */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Key className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-display">
                    Passkey-First Authentication
                  </CardTitle>
                  <CardDescription>
                    WebAuthn/Passkeys as the default, not an add-on. Secure,
                    phishing-resistant authentication built-in from day one.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Decentralized Identity */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-info" />
                  </div>
                  <CardTitle className="font-display">
                    Decentralized Internet Identity
                  </CardTitle>
                  <CardDescription>
                    Powered by the Internet Computer. No passwords, no vendor
                    lock-in, true user ownership of digital identity.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Built-in RBAC */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="font-display">Built-in RBAC</CardTitle>
                  <CardDescription>
                    Role-based access control with Admin, Member, and Viewer
                    roles out of the box. No extra configuration needed.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Webhooks */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                    <Webhook className="w-6 h-6 text-warning" />
                  </div>
                  <CardTitle className="font-display">
                    Webhooks Included
                  </CardTitle>
                  <CardDescription>
                    Real-time authentication events delivered to your app with
                    HMAC signatures. Track logins, registrations, and failures.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Code Integration */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  Integrate in Minutes
                </h2>
                <p className="text-lg text-muted-foreground">
                  Add authentication to your app with just a few lines of code
                </p>
              </div>

              <Card className="shadow-card">
                <CardContent className="p-0">
                  <Tabs defaultValue="javascript" className="w-full">
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                      <TabsList>
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                      </TabsList>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyCode(
                            document.querySelector('[data-code]')?.textContent || ""
                          )
                        }
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <TabsContent value="javascript" className="m-0 p-6">
                      <pre className="overflow-x-auto">
                        <code
                          data-code
                          className="text-sm font-mono text-foreground/90"
                        >
                          {jsCodeSample}
                        </code>
                      </pre>
                    </TabsContent>

                    <TabsContent value="curl" className="m-0 p-6">
                      <pre className="overflow-x-auto">
                        <code
                          data-code
                          className="text-sm font-mono text-foreground/90"
                        >
                          {curlCodeSample}
                        </code>
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                No hidden fees. No surprises. Just honest pricing.
              </p>
            </div>

            {/* Pricing Callout */}
            <div className="max-w-3xl mx-auto mb-12">
              <Card className="border-warning/50 bg-warning/5 shadow-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    💰
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      Auth0 charges $240/month for similar features. We're $29.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      That's 100x more affordable for indie hackers and startups
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Tier */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Free</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">1,000 monthly active users</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">1 webhook endpoint</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Internet Identity authentication
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">API key management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Basic analytics</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant="outline"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="shadow-card border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="font-display">Pro</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">
                        <strong>10,000</strong> monthly active users
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">
                        <strong>Unlimited</strong> webhook endpoints
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Everything in Free</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Advanced analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Email support</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Tier */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Enterprise</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">
                        <strong>Custom</strong> MAU limits
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Everything in Pro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Dedicated support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">SLA guarantees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">Custom integrations</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                How We Compare
              </h2>
              <p className="text-lg text-muted-foreground">
                Built for developers, not enterprises
              </p>
            </div>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <Card className="shadow-card">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-display font-semibold">
                            Feature
                          </th>
                          <th className="text-center p-4 font-display font-semibold bg-primary/5">
                            PasskeyAuth
                          </th>
                          <th className="text-center p-4 font-display font-semibold">
                            Auth0
                          </th>
                          <th className="text-center p-4 font-display font-semibold">
                            Clerk
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="p-4 font-medium">Passkeys</td>
                          <td className="p-4 text-center bg-primary/5">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Default</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-warning" />
                              <span className="text-sm">Add-on</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Supported</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-4 font-medium">Decentralized</td>
                          <td className="p-4 text-center bg-primary/5">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Internet Computer</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center">
                              <X className="w-5 h-5 text-destructive" />
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center">
                              <X className="w-5 h-5 text-destructive" />
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-4 font-medium">RBAC</td>
                          <td className="p-4 text-center bg-primary/5">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Built-in</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-warning" />
                              <span className="text-sm">Paid tier</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Built-in</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-4 font-medium">Webhooks</td>
                          <td className="p-4 text-center bg-primary/5">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Included</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-warning" />
                              <span className="text-sm">Paid tier</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-success" />
                              <span className="text-sm">Included</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-4 font-medium">Starting price</td>
                          <td className="p-4 text-center bg-primary/5">
                            <span className="text-lg font-bold text-success">
                              $0/mo
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-lg font-bold">$35/mo</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-lg font-bold text-success">
                              $0/mo
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-4 font-medium">10K MAU price</td>
                          <td className="p-4 text-center bg-primary/5">
                            <span className="text-lg font-bold text-success">
                              $29/mo
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-lg font-bold text-destructive">
                              $240/mo
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-lg font-bold">$25/mo</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Built for Indie Hackers & Startups
              </h2>
              <p className="text-lg text-muted-foreground">
                Perfect for teams building modern applications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="shadow-card text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Code className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg">
                    SaaS Apps
                  </CardTitle>
                  <CardDescription>
                    Add secure user authentication to your web application in
                    minutes
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-card text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-info" />
                  </div>
                  <CardTitle className="font-display text-lg">
                    AI Tools
                  </CardTitle>
                  <CardDescription>
                    Protect your AI applications with modern authentication
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-card text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="font-display text-lg">
                    Mobile Apps
                  </CardTitle>
                  <CardDescription>
                    Seamless passkey support for iOS and Android applications
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-card text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-warning" />
                  </div>
                  <CardTitle className="font-display text-lg">
                    Agency Projects
                  </CardTitle>
                  <CardDescription>
                    Deploy authentication for multiple client projects
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-display font-bold">
                Start Building for Free
              </h2>
              <p className="text-xl text-muted-foreground">
                No credit card required • Free up to 1,000 monthly active users
              </p>
              <Button size="lg" onClick={handleGetStarted} className="gap-2">
                Get Started Now
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("demo")}
                    className="hover:text-foreground transition-colors"
                  >
                    Demo
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
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
        </div>
      </footer>
    </div>
  );
}
