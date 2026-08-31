/* ============================================================
   COMPLETED REPORT PREVIEW — a live, configurable preview of what a
   filled-out form exports as, per the Course + Form Builder
   requirements report (§14-15). One fixed layout, toggleable
   sections, US Letter / A4 page size. This is an in-app preview,
   not a real PDF export — matching how Certificates/Invoices
   elsewhere in this app show "download coming soon" rather than
   generating a real file.
   ============================================================ */
import { useState } from "react";
import { X, Shield, AlertTriangle, Camera, PenLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MOCK_EMPLOYEES, companyStore, answerSetsStore, type MockForm } from "../mockData";
import type { FormField, MockFormDefinition, ReportLayoutConfig, ReportSectionKey } from "./types";
import { REPORT_SECTION_LABELS } from "./types";

interface CompletedReportPreviewProps {
  form: MockForm;
  def: MockFormDefinition;
  onUpdateLayout: (layout: ReportLayoutConfig) => void;
  onClose: () => void;
}

/** A plausible sample answer per field type — for demonstration only. */
function sampleAnswer(field: FormField): string {
  const resolvedOptions = field.answerSetId ? answerSetsStore.find((a) => a.id === field.answerSetId)?.options ?? [] : field.options ?? [];
  switch (field.type) {
    case "short_text": return "Sample response";
    case "long_text": return "Sample written response describing the situation in detail for this demonstration report.";
    case "number": return "42";
    case "date": return new Date().toLocaleDateString();
    case "datetime": return new Date().toLocaleString();
    case "dropdown":
    case "multiple_choice":
      return field.flagValues?.[0] ?? resolvedOptions[0] ?? "—";
    case "yes_no": return "Yes";
    case "yes_no_na": return "N/A";
    case "checkbox": return resolvedOptions.slice(0, 2).join(", ") || "—";
    case "photo": return "[Photo attached]";
    case "signature": return "Sarah Chen";
    case "rating": return String(Math.round(((field.min ?? 1) + (field.max ?? 5)) / 2));
    case "person": return MOCK_EMPLOYEES[0]?.name ?? "—";
    case "location": return "Building A, Job Site 3";
    default: return "—";
  }
}

function isFlagged(field: FormField, answer: string): boolean {
  return !!field.flagValues?.includes(answer);
}

