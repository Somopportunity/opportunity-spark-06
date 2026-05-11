import { useState } from "react";
import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Invalid email").max(200),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export default function Contact() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", subject: "", message: "", website: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Please fix the form", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-message", {
        body: { ...parsed.data, website: form.website },
      });
      if (error) throw error;
      setSubmitted(true);
      setForm({ full_name: "", email: "", subject: "", message: "", website: "" });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="hero-gradient py-20 md:py-28">
          <div className="container text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
              Contact Us
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-primary-foreground/80 max-w-xl mx-auto text-lg">
              Have a question or want to collaborate? We'd love to hear from you.
            </motion.p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              {submitted ? (
                <div className="glass-card rounded-lg p-8 text-center shadow-[var(--card-shadow)]">
                  <CheckCircle size={48} className="mx-auto mb-4 text-primary" />
                  <h2 className="text-xl font-bold text-foreground mb-2">Message Received</h2>
                  <p className="text-muted-foreground">
                    Thank you for contacting Somopportunity. We have received your message and will respond shortly.
                  </p>
                  <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="glass-card rounded-lg p-8 space-y-5 shadow-[var(--card-shadow)]">
                  <h2 className="text-xl font-bold text-foreground mb-2">Send a Message</h2>
                  {/* honeypot */}
                  <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your name" maxLength={120} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" maxLength={200} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" maxLength={200} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write your message..." rows={5} maxLength={5000} required />
                  </div>
                  <Button type="submit" className="btn-gradient w-full rounded-lg font-semibold" disabled={sending}>
                    {sending ? "Sending…" : (<><Send size={16} className="mr-2" /> Send Message</>)}
                  </Button>
                </form>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex flex-col justify-center space-y-8">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Get in Touch</h2>
                <p className="text-muted-foreground leading-relaxed">Whether you have a partnership inquiry, feedback, or just want to say hello — reach out and we'll respond as soon as possible.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <a href="mailto:somopportunity@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors block">somopportunity@gmail.com</a>
                    <a href="mailto:info@somopportunity.com" className="text-sm text-muted-foreground hover:text-primary transition-colors block">info@somopportunity.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">Remote – Serving users worldwide</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
