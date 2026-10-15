/* ============================================================
   FORM PREVIEW — Desktop/mobile learner-facing preview of a form,
   with live conditional logic. Mirrors builder/CoursePreview.tsx's
   device-frame structure. Never submits anywhere real — a client-only
   simulation over whatever the form currently looks like.
   ============================================================ */
import { useMemo, useState } from "react";
import {
  Monitor, Smartphone, X, Shield, FileText, AlertTriangle, Camera, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MOCK_EMPLOYEES } from "../mockData";
import type { AnswerSetRecord, FormFieldRecord, FormRecord } from "@/lib/api";
import type { LogicAction, LogicRule } from "./types";

type PreviewDevice = "desktop" | "mobile";

interface FormPreviewProps {
  form: FormRecord;
  answerSets: AnswerSetRecord[];
  device: PreviewDevice;
  onDeviceChange: (d: PreviewDevice) => void;
  onOpenPdf: () => void;
  isDirty?: boolean;
  onClose: () => void;
}

function resolveOptions(field: FormFieldRecord, answerSets: AnswerSetRecord[]): string[] {
  if (field.answerSetId) return answerSets.find((a) => a._id === field.answerSetId)?.options ?? [];
  if (field.type === "yes_no") return ["Yes", "No"];
  if (field.type === "yes_no_na") return ["Yes", "No", "N/A"];
  return field.options ?? [];
}

