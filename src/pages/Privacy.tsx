import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const defaultContent = `<h2>Privacy Policy</h2><p>This Privacy Policy explains how Somopportunity collects, uses, and discloses your information when you use our platform.</p>`;

export default function Privacy() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_pages")
      .select("content")
      .eq("slug", "privacy")
      .maybeSingle()
      .then(({ data }) => {
        setContent(data?.content || null);
        setLoading(false);
      });
  }, []);

  const html = content || defaultContent;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="hero-gradient py-20 md:py-28">
          <div className="container text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
              Privacy Policy
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-primary-foreground/80 max-w-xl mx-auto text-lg">
              Learn how we collect, use, and protect your data.
            </motion.p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="container max-w-4xl"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div
                className="rich-text-rendered text-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
              />
            )}
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
