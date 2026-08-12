/* ============================================================
   HOME PAGE — "Command & Protect" design
   Training elevated as primary business line alongside consulting
   ============================================================ */
import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Shield, Search, FileSearch, AlertTriangle, ClipboardCheck, BookOpen, ChevronRight, ArrowRight, HardHat, Award, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  {
    icon: <BookOpen size={28} />,
    title: "OSHA Outreach Training",
    desc: "OSHA 10-Hour and 30-Hour courses for Construction, Maritime, and General Industry. Official OSHA course completion cards issued. On-site delivery available for your crew.",
    href: "/training#osha-construction",
    highlight: true,
  },
  {
    icon: <HardHat size={28} />,
    title: "Competent Person Training",
    desc: "Construction-focused training for supervisors and foremen required to serve as OSHA Competent Person for scaffold, fall protection, excavation, confined space, and other high-hazard tasks.",
    href: "/training#competent-person",
    highlight: true,
  },
  {
    icon: <Shield size={28} />,
    title: "Safety Program Development",
    desc: "We design and implement comprehensive, OSHA, Cal/OSHA, EM385, and NAVSEA compliant safety programs tailored to your industry, workforce size, and operational environment.",
    href: "/services",
    highlight: false,
  },
  {
    icon: <Search size={28} />,
    title: "Program Gap Analysis",
    desc: "Our experts evaluate your existing safety systems against regulatory standards and industry best practices, identifying gaps before they become liabilities.",
    href: "/services",
    highlight: false,
  },
  {
    icon: <ClipboardCheck size={28} />,
    title: "Site Safety Audits & Inspections",
    desc: "Comprehensive on-site audits that assess hazards, verify compliance, and deliver actionable findings, keeping your operations safe and inspection-ready.",
    href: "/services",
    highlight: false,
  },
  {
    icon: <AlertTriangle size={28} />,
    title: "Incident Investigation & Root Cause Analysis",
    desc: "When incidents occur, we conduct thorough investigations to identify root causes, prevent recurrence, and protect your organization from future risk.",
    href: "/services",
    highlight: false,
  },
];

