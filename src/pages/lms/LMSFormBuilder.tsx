/**
 * @file LMSFormBuilder.tsx
 * @description Form Builder for the Bastion LMS Company Admin.
 *
 * Modeled on the Course Builder's three-pane layout (`LMSBuilder.tsx`):
 *  LEFT   — Page list (add / duplicate / delete / drag-reorder)
 *  CENTER — Active page's sections/tables/instructions, with a field picker
 *  RIGHT  — Selected item's settings, or the form's conditional-logic rules
 *
 * Wired to the real backend (`src/lib/api.ts`). Structural actions (add/
 * delete page/item/field/column) call their endpoint immediately; free-text
 * edits (titles, labels, help text, option text) are debounced per-target so
 * typing doesn't spam requests. `logic`/`reportLayout` are opaque blobs the
 * backend just stores — PATCHed as a single debounced blob on `Form`.
 *
 * A few endpoints below (marked in `src/lib/api.ts`) aren't in the Postman
 * collection — guessed REST shapes for page/item update+delete and page
 * reorder, since the collection only demonstrated create for those.
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
  verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, Plus, Loader2, Save, Eye, GripVertical, Trash2, Copy,
  Table as TableIcon, ListChecks, X,
  Type, Hash, Calendar, ChevronDownSquare, CircleCheck, ToggleLeft, CheckSquare,
  Camera, PenLine, SlidersHorizontal, User, MapPin, Info, AlertTriangle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getFormById, updateForm, addFormPage, updateFormPage, deleteFormPage, reorderFormPages,
  addFormItem, updateFormItem, deleteFormItem,
  addFormField, updateFormField, deleteFormField,
  addFormColumn, updateFormColumn, deleteFormColumn,
  getAnswerSets, createAnswerSet, updateAnswerSet, deleteAnswerSet,
  ApiError,
  type FormRecord, type FormPageRecord, type FormItemRecord, type FormFieldRecord, type FormColumnRecord,
  type AnswerSetRecord, type AddFormItemInput,
} from "@/lib/api";
import type { FormFieldType, LogicRule, LogicAction } from "./formBuilder/types";
import { FIELD_TYPE_LABELS, CHOICE_FIELD_TYPES, DEFAULT_REPORT_LAYOUT, type ReportLayoutConfig } from "./formBuilder/types";
import { FormPreview } from "./formBuilder/FormPreview";
import { CompletedReportPreview } from "./formBuilder/CompletedReportPreview";

type SectionItem = Extract<FormItemRecord, { kind: "section" }>;
type TableItem = Extract<FormItemRecord, { kind: "table" }>;
type InstructionItem = Extract<FormItemRecord, { kind: "instruction" }>;

const FIELD_TYPE_ICONS: Record<FormFieldType, React.ElementType> = {
  short_text: Type, long_text: Type, number: Hash, date: Calendar, datetime: Calendar,
  dropdown: ChevronDownSquare, multiple_choice: CircleCheck, yes_no: ToggleLeft, yes_no_na: ToggleLeft,
  checkbox: CheckSquare, photo: Camera, signature: PenLine, rating: SlidersHorizontal,
  person: User, location: MapPin, instruction: Info,
};

function fieldIcon(type: string): React.ElementType {
  return FIELD_TYPE_ICONS[type as FormFieldType] ?? Type;
}
function fieldTypeLabel(type: string): string {
  return FIELD_TYPE_LABELS[type as FormFieldType] ?? type;
}

// ─── Field type picker (mirrors BlockPicker's neutral-card pattern) ───────────
// "Instruction" is excluded — on the real backend it's a page-item kind
// (sibling of section/table), not a field type inside a section.

function FieldTypePicker({ onPick, onClose }: { onPick: (type: FormFieldType) => void; onClose: () => void }) {
  const pickableTypes = (Object.keys(FIELD_TYPE_LABELS) as FormFieldType[]).filter((t) => t !== "instruction");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-gray-100 text-left shrink-0">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Add Field</DialogTitle>
        </DialogHeader>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto">
          {pickableTypes.map((type) => {
            const Icon = FIELD_TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => { onPick(type); onClose(); }}
                className="flex flex-col items-start gap-1.5 p-3 rounded-lg border border-gray-200 bg-white text-left transition-colors hover:border-[#0047AB] hover:bg-[#0047AB]/5"
              >
                <Icon size={16} className="text-gray-500" />
                <span className="text-xs font-display font-bold text-[#0F1C2E]">{FIELD_TYPE_LABELS[type]}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sortable page row (left sidebar) ─────────────────────────────────────────

function SortablePageRow({
  page, isActive, index, onClick, onDuplicate, onDelete,
}: {
  page: FormPageRecord; isActive: boolean; index: number;
  onClick: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-2 transition-colors",
        isActive ? "bg-[#0047AB]/5 border-[#0047AB]" : "border-transparent hover:bg-gray-50"
      )}
    >
      <span {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab" onClick={(e) => e.stopPropagation()}>
        <GripVertical size={14} />
      </span>
      <span className={cn("text-xs font-body flex-1 truncate", isActive ? "text-[#0047AB] font-semibold" : "text-gray-600")}>
        {index + 1}. {page.title || "Untitled Page"}
      </span>
      {isActive && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={onDuplicate} className="text-gray-400 hover:text-[#0047AB]" title="Duplicate page"><Copy size={12} /></button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500" title="Delete page"><Trash2 size={12} /></button>
        </div>
      )}
    </div>
  );
}

export default function LMSFormBuilder() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const formId = params.id ?? "";

  const [form, setForm] = useState<FormRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answerSets, setAnswerSets] = useState<AnswerSetRecord[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [selected, setSelected] = useState<{ kind: "field" | "section" | "table" | "instruction"; id: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<"item" | "logic">("item");
  const [pickerForSection, setPickerForSection] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAnswerSets, setShowAnswerSets] = useState(false);
  const [showPreview, setShowPreview] = useState<"desktop" | "mobile" | "pdf" | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const pages = form?.pages ?? [];
  const activePage = pages.find((p) => p._id === activePageId) ?? pages[0];
  const logic = (form?.logic as LogicRule[] | undefined) ?? [];

  const loadForm = useCallback(async () => {
    if (!formId) { setIsLoading(false); return; }
    try {
      const res = await getFormById(formId);
      setForm(res.data);
      setActivePageId((prev) => prev || res.data.pages?.[0]?._id || "");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load this form.");
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => { loadForm(); }, [loadForm]);

  useEffect(() => {
    getAnswerSets().then((res) => setAnswerSets(res.data)).catch(() => {});
  }, []);

  // ── Per-target debounce for free-text edits (title/label/help text/etc). ──
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const debouncedSave = useCallback((key: string, fn: () => Promise<unknown>) => {
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    setSaveStatus("saving");
    debounceTimers.current[key] = setTimeout(() => {
      fn()
        .then(() => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1500);
        })
        .catch((err) => {
          toast.error(err instanceof ApiError ? err.message : "Failed to save");
          setSaveStatus("idle");
        });
    }, 700);
  }, []);

  // ── Form-level blob fields (title/description/logic/reportLayout) ──
  const saveFormBlob = useCallback((patch: Partial<{ title: string; description: string; logic: unknown[]; reportLayout: unknown }>) => {
    debouncedSave("form", () => updateForm(formId, patch));
  }, [formId, debouncedSave]);

  const updatePagesLocal = (nextPages: FormPageRecord[]) => {
    setForm((prev) => (prev ? { ...prev, pages: nextPages } : prev));
  };
  const updatePageItemsLocal = (pageId: string, items: FormItemRecord[]) => {
    updatePagesLocal(pages.map((p) => (p._id === pageId ? { ...p, items } : p)));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handlePageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = pages.findIndex((p) => p._id === active.id);
    const newIdx = pages.findIndex((p) => p._id === over.id);
    const reordered = arrayMove(pages, oldIdx, newIdx);
    updatePagesLocal(reordered);
    reorderFormPages(formId, reordered.map((p) => p._id)).catch((err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to save page order")
    );
  };

  const handleAddPage = async () => {
    if (!form) return;
    try {
      const res = await addFormPage(form._id, { title: `Page ${pages.length + 1}` });
      updatePagesLocal([...pages, res.data]);
      setActivePageId(res.data._id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add page");
    }
  };

  /** Deep-duplicates a page by sequentially recreating its items/fields/columns through the real API — there's no batch-copy endpoint. */
  const handleDuplicatePage = async (pageId: string) => {
    if (!form) return;
    const page = pages.find((p) => p._id === pageId);
    if (!page) return;
    try {
      const newPageRes = await addFormPage(form._id, { title: `${page.title} (Copy)` });
      let newPage: FormPageRecord = newPageRes.data;
      for (const item of page.items) {
        if (item.kind === "section") {
          const itemRes = await addFormItem(form._id, newPage._id, { kind: "section", title: item.title });
          let newItem = itemRes.data as SectionItem;
          for (const field of item.fields) {
            const fieldRes = await addFormField(form._id, newPage._id, newItem._id, {
              type: field.type, label: field.label, helpText: field.helpText, required: field.required,
              options: field.options, answerSetId: field.answerSetId, min: field.min, max: field.max, flagValues: field.flagValues,
            });
            newItem = { ...newItem, fields: [...newItem.fields, fieldRes.data] };
          }
          newPage = { ...newPage, items: [...newPage.items, newItem] };
        } else if (item.kind === "table") {
          const itemRes = await addFormItem(form._id, newPage._id, { kind: "table", title: item.title });
          let newItem = itemRes.data as TableItem;
          for (const col of item.columns) {
            const colRes = await addFormColumn(form._id, newPage._id, newItem._id, { label: col.label });
            newItem = { ...newItem, columns: [...newItem.columns, colRes.data] };
          }
          newPage = { ...newPage, items: [...newPage.items, newItem] };
        } else {
          const itemRes = await addFormItem(form._id, newPage._id, { kind: "instruction", body: item.body });
          newPage = { ...newPage, items: [...newPage.items, itemRes.data] };
        }
      }
      const idx = pages.findIndex((p) => p._id === pageId);
      const next = [...pages];
      next.splice(idx + 1, 0, newPage);
      updatePagesLocal(next);
      setActivePageId(newPage._id);
      toast.success("Page duplicated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to duplicate page");
    }
  };

  const handleDeletePage = async () => {
    if (!deletePageId || !form) return;
    try {
      await deleteFormPage(form._id, deletePageId);
      let remaining = pages.filter((p) => p._id !== deletePageId);
      if (remaining.length === 0) {
        const res = await addFormPage(form._id, { title: "Page 1" });
        remaining = [res.data];
      }
      updatePagesLocal(remaining);
      if (activePageId === deletePageId) setActivePageId(remaining[0]?._id ?? "");
      setDeletePageId(null);
      toast.success("Page deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete page");
    }
  };

  const requestDeletePage = async (pageId: string) => {
    if (!form) return;
    const page = pages.find((p) => p._id === pageId);
    // Confirm plainly if the page has content or logic references it — a bare
    // empty page can just go, per the report's "confirm only when it matters".
    const hasContent = !!page && page.items.length > 0;
    const hasLogic = logic.some((r) => r.actions.some((a) => a.type === "skip_to" && a.targetPageId === pageId));
    if (hasContent || hasLogic) {
      setDeletePageId(pageId);
    } else {
      try {
        await deleteFormPage(form._id, pageId);
        const remaining = pages.filter((p) => p._id !== pageId);
        updatePagesLocal(remaining);
        if (activePageId === pageId) setActivePageId(remaining[0]?._id ?? "");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to delete page");
      }
    }
  };

  const handlePageTitleChange = (pageId: string, title: string) => {
    updatePagesLocal(pages.map((p) => (p._id === pageId ? { ...p, title } : p)));
    debouncedSave(`page:${pageId}`, () => updateFormPage(formId, pageId, { title }));
  };

  // ── Page item mutations ──
  const handleAddItem = async (kind: "section" | "table" | "instruction") => {
    if (!activePage || !form) return;
    try {
      const input: AddFormItemInput =
        kind === "instruction" ? { kind, body: "Enter instructions for the employee here…" } : { kind, title: kind === "table" ? "Table" : undefined };
      const res = await addFormItem(form._id, activePage._id, input);
      updatePageItemsLocal(activePage._id, [...activePage.items, res.data]);
      setShowAddItem(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add item");
    }
  };

  const handleDeleteItem = async (item: FormItemRecord) => {
    if (!activePage || !form) return;
    try {
      await deleteFormItem(form._id, activePage._id, item._id);
      updatePageItemsLocal(activePage._id, activePage.items.filter((i) => i._id !== item._id));
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete item");
    }
  };

  const handleItemTitleChange = (item: SectionItem | TableItem, title: string) => {
    if (!activePage || !form) return;
    updatePageItemsLocal(activePage._id, activePage.items.map((i) => (i._id === item._id ? { ...i, title } : i)));
    debouncedSave(`item:${item._id}`, () => updateFormItem(form._id, activePage._id, item._id, { title }));
  };

  const handleInstructionBodyChange = (item: InstructionItem, body: string) => {
    if (!activePage || !form) return;
    updatePageItemsLocal(activePage._id, activePage.items.map((i) => (i._id === item._id ? { ...i, body } : i)));
    debouncedSave(`item:${item._id}`, () => updateFormItem(form._id, activePage._id, item._id, { body }));
  };

  const handleAddField = async (sectionId: string, type: FormFieldType) => {
    if (!activePage || !form) return;
    try {
      const res = await addFormField(form._id, activePage._id, sectionId, {
        type,
        label: FIELD_TYPE_LABELS[type] ?? type,
        required: false,
        options: CHOICE_FIELD_TYPES.includes(type) ? ["Option 1", "Option 2"] : undefined,
      });
      const items = activePage.items.map((item) =>
        item.kind === "section" && item._id === sectionId ? { ...item, fields: [...item.fields, res.data] } : item
      );
      updatePageItemsLocal(activePage._id, items);
      setSelected({ kind: "field", id: res.data._id });
      setRightPanel("item");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add field");
    }
  };

  const handleRemoveFieldFromSection = async (sectionId: string, fieldId: string) => {
    if (!activePage || !form) return;
    try {
      await deleteFormField(form._id, activePage._id, sectionId, fieldId);
      const items = activePage.items.map((item) =>
        item.kind === "section" && item._id === sectionId ? { ...item, fields: item.fields.filter((f) => f._id !== fieldId) } : item
      );
      updatePageItemsLocal(activePage._id, items);
      if (selected?.kind === "field" && selected.id === fieldId) setSelected(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove field");
    }
  };

  const updateFieldLocal = (fieldId: string, patch: Partial<FormFieldRecord>) => {
    if (!activePage || !form) return;
    const items = activePage.items.map((item) =>
      item.kind === "section" ? { ...item, fields: item.fields.map((f) => (f._id === fieldId ? { ...f, ...patch } : f)) } : item
    );
    updatePageItemsLocal(activePage._id, items);
    const sectionItem = activePage.items.find((i): i is SectionItem => i.kind === "section" && i.fields.some((f) => f._id === fieldId));
    if (!sectionItem) return;
    debouncedSave(`field:${fieldId}`, () => updateFormField(form._id, activePage._id, sectionItem._id, fieldId, patch));
  };

  // ── Table columns ──
  const handleAddColumn = async (table: TableItem) => {
    if (!activePage || !form) return;
    try {
      const res = await addFormColumn(form._id, activePage._id, table._id, { label: `Column ${table.columns.length + 1}` });
      updatePageItemsLocal(activePage._id, activePage.items.map((i) => (i._id === table._id ? { ...i, columns: [...(i as TableItem).columns, res.data] } : i)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add column");
    }
  };
  const handleColumnLabelChange = (table: TableItem, columnId: string, label: string) => {
    if (!activePage || !form) return;
    updatePageItemsLocal(activePage._id, activePage.items.map((i) =>
      i._id === table._id ? { ...i, columns: (i as TableItem).columns.map((c) => (c._id === columnId ? { ...c, label } : c)) } : i
    ));
    debouncedSave(`column:${columnId}`, () => updateFormColumn(form._id, activePage._id, table._id, columnId, { label }));
  };
  const handleRemoveColumn = async (table: TableItem, columnId: string) => {
    if (!activePage || !form) return;
    try {
      await deleteFormColumn(form._id, activePage._id, table._id, columnId);
      updatePageItemsLocal(activePage._id, activePage.items.map((i) =>
        i._id === table._id ? { ...i, columns: (i as TableItem).columns.filter((c) => c._id !== columnId) } : i
      ));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove column");
    }
  };

  // ── Logic (opaque blob on Form) ──
  const updateLogic = (nextLogic: LogicRule[]) => {
    setForm((prev) => (prev ? { ...prev, logic: nextLogic } : prev));
    saveFormBlob({ logic: nextLogic });
  };
  const addLogicRule = () => {
    const firstField = allFields[0];
    if (!firstField) { toast.error("Add at least one field before creating a rule."); return; }
    const rule: LogicRule = { id: crypto.randomUUID(), sourceFieldId: firstField._id, condition: { equals: "" }, actions: [{ type: "flag" }] };
    updateLogic([...logic, rule]);
  };
  const updateLogicRule = (ruleId: string, patch: Partial<LogicRule>) => {
    updateLogic(logic.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
  };
  const removeLogicRule = (ruleId: string) => {
    updateLogic(logic.filter((r) => r.id !== ruleId));
  };

  const updateReportLayout = (nextLayout: ReportLayoutConfig) => {
    setForm((prev) => (prev ? { ...prev, reportLayout: nextLayout } : prev));
    saveFormBlob({ reportLayout: nextLayout });
  };

  const allFields = useMemo(
    () => pages.flatMap((p) => p.items).filter((i): i is SectionItem => i.kind === "section").flatMap((i) => i.fields),
    [pages]
  );
  const fieldsById = useMemo(() => Object.fromEntries(allFields.map((f) => [f._id, f])), [allFields]);
  const allFieldOptions = useMemo(() => allFields.map((f) => ({ id: f._id, label: f.label })), [allFields]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="flex flex-col items-center gap-3 text-[#0047AB]">
          <Loader2 size={32} className="animate-spin" />
          <span className="font-display font-semibold text-sm tracking-wide">Loading form builder…</span>
        </div>
      </div>
    );
  }

  if (!form || !activePage) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="text-center">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-3" />
          <p className="font-display font-bold text-[#0F1C2E] text-lg">Form not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/lms/forms")}>Back to Forms</Button>
        </div>
      </div>
    );
  }

  const selectedField = selected?.kind === "field" ? fieldsById[selected.id] : null;
  const selectedSection = selected?.kind === "section"
    ? activePage.items.find((i): i is SectionItem => i.kind === "section" && i._id === selected.id)
    : null;
  const selectedTable = selected?.kind === "table"
    ? activePage.items.find((i): i is TableItem => i.kind === "table" && i._id === selected.id)
    : null;
  const selectedInstruction = selected?.kind === "instruction"
    ? activePage.items.find((i): i is InstructionItem => i.kind === "instruction" && i._id === selected.id)
    : null;

  return (
    <div className="lms-interface h-screen flex flex-col bg-[#F4F6F8] overflow-hidden">
      {/* ── Top bar ── */}
      <header className="h-14 bg-[#0F1C2E] border-b border-white/10 flex items-center px-4 gap-4 shrink-0">
        <button onClick={() => navigate("/lms/forms")} className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /><span className="font-body">Forms</span>
        </button>
        <div className="w-px h-5 bg-white/20" />
        <Input
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((f) => f && { ...f, title });
            saveFormBlob({ title });
          }}
          className="bg-transparent border-none text-white font-display font-bold text-sm h-auto p-0 focus-visible:ring-0 max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          {saveStatus === "saving" && <span className="text-white/50 text-xs font-body flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Saving…</span>}
          {saveStatus === "saved" && <span className="text-green-400 text-xs font-body flex items-center gap-1"><Save size={11} />Saved</span>}
          <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10 font-display font-bold text-xs" onClick={() => setShowAnswerSets(true)}>
            <Layers size={12} className="mr-1" />Answer Sets
          </Button>
          <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10 font-display font-bold text-xs" onClick={() => setShowPreview("desktop")}>
            <Eye size={12} className="mr-1" />Preview
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Pages ── */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-[#0F1C2E] flex items-center justify-between">
            <span className="font-display font-bold text-white text-xs flex items-center gap-1.5"><Layers size={13} className="text-[#1E90FF]" />Pages</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1 min-h-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePageDragEnd}>
              <SortableContext items={pages.map((p) => p._id)} strategy={verticalListSortingStrategy}>
                {pages.map((page, idx) => (
                  <SortablePageRow
                    key={page._id}
                    page={page}
                    index={idx}
                    isActive={page._id === activePageId}
                    onClick={() => setActivePageId(page._id)}
                    onDuplicate={() => handleDuplicatePage(page._id)}
                    onDelete={() => requestDeletePage(page._id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div className="border-t border-gray-100 p-2 shrink-0">
            <button onClick={handleAddPage} className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#0047AB] hover:bg-[#1565C0] text-white rounded-lg text-xs font-display font-bold transition-colors">
              <Plus size={12} />Add Page
            </button>
          </div>
        </aside>

        {/* ── CENTER: Active page ── */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <Input
              value={activePage.title}
              onChange={(e) => handlePageTitleChange(activePage._id, e.target.value)}
              className="font-display font-bold text-xl border-none bg-transparent px-0 focus-visible:ring-0 h-auto"
              placeholder="Page title"
            />

            {activePage.items.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-body">
                No content on this page yet.
              </div>
            )}

            {activePage.items.map((item) => {
              if (item.kind === "instruction") {
                const isSelected = selected?.kind === "instruction" && selected.id === item._id;
                return (
                  <ItemCard key={item._id} icon={Info} label="Instruction" isSelected={isSelected}
                    onSelect={() => { setSelected({ kind: "instruction", id: item._id }); setRightPanel("item"); }}
                    onDelete={() => handleDeleteItem(item)}>
                    <p className="text-sm text-gray-600 font-body">{item.body}</p>
                  </ItemCard>
                );
              }
              if (item.kind === "table") {
                const isSelected = selected?.kind === "table" && selected.id === item._id;
                return (
                  <ItemCard key={item._id} icon={TableIcon} label="Table" isSelected={isSelected}
                    onSelect={() => { setSelected({ kind: "table", id: item._id }); setRightPanel("item"); }}
                    onDelete={() => handleDeleteItem(item)}>
                    <p className="text-sm font-semibold text-gray-800 mb-1">{item.title}</p>
                    <div className="flex gap-2 flex-wrap">
                      {item.columns.map((c) => (
                        <span key={c._id} className="text-[11px] bg-gray-100 text-gray-600 rounded px-2 py-0.5">{c.label}</span>
                      ))}
                    </div>
                  </ItemCard>
                );
              }
              // section
              const isSelected = selected?.kind === "section" && selected.id === item._id;
              return (
                <ItemCard key={item._id} icon={ListChecks} label="Section" isSelected={isSelected}
                  onSelect={() => { setSelected({ kind: "section", id: item._id }); setRightPanel("item"); }}
                  onDelete={() => handleDeleteItem(item)}>
                  {item.title && <p className="text-sm font-semibold text-gray-800 mb-2">{item.title}</p>}
                  <div className="space-y-1.5">
                    {item.fields.map((f) => {
                      const Icon = fieldIcon(f.type);
                      const isFieldSelected = selected?.kind === "field" && selected.id === f._id;
                      return (
                        <div
                          key={f._id}
                          onClick={(e) => { e.stopPropagation(); setSelected({ kind: "field", id: f._id }); setRightPanel("item"); }}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors group/field",
                            isFieldSelected ? "border-[#0047AB] bg-[#0047AB]/5" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                          )}
                        >
                          <Icon size={13} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 flex-1 truncate">{f.label}{f.required && <span className="text-red-400"> *</span>}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{fieldTypeLabel(f.type)}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveFieldFromSection(item._id, f._id); }} className="opacity-0 group-hover/field:opacity-100 text-gray-300 hover:text-red-500 shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPickerForSection(item._id); }}
                    className="mt-2 flex items-center gap-1 text-[11px] text-[#0047AB] hover:underline"
                  >
                    <Plus size={11} />Add Field
                  </button>
                </ItemCard>
              );
            })}

            <button
              onClick={() => setShowAddItem(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-gray-300 hover:border-[#0047AB] hover:text-[#0047AB] text-gray-400 rounded-xl text-xs font-display font-bold transition-colors"
            >
              <Plus size={14} />Add Section, Table, or Instruction
            </button>
          </div>
        </main>

        {/* ── RIGHT: Item settings / Logic ── */}
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-gray-100 shrink-0">
            <button onClick={() => setRightPanel("item")} className={cn("flex-1 py-2.5 text-[11px] font-display font-bold transition-colors", rightPanel === "item" ? "text-[#0047AB] border-b-2 border-[#0047AB]" : "text-gray-400 hover:text-gray-600")}>Item</button>
            <button onClick={() => setRightPanel("logic")} className={cn("flex-1 py-2.5 text-[11px] font-display font-bold transition-colors", rightPanel === "logic" ? "text-[#0047AB] border-b-2 border-[#0047AB]" : "text-gray-400 hover:text-gray-600")}>Logic</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightPanel === "item" && (
              <>
                {selectedField && (
                  <FieldSettingsPanel field={selectedField} answerSets={answerSets} onUpdate={(patch) => updateFieldLocal(selectedField._id, patch)} />
                )}
                {selectedSection && (
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Section Title (optional)</Label>
                      <Input
                        value={selectedSection.title ?? ""}
                        onChange={(e) => handleItemTitleChange(selectedSection, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">{selectedSection.fields.length} field{selectedSection.fields.length === 1 ? "" : "s"} in this section.</p>
                  </div>
                )}
                {selectedTable && (
                  <TableSettingsPanel
                    table={selectedTable}
                    onTitleChange={(title) => handleItemTitleChange(selectedTable, title)}
                    onAddColumn={() => handleAddColumn(selectedTable)}
                    onColumnLabelChange={(columnId, label) => handleColumnLabelChange(selectedTable, columnId, label)}
                    onRemoveColumn={(columnId) => handleRemoveColumn(selectedTable, columnId)}
                  />
                )}
                {selectedInstruction && (
                  <div className="p-4 space-y-1.5">
                    <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Instruction Text</Label>
                    <Textarea
                      value={selectedInstruction.body}
                      onChange={(e) => handleInstructionBodyChange(selectedInstruction, e.target.value)}
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>
                )}
                {!selected && (
                  <div className="p-5 text-center text-gray-400 text-sm font-body mt-10">Select a field, section, table, or instruction to edit it.</div>
                )}
              </>
            )}
            {rightPanel === "logic" && (
              <LogicPanel
                rules={logic}
                fields={fieldsById}
                fieldOptions={allFieldOptions}
                pages={pages}
                answerSets={answerSets}
                onAdd={addLogicRule}
                onUpdate={updateLogicRule}
                onRemove={removeLogicRule}
              />
            )}
          </div>
        </aside>
      </div>

      {/* ── Field type picker ── */}
      {pickerForSection && (
        <FieldTypePicker onClose={() => setPickerForSection(null)} onPick={(type) => handleAddField(pickerForSection, type)} />
      )}

      {/* ── Add Section/Table/Instruction picker ── */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-bold text-[#0F1C2E]">Add to Page</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-2">
            <button onClick={() => handleAddItem("section")} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-[#0047AB] hover:bg-[#0047AB]/5">
              <ListChecks size={18} className="text-gray-500" /><span className="text-xs font-display font-bold">Section</span>
            </button>
            <button onClick={() => handleAddItem("table")} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-[#0047AB] hover:bg-[#0047AB]/5">
              <TableIcon size={18} className="text-gray-500" /><span className="text-xs font-display font-bold">Table</span>
            </button>
            <button onClick={() => handleAddItem("instruction")} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-[#0047AB] hover:bg-[#0047AB]/5">
              <Info size={18} className="text-gray-500" /><span className="text-xs font-display font-bold">Instruction</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete page confirmation ── */}
      <AlertDialog open={!!deletePageId} onOpenChange={(o) => !o && setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              This page has fields or logic that depends on it — deleting it will remove that content and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeletePage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Answer Sets drawer ── */}
      {showAnswerSets && (
        <AnswerSetsDrawer
          answerSets={answerSets}
          onClose={() => setShowAnswerSets(false)}
          onRefresh={(sets) => setAnswerSets(sets)}
        />
      )}

      {/* ── Previews ── */}
      {showPreview && (
        showPreview === "pdf" ? (
          <CompletedReportPreview form={form} answerSets={answerSets} onUpdateLayout={updateReportLayout} onClose={() => setShowPreview(null)} />
        ) : (
          <FormPreview form={form} answerSets={answerSets} device={showPreview} onDeviceChange={(d) => setShowPreview(d)} onOpenPdf={() => setShowPreview("pdf")} isDirty={saveStatus === "saving"} onClose={() => setShowPreview(null)} />
        )
      )}
    </div>
  );
}

// ─── Small shared UI pieces ────────────────────────────────────────────────────

function ItemCard({
  icon: Icon, label, isSelected, onSelect, onDelete, children,
}: {
  icon: React.ElementType; label: string; isSelected: boolean;
  onSelect: () => void; onDelete: () => void; children: React.ReactNode;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border-2 p-4 bg-white cursor-pointer transition-colors",
        isSelected ? "border-[#0047AB] shadow-sm" : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-center gap-1.5 mb-2 text-gray-400">
        <Icon size={12} />
        <span className="text-[10px] font-display font-bold uppercase tracking-wide">{label}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
          <Trash2 size={12} />
        </button>
      </div>
      {children}
    </div>
  );
}

function FieldSettingsPanel({ field, answerSets, onUpdate }: { field: FormFieldRecord; answerSets: AnswerSetRecord[]; onUpdate: (patch: Partial<FormFieldRecord>) => void }) {
  const isChoice = CHOICE_FIELD_TYPES.includes(field.type as FormFieldType);
  const resolvedOptions = field.answerSetId ? answerSets.find((a) => a._id === field.answerSetId)?.options ?? [] : field.options ?? [];

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Label</Label>
        <Input value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} className="text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Help Text</Label>
        <Input value={field.helpText ?? ""} onChange={(e) => onUpdate({ helpText: e.target.value })} placeholder="Optional guidance for the employee" className="text-sm" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Required</Label>
        <Switch checked={!!field.required} onCheckedChange={(v) => onUpdate({ required: v })} />
      </div>

      {field.type === "rating" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-display font-bold text-gray-500 uppercase">Min</Label>
            <Input type="number" value={field.min ?? 1} onChange={(e) => onUpdate({ min: Number(e.target.value) })} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-display font-bold text-gray-500 uppercase">Max</Label>
            <Input type="number" value={field.max ?? 5} onChange={(e) => onUpdate({ max: Number(e.target.value) })} className="text-sm" />
          </div>
        </div>
      )}

      {isChoice && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Choices</Label>
            <Select value={field.answerSetId ?? "__inline"} onValueChange={(v) => onUpdate(v === "__inline" ? { answerSetId: undefined } : { answerSetId: v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__inline">Custom options</SelectItem>
                {answerSets.map((a) => <SelectItem key={a._id} value={a._id}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!field.answerSetId && (
            <div className="space-y-1.5">
              {(field.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={opt}
                    onChange={(e) => { const options = [...(field.options ?? [])]; options[i] = e.target.value; onUpdate({ options }); }}
                    className="text-sm flex-1"
                  />
                  <button onClick={() => onUpdate({ options: (field.options ?? []).filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500"><X size={13} /></button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => onUpdate({ options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] })} className="w-full text-xs">
                <Plus size={12} className="mr-1" />Add Option
              </Button>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Flag as deficient when</Label>
            <div className="space-y-1">
              {resolvedOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={(field.flagValues ?? []).includes(opt)}
                    onChange={(e) => {
                      const flagValues = e.target.checked ? [...(field.flagValues ?? []), opt] : (field.flagValues ?? []).filter((v) => v !== opt);
                      onUpdate({ flagValues });
                    }}
                    className="accent-red-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TableSettingsPanel({ table, onTitleChange, onAddColumn, onColumnLabelChange, onRemoveColumn }: {
  table: TableItem;
  onTitleChange: (title: string) => void;
  onAddColumn: () => void;
  onColumnLabelChange: (columnId: string, label: string) => void;
  onRemoveColumn: (columnId: string) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Table Title</Label>
        <Input value={table.title ?? ""} onChange={(e) => onTitleChange(e.target.value)} className="text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Columns</Label>
        {table.columns.map((col) => (
          <div key={col._id} className="flex items-center gap-1.5">
            <Input value={col.label} onChange={(e) => onColumnLabelChange(col._id, e.target.value)} className="text-sm flex-1" />
            {table.columns.length > 1 && (
              <button onClick={() => onRemoveColumn(col._id)} className="text-gray-300 hover:text-red-500"><X size={13} /></button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={onAddColumn} className="w-full text-xs">
          <Plus size={12} className="mr-1" />Add Column
        </Button>
      </div>
    </div>
  );
}

const ACTION_LABELS: Record<LogicAction["type"], string> = {
  show: "Show field", hide: "Hide field", skip_to: "Skip to page",
  require_followup: "Require follow-up on", flag: "Flag response as deficient", notify: "Notify a role",
};

function LogicPanel({
  rules, fields, fieldOptions, pages, answerSets, onAdd, onUpdate, onRemove,
}: {
  rules: LogicRule[];
  fields: Record<string, FormFieldRecord>;
  fieldOptions: { id: string; label: string }[];
  pages: FormPageRecord[];
  answerSets: AnswerSetRecord[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LogicRule>) => void;
  onRemove: (id: string) => void;
}) {
  const resolveOptions = (field?: FormFieldRecord): string[] => {
    if (!field) return [];
    if (field.answerSetId) return answerSets.find((a) => a._id === field.answerSetId)?.options ?? [];
    if (field.type === "yes_no") return ["Yes", "No"];
    if (field.type === "yes_no_na") return ["Yes", "No", "N/A"];
    return field.options ?? [];
  };

  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] text-gray-400">Plain If/Then rules — no code. Rules apply across the whole form.</p>
      {rules.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No rules yet.</p>}
      {rules.map((rule) => {
        const sourceField = fields[rule.sourceFieldId];
        const sourceMissing = !sourceField;
        const action = rule.actions[0];
        const options = resolveOptions(sourceField);
        let targetMissing = false;
        if (action?.type === "show" || action?.type === "hide" || action?.type === "require_followup") {
          const targetId = action.type === "require_followup" ? action.fieldId : action.targetId;
          targetMissing = !fields[targetId];
        } else if (action?.type === "skip_to") {
          targetMissing = !pages.some((p) => p._id === action.targetPageId);
        }
        const selfReference = (action?.type === "show" || action?.type === "hide") && action.targetId === rule.sourceFieldId;
        const broken = sourceMissing || targetMissing || selfReference;

        return (
          <div key={rule.id} className={cn("border rounded-lg p-3 space-y-2", broken ? "border-red-300 bg-red-50" : "border-gray-200")}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-display font-bold text-gray-400 uppercase">If</span>
              <button onClick={() => onRemove(rule.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
            </div>
            <Select value={rule.sourceFieldId} onValueChange={(v) => onUpdate(rule.id, { sourceFieldId: v })}>
              <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select a field" /></SelectTrigger>
              <SelectContent>{fieldOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-[10px] font-display font-bold text-gray-400 uppercase">equals</div>
            {options.length > 0 ? (
              <Select value={rule.condition.equals ?? ""} onValueChange={(v) => onUpdate(rule.id, { condition: { equals: v } })}>
                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select a value" /></SelectTrigger>
                <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input value={rule.condition.equals ?? ""} onChange={(e) => onUpdate(rule.id, { condition: { equals: e.target.value } })} placeholder="value" className="text-xs h-8" />
            )}
            <div className="text-[10px] font-display font-bold text-gray-400 uppercase">Then</div>
            <Select
              value={action?.type ?? "flag"}
              onValueChange={(v) => {
                const type = v as LogicAction["type"];
                let newAction: LogicAction;
                if (type === "show" || type === "hide") newAction = { type, targetId: fieldOptions.find((f) => f.id !== rule.sourceFieldId)?.id ?? rule.sourceFieldId };
                else if (type === "skip_to") newAction = { type, targetPageId: pages[0]?._id ?? "" };
                else if (type === "require_followup") newAction = { type, fieldId: fieldOptions.find((f) => f.id !== rule.sourceFieldId)?.id ?? rule.sourceFieldId };
                else if (type === "notify") newAction = { type, role: "Safety Manager" };
                else newAction = { type: "flag" };
                onUpdate(rule.id, { actions: [newAction] });
              }}
            >
              <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTION_LABELS) as LogicAction["type"][]).map((t) => <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>

            {(action?.type === "show" || action?.type === "hide") && (
              <Select value={action.targetId} onValueChange={(v) => onUpdate(rule.id, { actions: [{ type: action.type, targetId: v }] })}>
                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select a field" /></SelectTrigger>
                <SelectContent>{fieldOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {action?.type === "require_followup" && (
              <Select value={action.fieldId} onValueChange={(v) => onUpdate(rule.id, { actions: [{ type: "require_followup", fieldId: v }] })}>
                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select a field" /></SelectTrigger>
                <SelectContent>{fieldOptions.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {action?.type === "skip_to" && (
              <Select value={action.targetPageId} onValueChange={(v) => onUpdate(rule.id, { actions: [{ type: "skip_to", targetPageId: v }] })}>
                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select a page" /></SelectTrigger>
                <SelectContent>{pages.map((p) => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {action?.type === "notify" && (
              <Input value={action.role} onChange={(e) => onUpdate(rule.id, { actions: [{ type: "notify", role: e.target.value }] })} placeholder="Role or person" className="text-xs h-8" />
            )}

            {broken && (
              <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertTriangle size={11} />
                {sourceMissing ? "This rule's field no longer exists." : selfReference ? "This rule targets its own field." : "This rule's target no longer exists."}
              </p>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={onAdd} className="w-full text-xs">
        <Plus size={12} className="mr-1" />Add Rule
      </Button>
    </div>
  );
}

function AnswerSetsDrawer({ answerSets, onClose, onRefresh }: {
  answerSets: AnswerSetRecord[]; onClose: () => void; onRefresh: (sets: AnswerSetRecord[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  const reload = async () => {
    try {
      const res = await getAnswerSets();
      onRefresh(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to refresh answer sets");
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    try {
      await createAnswerSet({ label: newLabel.trim(), options: ["Option 1", "Option 2"] });
      setNewLabel("");
      await reload();
      toast.success("Answer set added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add answer set");
    }
  };

  const updateOptions = async (id: string, options: string[]) => {
    onRefresh(answerSets.map((a) => (a._id === id ? { ...a, options } : a)));
    try {
      await updateAnswerSet(id, { options });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save answer set");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteAnswerSet(id);
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete answer set");
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetTitle className="sr-only">Answer Sets</SheetTitle>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Answer Sets</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <p className="text-xs text-gray-400">Reusable, org-wide choice lists. Changes apply to forms using them going forward — already-submitted responses keep their original answers.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="New answer set name" className="text-sm" />
            <Button onClick={handleAdd} className="bg-[#0047AB] hover:bg-[#1565C0] text-white shrink-0"><Plus size={14} /></Button>
          </div>
          {answerSets.map((set) => (
            <div key={set._id} className="border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{set.label}</span>
                <button onClick={() => handleRemove(set._id)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
              <div className="space-y-1">
                {set.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input value={opt} onChange={(e) => { const options = [...set.options]; options[i] = e.target.value; updateOptions(set._id, options); }} className="text-xs h-8" />
                    <button onClick={() => updateOptions(set._id, set.options.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => updateOptions(set._id, [...set.options, "New Option"])} className="text-[11px] text-[#0047AB] hover:underline flex items-center gap-1">
                  <Plus size={10} />Add option
                </button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
