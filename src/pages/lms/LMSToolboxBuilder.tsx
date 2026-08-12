/**
 * LMSToolboxBuilder — Toolbox Talk Editor
 *
 * Simplified two-panel editor for creating and editing Toolbox Talks:
 * - Left: Content editor (title, topic, rich text body, key points)
 * - Right: Settings panel (industry, duration, regulatory ref, sign-off toggle)
 *
 * Route: /lms/toolbox/builder/:id  (id = "new" for creation)
 * Color scheme: cobalt #0047AB, bright blue #1E90FF, dark navy #0F1C2E
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  HardHat,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  ChevronDown,
} from "lucide-react";
import { LMSLayout } from "./LMSLayout";
import { useLMS } from "./LMSContext";
import { toast } from "sonner";
import { addToolboxTalk, updateToolboxTalk, getToolboxTalk } from "./mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ─── Topic Options ────────────────────────────────────────────────────────────

const TOPIC_OPTIONS = [
  { value: "fall_protection",     label: "Fall Protection" },
  { value: "scaffolding",         label: "Scaffolding" },
  { value: "excavation",          label: "Excavation & Trenching" },
  { value: "electrical",          label: "Electrical Safety" },
  { value: "confined_space",      label: "Confined Space Entry" },
  { value: "lockout_tagout",      label: "Lockout/Tagout (LOTO)" },
  { value: "ppe",                 label: "PPE" },
  { value: "hazcom",              label: "Hazard Communication" },
  { value: "fire_prevention",     label: "Fire Prevention" },
  { value: "heat_illness",        label: "Heat Illness Prevention" },
  { value: "struck_by",           label: "Struck-By Hazards" },
  { value: "caught_in_between",   label: "Caught-In/Between" },
  { value: "hand_power_tools",    label: "Hand & Power Tools" },
  { value: "ladders",             label: "Ladder Safety" },
  { value: "rigging_lifting",     label: "Rigging & Lifting" },
  { value: "crane_safety",        label: "Crane Safety" },
  { value: "first_aid",           label: "First Aid & CPR" },
  { value: "emergency_action",    label: "Emergency Action Plans" },
  { value: "housekeeping",        label: "Housekeeping & Slips" },
  { value: "respiratory",         label: "Respiratory Protection" },
  { value: "noise",               label: "Noise & Hearing Conservation" },
  { value: "silica",              label: "Silica Dust Exposure" },
  { value: "asbestos",            label: "Asbestos Awareness" },
  { value: "lead",                label: "Lead Exposure" },
  { value: "bloodborne",          label: "Bloodborne Pathogens" },
  { value: "maritime_confined",   label: "Maritime Confined Spaces" },
  { value: "maritime_hot_work",   label: "Maritime Hot Work" },
  { value: "maritime_ppe",        label: "Maritime PPE & Life Safety" },
  { value: "forklift",            label: "Forklift & Powered Industrial Trucks" },
  { value: "back_safety",         label: "Back Safety & Ergonomics" },
  { value: "drug_alcohol",        label: "Drug & Alcohol Policy" },
  { value: "violence_prevention", label: "Workplace Violence Prevention" },
  { value: "custom",              label: "Custom Topic" },
];

const INDUSTRY_OPTIONS = [
  { value: "all",              label: "All Industries" },
  { value: "construction",     label: "Construction" },
  { value: "maritime",         label: "Maritime" },
  { value: "general_industry", label: "General Industry" },
  { value: "electrical",       label: "Electrical" },
  { value: "utilities",        label: "Utilities" },
  { value: "oil_gas",          label: "Oil & Gas" },
];

// ─── Default content templates by topic ──────────────────────────────────────

const CONTENT_TEMPLATES: Record<string, { content: string; keyPoints: string[]; regulatoryRef: string }> = {
  fall_protection: {
    content: `<h2>Fall Protection — Pre-Work Safety Briefing</h2>
<p>Falls are the leading cause of fatalities in construction. Before starting any work at height today, review the following requirements with your crew.</p>
<h3>When is Fall Protection Required?</h3>
<p>OSHA requires fall protection at <strong>6 feet or more</strong> in construction (4 feet in general industry). This applies to:</p>
<ul><li>Open-sided floors and platforms</li><li>Floor holes and wall openings</li><li>Scaffolding and elevated work platforms</li><li>Roof work and leading edges</li></ul>
<h3>Acceptable Fall Protection Methods</h3>
<ul><li><strong>Guardrail systems</strong> — top rail at 42 inches (±3 in.), mid-rail required</li><li><strong>Personal fall arrest systems (PFAS)</strong> — harness, lanyard, anchor point rated at 5,000 lbs minimum</li><li><strong>Safety nets</strong> — installed within 30 feet below the working level</li></ul>
<h3>Harness Inspection Checklist</h3>
<p>Before each use, inspect your harness for:</p>
<ul><li>Frayed webbing, cuts, or burns</li><li>Corroded or damaged hardware (buckles, D-rings, snaps)</li><li>Proper fit — snug but not restrictive</li><li>Legible labels and certification tags</li></ul>
<p>If any defect is found, <strong>remove the harness from service immediately</strong> and tag it out.</p>`,
    keyPoints: [
      "Fall protection required at 6 ft in construction, 4 ft in general industry",
      "Inspect harness before every use — remove from service if defective",
      "Anchor points must be rated for 5,000 lbs minimum",
      "Never tie off to rebar, conduit, or unrated anchor points",
      "Report any near-miss or fall immediately to your supervisor",
    ],
    regulatoryRef: "29 CFR 1926.502",
  },
  scaffolding: {
    content: `<h2>Scaffolding Safety — Pre-Work Briefing</h2>
<p>Scaffolding incidents account for approximately 4,500 injuries and 60 fatalities per year. Today's briefing covers the key requirements before you step onto any scaffold.</p>
<h3>Before Accessing a Scaffold</h3>
<ul><li>Verify the scaffold has been inspected by a <strong>Competent Person</strong> before each work shift</li><li>Check for a green tag or written authorization to use the scaffold</li><li>Never use a scaffold tagged out of service (red tag)</li></ul>
<h3>Load Capacity</h3>
<p>Scaffolds must support <strong>4 times the intended load</strong>. Do not overload platforms with materials, tools, or personnel beyond the rated capacity.</p>
<h3>Access & Egress</h3>
<ul><li>Use proper access — ladders, stair towers, or built-in access frames</li><li>Never climb cross-bracing to access a scaffold</li></ul>
<h3>Fall Protection on Scaffolds</h3>
<ul><li>Guardrails required when working 10 feet or more above a lower level</li><li>Personal fall arrest systems required on single-point and two-point suspended scaffolds</li></ul>`,
    keyPoints: [
      "Scaffold must be inspected by Competent Person before each shift",
      "Never use a red-tagged scaffold — report it to your supervisor",
      "Do not climb cross-bracing — use designated access points",
      "Guardrails required at 10 ft or more above lower level",
      "Do not exceed the scaffold's rated load capacity",
    ],
    regulatoryRef: "29 CFR 1926.451",
  },
  lockout_tagout: {
    content: `<h2>Lockout/Tagout (LOTO) — Pre-Work Briefing</h2>
<p>Failure to control hazardous energy is responsible for approximately 10% of serious industrial accidents. LOTO protects workers from the unexpected energization, startup, or release of stored energy.</p>
<h3>When is LOTO Required?</h3>
<p>LOTO is required whenever:</p>
<ul><li>Performing maintenance or servicing on equipment</li><li>Removing or bypassing machine guards</li><li>Placing any part of your body near a point of operation or moving parts</li></ul>
<h3>The 6-Step LOTO Procedure</h3>
<ol><li><strong>Notify</strong> affected employees that equipment is being shut down</li><li><strong>Identify</strong> all energy sources (electrical, hydraulic, pneumatic, thermal, gravity)</li><li><strong>Shut down</strong> the equipment using normal stopping procedures</li><li><strong>Isolate</strong> all energy sources at the disconnect/valve/etc.</li><li><strong>Apply</strong> your personal lock and tag to each energy isolation point</li><li><strong>Verify</strong> zero energy state — attempt to start, release stored energy</li></ol>
<h3>Important Rules</h3>
<ul><li>Each worker applies their <strong>own personal lock</strong> — never share locks</li><li>Only the person who applied the lock may remove it</li><li>Tags alone are NOT lockout — a physical lock is required</li></ul>`,
    keyPoints: [
      "Each worker applies their own personal lock — never share",
      "Tags alone are not lockout — a physical lock is always required",
      "Verify zero energy state before starting work",
      "Only the person who applied the lock may remove it",
      "Identify ALL energy sources before beginning LOTO",
    ],
    regulatoryRef: "29 CFR 1910.147",
  },
  confined_space: {
    content: `<h2>Confined Space Entry — Pre-Work Briefing</h2>
<p>Confined spaces present serious hazards including oxygen deficiency, toxic atmospheres, and engulfment. More than 60% of confined space fatalities are rescuers — not the initial victim.</p>
<h3>What is a Permit-Required Confined Space?</h3>
<p>A space is permit-required if it has any of the following:</p>
<ul><li>Contains or has potential to contain a serious atmospheric hazard</li><li>Contains material that could engulf an entrant</li><li>Has an internal configuration that could trap or asphyxiate</li><li>Contains any other recognized serious safety or health hazard</li></ul>
<h3>Before Entry — Required Steps</h3>
<ol><li>Obtain a completed <strong>Confined Space Entry Permit</strong></li><li>Test the atmosphere: O₂ (19.5–23.5%), LEL (&lt;10%), toxic gases (H₂S, CO)</li><li>Assign an <strong>Attendant</strong> who remains outside at all times</li><li>Establish <strong>rescue procedures</strong> before entry begins</li><li>Ensure all entrants have proper PPE and communication equipment</li></ol>
<h3>Atmospheric Testing Order</h3>
<p>Always test in this order: <strong>Oxygen → Flammability → Toxicity</strong></p>`,
    keyPoints: [
      "Never enter a permit-required confined space without a valid entry permit",
      "Test atmosphere in order: O₂ → LEL → Toxic gases",
      "An attendant must remain outside at all times during entry",
      "Establish rescue procedures BEFORE anyone enters",
      "If conditions change, evacuate immediately and re-evaluate",
    ],
    regulatoryRef: "29 CFR 1910.146",
  },
  electrical: {
    content: `<h2>Electrical Safety — Pre-Work Briefing</h2>
<p>Electrical hazards cause approximately 1,000 fatalities per year in the U.S. Today's briefing covers the key electrical safety practices for our work environment.</p>
<h3>The Four Main Electrical Hazards</h3>
<ul><li><strong>Electrocution</strong> — contact with energized parts</li><li><strong>Electric shock</strong> — non-fatal but can cause serious injury</li><li><strong>Arc flash/blast</strong> — explosive release of energy from electrical arc</li><li><strong>Fire</strong> — from overloaded circuits or faulty equipment</li></ul>
<h3>Safe Work Practices</h3>
<ul><li>Treat all electrical equipment as energized until proven otherwise</li><li>Use GFCI protection for all 120V tools and equipment on construction sites</li><li>Inspect cords and tools before each use — remove damaged equipment from service</li><li>Keep at least <strong>10 feet</strong> away from overhead power lines (more for higher voltages)</li><li>Never use metal ladders near electrical hazards</li></ul>
<h3>Cord & Tool Safety</h3>
<ul><li>Use only 3-prong grounded cords and tools</li><li>Never remove the grounding prong from a plug</li><li>Do not run cords through doorways, windows, or under rugs</li></ul>`,
    keyPoints: [
      "Treat all electrical equipment as energized until proven otherwise",
      "GFCI protection required for all 120V tools on construction sites",
      "Maintain 10-foot minimum clearance from overhead power lines",
      "Inspect all cords and tools before use — tag out damaged equipment",
      "Never remove the grounding prong from a plug",
    ],
    regulatoryRef: "29 CFR 1926.403",
  },
  ppe: {
    content: `<h2>Personal Protective Equipment (PPE) — Pre-Work Briefing</h2>
<p>PPE is your last line of defense against workplace hazards. It does not eliminate hazards — it reduces the risk of injury when other controls are not sufficient.</p>
<h3>PPE Hierarchy</h3>
<p>PPE is used after engineering controls and administrative controls have been applied. Always use the hierarchy of controls first.</p>
<h3>Required PPE for Today's Work</h3>
<ul><li><strong>Head protection</strong> — hard hat required in all construction areas</li><li><strong>Eye protection</strong> — safety glasses or goggles as required by task</li><li><strong>Foot protection</strong> — steel-toed boots required on site</li><li><strong>High-visibility vest</strong> — required when working near vehicle traffic</li><li><strong>Hearing protection</strong> — when noise levels exceed 85 dB</li><li><strong>Gloves</strong> — appropriate type for the hazard (cut, chemical, heat)</li></ul>
<h3>PPE Inspection</h3>
<p>Inspect all PPE before each use. Replace any PPE that is damaged, expired, or no longer provides adequate protection. Never modify PPE.</p>`,
    keyPoints: [
      "PPE is the last line of defense — use engineering controls first",
      "Inspect all PPE before each use — replace if damaged",
      "Hard hat, safety glasses, and steel-toed boots required on all construction sites",
      "High-vis vest required when working near vehicle traffic",
      "Never modify PPE — it voids the certification",
    ],
    regulatoryRef: "29 CFR 1926.95",
  },
  heat_illness: {
    content: `<h2>Heat Illness Prevention — Pre-Work Briefing</h2>
<p>Heat illness is preventable. In California and many other states, employers are required to have a Heat Illness Prevention Program. Today's briefing covers how to protect yourself and your crew.</p>
<h3>Types of Heat Illness</h3>
<ul><li><strong>Heat cramps</strong> — muscle cramps, usually in legs or abdomen</li><li><strong>Heat exhaustion</strong> — heavy sweating, weakness, cold/pale/clammy skin, weak pulse, nausea</li><li><strong>Heat stroke</strong> — high body temp (103°F+), hot/red/dry skin, rapid pulse, confusion — <strong>CALL 911 IMMEDIATELY</strong></li></ul>
<h3>Prevention — Water, Rest, Shade</h3>
<ul><li><strong>Water</strong> — drink 1 cup (8 oz) every 20 minutes, even if not thirsty</li><li><strong>Rest</strong> — take cool-down rest periods in shade or air conditioning</li><li><strong>Shade</strong> — shade must be available at all times when temperature exceeds 80°F</li></ul>
<h3>New Worker Acclimatization</h3>
<p>New workers and workers returning from absence of 7+ days must be gradually introduced to heat. Limit exposure to 20% of shift on Day 1, increasing by 20% each day.</p>`,
    keyPoints: [
      "Drink 1 cup of water every 20 minutes — don't wait until thirsty",
      "Shade must be available when temperature exceeds 80°F",
      "Know the signs of heat stroke — call 911 immediately if suspected",
      "New workers must be acclimatized gradually over 5+ days",
      "Buddy system — watch each other for signs of heat illness",
    ],
    regulatoryRef: "Cal/OSHA Title 8 §3395",
  },
  hazcom: {
    content: `<h2>Hazard Communication (HazCom) — Pre-Work Briefing</h2>
<p>OSHA's Hazard Communication Standard (HCS) gives workers the right to know about chemical hazards in the workplace. Today we'll review the key elements of our HazCom program.</p>
<h3>The Three Key Elements</h3>
<ul><li><strong>Labels</strong> — all chemical containers must be labeled with the product name, hazard pictograms, signal word, and hazard statements</li><li><strong>Safety Data Sheets (SDS)</strong> — must be accessible to all workers for every chemical used on site</li><li><strong>Training</strong> — all workers must be trained on chemical hazards before working with them</li></ul>
<h3>Reading a GHS Label</h3>
<ul><li><strong>Signal word</strong> — "Danger" (more severe) or "Warning" (less severe)</li><li><strong>Pictograms</strong> — 9 standardized symbols indicating hazard type</li><li><strong>Hazard statements</strong> — describe the nature of the hazard</li><li><strong>Precautionary statements</strong> — describe how to minimize or prevent adverse effects</li></ul>
<h3>Where to Find SDS Sheets</h3>
<p>SDS sheets for all chemicals on this site are located at [LOCATION]. You have the right to access these at any time.</p>`,
    keyPoints: [
      "All chemical containers must be labeled — never use unlabeled containers",
      "SDS sheets must be accessible to all workers at all times",
      "Read the SDS before using any new chemical",
      "Know the location of emergency eyewash and shower stations",
      "Report any unlabeled containers to your supervisor immediately",
    ],
    regulatoryRef: "29 CFR 1910.1200",
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface FormState {
  title: string;
  topic: string;
  industry: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  regulatoryRef: string;
  requiresSignoff: boolean;
}

const DEFAULT_FORM: FormState = {
  title: "",
  topic: "custom",
  industry: "all",
  content: "",
  keyPoints: [""],
  estimatedMinutes: 10,
  regulatoryRef: "",
  requiresSignoff: true,
};

export default function LMSToolboxBuilder() {
  const { role, setRole } = useLMS();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNew = !params.id || params.id === "new";

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load existing talk
  const existingTalk = !isNew && params.id ? getToolboxTalk(Number(params.id)) : undefined;
  const loadingTalk = false;

  useEffect(() => {
    if (existingTalk) {
      setForm({
        title: existingTalk.title,
        topic: existingTalk.topic,
        industry: existingTalk.industry,
        content: existingTalk.content,
        keyPoints: (existingTalk.keyPoints as string[] | null) ?? [""],
        estimatedMinutes: existingTalk.estimatedMinutes,
        regulatoryRef: existingTalk.regulatoryRef ?? "",
        requiresSignoff: existingTalk.requiresSignoff,
      });
    }
  }, [existingTalk]);

  // Apply template when topic changes on new talk
  useEffect(() => {
    if (!isNew || !form.topic || form.topic === "custom") return;
    const template = CONTENT_TEMPLATES[form.topic];
    if (template && !isDirty) {
      setForm(prev => ({
        ...prev,
        content: template.content,
        keyPoints: template.keyPoints,
        regulatoryRef: template.regulatoryRef,
        estimatedMinutes: 10,
        title: prev.title || (TOPIC_OPTIONS.find(t => t.value === form.topic)?.label ?? ""),
      }));
    }
  }, [form.topic, isNew]);

  const [isSaving, setIsSaving] = useState(false);

  const createMutation = {
    isPending: false,
    mutate: (payload: { title: string; topic: string; industry: string; content: string; keyPoints: string[]; estimatedMinutes: number; regulatoryRef?: string; requiresSignoff: boolean }) => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        const created = addToolboxTalk({
          title: payload.title,
          topic: payload.topic,
          industry: payload.industry,
          source: "custom",
          content: payload.content,
          keyPoints: payload.keyPoints,
          estimatedMinutes: payload.estimatedMinutes,
          regulatoryRef: payload.regulatoryRef ?? null,
          requiresSignoff: payload.requiresSignoff,
          companyId: 1,
        });
        toast.success("Toolbox Talk created.");
        setIsSaved(true);
        setIsDirty(false);
        navigate(`/lms/toolbox/builder/${created.id}`);
      }, 500);
    },
  };

  const updateMutation = {
    isPending: false,
    mutate: (payload: { id: number; title: string; topic: string; industry: string; content: string; keyPoints: string[]; estimatedMinutes: number; regulatoryRef?: string; requiresSignoff: boolean }) => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        const { id, ...patch } = payload;
        updateToolboxTalk(id, { ...patch, regulatoryRef: patch.regulatoryRef ?? null });
        toast.success("Changes saved.");
        setIsSaved(true);
        setIsDirty(false);
      }, 500);
    },
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const payload = {
      title: form.title,
      topic: form.topic,
      industry: form.industry as "construction" | "maritime" | "general_industry" | "electrical" | "utilities" | "oil_gas" | "all",
      content: form.content,
      keyPoints: form.keyPoints.filter(k => k.trim()),
      estimatedMinutes: form.estimatedMinutes,
      regulatoryRef: form.regulatoryRef || undefined,
      requiresSignoff: form.requiresSignoff,
    };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: Number(params.id), ...payload });
    }
  };

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setIsSaved(false);
  }, []);

  const addKeyPoint = () => updateField("keyPoints", [...form.keyPoints, ""]);
  const removeKeyPoint = (i: number) => updateField("keyPoints", form.keyPoints.filter((_, idx) => idx !== i));
  const updateKeyPoint = (i: number, val: string) => {
    const updated = [...form.keyPoints];
    updated[i] = val;
    updateField("keyPoints", updated);
  };

  const isLibraryTemplate = existingTalk?.source === "library";

  if (!isNew && loadingTalk) {
    return (
      <LMSLayout title="Toolbox Talk Builder" role={role} onRoleChange={setRole}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#0047AB]" />
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout
      title="Toolbox Talk Builder"
      role={role}
      onRoleChange={setRole}
      breadcrumbs={[
        { label: "Toolbox Talks", href: "/lms/toolbox" },
        { label: isNew ? "New Talk" : (form.title || "Edit Talk") },
      ]}
    >
      <div className="flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/lms/toolbox")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0047AB] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Library
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
              {form.title || (isNew ? "New Toolbox Talk" : "Edit Talk")}
            </span>
            {isDirty && <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-700 border-0">Unsaved</Badge>}
            {isSaved && !isDirty && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Saved</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                className="text-sm border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB]/5"
                onClick={() => navigate(`/lms/toolbox/deliver/${params.id}`)}
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Deliver Talk
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[#0047AB] hover:bg-[#1565C0] text-white text-sm"
              onClick={handleSave}
              disabled={isSaving || isLibraryTemplate}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              {isNew ? "Create Talk" : "Save Changes"}
            </Button>
          </div>
        </div>

        {isLibraryTemplate && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2 text-sm text-blue-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            This is an OSHA Library template and cannot be edited. Duplicate it to create a customizable copy.
          </div>
        )}

        {/* Two-Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Content Editor */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Talk Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., Fall Protection — Pre-Shift Briefing"
                className="text-base font-semibold border-gray-200"
                disabled={isLibraryTemplate}
              />
            </div>

            {/* Topic Selector */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">OSHA Topic</Label>
              <div className="relative">
                <select
                  value={form.topic}
                  onChange={(e) => updateField("topic", e.target.value)}
                  disabled={isLibraryTemplate}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 appearance-none pr-8"
                >
                  {TOPIC_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {isNew && CONTENT_TEMPLATES[form.topic] && (
                <p className="text-xs text-[#0047AB] mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pre-built content loaded for this topic. Customize as needed.
                </p>
              )}
            </div>

            {/* Content Body */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Briefing Content</Label>
              <p className="text-xs text-gray-500 mb-2">
                Write the full briefing content. This will be displayed to the presenter during the talk.
                HTML formatting is supported (headings, lists, bold, etc.).
              </p>
              <Textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Enter the briefing content here..."
                className="min-h-[320px] font-mono text-sm border-gray-200 resize-y"
                disabled={isLibraryTemplate}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Tip: Use &lt;h2&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;strong&gt; tags for formatting.
              </p>
            </div>

            {/* Key Points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-gray-700">Key Takeaway Points</Label>
                {!isLibraryTemplate && (
                  <button
                    onClick={addKeyPoint}
                    className="flex items-center gap-1 text-xs text-[#0047AB] hover:text-[#1565C0] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Point
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                These bullet points appear on the sign-off sheet and help workers remember the key messages.
              </p>
              <div className="space-y-2">
                {form.keyPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0047AB]/10 text-[#0047AB] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <Input
                      value={point}
                      onChange={(e) => updateKeyPoint(i, e.target.value)}
                      placeholder={`Key point ${i + 1}...`}
                      className="flex-1 text-sm border-gray-200"
                      disabled={isLibraryTemplate}
                    />
                    {!isLibraryTemplate && form.keyPoints.length > 1 && (
                      <button
                        onClick={() => removeKeyPoint(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Settings Panel */}
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto p-5 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Talk Settings</h3>

              {/* Industry */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Industry</Label>
                <select
                  value={form.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                  disabled={isLibraryTemplate}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30"
                >
                  {INDUSTRY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Estimated Duration */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Estimated Duration (minutes)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={form.estimatedMinutes}
                  onChange={(e) => updateField("estimatedMinutes", Number(e.target.value))}
                  className="text-sm border-gray-200"
                  disabled={isLibraryTemplate}
                />
              </div>

              {/* Regulatory Reference */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Regulatory Reference</Label>
                <Input
                  value={form.regulatoryRef}
                  onChange={(e) => updateField("regulatoryRef", e.target.value)}
                  placeholder="e.g., 29 CFR 1926.502"
                  className="text-sm border-gray-200 font-mono"
                  disabled={isLibraryTemplate}
                />
                <p className="text-[11px] text-gray-400 mt-1">OSHA standard or regulation number</p>
              </div>

              {/* Require Sign-off */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div>
                  <div className="text-xs font-semibold text-gray-700">Require Sign-off</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Employees must sign after attending</div>
                </div>
                <Switch
                  checked={form.requiresSignoff}
                  onCheckedChange={(v) => updateField("requiresSignoff", v)}
                  disabled={isLibraryTemplate}
                  className="data-[state=checked]:bg-[#0047AB]"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Preview</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs space-y-2">
                <div className="font-semibold text-gray-800 text-sm">{form.title || "Untitled Talk"}</div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{form.estimatedMinutes} min</span>
                </div>
                {form.regulatoryRef && (
                  <div className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded inline-block">{form.regulatoryRef}</div>
                )}
                {form.requiresSignoff && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sign-off required</span>
                  </div>
                )}
                {form.keyPoints.filter(k => k.trim()).length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Key Points</div>
                    <ul className="space-y-1">
                      {form.keyPoints.filter(k => k.trim()).slice(0, 3).map((point, i) => (
                        <li key={i} className="text-gray-600 flex items-start gap-1">
                          <span className="text-[#0047AB] font-bold">•</span>
                          <span className="line-clamp-2">{point}</span>
                        </li>
                      ))}
                      {form.keyPoints.filter(k => k.trim()).length > 3 && (
                        <li className="text-gray-400">+{form.keyPoints.filter(k => k.trim()).length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
