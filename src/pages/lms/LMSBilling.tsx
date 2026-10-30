/**
 * LMS Billing — Bastion LMS
 * Real Stripe integration via hosted Checkout + Billing Portal — this page
 * never collects a card number itself. Subscribing or managing payment
 * always redirects the browser to a Stripe-hosted page; this page only
 * displays status, invoices, and payment methods (read-only).
 */
import { useCallback, useEffect, useState } from "react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { Check, CreditCard, Loader2, ExternalLink, AlertTriangle, Download, Users, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getBillingPlans, getMyBilling, createCheckoutSession, createPortalSession,
  cancelBillingSubscription, getMyInvoices, getMyPaymentMethods, getCompanyPeople,
  ApiError, type BillingPlan, type BillingSubscription, type BillingInvoice,
  type BillingPaymentMethod, type BillingInterval,
} from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  trialing: { label: "Trial", color: "bg-blue-100 text-blue-700" },
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  past_due: { label: "Payment Failed", color: "bg-red-100 text-red-700" },
  canceled: { label: "Canceled", color: "bg-gray-100 text-gray-500" },
  incomplete: { label: "Incomplete", color: "bg-amber-100 text-amber-700" },
  incomplete_expired: { label: "Expired", color: "bg-red-100 text-red-700" },
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-700" },
};

const NEEDS_ATTENTION_STATUSES = new Set(["past_due", "unpaid", "incomplete", "incomplete_expired"]);

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  monthly: "Monthly",
  annual: "Annual",
  perSeat: "Per-Seat",
};

