import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserPlus, Trash2 } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "viewer", full_name: "" });
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as any })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("admin_logs").insert({
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      action: `Changed role to ${newRole}`,
      target_id: userId,
      target_type: "user",
    });

    toast({ title: "Role updated" });
    fetchUsers();
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    if (newUser.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // Use a separate Supabase client so the admin's session is NOT replaced
      const { createClient } = await import("@supabase/supabase-js");
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, storageKey: "admin-create-tmp" } }
      );

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: { data: { full_name: newUser.full_name || "" } },
      });

      if (signUpError || !signUpData.user) {
        toast({ title: "Error", description: signUpError?.message || "Failed to create user", variant: "destructive" });
        setCreating(false);
        return;
      }

      // Sign the temp client out immediately so it does not hold a session
      await tempClient.auth.signOut();

      // Upsert the profile with role + full_name (handles missing profile if trigger didn't fire)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: signUpData.user.id,
            role: newUser.role as any,
            full_name: newUser.full_name || "",
          },
          { onConflict: "id" }
        );

      if (profileError) {
        toast({ title: "User created, but role update failed", description: profileError.message, variant: "destructive" });
      } else {
        toast({ title: "User created successfully" });
      }

      setCreateOpen(false);
      setNewUser({ email: "", password: "", role: "viewer", full_name: "" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "editor": return "default";
      case "viewer": return "secondary";
      case "provider": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage all platform users</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" /> Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="seeker">Seeker</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createUser} className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.country || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.role !== "admin" && (
                          <Select onValueChange={(v) => updateRole(user.id, v)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="seeker">Seeker</SelectItem>
                              <SelectItem value="provider">Provider</SelectItem>
                            </SelectContent>
                          </Select>
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
