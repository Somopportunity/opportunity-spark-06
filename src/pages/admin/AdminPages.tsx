import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, FileText, Shield } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { title } from "process";

interface SitePage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
}

export default function AdminPages() {
  const { user } = useAuth();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from("site_pages")
      .select("*")
      .in("slug", ["terms", "privacy"])
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setPages(data as SitePage[]);
      const d: Record<string, string> = { terms: "", privacy: "" };
      data.forEach((p: any) => { d[p.slug] = p.content || ""; });
      setDrafts(d);
    }
    setLoading(false);
  };

  const handleSave = async (slug: string) => {
    setSaving(slug);
    const payload = {
      title: slug === "terms" ? "Terms of Service" : "Privacy Policy",
      content: drafts[slug] || "",
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("site_pages")
      .update({
        slug,
        title: slug === "terms" ? "Terms of Service" : "Privacy Policy",
        content: drafts[slug] || "",
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      } as any)
      .select();

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Page updated successfully" });
      fetchPages();
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const termsPage = pages.find(p => p.slug === "terms");
  const privacyPage = pages.find(p => p.slug === "privacy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Pages</h1>
        <p className="text-sm text-muted-foreground">Edit Terms of Service and Privacy Policy</p>
      </div>

      <Tabs defaultValue="terms">
        <TabsList>
          <TabsTrigger value="terms" className="gap-2">
            <FileText size={14} /> Terms of Service
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield size={14} /> Privacy Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={drafts["terms"] || ""}
                onChange={(html) => setDrafts(prev => ({ ...prev, terms: html }))}
                placeholder="Enter your Terms of Service content..."
                minHeight="400px"
              />
              <div className="flex justify-end">
                <Button onClick={() => handleSave("terms")} disabled={saving === "terms"} className="gap-2">
                  <Save size={16} />
                  {saving === "terms" ? "Saving…" : "Save Terms"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={drafts["privacy"] || ""}
                onChange={(html) => setDrafts(prev => ({ ...prev, privacy: html }))}
                placeholder="Enter your Privacy Policy content..."
                minHeight="400px"
              />
              <div className="flex justify-end">
                <Button onClick={() => handleSave("privacy")} disabled={saving === "privacy"} className="gap-2">
                  <Save size={16} />
                  {saving === "privacy" ? "Saving…" : "Save Privacy Policy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
