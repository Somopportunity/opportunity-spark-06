import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus, MoreHorizontal, Eye, Pencil, Ban, Trash2, Search, Loader2,
} from "lucide-react";

interface UserRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  country: string | null;
  phone: string | null;
  bio: string | null;
  organization_name: string | null;
  organization_type: string | null;
  created_at: string;
  suspended?: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "viewer", full_name: "" });

  // View modal
  const [viewUser, setViewUser] = useState<UserRow | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "", country: "", phone: "", bio: "", organization_name: "", organization_type: "" });
  const [submitting, setSubmitting] = useState(false);

  // Confirm action
  const [confirmAction, setConfirmAction] = useState<{ type: "suspend" | "delete"; user: UserRow } | null>(null);

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

  // ── Create User ──────────────────────────────────────────────────────────────
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

      await tempClient.auth.signOut();

      const { error: profileError } = await supabase.from("profiles").upsert(
        { id: signUpData.user.id, role: newUser.role as any, full_name: newUser.full_name || "" },
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

  // ── Edit User ────────────────────────────────────────────────────────────────
  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || "",
      role: u.role,
      country: u.country || "",
      phone: u.phone || "",
      bio: u.bio || "",
      organization_name: u.organization_name || "",
      organization_type: u.organization_type || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      role: editForm.role as any,
      country: editForm.country,
      phone: editForm.phone,
      bio: editForm.bio,
      organization_name: editForm.organization_name,
      organization_type: editForm.organization_type,
    }).eq("id", editUser.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Log role change
      await supabase.from("admin_logs").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: `Updated user profile (role: ${editForm.role})`,
        target_id: editUser.id,
        target_table: "profiles",
      });
      toast({ title: "User updated successfully" });
      setEditOpen(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  // ── Suspend / Delete ─────────────────────────────────────────────────────────
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setSubmitting(true);
    const { user, type } = confirmAction;
    const adminUser = (await supabase.auth.getUser()).data.user;

    if (type === "suspend") {
      // Mark as suspended via role or a dedicated flag. Here we use a "suspended" role
      // or set suspended = true if your schema supports it.
      // As a safe fallback: update role to "suspended"
      await supabase.from("profiles").update({ role: "suspended" as any }).eq("id", user.id);

      if (user.role === "provider") {
        await supabase.from("provider_subscriptions").update({ status: "suspended" }).eq("provider_id", user.id);
      }

      await supabase.from("admin_logs").insert({
        actor_id: adminUser?.id,
        action: "User suspended",
        target_id: user.id,
        target_table: "profiles",
      });
      toast({ title: "User suspended" });
    } else {
      // Provider-specific cleanup first
      if (user.role === "provider") {
        await supabase.from("provider_subscriptions").delete().eq("provider_id", user.id);
        await supabase.from("opportunities").delete().eq("provider_id", user.id);
      }

      await supabase.from("profiles").delete().eq("id", user.id);

      await supabase.from("admin_logs").insert({
        actor_id: adminUser?.id,
        action: "User deleted",
        target_id: user.id,
        target_table: "profiles",
      });
      toast({ title: "User deleted" });
    }

    setConfirmAction(null);
    setSubmitting(false);
    fetchUsers();
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "editor": return "default";
      case "provider": return "outline";
      case "suspended": return "secondary";
      default: return "secondary";
    }
  };

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.country || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage all platform users</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Search by name, role, or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {initials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{user.id.slice(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.country || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => setViewUser(user)}>
                              <Eye size={14} /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => openEdit(user)}>
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                            {user.role !== "admin" && user.role !== "suspended" && (
                              <DropdownMenuItem
                                className="gap-2 text-amber-600"
                                onClick={() => setConfirmAction({ type: "suspend", user })}
                              >
                                <Ban size={14} /> Suspend
                              </DropdownMenuItem>
                            )}
                            {user.role !== "admin" && (
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => setConfirmAction({ type: "delete", user })}
                              >
                                <Trash2 size={14} /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create User Modal ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="seeker">Seeker</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createUser} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Profile Modal ────────────────────────────────────────────── */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={viewUser.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {initials(viewUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{viewUser.full_name || "Unnamed User"}</p>
                  <Badge variant={roleBadgeVariant(viewUser.role)} className="mt-1">{viewUser.role}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">User ID</p>
                  <p className="font-mono">{viewUser.id.slice(0, 12)}…</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Country</p>
                  <p>{viewUser.country || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Phone</p>
                  <p>{viewUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Joined</p>
                  <p>{new Date(viewUser.created_at).toLocaleDateString()}</p>
                </div>
                {viewUser.role === "provider" && (
                  <>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Organization</p>
                      <p>{viewUser.organization_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Org Type</p>
                      <p className="capitalize">{viewUser.organization_type || "—"}</p>
                    </div>
                  </>
                )}
              </div>
              {viewUser.bio && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-muted-foreground">{viewUser.bio}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
            {viewUser && (
              <Button onClick={() => { openEdit(viewUser); setViewUser(null); }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Modal ───────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="seeker">Seeker</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
            </div>
            {(editUser?.role === "provider" || editForm.role === "provider") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Organization Name</Label>
                  <Input value={editForm.organization_name} onChange={(e) => setEditForm({ ...editForm, organization_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Organization Type</Label>
                  <Select value={editForm.organization_type} onValueChange={(v) => setEditForm({ ...editForm, organization_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Suspend / Delete ──────────────────────────────────────── */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "suspend" ? "Suspend User" : "Delete User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "suspend"
                ? `Are you sure you want to suspend "${confirmAction?.user.full_name || "this user"}"? Their role will be set to suspended and they will lose platform access.`
                : confirmAction?.user.role === "provider"
                  ? `Are you sure you want to delete "${confirmAction?.user.full_name || "this user"}"? As a provider, their subscription and all associated data will also be permanently removed.`
                  : `Are you sure you want to delete "${confirmAction?.user.full_name || "this user"}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction?.type === "suspend" ? "Suspend" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
