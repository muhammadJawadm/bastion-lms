/*
 * LMSBuilder — Bastion Risk & Safety Group Course Builder
 *
 * Three-panel layout:
 *   LEFT  — Course → Lesson → Pages hierarchy with "Add Page" and "Add Lesson" buttons
 *   CENTER — Active page editor: one page/slide at a time with canvas toolbar
 *   RIGHT  — Page / Lesson / Course settings panel
 *
 * Key improvements (Session 14):
 *   1. Rich text blocks use true placeholder text (no fake default content)
 *   2. Builder is page-based: each lesson has pages; user builds one page at a time
 *   3. Left sidebar shows Course → Lesson → Pages hierarchy with clear Add Page / Add Lesson buttons
 *   4. Canvas slide has a real toolbar above it for adding text, images, video
 *   5. Sidebar scroll fixed so all pages are always accessible
 *   6. "Preview as Learner" button shows course without editing tools
 *   7. Publish flow: shows published state confirmation, allows returning to edit
 *   8. Quiz answer options use placeholder text (not real "Option A" text)
 *   9. OSHA reference field is optional and collapsible
 *  10. Text blocks have improved contrast and Bastion branding
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, arrayMove,
  horizontalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, BookOpen, ChevronDown, ChevronRight, FileText,
  GripVertical, Layers, Loader2, Plus, Save, Settings,
  Shield, Trash2, Video, AlertTriangle, CheckSquare, Image,
  Paperclip, Globe, Lock, Archive, Eye, LayoutList, X,
  Type, FilePlus, Layout, CheckCircle2, Edit3,
  Monitor, Smartphone, Search, MousePointerClick, ShieldAlert, ListChecks,
  Undo2, Redo2, Copy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

import type { DraftBlock, BlockType, BlockData, CanvasSlideData } from "./builder/types";
import { BlockEditorContent, BLOCK_TYPES, getDefaultData } from "./builder/BlockEditor";
import { CoursePreview } from "./builder/CoursePreview";
import { TemplateLibrary } from "./builder/SlideTemplates";
import { createTextElement, createImageElement, createVideoElement } from "./builder/SlideCanvas";
import {
  type MockCourse, type MockLesson,
  coursesStore, getCourse, patchCourse,
  getLessonsByCourse, addLesson, patchLesson, removeLesson,
  getModulesByCourse, addModule, removeModule,
  getBlocksByLesson, addBlock as storeAddBlock, patchBlock, removeBlock as storeRemoveBlock, reorderBlocks,
} from "./mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

type LessonType = "text" | "video_embed" | "video_upload" | "pdf" | "quiz" | "image" | "resource" | "slides";

interface ActiveLesson extends MockLesson {
  isDirty?: boolean;
}

// ─── Lesson type icon ─────────────────────────────────────────────────────────

function LessonTypeIcon({ type, size = 14 }: { type: LessonType; size?: number }) {
  switch (type) {
    case "video_embed": case "video_upload": return <Video size={size} />;
    case "pdf": return <FileText size={size} />;
    case "quiz": return <CheckSquare size={size} />;
    case "image": return <Image size={size} />;
    case "resource": return <Paperclip size={size} />;
    case "slides": return <Layers size={size} />;
    default: return <BookOpen size={size} />;
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
    published: { label: "Published", className: "bg-green-100 text-green-700" },
    archived: { label: "Archived", className: "bg-amber-100 text-amber-700" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={cn("text-[10px] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-widest", s.className)}>
      {s.label}
    </span>
  );
}

// ─── Block type picker ────────────────────────────────────────────────────────

/**
 * The seven block types the redesign brief calls out as most common —
 * shown first, unsectioned, before the grouped "More blocks" disclosure.
 */
const MOST_USED_TYPES: BlockType[] = ["text", "image", "video", "pdf", "assignment", "checklist", "quiz_question", "signature"];

/**
 * BlockPicker — full-screen overlay panel for adding a new content block.
 * Neutral cards throughout; Royal Blue applies only on hover/focus/selection.
 * Search filters across all block types; "Most Used" surfaces the seven most
 * common blocks up front, with the remainder grouped under a collapsible
 * "More blocks" disclosure that auto-expands while searching.
 */
