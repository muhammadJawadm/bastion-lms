/**
 * LMS Billing — Checkout Success
 * Stripe redirects here after a successful Checkout session:
 * /lms/billing/success?session_id={CHECKOUT_SESSION_ID}
 *
 * Calls GET /billing/confirm/:sessionId, which actively fetches the truth
 * from Stripe and updates the DB synchronously — so this can show "Active"
 * immediately instead of waiting on the webhook. The "still finishing"
 * message is only a fallback for if that call itself errors.
 */
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { confirmCheckoutSession, ApiError, type BillingSubscription } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function LMSBillingSuccess() {
  const { role, setRole } = useLMS();
  const search = useSearch();
  const sessionId = new URLSearchParams(search).get("session_id");
  const [status, setStatus] = useState<"checking" | "active" | "pending">("checking");
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sessionId) {
        if (!cancelled) setStatus("pending");
        return;
      }
      try {
        const res = await confirmCheckoutSession(sessionId);
        if (cancelled) return;
        setSubscription(res.data);
        setStatus(res.data.status === "active" ? "active" : "pending");
      } catch (err) {
        if (cancelled) return;
        // Fallback only — confirm itself failing (e.g. network blip), not the default experience.
        console.error("[LMSBillingSuccess] confirm failed:", err instanceof ApiError ? err.message : err);
        setStatus("pending");
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <LMSLayout
      title="Billing"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Billing", href: "/lms/billing" }, { label: "Checkout Complete" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="max-w-md mx-auto text-center py-16">
        {status === "checking" ? (
          <>
            <Loader2 className="w-14 h-14 text-[#1E90FF] mx-auto mb-5 animate-spin" />
            <h2 className="font-display font-extrabold text-white text-2xl uppercase mb-2">Confirming Your Subscription…</h2>
            <p className="text-white/60 text-sm">This only takes a moment.</p>
          </>
        ) : status === "active" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display font-extrabold text-white text-2xl uppercase mb-2">You're All Set!</h2>
            <p className="text-white/60 text-sm mb-6">
              {subscription?.planId?.name ? `Your ${subscription.planId.name} subscription is active. ` : "Your subscription is active. "}
              Thanks for subscribing to Bastion LMS.
            </p>
            <Button asChild className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide">
              <Link href="/lms/billing">Go to Billing</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-display font-extrabold text-white text-2xl uppercase mb-2">Payment Received</h2>
            <p className="text-white/60 text-sm mb-6">
              We're still finishing setting up your subscription — this can take a minute. Check back on the Billing page shortly.
              {sessionId && <span className="block text-white/30 text-xs mt-2 font-mono">Session: {sessionId}</span>}
            </p>
            <Button asChild className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide">
              <Link href="/lms/billing">Go to Billing</Link>
            </Button>
          </>
        )}
      </div>
    </LMSLayout>
  );
}
