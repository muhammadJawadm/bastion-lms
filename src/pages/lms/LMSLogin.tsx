/**
 * LMSLogin — Bastion LMS (UI Prototype)
 * No real authentication — any credentials submitted here just land on the
 * dashboard. This screen exists to show the sign-in experience, not to
 * validate against a real account store.
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
  CheckCircle2,
  AlertCircle,
  Link2,
  CheckCircle,
  UserPlus,
  User,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Available tabs on the login page. */
type LoginTab = "password" | "magic" | "register";

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

export default function LMSLogin() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<LoginTab>("password");

  // ── Password form state ──────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Magic link form state ────────────────────────────────────────────────────
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);

  // ── Registration form state ─────────────────────────────────────────────────
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // ── Mock mutations — UI prototype only, no network calls ─────────────────────
  const [loginPending, setLoginPending] = useState(false);
  const loginMutation = {
    isPending: loginPending,
    error: null as { message: string } | null,
    mutate: (_input: { email: string; password: string }) => {
      setLoginPending(true);
      setTimeout(() => {
        setLoginPending(false);
        toast.success("Signed in successfully");
        navigate("/lms/dashboard");
      }, 500);
    },
  };

  const [magicPending, setMagicPending] = useState(false);
  const magicLinkMutation = {
    isPending: magicPending,
    error: null as { message: string } | null,
    mutate: (_input: { email: string; origin: string }) => {
      setMagicPending(true);
      setTimeout(() => {
        setMagicPending(false);
        setMagicSent(true);
        setMagicUrl(`${window.location.origin}/lms/magic?token=demo-preview-token`);
      }, 500);
    },
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  /** Register — UI prototype only, just signs the user in and lands on the dashboard. */
  const [registerPending, setRegisterPending] = useState(false);
  const registerMutation = {
    isPending: registerPending,
    error: null as { message: string } | null,
    mutate: (_input: { name: string; email: string; password: string; lmsRole: string }) => {
      setRegisterPending(true);
      setTimeout(() => {
        setRegisterPending(false);
        toast.success("Account created! Welcome to Bastion LMS.");
        navigate("/lms/dashboard");
      }, 500);
    },
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (regPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    registerMutation.mutate({
      name: regName,
      email: regEmail,
      password: regPassword,
      lmsRole: "demo",
    });
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail) return;
    magicLinkMutation.mutate({ email: magicEmail, origin: window.location.origin });
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

          <Tabs value={tab} onValueChange={(v) => setTab(v as LoginTab)}>
            <TabsList className="w-full h-auto bg-gray-100 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="password"
                className="flex-1 gap-1.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-[#0047AB] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500"
              >
                <Lock className="w-3.5 h-3.5" /> Sign In
              </TabsTrigger>
              <TabsTrigger
                value="magic"
                className="flex-1 gap-1.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-[#0047AB] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500"
              >
                <Link2 className="w-3.5 h-3.5" /> Magic Link
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 gap-1.5 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-[#0047AB] data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </TabsTrigger>
            </TabsList>

            {/* ── Password Tab ── */}
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

                <FieldError message={loginMutation.error?.message} />

                <Button
                  type="submit"
                  disabled={loginMutation.isPending || !email || !password}
                  className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl mt-2"
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setTab("magic")}
                    className="text-gray-400 hover:text-[#0047AB] text-xs transition-colors"
                  >
                    Forgot your password? Use a magic link instead →
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* ── Magic Link Tab ── */}
            <TabsContent value="magic" className="mt-0">
              {!magicSent ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Enter your email address and we'll generate a one-time login link valid for 15 minutes. No password required.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="magic-email" className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                      Email Address
                    </Label>
                    <div className={inputWrapper}>
                      <Mail className={inputIconClass} />
                      <Input
                        id="magic-email"
                        type="email"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className={inputFieldClass}
                      />
                    </div>
                  </div>

                  <FieldError message={magicLinkMutation.error?.message} />

                  <Button
                    type="submit"
                    disabled={magicLinkMutation.isPending || !magicEmail}
                    className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl"
                  >
                    {magicLinkMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating Link...</>
                    ) : (
                      <>Get Magic Link <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-900 font-semibold mb-1">Login Link Generated</p>
                    <p className="text-gray-500 text-sm">
                      Your one-time login link is ready. It expires in 15 minutes.
                    </p>
                  </div>

                  {magicUrl && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Your Login Link</p>
                      <p className="text-[#0047AB] text-xs break-all font-mono leading-relaxed">{magicUrl}</p>
                      <Button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(magicUrl);
                          toast.success("Link copied to clipboard");
                        }}
                        className="mt-3 w-full h-auto gap-1.5 text-xs font-bold uppercase tracking-wide bg-[#0047AB] hover:bg-[#1565C0] text-white py-2.5 rounded-lg"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </Button>
                      <p className="text-gray-400 text-xs mt-3 text-center">
                        Click the link or paste it in your browser to sign in.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => { setMagicSent(false); setMagicUrl(null); setMagicEmail(""); }}
                    className="w-full text-gray-400 hover:text-[#0047AB] text-xs transition-colors py-2"
                  >
                    ← Try a different email
                  </button>
                </div>
              )}
            </TabsContent>

            {/* ── Register Tab ── */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <p className="text-gray-500 text-sm leading-relaxed">
                  Create a free demo account to explore Bastion LMS. Demo accounts have access to pre-built sample courses.
                </p>

                {/* Full Name */}
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

                {/* Email */}
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

                {/* Password */}
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

                {/* Confirm Password */}
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

                <FieldError message={registerMutation.error?.message} />

                <Button
                  type="submit"
                  disabled={registerMutation.isPending || !regName || !regEmail || !regPassword || !regConfirm}
                  className="w-full h-auto gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl mt-2"
                >
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Create Demo Account</>
                  )}
                </Button>

                {/* Demo account disclaimer */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-blue-700 text-xs leading-relaxed">
                    <strong>Demo accounts</strong> have access to sample courses only. To unlock full access for your team, contact{" "}
                    <a href="mailto:info@bastionrsg.com" className="underline hover:text-blue-900">info@bastionrsg.com</a>.
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer note */}
          <p className="text-gray-400 text-xs text-center mt-8">
            {tab === "register" ? "Already have an account?" : "Don't have an account?"}{" "}
            {tab === "register" ? (
              <button onClick={() => setTab("password")} className="text-[#0047AB] hover:underline">Sign in</button>
            ) : (
              <button onClick={() => setTab("register")} className="text-[#0047AB] hover:underline">Create a free demo account</button>
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
