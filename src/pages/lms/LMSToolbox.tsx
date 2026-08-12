/**
 * LMSToolbox — Toolbox Talk Library
 *
 * Displays the full library of pre-built OSHA Toolbox Talk templates
 * alongside any company-specific custom talks. Admins can browse, filter,
 * duplicate a library template to customize it, or create a new talk from scratch.
 *
 * Color scheme: cobalt #0047AB, bright blue #1E90FF, dark navy #0F1C2E
 */

import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  HardHat,
  Search,
  Plus,
  Filter,
  BookOpen,
  Clock,
  ChevronRight,
  Copy,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Shield,
  Zap,
  Flame,
  Waves,
  Wind,
  Eye,
  FileText,
  BarChart3,
} from "lucide-react";
import { LMSLayout } from "./LMSLayout";
import { useLMS } from "./LMSContext";
import { toast } from "sonner";
import { toolboxTalksStore, addToolboxTalk, removeToolboxTalk, type MockToolboxTalk } from "./mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── OSHA Topic Metadata ──────────────────────────────────────────────────────

const TOPIC_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  fall_protection:        { label: "Fall Protection",          icon: Shield,    color: "bg-red-100 text-red-700" },
  scaffolding:            { label: "Scaffolding",              icon: HardHat,   color: "bg-orange-100 text-orange-700" },
  excavation:             { label: "Excavation & Trenching",   icon: HardHat,   color: "bg-yellow-100 text-yellow-700" },
  electrical:             { label: "Electrical Safety",        icon: Zap,       color: "bg-yellow-100 text-yellow-800" },
  confined_space:         { label: "Confined Space Entry",     icon: AlertCircle, color: "bg-red-100 text-red-700" },
  lockout_tagout:         { label: "Lockout/Tagout (LOTO)",    icon: Shield,    color: "bg-blue-100 text-blue-700" },
  ppe:                    { label: "PPE",                      icon: HardHat,   color: "bg-green-100 text-green-700" },
  hazcom:                 { label: "Hazard Communication",     icon: AlertCircle, color: "bg-orange-100 text-orange-700" },
  fire_prevention:        { label: "Fire Prevention",          icon: Flame,     color: "bg-red-100 text-red-700" },
  heat_illness:           { label: "Heat Illness Prevention",  icon: Flame,     color: "bg-orange-100 text-orange-700" },
  struck_by:              { label: "Struck-By Hazards",        icon: AlertCircle, color: "bg-red-100 text-red-700" },
  caught_in_between:      { label: "Caught-In/Between",        icon: AlertCircle, color: "bg-red-100 text-red-700" },
  hand_power_tools:       { label: "Hand & Power Tools",       icon: HardHat,   color: "bg-gray-100 text-gray-700" },
  ladders:                { label: "Ladder Safety",            icon: Shield,    color: "bg-blue-100 text-blue-700" },
  rigging_lifting:        { label: "Rigging & Lifting",        icon: HardHat,   color: "bg-purple-100 text-purple-700" },
  crane_safety:           { label: "Crane Safety",             icon: HardHat,   color: "bg-purple-100 text-purple-700" },
  first_aid:              { label: "First Aid & CPR",          icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  emergency_action:       { label: "Emergency Action Plans",   icon: AlertCircle, color: "bg-red-100 text-red-700" },
  housekeeping:           { label: "Housekeeping & Slips",     icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  respiratory:            { label: "Respiratory Protection",   icon: Wind,      color: "bg-blue-100 text-blue-700" },
  noise:                  { label: "Noise & Hearing Conservation", icon: Eye,   color: "bg-indigo-100 text-indigo-700" },
  silica:                 { label: "Silica Dust Exposure",     icon: Wind,      color: "bg-gray-100 text-gray-700" },
  asbestos:               { label: "Asbestos Awareness",       icon: AlertCircle, color: "bg-orange-100 text-orange-700" },
  lead:                   { label: "Lead Exposure",            icon: AlertCircle, color: "bg-yellow-100 text-yellow-700" },
  bloodborne:             { label: "Bloodborne Pathogens",     icon: Shield,    color: "bg-red-100 text-red-700" },
  maritime_confined:      { label: "Maritime Confined Spaces", icon: Waves,     color: "bg-cyan-100 text-cyan-700" },
  maritime_hot_work:      { label: "Maritime Hot Work",        icon: Flame,     color: "bg-orange-100 text-orange-700" },
  maritime_ppe:           { label: "Maritime PPE & Life Safety", icon: Waves,   color: "bg-cyan-100 text-cyan-700" },
  forklift:               { label: "Forklift & Powered Industrial Trucks", icon: HardHat, color: "bg-yellow-100 text-yellow-700" },
  back_safety:            { label: "Back Safety & Ergonomics", icon: Users,     color: "bg-green-100 text-green-700" },
  drug_alcohol:           { label: "Drug & Alcohol Policy",    icon: Shield,    color: "bg-purple-100 text-purple-700" },
  violence_prevention:    { label: "Workplace Violence Prevention", icon: Shield, color: "bg-red-100 text-red-700" },
  custom:                 { label: "Custom Topic",             icon: FileText,  color: "bg-gray-100 text-gray-600" },
};

const INDUSTRY_LABELS: Record<string, string> = {
  all: "All Industries",
  construction: "Construction",
  maritime: "Maritime",
  general_industry: "General Industry",
  electrical: "Electrical",
  utilities: "Utilities",
  oil_gas: "Oil & Gas",
};

// ─── Toolbox Talk Card ────────────────────────────────────────────────────────

interface TalkCardProps {
  talk: {
    id: number;
    title: string;
    topic: string;
    industry: string;
    source: string;
    estimatedMinutes: number;
    regulatoryRef?: string | null;
    requiresSignoff: boolean;
    companyId?: number | null;
  };
  isAdmin: boolean;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onDeliver: (id: number) => void;
}

function TalkCard({ talk, isAdmin, onEdit, onDuplicate, onDelete, onDeliver }: TalkCardProps) {
  const meta = TOPIC_META[talk.topic] ?? TOPIC_META.custom;
  const Icon = meta.icon;
  const isLibrary = talk.source === "library";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", meta.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{talk.title}</h3>
            {isLibrary && (
              <Badge variant="secondary" className="text-[10px] bg-[#0047AB]/10 text-[#0047AB] border-0 font-semibold">
                OSHA Library
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", meta.color)}>
              {meta.label}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              {INDUSTRY_LABELS[talk.industry] ?? talk.industry}
            </span>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {talk.estimatedMinutes} min
        </span>
        {talk.regulatoryRef && (
          <span className="flex items-center gap-1 font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
            {talk.regulatoryRef}
          </span>
        )}
        {talk.requiresSignoff && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sign-off required
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <Button
          size="sm"
          className="flex-1 bg-[#0047AB] hover:bg-[#1565C0] text-white text-xs h-8"
          onClick={() => onDeliver(talk.id)}
        >
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Deliver Talk
        </Button>
        {isAdmin && (
          <>
            {isLibrary ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-gray-200 text-gray-600 hover:text-[#0047AB]"
                onClick={() => onDuplicate(talk.id)}
                title="Duplicate to customize"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-gray-200 text-gray-600 hover:text-[#0047AB]"
                  onClick={() => onEdit(talk.id)}
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-gray-200 text-red-400 hover:text-red-600 hover:border-red-300"
                  onClick={() => onDelete(talk.id)}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LMSToolbox() {
  const { role, setRole } = useLMS();
  const [, navigate] = useLocation();
  const isAdmin = role === "platform-admin" || role === "client-admin";

  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterSource, setFilterSource] = useState<"all" | "library" | "custom">("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [talks, setTalks] = useState<MockToolboxTalk[]>(toolboxTalksStore);
  const isLoading = false;

  const duplicateMutation = {
    mutate: ({ id }: { id: number }) => {
      const source = talks.find((t) => t.id === id);
      if (!source) return;
      const copy = addToolboxTalk({ ...source, title: `${source.title} (Copy)`, source: "custom", companyId: 1 });
      setTalks(toolboxTalksStore);
      toast.success("Talk duplicated — you can now customize it.");
      navigate(`/lms/toolbox/builder/${copy.id}`);
    },
  };

  const deleteMutation = {
    mutate: ({ id }: { id: number }) => {
      removeToolboxTalk(id);
      setTalks(toolboxTalksStore);
      toast.success("Talk deleted.");
      setDeleteId(null);
    },
  };

  const filtered = useMemo(() => {
    return talks.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        (TOPIC_META[t.topic]?.label ?? "").toLowerCase().includes(search.toLowerCase());
      const matchIndustry = filterIndustry === "all" || t.industry === filterIndustry || t.industry === "all";
      const matchSource = filterSource === "all" || t.source === filterSource;
      return matchSearch && matchIndustry && matchSource;
    });
  }, [talks, search, filterIndustry, filterSource]);

  const libraryCount = talks.filter(t => t.source === "library").length;
  const customCount = talks.filter(t => t.source === "custom").length;

  return (
    <LMSLayout
      title="Toolbox Talks"
      role={role}
      onRoleChange={setRole}
      breadcrumbs={[{ label: "Toolbox Talks" }]}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <HardHat className="w-5 h-5 text-[#0047AB]" />
              <h1 className="text-xl font-bold text-white">Toolbox Talk Library</h1>
            </div>
            <p className="text-sm text-white/60">
              Pre-built OSHA briefings ready to deliver. Duplicate any template to customize it for your crew.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link href="/lms/toolbox/sessions">
                <Button variant="outline" className="text-sm border-white/20 text-white/70 hover:bg-white/10 hover:text-white">
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Session History
                </Button>
              </Link>
              <Link href="/lms/toolbox/builder/new">
                <Button className="bg-[#0047AB] hover:bg-[#1565C0] text-white text-sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Talk
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "OSHA Templates", value: libraryCount, icon: BookOpen, color: "text-[#0047AB]", bg: "bg-[#0047AB]/8" },
            { label: "Custom Talks", value: customCount, icon: FileText, color: "text-[#1E90FF]", bg: "bg-[#1E90FF]/8" },
            { label: "Total Available", value: talks.length, icon: HardHat, color: "text-gray-700", bg: "bg-gray-100" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("w-4.5 h-4.5", color)} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search talks by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30"
            >
              {Object.entries(INDUSTRY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as "all" | "library" | "custom")}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30"
            >
              <option value="all">All Sources</option>
              <option value="library">OSHA Library</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Talk Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#0047AB]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
            <HardHat className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No talks match your filters.</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-sm text-[#0047AB] hover:underline"
              >
                Clear search
              </button>
            )}
            {isAdmin && (
              <div className="mt-4">
                <Link href="/lms/toolbox/builder/new">
                  <Button className="bg-[#0047AB] hover:bg-[#1565C0] text-white text-sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create a Custom Talk
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Library section */}
            {filtered.some(t => t.source === "library") && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-[#0047AB]" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">OSHA Library Templates</h2>
                  <span className="text-xs text-gray-400">— Duplicate to customize</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.filter(t => t.source === "library").map(talk => (
                    <TalkCard
                      key={talk.id}
                      talk={talk}
                      isAdmin={isAdmin}
                      onEdit={(id) => navigate(`/lms/toolbox/builder/${id}`)}
                      onDuplicate={(id) => duplicateMutation.mutate({ id })}
                      onDelete={(id) => setDeleteId(id)}
                      onDeliver={(id) => navigate(`/lms/toolbox/deliver/${id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Custom section */}
            {filtered.some(t => t.source === "custom") && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#1E90FF]" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Custom Talks</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.filter(t => t.source === "custom").map(talk => (
                    <TalkCard
                      key={talk.id}
                      talk={talk}
                      isAdmin={isAdmin}
                      onEdit={(id) => navigate(`/lms/toolbox/builder/${id}`)}
                      onDuplicate={(id) => duplicateMutation.mutate({ id })}
                      onDelete={(id) => setDeleteId(id)}
                      onDeliver={(id) => navigate(`/lms/toolbox/deliver/${id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Toolbox Talk?</AlertDialogTitle>
            <AlertDialogDescription>
              This talk will be removed from your library. Any past session records will be preserved.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LMSLayout>
  );
}
