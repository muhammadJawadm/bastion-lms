/* ============================================================
   BLOCK EDITOR — Individual block rendering and editing
   ============================================================ */
import { useState, useCallback, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, ChevronDown, ChevronUp,
  Type, Video, Image, FileText, Package, CheckSquare,
  ThumbsUp, FileCheck, PenLine, Info, AlertTriangle, Lightbulb,
  HelpCircle, Plus, X, Upload, Link2, Loader2, Film, ClipboardList, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { mockUploadFile } from "../mockData";
import type {
  DraftBlock, BlockType, BlockData,
  TextBlockData, VideoBlockData, ImageBlockData, PdfBlockData,
  ResourceBlockData, ChecklistBlockData, AcknowledgmentBlockData,
  PolicyAckBlockData, CalloutBlockData, WarningBlockData, SafetyTipBlockData,
  CanvasSlideData, FillInTheBlankData, DragDropData, AssignmentBlockData,
} from "./types";
import { RichTextEditor } from "./RichTextEditor";
import { SlideCanvas } from "./SlideCanvas";
import { FillInTheBlankEditor, DragDropEditor } from "./InteractiveQuestions";

// ─── Block type metadata ──────────────────────────────────────────────────────

// Neutral card treatment for every block type — the picker/canvas no longer
// assigns a different saturated color per block type. Royal Blue is applied
// only on hover, keyboard focus, and selection (see BlockPicker/BlockWrapper).
const NEUTRAL_BLOCK_COLOR = "bg-white text-gray-700 border-gray-200";

export const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: "text", label: "Text / Blank Page", icon: <Type size={16} />, description: "Paragraphs, headings, lists, images, and formatted text", color: NEUTRAL_BLOCK_COLOR },
  { type: "video", label: "Video", icon: <Video size={16} />, description: "YouTube, Vimeo, or direct video URL", color: NEUTRAL_BLOCK_COLOR },
  { type: "image", label: "Image", icon: <Image size={16} />, description: "Photo, diagram, or infographic", color: NEUTRAL_BLOCK_COLOR },
  { type: "pdf", label: "PDF Document", icon: <FileText size={16} />, description: "Safety manual, SOP, or reference document", color: NEUTRAL_BLOCK_COLOR },
  { type: "assignment", label: "Assignment", icon: <ClipboardList size={16} />, description: "Task employees must complete and submit", color: NEUTRAL_BLOCK_COLOR },
  { type: "resource", label: "Resource / Download", icon: <Package size={16} />, description: "Downloadable file or external link", color: NEUTRAL_BLOCK_COLOR },
  { type: "checklist", label: "Checklist", icon: <CheckSquare size={16} />, description: "Interactive checklist employees must complete", color: NEUTRAL_BLOCK_COLOR },
  { type: "acknowledgment", label: "Acknowledgment", icon: <ThumbsUp size={16} />, description: "Employee confirms they understand the content", color: NEUTRAL_BLOCK_COLOR },
  { type: "policy_ack", label: "Policy Acknowledgment", icon: <FileCheck size={16} />, description: "Employee reads and acknowledges a policy", color: NEUTRAL_BLOCK_COLOR },
  { type: "signature", label: "Signature Block", icon: <PenLine size={16} />, description: "Employee types their name as a digital signature", color: NEUTRAL_BLOCK_COLOR },
  // callout block removed per Session 15 (may be re-added later)
  { type: "warning", label: "Warning / Danger Box", icon: <AlertTriangle size={16} />, description: "Safety warning, caution, or danger notice", color: NEUTRAL_BLOCK_COLOR },
  { type: "safety_tip", label: "Safety Tip", icon: <Lightbulb size={16} />, description: "Quick safety reminder or best practice", color: NEUTRAL_BLOCK_COLOR },
  { type: "quiz_question", label: "Quiz Question", icon: <HelpCircle size={16} />, description: "Inline knowledge check question", color: NEUTRAL_BLOCK_COLOR },
  // canvas_slide removed per Session 15 (advanced editor planned for later)
  { type: "quiz_fitb", label: "Fill in the Blank", icon: <Type size={16} />, description: "Type the missing word(s)", color: NEUTRAL_BLOCK_COLOR },
  { type: "quiz_dragdrop", label: "Drag & Drop", icon: <CheckSquare size={16} />, description: "Drag words from a word bank into blanks", color: NEUTRAL_BLOCK_COLOR },
];

export function getBlockMeta(type: BlockType) {
  return BLOCK_TYPES.find(b => b.type === type) ?? BLOCK_TYPES[0];
}

// ─── Default data for each block type ────────────────────────────────────────

