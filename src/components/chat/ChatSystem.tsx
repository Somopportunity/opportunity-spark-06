import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, MessageSquare, ArrowLeft, Search, Inbox } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface PartnerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  partnerId: string;
  partner: PartnerProfile | null;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export default function ChatSystem() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PartnerProfile>>({});
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all messages and partner profiles
  const fetchAll = async () => {
    if (!user) return;
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Could not load messages", variant: "destructive" });
      setLoading(false);
      return;
    }

    setMessages(msgs || []);
    const partnerIds = Array.from(
      new Set((msgs || []).map((m) => (m.sender_id === user.id ? m.recipient_id : m.sender_id)))
    );

    if (partnerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", partnerIds);
      const map: Record<string, PartnerProfile> = {};
      (profs || []).forEach((p) => (map[p.id] = p));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchAll();

    const channel = supabase
      .channel(`chat-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (payload) => handleIncoming(payload.new as Message)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${user.id}` },
        (payload) => handleIncoming(payload.new as Message)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as Message;
          if (updated.sender_id !== user.id && updated.recipient_id !== user.id) return;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const deleted = payload.old as Message;
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleIncoming = async (msg: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    const partnerId = msg.sender_id === user!.id ? msg.recipient_id : msg.sender_id;
    if (!profiles[partnerId]) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, organization_name")
        .eq("id", partnerId)
        .maybeSingle();
      if (data) setProfiles((prev) => ({ ...prev, [partnerId]: data }));
    }
  };

  // Build conversations from messages
  const conversations: Conversation[] = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const conv = map.get(partnerId);
      if (!conv) {
        map.set(partnerId, {
          partnerId,
          partner: profiles[partnerId] || null,
          lastMessage: m,
          unreadCount: !m.read && m.recipient_id === user.id ? 1 : 0,
          messages: [m],
        });
      } else {
        conv.messages.push(m);
        if (new Date(m.created_at) > new Date(conv.lastMessage.created_at)) conv.lastMessage = m;
        if (!m.read && m.recipient_id === user.id) conv.unreadCount += 1;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages, profiles, user]);

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const name = (c.partner?.full_name || "").toLowerCase();
      return name.includes(q) || c.lastMessage.body.toLowerCase().includes(q);
    });
  }, [conversations, search]);

  const activeConv = conversations.find((c) => c.partnerId === activePartnerId) || null;

  // Auto-scroll & mark as read
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (activeConv && user) {
      const unread = activeConv.messages.filter((m) => !m.read && m.recipient_id === user.id);
      if (unread.length > 0) {
        const ids = unread.map((m) => m.id);
        supabase.from("messages").update({ read: true }).in("id", ids).then(() => {
          setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, read: true } : m)));
        });
      }
    }
  }, [activeConv, user]);

  const sendMessage = async () => {
    if (!draft.trim() || !activePartnerId || !user) return;

    setSending(true);
    const messageBody = draft.trim();
    const subject = activeConv?.lastMessage.subject || "Conversation";

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: activePartnerId,
        subject,
        body: messageBody,
      })
      .select("*")
      .single();

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setDraft("");
      handleIncoming(data);
    }

    setSending(false);
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete", variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const deleteConversation = async () => {
    if (!activeConv || !user) return;
    const ids = activeConv.messages.map((m) => m.id);
    const { error } = await supabase.from("messages").delete().in("id", ids);
    if (error) {
      toast({ title: "Could not delete chat", variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      setActivePartnerId(null);
      toast({ title: "Conversation deleted" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
          <MessageSquare size={22} className="text-primary" /> Chat
        </h1>
      </div>

      <Card className="overflow-hidden border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conversation list */}
          <div
            className={cn(
              "border-r border-border/60 flex flex-col bg-card",
              activePartnerId ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground px-4">
                  <Inbox size={32} className="mx-auto mb-2 opacity-40" />
                  No conversations yet.
                </div>
              ) : (
                filteredConvs.map((c) => {
                  const name = c.partner?.full_name || "Unknown user";
                  const isActive = c.partnerId === activePartnerId;
                  return (
                    <button
                      key={c.partnerId}
                      onClick={() => setActivePartnerId(c.partnerId)}
                      className={cn(
                        "w-full text-left px-3 py-3 border-b border-border/40 transition-colors flex items-start gap-3 hover:bg-muted/50",
                        isActive && "bg-primary/5"
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={c.partner?.avatar_url || ""} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">{name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(c.lastMessage.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p
                            className={cn(
                              "text-xs truncate",
                              c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                            )}
                          >
                            {c.lastMessage.sender_id === user!.id ? "You: " : ""}
                            {c.lastMessage.body}
                          </p>
                          {c.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5 shrink-0">
                              {c.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className={cn("flex flex-col bg-background", !activePartnerId && "hidden md:flex")}>
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Select a conversation to start chatting.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-3 border-b border-border/60 bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setActivePartnerId(null)}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={activeConv.partner?.avatar_url || ""} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                      {(activeConv.partner?.full_name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {activeConv.partner?.full_name || "Unknown"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {activeConv.messages.length} message{activeConv.messages.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 size={15} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all messages in this chat. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteConversation} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Messages list */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                  <AnimatePresence initial={false}>
                    {activeConv.messages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((m) => {
                        const mine = m.sender_id === user!.id;
                        return (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn("flex group", mine ? "justify-end" : "justify-start")}
                          >
                            <div className={cn("flex items-end gap-2 max-w-[80%]", mine && "flex-row-reverse")}>
                              <div
                                className={cn(
                                  "rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                                  mine
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-card border border-border/60 text-foreground rounded-bl-md"
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                <p
                                  className={cn(
                                    "text-[10px] mt-1",
                                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}
                                >
                                  {new Date(m.created_at).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMessage(m.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>

                {/* Composer */}
                <div className="p-3 border-t border-border/60 bg-card">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message…"
                      rows={1}
                      className="resize-none min-h-[40px] max-h-32 text-sm"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !draft.trim()}
                      size="icon"
                      className="h-10 w-10 shrink-0"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
