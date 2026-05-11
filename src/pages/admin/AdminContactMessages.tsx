import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Mail, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Msg = {
  id: string; full_name: string; email: string; subject: string; message: string;
  ip_address: string | null; is_read: boolean; created_at: string;
};

export default function AdminContactMessages() {
  const [items, setItems] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Msg | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openMessage = async (m: Msg) => {
    setSelected(m);
    if (!m.is_read) {
      await supabase.from("contact_messages" as any).update({ is_read: true }).eq("id", m.id);
      setItems((prev) => prev.map((i) => (i.id === m.id ? { ...i, is_read: true } : i)));
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages" as any).delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  };

  const filtered = items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.full_name?.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q) ||
      i.subject?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">Messages submitted through the public contact form.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{filtered.length} {filtered.length === 1 ? "message" : "messages"}</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No messages yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className={m.is_read ? "" : "bg-accent/40"}>
                    <TableCell>{m.is_read ? null : <Badge>New</Badge>}</TableCell>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a>
                    </TableCell>
                    <TableCell>{m.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openMessage(m)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMessage(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.subject}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <p><b>From:</b> {selected.full_name} &lt;<a className="text-primary" href={`mailto:${selected.email}`}>{selected.email}</a>&gt;</p>
                <p><b>Submitted:</b> {new Date(selected.created_at).toLocaleString()}</p>
                {selected.ip_address && <p className="text-xs text-muted-foreground"><b>IP:</b> {selected.ip_address}</p>}
                <div className="pt-2 border-t border-border">
                  <p className="whitespace-pre-wrap text-foreground bg-muted/40 rounded-lg p-3">{selected.message}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button asChild><a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}><Mail className="h-4 w-4 mr-2" /> Reply</a></Button>
                  <Button variant="destructive" onClick={() => deleteMessage(selected.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
