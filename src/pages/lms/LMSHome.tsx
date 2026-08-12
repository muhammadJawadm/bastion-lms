/**
 * LMS Marketing Home — Bastion LMS
 * Design: Dark hero with navy/blue brand, feature grid, pricing section
 * Color scheme: matches bastionrsg.com — cobalt #0047AB, bright blue #1E90FF, dark navy #0F1C2E
 */

import { Link } from "wouter";
import { Shield, CheckCircle, ArrowRight, Play } from "lucide-react";

const FEATURES = [
  { title: "Course Builder", desc: "Create safety training with videos, PDFs, and quizzes in minutes. No technical skills required." },
  { title: "Team Management", desc: "Bulk-upload employees via CSV. Assign training by job title, crew, or department." },
  { title: "Compliance Tracking", desc: "Real-time dashboards showing completion rates, overdue training, and expiring certifications." },
  { title: "Auto Certificates", desc: "PDF certificates generated instantly on course completion. QR-code verifiable." },
  { title: "Safety-Focused", desc: "Built by a safety professional. Uses industry language: Toolbox Talks, Competent Person, Hazard Communication." },
  { title: "Multi-Client Portal", desc: "Manage all your client companies from one pane of glass. Perfect for safety consultants." },
];

const PRICING = [
  {
    name: "Starter",
    price: "$8",
    period: "/user/mo",
    desc: "Small crews up to 25 users",
    features: ["Up to 25 users", "Unlimited courses", "Basic reporting", "PDF certificates", "Email support"],
    cta: "Request Access",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$6",
    period: "/user/mo",
    desc: "Growing contractors 26–100 users",
    features: ["26–100 users", "Everything in Starter", "Advanced analytics", "Custom branding", "Priority support", "CSV/PDF exports"],
    cta: "Request Access",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "100+ users or multi-site",
    features: ["Unlimited users", "Everything in Pro", "White-label portal", "Procore integration", "Dedicated CSM", "SLA guarantee"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function LMSHome() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F1C2E]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/bastion_logo.png"
              alt="Bastion Risk and Safety Group"
              className="h-10 w-auto object-contain"
            />
            <div>
              <span className="font-display font-extrabold text-white text-lg uppercase tracking-wide leading-none">Bastion</span>
              <span className="text-[#1E90FF] font-bold text-xs uppercase tracking-[2px] ml-1.5">LMS</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/lms/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="text-white/50 hover:text-white/90 text-xs font-semibold border border-white/15 hover:border-white/30 px-3 py-1.5 rounded transition-colors">← Bastion RSG</button>
            </Link>
            <Link href="/lms/login">
              <button className="text-white/80 hover:text-white text-sm font-medium transition-colors">Sign In</button>
            </Link>
            <a href="https://bastionrsg.com/contact" target="_blank" rel="noopener noreferrer">
              <button className="bg-[#1E90FF] hover:bg-blue-400 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                Contact Us
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={{
          background: `linear-gradient(135deg, #0F1C2E 0%, #1a2d4a 50%, #0F1C2E 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/bastion-lms-hero-9tGHwsXw9JjXuJmV7TP3oa.webp")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="font-display font-extrabold text-white text-6xl md:text-7xl uppercase leading-none mb-6">
              Safety Training<br />
              <span className="text-[#1E90FF]">Built for</span><br />
              the Field.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              The only LMS designed specifically for construction, maritime, utility, and industrial workers. Mobile-first, safety-focused, and built by a certified safety professional.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:info@bastionrsg.com?subject=Bastion LMS — Request Access">
                <button className="bg-[#1E90FF] hover:bg-blue-400 text-white font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-lg transition-colors flex items-center gap-2">
                  Request Access <ArrowRight className="w-4 h-4" />
                </button>
              </a>
              <Link href="/lms/dashboard">
                <button className="border border-white/30 hover:border-white/60 text-white font-bold text-sm uppercase tracking-wider px-8 py-4 rounded-lg transition-colors flex items-center gap-2">
                  <Play className="w-4 h-4" /> View Demo
                </button>
              </Link>
            </div>
          </div>

          {/* Hero mockup */}
          <div className="relative hidden lg:block">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="bg-[#0F1C2E] rounded-xl overflow-hidden">
                {/* Mini dashboard mockup */}
                <div className="flex">
                  <div className="w-40 bg-[#0a1628] p-3 space-y-1">
                    {["Dashboard", "Courses", "Employees", "Reports"].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${i === 0 ? "bg-[#0047AB] text-white" : "text-white/40"}`}>
                        <div className="w-3 h-3 bg-current rounded-sm opacity-60" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    <div className="text-white/80 text-xs font-bold uppercase tracking-wide">Compliance Overview</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Completion", value: "87%", color: "text-green-400" },
                        { label: "Overdue", value: "12", color: "text-red-400" },
                        { label: "Employees", value: "148", color: "text-[#1E90FF]" },
                        { label: "Courses", value: "24", color: "text-white" },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white/5 rounded-lg p-2">
                          <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-white/40 text-[10px]">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {["Fall Protection — 94%", "Hazard Comm — 78%", "PPE Training — 100%"].map((course) => {
                        const pct = parseInt(course.split("—")[1]);
                        return (
                          <div key={course} className="space-y-0.5">
                            <div className="text-white/50 text-[10px]">{course.split("—")[0].trim()}</div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1E90FF] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#F4F6F9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-[#0F1C2E] text-5xl uppercase mb-4">Everything You Need<br />to <span className="text-[#1E90FF]">Prove Compliance</span></h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">From course creation to certificate generation, Bastion LMS handles the entire safety training lifecycle.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-[#0F1C2E] text-5xl uppercase mb-4">Simple, <span className="text-[#1E90FF]">Transparent</span> Pricing</h2>
            <p className="text-gray-500 text-lg">No hidden fees. Cancel anytime. Save 20% with annual billing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border-2 relative ${
                  plan.highlight
                    ? "border-[#0047AB] bg-[#0F1C2E] text-white"
                    : "border-gray-200 bg-white text-[#0F1C2E]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0047AB] text-white text-[10px] font-bold uppercase tracking-[1.5px] px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className={`text-xs font-bold uppercase tracking-[2px] mb-1 ${plan.highlight ? "text-[#1E90FF]" : "text-gray-500"}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-extrabold text-4xl uppercase">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>{plan.period}</span>
                  </div>
                  <div className={`text-sm mt-1 ${plan.highlight ? "text-white/60" : "text-gray-500"}`}>{plan.desc}</div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-[#1E90FF]" : "text-green-500"}`} />
                      <span className={plan.highlight ? "text-white/80" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="mailto:info@bastionrsg.com?subject=Bastion LMS — Pricing Inquiry">
                  <button className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors ${
                    plan.highlight
                      ? "bg-[#1E90FF] hover:bg-blue-400 text-white"
                      : "border-2 border-[#0047AB] hover:bg-[#0047AB] hover:text-white text-[#0047AB]"
                  }`}>
                    {plan.cta}
                  </button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0047AB]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Shield className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h2 className="font-display font-extrabold text-white text-5xl uppercase mb-4">
            Ready to Protect Your Workforce?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Contact Bastion Risk and Safety Group to get your team set up on the platform. We'll onboard your company, import your employees, and have you running compliance training within days.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:info@bastionrsg.com?subject=Bastion LMS — Get Started">
              <button className="bg-white hover:bg-blue-50 text-[#0047AB] font-bold text-sm uppercase tracking-wider px-10 py-4 rounded-lg transition-colors inline-flex items-center gap-2">
                Contact Us to Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </a>
            <Link href="/lms/login">
              <button className="border-2 border-white/40 hover:border-white text-white font-bold text-sm uppercase tracking-wider px-10 py-4 rounded-lg transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white uppercase tracking-wide">Bastion LMS</span>
            <span className="text-white/30 text-sm">by Bastion Risk & Safety Group, LLC</span>
          </div>
          <div className="text-white/30 text-sm">© 2026 Bastion Risk and Safety Group, LLC. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
