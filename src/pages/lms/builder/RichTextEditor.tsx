/* ============================================================
   RICH TEXT EDITOR — Tiptap-based editor for text blocks
   ============================================================
   Upgraded per the Course + Form Builder requirements report (§5):
   font family/size, colors, strike/superscript/subscript, tables,
   inline images, symbols, clear/copy formatting, full-screen editing,
   and an "AI Edit" menu.

   The AI Edit menu is an explicit, clearly-labeled UI-only simulation —
   this app has no LLM backend wired up anywhere, so it shows a canned
   transformation the admin must Accept before it replaces anything,
   rather than pretending to call a real model.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Mark } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import FontFamily from "@tiptap/extension-font-family";
import TiptapImage from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold, Italic, UnderlineIcon, Link2, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Undo, Redo, Heading1, Heading2, Heading3,
  Strikethrough, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Palette, Highlighter, Table as TableIcon, Image as ImageIcon, Upload, Link as LinkLucide,
  Type as TypeIcon, Eraser, Paintbrush, Maximize2, Minimize2, Sparkles, Loader2,
  Check, X, Plus, Trash2, Rows3, Columns3, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadCourseFile, ApiError } from "@/lib/api";

// ─── Custom FontSize mark ───────────────────────────────────────────────────
// Tiptap doesn't ship an official exact-size mark — this is the standard,
// documented pattern: a Mark that renders/parses an inline `font-size` style.
const FontSize = Mark.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{ style: "font-size" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark(this.name, { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark(this.name, { fontSize: null }).run(),
    } as any;
  },
});

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Barlow Condensed", value: "'Barlow Condensed', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

const TEXT_COLORS = ["#0F1C2E", "#0047AB", "#DC2626", "#15803D", "#B45309", "#7C3AED", "#6B7280", "#000000"];
const HIGHLIGHT_COLORS = ["#FEF08A", "#BBF7D0", "#BFDBFE", "#FBCFE8", "#FDE68A", "#FCA5A5"];

const SYMBOLS = ["©", "®", "™", "°", "±", "×", "÷", "≈", "≠", "≤", "≥", "→", "←", "•", "…", "§", "¶", "√"];

/** Canned, clearly-fake "AI" transformations — no LLM call happens here. */
function mockAIRewrite(action: string, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  switch (action) {
    case "shorten": {
      const firstSentence = trimmed.split(/(?<=[.!?])\s/)[0];
      return firstSentence.length < trimmed.length ? firstSentence : trimmed.slice(0, Math.ceil(trimmed.length * 0.6)) + "…";
    }
    case "expand":
      return `${trimmed} In practice, this means every crew member should understand not just the rule, but why it exists and what to do if conditions change on site.`;
    case "grammar":
      return trimmed.replace(/\s+/g, " ").replace(/ i /g, " I ").replace(/^./, (c) => c.toUpperCase());
    case "simplify":
      return trimmed.replace(/utilize/gi, "use").replace(/prior to/gi, "before").replace(/in order to/gi, "to");
    case "professional":
      return `Please note: ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
    case "friendly":
      return `Here's the deal — ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
    case "list":
      return trimmed.split(/[.;]\s*/).filter(Boolean).map((s) => `• ${s.trim()}`).join("\n");
    case "translate":
      return `[Translated] ${trimmed}`;
    default:
      return trimmed;
  }
}

