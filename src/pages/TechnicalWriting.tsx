import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, BookOpen, Code, ClipboardList, PenTool, Edit, CheckCircle, MessageSquare, Search, FileCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

const services = [
  { icon: FileText, title: "Technical Documentation", desc: "Comprehensive documentation for software, products, and systems." },
  { icon: Code, title: "API Documentation", desc: "Clear, structured API references and integration guides." },
  { icon: BookOpen, title: "User Guides", desc: "Step-by-step manuals and tutorials for end users." },
  { icon: ClipboardList, title: "Research Reports", desc: "In-depth research analysis and formatted reports." },
  { icon: PenTool, title: "Proposal Writing", desc: "Grant proposals, business proposals, and project plans." },
  { icon: Edit, title: "Content Editing", desc: "Professional editing and proofreading of technical content." },
];

const steps = [
  { num: 1, title: "Consultation", desc: "Discuss your project scope and requirements", icon: MessageSquare },
  { num: 2, title: "Research", desc: "Deep dive into the subject matter", icon: Search },
  { num: 3, title: "Writing", desc: "Draft creation with clear structure", icon: PenTool },
  { num: 4, title: "Review", desc: "Quality assurance and revisions", icon: FileCheck },
  { num: 5, title: "Delivery", desc: "Final polished documentation", icon: Send },
];

const projectTypes = ["Technical Documentation", "API Documentation", "User Guide", "Research Report", "Proposal Writing", "Content Editing", "Other"];

export default function TechnicalWriting() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    organization_name: "",
    email: "",
    phone: "",
    project_type: "",
    description: "",
    deadline: "",
  });

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("technical_writing_requests" as any).insert({
      full_name: form.full_name,
      organization_name: form.organization_name,
      email: form.email,
      phone: form.phone || null,
      project_type: form.project_type || null,
      description: form.description || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    } as any);

    setLoading(false);

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="hero-gradient py-20 md:py-28 text-center">
        <div className="container">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-medium border border-primary-foreground/20"
          >
            Services
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-primary-foreground md:text-5xl lg:text-6xl"
          >
            Technical Writing Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80"
          >
            Professional documentation and technical content creation for organizations, startups, and platforms.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button
              size="lg"
              className="mt-8 btn-gradient font-bold px-8 rounded-xl text-base"
              onClick={() => document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              Request Service
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Our <span className="text-gradient">Writing Services</span>
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              From API docs to research reports — we deliver professional technical content tailored to your needs.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glow-border h-full transition-all duration-300 hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                      <s.icon size={24} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Our <span className="text-gradient">Process</span>
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              A streamlined workflow that delivers quality results on time.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-0 items-stretch justify-center">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 relative"
              >
                <Card className="h-full text-center border-border/60">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {step.num}
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section id="request-form" className="py-20 md:py-28">
        <div className="container max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Request <span className="text-gradient">Writing Service</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tell us about your project and we'll get back to you within 24 hours.
            </p>
          </div>

          {submitted ? (
            <Card className="glass-card text-center">
              <CardContent className="py-16">
                <CheckCircle size={48} className="mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Request Submitted</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Thank you for your request. Our team will review your project details and contact you within 24 hours.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization Name *</Label>
                      <Input value={form.organization_name} onChange={(e) => set("organization_name", e.target.value)} required placeholder="Acme Corp" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="jane@acme.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="+1 555 123 4567" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Type</Label>
                      <Select value={form.project_type} onValueChange={(v) => set("project_type", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description of Work</Label>
                    <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your project requirements..." rows={4} />
                  </div>

                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full btn-gradient font-bold rounded-xl text-base py-3">
                    {loading ? "Submitting..." : "Request Writing Service"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
