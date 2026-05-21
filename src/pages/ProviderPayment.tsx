import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, CreditCard, AlertCircle, Building2, Smartphone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from("provider_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("provider_id", user!.id)
      .maybeSingle();

    if (!data) { navigate("/provider/subscribe", { replace: true }); return; }
    if (data.status === "active") { navigate("/dashboard/provider", { replace: true }); return; }
    // if (data.receipt_url || data.status === "pending") { navigate("/provider/pending", { replace: true }); return; }

    setSub(data);
    setPlan(data.subscription_plans);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !sub) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/receipt_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_receipts")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment_receipts")
        .getPublicUrl(uploadData?.path || path);

      const { error: updateError } = await supabase
        .from("provider_subscriptions")
        .update({ receipt_url: urlData.publicUrl, status: "pending" })
        .eq("id", sub.id);

      if (updateError) throw updateError;

      await supabase.from("admin_notifications").insert({
        provider_id: user.id,
        type: "receipt_uploaded",
        message: `Provider uploaded payment receipt for ${plan?.display_name || plan?.name} plan.`,
      });

      await supabase.from("subscription_audit_logs").insert({
        subscription_id: sub.id,
        action: "receipt_uploaded",
        notes: "Provider uploaded payment proof.",
      });

      toast({ title: "Receipt uploaded", description: "Your payment is under review." });
      navigate("/provider/pending", { replace: true });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-[600px] w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <CreditCard size={32} className="mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-extrabold text-foreground">Complete Payment</h1>
          <p className="text-muted-foreground mt-1">
            Finalize your <span className="font-semibold text-foreground">{plan?.display_name || plan?.name}</span> subscription
          </p>
        </div>

        {/* Plan summary */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-accent/50">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold text-foreground">{plan?.display_name || plan?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-accent/50">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-bold text-xl text-primary">${plan?.price}/month</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>Choose one of the methods below and transfer the amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Transfer */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                <Building2 size={18} className="text-primary" /> Bank Transfer
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="font-semibold text-sm text-foreground">Premier Bank</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Account Name: <span className="text-foreground">YASIN MOHAMOUD ISMAIL</span></p>
                    <p>Account Number: <span className="text-foreground">100950073001</span></p>
                    <p>Dahabshiil Your Trusted Financial Partner</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Mobile Money */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                <Smartphone size={18} className="text-primary" /> Mobile Money (E-Payment)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="font-semibold text-sm text-foreground">ZAAD</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Number: <span className="text-foreground">+252 XXXXXXXX</span></p>
                    <p>Name: <span className="text-foreground">Somopportunity</span></p>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="font-semibold text-sm text-foreground">EVC Plus (Hormuud)</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Number: <span className="text-foreground">+252 XXXXXXXX</span></p>
                    <p>Name: <span className="text-foreground">Somopportunity</span></p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Important Notice */}
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">Important Notice</p>
                <p className="text-muted-foreground">
                  Use your <strong className="text-foreground">registered email AND phone number</strong> as the payment reference so we can verify your payment quickly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Upload Payment Receipt
            </CardTitle>
            <CardDescription>Upload a screenshot or PDF of your payment confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <Label
              htmlFor="receipt"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload size={32} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {uploading ? "Uploading…" : "Click to upload receipt"}
              </span>
              <span className="text-xs text-muted-foreground">Supported: JPG, PNG, PDF — Max 10MB</span>
            </Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
