/* ============================================================
   SLIDE SETTINGS PANEL — Right panel for per-slide settings
   SC Training-style: Title, Subtitle, Button Text, Narration
   ============================================================ */

import { useRef } from "react";
import { Upload, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DraftBlock, BlockData, BlockType } from "./types";

interface SlideSettingsPanelProps {
  block: DraftBlock;
  onUpdate: (data: BlockData) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#6b7db3] text-[10px] font-bold uppercase tracking-widest mb-1">{children}</p>
  );
}

function SettingsInput({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls = "w-full bg-[#252a45] border border-[#3a3f5c] rounded-lg px-3 py-2 text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]/20 transition-colors resize-none";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cls}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cls}
    />
  );
}

function NarrationSection({
  narrationUrl,
  onNarrationChange,
}: {
  narrationUrl?: string;
  onNarrationChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 pt-4 border-t border-[#2a2f4a]">
      <p className="text-white text-sm font-semibold mb-1">Narration</p>
      <p className="text-[#6b7db3] text-xs mb-3 leading-relaxed">
        Play an audio file automatically when users view the slide. Note that automatic play is disabled when editing the course.
      </p>
      {narrationUrl ? (
        <div className="flex items-center gap-2 bg-[#252a45] border border-[#3a3f5c] rounded-lg px-3 py-2">
          <Mic size={14} className="text-[#5b5fc7] flex-shrink-0" />
          <span className="text-white text-xs flex-1 truncate">Audio uploaded</span>
          <button onClick={() => onNarrationChange(undefined)} className="text-[#4a5070] hover:text-white transition-colors">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#252a45] border border-[#3a3f5c] hover:border-[#5b5fc7] rounded-lg px-3 py-2 text-[#8892b0] hover:text-white text-xs transition-colors"
            onClick={() => {}}
          >
            <Mic size={12} />
            <span>Narrate with AI</span>
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#252a45] border border-[#3a3f5c] hover:border-[#5b5fc7] rounded-lg px-3 py-2 text-[#8892b0] hover:text-white text-xs transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={12} />
            <span>Upload file</span>
          </button>
          <input ref={inputRef} type="file" accept="audio/*" className="hidden" />
        </div>
      )}
    </div>
  );
}

export function SlideSettingsPanel({ block, onUpdate }: SlideSettingsPanelProps) {
  const data = block.data as Record<string, unknown>;

  const update = (patch: Record<string, unknown>) => {
    onUpdate({ ...data, ...patch } as BlockData);
  };

  const narration = data.narrationUrl as string | undefined;

  switch (block.type) {
    case "slide_title":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>TITLE</FieldLabel>
            <SettingsInput
              value={(data.title as string) ?? ""}
              onChange={(v) => update({ title: v })}
              placeholder="A title slide"
            />
          </div>
          <div>
            <FieldLabel>SUBTITLE</FieldLabel>
            <SettingsInput
              value={(data.subtitle as string) ?? ""}
              onChange={(v) => update({ subtitle: v })}
              placeholder="An optional subtitle"
            />
          </div>
          <div>
            <FieldLabel>BUTTON TEXT</FieldLabel>
            <SettingsInput
              value={(data.buttonText as string) ?? ""}
              onChange={(v) => update({ buttonText: v })}
              placeholder="Ok, let's go!"
            />
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_bulleted_list":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>TITLE</FieldLabel>
            <SettingsInput
              value={(data.title as string) ?? ""}
              onChange={(v) => update({ title: v })}
              placeholder="List title"
            />
          </div>
          <div>
            <FieldLabel>ITEMS</FieldLabel>
            <div className="space-y-2">
              {((data.items as string[]) ?? [""]).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5b5fc7] flex-shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const items = [...((data.items as string[]) ?? [])];
                      items[i] = e.target.value;
                      update({ items });
                    }}
                    placeholder={`Item ${i + 1}`}
                    className="flex-1 bg-[#252a45] border border-[#3a3f5c] rounded-lg px-3 py-1.5 text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#5b5fc7] transition-colors"
                  />
                  <button
                    onClick={() => {
                      const items = ((data.items as string[]) ?? []).filter((_, j) => j !== i);
                      update({ items });
                    }}
                    className="text-[#4a5070] hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => update({ items: [...((data.items as string[]) ?? []), ""] })}
                className="w-full text-[#5b5fc7] hover:text-[#7b7fd7] text-xs py-1.5 border border-dashed border-[#3a3f5c] hover:border-[#5b5fc7] rounded-lg transition-colors"
              >
                + Add item
              </button>
            </div>
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_image":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>IMAGE URL</FieldLabel>
            <SettingsInput
              value={(data.url as string) ?? ""}
              onChange={(v) => update({ url: v })}
              placeholder="https://..."
            />
          </div>
          <div>
            <FieldLabel>CAPTION</FieldLabel>
            <SettingsInput
              value={(data.caption as string) ?? ""}
              onChange={(v) => update({ caption: v })}
              placeholder="Optional caption"
            />
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_video":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>VIDEO URL</FieldLabel>
            <SettingsInput
              value={(data.url as string) ?? ""}
              onChange={(v) => update({ url: v })}
              placeholder="YouTube, Vimeo, or direct URL"
            />
          </div>
          <div>
            <FieldLabel>CAPTION</FieldLabel>
            <SettingsInput
              value={(data.caption as string) ?? ""}
              onChange={(v) => update({ caption: v })}
              placeholder="Optional caption"
            />
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_file":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>FILE URL</FieldLabel>
            <SettingsInput
              value={(data.url as string) ?? ""}
              onChange={(v) => update({ url: v })}
              placeholder="https://..."
            />
          </div>
          <div>
            <FieldLabel>TITLE</FieldLabel>
            <SettingsInput
              value={(data.title as string) ?? ""}
              onChange={(v) => update({ title: v })}
              placeholder="Document title"
            />
          </div>
          <div>
            <FieldLabel>DESCRIPTION</FieldLabel>
            <SettingsInput
              value={(data.description as string) ?? ""}
              onChange={(v) => update({ description: v })}
              placeholder="Brief description"
              multiline
            />
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_table":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>TITLE</FieldLabel>
            <SettingsInput
              value={(data.title as string) ?? ""}
              onChange={(v) => update({ title: v })}
              placeholder="Table title"
            />
          </div>
          <p className="text-[#6b7db3] text-xs">Edit table content in the slide preview.</p>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_quote":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>QUOTE</FieldLabel>
            <SettingsInput
              value={(data.quote as string) ?? ""}
              onChange={(v) => update({ quote: v })}
              placeholder="Enter the quotation..."
              multiline
            />
          </div>
          <div>
            <FieldLabel>ATTRIBUTION</FieldLabel>
            <SettingsInput
              value={(data.attribution as string) ?? ""}
              onChange={(v) => update({ attribution: v })}
              placeholder="— Author, Title"
            />
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "slide_comparison":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">STANDARD</div>
          <div>
            <FieldLabel>TITLE</FieldLabel>
            <SettingsInput value={(data.title as string) ?? ""} onChange={(v) => update({ title: v })} placeholder="Comparison title" />
          </div>
          <div>
            <FieldLabel>LEFT LABEL</FieldLabel>
            <SettingsInput value={(data.leftLabel as string) ?? ""} onChange={(v) => update({ leftLabel: v })} placeholder="Option A" />
          </div>
          <div>
            <FieldLabel>LEFT CONTENT</FieldLabel>
            <SettingsInput value={(data.leftContent as string) ?? ""} onChange={(v) => update({ leftContent: v })} placeholder="Description..." multiline />
          </div>
          <div>
            <FieldLabel>RIGHT LABEL</FieldLabel>
            <SettingsInput value={(data.rightLabel as string) ?? ""} onChange={(v) => update({ rightLabel: v })} placeholder="Option B" />
          </div>
          <div>
            <FieldLabel>RIGHT CONTENT</FieldLabel>
            <SettingsInput value={(data.rightContent as string) ?? ""} onChange={(v) => update({ rightContent: v })} placeholder="Description..." multiline />
          </div>
          <NarrationSection narrationUrl={narration} onNarrationChange={(url) => update({ narrationUrl: url })} />
        </div>
      );

    case "quiz_multiple_choice":
    case "quiz_question": {
      const q = (data.question as { question?: string; options?: string[]; correctIndices?: number[]; explanation?: string }) ?? {};
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">QUIZ — MULTIPLE CHOICE</div>
          <div>
            <FieldLabel>QUESTION</FieldLabel>
            <SettingsInput
              value={q.question ?? ""}
              onChange={(v) => update({ question: { ...q, question: v } })}
              placeholder="Enter your question..."
              multiline
            />
          </div>
          <div>
            <FieldLabel>OPTIONS</FieldLabel>
            <div className="space-y-2">
              {(q.options ?? ["", "", "", ""]).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const ci = q.correctIndices ?? [];
                      const next = ci.includes(i) ? ci.filter(x => x !== i) : [...ci, i];
                      update({ question: { ...q, correctIndices: next } });
                    }}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors",
                      (q.correctIndices ?? []).includes(i) ? "border-green-400 bg-green-400" : "border-[#4a5070]"
                    )}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const options = [...(q.options ?? [])];
                      options[i] = e.target.value;
                      update({ question: { ...q, options } });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 bg-[#252a45] border border-[#3a3f5c] rounded-lg px-3 py-1.5 text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#5b5fc7] transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-[#4a5070] text-[10px] mt-1">Click the circle to mark correct answer(s)</p>
          </div>
          <div>
            <FieldLabel>EXPLANATION (optional)</FieldLabel>
            <SettingsInput
              value={q.explanation ?? ""}
              onChange={(v) => update({ question: { ...q, explanation: v } })}
              placeholder="Explain the correct answer..."
              multiline
            />
          </div>
        </div>
      );
    }

    case "quiz_true_false":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">QUIZ — TRUE / FALSE</div>
          <div>
            <FieldLabel>QUESTION</FieldLabel>
            <SettingsInput
              value={(data.question as string) ?? ""}
              onChange={(v) => update({ question: v })}
              placeholder="Enter your statement..."
              multiline
            />
          </div>
          <div>
            <FieldLabel>CORRECT ANSWER</FieldLabel>
            <div className="flex gap-2">
              <button
                onClick={() => update({ correct: true })}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-colors", data.correct === true ? "bg-green-500 text-white" : "bg-[#252a45] border border-[#3a3f5c] text-[#8892b0] hover:text-white")}
              >
                True
              </button>
              <button
                onClick={() => update({ correct: false })}
                className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-colors", data.correct === false ? "bg-red-500 text-white" : "bg-[#252a45] border border-[#3a3f5c] text-[#8892b0] hover:text-white")}
              >
                False
              </button>
            </div>
          </div>
          <div>
            <FieldLabel>EXPLANATION (optional)</FieldLabel>
            <SettingsInput
              value={(data.explanation as string) ?? ""}
              onChange={(v) => update({ explanation: v })}
              placeholder="Explain the correct answer..."
              multiline
            />
          </div>
        </div>
      );

    case "quiz_match":
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">QUIZ — MATCH</div>
          <div>
            <FieldLabel>TITLE</FieldLabel>
            <SettingsInput value={(data.title as string) ?? ""} onChange={(v) => update({ title: v })} placeholder="Match the following..." />
          </div>
          <div>
            <FieldLabel>PAIRS</FieldLabel>
            <div className="space-y-2">
              {((data.pairs as { left: string; right: string }[]) ?? [{ left: "", right: "" }]).map((pair, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={pair.left}
                    onChange={(e) => {
                      const pairs = [...((data.pairs as { left: string; right: string }[]) ?? [])];
                      pairs[i] = { ...pairs[i], left: e.target.value };
                      update({ pairs });
                    }}
                    placeholder="Left"
                    className="flex-1 bg-[#252a45] border border-[#3a3f5c] rounded-lg px-2 py-1.5 text-white placeholder-[#4a5070] text-xs focus:outline-none focus:border-[#5b5fc7] transition-colors"
                  />
                  <span className="text-[#4a5070] text-xs">↔</span>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => {
                      const pairs = [...((data.pairs as { left: string; right: string }[]) ?? [])];
                      pairs[i] = { ...pairs[i], right: e.target.value };
                      update({ pairs });
                    }}
                    placeholder="Right"
                    className="flex-1 bg-[#252a45] border border-[#3a3f5c] rounded-lg px-2 py-1.5 text-white placeholder-[#4a5070] text-xs focus:outline-none focus:border-[#5b5fc7] transition-colors"
                  />
                  <button
                    onClick={() => {
                      const pairs = ((data.pairs as { left: string; right: string }[]) ?? []).filter((_, j) => j !== i);
                      update({ pairs });
                    }}
                    className="text-[#4a5070] hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => update({ pairs: [...((data.pairs as { left: string; right: string }[]) ?? []), { left: "", right: "" }] })}
                className="w-full text-[#5b5fc7] hover:text-[#7b7fd7] text-xs py-1.5 border border-dashed border-[#3a3f5c] hover:border-[#5b5fc7] rounded-lg transition-colors"
              >
                + Add pair
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 space-y-4">
          <div className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest mb-3">SETTINGS</div>
          <p className="text-[#6b7db3] text-xs">Select a slide to edit its settings.</p>
        </div>
      );
  }
}

