/**
 * LMS About — Full marketing page for Bastion LMS
 * Public-facing: showcases platform features, how it works, who it's for,
 * comparison vs generic LMS platforms, and a strong CTA.
 * Design: dark navy + cobalt blue brand palette, asymmetric sections, scroll reveals.
 */

import { useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Shield, BookOpen, Users, BarChart3, Award, Smartphone,
  CheckCircle2, ArrowRight, Building2, HardHat, Anchor, Zap,
  FileText, Lock, Globe, X, Check, ChevronRight, Star,
  ClipboardList, TrendingUp, Download, PlayCircle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// ── Scroll reveal hook ──────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("lms-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`lms-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    title: "OSHA-Specific Course Library",
    desc: "Pre-built courses covering Fall Protection, Hazard Communication, PPE, Lockout/Tagout, Confined Space, Scaffolding, and more — written in the language of the field, not the classroom.",
    accent: "#0047AB",
  },
  {
    icon: Building2,
    title: "Drag-and-Drop Course Builder",
    desc: "Build custom safety training in minutes using videos (YouTube, Vimeo, or direct upload), PDFs, text lessons, and quizzes. Create Toolbox Talks and site-specific orientations instantly.",
    accent: "#0047AB",
  },
  {
    icon: Users,
    title: "Workforce Management",
    desc: "Bulk-upload your entire crew via CSV. Assign training by job title, department, or crew. Track who has completed what — and who hasn't — in real time.",
    accent: "#0047AB",
  },
  {
    icon: BarChart3,
    title: "Compliance Dashboards",
    desc: "Real-time visibility into completion rates, overdue training, and expiring certifications. Know your compliance posture before OSHA does.",
    accent: "#0047AB",
  },
  {
    icon: Award,
    title: "Automatic PDF Certificates",
    desc: "Certificates are generated instantly when a worker completes a course. QR-code verifiable on the job site. Download as PDF — no manual paperwork, no printing required.",
    accent: "#0047AB",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    desc: "Built for field workers. Works on any smartphone or tablet — no app download required. Training happens where the work happens.",
    accent: "#0047AB",
  },
  {
    icon: Globe,
    title: "Multi-Client Portal",
    desc: "Safety consultants and staffing firms can manage all their client companies from a single dashboard. Separate data, unified control.",
    accent: "#0047AB",
  },
  {
    icon: Lock,
    title: "Role-Based Access Control",
    desc: "Platform admins, client admins, and employees each see exactly what they need. No accidental access to other companies' data.",
    accent: "#0047AB",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Reporting",
    desc: "Export compliance reports as CSV. Track completion rates, overdue training, and certificate expiration dates across your entire workforce.",
    accent: "#0047AB",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Building2,
    title: "Set Up Your Company",
    desc: "Create your organization profile and invite your safety team. Takes less than 10 minutes.",
  },
  {
    step: "02",
    icon: BookOpen,
    title: "Build or Select Courses",
    desc: "Choose from our pre-built OSHA course library or build your own using the course builder. Add videos, PDFs, and quizzes.",
  },
  {
    step: "03",
    icon: Users,
    title: "Add Your Workforce",
    desc: "Upload employees via CSV or add them individually. Assign training by name, crew, department, or job title.",
  },
  {
    step: "04",
    icon: ClipboardList,
    title: "Track & Prove Compliance",
    desc: "Monitor completion in real time. Generate compliance reports. Issue certificates. Be ready for any inspection.",
  },
];

const INDUSTRIES = [
  { icon: HardHat, label: "Construction & General Contracting" },
  { icon: Anchor, label: "Maritime & Shipyard Operations" },
  { icon: Zap, label: "Electrical Contractors" },
  { icon: Shield, label: "Utility & Infrastructure" },
  { icon: Building2, label: "Industrial & Manufacturing" },
  { icon: FileText, label: "Oil & Gas" },
  { icon: Users, label: "Safety Consultants & Staffing Firms" },
  { icon: Globe, label: "Public Works & Government" },
];

const COMPARISON = [
  { feature: "Safety-specific course content", bastion: true, generic: false },
  { feature: "Built for field workers (not HR)", bastion: true, generic: false },
  { feature: "Bulk CSV employee upload", bastion: true, generic: true },
  { feature: "Automatic PDF certificate generation", bastion: true, generic: true },
  { feature: "Multi-client portal for consultants", bastion: true, generic: false },
  { feature: "Competent Person training content", bastion: true, generic: false },
  { feature: "QR-verifiable certificates", bastion: true, generic: false },
  { feature: "Mobile-first (no app download)", bastion: true, generic: true },
  { feature: "Real-time compliance dashboards", bastion: true, generic: true },
  { feature: "Built by a safety professional", bastion: true, generic: false },
];

