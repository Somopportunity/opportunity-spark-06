import { useNavigate } from "react-router-dom";
import { Facebook, Linkedin, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { useFooterSettings } from "@/hooks/useFooterSettings";
import logo from "@/assets/somopportunity-logo.png";

const opportunities = [
  { label: "Scholarships", href: "/opportunities?category=scholarship" },
  { label: "Internships", href: "/opportunities?category=internship" },
  { label: "Fellowships", href: "/opportunities?category=fellowship" },
  { label: "Grants", href: "/opportunities?category=grant" },
  { label: "Jobs", href: "/opportunities?category=job" },
];

const company = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/about#team" },
  { label: "Careers", href: "/opportunities?category=job" },
  { label: "Blog", href: "/articles" },
  { label: "Hire Talent", href: "/hire-talent" },
];

const socials = [
  { icon: Linkedin, href: "https://so.linkedin.com/company/somopportunity", label: "LinkedIn" },
  { icon: Facebook, href: "https://www.facebook.com/share/1Cb4M76mHC/?mibextid=wwXIfr", label: "Facebook" },
  { icon: Send, href: "https://t.me/somopportunity", label: "Telegram" },
  { icon: MessageCircle, href: "https://whatsapp.com/channel/0029VbBXKMvDzgTFfwjIEO2n", label: "WhatsApp" },
];

function FooterLinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const navigate = useNavigate();
  return (
    <div>
      <h4 className="text-base font-bold text-white mb-5">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <button
              onClick={() => navigate(link.href)}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const navigate = useNavigate();
  const { settings } = useFooterSettings();

  const support = [
    { label: "Help Center", href: "/contact" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/contact" },
    { label: "Privacy Policy", href: settings.privacy_url },
    { label: "Terms of Service", href: settings.terms_url },
  ];

  const contacts = [
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, label: "Location", value: settings.location, href: "#" },
  ];

  const copyrightText = settings.copyright.replace("{year}", String(new Date().getFullYear()));

  const bottomLinks = [
    { label: "Privacy Policy", href: settings.privacy_url },
    { label: "Terms of Service", href: settings.terms_url },
    { label: "Cookie Policy", href: settings.cookie_url },
  ];

  return (
    <footer style={{ background: "var(--footer-gradient)" }}>
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center p-1.5">
                <img src={logo} alt="Somopportunity" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white uppercase">
                Somopportunity
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Your gateway to global opportunities — a digital ecosystem connecting talent with verified scholarships, jobs, internships, fellowships, and training programs worldwide.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-200 hover:bg-primary hover:border-primary hover:-translate-y-0.5"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterLinkColumn title="Opportunities" links={opportunities} />
          <FooterLinkColumn title="Company" links={company} />
          <FooterLinkColumn title="Support" links={support} />
        </div>
      </div>

      <div className="container">
        <div className="border-t border-white/10" />
      </div>

      <div className="container py-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {contacts.map((c, i) => (
            <a key={`${c.label}-${i}`} href={c.href} className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-primary">
                <c.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{c.label}</p>
                <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{c.value}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="border-t border-white/10" />
      </div>

      <div className="container py-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-slate-400">{copyrightText}</p>
          <div className="flex items-center gap-6">
            {bottomLinks.map((t) => (
              <button
                key={t.label}
                onClick={() => navigate(t.href)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