function BlockPicker({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  // Groups: canvas_slide and callout removed per Session 15.
  const groups: { label: string; icon: React.ElementType; types: BlockType[] }[] = [
    { label: "Content", icon: FileText, types: ["text", "video", "image", "pdf", "assignment", "resource"] },
    { label: "Interactive", icon: MousePointerClick, types: ["checklist", "acknowledgment", "policy_ack", "signature"] },
    { label: "Safety", icon: ShieldAlert, types: ["warning", "safety_tip"] },
    { label: "Assessment", icon: ListChecks, types: ["quiz_question", "quiz_fitb", "quiz_dragdrop"] },
  ];

  const q = search.trim().toLowerCase();
  const matches = (type: BlockType): boolean => {
    if (!q) return true;
    const meta = BLOCK_TYPES.find(b => b.type === type);
    return !!meta && (meta.label.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q));
  };

  const mostUsedTypes = MOST_USED_TYPES.filter(matches);
  const moreGroups = groups
    .map(g => ({ ...g, types: g.types.filter(t => !MOST_USED_TYPES.includes(t) && matches(t)) }))
    .filter(g => g.types.length > 0);
  const showMore = moreOpen || q.length > 0;
  const noResults = q.length > 0 && mostUsedTypes.length === 0 && moreGroups.length === 0;

  const renderCard = (type: BlockType) => {
    const meta = BLOCK_TYPES.find(b => b.type === type)!;
    return (
      <button
        key={type}
        onClick={() => { onAdd(type); onClose(); }}
        className="flex flex-col items-start gap-1.5 p-3 rounded-lg border border-gray-200 bg-white text-left transition-colors hover:border-[#0047AB] hover:bg-[#0047AB]/5 focus-visible:border-[#0047AB] focus-visible:bg-[#0047AB]/5 focus:outline-none"
      >
        <span className="text-gray-500">{meta.icon}</span>
        <div>
          <p className="text-xs font-display font-bold text-[#0F1C2E] leading-tight">{meta.label}</p>
          <p className="text-[10px] font-body text-gray-400 mt-0.5 leading-snug line-clamp-2">{meta.description}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(15,28,46,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="flex-1" onClick={onClose} />
      <div className="bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-display font-bold text-[#0047AB] hover:text-[#1565C0] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <h2 className="font-display font-bold text-[#0F1C2E] text-base">Add Content to Page</h2>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search block types — image, quiz, signature..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm font-body focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB]/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* ── Blank / Custom Page ── */}
          {!q && (
            <button
              onClick={() => { onAdd("text"); onClose(); }}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0047AB] hover:bg-[#0047AB]/5 text-left transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-[#0047AB]/10 flex items-center justify-center shrink-0 transition-colors">
                <FilePlus size={18} className="text-gray-400 group-hover:text-[#0047AB]" />
              </div>
              <div>
                <p className="text-sm font-display font-bold text-[#0F1C2E] group-hover:text-[#0047AB] transition-colors">Blank Page</p>
                <p className="text-[11px] font-body text-gray-400 mt-0.5">Start empty — add text, images, video, or quiz content as needed</p>
              </div>
            </button>
          )}

          {/* ── Most Used ── */}
          {mostUsedTypes.length > 0 && (
            <div>
              <p className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest mb-2.5">Most Used</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mostUsedTypes.map(renderCard)}
              </div>
            </div>
          )}

          {/* ── More blocks (grouped, collapsible) ── */}
          {moreGroups.length > 0 && (
            <div>
              {!q && (
                <button
                  onClick={() => setMoreOpen(o => !o)}
                  className="flex items-center gap-1.5 text-xs font-display font-bold text-gray-400 uppercase tracking-widest mb-2.5 hover:text-[#0047AB] transition-colors"
                >
                  <ChevronRight size={12} className={cn("transition-transform", moreOpen && "rotate-90")} />
                  More Blocks
                </button>
              )}
              {showMore && (
                <div className="space-y-5">
                  {moreGroups.map(group => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.label}>
                        <p className="text-[11px] font-display font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <GroupIcon size={12} />
                          {group.label}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.types.map(renderCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {noResults && (
            <p className="text-sm text-gray-400 text-center py-8">No block types match "{search}".</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Canvas Toolbar ───────────────────────────────────────────────────────────

/**
 * CanvasToolbar — toolbar shown above a canvas_slide block.
 * Provides buttons to add text, image, video, and shape elements to the canvas.
 */
function CanvasToolbar({ onAddElement }: {
  onAddElement: (type: "text" | "image" | "video" | "shape") => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0F1C2E] border-b border-white/10 rounded-t-lg">
      <span className="text-[10px] font-display font-bold text-white/50 uppercase tracking-widest mr-2">Canvas</span>
      <button
        onClick={() => onAddElement("text")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-[#0047AB] text-white text-xs font-display font-bold transition-colors"
        title="Add text element"
      >
        <Type size={12} />
        <span>Text</span>
      </button>
      <button
        onClick={() => onAddElement("image")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-[#0047AB] text-white text-xs font-display font-bold transition-colors"
        title="Add image element"
      >
        <Image size={12} />
        <span>Image</span>
      </button>
      <button
        onClick={() => onAddElement("video")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-[#0047AB] text-white text-xs font-display font-bold transition-colors"
        title="Add video element"
      >
        <Video size={12} />
        <span>Video</span>
      </button>
      <span className="text-white/20 text-xs ml-1">|</span>
      <span className="text-white/40 text-[10px] font-body ml-1">Click an element on the canvas to select and edit it</span>
    </div>
  );
}

// ─── Published confirmation banner ───────────────────────────────────────────

/**
 * PublishedBanner — shown when a course has been published.
 * Confirms the course is live and provides options to preview or return to editing.
 */
function PublishedBanner({ courseTitle, onEdit, onPreview }: {
  courseTitle: string;
  onEdit: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#F4F6F8]">
      <div className="text-center max-w-md px-6">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="font-display font-extrabold text-[#0F1C2E] text-2xl mb-2">Course Published!</h2>
        <p className="text-gray-500 font-body text-sm leading-relaxed mb-6">
          <strong className="text-[#0F1C2E]">{courseTitle}</strong> is now live and available to learners who are assigned to it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase"
            onClick={onPreview}
          >
            <Eye size={14} className="mr-1.5" />Preview as Learner
          </Button>
          <Button
            variant="outline"
            className="border-[#0047AB] text-[#0047AB] hover:bg-blue-50 font-display font-bold text-xs tracking-widest uppercase"
            onClick={onEdit}
          >
            <Edit3 size={14} className="mr-1.5" />Continue Editing
          </Button>
        </div>
        <p className="text-gray-400 text-xs font-body mt-4">
          You can always return to edit mode and republish after making changes.
        </p>
      </div>
    </div>
  );
}

// ─── Page row in sidebar ──────────────────────────────────────────────────────

/**
 * PageRow — represents a single page/block in the left sidebar under a lesson.
 */
function PageRow({
  block, pageNumber, isActive, onClick, onDelete,
}: {
  block: DraftBlock;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const typeLabel = block.type === "canvas_slide" ? "Canvas" :
    block.type === "text" ? "Text" :
    block.type === "video" ? "Video" :
    block.type === "quiz_question" ? "Quiz" :
    block.type === "quiz_fitb" ? "FITB" :
    block.type === "quiz_dragdrop" ? "Drag" :
    block.type === "image" ? "Image" :
    block.type === "pdf" ? "PDF" :
    block.type === "checklist" ? "Check" :
    block.type === "assignment" ? "Assign" :
    "Page";

  return (
    <div
      className={cn(
        "flex items-center gap-2 pl-8 pr-3 py-1.5 cursor-pointer group transition-colors text-xs",
        isActive
          ? "bg-[#0047AB]/15 border-r-2 border-[#0047AB]"
          : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <Layout size={10} className={cn("shrink-0", isActive ? "text-[#0047AB]" : "text-gray-300")} />
      <span className={cn("flex-1 font-body truncate", isActive ? "text-[#0047AB] font-semibold" : "text-gray-500")}>
        Page {pageNumber}
        <span className="ml-1 text-[9px] opacity-60 uppercase">{typeLabel}</span>
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this page?")) onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

function LessonRow({
  lesson, isActive, isExpanded, onClick, onDelete, onToggle, pageCount,
}: {
  lesson: MockLesson;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onDelete: () => void;
  onToggle: () => void;
  pageCount: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 cursor-pointer group transition-colors",
        isActive ? "bg-[#0047AB]/10" : "hover:bg-gray-50"
      )}
    >
      <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-600">
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      <span className={cn("shrink-0", isActive ? "text-[#0047AB]" : "text-gray-400")}>
        <LessonTypeIcon type={lesson.type as LessonType} size={13} />
      </span>
      <span
        className={cn("flex-1 text-xs font-body truncate", isActive ? "text-[#0047AB] font-semibold" : "text-gray-700")}
        onClick={onClick}
      >
        {lesson.title}
      </span>
      <span className="text-[9px] text-gray-400 font-body shrink-0">{pageCount}p</span>
      <button
        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${lesson.title}"?`)) onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all shrink-0"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─── Lesson settings panel ────────────────────────────────────────────────────

function LessonSettingsPanel({
  lesson, title, required,
  onTitleChange, onRequiredChange,
  onDelete, onSave, isSaving,
}: {
  lesson: ActiveLesson;
  title: string;
  required: boolean;
  onTitleChange: (v: string) => void;
  onRequiredChange: (v: boolean) => void;
  onDelete: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="p-4 space-y-5">
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Lesson Title</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} className="font-body text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Type</Label>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <LessonTypeIcon type={lesson.type as LessonType} size={14} />
          <span className="text-sm font-body text-gray-700 capitalize">{lesson.type.replace("_", " ")}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Required</p>
          <p className="text-gray-400 text-xs font-body mt-0.5">Must complete to progress</p>
        </div>
        <Switch checked={required} onCheckedChange={onRequiredChange} />
      </div>
      <Separator />
      <Button className="w-full bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase" onClick={onSave} disabled={isSaving}>
        {isSaving ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
        Save Lesson
      </Button>
      <Button variant="outline" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 font-display font-bold text-xs tracking-widest uppercase" onClick={onDelete}>
        <Trash2 size={12} className="mr-1" />Delete Lesson
      </Button>
    </div>
  );
}

// ─── Course settings panel ────────────────────────────────────────────────────

function CourseSettingsPanel({
  title, description, passScore, issuesCertificate, certificateTitle, duration, status, isDemo,
  onTitleChange, onDescChange, onPassScoreChange, onIssuesCertChange, onCertificateTitleChange,
  onDurationChange, onStatusChange, onIsDemoChange, onSave, isSaving, totalLessons, totalMinutes,
}: {
  title: string; description: string; passScore: number; issuesCertificate: boolean; certificateTitle: string;
  duration: number; status: "draft" | "published" | "archived"; isDemo: boolean;
  onTitleChange: (v: string) => void; onDescChange: (v: string) => void;
  onPassScoreChange: (v: number) => void; onIssuesCertChange: (v: boolean) => void;
  onCertificateTitleChange: (v: string) => void;
  onDurationChange: (v: number) => void; onStatusChange: (v: "draft" | "published" | "archived") => void;
  onIsDemoChange: (v: boolean) => void;
  onSave: () => void; isSaving: boolean; totalLessons: number; totalMinutes: number;
}) {
  return (
    <div className="p-4 space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0047AB]/5 rounded-lg p-3 text-center">
          <div className="font-display font-extrabold text-[#0047AB] text-xl">{totalLessons}</div>
          <div className="text-gray-500 text-[10px] font-body mt-0.5">Lessons</div>
        </div>
        <div className="bg-[#0047AB]/5 rounded-lg p-3 text-center">
          <div className="font-display font-extrabold text-[#0047AB] text-xl">{totalMinutes}</div>
          <div className="text-gray-500 text-[10px] font-body mt-0.5">Minutes</div>
        </div>
      </div>
      <Separator />
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Title</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} className="font-body text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Description</Label>
        <Textarea value={description} onChange={(e) => onDescChange(e.target.value)} rows={3} className="font-body text-sm resize-none" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Status</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as "draft" | "published" | "archived")}>
          <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft"><span className="flex items-center gap-2"><Lock size={12} />Draft</span></SelectItem>
            <SelectItem value="published"><span className="flex items-center gap-2"><Globe size={12} />Published</span></SelectItem>
            <SelectItem value="archived"><span className="flex items-center gap-2"><Archive size={12} />Archived</span></SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Pass Score (%)</Label>
        <Input type="number" min={0} max={100} value={passScore} onChange={(e) => onPassScoreChange(Number(e.target.value))} className="font-body text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Duration (min)</Label>
        <Input type="number" min={1} value={duration} onChange={(e) => onDurationChange(Number(e.target.value))} className="font-body text-sm" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Issue Certificate</p>
          <p className="text-gray-400 text-xs font-body mt-0.5">On course completion</p>
        </div>
        <Switch checked={issuesCertificate} onCheckedChange={onIssuesCertChange} />
      </div>
      {issuesCertificate && (
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Certificate Title</Label>
          <Input
            value={certificateTitle}
            onChange={(e) => onCertificateTitleChange(e.target.value)}
            placeholder="e.g. OSHA 10-Hour Construction Safety"
            className="font-body text-sm"
          />
          <p className="text-gray-400 text-[11px] font-body">What prints on the employee's certificate — can differ from the internal course title.</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Demo Course</p>
          <p className="text-gray-400 text-xs font-body mt-0.5">Visible to trial accounts</p>
        </div>
        <Switch checked={isDemo} onCheckedChange={onIsDemoChange} />
      </div>
      <Separator />
      <Button className="w-full bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase" onClick={onSave} disabled={isSaving}>
        {isSaving ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
        Save Settings
      </Button>
    </div>
  );
}

// ─── Sortable page tab (center canvas page-navigation bar) ───────────────────

/**
 * SortablePageTab — one "Page N" tab in the center canvas's page-navigation
 * bar. Draggable via dnd-kit (mouse via the grip handle, keyboard via Tab +
 * Space to pick up, then arrow keys to move — dnd-kit's KeyboardSensor).
 */
function SortablePageTab({
  block, index, isActive, onSelect, onDuplicate, onDelete,
}: {
  block: DraftBlock;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "shrink-0 flex items-center rounded-md border text-xs font-display font-bold transition-colors",
        isActive
          ? "bg-[#0047AB] border-[#0047AB] text-white"
          : "bg-white border-gray-200 text-gray-500 hover:border-[#0047AB] hover:text-[#0047AB]"
      )}
    >
      {/* Drag handle — mouse and keyboard (dnd-kit KeyboardSensor) */}
      <button
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        className="pl-2 pr-0.5 py-1.5 cursor-grab active:cursor-grabbing touch-none opacity-60 hover:opacity-100"
      >
        <GripVertical size={11} />
      </button>
      {/* Page label button */}
      <button onClick={onSelect} className="px-1.5 py-1.5">
        Page {index + 1}
      </button>
      {/* Duplicate / delete — only visible when this page is active */}
      {isActive && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Duplicate this page"
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <Copy size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete this page"
            className="pr-2 pl-0.5 py-1.5 text-white/70 hover:text-red-300 transition-colors"
          >
            <X size={11} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LMSBuilder() {
  const params = useParams<{ courseId?: string }>();
  const courseId = params.courseId ? Number(params.courseId) : 0;
  const [, navigate] = useLocation();

  // The sidebar "Course Builder" nav item links here with no course ID
  // (a builder needs a specific course). Land on the first available course
  // instead of an empty "course not found" screen.
  useEffect(() => {
    if (!params.courseId && coursesStore.length > 0) {
      navigate(`/lms/builder/${coursesStore[0].id}`, { replace: true });
    }
  }, [params.courseId, navigate]);

  // ── Data (static mock store, no network calls) ──
  // Re-read on every render from the shared mock store so edits made here
  // (and courses created on the catalogue page) are reflected immediately.
  const course = getCourse(courseId);
  const loadingCourse = false;
  const allLessons = getLessonsByCourse(courseId);
  const loadingLessons = false;
  const modules = getModulesByCourse(courseId);
  const loadingModules = false;

  // ── Active lesson + active page (block) ──
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // ── Sidebar expansion state ──
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  // ── Dialog state ──
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showAddLesson, setShowAddLesson] = useState<{ moduleId: number | null } | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState<LessonType>("text");

  // ── UI state ──
  const [isSaving, setIsSaving] = useState(false);
  const [rightPanel, setRightPanel] = useState<"page" | "lesson" | "course">("lesson");
  const [showPreview, setShowPreview] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  /** When true, show the published confirmation screen instead of the editor */
  const [showPublishedScreen, setShowPublishedScreen] = useState(false);
  /** Device preview mode for the center canvas: desktop or mobile */
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // ── Block canvas state ──
  const [blocks, setBlocks] = useState<DraftBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blocksDirty, setBlocksDirty] = useState(false);

  // ── Autosave status ("idle" | "saving" | "saved") ──
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ── Undo/redo history for the active lesson's pages ──
  const [blockHistory, setBlockHistory] = useState<{ stack: DraftBlock[][]; index: number }>({ stack: [], index: -1 });
  /** Set right before an undo/redo replaces `blocks`, so the history-commit effect skips re-recording it. */
  const isApplyingHistoryRef = useRef(false);

  // ── Course edit state ──
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [coursePassScore, setCoursePassScore] = useState(80);
  const [courseIssuesCert, setCourseIssuesCert] = useState(true);
  const [courseCertTitle, setCourseCertTitle] = useState("");
  const [courseDuration, setCourseDuration] = useState(30);
  const [courseStatus, setCourseStatus] = useState<"draft" | "published" | "archived">("draft");
  const [courseIsDemo, setCourseIsDemo] = useState(false);

  // ── Lesson edit state ──
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonRequired, setLessonRequired] = useState(true);

  // ── Load blocks for active lesson (static mock store) ──
  useEffect(() => {
    if (activeLesson !== null) {
      const blocksData = getBlocksByLesson(activeLesson.id);
      const draftBlocks: DraftBlock[] = blocksData.map(b => ({
        id: String(b.id),
        dbId: b.id,
        lessonId: b.lessonId,
        type: b.type as BlockType,
        data: (b.data ?? {}) as BlockData,
        sortOrder: b.sortOrder,
      }));
      setBlocks(draftBlocks);
      setBlocksDirty(false);
      // Reset undo/redo history for the newly loaded lesson.
      isApplyingHistoryRef.current = true;
      setBlockHistory({ stack: [draftBlocks], index: 0 });
      // Auto-select first page when lesson loads
      if (draftBlocks.length > 0 && !activeBlockId) {
        setActiveBlockId(draftBlocks[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.id]);

  // ── Debounced undo/redo history commit ──
  // Watches `blocks` and, ~500ms after edits settle, checkpoints a snapshot.
  // Skipped when the change came from undo/redo itself (isApplyingHistoryRef)
  // so navigating history doesn't truncate the redo stack.
  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }
    if (!activeLesson) return;
    const t = setTimeout(() => {
      setBlockHistory(prev => {
        const trimmed = prev.stack.slice(0, prev.index + 1);
        const nextStack = [...trimmed, blocks];
        const capped = nextStack.length > 50 ? nextStack.slice(nextStack.length - 50) : nextStack;
        return { stack: capped, index: capped.length - 1 };
      });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const handleUndo = useCallback(() => {
    if (blockHistory.index <= 0) return;
    const newIndex = blockHistory.index - 1;
    isApplyingHistoryRef.current = true;
    setBlocks(blockHistory.stack[newIndex]);
    setBlocksDirty(true);
    setBlockHistory(prev => ({ ...prev, index: newIndex }));
  }, [blockHistory]);

  const handleRedo = useCallback(() => {
    if (blockHistory.index >= blockHistory.stack.length - 1) return;
    const newIndex = blockHistory.index + 1;
    isApplyingHistoryRef.current = true;
    setBlocks(blockHistory.stack[newIndex]);
    setBlocksDirty(true);
    setBlockHistory(prev => ({ ...prev, index: newIndex }));
  }, [blockHistory]);

  // ── Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo.
  // Ignored while focus is in a text field / contenteditable so native and
  // Tiptap's own in-editor undo (character-level) still work as expected —
  // this shortcut is for page-level structural changes only.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable = !!target && (
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
      );
      if (isEditable) return;
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleBlockDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks(prev => {
      const oldIdx = prev.findIndex(b => b.id === active.id);
      const newIdx = prev.findIndex(b => b.id === over.id);
      return arrayMove(prev, oldIdx, newIdx).map((b, i) => ({ ...b, sortOrder: i }));
    });
    setBlocksDirty(true);
  }, []);

  // ── Block mutations (static mock store, no network calls) ──
  // Aliased on import as storeAddBlock/storeRemoveBlock — this component
  // already has its own local addBlock/removeBlock UI handlers below.
  const createBlock = {
    mutateAsync: async (input: { lessonId: number; type: string; data: any; sortOrder: number }) => storeAddBlock(input),
  };
  const updateBlock = {
    mutateAsync: async (input: { id: number; data: any }) => patchBlock(input.id, { data: input.data }),
  };
  const deleteBlock = {
    mutateAsync: async (input: { id: number }) => storeRemoveBlock(input.id),
  };
  const reorderBlocksMutation = {
    mutateAsync: async (input: { lessonId: number; orderedIds: number[] }) => reorderBlocks(input.lessonId, input.orderedIds),
  };

  /** Add a new page (block) to the current lesson */
  const addBlock = useCallback(async (type: BlockType) => {
    if (!activeLesson) return;
    const defaultData = getDefaultData(type);
    try {
      const result = await createBlock.mutateAsync({
        lessonId: activeLesson.id,
        type: type as "text" | "video" | "image" | "pdf" | "resource" | "checklist" | "acknowledgment" | "policy_ack" | "signature" | "callout" | "warning" | "safety_tip" | "quiz_question" | "canvas_slide" | "quiz_fitb" | "quiz_dragdrop",
        data: defaultData,
        sortOrder: blocks.length,
      });
      const newBlock: DraftBlock = {
        id: String(result.id),
        dbId: result.id,
        lessonId: activeLesson.id,
        type,
        data: defaultData,
        sortOrder: blocks.length,
      };
      setBlocks(prev => [...prev, newBlock]);
      setActiveBlockId(String(result.id));
      setSelectedBlockId(String(result.id));
      toast.success("Page added");
    } catch {
      toast.error("Failed to add page");
    }
  }, [activeLesson, blocks.length, createBlock]);

  const updateBlockData = useCallback((blockId: string, data: BlockData) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, data, isDirty: true } : b));
    setBlocksDirty(true);
  }, []);

  const removeBlock = useCallback(async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block?.dbId) return;
    try {
      await deleteBlock.mutateAsync({ id: block.dbId });
      setBlocks(prev => {
        const remaining = prev.filter(b => b.id !== blockId);
        // Auto-select adjacent page after deletion
        if (activeBlockId === blockId && remaining.length > 0) {
          const deletedIdx = prev.findIndex(b => b.id === blockId);
          const nextIdx = Math.min(deletedIdx, remaining.length - 1);
          setActiveBlockId(remaining[nextIdx].id);
        } else if (remaining.length === 0) {
          setActiveBlockId(null);
        }
        return remaining;
      });
      if (selectedBlockId === blockId) setSelectedBlockId(null);
      toast.success("Page removed");
    } catch {
      toast.error("Failed to remove page");
    }
  }, [blocks, deleteBlock, selectedBlockId, activeBlockId]);

  /** Duplicate a page, inserting the copy immediately after the original. */
  const duplicateBlock = useCallback(async (blockId: string) => {
    if (!activeLesson) return;
    const source = blocks.find(b => b.id === blockId);
    if (!source) return;
    try {
      const result = await createBlock.mutateAsync({
        lessonId: activeLesson.id,
        type: source.type,
        data: source.data,
        sortOrder: blocks.length,
      });
      const newBlock: DraftBlock = {
        id: String(result.id),
        dbId: result.id,
        lessonId: activeLesson.id,
        type: source.type,
        data: source.data,
        sortOrder: blocks.length,
      };
      setBlocks(prev => {
        const idx = prev.findIndex(b => b.id === blockId);
        const next = [...prev];
        next.splice(idx + 1, 0, newBlock);
        return next.map((b, i) => ({ ...b, sortOrder: i }));
      });
      setActiveBlockId(newBlock.id);
      setSelectedBlockId(newBlock.id);
      setBlocksDirty(true);
      toast.success("Page duplicated");
    } catch {
      toast.error("Failed to duplicate page");
    }
  }, [activeLesson, blocks, createBlock]);

  /** Add an element to the active canvas_slide block */
  const addCanvasElement = useCallback((elementType: "text" | "image" | "video" | "shape") => {
    if (!activeBlockId) return;
    const block = blocks.find(b => b.id === activeBlockId);
    if (!block || block.type !== "canvas_slide") return;

    const canvasData = block.data as CanvasSlideData;
    let newElement;
    switch (elementType) {
      case "text":
        newElement = createTextElement({ x: 10, y: 10, w: 80, h: 20 });
        break;
      case "image":
        newElement = createImageElement({ x: 20, y: 20, w: 60, h: 50 });
        break;
      case "video":
        newElement = createVideoElement({ x: 10, y: 10, w: 80, h: 70 });
        break;
      default:
        return;
    }

    const updatedData: CanvasSlideData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    updateBlockData(activeBlockId, updatedData as BlockData);
  }, [activeBlockId, blocks, updateBlockData]);

  useEffect(() => {
    if (course) {
      setCourseTitle(course.title);
      setCourseDesc(course.description ?? "");
      setCoursePassScore(course.passScore ?? 80);
      setCourseIssuesCert(course.issuesCertificate ?? true);
      setCourseCertTitle(course.certificateTitle ?? course.title);
      setCourseDuration(course.durationMinutes ?? 30);
      setCourseStatus(course.status as "draft" | "published" | "archived");
      setCourseIsDemo((course as { isDemo?: boolean }).isDemo ?? false);
    }
  }, [course]);

  useEffect(() => {
    if (activeLesson) {
      setLessonTitle(activeLesson.title);
      setLessonRequired(activeLesson.isRequired ?? true);
      setSelectedBlockId(null);
      // Block loading/reset for the new lesson is handled by the
      // `getBlocksByLesson` effect above (keyed on the same dependency).
    }
  }, [activeLesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations (static mock store, no network calls) ──
  const [, forceRender] = useState(0);
  const bump = () => forceRender((n) => n + 1);

  const updateCourse = {
    mutateAsync: async (input: { id: number } & Partial<MockCourse>) => {
      const { id, ...patch } = input;
      patchCourse(id, patch);
      toast.success("Course settings saved");
      bump();
    },
  };

  const createModule = {
    mutate: (input: { courseId: number; title: string; sortOrder: number }) => {
      addModule(input.courseId, input.title, input.sortOrder);
      setShowAddModule(false);
      setNewModuleTitle("");
      toast.success("Module added");
      bump();
    },
    isPending: false,
  };

  const deleteModule = {
    mutate: (input: { id: number }) => {
      removeModule(input.id);
      toast.success("Module deleted");
      bump();
    },
  };

  const createLesson = {
    mutate: (input: { courseId: number; moduleId?: number; title: string; type: LessonType; sortOrder: number }) => {
      const created = addLesson({
        courseId: input.courseId,
        moduleId: input.moduleId ?? null,
        title: input.title,
        type: input.type,
        sortOrder: input.sortOrder,
      });
      setShowAddLesson(null);
      const newLesson: ActiveLesson = { ...created };
      setActiveLesson(newLesson);
      setExpandedLessons(prev => { const n = new Set(Array.from(prev)); n.add(created.id); return n; });
      setNewLessonTitle("");
      setNewLessonType("text");
      toast.success("Lesson created");
    },
    isPending: false,
  };

  const updateLesson = {
    // No toast here — this backs both the manual Save button and autosave,
    // which fires on every settled edit. Feedback is the Saving/Saved
    // indicator in the lesson header instead of a toast per keystroke pause.
    mutateAsync: async (input: { id: number } & Partial<MockLesson>) => {
      const { id, ...patch } = input;
      patchLesson(id, patch);
      bump();
    },
  };

  const deleteLesson = {
    mutate: (input: { id: number }) => {
      removeLesson(input.id);
      setActiveLesson(null);
      setBlocks([]);
      setActiveBlockId(null);
      toast.success("Lesson deleted");
      bump();
    },
  };

  // ── Derived data ──
  const ungrouped = useMemo(
    () => allLessons.filter((l) => l.moduleId == null).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [allLessons]
  );
  const lessonsByModule = useMemo(() => {
    const map = new Map<number, MockLesson[]>();
    for (const m of modules) {
      map.set(m.id, allLessons.filter((l) => l.moduleId === m.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }
    return map;
  }, [allLessons, modules]);
  const sortedModules = useMemo(() => [...modules].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [modules]);
  const totalLessons = allLessons.length;
  const totalMinutes = allLessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);

  /** The currently active page (block) */
  const activeBlock = useMemo(
    () => blocks.find(b => b.id === activeBlockId) ?? null,
    [blocks, activeBlockId]
  );

  const handleSaveLesson = useCallback(async () => {
    if (!activeLesson) return;
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      await updateLesson.mutateAsync({
        id: activeLesson.id,
        title: lessonTitle,
        durationMinutes: 5,
        isRequired: lessonRequired,
      });

      const dirtyBlocks = blocks.filter(b => b.isDirty && b.dbId);
      await Promise.all(dirtyBlocks.map(b =>
        updateBlock.mutateAsync({ id: b.dbId!, data: b.data })
      ));

      if (blocksDirty && blocks.length > 0) {
        await reorderBlocksMutation.mutateAsync({
          lessonId: activeLesson.id,
          orderedIds: blocks.map(b => b.dbId!).filter(Boolean),
        });
      }

      setBlocks(prev => prev.map(b => ({ ...b, isDirty: false })));
      setBlocksDirty(false);
      setActiveLesson((prev) => prev ? { ...prev, isDirty: false } : prev);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [activeLesson, lessonTitle, lessonRequired, updateLesson, blocks, blocksDirty, updateBlock, reorderBlocksMutation]);

  const isDirty = (activeLesson?.isDirty ?? false) || blocksDirty || blocks.some(b => b.isDirty);

  // ── Autosave ──
  // Debounced: any dirty state (block edits, title/required change) triggers
  // a silent save ~1.2s after the last edit. The manual Save button calls
  // the same handleSaveLesson for an explicit, immediate save.
  useEffect(() => {
    if (!activeLesson || !isDirty) return;
    const t = setTimeout(() => { void handleSaveLesson(); }, 1200);
    return () => clearTimeout(t);
  }, [isDirty, activeLesson, handleSaveLesson]);

  const handleSaveCourse = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCourse.mutateAsync({
        id: courseId,
        title: courseTitle,
        description: courseDesc,
        passScore: coursePassScore,
        issuesCertificate: courseIssuesCert,
        certificateTitle: courseCertTitle,
        durationMinutes: courseDuration,
        status: courseStatus,
        isDemo: courseIsDemo,
      });
    } finally {
      setIsSaving(false);
    }
  }, [courseId, courseTitle, courseDesc, coursePassScore, courseIssuesCert, courseCertTitle, courseDuration, courseStatus, courseIsDemo, updateCourse]);

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateCourse.mutateAsync({ id: courseId, status: "published" });
      setCourseStatus("published");
      setShowPublishedScreen(true); // Show published confirmation screen
    } finally {
      setIsSaving(false);
    }
  }, [courseId, updateCourse]);

  const toggleLesson = (id: number) => {
    setExpandedLessons(prev => {
      const n = new Set(Array.from(prev));
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleModule = (id: number) => {
    setExpandedModules(prev => {
      const n = new Set(Array.from(prev));
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ── Loading / error states ──
  if (loadingCourse || loadingLessons || loadingModules) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-3 text-[#0047AB]">
          <Loader2 size={32} className="animate-spin" />
          <span className="font-display font-semibold text-sm tracking-wide">Loading course builder…</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-3" />
          <p className="font-display font-bold text-[#0F1C2E] text-lg">Course not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/lms/courses")}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="lms-interface h-screen flex flex-col bg-[#F4F6F8] overflow-hidden">
      {/* ── Top bar ── */}
      <header className="h-14 bg-[#0F1C2E] border-b border-white/10 flex items-center px-4 gap-4 shrink-0">
        <button onClick={() => navigate("/lms/courses")} className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /><span className="font-body">Courses</span>
        </button>
        <div className="w-px h-5 bg-white/20" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold text-white text-sm truncate max-w-xs">{course.title}</span>
          <StatusBadge status={courseStatus} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isDirty && <span className="text-amber-400 text-xs font-body hidden md:flex items-center gap-1">● Unsaved changes</span>}
          <span className="text-blue-300 text-xs font-body hidden md:block">{totalLessons} lesson{totalLessons !== 1 ? "s" : ""} · {totalMinutes} min</span>

          {/* Preview as Learner — always visible */}
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10 font-display font-bold text-xs"
            onClick={() => setShowPreview(true)}
          >
            <Eye size={12} className="mr-1" />Preview as Learner
          </Button>

          {/* Publish / Published state */}
          {courseStatus === "published" ? (
            <div className="flex items-center gap-1.5">
              {/* Green badge: click to view published confirmation screen */}
              <button
                onClick={() => setShowPublishedScreen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-display font-bold border border-green-400/30 hover:bg-green-500/30 transition-colors"
                title="View published confirmation"
              >
                <CheckCircle2 size={10} />Published
              </button>
              {/* Republish button for pushing new edits */}
              <Button
                size="sm"
                className="bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-xs tracking-widest uppercase"
                onClick={handlePublish}
                disabled={isSaving}
                title="Publish your latest changes"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                <span className="ml-1">Publish Updates</span>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-[#1E90FF] hover:bg-blue-400 text-white font-display font-bold text-xs tracking-widest uppercase"
              onClick={handlePublish}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
              <span className="ml-1">Publish</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── Three-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Course → Lesson → Pages hierarchy ── */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0">
          {/* Sidebar header */}
          <div className="px-3 py-2.5 border-b border-gray-100 bg-[#0F1C2E] flex items-center justify-between">
            <span className="font-display font-bold text-white text-xs flex items-center gap-1.5">
              <Layers size={13} className="text-[#1E90FF]" />Course Structure
            </span>
          </div>

          {/* Scrollable lesson + page tree — overflow-y-auto ensures all pages are reachable */}
          <div className="flex-1 overflow-y-auto py-1 min-h-0">

            {/* Course label */}
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest">
                {course.title.length > 22 ? course.title.slice(0, 22) + "…" : course.title}
              </span>
            </div>

            {/* Ungrouped lessons */}
            {ungrouped.map((lesson) => {
              const isExpanded = expandedLessons.has(lesson.id);
              const isActive = activeLesson?.id === lesson.id;
              // Count pages (blocks) for this lesson from loaded blocks
              const pageCount = isActive ? blocks.length : 0;
              return (
                <div key={lesson.id}>
                  <LessonRow
                    lesson={lesson}
                    isActive={isActive}
                    isExpanded={isExpanded}
                    pageCount={pageCount}
                    onClick={() => {
                      setActiveLesson({ ...lesson });
                      setExpandedLessons(prev => { const n = new Set(Array.from(prev)); n.add(lesson.id); return n; });
                    }}
                    onDelete={() => deleteLesson.mutate({ id: lesson.id })}
                    onToggle={() => toggleLesson(lesson.id)}
                  />
                  {/* Pages under this lesson */}
                  {isExpanded && isActive && blocks.map((block, idx) => (
                    <PageRow
                      key={block.id}
                      block={block}
                      pageNumber={idx + 1}
                      isActive={activeBlockId === block.id}
                      onClick={() => {
                        setActiveBlockId(block.id);
                        setSelectedBlockId(block.id);
                      }}
                      onDelete={() => removeBlock(block.id)}
                    />
                  ))}
                  {/* Add Page button under expanded active lesson */}
                  {isExpanded && isActive && (
                    <button
                      onClick={() => setShowBlockPicker(true)}
                      className="w-full flex items-center gap-1.5 pl-8 pr-3 py-1.5 text-[#0047AB] hover:bg-blue-50 text-[11px] font-body transition-colors"
                    >
                      <FilePlus size={11} />Add Page
                    </button>
                  )}
                </div>
              );
            })}

            {/* Modules */}
            {sortedModules.map((mod) => {
              const lessons = lessonsByModule.get(mod.id) ?? [];
              const isModExpanded = expandedModules.has(mod.id);
              return (
                <div key={mod.id} className="mb-1">
                  <div className="flex items-center gap-1 px-3 py-1.5 cursor-pointer hover:bg-gray-50 group" onClick={() => toggleModule(mod.id)}>
                    <GripVertical size={11} className="text-gray-300 shrink-0" />
                    {isModExpanded ? <ChevronDown size={12} className="text-gray-400 shrink-0" /> : <ChevronRight size={12} className="text-gray-400 shrink-0" />}
                    <span className="font-display font-bold text-[#0F1C2E] text-xs flex-1 truncate">{mod.title}</span>
                    <span className="text-[9px] text-gray-400 font-body shrink-0">{lessons.length}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete module "${mod.title}"?`)) deleteModule.mutate({ id: mod.id }); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all ml-1"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  {isModExpanded && lessons.map((lesson) => {
                    const isExpanded = expandedLessons.has(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    const pageCount = isActive ? blocks.length : 0;
                    return (
                      <div key={lesson.id} className="pl-4">
                        <LessonRow
                          lesson={lesson}
                          isActive={isActive}
                          isExpanded={isExpanded}
                          pageCount={pageCount}
                          onClick={() => {
                            setActiveLesson({ ...lesson });
                            setExpandedLessons(prev => { const n = new Set(Array.from(prev)); n.add(lesson.id); return n; });
                          }}
                          onDelete={() => deleteLesson.mutate({ id: lesson.id })}
                          onToggle={() => toggleLesson(lesson.id)}
                        />
                        {isExpanded && isActive && blocks.map((block, idx) => (
                          <PageRow
                            key={block.id}
                            block={block}
                            pageNumber={idx + 1}
                            isActive={activeBlockId === block.id}
                            onClick={() => {
                              setActiveBlockId(block.id);
                              setSelectedBlockId(block.id);
                            }}
                            onDelete={() => removeBlock(block.id)}
                          />
                        ))}
                        {isExpanded && isActive && (
                          <button
                            onClick={() => setShowBlockPicker(true)}
                            className="w-full flex items-center gap-1.5 pl-12 pr-3 py-1.5 text-[#0047AB] hover:bg-blue-50 text-[11px] font-body transition-colors"
                          >
                            <FilePlus size={11} />Add Page
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {isModExpanded && (
                    <button
                      onClick={() => { setShowAddLesson({ moduleId: mod.id }); setExpandedModules(p => { const n = new Set(Array.from(p)); n.add(mod.id); return n; }); }}
                      className="w-full flex items-center gap-1.5 pl-7 pr-3 py-1.5 text-[#0047AB] hover:bg-blue-50 text-[11px] font-body transition-colors"
                    >
                      <BookOpen size={11} />Add Lesson
                    </button>
                  )}
                </div>
              );
            })}

            {/* Spacer at bottom for scroll */}
            <div className="h-2" />
          </div>

          {/* Sidebar footer: Add Lesson + Course Settings */}
          <div className="border-t border-gray-100 p-2 space-y-1 shrink-0">
            <button
              onClick={() => setShowAddLesson({ moduleId: null })}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#0047AB] hover:bg-[#1565C0] text-white rounded-lg text-xs font-display font-bold transition-colors"
            >
              <BookOpen size={12} />Add Lesson
            </button>
            <button
              onClick={() => setShowAddModule(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 hover:border-[#0047AB] text-gray-500 hover:text-[#0047AB] rounded-lg text-xs font-body transition-colors"
            >
              <Plus size={12} />Add Module
            </button>
            <button
              onClick={() => { setActiveLesson(null); setRightPanel("course"); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:text-[#0047AB] hover:bg-blue-50 text-xs font-body transition-colors"
            >
              <Settings size={12} />Course Settings
            </button>
          </div>
        </aside>

        {/* ── CENTER: Page editor (one page at a time) ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {showPublishedScreen ? (
            /* Published confirmation screen */
            <PublishedBanner
              courseTitle={course.title}
              onEdit={() => setShowPublishedScreen(false)}
              onPreview={() => { setShowPublishedScreen(false); setShowPreview(true); }}
            />
          ) : activeLesson ? (
            <>
              {/* Lesson header bar */}
              <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shrink-0">
                <LessonTypeIcon type={activeLesson.type as LessonType} size={16} />
                <span className="font-display font-bold text-[#0F1C2E] text-sm truncate flex-1">{activeLesson.title}</span>
                <span className="text-xs text-gray-400 font-body shrink-0">
                  {activeBlockId ? `Page ${blocks.findIndex(b => b.id === activeBlockId) + 1} of ${blocks.length}` : `${blocks.length} page${blocks.length !== 1 ? "s" : ""}`}
                </span>
                {/* Save status indicator */}
                <span className="text-xs font-body shrink-0 flex items-center gap-1">
                  {saveStatus === "saving" ? (
                    <span className="flex items-center gap-1 text-gray-400"><Loader2 size={11} className="animate-spin" />Saving…</span>
                  ) : saveStatus === "saved" ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={11} />Saved</span>
                  ) : isDirty ? (
                    <span className="text-amber-500">Unsaved</span>
                  ) : null}
                </span>
                {/* Undo / redo */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    title="Undo (Ctrl+Z)"
                    onClick={handleUndo}
                    disabled={blockHistory.index <= 0}
                    className="p-1.5 rounded-md text-gray-400 hover:text-[#0047AB] hover:bg-gray-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    title="Redo (Ctrl+Shift+Z)"
                    onClick={handleRedo}
                    disabled={blockHistory.index >= blockHistory.stack.length - 1}
                    className="p-1.5 rounded-md text-gray-400 hover:text-[#0047AB] hover:bg-gray-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>
                {/* Device preview toggle */}
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
                  <button
                    title="Desktop view"
                    onClick={() => setPreviewDevice("desktop")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-display font-bold transition-colors",
                      previewDevice === "desktop"
                        ? "bg-white text-[#0047AB] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <Monitor size={12} />Desktop
                  </button>
                  <button
                    title="Mobile view"
                    onClick={() => setPreviewDevice("mobile")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-display font-bold transition-colors",
                      previewDevice === "mobile"
                        ? "bg-white text-[#0047AB] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <Smartphone size={12} />Mobile
                  </button>
                </div>
                <Button
                  size="sm"
                  className="bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase shrink-0"
                  onClick={handleSaveLesson}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}Save
                </Button>
              </div>

              {/* Page navigation tabs — drag to reorder (mouse or keyboard) */}
              {blocks.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
                    <SortableContext items={blocks.map(b => b.id)} strategy={horizontalListSortingStrategy}>
                      {blocks.map((block, idx) => (
                        <SortablePageTab
                          key={block.id}
                          block={block}
                          index={idx}
                          isActive={activeBlockId === block.id}
                          onSelect={() => { setActiveBlockId(block.id); setSelectedBlockId(block.id); }}
                          onDuplicate={() => duplicateBlock(block.id)}
                          onDelete={() => { if (window.confirm("Delete this page? This cannot be undone.")) removeBlock(block.id); }}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <button
                    onClick={() => setShowBlockPicker(true)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-md border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#0047AB] hover:text-[#0047AB] text-xs font-body transition-colors"
                  >
                    <Plus size={11} />New Page
                  </button>
                </div>
              )}

              {/* Active page content */}
              <div className="flex-1 overflow-y-auto bg-[#F4F6F8]">
                {activeBlock ? (
                  <div className={cn(
                    "mx-auto py-6 px-4 transition-all duration-300",
                    previewDevice === "mobile" ? "max-w-[390px]" : "max-w-3xl px-8"
                  )}>
                    {/* Canvas toolbar shown above canvas_slide blocks */}
                    {activeBlock.type === "canvas_slide" && (
                      <CanvasToolbar onAddElement={addCanvasElement} />
                    )}
                    {/* Device frame wrapper */}
                    {previewDevice === "mobile" && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Smartphone size={14} className="text-gray-400" />
                        <span className="text-[11px] font-body text-gray-400">Mobile preview — 390px</span>
                      </div>
                    )}
                    {/* Block editor for the active page — single-page view, no DnD wrapper needed */}
                    <div
                      className={cn(
                        "rounded-xl border-2 shadow-md bg-white overflow-hidden transition-all duration-300",
                        previewDevice === "mobile"
                          ? "border-gray-300 shadow-gray-200 rounded-3xl"
                          : "border-[#0047AB] shadow-blue-100"
                      )}
                      onClick={() => setSelectedBlockId(activeBlock.id)}
                    >
                      <BlockEditorContent
                        block={activeBlock}
                        onUpdate={(data) => updateBlockData(activeBlock.id, data)}
                      />
                    </div>
                  </div>
                ) : (
                  /* Empty lesson — no pages yet */
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center max-w-sm py-16">
                      <div className="w-16 h-16 rounded-2xl bg-[#0047AB]/10 flex items-center justify-center mx-auto mb-4">
                        <FilePlus size={28} className="text-[#0047AB]" />
                      </div>
                      <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg mb-2">No pages yet</h3>
                      <p className="text-gray-400 font-body text-sm leading-relaxed mb-5">
                        Add your first page to start building this lesson. Each page is one screen the learner sees.
                      </p>
                      <Button
                        className="bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase"
                        onClick={() => setShowBlockPicker(true)}
                      >
                        <Plus size={14} className="mr-1" />Add First Page
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No lesson selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-[#0047AB]/10 flex items-center justify-center mx-auto mb-5">
                  <BookOpen size={36} className="text-[#0047AB]" />
                </div>
                <h2 className="font-display font-extrabold text-[#0F1C2E] text-xl mb-2">Select a Lesson</h2>
                <p className="text-gray-400 font-body text-sm leading-relaxed">Choose a lesson from the sidebar to start editing, or create a new one to begin building your course.</p>
                <Button
                  className="mt-5 bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase"
                  onClick={() => setShowAddLesson({ moduleId: null })}
                >
                  <Plus size={14} className="mr-1" />New Lesson
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT: Settings panel ── */}
        <aside className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setRightPanel("page")}
              className={cn("flex-1 py-2.5 text-[11px] font-display font-bold transition-colors", rightPanel === "page" ? "text-[#0047AB] border-b-2 border-[#0047AB]" : "text-gray-400 hover:text-gray-600")}
            >Page</button>
            <button
              onClick={() => setRightPanel("lesson")}
              className={cn("flex-1 py-2.5 text-[11px] font-display font-bold transition-colors", rightPanel === "lesson" ? "text-[#0047AB] border-b-2 border-[#0047AB]" : "text-gray-400 hover:text-gray-600")}
            >Lesson</button>
            <button
              onClick={() => setRightPanel("course")}
              className={cn("flex-1 py-2.5 text-[11px] font-display font-bold transition-colors", rightPanel === "course" ? "text-[#0047AB] border-b-2 border-[#0047AB]" : "text-gray-400 hover:text-gray-600")}
            >Course</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Page panel: shows info about the current active page */}
            {rightPanel === "page" && activeBlock ? (
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Page Type</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm font-body text-gray-700 capitalize">
                      {activeBlock.type === "canvas_slide" ? "Canvas Slide" :
                       activeBlock.type === "text" ? "Rich Text" :
                       activeBlock.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-display font-bold text-[#0F1C2E] text-xs uppercase tracking-widest">Page Number</Label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-body text-gray-700">
                    {blocks.findIndex(b => b.id === activeBlock.id) + 1} of {blocks.length}
                  </div>
                </div>
                <Separator />
                {/* Page navigation */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-display font-bold"
                    disabled={blocks.findIndex(b => b.id === activeBlock.id) === 0}
                    onClick={() => {
                      const idx = blocks.findIndex(b => b.id === activeBlock.id);
                      if (idx > 0) { setActiveBlockId(blocks[idx - 1].id); }
                    }}
                  >← Prev</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-display font-bold"
                    disabled={blocks.findIndex(b => b.id === activeBlock.id) === blocks.length - 1}
                    onClick={() => {
                      const idx = blocks.findIndex(b => b.id === activeBlock.id);
                      if (idx < blocks.length - 1) { setActiveBlockId(blocks[idx + 1].id); }
                    }}
                  >Next →</Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full font-display font-bold text-xs tracking-widest uppercase"
                  onClick={() => duplicateBlock(activeBlock.id)}
                >
                  <Copy size={12} className="mr-1" />Duplicate Page
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 font-display font-bold text-xs tracking-widest uppercase"
                  onClick={() => { if (window.confirm("Delete this page? This cannot be undone.")) removeBlock(activeBlock.id); }}
                >
                  <Trash2 size={12} className="mr-1" />Delete Page
                </Button>
              </div>
            ) : rightPanel === "page" ? (
              <div className="p-5 text-center text-gray-400 text-sm font-body mt-10">Select a page to see its settings.</div>
            ) : null}

            {/* Lesson panel */}
            {rightPanel === "lesson" && activeLesson ? (
              <LessonSettingsPanel
                lesson={activeLesson} title={lessonTitle} required={lessonRequired}
                onTitleChange={(v) => { setLessonTitle(v); setActiveLesson((p) => p ? { ...p, title: v, isDirty: true } : p); }}
                onRequiredChange={(v) => { setLessonRequired(v); setActiveLesson((p) => p ? { ...p, isDirty: true } : p); }}
                onDelete={() => { if (window.confirm(`Delete "${activeLesson.title}"?`)) deleteLesson.mutate({ id: activeLesson.id }); }}
                onSave={handleSaveLesson} isSaving={isSaving}
              />
            ) : rightPanel === "lesson" ? (
              <div className="p-5 text-center text-gray-400 text-sm font-body mt-10">Select a lesson to see its settings.</div>
            ) : null}

            {/* Course panel */}
            {rightPanel === "course" && (
              <CourseSettingsPanel
                title={courseTitle} description={courseDesc} passScore={coursePassScore}
                issuesCertificate={courseIssuesCert} certificateTitle={courseCertTitle} duration={courseDuration} status={courseStatus}
                isDemo={courseIsDemo}
                onTitleChange={setCourseTitle} onDescChange={setCourseDesc}
                onPassScoreChange={setCoursePassScore} onIssuesCertChange={setCourseIssuesCert}
                onCertificateTitleChange={setCourseCertTitle}
                onDurationChange={setCourseDuration} onStatusChange={setCourseStatus}
                onIsDemoChange={setCourseIsDemo}
                onSave={handleSaveCourse} isSaving={isSaving}
                totalLessons={totalLessons} totalMinutes={totalMinutes}
              />
            )}
          </div>
        </aside>
      </div>

      {/* ── Add Module Dialog ── */}
      <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-bold text-[#0F1C2E]">Add Module</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="font-display font-bold text-[#0F1C2E] text-sm">Module Title</Label>
            <Input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="e.g. Fall Protection Fundamentals"
              className="font-body"
              onKeyDown={(e) => { if (e.key === "Enter" && newModuleTitle.trim()) createModule.mutate({ courseId, title: newModuleTitle.trim(), sortOrder: modules.length }); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModule(false)}>Cancel</Button>
            <Button
              className="bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase"
              onClick={() => { if (newModuleTitle.trim()) createModule.mutate({ courseId, title: newModuleTitle.trim(), sortOrder: modules.length }); }}
              disabled={!newModuleTitle.trim() || createModule.isPending}
            >
              {createModule.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}Add Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Lesson Dialog ── */}
      <Dialog open={!!showAddLesson} onOpenChange={(o) => !o && setShowAddLesson(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-bold text-[#0F1C2E]">Add Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-display font-bold text-[#0F1C2E] text-sm">Lesson Title</Label>
              <Input
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="e.g. Introduction to Scaffold Safety"
                className="font-body"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="font-display font-bold text-[#0F1C2E] text-sm">Lesson Type</Label>
              <Select value={newLessonType} onValueChange={(v) => setNewLessonType(v as LessonType)}>
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text / Rich Content</SelectItem>
                  <SelectItem value="video_embed">Video Embed (YouTube/Vimeo)</SelectItem>
                  <SelectItem value="video_upload">Video Upload</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="resource">Resource / Download</SelectItem>
                  <SelectItem value="slides">Slide-Based Lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLesson(null)}>Cancel</Button>
            <Button
              className="bg-[#0047AB] hover:bg-[#1565C0] text-white font-display font-bold text-xs tracking-widest uppercase"
              onClick={() => {
                if (newLessonTitle.trim() && showAddLesson !== null) {
                  createLesson.mutate({
                    courseId,
                    moduleId: showAddLesson.moduleId ?? undefined,
                    title: newLessonTitle.trim(),
                    type: newLessonType,
                    sortOrder: allLessons.filter((l) => l.moduleId === showAddLesson.moduleId).length,
                  });
                }
              }}
              disabled={!newLessonTitle.trim() || createLesson.isPending}
            >
              {createLesson.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview overlay (learner view) ── */}
      {showPreview && (
        <CoursePreview
          courseName={course.title}
          lessonTitle={activeLesson?.title ?? "Course Preview"}
          blocks={blocks}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* ── Template Library modal ── */}
      {showTemplateLibrary && (
        <TemplateLibrary
          onSelect={async (slideData: CanvasSlideData) => {
            if (!activeLesson) return;
            try {
              const result = await createBlock.mutateAsync({
                lessonId: activeLesson.id,
                type: "canvas_slide",
                data: slideData as unknown as BlockData,
                sortOrder: blocks.length,
              });
              const newBlock: DraftBlock = {
                id: String(result.id),
                dbId: result.id,
                lessonId: activeLesson.id,
                type: "canvas_slide",
                data: slideData as unknown as BlockData,
                sortOrder: blocks.length,
              };
              setBlocks(prev => [...prev, newBlock]);
              setActiveBlockId(String(result.id));
              toast.success("Template applied");
            } catch {
              toast.error("Failed to apply template");
            }
            setShowTemplateLibrary(false);
          }}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}

      {/* ── Block picker overlay ── */}
      {showBlockPicker && (
        <BlockPicker
          onAdd={addBlock}
          onClose={() => setShowBlockPicker(false)}
        />
      )}
    </div>
  );
}
