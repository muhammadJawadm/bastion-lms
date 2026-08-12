/**
 * LMS Billing — Bastion LMS (UI Prototype)
 * Runs entirely on static mock data. Checkout and the billing portal are
 * external Stripe-hosted pages, so in a UI-only prototype those buttons show
 * a toast instead of opening a real (or broken) external URL.
 */
import { useState } from "react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { Check, CreditCard, Loader2, ExternalLink, Shield, Zap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_PLANS, MOCK_SUBSCRIPTION } from "./mockData";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Shield className="w-6 h-6" />,
  professional: <Zap className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
};

export default function LMSBilling() {
  const { role, setRole } = useLMS();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalPending, setPortalPending] = useState(false);

  const plans = MOCK_PLANS;
  const loadingPlans = false;
  const subscriptionData = MOCK_SUBSCRIPTION;

  function handleSubscribe(planId: string) {
    setLoadingPlan(planId);
    setTimeout(() => {
      setLoadingPlan(null);
      toast.info("This is a UI preview — checkout isn't connected yet.");
    }, 600);
  }

  function handleManageBilling() {
    setPortalPending(true);
    setTimeout(() => {
      setPortalPending(false);
      toast.info("This is a UI preview — the billing portal isn't connected yet.");
    }, 600);
  }

  const currentPlanId = subscriptionData?.plan?.id;
  const hasSubscription = subscriptionData?.hasSubscription;

  return (
    <LMSLayout
      title="Billing & Subscription"
      breadcrumbs={[
        { label: "Bastion LMS", href: "/lms" },
        { label: "Billing" },
      ]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">
              Billing & Subscription
            </h2>
            <p className="text-white/60 mt-1">
              Choose the plan that fits your organization's safety training needs.
            </p>
          </div>
          {hasSubscription && (
            <Button
              onClick={handleManageBilling}
              disabled={portalPending}
              variant="outline"
              className="gap-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10 bg-transparent h-auto py-2"
            >
              {portalPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Manage Billing
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Current subscription status */}
        {hasSubscription && subscriptionData?.plan && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">
                Active Subscription: {subscriptionData.plan.name} Plan
              </p>
              {subscriptionData.currentPeriodEnd && (
                <p className="text-green-600 text-sm">
                  {subscriptionData.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all",
              billingCycle === "monthly" ? "bg-[#0047AB] text-white shadow-md" : "bg-white/10 text-white/50 hover:bg-white/20"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2",
              billingCycle === "annual" ? "bg-[#0047AB] text-white shadow-md" : "bg-white/10 text-white/50 hover:bg-white/20"
            )}
          >
            Annual
            <Badge className="bg-green-500 text-white border-transparent text-[10px] px-1.5 py-0 font-bold">Save 20%</Badge>
          </button>
        </div>

        {/* Plans grid */}
        {loadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-100 bg-white p-6 space-y-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => {
              const isPopular = plan.id === "professional";
              const isCurrent = plan.id === currentPlanId;
              const priceInCents = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
              const price = (priceInCents / 100).toFixed(0);
              const isLoading = loadingPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border-2 overflow-hidden transition-all bg-white",
                    isPopular
                      ? "border-[#0047AB] shadow-xl shadow-blue-100 md:scale-[1.02]"
                      : isCurrent
                      ? "border-green-400 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  )}
                >
                  {isPopular && (
                    <div className="bg-[#0047AB] text-white text-xs font-bold text-center py-1.5 tracking-widest uppercase">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && !isPopular && (
                    <div className="bg-green-500 text-white text-xs font-bold text-center py-1.5 tracking-widest uppercase">
                      Current Plan
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("p-2 rounded-lg", isPopular ? "bg-[#0047AB] text-white" : "bg-gray-100 text-gray-600")}>
                        {PLAN_ICONS[plan.id]}
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase">{plan.name}</h3>
                        <p className="text-gray-500 text-xs">
                          {plan.maxUsers ? `Up to ${plan.maxUsers} users` : "Unlimited users"}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-extrabold text-[#0F1C2E]">${price}</span>
                        <span className="text-gray-500 text-sm mb-1">/mo</span>
                      </div>
                      {billingCycle === "annual" && (
                        <p className="text-green-600 text-xs font-semibold mt-0.5">
                          Billed annually — save ${(((plan.monthlyPrice - plan.annualPrice) * 12) / 100).toFixed(0)}/year
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-[#0047AB] flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading || isCurrent}
                      className={cn(
                        "w-full h-auto py-3 rounded-xl font-bold text-sm tracking-wide gap-2",
                        isCurrent
                          ? "bg-green-100 hover:bg-green-100 text-green-700 cursor-default"
                          : isPopular
                          ? "bg-[#0047AB] hover:bg-[#1565C0] text-white shadow-lg hover:shadow-xl"
                          : "bg-[#0F1C2E] hover:bg-[#1a2d4a] text-white"
                      )}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : isCurrent ? (
                        <><Check className="w-4 h-4" /> Current Plan</>
                      ) : (
                        <><CreditCard className="w-4 h-4" /> {hasSubscription ? "Switch Plan" : "Get Started"}</>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Test mode notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Test Mode Active</p>
          <p>
            Use card number <code className="bg-amber-100 px-1 rounded font-mono">4242 4242 4242 4242</code> with any future expiry and any CVC to test payments. No real charges will be made.
          </p>
        </div>
      </div>
    </LMSLayout>
  );
}
