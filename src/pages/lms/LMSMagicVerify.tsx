/**
 * LMSMagicVerify — Bastion LMS (UI Prototype)
 * Route: /lms/magic?token=<token>
 * No real verification — any token shown on the Magic Link tab of the login
 * page just walks through the success animation and lands on the dashboard.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Shield, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LMSMagicVerify() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setErrorMessage("No login token found in the URL. Please request a new magic link.");
      return;
    }
    const timer = setTimeout(() => {
      setStatus("success");
      setTimeout(() => navigate("/lms/dashboard"), 1500);
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1C2E] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#1E90FF 1px, transparent 1px), linear-gradient(90deg, #1E90FF 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#0047AB] rounded-full blur-[120px] opacity-20 pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 mb-12">
        <div className="w-12 h-12 rounded-xl bg-[#0047AB] flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-display font-extrabold text-white text-xl uppercase leading-none tracking-wide">Bastion</div>
          <div className="text-[#1E90FF] text-[10px] font-bold uppercase tracking-[2.5px]">LMS</div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm text-center bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        {status === "verifying" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1E90FF] mx-auto" />
            <p className="text-white font-semibold text-lg">Verifying your login link...</p>
            <p className="text-white/40 text-sm">Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-400" />
            </div>
            <p className="text-white font-semibold text-xl">Signed In Successfully</p>
            <p className="text-white/50 text-sm">Redirecting you to your dashboard...</p>
            <div className="flex items-center justify-center gap-2 text-[#1E90FF] text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-xl mb-2">Link Invalid or Expired</p>
              <p className="text-white/50 text-sm leading-relaxed">{errorMessage}</p>
            </div>
            <div className="space-y-3 pt-2">
              <Button
                asChild
                className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl"
              >
                <a href="/lms/login">
                  Back to Sign In <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <p className="text-white/30 text-xs">
                Request a new magic link from the Sign In page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