export function getDefaultData(type: BlockType): BlockData {
  switch (type) {
    case "text": return { html: "" } as TextBlockData; // empty → RichTextEditor shows placeholder
    case "video": return { url: "", caption: "" } as VideoBlockData;
    case "image": return { url: "", alt: "", caption: "", width: "full" } as ImageBlockData;
    case "pdf": return { url: "", title: "", downloadable: true } as PdfBlockData;
    case "resource": return { url: "", title: "Resource", description: "", fileType: "PDF" } as ResourceBlockData;
    case "assignment": return { title: "Assignment", instructions: "Describe what employees need to do and submit.", submissionType: "text", dueOffsetDays: 7 } as AssignmentBlockData;
    case "checklist": return { title: "Pre-Task Safety Checklist", items: [{ id: crypto.randomUUID(), text: "Item 1", required: true }], requireAll: true } as ChecklistBlockData;
    case "acknowledgment": return { statement: "I have read and understand the content above.", checkboxLabel: "I acknowledge" } as AcknowledgmentBlockData;
    case "policy_ack": return { policyTitle: "Safety Policy", policyText: "Enter policy text here...", checkboxLabel: "I have read and agree to this policy", requireSignature: false } as PolicyAckBlockData;
    case "signature": return { prompt: "By typing your name below, you confirm your understanding.", label: "Full Name" };
    case "callout": return { title: "Note", body: "Enter important information here.", variant: "info" } as CalloutBlockData;
    case "warning": return { title: "Warning", body: "Enter safety warning here.", variant: "warning", oshaRef: "" } as WarningBlockData;
    case "safety_tip": return { tip: "Enter a safety tip here." };
    case "quiz_question": return {
      question: {
        id: crypto.randomUUID(),
        type: "multiple_choice",
        question: "", // empty → textarea shows placeholder
        options: ["", "", "", ""], // empty → inputs show placeholder text
        correctIndices: [0],
        explanation: "",
      }
    };
    // ── New slide types ──
    case "slide_title": return { title: "A title slide", subtitle: "An optional subtitle", buttonText: "Ok, let's go!" };
    case "slide_bulleted_list": return { title: "Key Points", items: ["First point", "Second point", "Third point"] };
    case "slide_image": return { url: "", caption: "" };
    case "slide_video": return { url: "", caption: "" };
    case "slide_file": return { url: "", title: "Document", description: "" };
    case "slide_table": return { title: "Table", headers: ["Column 1", "Column 2", "Column 3"], rows: [["Cell", "Cell", "Cell"], ["Cell", "Cell", "Cell"]] };
    case "slide_quote": return { quote: "Enter the quotation here...", attribution: "" };
    case "slide_comparison": return { title: "Comparison", leftLabel: "Option A", leftContent: "Description...", rightLabel: "Option B", rightContent: "Description..." };
    case "slide_expandable_list": return { title: "Concepts", items: [{ heading: "Concept 1", body: "Description" }, { heading: "Concept 2", body: "Description" }] };
    case "slide_horizontal_series": return { title: "Steps", items: [{ title: "Step 1", body: "Description" }, { title: "Step 2", body: "Description" }, { title: "Step 3", body: "Description" }] };
    case "slide_reveal": return { title: "Reveal", items: [{ front: "Question", back: "Answer" }, { front: "Question", back: "Answer" }] };
    case "slide_scrolling_mix": return { title: "Content", blocks: [{ type: "text", content: "Enter text here..." }] };
    case "slide_scrolling_text": return { title: "Long-form Content", body: "Enter your long-form text here..." };
    case "slide_sequence": return { title: "Sequence", steps: ["Step 1", "Step 2", "Step 3"] };
    case "slide_vertical_series": return { title: "Series", items: [{ title: "Item 1", body: "Description" }, { title: "Item 2", body: "Description" }] };
    case "quiz_multiple_choice": return { question: { id: crypto.randomUUID(), type: "multiple_choice", question: "", options: ["", "", "", ""], correctIndices: [0], explanation: "" } };
    case "quiz_true_false": return { question: "Enter your statement here.", correct: true, explanation: "" };
    case "quiz_match": return { title: "Match the following", pairs: [{ left: "Term 1", right: "Definition 1" }, { left: "Term 2", right: "Definition 2" }] };
    case "quiz_numbers": return { question: "Enter a numeric question?", answer: 0, tolerance: 0, unit: "" };
    case "quiz_words": return { question: "Enter a fill-in-the-blank question?", answer: "", caseSensitive: false };
    case "canvas_slide": return {
      background: { color: "#0F1C2E", imageUrl: null, overlayOpacity: 0.4, overlayColor: "#000000" },
      elements: [],
      notes: "",
    } as CanvasSlideData;
    case "quiz_fitb": return {
      template: "Always wear your {{blank}} before entering a {{blank}} area.",
      correctAnswers: ["hard hat", "restricted"],
      explanation: "",
    } as FillInTheBlankData;
    case "quiz_dragdrop": return {
      template: "The {{blank}} is required when working at heights above {{blank}} feet.",
      correctAnswers: ["harness", "6"],
      wordBank: ["harness", "6", "helmet", "10", "gloves", "4"],
      explanation: "",
    } as DragDropData;
    default: return { html: "" } as TextBlockData;
  }
}

// ─── Block Wrapper (drag handle + toolbar) ───────────────────────────────────

interface BlockWrapperProps {
  block: DraftBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (data: Partial<BlockData>) => void;
  children: React.ReactNode;
}

/** Padding/background/corner-radius stored alongside a block's own `data`. */
export interface BlockStyle {
  padding?: number;
  background?: string;
  borderRadius?: number;
}

const STYLE_BACKGROUNDS = ["", "#F4F6F9", "#EFF6FF", "#FEF3C7", "#ECFDF5", "#FEF2F2"];

