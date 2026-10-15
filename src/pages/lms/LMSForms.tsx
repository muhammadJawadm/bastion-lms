/**
 * LMS Forms — Company Admin
 * Create, manage, publish, and review forms and responses against the real
 * backend (`src/lib/api.ts`'s Forms + Answer Sets functions).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ClipboardCheck, Plus, Search, Loader2, MoreHorizontal, Pencil, Copy, Trash2,
  Eye, FileText, Globe, Lock, User, Calendar, MessageSquare,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import {
  getForms, createForm, updateForm, deleteForm, getFormById, getFormResponses,
  ApiError, type FormRecord, type FormResponseRecord, type FormFieldRecord,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewTab = "all" | "draft" | "published" | "responses";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "all", label: "All Forms" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "responses", label: "Responses" },
];

// ─── Create Form Modal ────────────────────────────────────────────────────────

function CreateFormModal({ companyId, ownerId, onClose, onCreated }: {
  companyId: string;
  ownerId: string;
  onClose: () => void;
  onCreated: (f: FormRecord) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Form title is required"); return; }
    if (!companyId || !ownerId) { toast.error("Missing company/user context — try signing in again."); return; }
    setIsPending(true);
    try {
      const res = await createForm({ title: title.trim(), description: description.trim(), ownerId });
      onCreated(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create the form.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">New Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Incident Report" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this form for?" className="resize-none focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
          </div>
          <DialogFooter className="pt-2 sm:justify-stretch">
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

// ─── Edit Form Modal ──────────────────────────────────────────────────────────

function EditFormModal({ form, onClose, onSaved }: { form: FormRecord; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description ?? "");
  const [status, setStatus] = useState(form.status);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Form title is required"); return; }
    setIsPending(true);
    try {
      // `title` isn't in the collection's PATCH example — sent anyway so this
      // starts working the moment that's added, harmless until then.
      await updateForm(form._id, { title: title.trim(), description: description.trim(), status });
      toast.success("Form saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the form.");
    } finally {
      setIsPending(false);
    }
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

/** Flattens every field across every page/section of a form into one id→label lookup. */
function buildFieldLabelMap(form: FormRecord): Record<string, FormFieldRecord> {
  const map: Record<string, FormFieldRecord> = {};
  for (const page of form.pages ?? []) {
    for (const item of page.items) {
      if (item.kind === "section") {
        for (const field of item.fields) map[field._id] = field;
      }
    }
  }
  return map;
}