const stats = [
  { value: "1,000s", label: "Workers Trained" },
  { value: "OSHA", label: "Authorized Outreach" },
  { value: "DVBE", label: "Certified" },
  { value: "Multi-Industry", label: "Construction · Maritime · GI" },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>Bastion Risk and Safety Group | Safety Consultation and Training Services</title>
        <meta name="description" content="Authorized OSHA 10-Hour and 30-Hour Training for Construction, Maritime, and General Industry in San Diego, Los Angeles, and Southern California. Veteran-owned safety consulting and training firm. Competent Person Training, First Aid/CPR/AED. Call (703) 282-0803." />
        <meta name="keywords" content="OSHA training San Diego, OSHA training Los Angeles, OSHA 10-hour San Diego, OSHA 30-hour San Diego, OSHA 10-hour Los Angeles, OSHA 30-hour Los Angeles, OSHA outreach training Southern California, safety consulting San Diego, safety consulting Los Angeles, OSHA authorized trainer San Diego" />
        <meta property="og:title" content="OSHA Training San Diego & Los Angeles | Bastion Risk & Safety Group" />
        <meta property="og:description" content="Authorized OSHA 10 & 30-Hour Training for Construction, Maritime, and General Industry in Southern California. Safety consulting, Competent Person Training, First Aid/CPR/AED. Veteran-owned." />
        <meta property="og:url" content="https://bastionrsg.com/" />
        <link rel="canonical" href="https://bastionrsg.com/" />
      </Helmet>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F1C2E 0%, #0047AB 60%, #1565C0 100%)",
        }}
      >
        {/* Hero background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/real_hero_sunset-2pBnZx28mTqCHwVda3AV6q.webp')" }}
        />
        <div className="absolute inset-0 bg-[#0a1628] opacity-75" />

        {/* Diagonal bottom cut */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white" style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />

        <div className="container relative z-10 pt-32 pb-40">
          <div className="max-w-3xl">
            <h1 className="font-display text-white font-extrabold leading-none mb-6"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.01em" }}>
              PROTECTING PEOPLE.<br />
              <span className="text-[#1E90FF]">STRENGTHENING OPERATIONS.</span>
            </h1>

            <p className="text-blue-100 font-body text-lg leading-relaxed mb-8 max-w-xl">
              Bastion Risk and Safety Group is a safety consulting and training company serving construction, maritime, utilities, and infrastructure clients nationwide. We deliver OSHA Outreach Training, Competent Person Training, site safety audits, compliance management, and incident investigations. Field-proven solutions that protect your workforce and keep operations compliant.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/training"
                className="inline-flex items-center justify-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 group"
              >
                Schedule Training
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200"
              >
                Request a Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#0047AB] py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-white font-extrabold text-3xl md:text-4xl">{s.value}</div>
                <div className="text-blue-200 font-body text-sm tracking-wide mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRAINING SPOTLIGHT ── */}
      <section className="py-20 bg-[#F4F6F8]">
        <div className="container">
          <RevealSection className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              <div>
                <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Safety Training Programs</span>
                <h2 className="font-display font-extrabold text-[#0F1C2E] mt-2"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  Train Your Workforce.<br />Meet Your Compliance Requirements.
                </h2>
              </div>
              <div>
                <p className="text-gray-500 font-body leading-relaxed">
                  Bastion delivers OSHA authorized training for construction, maritime, and general industry. On-site delivery available at your worksite or facility. Our training programs are practical, field-focused, and designed for employers who need compliant, documented training for their crews.
                </p>
              </div>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              {
                icon: <HardHat size={24} />,
                title: "OSHA 10 & 30-Hour Construction",
                desc: "Official OSHA course completion cards. Covers fall protection, scaffolding, electrical, excavation, and more.",
                href: "/training#osha-construction",
              },
              {
                icon: <Award size={24} />,
                title: "OSHA 10 & 30-Hour Maritime",
                desc: "Shipyard, marine terminal, and longshoring hazards. Covers confined spaces, hot work, and PPE for maritime operations.",
                href: "/training#osha-maritime",
              },
              {
                icon: <Users size={24} />,
                title: "OSHA 10 & 30-Hour General Industry",
                desc: "LOTO, machine guarding, hazard communication, electrical safety, and more for non-construction workplaces.",
                href: "/training#osha-general-industry",
              },
              {
                icon: <BookOpen size={24} />,
                title: "Competent Person & First Aid/CPR",
                desc: "Construction Competent Person training for scaffold, fall protection, and excavation. American Red Cross First Aid/CPR/AED.",
                href: "/training#competent-person",
              },
            ].map((item, i) => (
              <RevealSection key={item.title} delay={i * 80}>
                <Link href={item.href} className="block h-full">
                  <div className="bg-white rounded-lg p-6 h-full border-t-4 border-[#0047AB] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-[#0047AB] mb-3">{item.icon}</div>
                    <h3 className="font-display font-bold text-[#0F1C2E] text-base mb-2">{item.title}</h3>
                    <p className="text-gray-500 font-body text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/training"
              className="inline-flex items-center justify-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
            >
              View All Training Programs
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB] hover:text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200"
            >
              Request a Training Quote
            </Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT INTRO ── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <div className="relative">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/COqJrmvAauljSEST.png"
                  alt="Bastion Risk and Safety Group - safety professional on construction site at sunset"
                  className="rounded-lg shadow-2xl w-full object-cover"
                  style={{ height: 420 }}
                />

              </div>
            </RevealSection>

            <RevealSection delay={150}>
              <div className="accent-bar pl-5">
                <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">About Bastion</span>
              </div>
              <h2 className="font-display font-extrabold text-[#0F1C2E] mt-3 mb-5"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Safety Consulting &amp; Training.<br />Field-Proven Results.
              </h2>
              <p className="text-gray-600 font-body leading-relaxed mb-4">
                Bastion Risk and Safety Group, LLC is a certified Disabled Veteran Business Enterprise (DVBE) and Small Business (Micro) headquartered in San Diego County. We are a safety consulting and training company serving high-risk industries across construction, maritime, utilities, and infrastructure — delivering practical, field-driven solutions that protect workers, reduce organizational risk, and ensure regulatory compliance.
              </p>
              <p className="text-gray-600 font-body leading-relaxed mb-6">
                Our team brings extensive experience supporting organizations of all sizes with safety program development, compliance management, site audits, incident investigations, and workforce training. We have supported the training of thousands of workers across construction, utility, maritime, and infrastructure environments, and we are authorized to deliver OSHA Outreach Training for Construction, Maritime, and General Industry.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[#0047AB] font-display font-bold text-sm tracking-widest uppercase hover:text-[#1E90FF] transition-colors group"
              >
                Learn More About Us
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── SERVICES OVERVIEW ── */}
      <section className="py-20 bg-[#F4F6F8]">
        <div className="container">
          <RevealSection className="text-center mb-14">
            <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">What We Do</span>
            <h2 className="font-display font-extrabold text-[#0F1C2E] mt-2"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Safety Consulting &amp; Training Services
            </h2>
            <p className="text-gray-500 font-body mt-3 max-w-2xl mx-auto">
              From OSHA Outreach Training and Competent Person certification to safety program development and incident investigation. Bastion provides end-to-end safety services tailored to your industry.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, i) => (
              <RevealSection key={svc.title} delay={i * 80}>
                <Link href={svc.href}>
                  <div className={`service-card bg-white rounded-lg p-7 h-full shadow-sm cursor-pointer hover:shadow-md transition-shadow ${svc.highlight ? "border-t-4 border-[#1E90FF]" : "accent-bar"}`}>
                    <div className={`mb-4 ${svc.highlight ? "text-[#1E90FF]" : "text-[#0047AB]"}`}>{svc.icon}</div>
                    {svc.highlight && (
                      <span className="inline-block bg-[#1E90FF]/10 text-[#0047AB] font-display font-bold text-xs tracking-widest uppercase px-2 py-0.5 rounded mb-2">Training</span>
                    )}
                    <h3 className="font-display font-bold text-[#0F1C2E] text-xl mb-3">{svc.title}</h3>
                    <p className="text-gray-500 font-body text-sm leading-relaxed">{svc.desc}</p>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>

          <div className="text-center mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
            >
              View Training Programs
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
            >
              View Consulting Services
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>


      {/* ── CTA BANNER ── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0047AB 0%, #0F1C2E 100%)" }}
      >
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <RevealSection>
              <h2 className="font-display font-extrabold text-white mb-4"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
                Ready to Train Your Workforce or Strengthen Your Safety Program?
              </h2>
              <p className="text-blue-200 font-body leading-relaxed">
                Whether you need OSHA Outreach Training for your crew, a Competent Person course for your supervisors, or a full safety program audit — Bastion is ready to deploy. Our team delivers measurable results, on your schedule, at your site.
              </p>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="flex flex-col gap-4">
                <Link
                  href="/training"
                  className="inline-flex items-center justify-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 hover:shadow-xl group"
                >
                  Schedule Training
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200"
                >
                  Request a Consultation
                </Link>
                <a
                  href="tel:7032820803"
                  className="inline-flex items-center justify-center gap-2 text-blue-300 hover:text-white font-body text-sm transition-colors"
                >
                  Or call us directly: (703) 282-0803
                </a>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
