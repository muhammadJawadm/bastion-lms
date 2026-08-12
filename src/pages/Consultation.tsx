/* ============================================================
   CONSULTATION PAGE — "Command & Protect" design
   Formspree endpoint: https://formspree.io/f/xgorpkjg
   ============================================================ */
import { useState } from "react";
import { Link } from "wouter";
import { Shield, CheckCircle, Phone, Mail, ArrowRight, Send } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  "OSHA 10-Hour Training (Construction)",
  "OSHA 30-Hour Training (Construction)",
  "OSHA 10-Hour Training (Maritime)",
  "OSHA 30-Hour Training (Maritime)",
  "OSHA 10-Hour Training (General Industry)",
  "OSHA 30-Hour Training (General Industry)",
  "Competent Person Training",
  "First Aid / CPR / AED Training",
  "Safety Program Development",
  "Program Gap Analysis",
  "Site Safety Audit / Inspection",
  "Incident Investigation & Root Cause Analysis",
  "Compliance Management",
  "Job Hazard Analysis (JHA) Development",
  "Other / Not Sure",
];

const industries = [
  "Construction",
  "Maritime",
  "Utilities",
  "Infrastructure / Public Works",
  "Oil & Gas",
  "Manufacturing",
  "General Industry",
  "Other",
];

