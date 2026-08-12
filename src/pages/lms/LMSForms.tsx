/**
 * LMS Forms — Company Admin
 * Create, manage, publish, and review forms and responses. Runs on the
 * same local mock-store pattern as the rest of the LMS: mutations write
 * into formsStore/formResponsesStore in mockData.ts (module-level state so
 * it survives navigation between routes, no backend).
 */

import { useMemo, useState } from "react";
import {
  ClipboardCheck, Plus, Search, Loader2, MoreHorizontal, Pencil, Copy, Trash2,
  Eye, FileText, Globe, Lock, User, Calendar, MessageSquare, Sparkles, X,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import {
  formsStore, addForm, patchForm, removeForm, getFormResponses, getResponseCount,
  formResponsesStore, formTemplatesStore, addFormTemplate, removeFormTemplate,
  type MockForm, type MockFormTemplate,
} from "./mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STRUCTURE_LABELS: Record<MockForm["template"], string> = {
  blank: "Blank",
  incident_report: "Incident Report fields",
  daily_checklist: "Daily Checklist fields",
};

/** Forms sub-navigation — brief calls for these five as sub-tabs, not new sidebar tabs. */
type ViewTab = "all" | "draft" | "published" | "templates" | "responses";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "all", label: "All Forms" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "templates", label: "Templates" },
  { id: "responses", label: "Responses" },
];

// ─── Create Form Modal ────────────────────────────────────────────────────────

function CreateFormModal({ templates, onClose, onCreated, initialTemplateId }: {
  templates: MockFormTemplate[];
  onClose: () => void;
  onCreated: (f: MockForm) => void;
  initialTemplateId?: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string>(initialTemplateId ?? "blank");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Form title is required"); return; }
    const structure = templates.find((t) => t.id === templateId)?.structure ?? "blank";
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onCreated(addForm({ title: title.trim(), description: description.trim(), template: structure, ownerName: "Sarah Chen" }));
      toast.success("Form created as a draft");
    }, 400);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left shrink-0">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">New Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Incident Report" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this form for?" className="resize-none focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Start From</Label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "text-left p-3 rounded-xl border-2 transition-all",
                      templateId === t.id ? "border-[#0047AB] bg-[#0047AB]/5" : "border-gray-100 hover:border-[#0047AB]/30"
                    )}
                  >
                    <div className="font-display font-bold text-[#0F1C2E] text-xs uppercase flex items-center gap-1.5">
                      {t.label}
                      {t.isCustom && <Sparkles size={10} className="text-[#0047AB]" />}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-gray-100 shrink-0 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Template Modal ───────────────────────────────────────────────────────

function AddTemplateModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (t: MockFormTemplate) => void;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [structure, setStructure] = useState<MockForm["template"]>("blank");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { toast.error("Template name is required"); return; }
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onCreated(addFormTemplate({ label: label.trim(), description: description.trim(), structure }));
      toast.success("Template added");
    }, 400);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Add Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Template Name *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Equipment Inspection" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this template for?" className="resize-none focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Field Layout</Label>
            <Select value={structure} onValueChange={(v) => setStructure(v as MockForm["template"])}>
              <SelectTrigger className="w-full focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank</SelectItem>
                <SelectItem value="incident_report">Incident Report fields</SelectItem>
                <SelectItem value="daily_checklist">Daily Checklist fields</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-gray-400">Forms created from this template will start with these fields.</p>
          </div>
          <DialogFooter className="pt-2 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : "Add Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Form Modal ──────────────────────────────────────────────────────────

function EditFormModal({ form, onClose, onSaved }: { form: MockForm; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description);
  const [status, setStatus] = useState(form.status);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Form title is required"); return; }
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      patchForm(form.id, { title: title.trim(), description: description.trim(), status });
      toast.success("Form saved");
      onSaved();
    }, 400);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Edit Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Status</Label>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 text-xs font-display font-bold uppercase tracking-wide transition-colors",
                    status === s ? "border-[#0047AB] bg-[#0047AB]/5 text-[#0047AB]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {s === "draft" ? "Draft" : "Published"}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-2 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Responses Modal ──────────────────────────────────────────────────────────