// ─── Slide preview renderer ───────────────────────────────────────────────────

export function SlidePreviewRenderer({ block }: { block: DraftBlock }) {
  const data = block.data as Record<string, unknown>;

  switch (block.type) {
    case "slide_title":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{(data.title as string) || "A title slide"}</h1>
          {data.subtitle && <p className="text-gray-500 text-base mb-6">{data.subtitle as string}</p>}
          <button className="bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-semibold">
            {(data.buttonText as string) || "Ok, let's go!"}
          </button>
        </div>
      );

    case "slide_bulleted_list":
      return (
        <div className="p-8">
          {data.title && <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title as string}</h2>}
          <ul className="space-y-2">
            {((data.items as string[]) ?? ["Item 1", "Item 2", "Item 3"]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <span>{item || `Item ${i + 1}`}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "slide_image":
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          {data.url ? (
            <img src={data.url as string} alt={(data.caption as string) ?? ""} className="max-h-64 rounded-lg object-contain" />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            </div>
          )}
          {data.caption && <p className="text-gray-500 text-sm mt-2 text-center">{data.caption as string}</p>}
        </div>
      );

    case "slide_video":
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          {data.url ? (
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
              <iframe src={data.url as string} className="w-full h-full" allowFullScreen title="Video" />
            </div>
          ) : (
            <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-1" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          )}
        </div>
      );

    case "slide_quote":
      return (
        <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
          <div className="text-5xl text-indigo-300 leading-none mb-2">"</div>
          <p className="text-gray-700 text-lg italic leading-relaxed mb-4">
            {(data.quote as string) || "Enter the quotation here..."}
          </p>
          {data.attribution && (
            <p className="text-gray-500 text-sm">— {data.attribution as string}</p>
          )}
        </div>
      );

    case "slide_comparison":
      return (
        <div className="p-6 h-full flex flex-col">
          {data.title && <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title as string}</h2>}
          <div className="flex gap-4 flex-1">
            <div className="flex-1 bg-blue-50 rounded-xl p-4">
              <h3 className="font-bold text-blue-700 mb-2">{(data.leftLabel as string) || "Option A"}</h3>
              <p className="text-gray-600 text-sm">{(data.leftContent as string) || "Description..."}</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl p-4">
              <h3 className="font-bold text-green-700 mb-2">{(data.rightLabel as string) || "Option B"}</h3>
              <p className="text-gray-600 text-sm">{(data.rightContent as string) || "Description..."}</p>
            </div>
          </div>
        </div>
      );

    case "slide_table": {
      const headers = (data.headers as string[]) ?? ["Column 1", "Column 2", "Column 3"];
      const rows = (data.rows as string[][]) ?? [["Cell", "Cell", "Cell"]];
      return (
        <div className="p-6 overflow-auto">
          {data.title && <h2 className="text-xl font-bold text-gray-800 mb-4">{data.title as string}</h2>}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="bg-gray-100 border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-gray-200 px-3 py-2 text-gray-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "quiz_multiple_choice":
    case "quiz_question": {
      const q = (data.question as { question?: string; options?: string[]; correctIndices?: number[] }) ?? {};
      return (
        <div className="p-6">
          <p className="font-semibold text-gray-800 mb-4">{q.question || "Enter your question..."}</p>
          <div className="space-y-2">
            {(q.options ?? ["Option A", "Option B", "Option C", "Option D"]).map((opt, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors",
                (q.correctIndices ?? []).includes(i) ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:border-indigo-300"
              )}>
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex-shrink-0",
                  (q.correctIndices ?? []).includes(i) ? "border-green-500 bg-green-500" : "border-gray-300"
                )} />
                <span className="text-gray-700 text-sm">{opt || `Option ${String.fromCharCode(65 + i)}`}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "quiz_true_false":
      return (
        <div className="p-6 flex flex-col items-center justify-center h-full">
          <p className="font-semibold text-gray-800 text-center mb-6 text-lg">{(data.question as string) || "Enter your statement..."}</p>
          <div className="flex gap-4">
            <div className={cn("px-8 py-4 rounded-xl text-lg font-bold cursor-pointer transition-colors", data.correct === true ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600")}>True</div>
            <div className={cn("px-8 py-4 rounded-xl text-lg font-bold cursor-pointer transition-colors", data.correct === false ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600")}>False</div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Slide preview not available for this type
        </div>
      );
  }
}
