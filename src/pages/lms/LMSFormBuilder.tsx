/**
 * @file LMSFormBuilder.tsx
 * @description Form Builder for the Bastion LMS Company Admin (UI Prototype).
 *
 * Modeled on the Course Builder's three-pane layout (`LMSBuilder.tsx`):
 *  LEFT   — Page list (add / duplicate / delete / drag-reorder)
 *  CENTER — Active page's sections/tables/instructions, with a field picker
 *  RIGHT  — Selected item's settings, or the form's conditional-logic rules
 *
 * Runs entirely on the mock `formDefinitionsStore` in mockData.ts — no
 * network calls, matching every other builder in this app.
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
  getForm, patchForm, getFormDefinition, patchFormDefinition,
  answerSetsStore, addAnswerSet, patchAnswerSet, removeAnswerSet,
  type MockForm,
} from "./mockData";
import type {
  FormPage, FormPageItem, FormField, FormFieldType, FormSection, FormTable, FormInstruction,
  LogicRule, LogicAction, AnswerSet, MockFormDefinition,
} from "./formBuilder/types";
import { FIELD_TYPE_LABELS, CHOICE_FIELD_TYPES } from "./formBuilder/types";
import { FormPreview } from "./formBuilder/FormPreview";
import { CompletedReportPreview } from "./formBuilder/CompletedReportPreview";

const uid = () => crypto.randomUUID();

const FIELD_TYPE_ICONS: Record<FormFieldType, React.ElementType> = {
  short_text: Type, long_text: Type, number: Hash, date: Calendar, datetime: Calendar,
  dropdown: ChevronDownSquare, multiple_choice: CircleCheck, yes_no: ToggleLeft, yes_no_na: ToggleLeft,
  checkbox: CheckSquare, photo: Camera, signature: PenLine, rating: SlidersHorizontal,
  person: User, location: MapPin, instruction: Info,
};

function newField(type: FormFieldType): FormField {
  return {
    id: uid(),
    type,
    label: FIELD_TYPE_LABELS[type],
    required: false,
    options: CHOICE_FIELD_TYPES.includes(type) ? ["Option 1", "Option 2"] : undefined,
  };
}

// ─── Field type picker (mirrors BlockPicker's neutral-card pattern) ───────────

function FieldTypePicker({ onPick, onClose }: { onPick: (type: FormFieldType) => void; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-gray-100 text-left shrink-0">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Add Field</DialogTitle>
        </DialogHeader>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto">
          {(Object.keys(FIELD_TYPE_LABELS) as FormFieldType[]).map((type) => {
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
  page: FormPage; isActive: boolean; index: number;
  onClick: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
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
  const formId = Number(params.id);

  const [form, setForm] = useState<MockForm | undefined>(() => getForm(formId));
  const [def, setDef] = useState<MockFormDefinition>(() => getFormDefinition(formId));
  const [answerSets, setAnswerSets] = useState<AnswerSet[]>(answerSetsStore);
  const [activePageId, setActivePageId] = useState<string>(def.pages[0]?.id ?? "");
  const [selected, setSelected] = useState<{ kind: "field" | "section" | "table" | "instruction"; id: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<"item" | "logic">("item");
  const [pickerForSection, setPickerForSection] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAnswerSets, setShowAnswerSets] = useState(false);
  const [showPreview, setShowPreview] = useState<"desktop" | "mobile" | "pdf" | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePage = def.pages.find((p) => p.id === activePageId) ?? def.pages[0];

  const update = useCallback((patch: Partial<MockFormDefinition>) => {
    setDef((prev) => {
      const next = { ...prev, ...patch };
      return next;
    });
    setIsDirty(true);
  }, []);

  // Debounced autosave — mirrors the Course Builder's pattern exactly.
  useEffect(() => {
    if (!isDirty) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      patchFormDefinition(formId, def);
      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handlePageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = def.pages.findIndex((p) => p.id === active.id);
    const newIdx = def.pages.findIndex((p) => p.id === over.id);
    update({ pages: arrayMove(def.pages, oldIdx, newIdx) });
  };

  const handleAddPage = () => {
    const page: FormPage = { id: uid(), title: `Page ${def.pages.length + 1}`, items: [] };
    update({ pages: [...def.pages, page] });
    setActivePageId(page.id);
  };

  const handleDuplicatePage = (pageId: string) => {
    const page = def.pages.find((p) => p.id === pageId);
    if (!page) return;
    // Deep-clone with fresh ids for the page and everything inside it, and
    // clone the referenced fields into `def.fields` under new ids too.
    const idMap = new Map<string, string>();
    const newFields = { ...def.fields };
    const cloneField = (fieldId: string): string => {
      const newId = uid();
      idMap.set(fieldId, newId);
      newFields[newId] = { ...def.fields[fieldId], id: newId };
      return newId;
    };
    const newItems: FormPageItem[] = page.items.map((item) => {
      if (item.kind === "section") {
        return { kind: "section", section: { ...item.section, id: uid(), fieldIds: item.section.fieldIds.map(cloneField) } };
      }
      if (item.kind === "table") {
        return { kind: "table", table: { ...item.table, id: uid() } };
      }
      return { kind: "instruction", instruction: { ...item.instruction, id: uid() } };
    });
    const newPage: FormPage = { id: uid(), title: `${page.title} (Copy)`, items: newItems };
    const idx = def.pages.findIndex((p) => p.id === pageId);
    const pages = [...def.pages];
    pages.splice(idx + 1, 0, newPage);
    update({ pages, fields: newFields });
    setActivePageId(newPage.id);
    toast.success("Page duplicated");
  };

  const handleDeletePage = () => {
    if (!deletePageId) return;
    const pages = def.pages.filter((p) => p.id !== deletePageId);
    update({ pages: pages.length > 0 ? pages : [{ id: uid(), title: "Page 1", items: [] }] });
    if (activePageId === deletePageId) setActivePageId(pages[0]?.id ?? "");
    setDeletePageId(null);
    toast.success("Page deleted");
  };

  const requestDeletePage = (pageId: string) => {
    const page = def.pages.find((p) => p.id === pageId);
    // Confirm plainly if the page has content or logic references it — a bare
    // empty page can just go, per the report's "confirm only when it matters".
    const hasContent = !!page && page.items.length > 0;
    const hasLogic = def.logic.some((r) => r.actions.some((a) => a.type === "skip_to" && a.targetPageId === pageId));
    if (hasContent || hasLogic) {
      setDeletePageId(pageId);
    } else {
      update({ pages: def.pages.filter((p) => p.id !== pageId) });
      if (activePageId === pageId) setActivePageId(def.pages.find((p) => p.id !== pageId)?.id ?? "");
    }
  };

  // ── Page item mutations ──
  const updatePageItems = (pageId: string, items: FormPageItem[]) => {
    update({ pages: def.pages.map((p) => (p.id === pageId ? { ...p, items } : p)) });
  };

  const handleAddItem = (kind: "section" | "table" | "instruction") => {
    if (!activePage) return;
    let item: FormPageItem;
    if (kind === "section") item = { kind: "section", section: { id: uid(), fieldIds: [] } };
    else if (kind === "table") item = { kind: "table", table: { id: uid(), title: "Table", columns: ["Column 1", "Column 2"] } };
    else item = { kind: "instruction", instruction: { id: uid(), body: "Enter instructions for the employee here…" } };
    updatePageItems(activePage.id, [...activePage.items, item]);
    setShowAddItem(false);
  };

  const handleDeleteItem = (item: FormPageItem) => {
    if (!activePage) return;
    if (item.kind === "section") {
      const fields = { ...def.fields };
      item.section.fieldIds.forEach((id) => delete fields[id]);
      update({ pages: def.pages.map((p) => (p.id === activePage.id ? { ...p, items: p.items.filter((i) => i !== item) } : p)), fields });
    } else {
      updatePageItems(activePage.id, activePage.items.filter((i) => i !== item));
    }
    setSelected(null);
  };

  const handleAddField = (sectionId: string, type: FormFieldType) => {
    if (!activePage) return;
    const field = newField(type);
    const items = activePage.items.map((item) =>
      item.kind === "section" && item.section.id === sectionId
        ? { ...item, section: { ...item.section, fieldIds: [...item.section.fieldIds, field.id] } }
        : item
    );
    update({ pages: def.pages.map((p) => (p.id === activePage.id ? { ...p, items } : p)), fields: { ...def.fields, [field.id]: field } });
    setSelected({ kind: "field", id: field.id });
    setRightPanel("item");
  };

  const handleRemoveFieldFromSection = (sectionId: string, fieldId: string) => {
    if (!activePage) return;
    const items = activePage.items.map((item) =>
      item.kind === "section" && item.section.id === sectionId
        ? { ...item, section: { ...item.section, fieldIds: item.section.fieldIds.filter((id) => id !== fieldId) } }
        : item
    );
    const fields = { ...def.fields };
    delete fields[fieldId];
    update({ pages: def.pages.map((p) => (p.id === activePage.id ? { ...p, items } : p)), fields });
    if (selected?.kind === "field" && selected.id === fieldId) setSelected(null);
  };

  const updateField = (fieldId: string, patch: Partial<FormField>) => {
    update({ fields: { ...def.fields, [fieldId]: { ...def.fields[fieldId], ...patch } } });
  };

  // ── Logic ──
  const addLogicRule = () => {
    const firstField = Object.keys(def.fields)[0];
    if (!firstField) { toast.error("Add at least one field before creating a rule."); return; }
    const rule: LogicRule = { id: uid(), sourceFieldId: firstField, condition: { equals: "" }, actions: [{ type: "flag" }] };
    update({ logic: [...def.logic, rule] });
  };
  const updateLogicRule = (ruleId: string, patch: Partial<LogicRule>) => {
    update({ logic: def.logic.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)) });
  };
  const removeLogicRule = (ruleId: string) => {
    update({ logic: def.logic.filter((r) => r.id !== ruleId) });
  };

  const allFieldOptions = useMemo(
    () => Object.values(def.fields).map((f) => ({ id: f.id, label: f.label })),
    [def.fields]
  );

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

  const selectedField = selected?.kind === "field" ? def.fields[selected.id] : null;
  const selectedSection = selected?.kind === "section"
    ? activePage.items.find((i): i is Extract<FormPageItem, { kind: "section" }> => i.kind === "section" && i.section.id === selected.id)?.section
    : null;
  const selectedTable = selected?.kind === "table"
    ? activePage.items.find((i): i is Extract<FormPageItem, { kind: "table" }> => i.kind === "table" && i.table.id === selected.id)?.table
    : null;
  const selectedInstruction = selected?.kind === "instruction"
    ? activePage.items.find((i): i is Extract<FormPageItem, { kind: "instruction" }> => i.kind === "instruction" && i.instruction.id === selected.id)?.instruction
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
          onChange={(e) => { const title = e.target.value; setForm((f) => f && { ...f, title }); patchForm(form.id, { title }); }}
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
              <SortableContext items={def.pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {def.pages.map((page, idx) => (
                  <SortablePageRow
                    key={page.id}
                    page={page}
                    index={idx}
                    isActive={page.id === activePageId}
                    onClick={() => setActivePageId(page.id)}
                    onDuplicate={() => handleDuplicatePage(page.id)}
                    onDelete={() => requestDeletePage(page.id)}
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
              onChange={(e) => update({ pages: def.pages.map((p) => (p.id === activePage.id ? { ...p, title: e.target.value } : p)) })}
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
                const isSelected = selected?.kind === "instruction" && selected.id === item.instruction.id;
                return (
                  <ItemCard key={item.instruction.id} icon={Info} label="Instruction" isSelected={isSelected}
                    onSelect={() => { setSelected({ kind: "instruction", id: item.instruction.id }); setRightPanel("item"); }}
                    onDelete={() => handleDeleteItem(item)}>
                    <p className="text-sm text-gray-600 font-body">{item.instruction.body}</p>
                  </ItemCard>
                );
              }
              if (item.kind === "table") {
                const isSelected = selected?.kind === "table" && selected.id === item.table.id;
                return (
                  <ItemCard key={item.table.id} icon={TableIcon} label="Table" isSelected={isSelected}
                    onSelect={() => { setSelected({ kind: "table", id: item.table.id }); setRightPanel("item"); }}
                    onDelete={() => handleDeleteItem(item)}>
                    <p className="text-sm font-semibold text-gray-800 mb-1">{item.table.title}</p>
                    <div className="flex gap-2 flex-wrap">
                      {item.table.columns.map((c, i) => (
                        <span key={i} className="text-[11px] bg-gray-100 text-gray-600 rounded px-2 py-0.5">{c}</span>
                      ))}
                    </div>
                  </ItemCard>
                );
              }
              // section
              const isSelected = selected?.kind === "section" && selected.id === item.section.id;
              return (
                <ItemCard key={item.section.id} icon={ListChecks} label="Section" isSelected={isSelected}
                  onSelect={() => { setSelected({ kind: "section", id: item.section.id }); setRightPanel("item"); }}
                  onDelete={() => handleDeleteItem(item)}>
                  {item.section.title && <p className="text-sm font-semibold text-gray-800 mb-2">{item.section.title}</p>}
                  <div className="space-y-1.5">
                    {item.section.fieldIds.map((fid) => {
                      const f = def.fields[fid];
                      if (!f) return null;
                      const Icon = FIELD_TYPE_ICONS[f.type];
                      const isFieldSelected = selected?.kind === "field" && selected.id === fid;
                      return (
                        <div
                          key={fid}
                          onClick={(e) => { e.stopPropagation(); setSelected({ kind: "field", id: fid }); setRightPanel("item"); }}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors group/field",
                            isFieldSelected ? "border-[#0047AB] bg-[#0047AB]/5" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                          )}
                        >
                          <Icon size={13} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 flex-1 truncate">{f.label}{f.required && <span className="text-red-400"> *</span>}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{FIELD_TYPE_LABELS[f.type]}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveFieldFromSection(item.section.id, fid); }} className="opacity-0 group-hover/field:opacity-100 text-gray-300 hover:text-red-500 shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPickerForSection(item.section.id); }}
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
                  <FieldSettingsPanel field={selectedField} answerSets={answerSets} onUpdate={(patch) => updateField(selectedField.id, patch)} />
                )}
                {selectedSection && (
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Section Title (optional)</Label>
                      <Input
                        value={selectedSection.title ?? ""}
                        onChange={(e) => updatePageItems(activePage.id, activePage.items.map((i) => i.kind === "section" && i.section.id === selectedSection.id ? { ...i, section: { ...i.section, title: e.target.value } } : i))}
                        className="text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">{selectedSection.fieldIds.length} field{selectedSection.fieldIds.length === 1 ? "" : "s"} in this section.</p>
                  </div>
                )}
                {selectedTable && (
                  <TableSettingsPanel
                    table={selectedTable}
                    onUpdate={(patch) => updatePageItems(activePage.id, activePage.items.map((i) => i.kind === "table" && i.table.id === selectedTable.id ? { ...i, table: { ...i.table, ...patch } } : i))}
                  />
                )}
                {selectedInstruction && (
                  <div className="p-4 space-y-1.5">
                    <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Instruction Text</Label>
                    <Textarea
                      value={selectedInstruction.body}
                      onChange={(e) => updatePageItems(activePage.id, activePage.items.map((i) => i.kind === "instruction" && i.instruction.id === selectedInstruction.id ? { ...i, instruction: { ...i.instruction, body: e.target.value } } : i))}
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
                rules={def.logic}
                fields={def.fields}
                fieldOptions={allFieldOptions}
                pages={def.pages}
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
          onRefresh={() => setAnswerSets([...answerSetsStore])}
        />
      )}

      {/* ── Previews ── */}
      {showPreview && (
        showPreview === "pdf" ? (
          <CompletedReportPreview form={form} def={def} onUpdateLayout={(reportLayout) => update({ reportLayout })} onClose={() => setShowPreview(null)} />
        ) : (
          <FormPreview form={form} def={def} device={showPreview} onDeviceChange={(d) => setShowPreview(d)} onOpenPdf={() => setShowPreview("pdf")} isDirty={isDirty} onClose={() => setShowPreview(null)} />
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

function FieldSettingsPanel({ field, answerSets, onUpdate }: { field: FormField; answerSets: AnswerSet[]; onUpdate: (patch: Partial<FormField>) => void }) {
  const isChoice = CHOICE_FIELD_TYPES.includes(field.type);
  const resolvedOptions = field.answerSetId ? answerSets.find((a) => a.id === field.answerSetId)?.options ?? [] : field.options ?? [];

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
      {field.type !== "instruction" && (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Required</Label>
          <Switch checked={field.required} onCheckedChange={(v) => onUpdate({ required: v })} />
        </div>
      )}

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
                {answerSets.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
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

function TableSettingsPanel({ table, onUpdate }: { table: FormTable; onUpdate: (patch: Partial<FormTable>) => void }) {
  return (
    <div className="p-4 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Table Title</Label>
        <Input value={table.title} onChange={(e) => onUpdate({ title: e.target.value })} className="text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide">Columns</Label>
        {table.columns.map((col, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input value={col} onChange={(e) => { const columns = [...table.columns]; columns[i] = e.target.value; onUpdate({ columns }); }} className="text-sm flex-1" />
            {table.columns.length > 1 && (
              <button onClick={() => onUpdate({ columns: table.columns.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500"><X size={13} /></button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onUpdate({ columns: [...table.columns, `Column ${table.columns.length + 1}`] })} className="w-full text-xs">
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
  fields: Record<string, FormField>;
  fieldOptions: { id: string; label: string }[];
  pages: FormPage[];
  answerSets: AnswerSet[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LogicRule>) => void;
  onRemove: (id: string) => void;
}) {
  const resolveOptions = (field?: FormField): string[] => {
    if (!field) return [];
    if (field.answerSetId) return answerSets.find((a) => a.id === field.answerSetId)?.options ?? [];
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
          targetMissing = !pages.some((p) => p.id === action.targetPageId);
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
                else if (type === "skip_to") newAction = { type, targetPageId: pages[0]?.id ?? "" };
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
                <SelectContent>{pages.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
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

function AnswerSetsDrawer({ answerSets, onClose, onRefresh }: { answerSets: AnswerSet[]; onClose: () => void; onRefresh: () => void }) {
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addAnswerSet({ label: newLabel.trim(), options: ["Option 1", "Option 2"] });
    setNewLabel("");
    onRefresh();
    toast.success("Answer set added");
  };

  const updateOptions = (id: string, options: string[]) => {
    patchAnswerSet(id, { options });
    onRefresh();
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
            <div key={set.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{set.label}</span>
                {set.isCustom && (
                  <button onClick={() => { removeAnswerSet(set.id); onRefresh(); }} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                )}
              </div>
              <div className="space-y-1">
                {set.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input value={opt} onChange={(e) => { const options = [...set.options]; options[i] = e.target.value; updateOptions(set.id, options); }} className="text-xs h-8" />
                    <button onClick={() => updateOptions(set.id, set.options.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => updateOptions(set.id, [...set.options, "New Option"])} className="text-[11px] text-[#0047AB] hover:underline flex items-center gap-1">
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
