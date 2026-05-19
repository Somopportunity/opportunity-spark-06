import { motion } from "framer-motion";
import { Briefcase, GraduationCap, MapPin, Clock, Building2 } from "lucide-react";

const floatingCards = [
  {
    title: "Software Engineer",
    org: "TechCorp Africa",
    location: "Nairobi, Kenya",
    type: "Job",
    badge: "bg-primary/10 text-primary border-primary/20",
    delay: 0,
  },
  {
    title: "STEM Scholarship 2026",
    org: "Global Education Fund",
    location: "Remote",
    type: "Scholarship",
    badge: "bg-secondary/20 text-primary border-secondary/40",
    delay: 0.15,
  },
  {
    title: "Youth Fellowship",
    org: "UN Development",
    location: "New York, USA",
    type: "Fellowship",
    badge: "bg-primary/5 text-primary border-primary/15",
    delay: 0.3,
  },
];

export default function HeroVisual() {
  return (
    <div className="relative w-full h-[340px] md:h-[420px] lg:h-[460px]">
      {/* Glow backdrop */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-glow opacity-60" />

      {/* Floating cards */}
      <div className="relative h-full flex flex-col items-center justify-center gap-4 px-4">
        {floatingCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: 40, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + card.delay, ease: "easeOut" }}
            className={`w-full max-w-[320px] rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)] backdrop-blur-sm transition-shadow hover:shadow-[var(--card-shadow-hover)]`}
            style={{ marginLeft: i % 2 === 0 ? "0" : "24px" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{card.title}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Building2 size={12} />
                  <span className="truncate">{card.org}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span>{card.location}</span>
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${card.badge}`}>
                {card.type}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decorative dots */}
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full border border-primary/10" />
      <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-primary/5" />
    </div>
  );
}
