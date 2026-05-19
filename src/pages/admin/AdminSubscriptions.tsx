import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("provider_subscriptions")
      .select("*, subscription_plans(name, posting_limit), profiles!provider_subscriptions_provider_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    const rows = data || [];

    // Emails live in auth.users — fetch them via a SECURITY DEFINER helper (admin-only).
    const providerIds = Array.from(new Set(rows.map((r: any) => r.provider_id).filter(Boolean)));
    let emailMap = new Map<string, string>();
    if (providerIds.length) {
      const { data: emails } = await supabase.rpc("get_user_emails", { user_ids: providerIds });
      (emails || []).forEach((e: any) => emailMap.set(e.id, e.email));
    }

    const merged = rows.map((r: any) => ({
      ...r,
      profiles: {
        ...(r.profiles || {}),
        email: emailMap.get(r.provider_id) || r.profiles?.email || null,
      },
    }));

    setSubs(merged);
    setLoading(false);
  };

  useEffect(() => { fetchSubs(); }, []);

  const updateStatus = async (subId: string, providerId: string, status: string) => {
    const adminUser = (await supabase.auth.getUser()).data.user;
    const updates: any = { status };
    if (status === "active") {
      updates.approved_by = adminUser?.id;
      updates.approved_at = new Date().toISOString();
      updates.status = "active";

      const now = new Date();
      const sub = subs.find((item) => item.id === subId);
      const cycleStart = sub?.status === "active" && sub?.end && new Date(sub.end) > now
        ? new Date(sub.end)
        : now;
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);

      updates.start_date = cycleStart.toISOString();
      updates.end_date = cycleEnd.toISOString();
      updates.renewal_date = cycleEnd.toISOString();
    }

    const { error } = await supabase
      .from("provider_subscriptions")
      .update(updates)
      .eq("id", subId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("subscription_audit_logs").insert({
      subscription_id: subId,
      admin_id: adminUser?.id,
      action: `Status changed to ${status}`,
    });

    await supabase.from("admin_logs").insert({
      admin_id: adminUser?.id,
      action: `Subscription ${status}`,
      target_id: subId,
      target_type: "subscription",
    });

    toast({ title: `Subscription ${status}` });
    fetchSubs();
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": case "pending_approval": case "under_review": return "secondary";
      case "expired": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
        <p className="text-sm text-muted-foreground">Review and manage provider subscriptions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Cycle</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      <div>{(sub.profiles as any)?.full_name || "—"}</div>
                      {(sub.profiles as any)?.email && (
                        <div className="text-xs text-muted-foreground font-normal">
                          {(sub.profiles as any).email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{sub.subscription_plans?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
                    </TableCell>
                     <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                       {sub.end ? new Date(sub.end).toLocaleDateString() : (sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—")}
                     </TableCell>
                    <TableCell>
                      {sub.receipt_url ? (
                        <a
                          href={sub.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline"
                        >
                          View
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {sub.status !== "active" && (
                          <Button size="sm" onClick={() => updateStatus(sub.id, sub.provider_id, "active")}>
                            {sub.status === "expired" ? "Renew" : "Approve"}
                          </Button>
                        )}
                        {sub.status !== "rejected" && sub.status !== "active" && (
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(sub.id, sub.provider_id, "cancelled")}>
                            Reject
                          </Button>
                        )}
                        {(sub.status === "pending") && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(sub.id, sub.provider_id, "pending")}>
                            Mark Under Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
