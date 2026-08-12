/* ============================================================
   SERVICES PAGE — "Command & Protect" design
   Training featured prominently as a primary service line
   ============================================================ */
import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
      },
      { threshold: 0.10 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`scroll-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const consultingServices = [
  {
    title: "Safety Program Development & Implementation",
    summary: "End-to-end development of OSHA and Cal/OSHA compliant safety programs tailored to your workforce and operational environment.",
    details: [
      "Injury and Illness Prevention Programs (IIPP)",
      "Site-Specific Safety Plans (SSSP)",
      "Emergency Action Plans (EAP)",
      "Confined Space Entry Programs",
      "Lockout/Tagout (LOTO) Programs",
      "Fall Protection Plans",
      "Heat Illness Prevention Programs",
    ],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/diverse_safety_briefing-9YLxGCWJzErkWAN7tZWfu8.webp",
    cta: "Inquire About This Service",
    ctaHref: "/consultation",
  },
  {
    title: "Program Gap Analysis",
    summary: "A thorough evaluation of your existing safety systems measured against current regulatory requirements and industry best practices.",
    details: [
      "Federal OSHA 29 CFR 1926 & 1910 compliance review",
      "Cal/OSHA Title 8 compliance assessment",
      "Safety management system benchmarking",
      "Written program completeness review",
      "Hazard identification and control assessment",
      "Prioritized corrective action roadmap",
      "Executive summary with risk ratings",
    ],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/electrical_tower_inspect-FA4anRGPcyAbSBRCekT5e4.webp",
    cta: "Inquire About This Service",
    ctaHref: "/consultation",
  },
  {
    title: "Site Safety Audits & Inspections",
    summary: "Comprehensive on-site safety audits that identify hazards, verify regulatory compliance, and deliver actionable findings.",
    details: [
      "Ongoing site audits",
      "Hazard identification and risk assessment",
      "PPE compliance verification",
      "Equipment and machinery safety checks",
      "Housekeeping and access/egress review",
      "Detailed written inspection reports",
      "Follow-up verification of corrective actions",
    ],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/real_site_inspection-LHxJtZsd4Bw6eib9WUQfsN.webp",
    cta: "Inquire About This Service",
    ctaHref: "/consultation",
  },
  {
    title: "Incident Investigation & Root Cause Analysis",
    summary: "Structured, thorough investigations that identify root causes, establish corrective actions, and protect your organization from future incidents.",
    details: [
      "Near-miss, first-aid, and recordable incident investigations",
      "Root Cause Analysis (RCA) using proven methodologies",
      "5-Why and Fishbone (Ishikawa) analysis",
      "OSHA recordkeeping compliance (300, 300A, 301 logs)",
      "Corrective and preventive action (CAPA) development",
      "Management briefings and regulatory reporting support",
      "Lessons-learned documentation and training integration",
    ],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/real_trench_work-M6UJWMG2LeXoQnzYoiiLGM.webp",
    cta: "Inquire About This Service",
    ctaHref: "/consultation",
  },
  {
    title: "Compliance Management",
    summary: "Ongoing regulatory compliance support that keeps your organization ahead of requirements across federal and state safety standards.",
    details: [
      "Regulatory change monitoring and updates",
      "OSHA citation response and abatement support",
      "Compliance calendar and deadline management",
      "Safety record management and documentation",
      "Contractor pre-qualification safety review",
      "Agency inspection preparation and support",
      "Permit-required confined space compliance",
      "ISN Support",
      "NAVSEA & EM385 Regulatory Compliance",
    ],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/real_confined_space-YsoPRZJ2Zm4o2ZG5L5AuVr.webp",
    cta: "Inquire About This Service",
    ctaHref: "/consultation",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>Safety Consulting & Training Services San Diego & Los Angeles | Audits, Compliance, Incident Investigation | Bastion Risk & Safety Group</title>
        <meta name="description" content="OSHA 10-Hour and 30-Hour Outreach Training for Construction, Maritime, and General Industry in San Diego, Los Angeles, and Southern California. Plus Competent Person Training, First Aid/CPR/AED, site safety audits, incident investigation, and compliance management. Veteran-owned." />
        <meta name="keywords" content="OSHA training services San Diego, OSHA training services Los Angeles, OSHA 10-hour construction San Diego, OSHA 30-hour construction San Diego, OSHA 10-hour maritime San Diego, OSHA 30-hour maritime San Diego, OSHA 10-hour general industry Los Angeles, OSHA 30-hour general industry Los Angeles, safety consulting services Southern California, competent person training Southern California" />
        <meta property="og:title" content="Safety Consulting & Training Services San Diego & Los Angeles | Bastion Risk & Safety Group" />
        <meta property="og:description" content="OSHA 10 & 30-Hour Training for Construction, Maritime, and General Industry in Southern California. Safety consulting, site audits, incident investigation, and compliance management. Veteran-owned." />
        <meta property="og:url" content="https://bastionrsg.com/services" />
        <link rel="canonical" href="https://bastionrsg.com/services" />
      </Helmet>
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F1C2E 0%, #0047AB 100%)" }}
      >
        <div className="container relative z-10">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-body mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Services</span>
          </div>
          <h1 className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            Our Services
          </h1>
          <p className="text-blue-200 font-body text-lg max-w-2xl leading-relaxed mb-8">
            Bastion provides both professional safety training and comprehensive safety consulting services, customized to your industry, your workforce, and your operational requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-200 group"
            >
              View Training Programs
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-200"
            >
              Request a Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRAINING FEATURE BLOCK ── */}
      <section className="py-16 bg-[#0047AB]">
        <div className="container">
          <RevealSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                  <span className="text-blue-100 text-xs font-body tracking-widest uppercase font-semibold">
                    Primary Service Line
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-white mb-4"
                  style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
                  Safety Training Programs
                </h2>
                <p className="text-blue-200 font-body leading-relaxed mb-6">
                  Safety training is a core part of what Bastion does. We are authorized to deliver OSHA Outreach Training for Construction, Maritime, and General Industry. We also provide Competent Person Training and American Red Cross First Aid/CPR/AED for employers across high-risk industries.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {[
                    "OSHA Construction\n10 & 30-Hour",
                    "OSHA Maritime\n10 & 30-Hour",
                    "OSHA General Industry\n10 & 30-Hour",
                    "First Aid / CPR / AED\nRed Cross Affiliated",
                  ].map((label) => (
                    <div key={label} className="bg-white/10 border border-white/20 rounded-lg p-4 text-center">
                      <div className="text-white font-body text-xs leading-snug whitespace-pre-line">{label}</div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/training"
                  className="inline-flex items-center gap-2 bg-white text-[#0047AB] hover:bg-blue-50 font-display font-bold text-sm tracking-widest uppercase px-7 py-3.5 rounded transition-all duration-200 group"
                >
                  View All Training Programs
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div>
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/hpCGByYgAQxLLHpn.jpg"
                  alt="Indoor OSHA safety training classroom with instructor and workers"
                  className="rounded-lg shadow-2xl w-full object-cover"
                  style={{ maxHeight: 380 }}
                />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CONSULTING SERVICES HEADER ── */}
      <section className="pt-16 pb-4 bg-white">
        <div className="container">
          <RevealSection>
            <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Safety Consulting</span>
            <h2 className="font-display font-extrabold text-[#0F1C2E] mt-2 mb-3"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Consulting Services
            </h2>
            <p className="text-gray-500 font-body max-w-2xl leading-relaxed">
              Beyond training, Bastion provides comprehensive safety consulting services, from program development and compliance management to site audits and incident investigations.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ── CONSULTING SERVICES DETAIL ── */}
      {consultingServices.map((svc, i) => (
        <section
          key={svc.title}
          className={`py-20 ${i % 2 === 0 ? "bg-white" : "bg-[#F4F6F8]"}`}
        >
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              {/* Content */}
              <RevealSection className={i % 2 !== 0 ? "lg:order-2" : ""}>
                <div className="accent-bar pl-5 mb-3">
                  <span className="text-[#1E90FF] font-display font-bold text-xs tracking-widest uppercase">Consulting Service {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="font-display font-extrabold text-[#0F1C2E] mb-4"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                  {svc.title}
                </h2>
                <p className="text-gray-600 font-body leading-relaxed mb-6">{svc.summary}</p>
                <ul className="space-y-2.5 mb-8">
                  {svc.details.map((d) => (
                    <li key={d} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-[#1E90FF] mt-0.5 shrink-0" />
                      <span className="text-gray-600 font-body text-sm">{d}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={svc.ctaHref}
                  className="inline-flex items-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-200 group"
                >
                  {svc.cta}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </RevealSection>

              {/* Image */}
              <RevealSection delay={150} className={i % 2 !== 0 ? "lg:order-1" : ""}>
                <img
                  src={svc.image}
                  alt={svc.title}
                  className="rounded-lg shadow-2xl w-full object-cover"
                  style={{ maxHeight: 420 }}
                />
              </RevealSection>
            </div>
          </div>
        </section>
      ))}

      {/* ── CTA ── */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0047AB 0%, #0F1C2E 100%)" }}
      >
        <div className="container relative z-10 text-center">
          <RevealSection>
            <h2 className="font-display font-extrabold text-white mb-4"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Not Sure Which Service You Need?
            </h2>
            <p className="text-blue-200 font-body mb-8 max-w-xl mx-auto">
              Contact us for a no-obligation consultation. We will assess your needs and recommend the right combination of training and consulting services for your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/training"
                className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
              >
                View Training Programs
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/consultation"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
              >
                Request a Free Consultation
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