export function CompletedReportPreview({ form, def, onUpdateLayout, onClose }: CompletedReportPreviewProps) {
  const { reportLayout } = def;
  const [layout, setLayout] = useState<ReportLayoutConfig>(reportLayout);

  const toggleSection = (key: ReportSectionKey) => {
    const next = { ...layout, sections: { ...layout.sections, [key]: !layout.sections[key] } };
    setLayout(next);
    onUpdateLayout(next);
  };
  const setPageSize = (pageSize: "letter" | "a4") => {
    const next = { ...layout, pageSize };
    setLayout(next);
    onUpdateLayout(next);
  };

  const allFields = Object.values(def.fields);
  const answered = allFields.filter((f) => f.type !== "instruction");
  const flaggedFields = answered.filter((f) => isFlagged(f, sampleAnswer(f)));

  const pageStyle = layout.pageSize === "letter"
    ? { width: "8.5in", minHeight: "11in" }
    : { width: "210mm", minHeight: "297mm" };

  return (
    <div className="fixed inset-0 bg-[#0F1C2E]/90 z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-[#0F1C2E] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-[#1E90FF]" />
          <span className="text-white font-display font-bold text-sm">Completed Report Preview</span>
          <span className="text-white/40 text-sm font-body">—</span>
          <span className="text-white/70 text-sm font-body">{form.title}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="text-white border-white/30 hover:bg-white/10 font-display font-bold text-xs">
          <X size={14} className="mr-1" />Close
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Report page preview */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-200">
          <div
            className="bg-white shadow-2xl text-[#0F1C2E]"
            style={{ ...pageStyle, transform: "scale(0.75)", transformOrigin: "top center", padding: "0.75in" }}
          >
            {layout.sections.cover && (
              <div className="text-center py-16 border-b-2 border-gray-200 mb-8">
                <div className="w-14 h-14 rounded-xl bg-[#0047AB] flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <h1 className="font-display font-extrabold text-2xl uppercase">{form.title}</h1>
                <p className="text-gray-400 text-sm mt-1">Completed Report</p>
                <p className="text-gray-400 text-xs mt-6">{companyStore.name}</p>
              </div>
            )}

            {layout.sections.toc && (
              <div className="mb-8">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Table of Contents</h2>
                {def.pages.map((p, i) => (
                  <div key={p.id} className="flex justify-between text-sm text-gray-600 py-0.5">
                    <span>{i + 1}. {p.title}</span><span>{i + 2}</span>
                  </div>
                ))}
              </div>
            )}

            {layout.sections.preparedBy && (
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div><div className="text-[10px] text-gray-400 uppercase font-bold">Prepared By</div><div>{MOCK_EMPLOYEES[0]?.name ?? "Sarah Chen"}</div></div>
                <div><div className="text-[10px] text-gray-400 uppercase font-bold">Date</div><div>{new Date().toLocaleDateString()}</div></div>
                <div><div className="text-[10px] text-gray-400 uppercase font-bold">Company</div><div>{companyStore.name}</div></div>
              </div>
            )}

            {layout.sections.summary && (
              <div className="mb-6 bg-[#F4F6F9] rounded-lg p-4 flex gap-6 text-sm">
                <div><span className="font-bold">{answered.length}</span> questions</div>
                <div><span className="font-bold">{def.pages.length}</span> pages</div>
                <div className={flaggedFields.length > 0 ? "text-red-600 font-semibold" : ""}>{flaggedFields.length} flagged</div>
              </div>
            )}

            {layout.sections.scores && (
              <div className="mb-6">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Compliance Score</h2>
                <p className="text-3xl font-display font-extrabold text-[#0047AB]">{Math.max(0, 100 - flaggedFields.length * 15)}%</p>
              </div>
            )}

            {def.pages.map((page) => (
              <div key={page.id} className="mb-6" style={{ breakInside: "avoid" }}>
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">{page.title}</h2>
                {page.items.map((item) => {
                  if (item.kind === "instruction") return null;
                  if (item.kind === "table" && layout.sections.tables) {
                    return (
                      <table key={item.table.id} className="w-full text-xs my-2 border-collapse">
                        <thead><tr>{item.table.columns.map((c) => <th key={c} className="border border-gray-200 bg-gray-50 text-left p-1.5">{c}</th>)}</tr></thead>
                        <tbody>
                          {[0, 1].map((r) => (
                            <tr key={r}>{item.table.columns.map((c) => <td key={c} className="border border-gray-200 p-1.5 text-gray-400 italic">Sample data</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  }
                  if (item.kind === "section") {
                    return (
                      <div key={item.section.id} className="space-y-1.5 my-2">
                        {item.section.fieldIds.map((fid) => {
                          const field = def.fields[fid];
                          if (!field) return null;
                          const answer = sampleAnswer(field);
                          const flagged = isFlagged(field, answer);
                          if (field.type === "photo" && !layout.sections.media) return null;
                          if (field.type === "signature" && !layout.sections.signatures) return null;
                          return (
                            <div key={fid} className={cn("flex items-start justify-between text-sm py-1", flagged && layout.sections.flaggedItems && "bg-red-50 -mx-1 px-1 rounded")}>
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

            {layout.sections.flaggedItems && flaggedFields.length > 0 && (
              <div className="mb-6 border-t-2 border-red-200 pt-4">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-2 text-red-600">Flagged Items & Corrective Actions</h2>
                {flaggedFields.map((f) => (
                  <div key={f.id} className="text-sm text-gray-700 py-1 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-red-500" />{f.label} — {sampleAnswer(f)}
                    <span className="text-gray-400 ml-auto text-xs italic">Corrective action pending</span>
                  </div>
                ))}
              </div>
            )}

            {layout.sections.disclaimer && (
              <p className="text-[10px] text-gray-400 border-t border-gray-200 pt-3 mt-6">
                This report is generated based on responses submitted through the Bastion LMS mobile app and is intended for internal safety recordkeeping purposes only.
              </p>
            )}

            {layout.sections.footer && (
              <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-2 mt-6">
                {companyStore.name} · Generated {new Date().toLocaleDateString()} · Page 1
              </div>
            )}
          </div>
        </div>

        {/* Layout controls */}
        <aside className="w-64 bg-white border-l border-gray-200 p-4 space-y-4 overflow-y-auto shrink-0">
          <div>
            <p className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide mb-2">Page Size</p>
            <div className="flex gap-2">
              {(["letter", "a4"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border-2 text-xs font-display font-bold uppercase transition-colors",
                    layout.pageSize === size ? "border-[#0047AB] bg-[#0047AB]/5 text-[#0047AB]" : "border-gray-200 text-gray-500"
                  )}
                >
                  {size === "letter" ? "US Letter" : "A4"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-display font-bold text-gray-600 uppercase tracking-wide mb-2">Report Sections</p>
            <div className="space-y-2">
              {(Object.keys(REPORT_SECTION_LABELS) as ReportSectionKey[]).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{REPORT_SECTION_LABELS[key]}</span>
                  <Switch checked={layout.sections[key]} onCheckedChange={() => toggleSection(key)} />
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 flex items-start gap-1"><Check size={11} className="shrink-0 mt-0.5" />Changes apply to future exports of this form.</p>
        </aside>
      </div>
    </div>
  );
}
