/* ============================================================
   TRAINING SERVICES PAGE — "Command & Protect" design
   Dedicated page for all Bastion safety training programs
   ============================================================ */
import { useEffect, useRef } from "react";
import { Link } from "wouter";

import { BookOpen, Award, HardHat, CheckCircle, ArrowRight, Users, Calendar, Monitor } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Scroll to anchor after page load (handles links like /training#osha-construction)
function useHashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    // Small delay to allow the page to render before scrolling
    const timer = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);
}

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

const trainingCategories = [
  {
    id: "competent-person",
    badge: "Construction & General Industry",
    title: "Competent Person Training",
    summary: "OSHA requires that certain high-hazard activities be supervised by a designated Competent Person, someone capable of identifying existing and predictable hazards and authorized to take prompt corrective action. Bastion delivers practical, field-focused Competent Person training for both construction and general industry environments, meeting OSHA 29 CFR 1926 and 29 CFR 1910 requirements and preparing your supervisors and foremen to lead safely.",
    topics: [
      "Scaffold Competent Person (29 CFR 1926.451)",
      "Fall Protection Competent Person (29 CFR 1926.502)",
      "Excavation and Trenching Competent Person (29 CFR 1926.651)",
      "Confined Space Entry Supervisor Training (Construction and General Industry)",
      "Lockout/Tagout (LOTO) Authorized and Affected Employee Training",
      "Struck-By and Caught-In/Between Hazard Recognition",
      "Electrical Safety Awareness",
      "Hazard identification and corrective action authority",
      "Additional high-hazard topics available upon request — contact us to discuss your specific needs",
    ],
    who: "Foremen, superintendents, lead workers, and site supervisors in construction, utility, infrastructure, and general industry environments who are required by OSHA to serve as the designated Competent Person for specific high-hazard tasks.",
    cta: "Schedule Competent Person Training",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/xOwxjHZKfWPtUiQa.jpg",
  },
  {
    id: "osha-construction",
    badge: "OSHA Outreach — Construction",
    title: "OSHA Outreach Training: Construction",
    summary: "Bastion is authorized to deliver OSHA Outreach Training for the construction industry under the OSHA Outreach Training Program. Our OSHA 10-Hour and 30-Hour Construction courses provide workers and supervisors with a foundational understanding of OSHA standards, workers' rights, and the most common hazards found on construction sites. Participants receive an official OSHA course completion card upon finishing. Available in-person and online.",
    topics: [
      "OSHA 10-Hour Construction — designed for entry-level workers and new hires",
      "OSHA 30-Hour Construction — designed for supervisors, foremen, and safety personnel",
      "Introduction to OSHA and workers' rights",
      "Fall protection, scaffolding, and ladder safety",
      "Electrical safety and struck-by/caught-in hazards",
      "Personal protective equipment (PPE)",
      "Excavation, trenching, and confined space awareness",
      "Health hazards in construction (silica, lead, asbestos awareness)",
      "Tools, materials handling, and cranes/rigging awareness",
      "Stairways, walking/working surfaces, and housekeeping",
    ],
    who: "Construction workers, contractors, subcontractors, project managers, and supervisors who need OSHA-recognized training documentation. Many public agencies, general contractors, and project owners now require OSHA 10 or 30 cards as a condition of site access.",
    cta: "Book OSHA Construction Training",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/rHfWpAZFdSqxPiUg.jpg",
  },
  {
    id: "osha-maritime",
    badge: "OSHA Outreach — Maritime",
    title: "OSHA Outreach Training: Maritime",
    summary: "The maritime industry operates under distinct OSHA standards that address the unique hazards of shipyard employment, marine terminals, and longshoring operations. Bastion delivers OSHA Outreach Training specifically for maritime workers, covering the regulations and hazards that apply to vessel repair, shipbuilding, and waterfront operations. Participants receive an official OSHA course completion card upon finishing. Available in-person and online.",
    topics: [
      "OSHA 10-Hour Maritime — for maritime workers and entry-level shipyard personnel",
      "OSHA 30-Hour Maritime — for supervisors, safety officers, and maritime managers",
      "Introduction to OSHA maritime standards (29 CFR 1915, 1917, 1918)",
      "Shipyard hazards: confined spaces, hot work, electrical safety",
      "Fall protection and working over water",
      "Hazardous materials and chemical exposure in maritime environments",
      "Personal protective equipment for maritime operations",
      "Emergency response and fire prevention in shipyards",
      "Vessel entry and permit-required confined space procedures",
      "Rigging, lifting, and material handling in marine environments",
    ],
    who: "Shipyard workers, vessel repair technicians, marine terminal employees, longshore workers, and supervisors in maritime and port operations who need OSHA-recognized training documentation.",
    cta: "Book OSHA Maritime Training",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/uHlrbXrisSUWMHFQ.jpg",
  },
  {
    id: "osha-general-industry",
    badge: "OSHA Outreach — General Industry",
    title: "OSHA Outreach Training: General Industry",
    summary: "For employers and workers outside of construction and maritime, Bastion delivers OSHA Outreach Training for General Industry under 29 CFR 1910. Our OSHA 10-Hour and 30-Hour General Industry courses address the hazards and compliance requirements most relevant to manufacturing, warehousing, utilities, facilities maintenance, and other non-construction workplaces. Participants receive an official OSHA course completion card upon finishing. Available in-person and online.",
    topics: [
      "OSHA 10-Hour General Industry — for workers in manufacturing, warehousing, and facilities",
      "OSHA 30-Hour General Industry — for supervisors, safety coordinators, and EHS personnel",
      "Introduction to OSHA standards and the General Duty Clause",
      "Hazard communication and GHS/SDS requirements",
      "Lockout/Tagout (LOTO) and machine guarding",
      "Electrical safety and arc flash awareness",
      "Walking/working surfaces, ladders, and fall protection",
      "Personal protective equipment (PPE) selection and use",
      "Emergency action plans and fire prevention",
      "Ergonomics, materials handling, and forklift/powered industrial truck awareness",
      "Bloodborne pathogens and first aid requirements",
    ],
    who: "Workers and supervisors in manufacturing, warehousing, utilities, facilities management, healthcare support, and any non-construction workplace where OSHA 29 CFR 1910 standards apply.",
    cta: "Book OSHA General Industry Training",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/nurVQXfpGqHdhAlf.jpg",
  },
  {
    id: "first-aid-cpr",
    badge: "Emergency Response",
    title: "First Aid / CPR / AED Training",
    summary: "Workplace emergencies can happen anywhere, at any time. Bastion delivers American Red Cross affiliated First Aid, CPR, and AED training to equip your workforce with the life-saving skills to respond effectively before emergency services arrive. Training is available for individuals, small groups, and large workforces, with on-site delivery options for your facility or job site.",
    topics: [
      "First Aid training — American Red Cross affiliated",
      "CPR (Cardiopulmonary Resuscitation) for adult, child, and infant",
      "AED (Automated External Defibrillator) operation and use",
      "Recognition of cardiac arrest, stroke, and choking emergencies",
      "Bleeding control, wound care, and shock management",
      "Musculoskeletal injury response (fractures, sprains)",
      "Heat illness and cold stress emergency response",
      "Scene safety and calling for emergency services",
      "Certification cards issued upon successful completion",
    ],
    who: "All employers benefit from having trained First Aid/CPR/AED responders on site. OSHA requires that a person trained in first aid be available when a medical facility is not in near proximity to the worksite. Ideal for construction crews, maritime personnel, facilities staff, and any workplace with elevated injury risk.",
    cta: "Schedule First Aid / CPR Training",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/heNtjpaluopnCGlo.jpg",
  },
];

