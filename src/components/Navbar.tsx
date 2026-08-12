/* ============================================================
   BASTION NAVBAR — "Command & Protect" design
   Kiewit-style: tight white logo block flush left, cobalt nav bar
   Training added as primary nav item
   ============================================================ */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Training", href: "/training" },
  { label: "Resources", href: "/blog" },
  { label: "Bastion LMS", href: "/lms/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location === "/";
  const solid = !isHome || scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid ? "bg-[#0047AB] shadow-lg" : "bg-transparent"
      }`}
      style={{ height: 72 }}
    >
      <div className="flex items-stretch h-full">

        {/* ── Kiewit-style logo block: tight white panel, flush top/bottom ── */}
        <Link
          href="/"
          className="flex items-center justify-center bg-white shrink-0 px-6 h-full hover:bg-gray-50 transition-colors"
        >
          <img
            src="/bastion_logo.png"
            alt="Bastion Risk and Safety Group, LLC"
            className="h-11 w-auto object-contain"
          />
        </Link>

        {/* ── Main nav content ── */}
        <div className="flex-1 flex items-center justify-between px-6 lg:px-10">

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-body font-semibold text-sm tracking-wide transition-colors relative group ${
                  location === link.href
                    ? "text-white"
                    : "text-blue-100 hover:text-white"
                } ${link.label === "Training" ? "text-[#7DD3FC] hover:text-white font-bold" : ""}`}
              >
                {link.label}

                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-[#1E90FF] transition-all duration-300 ${
                    location === link.href ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:7032820803"
              className="flex items-center gap-2 text-blue-100 hover:text-white text-sm font-body transition-colors"
            >
              <Phone size={14} />
              (703) 282-0803
            </a>
            <Link
              href="/training"
              className="bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-sm tracking-widest uppercase px-5 py-2.5 rounded transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Schedule Training
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2 ml-auto"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#003380] border-t border-blue-700">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body font-semibold text-blue-100 hover:text-white py-2 border-b border-blue-700/50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}

              </Link>
            ))}
            <Link
              href="/training"
              className="bg-[#1E90FF] text-white font-display font-bold text-sm tracking-widest uppercase px-5 py-3 rounded text-center mt-2"
              onClick={() => setMenuOpen(false)}
            >
              Schedule Training
            </Link>
            <Link
              href="/consultation"
              className="bg-white/10 border border-white/30 text-white font-display font-bold text-sm tracking-widest uppercase px-5 py-3 rounded text-center"
              onClick={() => setMenuOpen(false)}
            >
              Request Consultation
            </Link>
            <a
              href="tel:7032820803"
              className="flex items-center justify-center gap-2 text-blue-200 text-sm font-body"
            >
              <Phone size={14} />
              (703) 282-0803
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