export function BlockWrapper({ block, isSelected, onSelect, onDelete, onUpdate, children }: BlockWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = getBlockMeta(block.type);
  const blockStyle = ((block.data as Record<string, unknown>)?.style as BlockStyle) ?? {};

  const updateStyle = (patch: Partial<BlockStyle>) => {
    // onUpdate replaces the block's whole `data` object, so the rest of the
    // block's content must be spread through alongside the new style.
    onUpdate({ ...(block.data as object), style: { ...blockStyle, ...patch } } as unknown as Partial<BlockData>);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: blockStyle.padding ? `${blockStyle.padding}px` : undefined,
    background: blockStyle.background || undefined,
    borderRadius: blockStyle.borderRadius != null ? `${blockStyle.borderRadius}px` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border-2 transition-all duration-150 cursor-pointer",
        isSelected ? "border-[#0047AB] shadow-md shadow-blue-100" : "border-transparent hover:border-gray-200",
        isDragging && "z-50 shadow-2xl"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </div>

      {/* Block type badge */}
      <div className="absolute -top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <span className={cn("inline-flex items-center gap-1 text-xs font-display font-bold px-2 py-0.5 rounded-full border", meta.color)}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* Style (padding / background / corner radius) */}
      <div className="absolute -top-3 right-9 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <button className="bg-white border border-gray-200 shadow-sm hover:border-[#0047AB] hover:text-[#0047AB] text-gray-500 rounded-full p-1" title="Block style">
              <Palette size={12} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-3" align="end">
            <div className="space-y-1">
              <Label className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-wide">Padding ({blockStyle.padding ?? 0}px)</Label>
              <input type="range" min={0} max={48} step={4} value={blockStyle.padding ?? 0} onChange={e => updateStyle({ padding: Number(e.target.value) })} className="w-full accent-[#0047AB]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-wide">Corner Radius ({blockStyle.borderRadius ?? 0}px)</Label>
              <input type="range" min={0} max={24} step={2} value={blockStyle.borderRadius ?? 0} onChange={e => updateStyle({ borderRadius: Number(e.target.value) })} className="w-full accent-[#0047AB]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-wide">Background</Label>
              <div className="flex gap-1.5">
                {STYLE_BACKGROUNDS.map(c => (
                  <button
                    key={c || "none"}
                    onClick={() => updateStyle({ background: c })}
                    className={cn("w-6 h-6 rounded-full border", (blockStyle.background || "") === c ? "border-[#0047AB] border-2" : "border-gray-200")}
                    style={{ background: c || "repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 50% / 8px 8px" }}
                    title={c || "None"}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="absolute -top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
      >
        <X size={12} />
      </button>

      {children}
    </div>
  );
}

// ─── Individual block editors ─────────────────────────────────────────────────

interface BlockEditorProps {
  block: DraftBlock;
  onUpdate: (data: BlockData) => void;
}

export function BlockEditorContent({ block, onUpdate }: BlockEditorProps) {
  const data = block.data as Record<string, unknown>;

  switch (block.type) {
    case "text":
      return (
        <div className="p-4">
          <RichTextEditor
            value={(data.html as string) ?? ""}
            onChange={html => onUpdate({ ...data, html } as TextBlockData)}
          />
        </div>
      );

    case "video":
      return <VideoBlockEditor data={data} onUpdate={onUpdate} />;

    case "image":
      return <ImageBlockEditor data={data} onUpdate={onUpdate} />;

    case "pdf":
      return <PdfBlockEditor data={data} onUpdate={onUpdate} />;

    case "assignment":
      return <AssignmentBlockEditor data={data} onUpdate={onUpdate} />;

    case "resource":
      return (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-display font-bold text-gray-600">Resource Title</Label>
              <Input
                value={(data.title as string) ?? ""}
                onChange={e => onUpdate({ ...data, title: e.target.value } as ResourceBlockData)}
                placeholder="e.g. OSHA 1926.502 Standard"
                className="font-body text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-display font-bold text-gray-600">File Type</Label>
              <Input
                value={(data.fileType as string) ?? ""}
                onChange={e => onUpdate({ ...data, fileType: e.target.value } as ResourceBlockData)}
                placeholder="PDF, XLSX, DOCX..."
                className="font-body text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">URL</Label>
            <Input
              value={(data.url as string) ?? ""}
              onChange={e => onUpdate({ ...data, url: e.target.value } as ResourceBlockData)}
              placeholder="https://... or /manus-storage/..."
              className="font-body text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Description (optional)</Label>
            <Input
              value={(data.description as string) ?? ""}
              onChange={e => onUpdate({ ...data, description: e.target.value } as ResourceBlockData)}
              placeholder="Brief description of this resource..."
              className="font-body text-sm"
            />
          </div>
        </div>
      );

    case "checklist":
      return <ChecklistEditor data={data} onUpdate={onUpdate} />;

    case "acknowledgment":
      return (
        <div className="p-4 space-y-3">
          {/* Acknowledgment statement text */}
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Acknowledgment Statement</Label>
            <Textarea
              value={(data.statement as string) ?? ""}
              onChange={e => onUpdate({ ...data, statement: e.target.value } as AcknowledgmentBlockData)}
              placeholder="I have read and understand the content above."
              className="font-body text-sm resize-none"
              rows={3}
            />
          </div>
          {/* Legal name field label */}
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Legal Name Field Label</Label>
            <Input
              value={(data.checkboxLabel as string) ?? ""}
              onChange={e => onUpdate({ ...data, checkboxLabel: e.target.value } as AcknowledgmentBlockData)}
              placeholder="Type your full legal name to acknowledge"
              className="font-body text-sm"
            />
            <p className="text-[10px] text-gray-400 font-body">
              The employee must type their full legal name to complete this acknowledgment. This replaces the simple checkbox.
            </p>
          </div>
          {/* Preview of how it appears to the learner */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
            <p className="text-xs font-display font-bold text-indigo-700">Learner Preview</p>
            <p className="text-sm font-body text-indigo-800 leading-relaxed">
              {(data.statement as string) || "I have read and understand the content above."}
            </p>
            <div className="space-y-1">
              <Label className="text-[11px] font-body text-indigo-600">
                {(data.checkboxLabel as string) || "Type your full legal name to acknowledge"}
              </Label>
              <Input disabled placeholder="Employee types their full legal name here" className="font-body text-sm bg-white" />
            </div>
          </div>
        </div>
      );

    case "policy_ack":
      return (
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Policy Title</Label>
            <Input
              value={(data.policyTitle as string) ?? ""}
              onChange={e => onUpdate({ ...data, policyTitle: e.target.value } as PolicyAckBlockData)}
              placeholder="e.g. Fall Protection Policy"
              className="font-body text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Policy Text</Label>
            <Textarea
              value={(data.policyText as string) ?? ""}
              onChange={e => onUpdate({ ...data, policyText: e.target.value } as PolicyAckBlockData)}
              placeholder="Enter the full policy text here..."
              className="font-body text-sm resize-none"
              rows={5}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Checkbox Label</Label>
            <Input
              value={(data.checkboxLabel as string) ?? ""}
              onChange={e => onUpdate({ ...data, checkboxLabel: e.target.value } as PolicyAckBlockData)}
              placeholder="I have read and agree to this policy"
              className="font-body text-sm"
            />
          </div>
        </div>
      );

    case "signature":
      return (
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Prompt Text</Label>
            <Textarea
              value={(data.prompt as string) ?? ""}
              onChange={e => onUpdate({ ...data, prompt: e.target.value })}
              placeholder="By typing your name below, you confirm your understanding."
              className="font-body text-sm resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Input Label</Label>
            <Input
              value={(data.label as string) ?? ""}
              onChange={e => onUpdate({ ...data, label: e.target.value })}
              placeholder="Full Name"
              className="font-body text-sm"
            />
          </div>
          <SupportingMediaField
            url={data.supportingMediaUrl as string | undefined}
            onChange={(url) => onUpdate({ ...data, supportingMediaUrl: url || undefined })}
            label="Policy / Document Image (optional)"
          />
          <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
            <p className="text-xs text-pink-700 font-body mb-2">{(data.prompt as string) || "By typing your name below, you confirm your understanding."}</p>
            <Input disabled placeholder="Employee types their name here" className="font-body text-sm bg-white" />
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-display font-bold text-gray-600">Title (optional)</Label>
              <Input
                value={(data.title as string) ?? ""}
                onChange={e => onUpdate({ ...data, title: e.target.value } as CalloutBlockData)}
                placeholder="Note"
                className="font-body text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-display font-bold text-gray-600">Variant</Label>
              <select
                value={(data.variant as string) ?? "info"}
                onChange={e => onUpdate({ ...data, variant: e.target.value } as CalloutBlockData)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
              >
                <option value="info">Info (Blue)</option>
                <option value="tip">Tip (Green)</option>
                <option value="note">Note (Gray)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Content</Label>
            <Textarea
              value={(data.body as string) ?? ""}
              onChange={e => onUpdate({ ...data, body: e.target.value } as CalloutBlockData)}
              placeholder="Enter callout content..."
              className="font-body text-sm resize-none"
              rows={3}
            />
          </div>
        </div>
      );

    case "warning":
      return (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-display font-bold text-gray-600">Title</Label>
              <Input
                value={(data.title as string) ?? ""}
                onChange={e => onUpdate({ ...data, title: e.target.value } as WarningBlockData)}
                placeholder="Warning"
                className="font-body text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-display font-bold text-gray-600">Severity</Label>
              <select
                value={(data.variant as string) ?? "warning"}
                onChange={e => onUpdate({ ...data, variant: e.target.value } as WarningBlockData)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
              >
                <option value="warning">Warning (Yellow)</option>
                <option value="caution">Caution (Orange)</option>
                <option value="danger">Danger (Red)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Warning Text</Label>
            <Textarea
              value={(data.body as string) ?? ""}
              onChange={e => onUpdate({ ...data, body: e.target.value } as WarningBlockData)}
              placeholder="Enter safety warning..."
              className="font-body text-sm resize-none"
              rows={3}
            />
          </div>
          {/* OSHA reference — optional, shown as a collapsible detail */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-body text-gray-400 hover:text-[#0047AB] transition-colors list-none flex items-center gap-1">
              <span className="text-[10px] group-open:rotate-90 transition-transform inline-block">▶</span>
              Add OSHA reference (optional)
            </summary>
            <div className="mt-2 space-y-1">
              <Input
                value={(data.oshaRef as string) ?? ""}
                onChange={e => onUpdate({ ...data, oshaRef: e.target.value } as WarningBlockData)}
                placeholder="e.g. 29 CFR 1926.502(b)(1)"
                className="font-body text-sm"
              />
              <p className="text-[10px] text-gray-400 font-body">Cite the specific OSHA standard this warning relates to.</p>
            </div>
          </details>
        </div>
      );

    case "safety_tip":
      return (
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-display font-bold text-gray-600">Safety Tip</Label>
            <Textarea
              value={(data.tip as string) ?? ""}
              onChange={e => onUpdate({ ...data, tip: e.target.value })}
              placeholder="Enter a quick safety tip or best practice..."
              className="font-body text-sm resize-none"
              rows={3}
            />
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Lightbulb size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-body text-amber-800">{(data.tip as string) || "Safety tip preview appears here."}</p>
          </div>
        </div>
      );

    case "quiz_question":
      return <QuizQuestionEditor data={data} onUpdate={onUpdate} />;

    case "canvas_slide":
      return (
        <SlideCanvas
          data={block.data as CanvasSlideData}
          onChange={(updated) => onUpdate(updated as BlockData)}
        />
      );

    case "quiz_fitb":
      return (
        <FillInTheBlankEditor
          data={block.data as FillInTheBlankData}
          onChange={(updated) => onUpdate(updated as BlockData)}
        />
      );

    case "quiz_dragdrop":
      return (
        <DragDropEditor
          data={block.data as DragDropData}
          onChange={(updated) => onUpdate(updated as BlockData)}
        />
      );

    default:
      return <div className="p-4 text-sm text-gray-400 font-body">Unknown block type.</div>;
  }
}

// ─── Checklist editor ─────────────────────────────────────────────────────────

function ChecklistEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: BlockData) => void }) {
  const items = (data.items as ChecklistBlockData["items"]) ?? [];

  const addItem = () => {
    onUpdate({
      ...data,
      items: [...items, { id: crypto.randomUUID(), text: "", required: true }],
    } as ChecklistBlockData);
  };

  const removeItem = (id: string) => {
    onUpdate({ ...data, items: items.filter(i => i.id !== id) } as ChecklistBlockData);
  };

  const updateItem = (id: string, text: string) => {
    onUpdate({ ...data, items: items.map(i => i.id === id ? { ...i, text } : i) } as ChecklistBlockData);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Checklist Title</Label>
        <Input
          value={(data.title as string) ?? ""}
          onChange={e => onUpdate({ ...data, title: e.target.value } as ChecklistBlockData)}
          placeholder="Pre-Task Safety Checklist"
          className="font-body text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-display font-bold text-gray-600">Items</Label>
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-body w-5 shrink-0">{idx + 1}.</span>
            <Input
              value={item.text}
              onChange={e => updateItem(item.id, e.target.value)}
              placeholder={`Item ${idx + 1}`}
              className="font-body text-sm flex-1"
            />
            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="w-full text-xs font-display font-bold">
          <Plus size={12} className="mr-1" />Add Item
        </Button>
      </div>
      <SupportingMediaField
        url={data.supportingMediaUrl as string | undefined}
        onChange={(url) => onUpdate({ ...data, supportingMediaUrl: url || undefined } as ChecklistBlockData)}
        label="Reference Photo / Diagram (optional)"
      />
      <div className="flex items-center gap-2">
        <Switch
          checked={(data.requireAll as boolean) ?? true}
          onCheckedChange={v => onUpdate({ ...data, requireAll: v } as ChecklistBlockData)}
        />
        <Label className="text-xs font-body text-gray-600">Require all items to be checked before continuing</Label>
      </div>
    </div>
  );
}

// ─── Assignment editor ────────────────────────────────────────────────────────

function AssignmentBlockEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: BlockData) => void }) {
  const submissionType = (data.submissionType as AssignmentBlockData["submissionType"]) ?? "text";

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Assignment Title</Label>
        <Input
          value={(data.title as string) ?? ""}
          onChange={e => onUpdate({ ...data, title: e.target.value } as AssignmentBlockData)}
          placeholder="e.g. Site Hazard Walkthrough Report"
          className="font-body text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Instructions</Label>
        <Textarea
          value={(data.instructions as string) ?? ""}
          onChange={e => onUpdate({ ...data, instructions: e.target.value } as AssignmentBlockData)}
          placeholder="Describe what the employee needs to do and submit..."
          className="font-body text-sm resize-none"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Submission Type</Label>
          <select
            value={submissionType}
            onChange={e => onUpdate({ ...data, submissionType: e.target.value } as AssignmentBlockData)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
          >
            <option value="text">Written Response</option>
            <option value="file">File Upload</option>
            <option value="either">Either</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Due (days after assignment)</Label>
          <Input
            type="number"
            min={0}
            value={(data.dueOffsetDays as number) ?? 7}
            onChange={e => onUpdate({ ...data, dueOffsetDays: Number(e.target.value) } as AssignmentBlockData)}
            className="font-body text-sm"
          />
        </div>
      </div>
      <SupportingMediaField
        url={data.supportingMediaUrl as string | undefined}
        onChange={(url) => onUpdate({ ...data, supportingMediaUrl: url || undefined } as AssignmentBlockData)}
        label="Reference Photo (optional)"
      />
      <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <ClipboardList size={18} className="text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-display font-bold text-orange-800">{(data.title as string) || "Assignment"}</p>
          <p className="text-xs font-body text-orange-700 mt-0.5">
            {(data.instructions as string) || "Assignment instructions preview appears here."}
          </p>
          <p className="text-[10px] font-body text-orange-500 mt-1 uppercase tracking-wide">
            {submissionType === "text" ? "Written response" : submissionType === "file" ? "File upload" : "Written response or file upload"} · Due {(data.dueOffsetDays as number) ?? 7} day{((data.dueOffsetDays as number) ?? 7) === 1 ? "" : "s"} after assignment
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz question editor ─────────────────────────────────────────────────────

function QuizQuestionEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: BlockData) => void }) {
  const q = (data.question as import("./types").QuizQuestion) ?? {
    id: crypto.randomUUID(), type: "multiple_choice", question: "", options: ["", "", "", ""], correctIndices: [0],
  };
  const fillBlank = (data.fillBlank as DragDropData) ?? {
    template: "The {{blank}} is required when working at heights above {{blank}} feet.",
    correctAnswers: ["harness", "6"],
    wordBank: ["harness", "6", "helmet", "10", "gloves", "4"],
    explanation: "",
  };

  const update = (patch: Partial<import("./types").QuizQuestion>) => {
    onUpdate({ ...data, question: { ...q, ...patch } } as BlockData);
  };

  // Fill in the Blank is the 4th approved question type — it reuses the existing,
  // already-accessible (click-or-drag) word-bank editor from InteractiveQuestions.tsx
  // rather than introducing a separate standalone block type.
  if (q.type === "fill_blank") {
    const noAnswers = fillBlank.correctAnswers.every(a => !a.trim());
    return (
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Question Type</Label>
          <select
            value={q.type}
            onChange={e => update({ type: e.target.value as import("./types").QuizQuestionType })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="select_all">Select All That Apply</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>
        </div>
        {noAnswers && (
          <p className="text-xs text-red-600 font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Assign a correct word to every blank before this question can be published.
          </p>
        )}
        <SupportingMediaField url={q.imageUrl} onChange={(url) => update({ imageUrl: url || undefined })} />
        <DragDropEditor
          data={fillBlank}
          onChange={(updated) => onUpdate({ ...data, fillBlank: updated } as BlockData)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Question Type</Label>
          <select
            value={q.type}
            onChange={e => update({ type: e.target.value as import("./types").QuizQuestionType })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="select_all">Select All That Apply</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>
        </div>
      {q.correctIndices.length === 0 && (
        <p className="text-xs text-red-600 font-body bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Mark a correct answer before this question can be published.
        </p>
      )}
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Question</Label>
        <Textarea
          value={q.question}
          onChange={e => update({ question: e.target.value })}
          placeholder="Enter your question here?"
          className="font-body text-sm resize-none"
          rows={2}
        />
      </div>
      <SupportingMediaField url={q.imageUrl} onChange={(url) => update({ imageUrl: url || undefined })} />
      {q.type === "true_false" ? (
        <div className="space-y-2">
          <Label className="text-xs font-display font-bold text-gray-600">Correct Answer</Label>
          <div className="flex gap-3">
            {["True", "False"].map((opt, i) => (
              <button
                key={opt}
                onClick={() => update({ options: ["True", "False"], correctIndices: [i] })}
                className={cn(
                  "flex-1 py-2 rounded-lg border-2 text-sm font-display font-bold transition-colors",
                  q.correctIndices.includes(i) ? "border-[#0047AB] bg-blue-50 text-[#0047AB]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs font-display font-bold text-gray-600">
            Answer Options {q.type === "select_all" && <span className="text-gray-400 font-normal">(click to mark correct)</span>}
          </Label>
          {(q.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newCorrect = q.type === "select_all"
                    ? q.correctIndices.includes(i) ? q.correctIndices.filter(c => c !== i) : [...q.correctIndices, i]
                    : [i];
                  update({ correctIndices: newCorrect });
                }}
                className={cn(
                  "w-5 h-5 rounded shrink-0 border-2 transition-colors flex items-center justify-center",
                  q.correctIndices.includes(i) ? "bg-[#0047AB] border-[#0047AB] text-white" : "border-gray-300"
                )}
              >
                {q.correctIndices.includes(i) && <span className="text-xs">✓</span>}
              </button>
              <Input
                value={opt}
                onChange={e => {
                  const newOptions = [...q.options];
                  newOptions[i] = e.target.value;
                  update({ options: newOptions });
                }}
                placeholder={`Answer choice ${i + 1} — click the checkbox to mark as correct`}
                className="font-body text-sm flex-1"
              />
              {q.options.length > 2 && (
                <button
                  onClick={() => {
                    const newOptions = q.options.filter((_, idx) => idx !== i);
                    const newCorrect = q.correctIndices.filter(c => c !== i).map(c => c > i ? c - 1 : c);
                    update({ options: newOptions, correctIndices: newCorrect });
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {q.options.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => update({ options: [...q.options, ""] })}
              className="w-full text-xs font-display font-bold"
            >
              <Plus size={12} className="mr-1" />Add Option
            </Button>
          )}
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Explanation (shown after answer)</Label>
        <Textarea
          value={q.explanation ?? ""}
          onChange={e => update({ explanation: e.target.value })}
          placeholder="Explain why this is the correct answer..."
          className="font-body text-sm resize-none"
          rows={2}
        />
      </div>
      {/* OSHA reference — optional, collapsible */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-body text-gray-400 hover:text-[#0047AB] transition-colors list-none flex items-center gap-1">
          <span className="text-[10px] group-open:rotate-90 transition-transform inline-block">▶</span>
          Add OSHA reference (optional)
        </summary>
        <div className="mt-2 space-y-1">
          <Input
            value={q.oshaRef ?? ""}
            onChange={e => update({ oshaRef: e.target.value })}
            placeholder="e.g. 29 CFR 1926.502(b)(1)"
            className="font-body text-sm"
          />
          <p className="text-[10px] text-gray-400 font-body">Cite the specific OSHA standard this question relates to.</p>
        </div>
      </details>
    </div>
  );
}

// ─── Supporting media (shared by assignment/checklist/quiz/signature) ─────────
// Report §4: "Ensure assignments, checklists, quiz questions, and signature
// instructions can include supporting text and media where relevant." Text
// already exists on each of those blocks (instructions/title/question/prompt);
// this adds the missing piece — an optional supporting image.

function SupportingMediaField({
  url, onChange, label = "Supporting Image (optional)",
}: {
  url: string | undefined;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await mockUploadFile({ base64, filename: file.name, mimeType: file.type, folder: "supporting-media" });
        onChange(result.url);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-display font-bold text-gray-600">{label}</Label>
      {url ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={url} alt="" className="max-h-40 w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
            title="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
          <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
          </Button>
          <Input
            placeholder="or paste an image URL…"
            className="text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v) onChange(v); }
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVideoEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* ignore */ }
  return url;
}

// ─── Image Block Editor ───────────────────────────────────────────────────────

/**
 * ImageBlockEditor — allows uploading an image from desktop or entering a URL.
 * Uses trpc.uploads.uploadBase64 for desktop uploads.
 */
function ImageBlockEditor({
  data,
  onUpdate,
}: {
  data: Record<string, unknown>;
  onUpdate: (d: BlockData) => void;
}) {
  /** "upload" | "url" — which input mode is active */
  const [mode, setMode] = useState<"upload" | "url">((data.url as string) ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBase64 = { mutateAsync: mockUploadFile };

  /** Shared upload path for file-input selection, drag-and-drop, and clipboard paste. */
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file (JPG, PNG, GIF, WebP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Image must be under 10 MB.");
        return;
      }

      setUploadError(null);
      setUploading(true);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadBase64.mutateAsync({
          base64,
          filename: file.name,
          mimeType: file.type,
          folder: "images",
        });

        onUpdate({ ...data, url: result.url, alt: (data.alt as string) ?? file.name } as ImageBlockData);
        setMode("url"); // switch to URL mode to show the preview
      } catch (err) {
        setUploadError("Upload failed. Please try again.");
        console.error("[ImageBlockEditor] upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [data, onUpdate, uploadBase64]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = ""; // allow re-selecting the same file
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  // Paste an image directly from the clipboard while this block is the one being edited.
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        void handleFile(file);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  return (
    <div
      className={cn("p-4 space-y-3 rounded-lg transition-colors", dragging && "bg-[#0047AB]/5 ring-2 ring-[#0047AB]/30")}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors",
            mode === "upload"
              ? "bg-[#0047AB] text-white border-[#0047AB]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#0047AB] hover:text-[#0047AB]"
          )}
        >
          <Upload size={12} />Upload from Desktop
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors",
            mode === "url"
              ? "bg-[#0047AB] text-white border-[#0047AB]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#0047AB] hover:text-[#0047AB]"
          )}
        >
          <Link2 size={12} />Add from URL
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-colors group",
              dragging ? "border-[#0047AB] bg-[#0047AB]/5" : "border-gray-300 hover:border-[#0047AB]"
            )}
          >
            {uploading ? (
              <>
                <Loader2 size={24} className="text-[#0047AB] animate-spin" />
                <span className="text-sm font-body text-gray-500">Uploading…</span>
              </>
            ) : (
              <>
                <Upload size={24} className="text-gray-400 group-hover:text-[#0047AB] transition-colors" />
                <span className="text-sm font-display font-bold text-gray-600 group-hover:text-[#0047AB] transition-colors">
                  Click, drag & drop, or paste an image
                </span>
                <span className="text-[11px] font-body text-gray-400">JPG, PNG, GIF, WebP — max 10 MB</span>
              </>
            )}
          </button>
          {uploadError && (
            <p className="text-xs text-red-600 font-body mt-1">{uploadError}</p>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === "url" && (
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Image URL</Label>
          <Input
            value={(data.url as string) ?? ""}
            onChange={e => onUpdate({ ...data, url: e.target.value } as ImageBlockData)}
            placeholder="https://example.com/image.jpg"
            className="font-body text-sm"
          />
        </div>
      )}

      {/* Alt text + width (always visible) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Alt Text</Label>
          <Input
            value={(data.alt as string) ?? ""}
            onChange={e => onUpdate({ ...data, alt: e.target.value } as ImageBlockData)}
            placeholder="Describe the image…"
            className="font-body text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Width</Label>
          <select
            value={(data.width as string) ?? "full"}
            onChange={e => onUpdate({ ...data, width: e.target.value } as ImageBlockData)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body"
          >
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
            <option value="quarter">Quarter Width</option>
          </select>
        </div>
      </div>

      {/* Preview — click the image itself to replace it */}
      {!!(data.url as string) && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group/preview">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Click to replace this image"
            className="block w-full"
          >
            <img
              src={data.url as string}
              alt={(data.alt as string) ?? ""}
              className="max-w-full max-h-64 object-contain mx-auto block"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
              <span className="flex items-center gap-1.5 bg-white/95 text-[#0F1C2E] text-xs font-display font-bold px-3 py-1.5 rounded-lg">
                <Upload size={12} />Replace
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ ...data, url: "" } as ImageBlockData)}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            title="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Video Block Editor ───────────────────────────────────────────────────────

/**
 * VideoBlockEditor — allows uploading a video from desktop or embedding via URL.
 * Desktop uploads use trpc.uploads.uploadBase64.
 */
function VideoBlockEditor({
  data,
  onUpdate,
}: {
  data: Record<string, unknown>;
  onUpdate: (d: BlockData) => void;
}) {
  const [mode, setMode] = useState<"upload" | "url">((data.url as string) ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBase64 = { mutateAsync: mockUploadFile };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        setUploadError("Please select a video file (MP4, MOV, WebM).");
        return;
      }
      // 200 MB limit for videos
      if (file.size > 200 * 1024 * 1024) {
        setUploadError("Video must be under 200 MB.");
        return;
      }

      setUploadError(null);
      setUploading(true);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadBase64.mutateAsync({
          base64,
          filename: file.name,
          mimeType: file.type,
          folder: "videos",
        });

        onUpdate({ ...data, url: result.url, caption: (data.caption as string) ?? "" } as VideoBlockData);
        setMode("url");
      } catch (err) {
        setUploadError("Upload failed. Please try again.");
        console.error("[VideoBlockEditor] upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [data, onUpdate, uploadBase64]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const embedUrl = (data.url as string) ? getVideoEmbedUrl(data.url as string) : "";
  const isEmbed = embedUrl !== (data.url as string); // true if it's a YouTube/Vimeo URL

  return (
    <div
      className={cn("p-4 space-y-3 rounded-lg transition-colors", dragging && "bg-[#0047AB]/5 ring-2 ring-[#0047AB]/30")}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors",
            mode === "upload"
              ? "bg-[#0047AB] text-white border-[#0047AB]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#0047AB] hover:text-[#0047AB]"
          )}
        >
          <Upload size={12} />Upload from Desktop
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-colors",
            mode === "url"
              ? "bg-[#0047AB] text-white border-[#0047AB]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#0047AB] hover:text-[#0047AB]"
          )}
        >
          <Link2 size={12} />Embed from URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-colors group",
              dragging ? "border-[#0047AB] bg-[#0047AB]/5" : "border-gray-300 hover:border-[#0047AB]"
            )}
          >
            {uploading ? (
              <>
                <Loader2 size={24} className="text-[#0047AB] animate-spin" />
                <span className="text-sm font-body text-gray-500">Uploading… this may take a moment</span>
              </>
            ) : (
              <>
                <Film size={24} className="text-gray-400 group-hover:text-[#0047AB] transition-colors" />
                <span className="text-sm font-display font-bold text-gray-600 group-hover:text-[#0047AB] transition-colors">
                  Click to select or drag & drop a video
                </span>
                <span className="text-[11px] font-body text-gray-400">MP4, MOV, WebM — max 200 MB</span>
              </>
            )}
          </button>
          {uploadError && (
            <p className="text-xs text-red-600 font-body mt-1">{uploadError}</p>
          )}
        </div>
      )}

      {/* URL / embed mode */}
      {mode === "url" && (
        <div className="space-y-1">
          <Label className="text-xs font-display font-bold text-gray-600">Video URL</Label>
          <Input
            value={(data.url as string) ?? ""}
            onChange={e => onUpdate({ ...data, url: e.target.value } as VideoBlockData)}
            placeholder="https://www.youtube.com/watch?v=... or Vimeo URL"
            className="font-body text-sm"
          />
          <p className="text-[10px] text-gray-400 font-body">Supports YouTube, Vimeo, and direct video links.</p>
        </div>
      )}

      {/* Caption */}
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Caption (optional)</Label>
        <Input
          value={(data.caption as string) ?? ""}
          onChange={e => onUpdate({ ...data, caption: e.target.value } as VideoBlockData)}
          placeholder="Video caption…"
          className="font-body text-sm"
        />
      </div>

      {/* Preview */}
      {!!(data.url as string) && (
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
          {isEmbed ? (
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                title="Video preview"
              />
            </div>
          ) : (
            <video
              src={data.url as string}
              controls
              className="w-full max-h-64"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── PDF Block Editor ─────────────────────────────────────────────────────────

/**
 * PdfBlockEditor — desktop-only PDF upload.
 * URL input option is intentionally omitted per Session 15 requirements.
 */
function PdfBlockEditor({
  data,
  onUpdate,
}: {
  data: Record<string, unknown>;
  onUpdate: (d: BlockData) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBase64 = { mutateAsync: mockUploadFile };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        setUploadError("Please select a PDF file.");
        return;
      }
      // 50 MB limit for PDFs
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("PDF must be under 50 MB.");
        return;
      }

      setUploadError(null);
      setUploading(true);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadBase64.mutateAsync({
          base64,
          filename: file.name,
          mimeType: "application/pdf",
          folder: "pdfs",
        });

        onUpdate({
          ...data,
          url: result.url,
          title: (data.title as string) || file.name.replace(/\.pdf$/i, ""),
        } as PdfBlockData);
      } catch (err) {
        setUploadError("Upload failed. Please try again.");
        console.error("[PdfBlockEditor] upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [data, onUpdate, uploadBase64]
  );

  return (
    <div className="p-4 space-y-3">
      {/* Upload zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl transition-colors group"
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="text-red-500 animate-spin" />
            <span className="text-sm font-body text-gray-500">Uploading PDF…</span>
          </>
        ) : (
          <>
            <FileText size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-display font-bold text-gray-600 group-hover:text-red-600 transition-colors">
              {(data.url as string) ? "Replace PDF" : "Click to upload a PDF"}
            </span>
            <span className="text-[11px] font-body text-gray-400">PDF files only — max 50 MB</span>
          </>
        )}
      </button>
      {uploadError && (
        <p className="text-xs text-red-600 font-body">{uploadError}</p>
      )}

      {/* Document title */}
      <div className="space-y-1">
        <Label className="text-xs font-display font-bold text-gray-600">Document Title</Label>
        <Input
          value={(data.title as string) ?? ""}
          onChange={e => onUpdate({ ...data, title: e.target.value } as PdfBlockData)}
          placeholder="e.g. Fall Protection Safety Manual"
          className="font-body text-sm"
        />
      </div>

      {/* Downloadable toggle */}
      <div className="flex items-center gap-2">
        <Switch
          checked={(data.downloadable as boolean) ?? true}
          onCheckedChange={v => onUpdate({ ...data, downloadable: v } as PdfBlockData)}
        />
        <Label className="text-xs font-body text-gray-600">Allow employees to download this document</Label>
      </div>

      {/* Uploaded file preview */}
      {!!(data.url as string) && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <FileText size={20} className="text-red-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-bold text-red-800 truncate">
              {(data.title as string) || "PDF Document"}
            </p>
            <p className="text-[10px] text-red-500 font-body truncate">{data.url as string}</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ ...data, url: "" } as PdfBlockData)}
            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            title="Remove PDF"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