const TESTIMONIALS = [
  {
    quote: "We went from spreadsheets and paper sign-in sheets to a fully documented, audit-ready training program in under a week. Bastion LMS is exactly what we needed.",
    name: "Project Safety Manager",
    company: "General Contractor, San Diego",
    initials: "PS",
  },
  {
    quote: "As a safety consultant managing 12 client companies, having one platform where I can see all of their compliance status in real time is a game-changer.",
    name: "Independent Safety Consultant",
    company: "Southern California",
    initials: "SC",
  },
  {
    quote: "Our foremen actually use it. That says everything. The mobile interface is simple enough that workers who have never used training software can complete a course on their phone.",
    name: "EHS Director",
    company: "Maritime Contractor, Los Angeles",
    initials: "EH",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function LMSAbout() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Helmet>
        <title>Bastion LMS — Safety Training Platform for Construction, Maritime & Industrial</title>
        <meta name="description" content="Bastion LMS is a Learning Management System built specifically for construction, maritime, utility, and industrial industries. OSHA course library, automatic PDF certificates, bulk workforce management, and real-time compliance dashboards." />
        <style>{`
          .lms-reveal {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.55s ease, transform 0.55s ease;
          }
          .lms-visible {
            opacity: 1;
            transform: translateY(0);
          }
        `}</style>
      </Helmet>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F1C2E]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/lms">
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="font-display font-extrabold text-white text-lg uppercase tracking-wide leading-none">Bastion</span>
              <span className="text-[#1E90FF] font-bold text-xs uppercase tracking-[2px]">LMS</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#industries" className="hover:text-white transition-colors">Industries</a>
            <a href="#compare" className="hover:text-white transition-colors">Compare</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="hidden sm:block text-white/50 hover:text-white/90 text-xs font-semibold border border-white/15 hover:border-white/30 px-3 py-1.5 rounded transition-colors">← Bastion RSG</button>
            </Link>
            <Link href="/lms/login">
              <button className="text-white/80 hover:text-white text-sm font-medium transition-colors hidden sm:block">Sign In</button>
            </Link>
            <Link href="/lms/login">
              <button className="bg-[#1E90FF] hover:bg-blue-400 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-[#0F1C2E] pt-28 pb-0 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#1E90FF 1px, transparent 1px), linear-gradient(90deg, #1E90FF 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0047AB]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            {/* Left: Copy */}
            <div className="pb-20">
              <h1 className="font-display font-extrabold text-white leading-none mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
                SAFETY TRAINING<br />
                <span className="text-[#1E90FF]">THAT ACTUALLY</span><br />
                GETS USED.
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
                Bastion LMS is the only Learning Management System built specifically for construction, maritime, utility, and industrial workforces — by a safety professional who has worked in the field.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/lms/login">
                  <button className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-lg transition-colors group">
                    Log Into Bastion LMS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

            </div>

            {/* Right: Dashboard mockup card */}
            <div className="relative pb-0 hidden lg:block">
              <div className="bg-[#0a1628] border border-white/10 rounded-t-2xl overflow-hidden shadow-2xl">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0F1C2E]">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <div className="ml-3 flex-1 bg-white/5 rounded px-3 py-1 text-white/30 text-xs">bastionrsg.com/lms/dashboard</div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white/40 text-xs uppercase tracking-wide">Company Dashboard</div>
                      <div className="text-white font-bold text-lg">Pacific Coast Contractors, Inc.</div>
                    </div>
                    <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full">Compliant</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Employees", value: "52" },
                      { label: "Completed", value: "38" },
                      { label: "Overdue", value: "3" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-white font-bold text-xl">{s.value}</div>
                        <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bars */}
                  <div className="space-y-2">
                    {[
                      { name: "Fall Protection Fundamentals", pct: 92 },
                      { name: "Confined Space Entry", pct: 78 },
                      { name: "Hazard Communication", pct: 65 },
                    ].map((c) => (
                      <div key={c.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60">{c.name}</span>
                          <span className="text-[#1E90FF] font-bold">{c.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full">
                          <div className="h-1.5 bg-[#1E90FF] rounded-full" style={{ width: `${c.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Certificate row */}
                  <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold">Certificate Ready</div>
                      <div className="text-white/40 text-xs">BLMS-2026-A8F2K1 · Expires 2029</div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#0047AB] text-white text-xs font-bold px-2 py-1 rounded">
                      <Download className="w-3 h-3" /> PDF
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Diagonal cut */}
        <div className="h-16 bg-white" style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#0047AB] py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "1,000s", label: "Workers Trained" },
              { value: "OSHA", label: "Authorized Trainer" },
              { value: "3 Industries", label: "Construction · Maritime · GI" },
              { value: "DVBE", label: "Certified Business" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display font-extrabold text-white text-3xl">{s.value}</div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-3">Our Mission</div>
            <h2 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase leading-tight mb-6">
              Compliance Shouldn't Be Complicated
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              Most LMS platforms are built for corporate HR departments — not for a foreman managing 40 ironworkers on a job site. The result is clunky software that nobody uses, training records that live in spreadsheets, and compliance gaps that only get discovered during an OSHA inspection.
            </p>
            <p className="text-gray-600 leading-relaxed mb-5">
              Bastion LMS was built to solve that problem. Every feature was designed with one question in mind: <strong className="text-[#0F1C2E]">would a field supervisor actually use this?</strong>
            </p>
            <p className="text-gray-600 leading-relaxed">
              The platform is simple enough for a worker who has never used training software, and powerful enough for a safety consultant managing 20 client companies.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="bg-[#F4F6F9] rounded-2xl p-8 border-l-4 border-[#0047AB]">
              <div className="text-[#0047AB] text-xs font-bold uppercase tracking-widest mb-4">Built by a Safety Professional</div>
              <p className="text-gray-700 leading-relaxed mb-6 italic text-lg">
                "I spent years as a Regional Safety Manager watching companies fail OSHA inspections not because they didn't train their workers — but because they couldn't <em>prove</em> it. Bastion LMS exists to close that gap."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0047AB] flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0">B</div>
                <div>
                  <div className="font-bold text-[#0F1C2E]">Bastion Risk & Safety Group, LLC</div>
                  <div className="text-gray-500 text-sm">Marine Corps Veteran · OSHA Authorized Trainer · Maritime Safety Professional</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[#F4F6F9] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-3">Platform Features</div>
            <h2 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase">
              Everything You Need to Train, Track,<br className="hidden md:block" /> and Prove Compliance
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 60}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-[#0047AB]/20 transition-all h-full group">
                    <div className="w-10 h-10 rounded-xl bg-[#0047AB]/10 flex items-center justify-center mb-4 group-hover:bg-[#0047AB] transition-colors">
                      <Icon className="w-5 h-5 text-[#0047AB] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-display font-bold text-[#0F1C2E] text-base uppercase mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-3">How It Works</div>
          <h2 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase">
            Up and Running in Under an Hour
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            No IT department required. No lengthy onboarding. Just a straightforward setup that gets your workforce trained and documented.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.step} delay={i * 80}>
                <div className="relative">
                  {/* Connector line */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#0047AB]/30 to-transparent z-0" />
                  )}
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#0047AB] flex items-center justify-center mb-4 shadow-lg shadow-[#0047AB]/20">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="font-display font-extrabold text-[#0047AB]/20 text-5xl leading-none mb-2">{step.step}</div>
                    <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Industries ── */}
      <section id="industries" className="bg-[#0047AB] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">Who It's For</div>
            <h2 className="font-display font-extrabold text-white text-4xl uppercase">Built for Your Industry</h2>
            <p className="text-blue-200 mt-4 max-w-xl mx-auto">
              Bastion LMS was designed for industries where safety training is a regulatory requirement, not a corporate formality.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {INDUSTRIES.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.label} delay={i * 50}>
                  <div className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-5 py-5 flex flex-col items-center gap-3 text-center group cursor-default">
                    <Icon className="w-6 h-6 text-blue-200 group-hover:text-white transition-colors" />
                    <span className="text-white font-semibold text-sm leading-tight">{item.label}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section id="compare" className="py-24 max-w-5xl mx-auto px-6">
        <Reveal className="text-center mb-14">
          <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-3">Why Bastion LMS</div>
          <h2 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase">
            Not Just Another LMS
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            Generic LMS platforms are built for corporate onboarding. Bastion LMS is built for the job site.
          </p>
        </Reveal>
        <Reveal>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-gray-400 font-semibold text-xs uppercase tracking-wide w-1/2">Feature</th>
                  <th className="px-6 py-4 text-center w-1/4">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-display font-extrabold text-[#0047AB] text-base uppercase">Bastion LMS</span>
                      <span className="text-[#1E90FF] text-xs">Field-Built</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center w-1/4">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-semibold text-gray-400 text-base">Generic LMS</span>
                      <span className="text-gray-300 text-xs">Corporate HR</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      {row.bastion ? (
                        <Check className="w-5 h-5 text-[#0047AB] mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.generic ? (
                        <Check className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-[#F4F6F9] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-3">What People Are Saying</div>
            <h2 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase">
              From the Field
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed italic flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-[#0047AB] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F1C2E] text-sm">{t.name}</div>
                      <div className="text-gray-400 text-xs">{t.company}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ── */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-3">Try It Yourself</div>
            <h2 className="font-display font-extrabold text-[#0F1C2E] text-4xl uppercase">
              See the Platform in Action
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              No sign-up required. Choose a role below to explore a fully interactive preview of the Bastion LMS dashboard — with realistic data, real navigation, and live UI.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Employee Card */}
            <Reveal delay={0}>
              <div className="bg-[#F4F6F9] rounded-2xl p-8 border-2 border-transparent hover:border-[#0047AB] transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-[#0047AB] flex items-center justify-center mb-5 shadow-lg shadow-[#0047AB]/20">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-2">Field Worker View</div>
                <h3 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase mb-3">Employee Demo</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  See what a field worker experiences: assigned courses, progress tracking, quiz completion, and downloadable PDF certificates. This is what your crew will use every day.
                </p>
                <div className="space-y-2 mb-6">
                  {[
                    "My Training dashboard with assigned courses",
                    "Course library with progress indicators",
                    "Certificate wallet with PDF download",
                    "Mobile-friendly interface",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0047AB] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/lms/demo/employee">
                  <button className="w-full inline-flex items-center justify-center gap-2 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl transition-colors group-hover:shadow-lg group-hover:shadow-[#0047AB]/20">
                    Launch Employee Demo <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </Reveal>

            {/* Admin Card */}
            <Reveal delay={100}>
              <div className="bg-[#0F1C2E] rounded-2xl p-8 border-2 border-transparent hover:border-[#1E90FF] transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-[#1E90FF] flex items-center justify-center mb-5 shadow-lg shadow-[#1E90FF]/20">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-[#7DD3FC] text-xs font-bold uppercase tracking-widest mb-2">Safety Manager View</div>
                <h3 className="font-display font-extrabold text-white text-2xl uppercase mb-3">Administrator Demo</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  See what an EHS Manager or Safety Coordinator sees: workforce compliance dashboards, employee management, training assignments, analytics, and reporting.
                </p>
                <div className="space-y-2 mb-6">
                  {[
                    "Compliance dashboard with live KPIs",
                    "Employee roster with bulk CSV import",
                    "Training assignment and due dates",
                    "Analytics charts and CSV export",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle2 className="w-4 h-4 text-[#1E90FF] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/lms/demo/admin">
                  <button className="w-full inline-flex items-center justify-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl transition-colors group-hover:shadow-lg group-hover:shadow-[#1E90FF]/20">
                    Launch Admin Demo <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Demo data is fictional and for illustration only. <Link href="/lms/login"><span className="text-[#1E90FF] font-semibold hover:underline cursor-pointer">Sign in</span></Link> to access the real platform.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-[#0F1C2E] py-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-[#0047AB]/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <Reveal className="text-center">
            <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-widest mb-4">Ready to Get Started?</div>
            <h2 className="font-display font-extrabold text-white text-5xl uppercase leading-none mb-6">
              Train Your Workforce.<br />
              <span className="text-[#1E90FF]">Prove Your Compliance.</span>
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
              Whether you're a contractor with 10 employees or a safety consultant managing 20 client companies — Bastion LMS scales to fit your operation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-bold text-sm uppercase tracking-wider px-10 py-4 rounded-lg transition-colors group">
                  Contact Us Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a1628] py-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-display font-extrabold text-white uppercase tracking-wide">Bastion LMS</div>
                <div className="text-white/30 text-xs">by Bastion Risk & Safety Group, LLC</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-white/40">
              <Link href="/lms"><span className="hover:text-white/70 transition-colors cursor-pointer">Platform Home</span></Link>
              <Link href="/lms/login"><span className="hover:text-white/70 transition-colors cursor-pointer">Sign In</span></Link>
              <Link href="/contact"><span className="hover:text-white/70 transition-colors cursor-pointer">Contact Us</span></Link>
              <Link href="/"><span className="hover:text-white/70 transition-colors cursor-pointer">Bastion RSG</span></Link>
            </div>
            <div className="text-white/30 text-xs">© 2026 Bastion Risk and Safety Group, LLC. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
