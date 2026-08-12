/* ============================================================
   ABOUT US PAGE — "Command & Protect" design
   ============================================================ */
import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Shield, Award, Users, Target, CheckCircle, ArrowRight } from "lucide-react";
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
      { threshold: 0.12 }
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

const values = [
  { icon: <Shield size={24} />, title: "Protection First", desc: "Every recommendation we make is driven by one goal: protecting the people who show up to work every day." },
  { icon: <Award size={24} />, title: "Field-Proven Expertise", desc: "Our consultants bring real-world experience from construction sites, utility corridors, and maritime environments." },
  { icon: <Users size={24} />, title: "Seamless Integration", desc: "We work alongside your team — not above it — integrating into your project culture and communication flow." },
  { icon: <Target size={24} />, title: "Measurable Outcomes", desc: "We don't just deliver reports. We deliver results: reduced incidents, improved compliance scores, and safer worksites." },
];

const capabilities = [
  "OSHA 30-Hour Construction & General Industry",
  "Cal/OSHA & Federal OSHA Regulatory Compliance (29 CFR 1926 & 1910)",
  "NAVSEA & EM385 Regulatory Compliance",
  "Site-Specific Job Hazard Analysis (JHA) & Tailboard Templates",
  "Site-Specific Safety Plans (SSSP)",
  "ISN Support",
  "Root Cause Analysis (RCA) Methodologies",
  "Safety Management Systems (SMS)",
  "Incident Investigations",
  "Public Works & Infrastructure Projects",
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>About Bastion Risk & Safety Group | Veteran-Owned Safety Consulting & Training | San Diego & Los Angeles</title>
        <meta name="description" content="Bastion Risk and Safety Group is a veteran-owned, authorized OSHA Outreach Training provider and safety consulting firm headquartered in San Diego, serving Los Angeles and all of Southern California. OSHA 10 & 30-Hour training for Construction, Maritime, and General Industry. DVBE and Small Business certified." />
        <meta name="keywords" content="authorized OSHA trainer San Diego, authorized OSHA trainer Los Angeles, veteran owned safety consulting San Diego, OSHA outreach trainer Southern California, DVBE safety consultant California, safety consulting firm San Diego, safety consulting firm Los Angeles" />
        <meta property="og:title" content="About Bastion Risk & Safety Group | Veteran-Owned Safety Consulting & Training" />
        <meta property="og:description" content="Veteran-owned authorized OSHA Outreach Training provider and safety consulting firm. Serving San Diego, Los Angeles, and Southern California. DVBE certified." />
        <meta property="og:url" content="https://bastionrsg.com/about" />
        <link rel="canonical" href="https://bastionrsg.com/about" />
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
            <span className="text-white">About Us</span>
          </div>
          <h1 className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            About Bastion
          </h1>
          <p className="text-blue-200 font-body text-lg max-w-2xl leading-relaxed">
            Field-proven occupational health and safety consulting for high-risk industries across the nation.
          </p>
        </div>
      </section>

      {/* ── WHO WE ARE ── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <RevealSection>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663579586675/89u5i3YZEzHPKswYhVdzyq/real_lineman_pole-j8H5obAYZTrPC5awXNBdSb.webp"
                alt="Utility lineman climbing a power pole — field safety expertise"
                className="rounded-lg shadow-2xl w-full object-cover"
                style={{ height: 460 }}
              />
            </RevealSection>

            <RevealSection delay={150}>
              <div className="accent-bar pl-5 mb-4">
                <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Who We Are</span>
              </div>
              <h2 className="font-display font-extrabold text-[#0F1C2E] mb-5"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
                Built on Service. Driven by Safety.
              </h2>
              <p className="text-gray-600 font-body leading-relaxed mb-4">
                Bastion Risk and Safety Group, LLC (BRS) was founded on a simple but powerful principle: every worker deserves to go home safely at the end of the day. Headquartered in San Diego County, we bring the discipline, precision, and commitment to mission that define military service, applied to the field of occupational health and safety.
              </p>
              <p className="text-gray-600 font-body leading-relaxed mb-4">
                We specialize in supporting organizations across construction, maritime, utilities, infrastructure, and general industry. Our consultants have supported the training of thousands of workers and have partnered with prime contractors, public agencies, and private sector clients to build safer, more compliant operations.
              </p>
              <p className="text-gray-600 font-body leading-relaxed mb-6">
                What sets BRS apart is our commitment to practical, field-driven solutions. We don't just deliver compliance paperwork, we integrate into your team, understand your operational realities, and deliver safety programs that actually work in the field.
              </p>

            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20 bg-[#F4F6F8]">
        <div className="container">
          <RevealSection className="mb-12">
            <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Our Values</span>
            <h2 className="font-display font-extrabold text-[#0F1C2E] mt-2"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              What Drives Everything We Do
            </h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <RevealSection key={v.title} delay={i * 100}>
                <div className="bg-white rounded-lg p-7 accent-bar shadow-sm h-full">
                  <div className="text-[#0047AB] mb-3">{v.icon}</div>
                  <h3 className="font-display font-bold text-[#0F1C2E] text-xl mb-2">{v.title}</h3>
                  <p className="text-gray-500 font-body text-sm leading-relaxed">{v.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <RevealSection>
              <div className="accent-bar pl-5 mb-4">
                <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Our Capabilities</span>
              </div>
              <h2 className="font-display font-extrabold text-[#0F1C2E] mb-5"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
                Deep Expertise Across Safety Disciplines
              </h2>
              <p className="text-gray-600 font-body leading-relaxed mb-6">
                Our team holds extensive knowledge across federal and state regulatory frameworks, safety management systems, and industry-specific hazard controls. We bring this expertise to every engagement — whether it's a one-day audit or a long-term program partnership.
              </p>
              <ul className="space-y-3">
                {capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[#1E90FF] mt-0.5 shrink-0" />
                    <span className="text-gray-600 font-body text-sm">{cap}</span>
                  </li>
                ))}
              </ul>
            </RevealSection>

            <RevealSection delay={150}>
              <img
                src="/manus-storage/shipyard_containers_0634f83b.jpeg"
                alt="MSC shipping containers stacked at a commercial port terminal"
                className="rounded-lg shadow-2xl w-full object-cover"
                style={{ height: 500 }}
              />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0047AB 0%, #0F1C2E 100%)" }}
      >
        <div className="container relative z-10 text-center">
          <RevealSection>
            <h2 className="font-display font-extrabold text-white mb-4"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Partner With Bastion
            </h2>
            <p className="text-blue-200 font-body mb-8 max-w-xl mx-auto">
              Whether you're a prime contractor, public agency, or private employer, we're ready to support your safety mission.
            </p>
            <Link
              href="/consultation"
              className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
            >
              Request a Consultation
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