function ResponsesModal({ form, onClose }: { form: MockForm; onClose: () => void }) {
  const responses = getFormResponses(form.id);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-0 gap-0 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left flex-shrink-0">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">{form.title} — Responses</DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto space-y-3">
          {responses.length === 0 ? (
            <Empty className="py-10 border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><MessageSquare className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold text-sm">No responses yet</EmptyTitle>
                <EmptyDescription>Responses will appear here once this form is submitted.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            responses.map((r) => (
              <div key={r.id} className="bg-[#F4F6F9] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {r.respondentName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" /> {new Date(r.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-1">
                  {Object.entries(r.answers).map(([key, val]) => (
                    <div key={key} className="text-xs">
                      <span className="text-gray-400 font-semibold uppercase tracking-wide">{key.replace(/([A-Z])/g, " $1")}: </span>
                      <span className="text-gray-700">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LMSForms() {
  const { role, setRole } = useLMS();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [forms, setForms] = useState<MockForm[]>(formsStore);
  const [templates, setTemplates] = useState<MockFormTemplate[]>(formTemplatesStore);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [prefillTemplateId, setPrefillTemplateId] = useState<string | undefined>(undefined);
  const [editingForm, setEditingForm] = useState<MockForm | null>(null);
  const [responsesForm, setResponsesForm] = useState<MockForm | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const refresh = () => setForms([...formsStore]);
  const refreshTemplates = () => setTemplates([...formTemplatesStore]);

  const filtered = useMemo(() => {
    if (activeTab === "templates" || activeTab === "responses") return [];
    return forms.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch = f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
      const matchStatus = activeTab === "all" || f.status === activeTab;
      return matchSearch && matchStatus;
    });
  }, [forms, search, activeTab]);

  const allResponses = useMemo(() => {
    const q = search.toLowerCase();
    return [...formResponsesStore]
      .filter((r) => {
        if (!q) return true;
        const formTitle = forms.find((f) => f.id === r.formId)?.title ?? "";
        return r.respondentName.toLowerCase().includes(q) || formTitle.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [forms, search]);

  const draftCount = forms.filter((f) => f.status === "draft").length;
  const publishedCount = forms.filter((f) => f.status === "published").length;
  const totalResponses = forms.reduce((sum, f) => sum + getResponseCount(f.id), 0);

  function handleDuplicate(form: MockForm) {
    addForm({ title: `${form.title} (Copy)`, description: form.description, template: form.template, ownerName: form.ownerName });
    refresh();
    toast.success("Form duplicated");
  }

  function handleDelete() {
    if (deleteId == null) return;
    removeForm(deleteId);
    refresh();
    setDeleteId(null);
    toast.success("Form deleted");
  }

  function handleDeleteTemplate() {
    if (deleteTemplateId == null) return;
    removeFormTemplate(deleteTemplateId);
    refreshTemplates();
    setDeleteTemplateId(null);
    toast.success("Template deleted");
  }

  return (
    <LMSLayout
      title="Forms"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Forms" }]}
      role={role}
      onRoleChange={setRole}
    >
      {showCreate && (
        <CreateFormModal
          templates={templates}
          initialTemplateId={prefillTemplateId}
          onClose={() => { setShowCreate(false); setPrefillTemplateId(undefined); }}
          onCreated={() => { refresh(); setShowCreate(false); setPrefillTemplateId(undefined); setActiveTab("draft"); }}
        />
      )}
      {showAddTemplate && (
        <AddTemplateModal
          onClose={() => setShowAddTemplate(false)}
          onCreated={() => { refreshTemplates(); setShowAddTemplate(false); }}
        />
      )}
      {editingForm && <EditFormModal form={editingForm} onClose={() => setEditingForm(null)} onSaved={() => { refresh(); setEditingForm(null); }} />}
      {responsesForm && <ResponsesModal form={responsesForm} onClose={() => setResponsesForm(null)} />}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">Forms</h2>
            <p className="text-white/50 text-sm mt-0.5">Create, publish, and review forms and responses.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm gap-2 h-auto py-2 px-4">
            <Plus size={15} /> Create Form
          </Button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Forms", value: forms.length, color: "text-white" },
            { label: "Drafts", value: draftCount, color: "text-amber-400" },
            { label: "Published", value: publishedCount, color: "text-green-400" },
            { label: "Responses", value: totalResponses, color: "text-[#1E90FF]" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className={cn("font-display font-extrabold text-2xl uppercase", s.color)}>{s.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sub-tabs: Create form / Templates / Responses / Drafts / Published — not new sidebar tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto">
          {VIEW_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "shrink-0 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === t.id ? "border-[#1E90FF] text-white" : "border-transparent text-white/50 hover:text-white/80"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <Input
              type="text"
              placeholder={activeTab === "responses" ? "Search responses..." : activeTab === "templates" ? "Search templates..." : "Search forms..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
            />
          </div>
          {activeTab === "templates" && (
            <Button
              onClick={() => setShowAddTemplate(true)}
              variant="outline"
              className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 bg-transparent font-bold text-sm gap-2 h-auto py-2 px-4 shrink-0"
            >
              <Plus size={15} /> Add Template
            </Button>
          )}
        </div>

        {/* Templates sub-tab */}
        {activeTab === "templates" && (
          templates.filter((t) => !search || t.label.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.filter((t) => !search || t.label.toLowerCase().includes(search.toLowerCase())).map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 relative">
                  {t.isCustom && (
                    <button
                      onClick={() => setDeleteTemplateId(t.id)}
                      className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete template"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="w-9 h-9 rounded-lg bg-[#0047AB]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#0047AB]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 pr-4">
                      {t.label}
                      {t.isCustom && <Sparkles size={11} className="text-[#0047AB] shrink-0" />}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 leading-relaxed">{t.description || STRUCTURE_LABELS[t.structure]}</div>
                  </div>
                  <Button
                    onClick={() => { setPrefillTemplateId(t.id); setShowCreate(true); }}
                    className="mt-auto bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide h-auto py-2"
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-20">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50 size-14"><FileText className="text-gray-300 size-7" /></EmptyMedia>
                <EmptyTitle className="font-display uppercase text-gray-400 text-xl">No Templates Found</EmptyTitle>
                <EmptyDescription>Try a different search term.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        )}

        {/* Responses sub-tab — aggregated across all forms */}
        {activeTab === "responses" && (
          allResponses.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Respondent</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Form</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allResponses.map((r) => {
                    const form = forms.find((f) => f.id === r.formId);
                    return (
                      <TableRow key={r.id} className="border-gray-50">
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                            <User className="w-3.5 h-3.5 text-gray-400" />{r.respondentName}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <button
                            onClick={() => form && setResponsesForm(form)}
                            className="text-[#0047AB] font-semibold hover:underline text-sm"
                          >
                            {form?.title ?? `Form #${r.formId}`}
                          </button>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-gray-400 text-xs">{new Date(r.submittedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-20">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50 size-14"><MessageSquare className="text-gray-300 size-7" /></EmptyMedia>
                <EmptyTitle className="font-display uppercase text-gray-400 text-xl">No Responses Yet</EmptyTitle>
                <EmptyDescription>Responses will appear here once your published forms are submitted.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        )}

        {/* Table — All / Drafts / Published */}
        {(activeTab === "all" || activeTab === "draft" || activeTab === "published") && (
        filtered.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Form</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Owner</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Last Updated</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Responses</TableHead>
                  <TableHead className="px-5 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((form) => (
                  <TableRow key={form.id} className="border-gray-50">
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0047AB]/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-[#0047AB]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 truncate">{form.title}</div>
                          <div className="text-xs text-gray-400 truncate">{form.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge className={cn(
                        "gap-1 border-transparent text-[10px] font-bold uppercase tracking-wide",
                        form.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {form.status === "published" ? <Globe size={9} /> : <Lock size={9} />}
                        {form.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-600 hidden md:table-cell">{form.ownerName}</TableCell>
                    <TableCell className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">{new Date(form.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="px-5 py-3">
                      <button onClick={() => setResponsesForm(form)} className="text-[#0047AB] font-semibold hover:underline text-sm">
                        {getResponseCount(form.id)}
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-3 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === form.id ? null : form.id)}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === form.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-5 top-9 z-20 bg-white border border-gray-100 rounded-xl shadow-xl py-1 w-40">
                            <button onClick={() => { setEditingForm(form); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => { setResponsesForm(form); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                              <Eye className="w-3.5 h-3.5" /> View Responses
                            </button>
                            <button onClick={() => { handleDuplicate(form); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                              <Copy className="w-3.5 h-3.5" /> Duplicate
                            </button>
                            <button onClick={() => { setDeleteId(form.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="bg-white rounded-xl border border-gray-100 py-20">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-50 size-14">
                <ClipboardCheck className="text-gray-300 size-7" />
              </EmptyMedia>
              <EmptyTitle className="font-display uppercase text-gray-400 text-xl">
                {search || activeTab !== "all" ? "No Forms Found" : "No Forms Yet"}
              </EmptyTitle>
              <EmptyDescription>
                {search || activeTab !== "all" ? "Try adjusting your search or filter." : "Create your first form to start collecting incident reports, checklists, or sign-ins."}
              </EmptyDescription>
            </EmptyHeader>
            {!search && activeTab === "all" && (
              <EmptyContent>
                <Button onClick={() => setShowCreate(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
                  <Plus className="w-4 h-4" /> Create Form
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ))}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form?</AlertDialogTitle>
            <AlertDialogDescription>
              This form and its recorded responses will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTemplateId !== null} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This template will no longer be available when creating new forms. Forms already created from it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteTemplate}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LMSLayout>
  );
}
