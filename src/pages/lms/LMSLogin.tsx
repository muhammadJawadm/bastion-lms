/**
 * LMSLogin — Bastion LMS
 *
 * Real authentication against the backend in
 * `Bastion-LMS.postman_collection.json` (via `src/lib/api.ts`):
 *  - Sign In: POST /users/login. A 403 here means the account was never
 *    OTP-verified — this app offers to pick that verification back up
 *    rather than dead-ending.
 *  - Create Account: POST /users/register creates the Company + its first
 *    client_admin together and returns NO token (OTP-gated) — this page
 *    always follows it with an inline "enter the code" step, then chains
 *    into POST /users/login once verified so the admin lands signed in
 *    without re-typing their password.
 *  - Forgot Password: the real 3-step reset flow (request → verify OTP →
 *    set new password). Replaces the old "Magic Link" tab — the backend
 *    has no magic-link endpoint, so that tab was UI with nothing behind it.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  UserPlus,
  User,
  Building2,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLMS } from "./LMSContext";
import {
  loginUser, registerCompanyAdmin, verifyOtp, resendOtp,
  forgotPassword, verifyResetOtp, resetPassword, ApiError,
} from "@/lib/api";

/** Available tabs on the login page. */
type LoginTab = "password" | "forgot" | "register";
/** Register tab has two steps: fill the form, then confirm the emailed code. */
type RegisterStep = "form" | "verify";
/** Forgot-password tab walks through the real 3-step reset flow. */
type ForgotStep = "request" | "verify" | "reset";

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
}

