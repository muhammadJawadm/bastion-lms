/**
 * LMS Forms — Company Admin
 * Create, manage, publish, and review forms and responses against the real
 * backend (`src/lib/api.ts`'s Forms + Answer Sets functions).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ClipboardCheck, Plus, Search, Loader2, MoreHorizontal, Pencil, Copy, Trash2,
  Eye, FileText, Globe, Lock, User, Calendar, MessageSquare, UserPlus, Users,
  ArrowLeft, Shield, Camera, PenLine, AlertTriangle,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import {
  getForms, createForm, updateForm, deleteForm, getFormById, getFormResponses, getFormResponseById,
  createFormAssignment, getFormAssignments, getCompanyPeople, getCompany,
  ApiError,
  type FormRecord, type FormResponseRecord, type FormFieldRecord, type CompanyPerson,
  type FormAssignmentRecord, type CompanyRecord,
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
import type { ReportLayoutConfig } from "./formBuilder/types";
import { DEFAULT_REPORT_LAYOUT } from "./formBuilder/types";

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

function ResponsesModal({ form, peopleById, onClose, onOpenReport }: {
  form: FormRecord;
  peopleById: Record<string, CompanyPerson>;
  onClose: () => void;
  onOpenReport: (responseId: string) => void;
}) {
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
              <button
                key={r._id}
                onClick={() => onOpenReport(r._id)}
                className="w-full text-left bg-[#F4F6F9] hover:bg-[#EAEEF3] rounded-xl p-4 space-y-2 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {peopleById[r.submittedBy]?.name ?? r.submittedBy}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" /> {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  {r.answers.slice(0, 4).map((a) => (
                    <div key={a.fieldId} className="text-xs">
                      <span className={cn("font-semibold uppercase tracking-wide", a.flagged ? "text-red-500" : "text-gray-400")}>
                        {fieldLabels[a.fieldId]?.label ?? a.fieldId}:{" "}
                      </span>
                      <span className="text-gray-700">{a.value}</span>
                    </div>
                  ))}
                  {r.answers.length > 4 && <p className="text-[11px] text-[#0047AB] font-semibold">+{r.answers.length - 4} more — view full report</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Form Modal ────────────────────────────────────────────────────────

function AssignFormModal({ form, onClose }: { form: FormRecord; onClose: () => void }) {
  const [people, setPeople] = useState<CompanyPerson[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [userId, setUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    getCompanyPeople({ role: "user" })
      .then((res) => setPeople(res.data))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Couldn't load employees."))
      .finally(() => setIsLoadingPeople(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { toast.error("Select an employee to assign this form to."); return; }
    if (!dueDate) { toast.error("Set a due date."); return; }
    setIsPending(true);
    try {
      await createFormAssignment({ formId: form._id, userId, dueDate: new Date(dueDate).toISOString() });
      toast.success("Form assigned — the employee has been notified.");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't assign the form.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Assign “{form.title}”</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {form.status === "draft" && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This form is still a draft. Employees can't fill it in until it's published.
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Employee *</Label>
            {isLoadingPeople ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading employees…</div>
            ) : people.length === 0 ? (
              <p className="text-sm text-gray-400">No employees found. Add one under Employees first.</p>
            ) : (
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-[#0047AB] focus:ring-2 focus:ring-[#0047AB]/20"
              >
                <option value="">Select an employee…</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Due Date *</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
          </div>
          <DialogFooter className="pt-2 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isLoadingPeople || people.length === 0} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Assigning...</> : "Assign Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assignments Modal ────────────────────────────────────────────────────────

const ASSIGNMENT_STATUS_STYLES: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  submitted: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

function AssignmentsModal({ form, peopleById, onClose, onAssignMore }: {
  form: FormRecord;
  peopleById: Record<string, CompanyPerson>;
  onClose: () => void;
  onAssignMore: () => void;
}) {
  const [assignments, setAssignments] = useState<FormAssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFormAssignments({ formId: form._id })
      .then((res) => setAssignments(res.data))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Couldn't load assignments."))
      .finally(() => setIsLoading(false));
  }, [form._id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left flex-shrink-0">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">{form.title} — Assignments</DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto space-y-2 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : assignments.length === 0 ? (
            <Empty className="py-10 border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><Users className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold text-sm">Not assigned to anyone yet</EmptyTitle>
                <EmptyDescription>Assign this form to an employee so it shows up on their mobile app.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={onAssignMore} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide gap-2 h-auto py-2 px-4">
                  <UserPlus className="w-3.5 h-3.5" /> Assign to Employee
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {assignments.map((a) => {
                const person = peopleById[a.userId];
                const status = a.displayStatus ?? "assigned";
                return (
                  <div key={a._id} className="flex items-center justify-between p-3 bg-[#F4F6F9] rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{person?.name ?? a.userId}</div>
                      <div className="text-xs text-gray-400">{person?.email ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn("border-transparent text-[10px] font-bold uppercase tracking-wide mb-1", ASSIGNMENT_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600")}>
                        {status}
                      </Badge>
                      <div className="text-[11px] text-gray-400">Due {new Date(a.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" onClick={onAssignMore} className="w-full text-xs font-bold uppercase tracking-wide gap-2 mt-2">
                <UserPlus className="w-3.5 h-3.5" /> Assign to Another Employee
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Response Report Modal (real submission, rendered with the form's designed report layout) ──

function resolveAnswer(answers: FormResponseRecord["answers"], fieldId: string): { value: string; flagged: boolean } {
  const a = answers.find((x) => x.fieldId === fieldId);
  return { value: a?.value ?? "—", flagged: !!a?.flagged };
}

function ResponseReportModal({ form, responseId, peopleById, companyName, onClose }: {
  form: FormRecord;
  responseId: string;
  peopleById: Record<string, CompanyPerson>;
  companyName: string;
  onClose: () => void;
}) {
  const [response, setResponse] = useState<FormResponseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFormResponseById(form._id, responseId)
      .then((res) => setResponse(res.data))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Couldn't load this response."))
      .finally(() => setIsLoading(false));
  }, [form._id, responseId]);

  const layout: ReportLayoutConfig = (form.reportLayout as ReportLayoutConfig | undefined) ?? DEFAULT_REPORT_LAYOUT;
  const pages = form.pages ?? [];
  const allFields = pages.flatMap((p) => p.items).flatMap((i) => (i.kind === "section" ? i.fields : []));
  const flaggedCount = response?.answers.filter((a) => a.flagged).length ?? 0;
  const submittedByName = response ? (peopleById[response.submittedBy]?.name ?? response.submittedBy) : "—";
  const pageStyle = layout.pageSize === "letter" ? { width: "8.5in", minHeight: "11in" } : { width: "210mm", minHeight: "297mm" };

  return (
    <div className="fixed inset-0 bg-[#0F1C2E]/90 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-[#0F1C2E] border-b border-white/10 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /><span>Back to Responses</span>
        </button>
        <span className="text-white/70 text-sm font-body">{form.title} — Completed Report</span>
        <div className="w-24" />
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-200">
        {isLoading || !response ? (
          <div className="flex items-center justify-center py-20 text-white/60"><Loader2 className="animate-spin" size={28} /></div>
        ) : (
          <div className="bg-white shadow-2xl text-[#0F1C2E]" style={{ ...pageStyle, padding: "0.75in" }}>
            {layout.sections.cover && (
              <div className="text-center py-16 border-b-2 border-gray-200 mb-8">
                <div className="w-14 h-14 rounded-xl bg-[#0047AB] flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <h1 className="font-display font-extrabold text-2xl uppercase">{form.title}</h1>
                <p className="text-gray-400 text-sm mt-1">Completed Report</p>
                <p className="text-gray-400 text-xs mt-6">{companyName}</p>
              </div>
            )}

            {layout.sections.toc && (
              <div className="mb-8">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Table of Contents</h2>
                {pages.map((p, i) => (
                  <div key={p._id} className="flex justify-between text-sm text-gray-600 py-0.5">
                    <span>{i + 1}. {p.title}</span><span>{i + 2}</span>
                  </div>
                ))}
              </div>
            )}

            {layout.sections.preparedBy && (
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div><div className="text-[10px] text-gray-400 uppercase font-bold">Prepared By</div><div>{submittedByName}</div></div>
                <div><div className="text-[10px] text-gray-400 uppercase font-bold">Date</div><div>{response.createdAt ? new Date(response.createdAt).toLocaleDateString() : "—"}</div></div>
                <div><div className="text-[10px] text-gray-400 uppercase font-bold">Company</div><div>{companyName}</div></div>
              </div>
            )}

            {layout.sections.summary && (
              <div className="mb-6 bg-[#F4F6F9] rounded-lg p-4 flex gap-6 text-sm">
                <div><span className="font-bold">{allFields.length}</span> questions</div>
                <div><span className="font-bold">{pages.length}</span> pages</div>
                <div className={flaggedCount > 0 ? "text-red-600 font-semibold" : ""}>{flaggedCount} flagged</div>
              </div>
            )}

            {layout.sections.scores && (
              <div className="mb-6">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Compliance Score</h2>
                <p className="text-3xl font-display font-extrabold text-[#0047AB]">{Math.max(0, 100 - flaggedCount * 15)}%</p>
              </div>
            )}

            {pages.map((page) => (
              <div key={page._id} className="mb-6" style={{ breakInside: "avoid" }}>
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">{page.title}</h2>
                {page.items.map((item) => {
                  if (item.kind === "instruction") return null;
                  if (item.kind === "table" && layout.sections.tables) {
                    const tableRows = response.tableRows?.find((t) => t.itemId === item._id)?.rows ?? [];
                    return (
                      <table key={item._id} className="w-full text-xs my-2 border-collapse">
                        <thead><tr>{item.columns.map((c) => <th key={c._id} className="border border-gray-200 bg-gray-50 text-left p-1.5">{c.label}</th>)}</tr></thead>
                        <tbody>
                          {tableRows.length === 0 ? (
                            <tr><td colSpan={item.columns.length} className="border border-gray-200 p-1.5 text-gray-400 italic">No rows submitted</td></tr>
                          ) : (
                            tableRows.map((row, ri) => (
                              <tr key={ri}>
                                {item.columns.map((c) => (
                                  <td key={c._id} className="border border-gray-200 p-1.5">{row.cells.find((cell) => cell.columnId === c._id)?.value ?? "—"}</td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    );
                  }
                  if (item.kind === "section") {
                    return (
                      <div key={item._id} className="space-y-1.5 my-2">
                        {item.fields.map((field) => {
                          const { value: answer, flagged } = resolveAnswer(response.answers, field._id);
                          if (field.type === "photo" && !layout.sections.media) return null;
                          if (field.type === "signature" && !layout.sections.signatures) return null;
                          return (
                            <div key={field._id} className={cn("flex items-start justify-between text-sm py-1", flagged && layout.sections.flaggedItems && "bg-red-50 -mx-1 px-1 rounded")}>
                              <span className="text-gray-500">{field.label}</span>
                              <span className={cn("font-medium text-right flex items-center gap-1", flagged && layout.sections.flaggedItems && "text-red-600")}>
                                {field.type === "photo" && <Camera size={12} />}
                                {field.type === "signature" && <PenLine size={12} />}
                                {answer}
                                {flagged && layout.sections.flaggedItems && <AlertTriangle size={12} />}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}

            {layout.sections.flaggedItems && flaggedCount > 0 && (
              <div className="mb-6 border-t-2 border-red-200 pt-4">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 text-red-600">Flagged Items & Corrective Actions</h2>
                {allFields.map((f) => {
                  const { value: answer, flagged } = resolveAnswer(response.answers, f._id);
                  if (!flagged) return null;
                  return (
                    <div key={f._id} className="text-sm text-gray-700 py-1 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-red-500" />{f.label} — {answer}
                      <span className="text-gray-400 ml-auto text-xs italic">Corrective action pending</span>
                    </div>
                  );
                })}
              </div>
            )}

            {layout.sections.disclaimer && (
              <p className="text-[10px] text-gray-400 border-t border-gray-200 pt-3 mt-6">
                This report is generated based on responses submitted through the Bastion LMS mobile app and is intended for internal safety recordkeeping purposes only.
              </p>
            )}

            {layout.sections.footer && (
              <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-2 mt-6">
                {companyName} · Generated {new Date().toLocaleDateString()} · Page 1
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
  const [assignForm, setAssignForm] = useState<FormRecord | null>(null);
  const [assignmentsForm, setAssignmentsForm] = useState<FormRecord | null>(null);
  const [reportView, setReportView] = useState<{ form: FormRecord; responseId: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [people, setPeople] = useState<CompanyPerson[]>([]);
  const [company, setCompanyRecord] = useState<CompanyRecord | null>(null);
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p._id, p])), [people]);

  useEffect(() => {
    if (!effectiveCompanyId) return;
    getCompanyPeople({ role: "all" }).then((res) => setPeople(res.data)).catch(() => {});
    getCompany(effectiveCompanyId).then((res) => setCompanyRecord(res.data)).catch(() => {});
  }, [effectiveCompanyId]);

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
      .filter((r) => !q || r.formTitle.toLowerCase().includes(q) || (peopleById[r.submittedBy]?.name ?? r.submittedBy).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [forms, responsesByForm, search, peopleById]);

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
      {responsesForm && !reportView && (
        <ResponsesModal
          form={responsesForm}
          peopleById={peopleById}
          onClose={() => setResponsesForm(null)}
          onOpenReport={(responseId) => setReportView({ form: responsesForm, responseId })}
        />
      )}
      {assignForm && <AssignFormModal form={assignForm} onClose={() => setAssignForm(null)} />}
      {assignmentsForm && (
        <AssignmentsModal
          form={assignmentsForm}
          peopleById={peopleById}
          onClose={() => setAssignmentsForm(null)}
          onAssignMore={() => { setAssignForm(assignmentsForm); setAssignmentsForm(null); }}
        />
      )}
      {reportView && (
        <ResponseReportModal
          form={reportView.form}
          responseId={reportView.responseId}
          peopleById={peopleById}
          companyName={company?.name ?? ""}
          onClose={() => setReportView(null)}
        />
      )}

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
                                <User className="w-3.5 h-3.5 text-gray-400" />{peopleById[r.submittedBy]?.name ?? r.submittedBy}
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
                                <button onClick={() => { setAssignForm(form); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  <UserPlus className="w-3.5 h-3.5" /> Assign to Employee
                                </button>
                                <button onClick={() => { setAssignmentsForm(form); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  <Users className="w-3.5 h-3.5" /> View Assignments
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
