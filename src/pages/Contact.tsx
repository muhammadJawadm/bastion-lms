/* ============================================================
   CONTACT PAGE — "Command & Protect" design
   Formspree endpoint: https://formspree.io/f/xjgjpwqo
   ============================================================ */
import { useState } from "react";
import { Link } from "wouter";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xjgjpwqo";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
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
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        // Google Ads conversion tracking — Contact Form Submission
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            'send_to': 'AW-18112941944/6Q5HCOqRyrAcEPie9rxD',
            'value': 1.0,
            'currency': 'USD'
          });
        }
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
        <title>Contact Bastion Risk & Safety Group | Safety Consulting & Training | San Diego & Los Angeles | (703) 282-0803</title>
        <meta name="description" content="Contact Bastion Risk and Safety Group to schedule OSHA 10-Hour or 30-Hour Training in San Diego, Los Angeles, or Southern California. Call (703) 282-0803 or email info@bastionsafety.net. Authorized OSHA Outreach Trainer for Construction, Maritime, and General Industry." />
        <meta name="keywords" content="contact OSHA trainer San Diego, contact OSHA trainer Los Angeles, OSHA training phone number San Diego, schedule OSHA training San Diego, OSHA training Southern California contact, Bastion Risk Safety Group phone" />
        <meta property="og:title" content="Contact Bastion Risk & Safety Group | Safety Consulting & Training" />
        <meta property="og:description" content="Schedule OSHA 10 & 30-Hour Training in Southern California. Call (703) 282-0803 or email info@bastionsafety.net. Authorized OSHA Outreach Trainer." />
        <meta property="og:url" content="https://bastionrsg.com/contact" />
        <link rel="canonical" href="https://bastionrsg.com/contact" />
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
            <span className="text-white">Contact Us</span>
          </div>
          <h1 className="font-display font-extrabold text-white mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
            Contact Us
          </h1>
          <p className="text-blue-200 font-body text-lg max-w-2xl leading-relaxed">
            Have a question or ready to get started? Reach out to the Bastion team, we respond to all inquiries within one business day.
          </p>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="py-16 bg-[#F4F6F8]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="accent-bar pl-5 mb-3">
                  <span className="text-[#1E90FF] font-display font-bold text-sm tracking-widest uppercase">Get In Touch</span>
                </div>
                <h2 className="font-display font-extrabold text-[#0F1C2E] mb-4"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                  We're Ready to Help
                </h2>
                <p className="text-gray-500 font-body text-sm leading-relaxed">
                  Whether you have a quick question about our services or are ready to discuss a project, the Bastion team is here to support you. Reach out through any of the channels below.
                </p>
              </div>

              {/* Contact cards */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-5 shadow-sm flex items-start gap-4 accent-bar">
                  <div className="bg-[#0047AB]/10 rounded-lg p-3 shrink-0">
                    <Phone size={20} className="text-[#0047AB]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0F1C2E] text-base mb-1">Phone</div>
                    <a href="tel:7032820803" className="text-[#0047AB] hover:text-[#1E90FF] font-body text-sm transition-colors">
                      (703) 282-0803
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm flex items-start gap-4 accent-bar">
                  <div className="bg-[#0047AB]/10 rounded-lg p-3 shrink-0">
                    <Mail size={20} className="text-[#0047AB]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0F1C2E] text-base mb-1">Email</div>
                    <a href="mailto:info@bastionsafety.net" className="text-[#0047AB] hover:text-[#1E90FF] font-body text-sm transition-colors break-all">
                      info@bastionsafety.net
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm flex items-start gap-4 accent-bar">
                  <div className="bg-[#0047AB]/10 rounded-lg p-3 shrink-0">
                    <MapPin size={20} className="text-[#0047AB]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0F1C2E] text-base mb-1">Location</div>
                    <p className="text-gray-500 font-body text-sm">San Diego County, California</p>
                    <p className="text-gray-400 font-body text-xs mt-0.5">Serving clients nationwide</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm flex items-start gap-4 accent-bar">
                  <div className="bg-[#0047AB]/10 rounded-lg p-3 shrink-0">
                    <Clock size={20} className="text-[#0047AB]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0F1C2E] text-base mb-1">Business Hours</div>
                    <p className="text-gray-500 font-body text-sm">Monday – Friday: 8:00 AM – 5:00 PM PT</p>
                    <p className="text-gray-400 font-body text-xs mt-0.5">Emergency response available</p>
                  </div>
                </div>
              </div>

              {/* CTA to consultation */}
              <div className="bg-[#0047AB] rounded-lg p-6 text-white">
                <h4 className="font-display font-bold text-lg mb-2">Need a Full Consultation?</h4>
                <p className="text-blue-200 font-body text-sm mb-4 leading-relaxed">
                  For detailed project inquiries, use our consultation request form to provide us with full context about your needs.
                </p>
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-sm tracking-widest uppercase px-5 py-2.5 rounded transition-all duration-200 group"
                >
                  Request a Consultation
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white rounded-xl shadow-lg p-10 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#0047AB]/10 rounded-full p-4">
                      <CheckCircle size={40} className="text-[#0047AB]" />
                    </div>
                  </div>
                  <h3 className="font-display font-extrabold text-[#0F1C2E] text-2xl mb-3">
                    Message Received!
                  </h3>
                  <p className="text-gray-500 font-body text-sm leading-relaxed mb-6">
                    Thank you for reaching out. A member of the Bastion team will respond to your message within one business day.
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
                  <h3 className="font-display font-extrabold text-[#0F1C2E] text-2xl mb-1">Send Us a Message</h3>
                  <p className="text-gray-400 font-body text-sm mb-4">We'll respond within one business day.</p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-md px-4 py-3">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all"
                      placeholder="John Smith"
                    />
                  </div>

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

                  <div>
                    <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Subject *</label>
                    <select
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all bg-white"
                    >
                      <option value="" disabled>Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Service Information">Service Information</option>
                      <option value="Request a Quote">Request a Quote</option>
                      <option value="Partnership / Subcontracting">Partnership / Subcontracting</option>
                      <option value="DVBE Certification Inquiry">DVBE Certification Inquiry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-sm font-semibold text-[#0F1C2E] mb-1.5">Message *</label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-body text-sm text-[#0F1C2E] focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 transition-all resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] disabled:opacity-60 text-white font-display font-bold text-base tracking-widest uppercase py-4 rounded transition-all duration-200 group"
                  >
                    {loading ? (
                      <span className="animate-pulse">Sending...</span>
                    ) : (
                      <>
                        Send Message
                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-gray-400 font-body text-xs text-center">
                    Your message will be sent directly to info@bastionsafety.net.
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