export default function Consultation() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    email: "",
    phone: "",
    industry: "",
    service: "",
    projectSize: "",
    message: "",
    timeline: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://formspree.io/f/xgorpkjg", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data?.errors?.[0]?.message || "Something went wrong. Please try again or email us directly.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>Request a Safety Consulting or Training Quote | San Diego & Los Angeles | Bastion Risk & Safety Group</title>
        <meta name="description" content="Request a quote for OSHA 10-Hour or 30-Hour Training in San Diego, Los Angeles, or Southern California. Schedule Construction, Maritime, or General Industry OSHA training, Competent Person Training, or First Aid/CPR/AED. Authorized OSHA Outreach Trainer. Call (703) 282-0803." />
        <meta name="keywords" content="OSHA training quote San Diego, OSHA training quote Los Angeles, schedule OSHA training Southern California, book OSHA 10-hour training San Diego, book OSHA 30-hour training Los Angeles, request safety training quote California, on-site OSHA training San Diego" />
        <meta property="og:title" content="Request a Safety Consulting or Training Quote | Bastion Risk & Safety Group" />
        <meta property="og:description" content="Get a quote for OSHA 10 & 30-Hour Training in San Diego, Los Angeles, and Southern California. Construction, Maritime, General Industry. Authorized OSHA Outreach Trainer." />
        <meta property="og:url" content="https://bastionrsg.com/consultation" />
        <link rel="canonical" href="https://bastionrsg.com/consultation" />
      </Helmet>
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section
        className="relative pt-32 pb-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F1C2E 0%, #0047AB 100%)" }}
      >

        <div className="container relative z-10">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-body mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Request a Consultation</span>
          </div>
          <h1 className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            Request a Training Quote or Consultation
          </h1>
          <p className="text-blue-200 font-body text-lg max-w-2xl leading-relaxed">
            Need to schedule OSHA Outreach Training, Competent Person Training, or First Aid/CPR/AED for your crew? Ready to discuss a safety consulting engagement? Fill out the form below and we'll respond within one business day.
          </p>
        </div>
      </section>

      {/* ── FORM SECTION ── */}
      <section className="py-16 bg-[#F4F6F8]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

            {/* Left: Value proposition */}
            <div className="lg:col-span-2">
              <div className="accent-bar pl-5 mb-4">
                <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Why Bastion</span>
              </div>
              <h2 className="font-display font-extrabold text-[#0F1C2E] mb-5"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                What to Expect After You Reach Out
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  { step: "01", title: "Response Within 1 Business Day", desc: "We review your inquiry and reach out promptly to schedule a discovery call." },
                  { step: "02", title: "Needs Assessment", desc: "We listen to your challenges, goals, and operational context to understand exactly what you need." },
                  { step: "03", title: "Tailored Proposal", desc: "We provide a customized scope of work and pricing aligned to your project requirements." },
                  { step: "04", title: "Seamless Deployment", desc: "Our consultants integrate into your team and get to work — with clear communication throughout." },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <div className="font-display font-extrabold text-[#1E90FF] text-2xl leading-none w-10 shrink-0">{item.step}</div>
                    <div>
                      <div className="font-display font-bold text-[#0F1C2E] text-base mb-1">{item.title}</div>
                      <div className="text-gray-500 font-body text-sm leading-relaxed">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="bg-[#0047AB] rounded-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={18} className="text-[#1E90FF]" />
                  <span className="font-display font-bold text-sm tracking-wide uppercase">Prefer to Call?</span>
                </div>
                <a href="tel:7032820803" className="flex items-center gap-2 text-blue-100 hover:text-white font-body text-sm mb-2 transition-colors">
                  <Phone size={14} />
                  (703) 282-0803
                </a>
                <a href="mailto:info@bastionsafety.net" className="flex items-center gap-2 text-blue-100 hover:text-white font-body text-sm transition-colors break-all">
                  <Mail size={14} />
                  info@bastionsafety.net
                </a>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white rounded-xl shadow-lg p-10 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#0047AB]/10 rounded-full p-4">
                      <CheckCircle size={40} className="text-[#0047AB]" />
                    </div>
                  </div>
                  <h3 className="font-display font-extrabold text-[#0F1C2E] text-2xl mb-3">
                    Thank You — We'll Be in Touch!
                  </h3>
                  <p className="text-gray-500 font-body text-sm leading-relaxed mb-6">
                    Your consultation request has been received. A member of the Bastion team will review your information and reach out within one business day.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-sm tracking-widest uppercase px-6 py-3 rounded transition-all duration-200 group"
                  >
                    Return Home
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
                  <h3 className="font-display font-extrabold text-[#0F1C2E] text-2xl mb-2">Consultation Request Form</h3>
                  <p className="text-gray-400 font-body text-sm mb-4">All fields marked with * are required.</p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-md px-4 py-3">
                      {error}
                    </div>
                  )}

                  {/* Name row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={form.lastName}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  {/* Company / Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Company / Organization *</label>
                      <input
                        type="text"
                        name="company"
                        required
                        value={form.company}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                        placeholder="ABC Construction, Inc."
                      />
                    </div>
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Your Title / Role</label>
                      <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                        placeholder="Safety Manager"
                      />
                    </div>
                  </div>

                  {/* Email / Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* Industry / Service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Industry *</label>
                      <select
                        name="industry"
                        required
                        value={form.industry}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all bg-white"
                      >
                        <option value="" disabled>Select your industry</option>
                        {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Service Needed *</label>
                      <select
                        name="service"
                        required
                        value={form.service}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all bg-white"
                      >
                        <option value="" disabled>Select a service</option>
                        {services.map((svc) => <option key={svc} value={svc}>{svc}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Desired Timeline</label>
                    <select
                      name="timeline"
                      value={form.timeline}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all bg-white"
                    >
                      <option value="">Select a timeline</option>
                      <option value="Immediately / ASAP">Immediately / ASAP</option>
                      <option value="Within 2 weeks">Within 2 weeks</option>
                      <option value="Within 30 days">Within 30 days</option>
                      <option value="1–3 months">1–3 months</option>
                      <option value="Ongoing / Long-term">Ongoing / Long-term</option>
                      <option value="Not sure yet">Not sure yet</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Tell Us About Your Needs *</label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all resize-none"
                      placeholder="Describe your safety challenges, project scope, workforce size, or any specific requirements..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] disabled:opacity-60 text-white font-display font-bold text-base tracking-widest uppercase py-4 rounded transition-all duration-200 group"
                  >
                    {loading ? (
                      <span className="animate-pulse">Submitting...</span>
                    ) : (
                      <>
                        Submit Consultation Request
                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-gray-400 font-body text-xs text-center">
                    By submitting this form, you agree to be contacted by Bastion Risk and Safety Group regarding your inquiry. Your request will be sent to info@bastionsafety.net.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