const AI_ACTIONS: { id: string; label: string }[] = [
  { id: "shorten", label: "Shorten" },
  { id: "expand", label: "Expand" },
  { id: "grammar", label: "Fix Grammar" },
  { id: "simplify", label: "Simplify" },
  { id: "professional", label: "Professional Tone" },
  { id: "friendly", label: "Friendly Tone" },
  { id: "list", label: "Turn into a List" },
  { id: "translate", label: "Translate (Spanish)" },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = "Enter your content here…", minHeight = 200 }: RichTextEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format painter: captures the active mark set on click, applies it to the
  // next selection the admin makes.
  const [copiedFormat, setCopiedFormat] = useState<Record<string, any> | null>(null);

  // AI Edit — captures the selection being transformed so Accept can replace
  // exactly that range, and the suggestion the admin must approve first.
  const [aiSuggestion, setAiSuggestion] = useState<{ action: string; original: string; suggestion: string; from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      // Apply a copied format to whatever the admin just selected, then clear
      // paste-mode — mirrors a standard "format painter" interaction.
      if (!copiedFormat) return;
      const { from, to } = editor.state.selection;
      if (from === to) return;
      const chain = editor.chain().focus().setTextSelection({ from, to }).unsetAllMarks();
      if (copiedFormat.bold) chain.setBold();
      if (copiedFormat.italic) chain.setItalic();
      if (copiedFormat.underline) chain.setUnderline();
      if (copiedFormat.strike) chain.setStrike();
      if (copiedFormat.color) chain.setColor(copiedFormat.color);
      if (copiedFormat.fontFamily) chain.setFontFamily(copiedFormat.fontFamily);
      chain.run();
      setCopiedFormat(null);
    },
  });

  // Sync external value changes (e.g. when switching lessons)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file.");
        return;
      }
      setUploadError(null);
      setUploadingImage(true);
      try {
        const result = await uploadCourseFile(file, "lesson-media");
        editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run();
        setImagePopoverOpen(false);
      } catch (err) {
        setUploadError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
      } finally {
        setUploadingImage(false);
      }
    },
    [editor]
  );

  const handleCopyFormat = () => {
    if (!editor) return;
    setCopiedFormat({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      color: editor.getAttributes("textStyle").color,
      fontFamily: editor.getAttributes("textStyle").fontFamily,
    });
  };

  const handleAIAction = (action: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return; // require a selection
    const original = editor.state.doc.textBetween(from, to, " ");
    const suggestion = mockAIRewrite(action, original);
    setAiSuggestion({ action, original, suggestion, from, to });
  };

  const acceptAISuggestion = () => {
    if (!editor || !aiSuggestion) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: aiSuggestion.from, to: aiSuggestion.to })
      .insertContent(aiSuggestion.suggestion)
      .run();
    setAiSuggestion(null);
  };

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border border-[#0047AB]/20 rounded-lg overflow-hidden shadow-sm bg-white",
        isFullscreen && "fixed inset-4 z-50 flex flex-col shadow-2xl"
      )}
    >
      {/* Toolbar — Bastion branded: dark navy bg with white icons */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-[#0F1C2E] border-b border-white/10 shrink-0">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo size={14} />
        </ToolbarButton>

        <Divider />

        {/* Font family */}
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor.chain().focus().setFontFamily(v).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className="bg-white/10 text-white text-xs rounded px-1.5 py-1 border-none outline-none max-w-[110px]"
          title="Font Family"
          defaultValue=""
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value} className="text-black">{f.label}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            const v = e.target.value;
            if (v) (editor.chain().focus() as any).setFontSize(v).run();
            else (editor.chain().focus() as any).unsetFontSize().run();
          }}
          className="bg-white/10 text-white text-xs rounded px-1.5 py-1 border-none outline-none w-16"
          title="Font Size"
          defaultValue=""
        >
          <option value="" className="text-black">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s} className="text-black">{s}</option>
          ))}
        </select>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
          <SuperscriptIcon size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
          <SubscriptIcon size={14} />
        </ToolbarButton>

        <Divider />

        {/* Text color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(e) => e.preventDefault()} title="Text Color" className="p-1.5 rounded text-white/70 hover:bg-white/15 hover:text-white transition-colors">
              <Palette size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="grid grid-cols-4 gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="w-full mt-2 text-[11px] text-gray-500 hover:text-[#0047AB]"
            >
              Reset color
            </button>
          </PopoverContent>
        </Popover>

        {/* Highlight color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(e) => e.preventDefault()} title="Highlight" className={cn("p-1.5 rounded transition-colors", editor.isActive("highlight") ? "bg-[#1E90FF] text-white" : "text-white/70 hover:bg-white/15 hover:text-white")}>
              <Highlighter size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="grid grid-cols-3 gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="w-full mt-2 text-[11px] text-gray-500 hover:text-[#0047AB]"
            >
              Remove highlight
            </button>
          </PopoverContent>
        </Popover>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
          title="Insert Link"
        >
          <Link2 size={14} />
        </ToolbarButton>

        {/* Insert image */}
        <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(e) => e.preventDefault()} title="Insert Image" className="p-1.5 rounded text-white/70 hover:bg-white/15 hover:text-white transition-colors">
              <ImageIcon size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); e.target.value = ""; }} />
            <Button type="button" size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
              {uploadingImage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Upload from Desktop
            </Button>
            <div className="flex gap-1.5">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="text-xs h-8" />
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 bg-[#0047AB] hover:bg-[#1565C0] text-xs px-2"
                onClick={() => {
                  if (imageUrl.trim()) {
                    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
                    setImageUrl("");
                    setImagePopoverOpen(false);
                  }
                }}
              >
                <LinkLucide size={12} />
              </Button>
            </div>
            {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}
          </PopoverContent>
        </Popover>

        {/* Table */}
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
          <TableIcon size={14} />
        </ToolbarButton>
        {editor.isActive("table") && (
          <>
            <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
              <Rows3 size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
              <Columns3 size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
              <Trash2 size={14} />
            </ToolbarButton>
          </>
        )}

        {/* Symbols */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(e) => e.preventDefault()} title="Insert Symbol" className="p-1.5 rounded text-white/70 hover:bg-white/15 hover:text-white transition-colors">
              <Smile size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="grid grid-cols-6 gap-1">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().insertContent(s).run()}
                  className="text-lg text-gray-700 hover:bg-gray-100 rounded py-1"
                >
                  {s}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
          <Eraser size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={handleCopyFormat} active={!!copiedFormat} title="Copy Formatting — then select text to apply it">
          <Paintbrush size={14} />
        </ToolbarButton>

        <Divider />

        {/* AI Edit */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" onMouseDown={(e) => e.preventDefault()} title="AI Edit (select text first)" className="flex items-center gap-1 px-2 py-1.5 rounded text-white/70 hover:bg-white/15 hover:text-white transition-colors text-xs font-display font-bold">
              <Sparkles size={13} />AI Edit
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            {AI_ACTIONS.map((a) => (
              <button
                key={a.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAIAction(a.id)}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 text-gray-700"
              >
                {a.label}
              </button>
            ))}
            <p className="px-2 pt-1 text-[10px] text-gray-400 border-t border-gray-100 mt-1">Select text first — every suggestion needs your approval.</p>
          </PopoverContent>
        </Popover>

        <div className="ml-auto" />
        <ToolbarButton onClick={() => setIsFullscreen((v) => !v)} title={isFullscreen ? "Exit Full Screen" : "Full Screen"}>
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </ToolbarButton>
      </div>

      {/* AI suggestion approval bar */}
      {aiSuggestion && (
        <div className="p-3 bg-purple-50 border-b border-purple-200 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 text-purple-700 text-xs font-display font-bold uppercase tracking-wide">
            <Sparkles size={12} />AI Suggestion — {AI_ACTIONS.find((a) => a.id === aiSuggestion.action)?.label}
          </div>
          <p className="text-xs text-gray-500 line-through">{aiSuggestion.original}</p>
          <p className="text-sm text-gray-800 font-body whitespace-pre-wrap">{aiSuggestion.suggestion}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={acceptAISuggestion} className="h-auto py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1">
              <Check size={12} />Accept
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAiSuggestion(null)} className="h-auto py-1.5 px-3 text-xs gap-1">
              <X size={12} />Discard
            </Button>
          </div>
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={cn("prose prose-sm max-w-none p-4 font-body focus:outline-none", isFullscreen && "flex-1 overflow-y-auto")}
        style={isFullscreen ? undefined : { minHeight }}
      />

      <style>{`
        .ProseMirror { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 800; margin: 0.75rem 0 0.5rem; font-family: var(--font-display, sans-serif); }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.5rem; font-family: var(--font-display, sans-serif); }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 700; margin: 0.5rem 0 0.25rem; font-family: var(--font-display, sans-serif); }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
        .ProseMirror blockquote { border-left: 3px solid #0047AB; padding-left: 1rem; color: #4b5563; font-style: italic; }
        .ProseMirror a { color: #0047AB; text-decoration: underline; }
        .ProseMirror img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
        .ProseMirror th, .ProseMirror td { border: 1px solid #d1d5db; padding: 0.4rem 0.6rem; text-align: left; }
        .ProseMirror th { background: #F4F6F9; font-weight: 700; }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active ? "bg-[#1E90FF] text-white" : "text-white/70 hover:bg-white/15 hover:text-white",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/15 mx-1" />;
}
