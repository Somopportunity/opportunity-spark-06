import { Sparkles, Globe2 } from "lucide-react";
import { motion } from "framer-motion";
import HeroSearchBar from "./HeroSearchBar";
import CategoryChips from "./CategoryChips";
import HeroVisual from "./HeroVisual";
import logo from "@/assets/somopportunity-logo.png";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-20 md:pb-28 bg-gradient-to-b from-white via-secondary/10 to-white">
      {/* UN-inspired soft background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--secondary)/0.18),transparent_55%),radial-gradient(circle_at_85%_30%,hsl(var(--primary)/0.10),transparent_50%)]" />

      {/* Subtle grid pattern for a global, professional feel */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Logo watermark */}
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-16 w-[420px] md:w-[560px] opacity-[0.05] select-none"
      />

      <div className="absolute top-10 left-[5%] h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[120px]" />
      <div className="absolute bottom-0 right-[10%] h-[400px] w-[400px] rounded-full bg-secondary/[0.10] blur-[100px]" />
      <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[80px]" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — Text Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent/60 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
                <Sparkles size={14} />
                Your gateway to global opportunities
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-[3.4rem] xl:text-6xl"
            >
              Discover Opportunities That{" "}
              <span className="text-gradient">Shape Your Future</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg mx-auto lg:mx-0"
            >
              Find jobs, scholarships, fellowships, grants, and internships from trusted organizations around the world.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <HeroSearchBar />
            </motion.div>

            {/* Category Chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-6"
            >
              <p className="text-xs text-muted-foreground mb-2 lg:text-left text-center">
                Popular categories
              </p>
              <CategoryChips />
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-10 flex items-center justify-center lg:justify-start gap-8"
            >
              {[
                { value: "100+", label: "Opportunities" },
                { value: "2,500+", label: "Users" },
                { value: "50+", label: "Countries" },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-foreground md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden md:flex justify-center lg:justify-end"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
