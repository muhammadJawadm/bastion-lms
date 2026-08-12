/**
 * LMSToolboxDeliver — Toolbox Talk Delivery & Sign-off
 *
 * Two-tab page:
 *   Tab 1: Presenter View — full briefing content displayed for the safety manager
 *   Tab 2: Sign-off Sheet — crew members enter name/signature, session is recorded
 *
 * Route: /lms/toolbox/deliver/:id
 * Color scheme: cobalt #0047AB, bright blue #1E90FF, dark navy #0F1C2E
 */

import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  HardHat,
  ArrowLeft,
  Clock,
  Shield,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Play,
  StopCircle,
  Download,
  AlertCircle,
  User,
  PenLine,
} from "lucide-react";
import { LMSLayout } from "./LMSLayout";
import { useLMS } from "./LMSContext";
import { toast } from "sonner";
import { getToolboxTalk, addToolboxSession, updateToolboxSession, toolboxSessionsStore } from "./mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── Topic Meta (same as library page) ───────────────────────────────────────

const TOPIC_META: Record<string, { label: string; color: string }> = {
  fall_protection:     { label: "Fall Protection",            color: "bg-red-100 text-red-700" },
  scaffolding:         { label: "Scaffolding",                color: "bg-orange-100 text-orange-700" },
  excavation:          { label: "Excavation & Trenching",     color: "bg-yellow-100 text-yellow-700" },
  electrical:          { label: "Electrical Safety",          color: "bg-yellow-100 text-yellow-800" },
  confined_space:      { label: "Confined Space Entry",       color: "bg-red-100 text-red-700" },
  lockout_tagout:      { label: "Lockout/Tagout (LOTO)",      color: "bg-blue-100 text-blue-700" },
  ppe:                 { label: "PPE",                        color: "bg-green-100 text-green-700" },
  hazcom:              { label: "Hazard Communication",       color: "bg-orange-100 text-orange-700" },
  fire_prevention:     { label: "Fire Prevention",            color: "bg-red-100 text-red-700" },
  heat_illness:        { label: "Heat Illness Prevention",    color: "bg-orange-100 text-orange-700" },
  struck_by:           { label: "Struck-By Hazards",          color: "bg-red-100 text-red-700" },
  caught_in_between:   { label: "Caught-In/Between",          color: "bg-red-100 text-red-700" },
  hand_power_tools:    { label: "Hand & Power Tools",         color: "bg-gray-100 text-gray-700" },
  ladders:             { label: "Ladder Safety",              color: "bg-blue-100 text-blue-700" },
  rigging_lifting:     { label: "Rigging & Lifting",          color: "bg-purple-100 text-purple-700" },
  crane_safety:        { label: "Crane Safety",               color: "bg-purple-100 text-purple-700" },
  first_aid:           { label: "First Aid & CPR",            color: "bg-green-100 text-green-700" },
  emergency_action:    { label: "Emergency Action Plans",     color: "bg-red-100 text-red-700" },
  housekeeping:        { label: "Housekeeping & Slips",       color: "bg-green-100 text-green-700" },
  respiratory:         { label: "Respiratory Protection",     color: "bg-blue-100 text-blue-700" },
  noise:               { label: "Noise & Hearing Conservation", color: "bg-indigo-100 text-indigo-700" },
  silica:              { label: "Silica Dust Exposure",       color: "bg-gray-100 text-gray-700" },
  asbestos:            { label: "Asbestos Awareness",         color: "bg-orange-100 text-orange-700" },
  lead:                { label: "Lead Exposure",              color: "bg-yellow-100 text-yellow-700" },
  bloodborne:          { label: "Bloodborne Pathogens",       color: "bg-red-100 text-red-700" },
  maritime_confined:   { label: "Maritime Confined Spaces",   color: "bg-cyan-100 text-cyan-700" },
  maritime_hot_work:   { label: "Maritime Hot Work",          color: "bg-orange-100 text-orange-700" },
  maritime_ppe:        { label: "Maritime PPE & Life Safety", color: "bg-cyan-100 text-cyan-700" },
  forklift:            { label: "Forklift & PITs",            color: "bg-yellow-100 text-yellow-700" },
  back_safety:         { label: "Back Safety & Ergonomics",   color: "bg-green-100 text-green-700" },
  drug_alcohol:        { label: "Drug & Alcohol Policy",      color: "bg-purple-100 text-purple-700" },
  violence_prevention: { label: "Workplace Violence Prevention", color: "bg-red-100 text-red-700" },
  custom:              { label: "Custom Topic",               color: "bg-gray-100 text-gray-600" },
};

// ─── Sign-off Row ─────────────────────────────────────────────────────────────

interface SignoffEntry {
  name: string;
  signature: string;
  jobTitle: string;
}