export default function Training() {
  useHashScroll();
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>Safety Training Programs San Diego & Los Angeles | OSHA, Competent Person, First Aid/CPR | Bastion Risk & Safety Group</title>
        <meta name="description" content="Authorized OSHA 10-Hour and 30-Hour Outreach Training for Construction, Maritime, and General Industry in San Diego, Los Angeles, and Southern California. Official OSHA completion card issued. Also offering Competent Person Training and First Aid/CPR/AED. In-person and online. Call (703) 282-0803." />
        <meta name="keywords" content="OSHA 10-hour training San Diego, OSHA 30-hour training San Diego, OSHA 10-hour training Los Angeles, OSHA 30-hour training Los Angeles, OSHA outreach training Southern California, OSHA construction training San Diego, OSHA maritime training San Diego, OSHA general industry training San Diego, OSHA 10-hour construction Los Angeles, OSHA 30-hour construction Los Angeles, OSHA card San Diego, OSHA card Los Angeles, competent person training San Diego, first aid CPR training San Diego, OSHA authorized trainer California" />
        <meta property="og:title" content="Safety Training Programs San Diego & Los Angeles | Bastion Risk & Safety Group" />
        <meta property="og:description" content="Authorized OSHA Outreach Training for Construction, Maritime, and General Industry in Southern California. OSHA 10-Hour and 30-Hour courses. Official OSHA card. In-person and online. Veteran-owned." />
        <meta property="og:url" content="https://bastionrsg.com/training" />
        <link rel="canonical" href="https://bastionrsg.com/training" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "What is OSHA 10-Hour and 30-Hour training?", "acceptedAnswer": { "@type": "Answer", "text": "OSHA 10-Hour and 30-Hour courses are part of the OSHA Outreach Training Program, delivered by OSHA-authorized trainers. The 10-Hour course is designed for entry-level workers and covers basic hazard recognition and workers' rights. The 30-Hour course is designed for supervisors, foremen, and safety personnel and provides a more in-depth review of OSHA standards and compliance requirements. Both courses result in an official OSHA course completion card." } },
            { "@type": "Question", "name": "Is OSHA 10 or 30-Hour training required by law?", "acceptedAnswer": { "@type": "Answer", "text": "OSHA 10 and 30-Hour training is not federally mandated for all industries, but many states, project owners, and general contractors require it as a condition of site access or employment. In California, certain public works projects and government contracts require OSHA cards. Many construction firms in San Diego and Los Angeles require OSHA 10 as a minimum for all workers and OSHA 30 for supervisors." } },
            { "@type": "Question", "name": "How long does OSHA 10-Hour and 30-Hour training take?", "acceptedAnswer": { "@type": "Answer", "text": "The OSHA 10-Hour course requires a minimum of 10 contact hours and is typically completed over one to two days. The OSHA 30-Hour course requires a minimum of 30 contact hours and is typically completed over three to four days. Online versions allow participants to complete the training at their own pace, though the minimum hour requirements still apply." } },
            { "@type": "Question", "name": "Do I receive an OSHA card after completing the training?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Upon successful completion of an OSHA 10-Hour or 30-Hour Outreach Training course delivered by an authorized trainer, participants receive an official OSHA course completion card issued through the OSHA Training Institute. This card is recognized nationwide and does not expire, though some employers and project owners require periodic refresher training." } },
            { "@type": "Question", "name": "What is the difference between OSHA Construction, Maritime, and General Industry training?", "acceptedAnswer": { "@type": "Answer", "text": "Each version of the OSHA Outreach Training Program covers the specific OSHA standards that apply to that industry. Construction training (29 CFR 1926) covers fall protection, scaffolding, excavation, electrical safety, and other construction-specific hazards. Maritime training (29 CFR 1915, 1917, 1918) covers shipyard employment, marine terminals, and longshoring operations. General Industry training (29 CFR 1910) covers manufacturing, warehousing, utilities, and facilities. Workers should take the version that matches their workplace." } },
            { "@type": "Question", "name": "Does Bastion offer on-site OSHA training in San Diego and Los Angeles?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Bastion Risk and Safety Group delivers on-site OSHA Outreach Training at your facility or job site throughout San Diego County, Los Angeles County, and all of Southern California. On-site training is ideal for employers who need to train multiple workers at once and prefer a field-focused, practical approach. We also offer online OSHA 10 and 30-Hour courses for individuals who need flexible scheduling." } },
            { "@type": "Question", "name": "Can Bastion train my entire crew at once?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Bastion specializes in group and crew-based OSHA training for contractors, subcontractors, and employers. Whether you need to train five workers or fifty, we can schedule a dedicated on-site session at your location in San Diego, Los Angeles, or anywhere in Southern California. Contact us for group pricing and scheduling." } },
            { "@type": "Question", "name": "Does Bastion offer OSHA training for maritime and shipyard workers in San Diego?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. San Diego is home to one of the largest naval and commercial shipyard communities in the country. Bastion delivers OSHA Maritime Outreach Training (10-Hour and 30-Hour) specifically for shipyard workers, vessel repair technicians, marine terminal employees, and longshore workers. Our maritime training covers OSHA 29 CFR 1915, 1917, and 1918 standards, including confined space entry, hot work, fall protection, and hazardous materials." } },
            { "@type": "Question", "name": "What is Competent Person Training and who needs it?", "acceptedAnswer": { "@type": "Answer", "text": "OSHA requires that certain high-hazard activities be supervised by a designated Competent Person. A Competent Person is defined as someone capable of identifying existing and predictable hazards and authorized to take prompt corrective action. Bastion's Competent Person Training prepares foremen, superintendents, and lead workers in construction and general industry to fulfill this role in compliance with OSHA 29 CFR 1926 and 29 CFR 1910." } },
            { "@type": "Question", "name": "Is Bastion an authorized OSHA Outreach Trainer?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Bastion Risk and Safety Group is an authorized OSHA Outreach Trainer for Construction, Maritime, and General Industry under the OSHA Outreach Training Program. Our trainers are authorized through the OSHA Training Institute Education Centers, which means all courses we deliver meet OSHA's standards and result in official OSHA course completion cards." } }
          ]
        })}</script>
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
            <span className="text-white">Training Services</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
                <BookOpen size={14} className="text-[#1E90FF]" />
                <span className="text-blue-100 text-xs font-body tracking-widest uppercase font-semibold">
                  OSHA Authorized Outreach Training
                </span>
              </div>
              <h1 className="font-display font-extrabold text-white mb-5"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.05 }}>
                TRAIN YOUR<br />
                <span className="text-[#1E90FF]">WORKFORCE.</span>
              </h1>
              <p className="text-blue-200 font-body text-lg max-w-xl leading-relaxed mb-8">
                Bastion delivers field-focused safety training for construction, maritime, and general industry. We offer OSHA Outreach courses, Competent Person training, and American Red Cross First Aid/CPR/AED. In-person on-site delivery and online classes are both available for your crew.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 group"
                >
                  Request a Training Quote
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="tel:7032820803"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200"
                >
                  Call (703) 282-0803
                </a>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Users size={24} />, value: "1,000s", label: "Workers Trained" },
                { icon: <Award size={24} />, value: "OSHA", label: "Authorized Outreach" },
                { icon: <HardHat size={24} />, value: "On-Site", label: "In-Person Delivery" },
                { icon: <Monitor size={24} />, value: "Online", label: "Classes Available" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 border border-white/20 rounded-lg p-5 text-center">
                  <div className="text-[#1E90FF] flex justify-center mb-2">{stat.icon}</div>
                  <div className="font-display font-extrabold text-white text-2xl">{stat.value}</div>
                  <div className="text-blue-300 font-body text-xs tracking-wide mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO BAND ── */}
      <section className="bg-[#0047AB] py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-blue-100 font-body text-sm text-center md:text-left">
              <strong className="text-white">On-site and online training available</strong> — we come to your worksite, or your team can complete OSHA 10 and 30-Hour courses online. Group rates available for crews of any size.
            </p>
            <Link
              href="/consultation"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-[#0047AB] hover:bg-blue-50 font-display font-bold text-sm tracking-widest uppercase px-6 py-2.5 rounded transition-all duration-200 group"
            >
              Schedule Training
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRAINING CATEGORIES ── */}
      {trainingCategories.map((cat, i) => (
        <section
          key={cat.id}
          id={cat.id}
          className={`py-20 ${i % 2 === 0 ? "bg-white" : "bg-[#F4F6F8]"}`}
        >
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
              {/* Content */}
              <RevealSection className={i % 2 !== 0 ? "lg:order-2" : ""}>
                <div className="accent-bar pl-5 mb-3">
                  <span className="text-[#1E90FF] font-display font-bold text-xs tracking-widest uppercase">{cat.badge}</span>
                </div>
                <h2 className="font-display font-extrabold text-[#0F1C2E] mb-4"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                  {cat.title}
                </h2>
                <p className="text-gray-600 font-body leading-relaxed mb-6">{cat.summary}</p>

                <div className="mb-6">
                  <h4 className="font-display font-bold text-[#0F1C2E] text-sm tracking-wide uppercase mb-3">What's Covered</h4>
                  <ul className="space-y-2.5">
                    {cat.topics.map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-[#1E90FF] mt-0.5 shrink-0" />
                        <span className="text-gray-600 font-body text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-[#0047AB] rounded-r-lg px-5 py-4 mb-7">
                  <div className="font-display font-bold text-[#0F1C2E] text-xs tracking-widest uppercase mb-1">Who This Is For</div>
                  <p className="text-gray-600 font-body text-sm leading-relaxed">{cat.who}</p>
                </div>

                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-200 group"
                >
                  {cat.cta}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </RevealSection>

              {/* Image */}
              <RevealSection delay={150} className={i % 2 !== 0 ? "lg:order-1" : ""}>
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="rounded-lg shadow-2xl w-full object-cover"
                  style={{ maxHeight: 480 }}
                />
              </RevealSection>
            </div>
          </div>
        </section>
      ))}

      {/* ── ONLINE CLASSES SECTION ── */}
      <section className="py-20 bg-white">
        <div className="container">
          <RevealSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#1E90FF]/10 border border-[#1E90FF]/20 rounded-full px-4 py-1.5 mb-5">
                  <Monitor size={14} className="text-[#1E90FF]" />
                  <span className="text-[#0047AB] text-xs font-body tracking-widest uppercase font-semibold">
                    Online Training Available
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-[#0F1C2E] mb-4"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                  OSHA Online Video Classes.<br />
                  <span className="text-[#1E90FF]">Train at Your Own Pace.</span>
                </h2>
                <p className="text-gray-600 font-body leading-relaxed mb-6">
                  Can't bring your crew together for an in-person session? Bastion offers online video-based OSHA Outreach Training for all 10-Hour and 30-Hour courses across Construction, Maritime, and General Industry. Students complete the course at their own pace, on any device, and receive an official OSHA course completion card upon finishing.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "OSHA 10-Hour Construction — Online",
                    "OSHA 30-Hour Construction — Online",
                    "OSHA 10-Hour Maritime — Online",
                    "OSHA 30-Hour Maritime — Online",
                    "OSHA 10-Hour General Industry — Online",
                    "OSHA 30-Hour General Industry — Online",
                    "Official OSHA course completion card issued upon finishing",
                    "Self-paced — complete on any device, on your schedule",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-[#1E90FF] mt-0.5 shrink-0" />
                      <span className="text-gray-700 font-body text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
                >
                  Inquire About Online Classes
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div>
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/hpCGByYgAQxLLHpn.jpg"
                  alt="Online OSHA safety training video class on laptop"
                  className="rounded-lg shadow-2xl w-full object-cover"
                  style={{ maxHeight: 420 }}
                />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── ON-SITE DELIVERY SECTION ── */}
      <section className="py-20 bg-[#0F1C2E]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <div className="accent-bar pl-5 mb-3">
                <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Flexible Delivery</span>
              </div>
              <h2 className="font-display font-extrabold text-white mb-5"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                We Come to You.<br />
                <span className="text-[#1E90FF]">On-Site Training Available.</span>
              </h2>
              <p className="text-blue-200 font-body leading-relaxed mb-6">
                Bastion delivers training directly to your worksite, facility, or job trailer, minimizing downtime and keeping your crew on schedule. Whether you need to train a crew of five or a workforce of five hundred, we build a training plan that fits your timeline and operational requirements.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "On-site delivery at your worksite or facility",
                  "Group rates for crews of any size",
                  "Flexible scheduling — weekdays, evenings, and weekends available",
                  "Online and hybrid training options available",
                  "Bilingual training support available",
                  "Documentation and completion records provided",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#1E90FF] mt-0.5 shrink-0" />
                    <span className="text-blue-200 font-body text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/consultation"
                className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 hover:shadow-xl group"
              >
                Contact Bastion for On-Site Training
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </RevealSection>

            <RevealSection delay={150}>
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663579586675/rqMdqriKTGuisTBm.jpg"
                alt="Large group of construction workers receiving on-site safety training"
                className="rounded-lg shadow-2xl w-full object-cover"
                style={{ maxHeight: 460 }}
              />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block bg-[#1E90FF]/10 text-[#1E90FF] font-display font-bold text-xs tracking-widest uppercase px-4 py-2 rounded mb-4">
                Frequently Asked Questions
              </span>
              <h2 className="font-display font-extrabold text-gray-900 mb-4"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                OSHA Training — Common Questions
              </h2>
              <p className="text-gray-600 font-body max-w-2xl mx-auto">
                Everything you need to know about OSHA 10-Hour and 30-Hour Outreach Training in San Diego, Los Angeles, and Southern California.
              </p>
            </div>
          </RevealSection>

          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            {[
              {
                q: "What is OSHA 10-Hour and 30-Hour training?",
                a: "OSHA 10-Hour and 30-Hour courses are part of the OSHA Outreach Training Program, delivered by OSHA-authorized trainers. The 10-Hour course is designed for entry-level workers and covers basic hazard recognition and workers' rights. The 30-Hour course is designed for supervisors, foremen, and safety personnel and provides a more in-depth review of OSHA standards and compliance requirements. Both courses result in an official OSHA course completion card."
              },
              {
                q: "Is OSHA 10 or 30-Hour training required by law?",
                a: "OSHA 10 and 30-Hour training is not federally mandated for all industries, but many states, project owners, and general contractors require it as a condition of site access or employment. In California, certain public works projects and government contracts require OSHA cards. Many construction firms in San Diego and Los Angeles require OSHA 10 as a minimum for all workers and OSHA 30 for supervisors."
              },
              {
                q: "How long does OSHA 10-Hour and 30-Hour training take?",
                a: "The OSHA 10-Hour course requires a minimum of 10 contact hours and is typically completed over one to two days. The OSHA 30-Hour course requires a minimum of 30 contact hours and is typically completed over three to four days. Online versions allow participants to complete the training at their own pace, though the minimum hour requirements still apply."
              },
              {
                q: "Do I receive an OSHA card after completing the training?",
                a: "Yes. Upon successful completion of an OSHA 10-Hour or 30-Hour Outreach Training course delivered by an authorized trainer, participants receive an official OSHA course completion card issued through the OSHA Training Institute. This card is recognized nationwide and does not expire, though some employers and project owners require periodic refresher training."
              },
              {
                q: "What is the difference between OSHA Construction, Maritime, and General Industry training?",
                a: "Each version of the OSHA Outreach Training Program covers the specific OSHA standards that apply to that industry. Construction training (29 CFR 1926) covers fall protection, scaffolding, excavation, electrical safety, and other construction-specific hazards. Maritime training (29 CFR 1915, 1917, 1918) covers shipyard employment, marine terminals, and longshoring operations. General Industry training (29 CFR 1910) covers manufacturing, warehousing, utilities, and facilities. Workers should take the version that matches their workplace."
              },
              {
                q: "Does Bastion offer on-site OSHA training in San Diego and Los Angeles?",
                a: "Yes. Bastion Risk and Safety Group delivers on-site OSHA Outreach Training at your facility or job site throughout San Diego County, Los Angeles County, and all of Southern California. On-site training is ideal for employers who need to train multiple workers at once and prefer a field-focused, practical approach. We also offer online OSHA 10 and 30-Hour courses for individuals who need flexible scheduling."
              },
              {
                q: "Can Bastion train my entire crew at once?",
                a: "Yes. Bastion specializes in group and crew-based OSHA training for contractors, subcontractors, and employers. Whether you need to train five workers or fifty, we can schedule a dedicated on-site session at your location in San Diego, Los Angeles, or anywhere in Southern California. Contact us for group pricing and scheduling."
              },
              {
                q: "Does Bastion offer OSHA training for maritime and shipyard workers in San Diego?",
                a: "Yes. San Diego is home to one of the largest naval and commercial shipyard communities in the country. Bastion delivers OSHA Maritime Outreach Training (10-Hour and 30-Hour) specifically for shipyard workers, vessel repair technicians, marine terminal employees, and longshore workers. Our maritime training covers OSHA 29 CFR 1915, 1917, and 1918 standards, including confined space entry, hot work, fall protection, and hazardous materials."
              },
              {
                q: "What is Competent Person Training and who needs it?",
                a: "OSHA requires that certain high-hazard activities — including scaffold erection, excavation and trenching, fall protection, and confined space entry — be supervised by a designated Competent Person. A Competent Person is defined as someone capable of identifying existing and predictable hazards and authorized to take prompt corrective action. Bastion's Competent Person Training prepares foremen, superintendents, and lead workers in construction and general industry to fulfill this role in compliance with OSHA 29 CFR 1926 and 29 CFR 1910."
              },
              {
                q: "Is Bastion an authorized OSHA Outreach Trainer?",
                a: "Yes. Bastion Risk and Safety Group is an authorized OSHA Outreach Trainer for Construction, Maritime, and General Industry under the OSHA Outreach Training Program. Our trainers are authorized through the OSHA Training Institute Education Centers, which means all courses we deliver meet OSHA's standards and result in official OSHA course completion cards."
              }
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 40}>
                <details className="group py-6 cursor-pointer">
                  <summary className="flex items-start justify-between gap-4 list-none">
                    <span className="font-display font-bold text-gray-900 text-base leading-snug pr-4">{item.q}</span>
                    <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center font-bold text-sm group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <p className="mt-4 text-gray-600 font-body leading-relaxed text-sm">{item.a}</p>
                </details>
              </RevealSection>
            ))}
          </div>

          <RevealSection>
            <div className="text-center mt-12">
              <p className="text-gray-600 font-body mb-4">Have a question not listed here?</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-500 text-white font-display font-bold text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-200 group"
              >
                Ask Us Directly
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0047AB 0%, #1565C0 100%)" }}
      >
        <div className="container relative z-10 text-center">
          <RevealSection>
            <h2 className="font-display font-extrabold text-white mb-4"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Ready to Train Your Workforce?
            </h2>
            <p className="text-blue-200 font-body mb-8 max-w-xl mx-auto">
              Contact Bastion to schedule OSHA Outreach Training, Competent Person Training, or First Aid/CPR/AED for your team. We will build a training plan that fits your crew, your schedule, and your compliance requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0047AB] hover:bg-blue-50 font-display font-bold text-base tracking-widest uppercase px-8 py-4 rounded transition-all duration-200 group"
              >
                Request a Training Quote
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
