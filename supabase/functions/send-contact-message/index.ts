import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECIPIENTS = ["somopportunity@gmail.com", "info@somopportunity.com"];

// very simple in-memory rate limit per IP
const rateMap = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // rate limit
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (entry && now - entry.ts < WINDOW_MS) {
      if (entry.count >= MAX_PER_WINDOW) {
        return new Response(JSON.stringify({ error: "Too many submissions, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      entry.count++;
    } else {
      rateMap.set(ip, { count: 1, ts: now });
    }

    const body = await req.json();
    const full_name = String(body.full_name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const honeypot = String(body.website || "").trim(); // honeypot field

    if (honeypot) {
      // silently accept
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!full_name || full_name.length > 120) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!subject || subject.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: dbError } = await adminClient.from("contact_messages").insert({
      full_name, email, subject, message, ip_address: ip,
    });

    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend if configured
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") || "onboarding@resend.dev";

    if (RESEND_API_KEY) {
      const submittedAt = new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
      const html = `
        <h2>New Contact Form Submission — Somopportunity</h2>
        <p><b>Full Name:</b> ${escapeHtml(full_name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Subject:</b> ${escapeHtml(subject)}</p>
        <p><b>Submitted:</b> ${submittedAt}</p>
        <hr/>
        <p><b>Message:</b></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `;
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `Somopportunity Contact <${FROM_EMAIL}>`,
            to: RECIPIENTS,
            reply_to: email,
            subject: `[Contact] ${subject}`,
            html,
          }),
        });
        if (!r.ok) console.error("Resend error:", await r.text());
      } catch (e) {
        console.error("Email send failed:", e);
      }
    } else {
      console.warn("RESEND_API_KEY not set; message saved to DB only.");
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: m }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
