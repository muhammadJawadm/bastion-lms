/* ============================================================
   OSHA TRAINING SAN DIEGO — Google Ads Landing Page
   Design: "Command & Protect" — dark navy, cobalt blue accents,
   bold condensed typography. Conversion-optimized layout.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, Phone, ChevronDown, ChevronUp, Shield, Award, Users, MapPin } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.08 }
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

const courses = [
  {
    title: "OSHA Construction",
    color: "#1E90FF",
    icon: "🏗️",
    courses: ["OSHA 10-Hour Construction", "OSHA 30-Hour Construction"],
    topics: [
      "Fall protection and prevention",
      "Scaffolding safety",
      "Excavation and trenching",
      "Electrical safety",
      "Personal protective equipment",
      "Hazard communication",
      "Struck-by and caught-in hazards",
      "OSHA standards 29 CFR 1926",
    ],
    who: "Entry-level workers, foremen, superintendents, and project managers in construction.",
  },
  {
    title: "OSHA Maritime",
    color: "#0047AB",
    icon: "⚓",
    courses: ["OSHA 10-Hour Maritime", "OSHA 30-Hour Maritime"],
    topics: [
      "Shipyard employment safety",
      "Marine terminal operations",
      "Confined space entry",
      "Hot work and fire prevention",
      "Fall protection on vessels",
      "Hazardous materials handling",
      "Longshoring operations",
      "OSHA standards 29 CFR 1915, 1917, 1918",
    ],
    who: "Shipyard workers, vessel repair technicians, marine terminal employees, and longshore workers in San Diego.",
  },
  {
    title: "OSHA General Industry",
    color: "#1565C0",
    icon: "🏭",
    courses: ["OSHA 10-Hour General Industry", "OSHA 30-Hour General Industry"],
    topics: [
      "Machine guarding",
      "Lockout/tagout (LOTO)",
      "Electrical safety",
      "Hazard communication",
      "Walking and working surfaces",
      "Ergonomics and lifting",
      "Bloodborne pathogens",
      "OSHA standards 29 CFR 1910",
    ],
    who: "Workers and supervisors in manufacturing, warehousing, utilities, and facilities throughout Southern California.",
  },
];

const faqs = [
  {
    q: "What is OSHA 10-Hour and 30-Hour Outreach Training?",
    a: "OSHA 10-Hour and 30-Hour courses are part of the OSHA Outreach Training Program, delivered by OSHA-authorized trainers. The 10-Hour course covers basic hazard recognition for entry-level workers. The 30-Hour course provides in-depth OSHA standards training for supervisors and safety personnel. Both result in an official OSHA course completion card.",
  },
  {
    q: "Is OSHA 10 or 30-Hour training required in California?",
    a: "OSHA 10 and 30-Hour training is required on many California public works projects and is mandated by most general contractors as a condition of site access. Many San Diego and Los Angeles construction firms require OSHA 10 for all workers and OSHA 30 for supervisors.",
  },
  {
    q: "Does Bastion offer on-site training at our job site or facility?",
    a: "Yes. Bastion delivers on-site OSHA Outreach Training at your job site, shipyard, or facility throughout San Diego County, Los Angeles County, and all of Southern California. On-site training is ideal for employers who need to train multiple workers at once.",
  },
  {
    q: "Can Bastion train our entire crew at once?",
    a: "Yes. Bastion specializes in group and crew-based OSHA training. Whether you need to train 5 workers or 50, we can schedule a dedicated on-site session at your location. Contact us for group pricing.",
  },
  {
    q: "Do participants receive an official OSHA card?",
    a: "Yes. Upon successful completion, participants receive an official OSHA course completion card issued through the OSHA Training Institute. This card is recognized nationwide.",
  },
  {
    q: "Is online OSHA training available?",
    a: "Yes. Bastion offers online OSHA 10-Hour and 30-Hour courses for Construction, Maritime, and General Industry for individuals who need flexible scheduling. Contact us for details.",
  },
  {
    q: "Is Bastion an authorized OSHA Outreach Trainer?",
    a: "Yes. Bastion Risk and Safety Group is an authorized OSHA Outreach Trainer for Construction, Maritime, and General Industry. Our trainers are authorized through the OSHA Training Institute Education Centers.",
  },
];

export default function OshaLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#0A0F1E", color: "#F0F4FF" }}>
      <Helmet>
        <title>OSHA Training San Diego & Los Angeles | 10-Hour & 30-Hour Outreach | Bastion Risk & Safety Group</title>
        <meta name="description" content="Authorized OSHA Outreach Training in San Diego and Los Angeles. OSHA 10-Hour and 30-Hour courses for Construction, Maritime, and General Industry. On-site and online. Official OSHA card. Veteran-owned. Call (703) 282-0803." />
        <meta name="keywords" content="OSHA training San Diego, OSHA 10 hour San Diego, OSHA 30 hour San Diego, OSHA outreach training Los Angeles, OSHA construction training San Diego, OSHA maritime training San Diego, OSHA general industry training San Diego, OSHA card San Diego, OSHA authorized trainer California, on-site OSHA training Southern California" />
        <meta property="og:title" content="OSHA Training San Diego & Los Angeles | Bastion Risk & Safety Group" />
        <meta property="og:description" content="Authorized OSHA 10-Hour and 30-Hour Outreach Training for Construction, Maritime, and General Industry in Southern California. On-site and online. Official OSHA card." />
        <meta property="og:url" content="https://bastionrsg.com/osha-training-san-diego" />
        <link rel="canonical" href="https://bastionrsg.com/osha-training-san-diego" />
      </Helmet>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative pt-28 pb-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B3E 60%, #0047AB22 100%)" }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(#1E90FF 1px, transparent 1px), linear-gradient(90deg, #1E90FF 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <RevealSection>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 border border-[#1E90FF]/40 bg-[#1E90FF]/10 rounded px-4 py-2 mb-6">
                <Shield size={14} className="text-[#1E90FF]" />
                <span className="font-display font-bold text-[#1E90FF] text-xs tracking-widest uppercase">OSHA Authorized Outreach Trainer</span>
              </div>

              <h1 className="font-display font-extrabold text-white leading-none mb-6"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)" }}>
                OSHA TRAINING<br />
                <span style={{ color: "#1E90FF" }}>SAN DIEGO</span><br />
                <span className="text-white/80" style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)" }}>& LOS ANGELES</span>
              </h1>

              <p className="font-body text-blue-200 mb-8 leading-relaxed" style={{ fontSize: "1.1rem", maxWidth: 520 }}>
                Bastion Risk and Safety Group is an authorized OSHA Outreach Training provider delivering OSHA 10-Hour and 30-Hour courses for Construction, Maritime, and General Industry throughout Southern California. On-site at your job site or online. Official OSHA cards issued.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
                >
                  Request a Training Quote
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="tel:7032820803"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200"
                >
                  <Phone size={16} />
                  Call (703) 282-0803
                </a>
              </div>
            </RevealSection>

            {/* Course card */}
            <RevealSection delay={150}>
              <div className="rounded-xl border border-[#1E90FF]/30 bg-[#0D1B3E]/80 backdrop-blur p-8 shadow-2xl">
                <p className="font-display font-bold text-[#1E90FF] text-xs tracking-widest uppercase mb-5">Available Courses</p>
                <div className="space-y-3">
                  {[
                    "OSHA 10-Hour Construction",
                    "OSHA 30-Hour Construction",
                    "OSHA 10-Hour Maritime",
                    "OSHA 30-Hour Maritime",
                    "OSHA 10-Hour General Industry",
                    "OSHA 30-Hour General Industry",
                  ].map((course) => (
                    <div key={course} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-[#1E90FF] flex-shrink-0" />
                      <span className="font-body text-blue-100 text-sm">{course}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="font-body text-blue-300 text-xs">Also available: Competent Person Training, First Aid/CPR/AED</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "#0047AB" }} className="py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "OSHA Authorized", label: "Outreach Trainer" },
              { stat: "3 Industries", label: "Construction, Maritime, General Industry" },
              { stat: "DVBE Certified", label: "Veteran-Owned Small Business" },
              { stat: "SD & LA", label: "San Diego + Los Angeles Coverage" },
            ].map((item) => (
              <div key={item.stat}>
                <p className="font-display font-extrabold text-white text-xl mb-1">{item.stat}</p>
                <p className="font-body text-blue-200 text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COURSE CARDS ── */}
      <section className="py-20" style={{ background: "#0A0F1E" }}>
        <div className="container">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block bg-[#1E90FF]/10 text-[#1E90FF] font-display font-bold text-xs tracking-widest uppercase px-4 py-2 rounded mb-4">
                Training Programs
              </span>
              <h2 className="font-display font-extrabold text-white mb-4"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                OSHA Outreach Training Courses
              </h2>
              <p className="text-blue-200 font-body max-w-2xl mx-auto">
                All courses are delivered by authorized OSHA Outreach Trainers and result in an official OSHA course completion card recognized nationwide.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8">
            {courses.map((course, i) => (
              <RevealSection key={course.title} delay={i * 100}>
                <div className="rounded-xl border border-white/10 bg-[#0D1B3E] p-8 h-full flex flex-col hover:border-[#1E90FF]/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20">
                  <div className="text-3xl mb-4">{course.icon}</div>
                  <h3 className="font-display font-extrabold text-white text-xl mb-2">{course.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {course.courses.map((c) => (
                      <span key={c} className="text-xs font-display font-bold tracking-wider uppercase px-3 py-1 rounded-full border"
                        style={{ borderColor: course.color + "60", color: course.color, background: course.color + "15" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="font-body text-blue-300 text-xs mb-4 font-semibold uppercase tracking-wider">Topics Covered</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {course.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2">
                        <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: course.color }} />
                        <span className="font-body text-blue-200 text-sm">{topic}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg p-4 mb-6" style={{ background: course.color + "15", borderLeft: `3px solid ${course.color}` }}>
                    <p className="font-body text-blue-200 text-xs"><span className="font-bold text-white">Who This Is For:</span> {course.who}</p>
                  </div>
                  <Link
                    href="/consultation"
                    className="inline-flex items-center justify-center gap-2 text-white font-display font-bold text-xs tracking-widest uppercase px-6 py-3 rounded transition-all duration-200 group"
                    style={{ background: course.color }}
                  >
                    Book {course.title}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BASTION ── */}
      <section className="py-20" style={{ background: "#0D1B3E" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <span className="inline-block bg-[#1E90FF]/10 text-[#1E90FF] font-display font-bold text-xs tracking-widest uppercase px-4 py-2 rounded mb-6">
                Why Bastion
              </span>
              <h2 className="font-display font-extrabold text-white mb-8"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                The Right Training Partner for Southern California
              </h2>
              <div className="space-y-6">
                {[
                  { icon: <Award size={20} className="text-[#1E90FF]" />, title: "OSHA Authorized Outreach Trainer", desc: "Bastion is authorized through the OSHA Training Institute Education Centers for Construction, Maritime, and General Industry. Every course we deliver meets OSHA standards and results in an official OSHA card." },
                  { icon: <Shield size={20} className="text-[#1E90FF]" />, title: "Veteran-Owned and DVBE Certified", desc: "Bastion is a veteran-owned, DVBE-certified, and Small Business (Micro) certified firm. We bring military-grade discipline and operational precision to every training engagement." },
                  { icon: <Users size={20} className="text-[#1E90FF]" />, title: "Field-Focused, Practical Training", desc: "Our training is built for real-world job sites, not classrooms. We deliver practical, field-focused instruction that workers can apply immediately on the job." },
                  { icon: <MapPin size={20} className="text-[#1E90FF]" />, title: "On-Site Delivery Throughout Southern California", desc: "We come to your job site, shipyard, or facility anywhere in San Diego County, Los Angeles County, or Southern California. Group rates available for crews of any size." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1E90FF]/10 flex items-center justify-center mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-display font-bold text-white text-base mb-1">{item.title}</p>
                      <p className="font-body text-blue-300 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection delay={150}>
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80"
                alt="Safety training on an active construction site in Southern California"
                className="rounded-xl shadow-2xl w-full object-cover"
                style={{ maxHeight: 520 }}
              />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── DELIVERY OPTIONS ── */}
      <section className="py-20" style={{ background: "#0A0F1E" }}>
        <div className="container">
          <RevealSection>
            <div className="text-center mb-14">
              <h2 className="font-display font-extrabold text-white mb-4"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                Flexible Training Delivery
              </h2>
              <p className="text-blue-200 font-body max-w-xl mx-auto">
                Bastion offers multiple delivery formats to fit your schedule and crew size.
              </p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "On-Site Training",
                desc: "We come to your job site, shipyard, or facility anywhere in San Diego County, Los Angeles County, or Southern California. Ideal for training multiple workers at once.",
                detail: "Best for: Contractors, shipyards, employers with crews of 5 or more",
              },
              {
                title: "Online Courses",
                desc: "Self-paced OSHA 10-Hour and 30-Hour online courses available for Construction, Maritime, and General Industry. Complete at your own pace. Official OSHA card upon completion.",
                detail: "Best for: Individuals, remote workers, flexible scheduling",
              },
              {
                title: "Group Rates",
                desc: "Training multiple employees? Bastion offers competitive group pricing for crews of any size. Contact us for a custom quote based on your headcount and training needs.",
                detail: "Best for: Companies training 5+ workers at once",
              },
            ].map((item, i) => (
              <RevealSection key={item.title} delay={i * 80}>
                <div className="rounded-xl border border-white/10 bg-[#0D1B3E] p-8 h-full">
                  <div className="w-10 h-10 rounded-lg bg-[#1E90FF]/10 flex items-center justify-center mb-5">
                    <CheckCircle size={20} className="text-[#1E90FF]" />
                  </div>
                  <h3 className="font-display font-bold text-white text-lg mb-3">{item.title}</h3>
                  <p className="font-body text-blue-300 text-sm leading-relaxed mb-4">{item.desc}</p>
                  <p className="font-body text-blue-400 text-xs italic">{item.detail}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20" style={{ background: "#0D1B3E" }}>
        <div className="container">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block bg-[#1E90FF]/10 text-[#1E90FF] font-display font-bold text-xs tracking-widest uppercase px-4 py-2 rounded mb-4">
                FAQ
              </span>
              <h2 className="font-display font-extrabold text-white mb-4"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                Common Questions About OSHA Training
              </h2>
            </div>
          </RevealSection>
          <div className="max-w-3xl mx-auto divide-y divide-white/10">
            {faqs.map((item, i) => (
              <RevealSection key={i} delay={i * 40}>
                <div className="py-5">
                  <button
                    className="flex items-start justify-between gap-4 w-full text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-display font-bold text-white text-base leading-snug pr-4">{item.q}</span>
                    <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center transition-transform duration-200"
                      style={{ transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}>
                      {openFaq === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {openFaq === i && (
                    <p className="mt-4 text-blue-300 font-body leading-relaxed text-sm">{item.a}</p>
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0047AB 0%, #1565C0 100%)" }}
      >
        <div className="container relative z-10 text-center">
          <RevealSection>
            <h2 className="font-display font-extrabold text-white mb-4"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Ready to Schedule OSHA Training?
            </h2>
            <p className="text-blue-200 font-body mb-3 max-w-xl mx-auto">
              Contact Bastion to book OSHA Outreach Training for your crew in San Diego, Los Angeles, or anywhere in Southern California. We will build a training plan that fits your schedule and compliance requirements.
            </p>
            <p className="text-blue-300 font-body text-sm mb-10 max-w-xl mx-auto">
              Also offering safety consulting, site audits, and OSHA compliance support for ongoing client needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0047AB] hover:bg-blue-50 font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
              >
                Request a Training Quote
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:7032820803"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-sm tracking-widest uppercase px-8 py-4 rounded transition-all duration-200"
              >
                <Phone size={16} />
                Call (703) 282-0803
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