function formatMoney(cents: number, currency: string): string {
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function priceIdFor(plan: BillingPlan, interval: BillingInterval): string {
  if (interval === "annual") return plan.annualPriceId;
  if (interval === "perSeat") return plan.perSeatPriceId;
  return plan.monthlyPriceId;
}

export default function LMSBilling() {
  const { role, setRole } = useLMS();

  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<BillingPaymentMethod[]>([]);
  const [seatsUsed, setSeatsUsed] = useState<number | null>(null);

  const [interval, setInterval_] = useState<BillingInterval>("monthly");
  const [seatQuantity, setSeatQuantity] = useState(5);
  const [checkoutPendingPlanId, setCheckoutPendingPlanId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [portalPending, setPortalPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, meRes, peopleRes] = await Promise.all([
        getBillingPlans(),
        getMyBilling(),
        getCompanyPeople({ role: "all" }),
      ]);
      setPlans(plansRes.data);
      setSubscription(meRes.data);
      setSeatsUsed(peopleRes.data.length);
      if (meRes.data) {
        const [invRes, pmRes] = await Promise.all([getMyInvoices(), getMyPaymentMethods()]);
        setInvoices(invRes.data);
        setPaymentMethods(pmRes.data);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load billing information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSubscribe(planId: string) {
    setCheckoutError(null);
    setCheckoutPendingPlanId(planId);
    try {
      const res = await createCheckoutSession({
        planId,
        interval,
        seatQuantity: interval === "perSeat" ? seatQuantity : undefined,
      });
      window.location.href = res.data.url;
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Couldn't start checkout.");
      setCheckoutPendingPlanId(null);
    }
  }

  async function handleManageBilling() {
    setPortalPending(true);
    try {
      const res = await createPortalSession();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't open the billing portal.");
      setPortalPending(false);
    }
  }

  async function handleConfirmCancel() {
    setCancelPending(true);
    try {
      const res = await cancelBillingSubscription();
      setSubscription(res.data);
      setCancelOpen(false);
      toast.success("Your subscription will end at the close of the current billing period.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't cancel the subscription.");
    } finally {
      setCancelPending(false);
    }
  }

  const plan = subscription?.planId ?? null;
  const statusCfg = subscription ? STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.active : null;
  const needsAttention = subscription ? NEEDS_ATTENTION_STATUSES.has(subscription.status) : false;
  const seatLimit = subscription?.seatLimit ?? null;
  const seatPct = seatLimit && seatsUsed != null ? Math.min(100, Math.round((seatsUsed / seatLimit) * 100)) : 0;

  return (
    <LMSLayout
      title="Billing & Subscription"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Billing" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">Billing & Subscription</h2>
            <p className="text-white/60 mt-1">
              {subscription ? "Manage your plan, payment method, and invoices." : "Choose the plan that fits your organization's safety training needs."}
            </p>
          </div>
          {subscription && (
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
              {!subscription.cancelAtPeriodEnd && subscription.status !== "canceled" && (
                <Button
                  onClick={() => setCancelOpen(true)}
                  variant="outline"
                  className="gap-2 border-white/20 text-white/70 hover:text-red-300 hover:border-red-300/40 hover:bg-white/10 bg-transparent h-auto py-2"
                >
                  <Ban className="w-4 h-4" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
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
        ) : subscription ? (
          <>
            {/* Needs-attention banner */}
            {needsAttention && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Action needed on your subscription</p>
                  <p className="text-red-600 text-sm mt-0.5">
                    Your payment needs attention before your team can keep using Bastion LMS without interruption. Use "Manage Billing" to update your card.
                  </p>
                </div>
              </div>
            )}

            {/* Current subscription status */}
            <div className={cn(
              "border rounded-xl p-4 mb-8 flex items-center gap-3",
              subscription.cancelAtPeriodEnd ? "bg-amber-50 border-amber-200" : needsAttention ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                subscription.cancelAtPeriodEnd ? "bg-amber-100" : needsAttention ? "bg-red-100" : "bg-green-100"
              )}>
                {subscription.cancelAtPeriodEnd ? <Ban className="w-4 h-4 text-amber-600" /> : needsAttention ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Check className="w-4 h-4 text-green-600" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{plan?.name ?? "Your Plan"}</p>
                  {statusCfg && (
                    <Badge className={cn("border-transparent text-[10px] font-bold uppercase tracking-wide", statusCfg.color)}>{statusCfg.label}</Badge>
                  )}
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {subscription.cancelAtPeriodEnd
                      ? `Access continues until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}, then your subscription ends.`
                      : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>

            {/* Account & Usage / Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase mb-4">Account & Usage</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600"><Users className="w-4 h-4 text-gray-400" /> Seats used</span>
                    <span className="font-semibold text-gray-800">
                      {seatsUsed ?? "—"} {seatLimit ? `/ ${seatLimit}` : "(unlimited)"}
                    </span>
                  </div>
                  {seatLimit && (
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-[#0047AB] h-2 rounded-full" style={{ width: `${seatPct}%` }} />
                    </div>
                  )}
                </div>
                {plan?.features && plan.features.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Plan Includes</div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-3.5 h-3.5 text-[#0047AB] shrink-0 mt-0.5" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Payment Method — read-only, real changes happen in the Portal */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase">Payment Method</h3>
                  <button onClick={handleManageBilling} className="text-xs font-semibold text-[#0047AB] hover:underline">
                    Update
                  </button>
                </div>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-2">
                    {paymentMethods.map((pm, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-[#F4F6F9] rounded-xl">
                        <div className="w-10 h-7 bg-[#0F1C2E] rounded flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            {pm.bankName ?? pm.brand} •••• {pm.last4}
                            {pm.isDefault && <Badge className="border-transparent text-[9px] font-bold bg-[#0047AB]/10 text-[#0047AB]">Default</Badge>}
                          </div>
                          <div className="text-xs text-gray-400">
                            Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No payment method on file.</p>
                )}
              </div>
            </div>

            {/* Invoices */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase">Invoices</h3>
                </div>
                {invoices.length > 0 ? (
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
                      {invoices.map((inv) => (
                        <TableRow key={inv.number} className="border-gray-50">
                          <TableCell className="px-5 py-2.5">
                            <div className="text-sm font-mono text-gray-700">{inv.number}</div>
                            {inv.paidAt && <div className="text-xs text-gray-400">{new Date(inv.paidAt).toLocaleDateString()}</div>}
                          </TableCell>
                          <TableCell className="px-5 py-2.5 text-sm text-gray-700">{formatMoney(inv.amountPaid || inv.amountDue, inv.currency)}</TableCell>
                          <TableCell className="px-5 py-2.5">
                            <Badge className={cn(
                              "border-transparent text-[10px] font-bold uppercase tracking-wide",
                              inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "open" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-2.5 text-right">
                            <a href={inv.pdfUrl || inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0047AB] transition-colors inline-block" title="Download invoice">
                              <Download className="w-4 h-4" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-400 py-8 text-center">No invoices yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Interval toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(Object.keys(INTERVAL_LABELS) as BillingInterval[]).map((iv) => (
                <button
                  key={iv}
                  onClick={() => setInterval_(iv)}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                    interval === iv ? "bg-[#0047AB] text-white shadow-md" : "bg-white/10 text-white/50 hover:bg-white/20"
                  )}
                >
                  {INTERVAL_LABELS[iv]}
                  {iv === "annual" && (
                    <Badge className="ml-2 bg-green-500 text-white border-transparent text-[10px] px-1.5 py-0 font-bold">Save</Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Seat quantity — only for per-seat plans */}
            {interval === "perSeat" && (
              <div className="max-w-xs mx-auto mb-6 space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wide">Number of Seats</Label>
                <Input
                  type="number"
                  min={1}
                  value={seatQuantity}
                  onChange={(e) => setSeatQuantity(Math.max(1, Number(e.target.value)))}
                  className="bg-white/5 border-white/15 text-white"
                />
              </div>
            )}

            {checkoutError && (
              <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                <p className="text-red-700 text-sm font-medium">{checkoutError}</p>
              </div>
            )}

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((p, idx) => {
                const isPopular = idx === 1;
                const isPending = checkoutPendingPlanId === p._id;
                return (
                  <div
                    key={p._id}
                    className={cn(
                      "relative rounded-2xl border-2 overflow-hidden transition-all bg-white",
                      isPopular ? "border-[#0047AB] shadow-xl shadow-blue-100 md:scale-[1.02]" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    )}
                  >
                    {isPopular && (
                      <div className="bg-[#0047AB] text-white text-xs font-bold text-center py-1.5 tracking-widest uppercase">Most Popular</div>
                    )}
                    <div className="p-6">
                      <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase mb-1">{p.name}</h3>
                      {p.description && <p className="text-gray-500 text-xs mb-4">{p.description}</p>}
                      <p className="text-gray-500 text-xs mb-4">
                        {p.seatLimit ? `Up to ${p.seatLimit} seats` : "Unlimited seats"}
                      </p>

                      <ul className="space-y-2 mb-6">
                        {p.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-[#0047AB] shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscribe(p._id)}
                        disabled={isPending || !priceIdFor(p, interval)}
                        className={cn(
                          "w-full h-auto py-3 rounded-xl font-bold text-sm tracking-wide gap-2",
                          isPopular ? "bg-[#0047AB] hover:bg-[#1565C0] text-white shadow-lg hover:shadow-xl" : "bg-[#0F1C2E] hover:bg-[#1a2d4a] text-white"
                        )}
                      >
                        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout...</> : <><CreditCard className="w-4 h-4" /> Subscribe</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Cancel subscription confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll keep full access to the {plan?.name ?? "current"} plan until{" "}
              {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "the end of your current billing period"}.
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
    </LMSLayout>
  );
}