function SignoffRow({
  entry,
  index,
  onChange,
  onRemove,
  disabled,
}: {
  entry: SignoffEntry;
  index: number;
  onChange: (field: keyof SignoffEntry, val: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100 last:border-0">
      <div className="col-span-1 text-center text-xs text-gray-400 font-semibold">{index + 1}</div>
      <div className="col-span-4">
        <Input
          value={entry.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Full name"
          className="text-sm border-gray-200 h-8"
          disabled={disabled}
        />
      </div>
      <div className="col-span-3">
        <Input
          value={entry.jobTitle}
          onChange={(e) => onChange("jobTitle", e.target.value)}
          placeholder="Job title"
          className="text-sm border-gray-200 h-8"
          disabled={disabled}
        />
      </div>
      <div className="col-span-3">
        <Input
          value={entry.signature}
          onChange={(e) => onChange("signature", e.target.value)}
          placeholder="Type name to sign"
          className="text-sm border-gray-200 h-8 italic"
          disabled={disabled}
        />
      </div>
      <div className="col-span-1 flex justify-center">
        {!disabled && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Session History Row ──────────────────────────────────────────────────────

function SessionRow({ session }: {
  session: {
    id: number;
    location: string | null;
    conductedBy: string | null;
    notes: string | null;
    talkId: number;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    signoffs: { name: string; signature: string; jobTitle: string }[];
  };
}) {
  const date = new Date(session.startedAt);
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
      <div className="w-9 h-9 rounded-lg bg-[#0047AB]/10 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-[#0047AB]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">
          {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
          {session.location && <span>📍 {session.location}</span>}
          <span>{session.signoffs.length} sign-off{session.signoffs.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <Users className="w-4 h-4 text-gray-400" />
        Session #{session.id}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "present" | "signoff" | "history";

export default function LMSToolboxDeliver() {
  const { role, setRole } = useLMS();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState<Tab>("present");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [conductedBy, setConductedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [signoffs, setSignoffs] = useState<SignoffEntry[]>([
    { name: "", signature: "", jobTitle: "" },
    { name: "", signature: "", jobTitle: "" },
    { name: "", signature: "", jobTitle: "" },
  ]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const talk = params.id ? getToolboxTalk(Number(params.id)) : undefined;
  const isLoading = false;

  const [sessions, setSessions] = useState(() => toolboxSessionsStore.filter((s) => s.talkId === Number(params.id)));

  const startSessionMutation = {
    isPending: false,
    mutate: (input: { talkId: number; location?: string; conductedBy?: string; notes?: string }) => {
      const created = addToolboxSession({
        talkId: input.talkId,
        location: input.location ?? null,
        conductedBy: input.conductedBy ?? null,
        notes: input.notes ?? null,
        status: "in_progress",
        startedAt: new Date(),
        completedAt: null,
        signoffs: [],
      });
      setSessionId(created.id);
      setSessionStarted(true);
      setActiveTab("signoff");
      toast.success("Session started — collect signatures below.");
    },
  };

  const completeSessionMutation = {
    isPending: false,
    mutate: (input: { sessionId: number; signoffs: SignoffEntry[] }) => {
      updateToolboxSession(input.sessionId, { status: "completed", completedAt: new Date(), signoffs: input.signoffs });
      setSessions(toolboxSessionsStore.filter((s) => s.talkId === Number(params.id)));
      setSessionComplete(true);
      toast.success("Session completed and recorded.");
    },
  };

  const handleStartSession = () => {
    startSessionMutation.mutate({
      talkId: Number(params.id),
      location: location || undefined,
      conductedBy: conductedBy || undefined,
      notes: notes || undefined,
    });
  };

  const handleCompleteSession = () => {
    if (!sessionId) return;
    const validSignoffs = signoffs.filter(s => s.name.trim() && s.signature.trim());
    if (validSignoffs.length === 0) {
      toast.error("At least one signed attendee is required to complete the session.");
      return;
    }
    completeSessionMutation.mutate({
      sessionId,
      signoffs: validSignoffs,
    });
  };

  const addSignoffRow = () => {
    setSignoffs(prev => [...prev, { name: "", signature: "", jobTitle: "" }]);
  };

  const removeSignoffRow = (i: number) => {
    setSignoffs(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateSignoffRow = (i: number, field: keyof SignoffEntry, val: string) => {
    setSignoffs(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: val };
      return updated;
    });
  };

  const topicMeta = talk ? (TOPIC_META[talk.topic] ?? TOPIC_META.custom) : null;
  const validSignoffCount = signoffs.filter(s => s.name.trim() && s.signature.trim()).length;

  if (isLoading) {
    return (
      <LMSLayout title="Deliver Talk" role={role} onRoleChange={setRole}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#0047AB]" />
        </div>
      </LMSLayout>
    );
  }

  if (!talk) {
    return (
      <LMSLayout title="Deliver Talk" role={role} onRoleChange={setRole}>
        <div className="flex items-center justify-center h-64 flex-col gap-3">
          <AlertCircle className="w-8 h-8 text-gray-300" />
          <p className="text-gray-500">Talk not found.</p>
          <Button variant="outline" onClick={() => navigate("/lms/toolbox")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Library
          </Button>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout
      title="Deliver Talk"
      role={role}
      onRoleChange={setRole}
      breadcrumbs={[
        { label: "Toolbox Talks", href: "/lms/toolbox" },
        { label: talk.title },
      ]}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate("/lms/toolbox")}
                className="mt-0.5 text-gray-400 hover:text-[#0047AB] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-gray-900">{talk.title}</h1>
                  {topicMeta && (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", topicMeta.color)}>
                      {topicMeta.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {talk.estimatedMinutes} min
                  </span>
                  {talk.regulatoryRef && (
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{talk.regulatoryRef}</span>
                  )}
                  {talk.requiresSignoff && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sign-off required
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Session status */}
            {sessionComplete ? (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Session Complete
              </Badge>
            ) : sessionStarted ? (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-semibold animate-pulse">
                <Play className="w-3.5 h-3.5 mr-1" />
                Session In Progress
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6 flex-shrink-0">
          {([
            { id: "present" as Tab, label: "Briefing Content", icon: FileText },
            { id: "signoff" as Tab, label: "Sign-off Sheet", icon: PenLine },
            { id: "history" as Tab, label: `Session History (${sessions.length})`, icon: Users },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                  ? "border-[#0047AB] text-[#0047AB]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Tab: Briefing Content ── */}
          {activeTab === "present" && (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              {/* Session Setup */}
              {!sessionStarted && (
                <div className="bg-[#0047AB]/5 border border-[#0047AB]/20 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-[#0047AB] mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Start a New Session
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">Location / Job Site</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Building A, Level 3"
                        className="text-sm border-gray-200 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 mb-1 block">Conducted By</Label>
                      <Input
                        value={conductedBy}
                        onChange={(e) => setConductedBy(e.target.value)}
                        placeholder="Presenter name"
                        className="text-sm border-gray-200 h-8"
                      />
                    </div>
                  </div>
                  <Button
                    className="bg-[#0047AB] hover:bg-[#1565C0] text-white text-sm"
                    onClick={handleStartSession}
                    disabled={startSessionMutation.isPending}
                  >
                    {startSessionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-1.5" />
                    )}
                    Start Session
                  </Button>
                </div>
              )}

              {/* Briefing Content */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div
                  className="prose prose-sm max-w-none text-gray-800 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0F1C2E] [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-semibold [&_p]:mb-3 [&_p]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: talk.content }}
                />
              </div>

              {/* Key Points */}
              {talk.keyPoints && Array.isArray(talk.keyPoints) && (talk.keyPoints as string[]).length > 0 && (
                <div className="bg-[#0F1C2E] rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    Key Takeaway Points
                  </h3>
                  <ul className="space-y-2">
                    {(talk.keyPoints as string[]).map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                        <span className="w-5 h-5 rounded-full bg-[#1E90FF]/20 text-[#1E90FF] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {String(point)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Sign-off Sheet ── */}
          {activeTab === "signoff" && (
            <div className="max-w-4xl mx-auto p-6 space-y-5">
              {!sessionStarted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-sm text-yellow-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  Start a session from the Briefing Content tab before collecting signatures.
                </div>
              )}

              {sessionComplete && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-sm text-green-800">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  This session has been completed and recorded with {validSignoffCount} attendee{validSignoffCount !== 1 ? "s" : ""}.
                </div>
              )}

              {/* Sign-off Header */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Toolbox Talk Sign-off Sheet</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {talk.title} — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {location && <div>📍 {location}</div>}
                    {conductedBy && <div>Presenter: {conductedBy}</div>}
                  </div>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                  <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase">#</div>
                  <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase">Full Name</div>
                  <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase">Job Title</div>
                  <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase">Signature</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Sign-off Rows */}
                <div>
                  {signoffs.map((entry, i) => (
                    <SignoffRow
                      key={i}
                      entry={entry}
                      index={i}
                      onChange={(field, val) => updateSignoffRow(i, field, val)}
                      onRemove={() => removeSignoffRow(i)}
                      disabled={!sessionStarted || sessionComplete}
                    />
                  ))}
                </div>

                {/* Add Row */}
                {sessionStarted && !sessionComplete && (
                  <button
                    onClick={addSignoffRow}
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#0047AB] hover:text-[#1565C0] font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Add Attendee
                  </button>
                )}
              </div>

              {/* Notes */}
              {sessionStarted && !sessionComplete && (
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Session Notes (optional)</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations, hazards identified, corrective actions taken..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30"
                  />
                </div>
              )}

              {/* Complete Session Button */}
              {sessionStarted && !sessionComplete && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{validSignoffCount}</span> of {signoffs.length} attendees signed
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    onClick={handleCompleteSession}
                    disabled={completeSessionMutation.isPending || validSignoffCount === 0}
                  >
                    {completeSessionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <StopCircle className="w-4 h-4 mr-1.5" />
                    )}
                    Complete & Record Session
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Session History ── */}
          {activeTab === "history" && (
            <div className="max-w-3xl mx-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Session History</h2>
                <div className="text-sm text-gray-500">
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No sessions recorded yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Deliver this talk to a crew and complete the sign-off sheet to create a record.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {sessions.map(session => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </LMSLayout>
  );
}
