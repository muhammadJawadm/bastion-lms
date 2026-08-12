/* ============================================================
   BASTION FOOTER — "Command & Protect" design
   Dark cobalt background, structured columns
   ============================================================ */
import { Link } from "wouter";
import { Phone, Mail, MapPin, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0F1C2E] text-white">


      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/bastion_logo.jpg"
                alt="Bastion Risk and Safety Group"
                className="h-12 w-12 rounded object-cover"
              />
              <div>
                <div className="font-display text-white text-xl font-bold tracking-wide">BASTION</div>
                <div className="text-blue-300 text-xs font-body tracking-widest uppercase">Risk & Safety Group, LLC</div>
              </div>
            </div>
            <p className="text-blue-200 text-sm font-body leading-relaxed max-w-xs">
              Field-proven safety consulting for high-risk industries. Protecting people, projects, and organizations through expert guidance and measurable outcomes.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-white text-lg font-bold tracking-wide mb-4 uppercase">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Training Programs", href: "/training" },
                { label: "Request a Consultation", href: "/consultation" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-blue-300 hover:text-white text-sm font-body transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E90FF] group-hover:bg-white transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-display text-white text-lg font-bold tracking-wide mb-4 uppercase">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:7032820803"
                  className="flex items-start gap-3 text-blue-200 hover:text-white text-sm font-body transition-colors group"
                >
                  <Phone size={16} className="mt-0.5 text-[#1E90FF] shrink-0" />
                  (703) 282-0803
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@bastionsafety.net"
                  className="flex items-start gap-3 text-blue-200 hover:text-white text-sm font-body transition-colors group break-all"
                >
                  <Mail size={16} className="mt-0.5 text-[#1E90FF] shrink-0" />
                  info@bastionsafety.net
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-blue-200 text-sm font-body">
                  <MapPin size={16} className="mt-0.5 text-[#1E90FF] shrink-0" />
                  San Diego County, California
                </div>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/training"
                className="inline-block bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-sm tracking-widest uppercase px-5 py-2.5 rounded transition-all duration-200"
              >
                Schedule Training
              </Link>
              <Link
                href="/consultation"
                className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white font-display font-bold text-sm tracking-widest uppercase px-5 py-2.5 rounded transition-all duration-200"
              >
                Request Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-blue-400 text-xs font-body">
            © {new Date().getFullYear()} Bastion Risk and Safety Group, LLC. All rights reserved.
          </p>
          <p className="text-blue-500 text-xs font-body">
            DVBE | SB (Micro) | OSHA Authorized Outreach Training | Safety Consulting
          </p>
        </div>
      </div>
    </footer>
  );
}
