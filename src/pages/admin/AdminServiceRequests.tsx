import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Building2, Calendar, Eye, Search } from "lucide-react";

type ServiceRequest = {
  id: string;
  created_at: string;
  service_type: "hire_talent" | "technical_writing";
  full_name: string;
  email: string;
  phone: string | null;
  organization_name: string | null;
  organization_type?: string | null;
  position_to_hire?: string | null;
  preferred_demo_method?: string | null;
  project_type?: string | null;
  description?: string | null;
  deadline?: string | null;
  message?: string | null;
};

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "hire_talent" | "technical_writing">("all");
  const [selected, setSelected] = useState<ServiceRequest | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: hire }, { data: tw }] = await Promise.all([
      supabase.from("demo_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("technical_writing_requests" as any).select("*").order("created_at", { ascending: false }),
    ]);

    const hireMapped: ServiceRequest[] = (hire || []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      service_type: "hire_talent",
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      organization_name: r.organization_name,
      organization_type: r.organization_type,
      position_to_hire: r.position_to_hire,
      preferred_demo_method: r.preferred_demo_method,
      message: r.message,
    }));

    const twMapped: ServiceRequest[] = (tw || []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      service_type: "technical_writing",
      full_name: r.full_name,
      email: r.email,
      phone: null,
      organization_name: r.organization_name,
      project_type: r.project_type,
      description: r.description,
      deadline: r.deadline,
    }));

    const merged = [...hireMapped, ...twMapped].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRequests(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = requests.filter((r) => {
    if (tab !== "all" && r.service_type !== tab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.organization_name?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  });

  const serviceLabel = (t: string) =>
    t === "hire_talent" ? "Hire Talent" : "Technical Writing";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Service Requests</h1>
        <p className="text-sm text-muted-foreground">
          All requests submitted via Hire Talent and Technical Writing forms.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{filtered.length} {filtered.length === 1 ? "request" : "requests"}</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, org…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="hire_talent">Hire Talent</TabsTrigger>
              <TabsTrigger value="technical_writing">Technical Writing</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} />
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No service requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={`${r.service_type}-${r.id}`}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                        {r.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.phone || "—"}</TableCell>
                    <TableCell className="text-sm">{r.organization_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.service_type === "hire_talent" ? "default" : "secondary"}>
                        {serviceLabel(r.service_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.full_name}
                  <Badge variant={selected.service_type === "hire_talent" ? "default" : "secondary"}>
                    {serviceLabel(selected.service_type)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow icon={Mail} label="Email" value={selected.email} link={`mailto:${selected.email}`} />
                  <InfoRow icon={Phone} label="Phone" value={selected.phone || "—"} />
                  <InfoRow icon={Building2} label="Organization" value={selected.organization_name || "—"} />
                  <InfoRow
                    icon={Calendar}
                    label="Submitted"
                    value={new Date(selected.created_at).toLocaleString()}
                  />
                </div>

                {selected.service_type === "hire_talent" && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <Field label="Organization Type" value={selected.organization_type} />
                    <Field label="Position to Hire" value={selected.position_to_hire} />
                    <Field label="Preferred Demo" value={selected.preferred_demo_method} />
                  </div>
                )}

                {selected.service_type === "technical_writing" && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <Field label="Project Type" value={selected.project_type} />
                    <Field
                      label="Deadline"
                      value={selected.deadline ? new Date(selected.deadline).toLocaleDateString() : "—"}
                    />
                  </div>
                )}

                {(selected.message || selected.description) && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {selected.service_type === "hire_talent" ? "Message" : "Description"}
                    </p>
                    <p className="whitespace-pre-wrap text-foreground bg-muted/40 rounded-lg p-3">
                      {selected.message || selected.description}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: any;
  label: string;
  value: string;
  link?: string;
}) {
  const content = link ? (
    <a href={link} className="text-primary hover:underline break-all">
      {value}
    </a>
  ) : (
    <span className="text-foreground break-all">{value}</span>
  );
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {content}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground capitalize">{value?.replace(/_/g, " ") || "—"}</p>
    </div>
  );
}
