/**
 * LMS Billing — Bastion LMS (UI Prototype)
 * Runs entirely on static mock data. Checkout and the billing portal are
 * external Stripe-hosted pages, so in a UI-only prototype those buttons show
 * a toast instead of opening a real (or broken) external URL.
 */
import { useState } from "react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { Check, CreditCard, Loader2, ExternalLink, Shield, Zap, Building2, Download, Users, Mail, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MOCK_PLANS,
  subscriptionStore,
  patchSubscription,
  MOCK_INVOICES,
  MOCK_EMPLOYEES,
  MOCK_COMPANY,
  MOCK_PAYMENT_METHOD,
} from "./mockData";

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
  const [subscriptionData, setSubscriptionData] = useState(subscriptionStore);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  const plans = MOCK_PLANS;
  const loadingPlans = false;

  const currentPlanId = subscriptionData?.plan?.id;
  const hasSubscription = subscriptionData?.hasSubscription;
  const targetPlan = plans.find((p) => p.id === pendingPlanId);
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const isUpgrade = targetPlan && currentPlan ? targetPlan.monthlyPrice > currentPlan.monthlyPrice : true;

  function handleSubscribe(planId: string) {
    if (hasSubscription && planId !== currentPlanId) {
      setPendingPlanId(planId);
      return;
    }
    confirmSubscribe(planId);
  }

  function confirmSubscribe(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setLoadingPlan(planId);
    setPendingPlanId(null);
    setTimeout(() => {
      const updated = patchSubscription({
        hasSubscription: true,
        plan: { id: plan.id, name: plan.name },
        cancelAtPeriodEnd: false,
      });
      setSubscriptionData(updated);
      setLoadingPlan(null);
      toast.success(`Switched to the ${plan.name} plan`);
    }, 600);
  }

  function handleManageBilling() {
    setPortalPending(true);
    setTimeout(() => {
      setPortalPending(false);
      toast.info("This is a UI preview — the billing portal isn't connected yet.");
    }, 600);
  }

  function handleConfirmCancel() {
    setCancelPending(true);
    setTimeout(() => {
      const updated = patchSubscription({ cancelAtPeriodEnd: true });
      setSubscriptionData(updated);
      setCancelPending(false);
      setCancelOpen(false);
      toast.success("Subscription set to cancel at period end");
    }, 500);
  }

  function handleResumeSubscription() {
    const updated = patchSubscription({ cancelAtPeriodEnd: false });
    setSubscriptionData(updated);
    toast.success("Subscription resumed");
  }

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
            <div className="flex items-center gap-2">
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
              {!subscriptionData.cancelAtPeriodEnd ? (
                <Button
                  onClick={() => setCancelOpen(true)}
                  variant="outline"
                  className="gap-2 border-white/20 text-white/70 hover:text-red-300 hover:border-red-300/40 hover:bg-white/10 bg-transparent h-auto py-2"
                >
                  <Ban className="w-4 h-4" />
                  Cancel Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleResumeSubscription}
                  variant="outline"
                  className="gap-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10 bg-transparent h-auto py-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resume Subscription
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Current subscription status */}
        {hasSubscription && subscriptionData?.plan && (
          <div className={cn(
            "border rounded-xl p-4 mb-8 flex items-center gap-3",
            subscriptionData.cancelAtPeriodEnd ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              subscriptionData.cancelAtPeriodEnd ? "bg-amber-100" : "bg-green-100"
            )}>
              {subscriptionData.cancelAtPeriodEnd ? <Ban className="w-4 h-4 text-amber-600" /> : <Check className="w-4 h-4 text-green-600" />}
            </div>
            <div>
              <p className={cn("font-semibold", subscriptionData.cancelAtPeriodEnd ? "text-amber-800" : "text-green-800")}>
                {subscriptionData.cancelAtPeriodEnd ? "Cancellation scheduled: " : "Active Subscription: "}
                {subscriptionData.plan.name} Plan
              </p>
              {subscriptionData.currentPeriodEnd && (
                <p className={cn("text-sm", subscriptionData.cancelAtPeriodEnd ? "text-amber-600" : "text-green-600")}>
                  {subscriptionData.cancelAtPeriodEnd
                    ? `Access continues until ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}, then your subscription ends.`
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

        {/* Account & Usage / Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase mb-4">Account & Usage</h3>
            {(() => {
              const currentPlan = plans.find((p) => p.id === currentPlanId);
              const seatsUsed = MOCK_EMPLOYEES.filter((e) => e.isActive).length;
              const seatsMax = currentPlan?.maxUsers ?? 0;
              const pct = seatsMax > 0 ? Math.min(100, Math.round((seatsUsed / seatsMax) * 100)) : 0;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600"><Users className="w-4 h-4 text-gray-400" /> Seats used</span>
                    <span className="font-semibold text-gray-800">
                      {seatsUsed} {seatsMax > 0 ? `/ ${seatsMax}` : "(unlimited)"}
                    </span>
                  </div>
                  {seatsMax > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-[#0047AB] h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-1.5">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Billing Contact</div>
              <div className="text-sm text-gray-800 font-semibold">{MOCK_COMPANY.contactName}</div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {MOCK_COMPANY.contactEmail}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase">Payment Method</h3>
              <button
                onClick={() => toast.info("This is a UI preview — updating your card isn't connected yet.")}
                className="text-xs font-semibold text-[#0047AB] hover:underline"
              >
                Update
              </button>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F4F6F9] rounded-xl">
              <div className="w-10 h-7 bg-[#0F1C2E] rounded flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{MOCK_PAYMENT_METHOD.brand} •••• {MOCK_PAYMENT_METHOD.last4}</div>
                <div className="text-xs text-gray-400">
                  Expires {String(MOCK_PAYMENT_METHOD.expMonth).padStart(2, "0")}/{MOCK_PAYMENT_METHOD.expYear}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase">Invoices</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50 hover:bg-gray-50">
                  <TableHead className="px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Invoice</TableHead>
                  <TableHead className="px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</TableHead>
                  <TableHead className="px-5 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="px-5 py-2.5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_INVOICES.map((inv) => (
                  <TableRow key={inv.id} className="border-gray-50">
                    <TableCell className="px-5 py-2.5">
                      <div className="text-sm font-mono text-gray-700">{inv.number}</div>
                      <div className="text-xs text-gray-400">{new Date(inv.issuedAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="px-5 py-2.5 text-sm text-gray-700">${(inv.amountCents / 100).toFixed(2)}</TableCell>
                    <TableCell className="px-5 py-2.5">
                      <Badge className={cn(
                        "border-transparent text-[10px] font-bold uppercase tracking-wide",
                        inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "open" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => toast.info("Invoice download coming soon")}
                        className="text-gray-400 hover:text-[#0047AB] transition-colors"
                        title="Download invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Test mode notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Test Mode Active</p>
          <p>
            Use card number <code className="bg-amber-100 px-1 rounded font-mono">4242 4242 4242 4242</code> with any future expiry and any CVC to test payments. No real charges will be made.
          </p>
        </div>
      </div>

      {/* Cancel subscription confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll keep full access to the {subscriptionData.plan.name} plan until{" "}
              {subscriptionData.currentPeriodEnd ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString() : "the end of your current billing period"}.
              After that, your account will move to read-only access and no further charges will be made. This won't delete any course or employee data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelPending}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmCancel(); }}
              disabled={cancelPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {cancelPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan switch confirmation */}
      <AlertDialog open={!!pendingPlanId} onOpenChange={(open) => !open && setPendingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isUpgrade ? "Upgrade" : "Switch"} to the {targetPlan?.name} plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {isUpgrade
                ? "You'll be charged a prorated amount today for the rest of this billing period, then the full plan price on your next renewal date."
                : "Your new lower rate takes effect immediately, and we'll credit the unused portion of your current plan toward future invoices."}
              {" "}Applicable sales tax is calculated and shown on your invoice at checkout — this preview doesn't process a real payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Never Mind</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); pendingPlanId && confirmSubscribe(pendingPlanId); }}
              className="bg-[#0047AB] hover:bg-[#003a8c] focus:ring-[#0047AB]"
            >
              Confirm {isUpgrade ? "Upgrade" : "Switch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LMSLayout>
  );
}
