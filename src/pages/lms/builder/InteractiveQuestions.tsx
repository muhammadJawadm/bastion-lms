/**
 * @file builder/InteractiveQuestions.tsx
 * @description Interactive question components for the Bastion LMS.
 *
 * Provides both **editor** and **viewer** variants for three question types:
 *
 * 1. **Multiple Choice** — question stem + 2–6 options, one correct answer,
 *    optional per-option feedback text.
 *
 * 2. **Fill-in-the-Blank (FITB)** — a sentence with `{{blank}}` placeholders
 *    that learners complete by typing. Graded case-insensitively.
 *
 * 3. **Drag-and-Drop Word Bank** — a sentence with `{{blank}}` placeholders
 *    and a bank of word chips. Learners drag chips into the blanks.
 *    On mobile, tapping a chip then tapping a blank fills it.
 *
 * Each question type exports:
 *  - `<TypeEditor>` — used inside the Course Builder (admin)
 *  - `<TypeViewer>` — used inside the Course Player (learner)
 *
 * @module InteractiveQuestions
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { Plus, Trash2, GripVertical, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  MultipleChoiceData,
  MultipleChoiceOption,
  FillInTheBlankData,
  DragDropData,
} from "./types";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MULTIPLE CHOICE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Editor ───────────────────────────────────────────────────────────────────

/**
 * Props for the MultipleChoiceEditor component.
 */
export interface MultipleChoiceEditorProps {
  /** The current question data. */
  data: MultipleChoiceData;
  /** Callback fired when the question data changes. */
  onChange: (updated: MultipleChoiceData) => void;
}

/**
 * MultipleChoiceEditor — admin editor for a multiple-choice question.
 *
 * Allows the instructor to:
 *  - Set the question stem
 *  - Add/remove/reorder answer options
 *  - Mark one option as the correct answer
 *  - Add optional feedback text per option
 *  - Set a general explanation shown after answering
 */
