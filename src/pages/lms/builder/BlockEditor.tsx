/* ============================================================
   BLOCK EDITOR — Individual block rendering and editing
   ============================================================ */
import { useState, useCallback, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, ChevronDown, ChevronUp,
  Type, Video, Image, FileText, Package, CheckSquare,
  ThumbsUp, FileCheck, PenLine, Info, AlertTriangle, Lightbulb,
  HelpCircle, Plus, X, Upload, Link2, Loader2, Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockUploadFile } from "../mockData";
import type {
  DraftBlock, BlockType, BlockData,
  TextBlockData, VideoBlockData, ImageBlockData, PdfBlockData,
  ResourceBlockData, ChecklistBlockData, AcknowledgmentBlockData,
  PolicyAckBlockData, CalloutBlockData, WarningBlockData, SafetyTipBlockData,
  CanvasSlideData, FillInTheBlankData, DragDropData,
} from "./types";
import { RichTextEditor } from "./RichTextEditor";
import { SlideCanvas } from "./SlideCanvas";
import { FillInTheBlankEditor, DragDropEditor } from "./InteractiveQuestions";

// ─── Block type metadata ──────────────────────────────────────────────────────

export const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: "text", label: "Text / Rich Content", icon: <Type size={16} />, description: "Paragraphs, headings, lists, and formatted text", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { type: "video", label: "Video", icon: <Video size={16} />, description: "YouTube, Vimeo, or direct video URL", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { type: "image", label: "Image", icon: <Image size={16} />, description: "Photo, diagram, or infographic", color: "bg-green-50 text-green-600 border-green-200" },
  { type: "pdf", label: "PDF Document", icon: <FileText size={16} />, description: "Safety manual, SOP, or reference document", color: "bg-red-50 text-red-600 border-red-200" },
  { type: "resource", label: "Resource / Download", icon: <Package size={16} />, description: "Downloadable file or external link", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { type: "checklist", label: "Safety Checklist", icon: <CheckSquare size={16} />, description: "Interactive checklist employees must complete", color: "bg-teal-50 text-teal-600 border-teal-200" },
  { type: "acknowledgment", label: "Acknowledgment", icon: <ThumbsUp size={16} />, description: "Employee confirms they understand the content", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { type: "policy_ack", label: "Policy Acknowledgment", icon: <FileCheck size={16} />, description: "Employee reads and acknowledges a policy", color: "bg-violet-50 text-violet-600 border-violet-200" },
  { type: "signature", label: "Signature Block", icon: <PenLine size={16} />, description: "Employee types their name as a digital signature", color: "bg-pink-50 text-pink-600 border-pink-200" },
  // callout block removed per Session 15 (may be re-added later)
  { type: "warning", label: "Warning / Danger Box", icon: <AlertTriangle size={16} />, description: "Safety warning, caution, or danger notice", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { type: "safety_tip", label: "Safety Tip", icon: <Lightbulb size={16} />, description: "Quick safety reminder or best practice", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { type: "quiz_question", label: "Quiz Question", icon: <HelpCircle size={16} />, description: "Inline knowledge check question", color: "bg-rose-50 text-rose-600 border-rose-200" },
  // canvas_slide removed per Session 15 (advanced editor planned for later)
  { type: "quiz_fitb", label: "Fill in the Blank", icon: <Type size={16} />, description: "Type the missing word(s)", color: "bg-violet-50 text-violet-600 border-violet-200" },
  { type: "quiz_dragdrop", label: "Drag & Drop", icon: <CheckSquare size={16} />, description: "Drag words from a word bank into blanks", color: "bg-teal-50 text-teal-600 border-teal-200" },
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

export function BlockWrapper({ block, isSelected, onSelect, onDelete, onUpdate, children }: BlockWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = getBlockMeta(block.type);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

// ─── Quiz question editor ─────────────────────────────────────────────────────

function QuizQuestionEditor({ data, onUpdate }: { data: Record<string, unknown>; onUpdate: (d: BlockData) => void }) {
  const q = (data.question as import("./types").QuizQuestion) ?? {
    id: crypto.randomUUID(), type: "multiple_choice", question: "", options: ["", "", "", ""], correctIndices: [0],
  };

  const update = (patch: Partial<import("./types").QuizQuestion>) => {
    onUpdate({ question: { ...q, ...patch } });
  };

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
            <option value="scenario">Scenario-Based</option>
            <option value="hazard_recognition">Hazard Recognition</option>
            <option value="ppe_selection">PPE Selection</option>
            <option value="incident_scenario">Incident Scenario</option>
          </select>
        </div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBase64 = { mutateAsync: mockUploadFile };

  /** Handle file selected from desktop */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate MIME type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file (JPG, PNG, GIF, WebP).");
        return;
      }
      // 10 MB limit
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Image must be under 10 MB.");
        return;
      }

      setUploadError(null);
      setUploading(true);

      try {
        // Read as base64
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

  return (
    <div className="p-4 space-y-3">
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

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 hover:border-[#0047AB] rounded-xl transition-colors group"
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
                  Click to select an image
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

      {/* Preview */}
      {!!(data.url as string) && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={data.url as string}
            alt={(data.alt as string) ?? ""}
            className="max-w-full max-h-64 object-contain mx-auto block"
          />
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBase64 = { mutateAsync: mockUploadFile };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

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

  const embedUrl = (data.url as string) ? getVideoEmbedUrl(data.url as string) : "";
  const isEmbed = embedUrl !== (data.url as string); // true if it's a YouTube/Vimeo URL

  return (
    <div className="p-4 space-y-3">
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
            className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 hover:border-[#0047AB] rounded-xl transition-colors group"
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
                  Click to select a video
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
