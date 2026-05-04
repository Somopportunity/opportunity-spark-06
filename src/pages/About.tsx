import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { GraduationCap, Briefcase, Building2, Award, Users, Globe, BookOpen, Calendar, Target, Eye, TrendingUp, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const categories = [
  { icon: GraduationCap, title: "Scholarships", desc: "Funding for academic excellence worldwide" },
  { icon: Briefcase, title: "Jobs", desc: "Career opportunities across industries" },
  { icon: Building2, title: "Internships", desc: "Hands-on professional experience" },
  { icon: Award, title: "Grants", desc: "Financial support for projects and research" },
  { icon: Users, title: "Fellowships", desc: "Leadership and development programs" },
  { icon: Globe, title: "Competitions", desc: "Showcase your talent globally" },
  { icon: Calendar, title: "Conferences", desc: "Networking and learning events" },
  { icon: BookOpen, title: "Training Programs", desc: "Skills development and workshops" },
];

const stats = [
  { value: "10K+", label: "Opportunities Shared" },
  { value: "50K+", label: "Active Users" },
  { value: "120+", label: "Countries Reached" },
  { value: "500+", label: "Partner Organizations" },
];

const values = [
  { icon: Target, title: "Our Mission", desc: "To expand access to global opportunities and empower individuals through technology, transparency, and innovation. We aim to break down geographic and socio-economic barriers by creating clear pathways to both professional and academic achievement." },
  { icon: Eye, title: "Our Vision", desc: "To become the world's leading platform for discovering opportunities, connecting talent with employers, and delivering professional services — building a future where every skilled individual can contribute to global progress." },
  { icon: Heart, title: "Our Values", desc: "Trust, clarity, and forward momentum. A confident, caring navigator that verifies opportunity and propels ambition into global impact — with friendly authority rather than corporate distance." },
  { icon: TrendingUp, title: "Our Impact", desc: "We connect thousands of individuals with verified, life-changing opportunities — scholarships, international jobs, internships, fellowships, and specialized training programs across the globe." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="hero-gradient py-24 md:py-32">
          <div className="container text-center">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-medium border border-primary-foreground/20"
            >
              About Somopportunity
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-6 leading-tight"
            >
              Connecting Global Talent with
              <br className="hidden md:block" />
              Life-Changing Opportunities
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-primary-foreground/80 max-w-2xl mx-auto text-lg md:text-xl"
            >
              We aggregate scholarships, jobs, grants, fellowships, and more from around the globe into one platform.
            </motion.p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 md:py-20 bg-card border-b border-border">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission / Vision / Values / Impact */}
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
                What <span className="text-gradient">Drives Us</span>
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
                Our purpose goes beyond listing opportunities — we're building a bridge to a better future.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v, i) => (
                <motion.div key={v.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Card className="h-full transition-all duration-300 hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-1 glow-border">
                    <CardContent className="p-8 flex gap-5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                        <v.icon size={28} strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 text-muted-foreground leading-relaxed"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">About the Company</h2>
              <p>
                Somopportunity is a premier global digital ecosystem engineered to bridge the gap between human potential and global possibilities. We serve as a comprehensive hub where ambition meets action, connecting thousands of individuals with verified, life-changing opportunities including prestigious scholarships, international jobs, internships, fellowships, and specialized training programs.
              </p>
              <p>
                Beyond being a discovery platform, Somopportunity functions as a strategic partner for organizations worldwide. We provide sophisticated recruitment solutions and professional technical services that empower institutions to identify top-tier talent and maintain high-quality operational documentation.
              </p>
              <p>
                Our platform is built on the belief that access to information is the ultimate equalizer in the modern global economy — a confident, caring navigator that verifies opportunity and propels ambition into global impact.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12"
            >
              What We <span className="text-gradient">Offer</span>
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-1 text-center">
                    <CardContent className="p-6">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                        <cat.icon size={24} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{cat.title}</h3>
                      <p className="text-sm text-muted-foreground">{cat.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="hero-gradient py-16 md:py-20">
          <div className="container text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4"
            >
              Ready to Discover Opportunities?
            </motion.h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of users who are already finding scholarships, jobs, and more on Somopportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-gradient font-bold px-8 rounded-xl text-base" onClick={() => navigate("/signup")}>
                Join Now
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-8 rounded-xl" onClick={() => navigate("/opportunities")}>
                Browse Opportunities
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