function ResponsesModal({ form, onClose }: { form: FormRecord; onClose: () => void }) {
  const [responses, setResponses] = useState<FormResponseRecord[]>([]);
  const [fieldLabels, setFieldLabels] = useState<Record<string, FormFieldRecord>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [responsesRes, formRes] = await Promise.all([getFormResponses(form._id), getFormById(form._id)]);
        setResponses(responsesRes.data);
        setFieldLabels(buildFieldLabelMap(formRes.data));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Couldn't load responses.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [form._id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-0 gap-0 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left flex-shrink-0">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">{form.title} — Responses</DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : responses.length === 0 ? (
            <Empty className="py-10 border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><MessageSquare className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold text-sm">No responses yet</EmptyTitle>
                <EmptyDescription>Responses will appear here once this form is submitted.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            responses.map((r) => (
              <div key={r._id} className="bg-[#F4F6F9] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {r.submittedBy}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" /> {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  {r.answers.map((a) => (
                    <div key={a.fieldId} className="text-xs">
                      <span className={cn("font-semibold uppercase tracking-wide", a.flagged ? "text-red-500" : "text-gray-400")}>
                        {fieldLabels[a.fieldId]?.label ?? a.fieldId}:{" "}
                      </span>
                      <span className="text-gray-700">{a.value}</span>
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
  const { role, setRole, effectiveCompanyId, user } = useLMS();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [responsesByForm, setResponsesByForm] = useState<Record<string, FormResponseRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingForm, setEditingForm] = useState<FormRecord | null>(null);
  const [responsesForm, setResponsesForm] = useState<FormRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    if (!effectiveCompanyId) {
      setForms([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getForms();
      setForms(res.data);
      const entries = await Promise.all(
        res.data.map(async (f) => {
          try {
            return [f._id, (await getFormResponses(f._id)).data] as const;
          } catch {
            return [f._id, [] as FormResponseRecord[]] as const;
          }
        })
      );
      setResponsesByForm(Object.fromEntries(entries));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load forms.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const getResponseCount = useCallback((formId: string) => responsesByForm[formId]?.length ?? 0, [responsesByForm]);

  const filtered = useMemo(() => {
    if (activeTab === "responses") return [];
    return forms.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch = f.title.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
      const matchStatus = activeTab === "all" || f.status === activeTab;
      return matchSearch && matchStatus;
    });
  }, [forms, search, activeTab]);

  const allResponses = useMemo(() => {
    const q = search.toLowerCase();
    return forms
      .flatMap((f) => (responsesByForm[f._id] ?? []).map((r) => ({ ...r, formTitle: f.title })))
      .filter((r) => !q || r.formTitle.toLowerCase().includes(q) || r.submittedBy.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [forms, responsesByForm, search]);

  const draftCount = forms.filter((f) => f.status === "draft").length;
  const publishedCount = forms.filter((f) => f.status === "published").length;
  const totalResponses = forms.reduce((sum, f) => sum + getResponseCount(f._id), 0);

  async function handleDuplicate(form: FormRecord) {
    if (!effectiveCompanyId || !user?.id) return;
    try {
      await createForm({ title: `${form.title} (Copy)`, description: form.description, ownerId: user.id });
      await loadForms();
      toast.success("Form duplicated — pages and fields aren't copied yet, just title and description.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't duplicate the form.");
    }
  }

  async function handleDelete() {
    if (deleteId == null) return;
    try {
      await deleteForm(deleteId);
      await loadForms();
      toast.success("Form deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete the form.");
    } finally {
      setDeleteId(null);
    }
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
          companyId={effectiveCompanyId ?? ""}
          ownerId={user?.id ?? ""}
          onClose={() => setShowCreate(false)}
          onCreated={(form) => {
            // Route straight into the Form Builder — no detour back to this list.
            setShowCreate(false);
            navigate(`/lms/forms/builder/${form._id}`);
          }}
        />
      )}
      {editingForm && <EditFormModal form={editingForm} onClose={() => setEditingForm(null)} onSaved={() => { loadForms(); setEditingForm(null); }} />}
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

        {/* Sub-tabs */}
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
              placeholder={activeTab === "responses" ? "Search responses..." : "Search forms..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-white/40"><Loader2 className="animate-spin" size={24} /></div>
        ) : (
          <>
            {/* Responses sub-tab — aggregated across all forms */}
            {activeTab === "responses" && (
              allResponses.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                        <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Submitted By</TableHead>
                        <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Form</TableHead>
                        <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allResponses.map((r) => {
                        const form = forms.find((f) => f._id === r.formId);
                        return (
                          <TableRow key={r._id} className="border-gray-50">
                            <TableCell className="px-5 py-3">
                              <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                <User className="w-3.5 h-3.5 text-gray-400" />{r.submittedBy}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3">
                              <button
                                onClick={() => form && setResponsesForm(form)}
                                className="text-[#0047AB] font-semibold hover:underline text-sm"
                              >
                                {r.formTitle}
                              </button>
                            </TableCell>
                            <TableCell className="px-5 py-3 text-gray-400 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</TableCell>
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
                      <TableRow key={form._id} className="border-gray-50">
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
                        <TableCell className="px-5 py-3 text-gray-600 hidden md:table-cell">{form.ownerName ?? "—"}</TableCell>
                        <TableCell className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">{form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="px-5 py-3">
                          <button onClick={() => setResponsesForm(form)} className="text-[#0047AB] font-semibold hover:underline text-sm">
                            {getResponseCount(form._id)}
                          </button>
                        </TableCell>
                        <TableCell className="px-5 py-3 relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === form._id ? null : form._id)}
                            className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === form._id && (
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
                                <button onClick={() => { setDeleteId(form._id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
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
          </>
        )}
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
    </LMSLayout>
  );
}