export function FormPreview({ form, answerSets, device, onDeviceChange, onOpenPdf, isDirty, onClose }: FormPreviewProps) {
  const pages = form.pages ?? [];
  const logic = (form.logic as LogicRule[] | undefined) ?? [];
  const [currentPageId, setCurrentPageId] = useState(pages[0]?._id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentPageIndex = pages.findIndex((p) => p._id === currentPageId);
  const currentPage = pages[currentPageIndex] ?? pages[0];

  // Evaluate which fields are hidden and which are flagged/need a follow-up,
  // given the rules whose condition currently matches.
  const { hidden, flagged, followups } = useMemo(() => {
    const hidden = new Set<string>();
    const flagged = new Set<string>();
    const followups = new Set<string>();
    for (const rule of logic) {
      const sourceValue = answers[rule.sourceFieldId];
      const matches = rule.condition.equals !== undefined && sourceValue === rule.condition.equals && sourceValue !== undefined && sourceValue !== "";
      if (!matches) continue;
      for (const action of rule.actions) {
        if (action.type === "hide") hidden.add(action.targetId);
        if (action.type === "show") hidden.delete(action.targetId);
        if (action.type === "flag") flagged.add(rule.sourceFieldId);
        if (action.type === "require_followup") followups.add(action.fieldId);
      }
    }
    return { hidden, flagged, followups };
  }, [answers, logic]);

  const findSkipTarget = (): string | null => {
    for (const rule of logic) {
      const sourceValue = answers[rule.sourceFieldId];
      const matches = rule.condition.equals !== undefined && sourceValue === rule.condition.equals;
      if (!matches) continue;
      const skip = rule.actions.find((a): a is Extract<LogicAction, { type: "skip_to" }> => a.type === "skip_to");
      if (skip) return skip.targetPageId;
    }
    return null;
  };

  const handleNext = () => {
    const skipTarget = findSkipTarget();
    if (skipTarget) { setCurrentPageId(skipTarget); return; }
    const next = pages[currentPageIndex + 1];
    if (next) setCurrentPageId(next._id);
    else toast.success("Preview complete — no response was recorded.");
  };

  const setAnswer = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    // Surface "notify" rules as a one-off toast, matching this app's pattern
    // of simulating notifications rather than sending real ones.
    for (const rule of logic) {
      if (rule.sourceFieldId !== fieldId || rule.condition.equals !== value) continue;
      const notify = rule.actions.find((a): a is Extract<LogicAction, { type: "notify" }> => a.type === "notify");
      if (notify) toast.info(`Would notify ${notify.role} on submission (preview only)`);
    }
  };

  const renderField = (field: FormFieldRecord) => {
    if (hidden.has(field._id)) return null;
    const options = resolveOptions(field, answerSets);
    const isFlagged = flagged.has(field._id);

    let control: React.ReactNode;
    switch (field.type) {
      case "long_text":
        control = <Textarea value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} rows={3} className="text-sm resize-none" />;
        break;
      case "number":
        control = <Input type="number" value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} className="text-sm" />;
        break;
      case "date":
        control = <Input type="date" value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} className="text-sm" />;
        break;
      case "datetime":
        control = <Input type="datetime-local" value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} className="text-sm" />;
        break;
      case "dropdown":
      case "multiple_choice":
      case "yes_no":
      case "yes_no_na":
        control = (
          <Select value={answers[field._id] ?? ""} onValueChange={(v) => setAnswer(field._id, v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
        break;
      case "checkbox":
        control = (
          <div className="space-y-1.5">
            {options.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="accent-[#0047AB]" onChange={(e) => setAnswer(field._id, e.target.checked ? o : "")} />
                {o}
              </label>
            ))}
          </div>
        );
        break;
      case "photo":
        control = (
          <button type="button" onClick={() => toast.info("Preview only — no file is uploaded")} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-6 flex flex-col items-center gap-1.5 text-gray-400 hover:border-[#0047AB] hover:text-[#0047AB] transition-colors">
            <Camera size={18} /><span className="text-xs">Attach Photo</span>
          </button>
        );
        break;
      case "signature":
        control = <Input value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} placeholder="Type your full name" className="text-sm italic" />;
        break;
      case "rating": {
        const min = field.min ?? 1, max = field.max ?? 5;
        control = (
          <div className="flex items-center gap-3">
            <input type="range" min={min} max={max} value={answers[field._id] ?? min} onChange={(e) => setAnswer(field._id, e.target.value)} className="flex-1 accent-[#0047AB]" />
            <span className="text-sm font-semibold text-gray-700 w-6 text-center">{answers[field._id] ?? min}</span>
          </div>
        );
        break;
      }
      case "person":
        control = (
          <Select value={answers[field._id] ?? ""} onValueChange={(v) => setAnswer(field._id, v)}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Select a person…" /></SelectTrigger>
            <SelectContent>{MOCK_EMPLOYEES.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        );
        break;
      case "location":
        control = (
          <div className="flex items-center gap-2">
            <Input value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} placeholder="Enter or share your location" className="text-sm flex-1" />
            <MapPin size={16} className="text-gray-400 shrink-0" />
          </div>
        );
        break;
      default:
        control = <Input value={answers[field._id] ?? ""} onChange={(e) => setAnswer(field._id, e.target.value)} className="text-sm" />;
    }

    return (
      <div key={field._id} className="space-y-1.5">
        <label className="text-xs font-display font-bold text-gray-600 flex items-center gap-1.5">
          {field.label}{field.required && <span className="text-red-500">*</span>}
          {isFlagged && <span className="text-[10px] text-red-500 font-body flex items-center gap-0.5"><AlertTriangle size={10} />Flagged</span>}
        </label>
        {field.helpText && <p className="text-[11px] text-gray-400">{field.helpText}</p>}
        {control}
        {followups.has(field._id) && (
          <Input placeholder="Follow-up details required…" className="text-sm mt-1 border-amber-300" />
        )}
      </div>
    );
  };

  const width = device === "mobile" ? "w-[390px]" : "w-full max-w-2xl";

  return (
    <div className="fixed inset-0 bg-[#0F1C2E]/90 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-[#0F1C2E] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-[#1E90FF]" />
          <span className="text-white font-display font-bold text-sm">Form Preview</span>
          <span className="text-white/40 text-sm font-body">—</span>
          <span className="text-white/70 text-sm font-body">{form.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDeviceChange("desktop")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors", device === "desktop" ? "bg-[#1E90FF] text-white" : "text-white/60 hover:text-white hover:bg-white/10")}>
            <Monitor size={14} />Desktop
          </button>
          <button onClick={() => onDeviceChange("mobile")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors", device === "mobile" ? "bg-[#1E90FF] text-white" : "text-white/60 hover:text-white hover:bg-white/10")}>
            <Smartphone size={14} />Mobile
          </button>
          <button onClick={onOpenPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors text-white/60 hover:text-white hover:bg-white/10">
            <FileText size={14} />Completed PDF
          </button>
          <div className="w-px h-5 bg-white/20 mx-2" />
          <Button variant="outline" size="sm" onClick={onClose} className="text-white border-white/30 hover:bg-white/10 font-display font-bold text-xs">
            <X size={14} className="mr-1" />Close
          </Button>
        </div>
      </div>

      {isDirty && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-body py-1.5">
          <AlertTriangle size={13} />This preview includes unsaved changes.
        </div>
      )}

      <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-100">
        <div className={cn(width, "bg-white rounded-2xl shadow-2xl overflow-hidden")}>
          <div className="bg-[#0F1C2E] px-6 py-4">
            <p className="text-blue-200 text-xs font-body">{form.title}</p>
            <h1 className="text-white font-display font-bold text-lg">{currentPage?.title}</h1>
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {currentPage?.items.map((item) => {
              if (item.kind === "instruction") {
                return <div key={item._id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">{item.body}</div>;
              }
              if (item.kind === "table") {
                return (
                  <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-display font-bold text-gray-700">{item.title}</div>
                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr>{item.columns.map((c) => <th key={c._id} className="text-left text-gray-400 font-semibold pb-1 pr-3">{c.label}</th>)}</tr></thead>
                        <tbody><tr>{item.columns.map((c) => <td key={c._id} className="pr-3 pt-1 text-gray-300 italic">—</td>)}</tr></tbody>
                      </table>
                    </div>
                  </div>
                );
              }
              return (
                <div key={item._id} className="space-y-3">
                  {item.title && <p className="text-sm font-semibold text-gray-800">{item.title}</p>}
                  {item.fields.map((f) => renderField(f))}
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
            <button
              disabled={currentPageIndex === 0}
              onClick={() => { const prev = pages[currentPageIndex - 1]; if (prev) setCurrentPageId(prev._id); }}
              className="text-sm font-display font-bold text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              ← Previous
            </button>
            <button onClick={handleNext} className="px-6 py-2 bg-[#0047AB] hover:bg-[#1565C0] text-white text-sm font-display font-bold rounded-lg transition-colors">
              {currentPageIndex >= pages.length - 1 ? "Finish" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
