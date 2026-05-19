import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Filter, X, Briefcase, ExternalLink } from "lucide-react";
import SaveOpportunityButton from "@/components/SaveOpportunityButton";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

const categoryOptions = ["job", "internship", "scholarship", "fellowship", "grant", "workshop", "conference", "event"];
const workModeOptions = ["remote", "onsite", "hybrid"];

const categoryColors: Record<string, string> = {
  job: "bg-primary/10 text-primary",
  internship: "bg-emerald-100 text-emerald-700",
  scholarship: "bg-amber-100 text-amber-700",
  fellowship: "bg-violet-100 text-violet-700",
  grant: "bg-rose-100 text-rose-700",
  event: "bg-sky-100 text-sky-700",
  workshop: "bg-orange-100 text-orange-700",
  conference: "bg-teal-100 text-teal-700",
};

const workModeColors: Record<string, string> = {
  remote: "bg-emerald-100 text-emerald-700",
  onsite: "bg-muted text-muted-foreground",
  hybrid: "bg-sky-100 text-sky-700",
};

export default function OpportunitiesBrowse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  // Sync URL category param → filter state on mount & param change
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategories([cat]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchOpps = async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*")
        .in("status", ["approved"])
        .order("created_at", { ascending: false });
      setOpps(data || []);
      setLoading(false);
    };
    fetchOpps();
  }, []);

  const filtered = useMemo(() => {
    return opps.filter(o => {
      if (keyword && !o.title?.toLowerCase().includes(keyword.toLowerCase()) && !o.description?.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (locationFilter && !o.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (selectedCategories.length && !selectedCategories.includes(o.category)) return false;
      if (selectedModes.length && !selectedModes.includes(o.work_mode)) return false;
      return true;
    });
  }, [opps, keyword, locationFilter, selectedCategories, selectedModes]);

  const toggleCategory = (c: string) => {
    setSelectedCategories(prev => {
      const next = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
      // Update URL params
      if (next.length === 1) {
        setSearchParams({ category: next[0] });
      } else {
        searchParams.delete("category");
        setSearchParams(searchParams);
      }
      return next;
    });
  };

  const toggleMode = (m: string) => setSelectedModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const clearFilters = () => {
    setKeyword("");
    setLocationFilter("");
    setSelectedCategories([]);
    setSelectedModes([]);
    setSearchParams({});
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">Category</h3>
        <div className="space-y-2">
          {categoryOptions.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedCategories.includes(c)} onCheckedChange={() => toggleCategory(c)} />
              <span className="text-sm capitalize text-foreground">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">Work Mode</h3>
        <div className="space-y-2">
          {workModeOptions.map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedModes.includes(m)} onCheckedChange={() => toggleMode(m)} />
              <span className="text-sm capitalize text-foreground">{m}</span>
            </label>
          ))}
        </div>
      </div>
      {(selectedCategories.length > 0 || selectedModes.length > 0) && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
          <X size={14} className="mr-1" /> Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="hero-gradient py-16 text-center">
        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold text-white md:text-5xl">
            Explore Opportunities
          </motion.h1>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Discover jobs, scholarships, internships, and more from around the world.
          </p>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by keyword..." value={keyword} onChange={e => setKeyword(e.target.value)} className="pl-10 bg-white/90 border-0" />
            </div>
            <div className="relative flex-1">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Location..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="pl-10 bg-white/90 border-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container flex-1 py-10">
        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 glass-card rounded-xl p-5">
              <FilterPanel />
            </div>
          </aside>

          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="btn-gradient rounded-full shadow-lg h-12 w-12 p-0">
                  <Filter size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 pt-10">
                <FilterPanel />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filtered.length} opportunities found</p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Briefcase size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-lg font-semibold">No opportunities found</p>
                  <p className="text-sm">Try adjusting your filters or search terms.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filtered.map((opp, i) => (
                  <motion.div key={opp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="glow-border group cursor-pointer transition-shadow hover:shadow-[var(--card-shadow-hover)]" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                      <CardContent className="p-5 flex flex-col gap-4 group cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            {/* Title with line-clamp to prevent vertical overflow, truncate for horizontal */}
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:truncate">
                              {opp.title}
                            </h3>
                            <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-1">
                              {opp.company && <span className="font-medium text-foreground/80">{opp.company}</span>}
                              {opp.company && <span>•</span>}
                              <span>{opp.location || "Remote"}</span>
                            </p>
                          </div>
                          {/* Keep the Save button at the top right for easy access on mobile */}
                          <div className="shrink-0">
                            <SaveOpportunityButton opportunityId={opp.id} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge className={`${categoryColors[opp.category] || "bg-muted text-muted-foreground"} capitalize`}>
                            {opp.category}
                          </Badge>
                          <Badge className={`${workModeColors[opp.work_mode] || "bg-muted text-muted-foreground"} capitalize`}>
                            {opp.work_mode}
                          </Badge>
                          {opp.stipend_min != null && (
                            <Badge variant="outline" className="text-xs">
                              {opp.currency} {opp.stipend_min.toLocaleString()}
                            </Badge>
                          )}
                          <DeadlineCountdown deadline={opp.deadline} />
                        </div>

                        {/* Action: only View Details by default for a cleaner browse view */}
                        <div className="flex justify-end mt-1">
                          <Button
                            size="sm"
                            className="btn-gradient w-full sm:w-auto"
                            onClick={(e) => { e.stopPropagation(); navigate(`/opportunities/${opp.id}`); }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