export function MultipleChoiceEditor({ data, onChange }: MultipleChoiceEditorProps) {
  /** Add a new blank option to the list. */
  const addOption = useCallback(() => {
    if (data.options.length >= 6) return;
    const newOption: MultipleChoiceOption = {
      id: uuidv4(),
      text: "",
      feedback: "",
    };
    onChange({ ...data, options: [...data.options, newOption] });
  }, [data, onChange]);

  /** Remove an option by its ID. */
  const removeOption = useCallback(
    (id: string) => {
      if (data.options.length <= 2) return; // Minimum 2 options
      const newOptions: MultipleChoiceOption[] = data.options.filter((o) => o.id !== id);
      // If the removed option was the correct answer, clear the correct answer
      const newCorrect: string = data.correctOptionId === id ? "" : data.correctOptionId;
      onChange({ ...data, options: newOptions, correctOptionId: newCorrect });
    },
    [data, onChange]
  );

  /** Update a field on a specific option. */
  const updateOption = useCallback(
    (id: string, field: keyof MultipleChoiceOption, value: string) => {
      const newOptions: MultipleChoiceOption[] = data.options.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      );
      onChange({ ...data, options: newOptions });
    },
    [data, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Question stem */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">Question</Label>
        <textarea
          value={data.question}
          onChange={(e) => onChange({ ...data, question: e.target.value })}
          placeholder="Type your question here…"
          rows={3}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#0047AB] focus:border-[#0047AB]"
        />
      </div>

      {/* Options */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Answer Options <span className="text-gray-400 font-normal">(select the correct one)</span>
        </Label>
        <div className="space-y-2">
          {data.options.map((option, index) => (
            <div
              key={option.id}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg border transition-colors",
                data.correctOptionId === option.id
                  ? "border-green-500 bg-green-500/10"
                  : "border-gray-200 bg-gray-50"
              )}
            >
              {/* Drag handle (visual only) */}
              <GripVertical size={16} className="text-gray-400 mt-2 shrink-0" />

              {/* Option letter badge */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 cursor-pointer transition-colors",
                  data.correctOptionId === option.id
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                )}
                onClick={() => onChange({ ...data, correctOptionId: option.id })}
                title="Click to mark as correct answer"
              >
                {String.fromCharCode(65 + index)}
              </div>

              {/* Option text and feedback */}
              <div className="flex-1 space-y-1">
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(option.id, "text", e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}…`}
                  className="h-8 text-sm bg-transparent border-0 border-b border-gray-300 rounded-none text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 px-0"
                />
                <Input
                  value={option.feedback ?? ""}
                  onChange={(e) => updateOption(option.id, "feedback", e.target.value)}
                  placeholder="Feedback when selected (optional)…"
                  className="h-7 text-xs bg-transparent border-0 border-b border-gray-200 rounded-none text-gray-500 placeholder:text-gray-400 focus-visible:ring-0 px-0"
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeOption(option.id)}
                disabled={data.options.length <= 2}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 mt-1 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add option button */}
        {data.options.length < 6 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="mt-2 w-full border-dashed border-gray-300 text-gray-500 hover:text-[#0047AB] hover:border-[#0047AB]"
          >
            <Plus size={14} className="mr-1" />
            Add Option
          </Button>
        )}
      </div>

      {/* General explanation */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">
          Explanation <span className="text-gray-400 font-normal">(shown after answering)</span>
        </Label>
        <textarea
          value={data.explanation ?? ""}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          placeholder="Explain why the correct answer is correct…"
          rows={2}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#0047AB] focus:border-[#0047AB]"
        />
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

/**
 * Props for the MultipleChoiceViewer component.
 */
export interface MultipleChoiceViewerProps {
  /** The question data to render. */
  data: MultipleChoiceData;
  /**
   * Callback fired when the learner submits an answer.
   * @param isCorrect - Whether the selected answer was correct.
   */
  onAnswer?: (isCorrect: boolean) => void;
  /** Whether the question has already been answered (disables interaction). */
  answered?: boolean;
}

/**
 * MultipleChoiceViewer — learner-facing multiple-choice question.
 *
 * Shows the question stem and answer options as clickable cards.
 * After the learner selects an option, the correct/incorrect state is revealed
 * along with any per-option feedback and the general explanation.
 */
export function MultipleChoiceViewer({ data, onAnswer, answered: externalAnswered }: MultipleChoiceViewerProps) {
  /** The ID of the option the learner has selected. */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** Whether the learner has submitted their answer. */
  const [submitted, setSubmitted] = useState<boolean>(false);

  /** Whether the answer has been answered (either locally or externally). */
  const isAnswered: boolean = submitted || (externalAnswered ?? false);

  /** Whether the selected answer is correct. */
  const isCorrect: boolean = selectedId === data.correctOptionId;

  /** Handle option selection. */
  const handleSelect = useCallback(
    (id: string) => {
      if (isAnswered) return;
      setSelectedId(id);
    },
    [isAnswered]
  );

  /** Handle answer submission. */
  const handleSubmit = useCallback(() => {
    if (!selectedId || isAnswered) return;
    setSubmitted(true);
    onAnswer?.(selectedId === data.correctOptionId);
  }, [selectedId, isAnswered, data.correctOptionId, onAnswer]);

  return (
    <div className="space-y-4 p-4">
      {/* Question stem */}
      <p className="text-white font-semibold text-base leading-relaxed">{data.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {data.options.map((option, index) => {
          /** Whether this option is the correct answer. */
          const isOptionCorrect: boolean = option.id === data.correctOptionId;
          /** Whether this option is the one the learner selected. */
          const isOptionSelected: boolean = option.id === selectedId;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isAnswered}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3",
                !isAnswered && !isOptionSelected && "border-gray-600 bg-[#1a1f35] hover:border-blue-500 hover:bg-blue-500/10",
                !isAnswered && isOptionSelected && "border-blue-500 bg-blue-500/20",
                isAnswered && isOptionCorrect && "border-green-500 bg-green-500/20",
                isAnswered && isOptionSelected && !isOptionCorrect && "border-red-500 bg-red-500/20",
                isAnswered && !isOptionSelected && !isOptionCorrect && "border-gray-700 bg-[#1a1f35] opacity-60"
              )}
            >
              {/* Option letter */}
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  !isAnswered && isOptionSelected ? "bg-blue-500 text-white" : "",
                  !isAnswered && !isOptionSelected ? "bg-gray-600 text-gray-300" : "",
                  isAnswered && isOptionCorrect ? "bg-green-500 text-white" : "",
                  isAnswered && isOptionSelected && !isOptionCorrect ? "bg-red-500 text-white" : "",
                  isAnswered && !isOptionSelected && !isOptionCorrect ? "bg-gray-700 text-gray-500" : ""
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>

              {/* Option text and feedback */}
              <div className="flex-1">
                <span className={cn(
                  "text-sm",
                  isAnswered && isOptionCorrect ? "text-green-300 font-semibold" : "text-gray-200"
                )}>
                  {option.text}
                </span>
                {isAnswered && isOptionSelected && option.feedback && (
                  <p className="text-xs mt-1 text-gray-400 italic">{option.feedback}</p>
                )}
              </div>

              {/* Correct/incorrect icon */}
              {isAnswered && (
                <div className="shrink-0 mt-0.5">
                  {isOptionCorrect ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : isOptionSelected ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!isAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedId}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit Answer
        </Button>
      )}

      {/* Result banner */}
      {isAnswered && (
        <div
          className={cn(
            "p-3 rounded-lg flex items-start gap-2",
            isCorrect ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"
          )}
        >
          {isCorrect ? (
            <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={cn("text-sm font-semibold", isCorrect ? "text-green-300" : "text-red-300")}>
              {isCorrect ? "Correct!" : "Not quite."}
            </p>
            {data.explanation && (
              <p className="text-xs text-gray-300 mt-1">{data.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FILL-IN-THE-BLANK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parses a FITB template string into an array of segments.
 * Each segment is either a literal string or a blank placeholder.
 *
 * @example
 * parseFITBTemplate("The {{blank}} is on fire.")
 * // → [{ type: "text", value: "The " }, { type: "blank", index: 0 }, { type: "text", value: " is on fire." }]
 */
function parseFITBTemplate(template: string): Array<
  | { type: "text"; value: string }
  | { type: "blank"; index: number }
> {
  const parts: Array<{ type: "text"; value: string } | { type: "blank"; index: number }> = [];
  const regex = /\{\{blank\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blankIndex = 0;

  while ((match = regex.exec(template)) !== null) {
    // Text before the blank
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: template.slice(lastIndex, match.index) });
    }
    // The blank itself
    parts.push({ type: "blank", index: blankIndex++ });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last blank
  if (lastIndex < template.length) {
    parts.push({ type: "text", value: template.slice(lastIndex) });
  }

  return parts;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

/**
 * Props for the FillInTheBlankEditor component.
 */
export interface FillInTheBlankEditorProps {
  data: FillInTheBlankData;
  onChange: (updated: FillInTheBlankData) => void;
}

/**
 * FillInTheBlankEditor — admin editor for a fill-in-the-blank question.
 *
 * The instructor writes a sentence using `{{blank}}` as a placeholder for each blank.
 * For each blank, they provide the accepted correct answer(s).
 */
export function FillInTheBlankEditor({ data, onChange }: FillInTheBlankEditorProps) {
  /** Number of blanks detected in the current template. */
  const blankCount: number = useMemo(
    () => (data.template.match(/\{\{blank\}\}/g) ?? []).length,
    [data.template]
  );

  /** Update the correct answer for a specific blank. */
  const updateAnswer = useCallback(
    (index: number, value: string) => {
      const newAnswers: string[] = [...data.correctAnswers];
      newAnswers[index] = value;
      onChange({ ...data, correctAnswers: newAnswers });
    },
    [data, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Template */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">
          Sentence Template
        </Label>
        <p className="text-xs text-gray-400 mb-2">
          Use <code className="bg-gray-700 px-1 rounded text-blue-300">{"{{blank}}"}</code> where you want a blank to appear.
        </p>
        <textarea
          value={data.template}
          onChange={(e) => onChange({ ...data, template: e.target.value })}
          placeholder={`e.g. Always wear your PPE before entering a {{blank}} area.`}
          rows={3}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#0047AB] focus:border-[#0047AB] font-mono"
        />
      </div>

      {/* Correct answers */}
      {blankCount > 0 && (
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
            Correct Answers
          </Label>
          <div className="space-y-2">
            {Array.from({ length: blankCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16 shrink-0">Blank {i + 1}</span>
                <Input
                  value={data.correctAnswers[i] ?? ""}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                  placeholder="Correct answer…"
                  className="h-8 text-sm bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Answers are checked case-insensitively. Separate multiple accepted answers with a pipe: <code className="bg-gray-700 px-1 rounded text-blue-300">answer1|answer2</code>
          </p>
        </div>
      )}

      {/* Explanation */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">
          Explanation <span className="text-gray-400 font-normal">(shown after answering)</span>
        </Label>
        <textarea
          value={data.explanation ?? ""}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          placeholder="Explain the correct answers…"
          rows={2}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#0047AB] focus:border-[#0047AB]"
        />
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

/**
 * Props for the FillInTheBlankViewer component.
 */
export interface FillInTheBlankViewerProps {
  data: FillInTheBlankData;
  onAnswer?: (isCorrect: boolean) => void;
  answered?: boolean;
}

/**
 * FillInTheBlankViewer — learner-facing fill-in-the-blank question.
 *
 * Renders the sentence template with inline input fields for each blank.
 * After submission, each blank is highlighted green (correct) or red (incorrect).
 */
export function FillInTheBlankViewer({ data, onAnswer, answered: externalAnswered }: FillInTheBlankViewerProps) {
  /** Parsed template segments. */
  const segments = useMemo(() => parseFITBTemplate(data.template), [data.template]);

  /** Number of blanks. */
  const blankCount: number = useMemo(
    () => segments.filter((s) => s.type === "blank").length,
    [segments]
  );

  /** Learner's typed answers, one per blank. */
  const [answers, setAnswers] = useState<string[]>(() => Array(blankCount).fill(""));

  /** Whether the learner has submitted. */
  const [submitted, setSubmitted] = useState<boolean>(false);

  const isAnswered: boolean = submitted || (externalAnswered ?? false);

  /**
   * Check whether a learner's answer for a blank is correct.
   * Accepts multiple pipe-separated correct answers.
   */
  const isBlankCorrect = useCallback(
    (blankIndex: number, learnerAnswer: string): boolean => {
      const correct: string = data.correctAnswers[blankIndex] ?? "";
      const accepted: string[] = correct.split("|").map((s) => s.trim().toLowerCase());
      return accepted.includes(learnerAnswer.trim().toLowerCase());
    },
    [data.correctAnswers]
  );

  /** Handle submission. */
  const handleSubmit = useCallback(() => {
    if (isAnswered) return;
    setSubmitted(true);
    const allCorrect: boolean = answers.every((ans, i) => isBlankCorrect(i, ans));
    onAnswer?.(allCorrect);
  }, [answers, isAnswered, isBlankCorrect, onAnswer]);

  return (
    <div className="space-y-4 p-4">
      {/* Rendered sentence with inline inputs */}
      <div className="text-white text-base leading-loose flex flex-wrap items-center gap-1">
        {segments.map((segment, i) => {
          if (segment.type === "text") {
            return <span key={i}>{segment.value}</span>;
          }

          const blankIdx: number = segment.index;
          const learnerAnswer: string = answers[blankIdx] ?? "";
          const correct: boolean = isBlankCorrect(blankIdx, learnerAnswer);

          return (
            <input
              key={i}
              type="text"
              value={learnerAnswer}
              onChange={(e) => {
                if (isAnswered) return;
                const newAnswers = [...answers];
                newAnswers[blankIdx] = e.target.value;
                setAnswers(newAnswers);
              }}
              disabled={isAnswered}
              placeholder="___"
              className={cn(
                "inline-block w-28 text-center border-b-2 bg-transparent text-white placeholder:text-gray-500 focus:outline-none transition-colors px-1",
                !isAnswered && "border-blue-400 focus:border-blue-300",
                isAnswered && correct && "border-green-400 text-green-300",
                isAnswered && !correct && "border-red-400 text-red-300"
              )}
            />
          );
        })}
      </div>

      {/* Submit button */}
      {!isAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={answers.some((a) => !a.trim())}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Check Answers
        </Button>
      )}

      {/* Result */}
      {isAnswered && (
        <div className="space-y-2">
          {/* Show correct answers for any wrong blanks */}
          {answers.map((ans, i) => {
            const correct: boolean = isBlankCorrect(i, ans);
            if (correct) return null;
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <XCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-gray-300">
                  Blank {i + 1}: correct answer is{" "}
                  <strong className="text-green-300">
                    {data.correctAnswers[i]?.split("|")[0]}
                  </strong>
                </span>
              </div>
            );
          })}

          {/* Explanation */}
          {data.explanation && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
              <HelpCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">{data.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DRAG-AND-DROP WORD BANK
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Editor ───────────────────────────────────────────────────────────────────

/**
 * Props for the DragDropEditor component.
 */
export interface DragDropEditorProps {
  data: DragDropData;
  onChange: (updated: DragDropData) => void;
}

/**
 * DragDropEditor — admin editor for a drag-and-drop word bank question.
 *
 * The instructor writes a sentence with `{{blank}}` placeholders and provides
 * a word bank. The word bank can include distractors (wrong words) in addition
 * to the correct answers.
 */
export function DragDropEditor({ data, onChange }: DragDropEditorProps) {
  /** Number of blanks in the template. */
  const blankCount: number = useMemo(
    () => (data.template.match(/\{\{blank\}\}/g) ?? []).length,
    [data.template]
  );

  /** Update the correct answer for a specific blank. */
  const updateAnswer = useCallback(
    (index: number, value: string) => {
      const newAnswers: string[] = [...data.correctAnswers];
      newAnswers[index] = value;
      onChange({ ...data, correctAnswers: newAnswers });
    },
    [data, onChange]
  );

  /** Add a new word to the word bank. */
  const addWord = useCallback(() => {
    onChange({ ...data, wordBank: [...data.wordBank, ""] });
  }, [data, onChange]);

  /** Update a word in the word bank. */
  const updateWord = useCallback(
    (index: number, value: string) => {
      const newBank: string[] = [...data.wordBank];
      newBank[index] = value;
      onChange({ ...data, wordBank: newBank });
    },
    [data, onChange]
  );

  /** Remove a word from the word bank. */
  const removeWord = useCallback(
    (index: number) => {
      const newBank: string[] = data.wordBank.filter((_, i) => i !== index);
      onChange({ ...data, wordBank: newBank });
    },
    [data, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Template */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">
          Sentence Template
        </Label>
        <p className="text-xs text-gray-400 mb-2">
          Use <code className="bg-gray-700 px-1 rounded text-blue-300">{"{{blank}}"}</code> for each drop zone.
        </p>
        <textarea
          value={data.template}
          onChange={(e) => onChange({ ...data, template: e.target.value })}
          placeholder={`e.g. A {{blank}} must be worn when working at heights above {{blank}} feet.`}
          rows={3}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#0047AB] focus:border-[#0047AB] font-mono"
        />
      </div>

      {/* Correct answers */}
      {blankCount > 0 && (
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
            Correct Answers (in order)
          </Label>
          <div className="space-y-2">
            {Array.from({ length: blankCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16 shrink-0">Blank {i + 1}</span>
                <Input
                  value={data.correctAnswers[i] ?? ""}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                  placeholder="Correct word/phrase…"
                  className="h-8 text-sm bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Word bank */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Word Bank <span className="text-gray-400 font-normal">(include correct answers + distractors)</span>
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.wordBank.map((word, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
              <input
                value={word}
                onChange={(e) => updateWord(i, e.target.value)}
                placeholder="Word…"
                className="bg-transparent text-sm text-gray-800 w-20 focus:outline-none"
              />
              <button onClick={() => removeWord(i)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addWord}
          className="border-dashed border-gray-300 text-gray-500 hover:text-[#0047AB] hover:border-[#0047AB]"
        >
          <Plus size={14} className="mr-1" />
          Add Word
        </Button>
      </div>

      {/* Explanation */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-1 block">
          Explanation <span className="text-gray-400 font-normal">(shown after answering)</span>
        </Label>
        <textarea
          value={data.explanation ?? ""}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          placeholder="Explain the correct answers…"
          rows={2}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#0047AB] focus:border-[#0047AB]"
        />
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

/**
 * Props for the DragDropViewer component.
 */
export interface DragDropViewerProps {
  data: DragDropData;
  onAnswer?: (isCorrect: boolean) => void;
  answered?: boolean;
}

/**
 * DragDropViewer — learner-facing drag-and-drop word bank question.
 *
 * Desktop: Learners drag word chips from the bank into the blank drop zones.
 * Mobile:  Learners tap a chip to select it, then tap a blank to place it.
 *
 * After submission, blanks are highlighted green or red.
 */
export function DragDropViewer({ data, onAnswer, answered: externalAnswered }: DragDropViewerProps) {
  /** Parsed template segments. */
  const segments = useMemo(() => parseFITBTemplate(data.template), [data.template]);

  /** Number of blanks. */
  const blankCount: number = useMemo(
    () => segments.filter((s) => s.type === "blank").length,
    [segments]
  );

  /** Shuffled word bank (shuffled once on mount). */
  const shuffledBank = useMemo(
    () => [...data.wordBank].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.wordBank.join(",")]
  );

  /** Current word placed in each blank (null = empty). */
  const [placed, setPlaced] = useState<(string | null)[]>(() => Array(blankCount).fill(null));

  /** Words currently in the bank (removed when placed). */
  const [bankWords, setBankWords] = useState<string[]>(shuffledBank);

  /** The word chip currently being dragged (desktop). */
  const draggingWord = useRef<string | null>(null);

  /** The word chip currently selected by tap (mobile). */
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  /** Whether the learner has submitted. */
  const [submitted, setSubmitted] = useState<boolean>(false);

  const isAnswered: boolean = submitted || (externalAnswered ?? false);

  /** Check if a blank's placed word is correct. */
  const isBlankCorrect = useCallback(
    (blankIndex: number): boolean => {
      const word: string | null = placed[blankIndex];
      if (!word) return false;
      return word.trim().toLowerCase() === (data.correctAnswers[blankIndex] ?? "").trim().toLowerCase();
    },
    [placed, data.correctAnswers]
  );

  /** Place a word into a blank, returning the previously placed word (if any) to the bank. */
  const placeWord = useCallback(
    (word: string, blankIndex: number) => {
      setPlaced((prev) => {
        const newPlaced = [...prev];
        const displaced: string | null = newPlaced[blankIndex];
        newPlaced[blankIndex] = word;

        // Return the displaced word to the bank
        if (displaced) {
          setBankWords((bank) => [...bank, displaced]);
        }
        return newPlaced;
      });

      // Remove the placed word from the bank
      setBankWords((bank) => bank.filter((w) => w !== word));
      setSelectedWord(null);
    },
    []
  );

  /** Remove a word from a blank, returning it to the bank. */
  const removeFromBlank = useCallback(
    (blankIndex: number) => {
      if (isAnswered) return;
      const word: string | null = placed[blankIndex];
      if (!word) return;

      setPlaced((prev) => {
        const newPlaced = [...prev];
        newPlaced[blankIndex] = null;
        return newPlaced;
      });
      setBankWords((bank) => [...bank, word]);
    },
    [placed, isAnswered]
  );

  // ── Drag-and-drop handlers (desktop) ──────────────────────────────────────

  const handleDragStart = useCallback((word: string) => {
    draggingWord.current = word;
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, blankIndex: number) => {
      e.preventDefault();
      const word = draggingWord.current;
      if (!word || isAnswered) return;
      placeWord(word, blankIndex);
      draggingWord.current = null;
    },
    [isAnswered, placeWord]
  );

  // ── Tap handlers (mobile) ─────────────────────────────────────────────────

  const handleChipTap = useCallback(
    (word: string) => {
      if (isAnswered) return;
      setSelectedWord((prev) => (prev === word ? null : word));
    },
    [isAnswered]
  );

  const handleBlankTap = useCallback(
    (blankIndex: number) => {
      if (isAnswered) return;
      if (selectedWord) {
        placeWord(selectedWord, blankIndex);
      } else {
        // Tap an occupied blank to return its word to the bank
        removeFromBlank(blankIndex);
      }
    },
    [isAnswered, selectedWord, placeWord, removeFromBlank]
  );

  /** Handle submission. */
  const handleSubmit = useCallback(() => {
    if (isAnswered || placed.some((p) => p === null)) return;
    setSubmitted(true);
    const allCorrect: boolean = placed.every((_, i) => isBlankCorrect(i));
    onAnswer?.(allCorrect);
  }, [isAnswered, placed, isBlankCorrect, onAnswer]);

  return (
    <div className="space-y-4 p-4">
      {/* Sentence with drop zones */}
      <div className="text-black text-base leading-loose flex flex-wrap items-center gap-1">
        {segments.map((segment, i) => {
          if (segment.type === "text") {
            return <span key={i}>{segment.value}</span>;
          }

          const blankIdx: number = segment.index;
          const placedWord: string | null = placed[blankIdx];
          const correct: boolean = isBlankCorrect(blankIdx);

          return (
            <div
              key={i}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, blankIdx)}
              onClick={() => handleBlankTap(blankIdx)}
              className={cn(
                "inline-flex items-center justify-center min-w-[80px] h-9 px-3 rounded-md border-2 border-dashed cursor-pointer transition-all text-sm font-medium",
                !isAnswered && !placedWord && "border-blue-400 bg-blue-400/10 text-gray-400 hover:bg-blue-400/20",
                !isAnswered && placedWord && "border-blue-500 bg-blue-500/20 text-black",
                isAnswered && correct && "border-green-500 bg-green-500/20 text-green-300 border-solid",
                isAnswered && !correct && "border-red-500 bg-red-500/20 text-red-300 border-solid"
              )}
            >
              {placedWord ?? <span className="text-gray-500 text-xs">drop here</span>}
            </div>
          );
        })}
      </div>

      {/* Word bank */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Word Bank</p>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg bg-[#1a1f35] border border-gray-600">
          {bankWords.map((word, i) => (
            <div
              key={`${word}-${i}`}
              draggable={!isAnswered}
              onDragStart={() => handleDragStart(word)}
              onClick={() => handleChipTap(word)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium cursor-grab active:cursor-grabbing transition-all select-none",
                selectedWord === word
                  ? "bg-blue-500 text-white ring-2 ring-blue-300"
                  : "bg-[#2a2f4a] text-gray-200 hover:bg-[#3a3f5c] border border-gray-600"
              )}
            >
              {word}
            </div>
          ))}
          {bankWords.length === 0 && (
            <span className="text-xs text-gray-500 self-center">All words placed</span>
          )}
        </div>
      </div>

      {/* Submit button */}
      {!isAnswered && (
        <Button
          onClick={handleSubmit}
          disabled={placed.some((p) => p === null)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Check Answers
        </Button>
      )}

      {/* Result */}
      {isAnswered && (
        <div className="space-y-2">
          {placed.map((word, i) => {
            const correct: boolean = isBlankCorrect(i);
            if (correct) return null;
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <XCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-gray-300">
                  Blank {i + 1}: correct answer is{" "}
                  <strong className="text-green-300">{data.correctAnswers[i]}</strong>
                </span>
              </div>
            );
          })}
          {data.explanation && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
              <HelpCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300">{data.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