const inputWrapper = "relative";
const inputIconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none";
const inputFieldClass = "h-auto pl-10 pr-4 py-3 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/10";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export default function LMSLogin() {
  const [, navigate] = useLocation();
  const { login } = useLMS();
  const [tab, setTab] = useState<LoginTab>("password");

  // ── Sign In ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoginError(null);
    setLoginPending(true);
    try {
      const res = await loginUser({ email, password });
      if (!res.token) throw new ApiError(500, "Sign-in succeeded but no session token was returned.", res);
      login(res.token, res.data);
      toast.success(`Welcome back, ${res.data.name?.split(" ")[0] ?? ""}`);
      navigate("/lms/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        // Unverified account — pick the OTP step back up instead of dead-ending.
        setRegEmail(email);
        setRegPassword(password);
        setRegisterStep("verify");
        setTab("register");
        toast.info("That account hasn't been verified yet — enter the code we emailed you.");
      } else {
        setLoginError(apiErrorMessage(err, "Couldn't sign in. Check your email and password."));
      }
    } finally {
      setLoginPending(false);
    }
  };

  // ── Create Account ───────────────────────────────────────────────────────
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [regName, setRegName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [registerPending, setRegisterPending] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [regOtp, setRegOtp] = useState("");
  const [verifyPending, setVerifyPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (regPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setRegisterError(null);
    setRegisterPending(true);
    try {
      await registerCompanyAdmin({ name: regName, email: regEmail, password: regPassword, companyName: regCompany });
      toast.success("Account created — check your email for a verification code.");
      setRegisterStep("verify");
    } catch (err) {
      setRegisterError(apiErrorMessage(err, "Couldn't create that account."));
    } finally {
      setRegisterPending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOtp.trim()) return;
    setRegisterError(null);
    setVerifyPending(true);
    try {
      await verifyOtp({ email: regEmail, otp: regOtp.trim() });
      // Verification doesn't itself sign you in — follow with a real login,
      // same two calls the collection's own run order makes (1.3 then 1.4).
      const res = await loginUser({ email: regEmail, password: regPassword });
      if (!res.token) throw new ApiError(500, "Verified, but signing in automatically failed — sign in manually.", res);
      login(res.token, res.data);
      toast.success("Email verified — welcome to Bastion LMS.");
      navigate("/lms/dashboard");
    } catch (err) {
      setRegisterError(apiErrorMessage(err, "That code didn't work — double check it and try again."));
    } finally {
      setVerifyPending(false);
    }
  };

  const handleResendOtp = async () => {
    setResendPending(true);
    try {
      await resendOtp({ email: regEmail });
      toast.success("New code sent.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't resend the code."));
    } finally {
      setResendPending(false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError(null);
    setForgotPending(true);
    try {
      await forgotPassword({ email: forgotEmail });
      toast.success("Check your email for a reset code.");
      setForgotStep("verify");
    } catch (err) {
      setForgotError(apiErrorMessage(err, "Couldn't start the reset — check the email address."));
    } finally {
      setForgotPending(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) return;
    setForgotError(null);
    setForgotPending(true);
    try {
      await verifyResetOtp({ email: forgotEmail, otp: forgotOtp.trim() });
      setForgotStep("reset");
    } catch (err) {
      setForgotError(apiErrorMessage(err, "That code didn't work — double check it and try again."));
    } finally {
      setForgotPending(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setForgotError(null);
    setForgotPending(true);
    try {
      await resetPassword({ email: forgotEmail, password: newPassword, confirmPassword: newPasswordConfirm });
      toast.success("Password updated — sign in with your new password.");
      setEmail(forgotEmail);
      setTab("password");
      setForgotStep("request");
      setForgotEmail(""); setForgotOtp(""); setNewPassword(""); setNewPasswordConfirm("");
    } catch (err) {
      setForgotError(apiErrorMessage(err, "Couldn't reset the password."));
    } finally {
      setForgotPending(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F1C2E] flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#1E90FF 1px, transparent 1px), linear-gradient(90deg, #1E90FF 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#0047AB] rounded-full blur-[100px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#1E90FF] rounded-full blur-[120px] opacity-[0.08] pointer-events-none" />

        <div className="relative z-10">
          <Link href="/lms/about">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#0047AB] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-extrabold text-white text-lg uppercase leading-none tracking-wide">Bastion</div>
                <div className="text-[#1E90FF] text-[10px] font-bold uppercase tracking-[2.5px]">LMS</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="font-display font-extrabold text-white text-5xl uppercase leading-tight mb-6">
            Safety Training<br />
            <span className="text-[#1E90FF]">That Works</span><br />
            in the Field.
          </h2>
          <div className="space-y-3">
            {[
              "Mobile-first for field workers",
              "Custom safety course builder",
              "Instant PDF certificates",
              "Real-time compliance tracking",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E90FF]/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-[#1E90FF]" />
                </div>
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">
          © 2026 Bastion Risk and Safety Group, LLC
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#0047AB] flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase leading-none">Bastion LMS</div>
          </div>

          <h1 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to access your Bastion LMS account.</p>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as LoginTab)}
          >
            <TabsList className="w-full h-auto bg-gray-100 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="password"
                className="flex-1 gap-1.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-[#0047AB] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500"
              >
                <Lock className="w-3.5 h-3.5" /> Sign In
              </TabsTrigger>
              <TabsTrigger
                value="forgot"
                className="flex-1 gap-1.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-[#0047AB] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500"
              >
                <KeyRound className="w-3.5 h-3.5" /> Forgot Password
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 gap-1.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-[#0047AB] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </TabsTrigger>
            </TabsList>

            {/* ── Sign In Tab ── */}
            <TabsContent value="password" className="mt-0">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                    Email Address
                  </Label>
                  <div className={inputWrapper}>
                    <Mail className={inputIconClass} />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className={inputFieldClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                    Password
                  </Label>
                  <div className={inputWrapper}>
                    <Lock className={inputIconClass} />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={cn(inputFieldClass, "pr-12")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <FieldError message={loginError} />

                <Button
                  type="submit"
                  disabled={loginPending || !email || !password}
                  className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl mt-2"
                >
                  {loginPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setTab("forgot")}
                    className="text-gray-400 hover:text-[#0047AB] text-xs transition-colors"
                  >
                    Forgot your password? →
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* ── Forgot Password Tab ── */}
            <TabsContent value="forgot" className="mt-0">
              {forgotStep === "request" && (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Enter your account email and we'll send you a reset code.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Email Address
                    </Label>
                    <div className={inputWrapper}>
                      <Mail className={inputIconClass} />
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className={inputFieldClass}
                      />
                    </div>
                  </div>
                  <FieldError message={forgotError} />
                  <Button
                    type="submit"
                    disabled={forgotPending || !forgotEmail}
                    className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl"
                  >
                    {forgotPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending Code...</>
                    ) : (
                      <>Send Reset Code <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </form>
              )}

              {forgotStep === "verify" && (
                <form onSubmit={handleForgotVerify} className="space-y-4">
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Enter the code we sent to <strong className="text-gray-800">{forgotEmail}</strong>.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-otp" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Reset Code
                    </Label>
                    <div className={inputWrapper}>
                      <ShieldCheck className={inputIconClass} />
                      <Input
                        id="forgot-otp"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        placeholder="123456"
                        required
                        className={cn(inputFieldClass, "tracking-[0.3em] font-mono")}
                      />
                    </div>
                  </div>
                  <FieldError message={forgotError} />
                  <Button
                    type="submit"
                    disabled={forgotPending || !forgotOtp}
                    className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl"
                  >
                    {forgotPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify Code"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setForgotStep("request")}
                    className="w-full text-gray-400 hover:text-[#0047AB] text-xs transition-colors py-1"
                  >
                    ← Use a different email
                  </button>
                </form>
              )}

              {forgotStep === "reset" && (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <p className="text-gray-500 text-sm leading-relaxed">Choose a new password for your account.</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      New Password <span className="text-gray-400 normal-case font-normal">(min. 8 characters)</span>
                    </Label>
                    <div className={inputWrapper}>
                      <Lock className={inputIconClass} />
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className={inputFieldClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password-confirm" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Confirm New Password
                    </Label>
                    <div className={inputWrapper}>
                      <Lock className={inputIconClass} />
                      <Input
                        id="new-password-confirm"
                        type="password"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={inputFieldClass}
                      />
                    </div>
                  </div>
                  <FieldError message={forgotError} />
                  <Button
                    type="submit"
                    disabled={forgotPending || !newPassword || !newPasswordConfirm}
                    className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl"
                  >
                    {forgotPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : "Set New Password"}
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* ── Create Account Tab ── */}
            <TabsContent value="register" className="mt-0">
              {registerStep === "form" ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Set up your company's Bastion LMS account. You'll be the first Company Admin.
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-company" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Company Name
                    </Label>
                    <div className={inputWrapper}>
                      <Building2 className={inputIconClass} />
                      <Input
                        id="reg-company"
                        type="text"
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="Pacific Coast Contractors"
                        required
                        className={inputFieldClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Full Name
                    </Label>
                    <div className={inputWrapper}>
                      <User className={inputIconClass} />
                      <Input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                        className={inputFieldClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Email Address
                    </Label>
                    <div className={inputWrapper}>
                      <Mail className={inputIconClass} />
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className={inputFieldClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Password <span className="text-gray-400 normal-case font-normal">(min. 8 characters)</span>
                    </Label>
                    <div className={inputWrapper}>
                      <Lock className={inputIconClass} />
                      <Input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className={cn(inputFieldClass, "pr-12")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Confirm Password
                    </Label>
                    <div className={inputWrapper}>
                      <Lock className={inputIconClass} />
                      <Input
                        id="reg-confirm"
                        type={showRegConfirm ? "text" : "password"}
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={cn(inputFieldClass, "pr-12")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <FieldError message={registerError} />

                  <Button
                    type="submit"
                    disabled={registerPending || !regName || !regCompany || !regEmail || !regPassword || !regConfirm}
                    className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl mt-2"
                  >
                    {registerPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Create Account</>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                    <ShieldCheck className="w-9 h-9 text-[#0047AB] mx-auto mb-3" />
                    <p className="text-gray-900 font-semibold mb-1">Verify Your Email</p>
                    <p className="text-gray-500 text-sm">
                      We sent a code to <strong className="text-gray-800">{regEmail}</strong>. Enter it below to finish setting up your account.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-otp" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Verification Code
                    </Label>
                    <div className={inputWrapper}>
                      <ShieldCheck className={inputIconClass} />
                      <Input
                        id="reg-otp"
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value)}
                        placeholder="123456"
                        required
                        autoFocus
                        className={cn(inputFieldClass, "tracking-[0.3em] font-mono")}
                      />
                    </div>
                  </div>

                  <FieldError message={registerError} />

                  <Button
                    type="submit"
                    disabled={verifyPending || !regOtp}
                    className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl"
                  >
                    {verifyPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify & Sign In"}
                  </Button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setRegisterStep("form")}
                      className="text-gray-400 hover:text-[#0047AB] transition-colors"
                    >
                      ← Edit details
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendPending}
                      className="text-gray-400 hover:text-[#0047AB] transition-colors disabled:opacity-50"
                    >
                      {resendPending ? "Sending…" : "Resend code"}
                    </button>
                  </div>
                </form>
              )}

              {registerStep === "form" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mt-4">
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Already have a team account? Ask your Company Admin to{" "}
                    <Link href="/lms/employees"><span className="underline hover:text-blue-900 cursor-pointer">add you as an employee</span></Link>{" "}
                    instead of creating a new company here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer note */}
          <p className="text-gray-400 text-xs text-center mt-8">
            {tab === "register" ? "Already have an account?" : "Don't have an account?"}{" "}
            {tab === "register" ? (
              <button onClick={() => setTab("password")} className="text-[#0047AB] hover:underline">Sign in</button>
            ) : (
              <button onClick={() => setTab("register")} className="text-[#0047AB] hover:underline">Create one</button>
            )}
          </p>

          {/* Back to main site */}
          <div className="mt-4 text-center">
            <Link href="/">
              <span className="text-xs text-gray-400 hover:text-[#0047AB] transition-colors cursor-pointer">
                ← Back to Bastion RSG
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
