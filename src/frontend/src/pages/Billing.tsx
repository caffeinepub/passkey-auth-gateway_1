import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Info } from "lucide-react";
import { useGetCurrentTenant } from "../hooks/useQueries";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

export default function Billing() {
  const { data: tenant, isLoading: tenantLoading } = useGetCurrentTenant();

  // Generate mailto link with tenant ID
  const getUpgradeMailto = () => {
    const subject = encodeURIComponent("Upgrade to Pro Plan");
    const body = encodeURIComponent(
      `Hi, I'd like to upgrade to the Pro plan.\n\nMy Tenant ID: ${tenant?.id || "N/A"}`
    );
    return `mailto:support@avantkey.com?subject=${subject}&body=${body}`;
  };

  const getEnterpriseMailto = () => {
    const subject = encodeURIComponent("Enterprise Plan Inquiry");
    const body = encodeURIComponent(
      `Hi, I'd like to learn more about the Enterprise plan.\n\nMy Tenant ID: ${tenant?.id || "N/A"}`
    );
    return `mailto:support@avantkey.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-display font-semibold">Billing & Plans</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Loading State */}
      {tenantLoading && (
        <LoadingSkeleton variant="card" count={3} />
      )}

      {/* Current Plan Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
              <CardDescription className="mt-2">
                You're on the Free tier. Upgrade to Pro for more capacity and features.
              </CardDescription>
            </div>
            <Badge className="bg-success text-white hover:bg-success/90">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold font-display">Free Plan</p>
              <p className="text-sm text-muted-foreground mt-1">
                1,000 Monthly Active Users included
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beta Message */}
      <Card className="border-primary/20 bg-primary/5 shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                🎉 We're in beta!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact us to upgrade and we'll set up your Pro plan personally with onboarding support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Comparison */}
      <div>
        <h3 className="text-xl font-display font-semibold mb-4">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold font-display">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">1,000 Monthly Active Users</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">1 webhook endpoint</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">All core features included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Basic support</span>
                </li>
              </ul>
              <Button variant="outline" disabled className="w-full">
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan (Most Popular) */}
          <Card className="shadow-card border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-white hover:bg-primary/90">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="font-display">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold font-display">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">10,000 Monthly Active Users</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited webhooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">All core features included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              <Button asChild className="w-full">
                <a href={getUpgradeMailto()}>
                  Upgrade to Pro
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold font-display">Custom</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Custom MAU limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited webhooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">All core features included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Dedicated support + SLA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">Custom contracts</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <a href={getEnterpriseMailto()}>
                  Contact Us for Enterprise
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Callout */}
      <Card className="border-warning/20 bg-warning/5 shadow-card">
        <CardContent className="pt-6">
          <p className="text-sm text-center">
            <span className="font-semibold">💰 100x more affordable than Auth0.</span> $29/month vs $240/month. Same security. Better infrastructure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
