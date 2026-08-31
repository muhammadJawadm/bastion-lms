/**
 * @file formBuilder/types.ts
 * @description Shared type definitions for the Bastion LMS Form Builder.
 * Mirrors the role `builder/types.ts` plays for the Course Builder — the
 * Form Builder is a from-scratch build (per the Course + Form Builder
 * requirements report, §11-15); there was no field/page/logic model here
 * before this pass.
 */

// ─── Fields ────────────────────────────────────────────────────────────────

/** All supported form field response types (report §12's core list). */
export type FormFieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "date"
  | "datetime"
  | "dropdown"
  | "multiple_choice"
  | "yes_no"
  | "yes_no_na"
  | "checkbox"
  | "photo"
  | "signature"
  | "rating"
  | "person"
  | "location"
  | "instruction";

/** A single form field (question). */
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  helpText?: string;
  required: boolean;
  /** Inline choice list — used when `answerSetId` isn't set (dropdown/multiple_choice/checkbox). */
  options?: string[];
  /** Points at a reusable, org-wide answer set instead of inline `options`. */
  answerSetId?: string;
  /** Rating field bounds. */
  min?: number;
  max?: number;
  /** Which selected option(s) mark this response deficient / non-compliant (report §13). */
  flagValues?: string[];
}

// ─── Page structure ──────────────────────────────────────────────────────────

export interface FormSection {
  id: string;
  title?: string;
  fieldIds: string[];
}

export interface FormTable {
  id: string;
  title: string;
  columns: string[];
}

export interface FormInstruction {
  id: string;
  body: string;
}

export type FormPageItem =
  | { kind: "section"; section: FormSection }
  | { kind: "table"; table: FormTable }
  | { kind: "instruction"; instruction: FormInstruction };

export interface FormPage {
  id: string;
  title: string;
  items: FormPageItem[];
}

// ─── Conditional logic ────────────────────────────────────────────────────────

/** A plain-language If/Then rule — no expression language, per the report. */
export interface LogicRule {
  id: string;
  sourceFieldId: string;
  condition: { equals?: string; isChecked?: boolean };
  actions: LogicAction[];
}

export type LogicAction =
  | { type: "show"; targetId: string }
  | { type: "hide"; targetId: string }
  | { type: "skip_to"; targetPageId: string }
  | { type: "require_followup"; fieldId: string }
  | { type: "flag" }
  | { type: "notify"; role: string };

// ─── Reusable answer sets (report §12) ────────────────────────────────────────

export interface AnswerSet {
  id: string;
  label: string;
  options: string[];
  isCustom?: boolean;
}

// ─── Completed report layout (report §15) ────────────────────────────────────

export type ReportSectionKey =
  | "cover"
  | "toc"
  | "footer"
  | "disclaimer"
  | "preparedBy"
  | "summary"
  | "scores"
  | "flaggedItems"
  | "media"
  | "signatures"
  | "tables";

export interface ReportLayoutConfig {
  pageSize: "letter" | "a4";
  sections: Record<ReportSectionKey, boolean>;
}

export const DEFAULT_REPORT_LAYOUT: ReportLayoutConfig = {
  pageSize: "letter",
  sections: {
    cover: true,
    toc: false,
    footer: true,
    disclaimer: false,
    preparedBy: true,
    summary: true,
    scores: true,
    flaggedItems: true,
    media: true,
    signatures: true,
    tables: true,
  },
};

export const REPORT_SECTION_LABELS: Record<ReportSectionKey, string> = {
  cover: "Cover Page",
  toc: "Table of Contents",
  footer: "Footer",
  disclaimer: "Disclaimer",
  preparedBy: "Prepared By / Date / Site",
  summary: "Summary",
  scores: "Scores",
  flaggedItems: "Flagged Items & Corrective Actions",
  media: "Media / Photo Summary",
  signatures: "Signatures",
  tables: "Tables",
};

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  number: "Number",
  date: "Date",
  datetime: "Date & Time",
  dropdown: "Dropdown",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
  yes_no_na: "Yes / No / N/A",
  checkbox: "Checkbox (Select All)",
  photo: "Photo Upload",
  signature: "Signature",
  rating: "Slider / Rating",
  person: "Person / Employee",
  location: "Location",
  instruction: "Instruction (display only)",
};

/** Field types that use a choice list (inline `options` or a reusable answer set). */
export const CHOICE_FIELD_TYPES: FormFieldType[] = ["dropdown", "multiple_choice", "checkbox"];

// ─── Form definition (the whole builder document) ─────────────────────────────

export interface MockFormDefinition {
  formId: number;
  pages: FormPage[];
  fields: Record<string, FormField>;
  logic: LogicRule[];
  reportLayout: ReportLayoutConfig;
}
