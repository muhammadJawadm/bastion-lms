/**
 * @file builder/types.ts
 * @description Shared type definitions for the Bastion LMS Course Builder.
 *
 * This file contains two sections:
 *
 * 1. **Legacy block types** — the original slide/block system used by
 *    `BlockEditor.tsx`, `SlideSettingsPanel.tsx`, `CoursePreview.tsx`, and
 *    `LMSBuilder.tsx`. These are preserved for backward compatibility.
 *
 * 2. **Canvas element types** — the new free-form canvas slide system
 *    introduced in v1. Canvas slides (`canvas_slide` block type) store a
 *    `CanvasSlideData` payload as JSON in the `content` field of the
 *    `lesson_blocks` database table.
 *
 * @module builder/types
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — LEGACY BLOCK TYPES (preserved for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All lesson types supported by the builder.
 * The `"slides"` type uses the canvas-based slide editor.
 */
export type LessonType =
  | "text"
  | "video_embed"
  | "video_upload"
  | "pdf"
  | "quiz"
  | "image"
  | "resource"
  | "slides";

// ─── Block type discriminants ─────────────────────────────────────────────────

/**
 * All supported lesson block types.
 *
 * **Canvas builder types (new in v1):**
 * - `"canvas_slide"` — free-form canvas slide with positioned elements
 * - `"quiz_fitb"` — fill-in-the-blank question
 * - `"quiz_dragdrop"` — drag-and-drop word bank question
 *
 * **Legacy slide types (pre-canvas):**
 * - `"slide_*"` — structured slide types (title, bulleted list, image, etc.)
 * - `"quiz_*"` — legacy quiz block types
 * - `"text"`, `"video"`, `"image"`, etc. — legacy content blocks
 */
export type BlockType =
  // ── Canvas builder (new) ──────────────────────────────────────────────────
  | "canvas_slide"
  | "quiz_fitb"
  | "quiz_dragdrop"
  // ── TEACH — structured content slides ────────────────────────────────────
  | "slide_title"
  | "slide_bulleted_list"
  | "slide_image"
  | "slide_video"
  | "slide_file"
  | "slide_table"
  | "slide_quote"
  | "slide_comparison"
  | "slide_expandable_list"
  | "slide_horizontal_series"
  | "slide_reveal"
  | "slide_scrolling_mix"
  | "slide_scrolling_text"
  | "slide_sequence"
  | "slide_vertical_series"
  // ── QUIZ — assessment blocks ──────────────────────────────────────────────
  | "quiz_multiple_choice"
  | "quiz_true_false"
  | "quiz_match"
  | "quiz_numbers"
  | "quiz_words"
  | "quiz_question"   // legacy alias
  // ── LEGACY content blocks ─────────────────────────────────────────────────
  | "text"
  | "video"
  | "image"
  | "pdf"
  | "resource"
  | "checklist"
  | "acknowledgment"
  | "policy_ack"
  | "signature"
  | "callout"
  | "warning"
  | "safety_tip"
  | "assignment";

// ─── Legacy slide data payloads ───────────────────────────────────────────────

/** Data payload for a `slide_title` block. */
export interface SlideTitleData {
  title: string;
  subtitle?: string;
  buttonText?: string;
  backgroundUrl?: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_bulleted_list` block. */
export interface SlideBulletedListData {
  title?: string;
  items: string[];
  narrationUrl?: string;
}

/** Data payload for a `slide_image` block. */
export interface SlideImageData {
  url: string;
  caption?: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_video` block. */
export interface SlideVideoData {
  url: string;
  caption?: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_file` block. */
export interface SlideFileData {
  url: string;
  title: string;
  description?: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_table` block. */
export interface SlideTableData {
  title?: string;
  headers: string[];
  rows: string[][];
  narrationUrl?: string;
}

/** Data payload for a `slide_quote` block. */
export interface SlideQuoteData {
  quote: string;
  attribution?: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_comparison` block. */
export interface SlideComparisonData {
  title?: string;
  leftLabel: string;
  leftContent: string;
  rightLabel: string;
  rightContent: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_expandable_list` block. */
export interface SlideExpandableListData {
  title?: string;
  items: { heading: string; body: string }[];
  narrationUrl?: string;
}

/** Data payload for a `slide_horizontal_series` block. */
export interface SlideHorizontalSeriesData {
  title?: string;
  items: { title: string; body: string }[];
  narrationUrl?: string;
}

/** Data payload for a `slide_reveal` block. */
export interface SlideRevealData {
  title?: string;
  items: { front: string; back: string }[];
  narrationUrl?: string;
}

/** Data payload for a `slide_scrolling_mix` block. */
export interface SlideScrollingMixData {
  title?: string;
  blocks: { type: "text" | "image"; content: string }[];
  narrationUrl?: string;
}

/** Data payload for a `slide_scrolling_text` block. */
export interface SlideScrollingTextData {
  title?: string;
  body: string;
  narrationUrl?: string;
}

/** Data payload for a `slide_sequence` block. */
export interface SlideSequenceData {
  title?: string;
  steps: string[];
  narrationUrl?: string;
}

/** Data payload for a `slide_vertical_series` block. */
export interface SlideVerticalSeriesData {
  title?: string;
  items: { title: string; body: string }[];
  narrationUrl?: string;
}

// ─── Quiz block payloads ──────────────────────────────────────────────────────

/**
 * All supported quiz question types.
 */
export type QuizQuestionType =
  | "multiple_choice"
  | "true_false"
  | "select_all"
  | "match"
  | "fill_blank"
  | "scenario"
  | "image_based"
  | "hazard_recognition"
  | "ppe_selection"
  | "incident_scenario";

/**
 * A single quiz question (legacy format used by `quiz_question` blocks).
 */
export interface QuizQuestion {
  /** Unique identifier (UUID v4). */
  id: string;
  /** Question type discriminant. */
  type: QuizQuestionType;
  /** The question text. */
  question: string;
  /** Optional image URL to display with the question. */
  imageUrl?: string;
  /** Answer options (for multiple choice, select all, etc.). */
  options: string[];
  /** Indices of correct answers in the `options` array. */
  correctIndices: number[];
  /** Match pairs (for `"match"` type questions). */
  matchPairs?: { left: string; right: string }[];
  /** Explanation shown after the learner answers. */
  explanation?: string;
  /** Per-outcome feedback text. */
  feedback?: { correct: string; incorrect: string };
  /** OSHA regulation reference (e.g. "29 CFR 1926.502"). */
  oshaRef?: string;
  /** Whether to randomize the order of options. */
  randomizeOptions?: boolean;
}

/** Data payload for a `quiz_multiple_choice` block. */
export interface QuizMultipleChoiceData { question: QuizQuestion; }

/**
 * A single answer option in a multiple-choice question (canvas quiz).
 * Used by `MultipleChoiceData` for the new canvas-based MC question editor.
 */
export interface MultipleChoiceOption {
  /** Unique identifier (UUID v4). */
  id: string;
  /** The text of this answer option. */
  text: string;
  /** Optional feedback shown when the learner selects this option. */
  feedback?: string;
}

/**
 * Data payload for a canvas-style multiple choice question.
 * Used by `InteractiveQuestions.tsx` in the canvas builder.
 * (Alias-compatible with the legacy `QuizMultipleChoiceData` format.)
 */
export interface MultipleChoiceData {
  /** The question stem. */
  question: string;
  /** The list of answer options (2–6). */
  options: MultipleChoiceOption[];
  /** The `id` of the correct option. */
  correctOptionId: string;
  /** Optional explanation shown after the learner answers. */
  explanation?: string;
}

/** Data payload for a `quiz_true_false` block. */
export interface QuizTrueFalseData {
  question: string;
  correct: boolean;
  explanation?: string;
}

/** Data payload for a `quiz_match` block. */
export interface QuizMatchData {
  title?: string;
  pairs: { left: string; right: string }[];
}

/** Data payload for a `quiz_numbers` block. */
export interface QuizNumbersData {
  question: string;
  answer: number;
  tolerance?: number;
  unit?: string;
}

/** Data payload for a `quiz_words` block. */
export interface QuizWordsData {
  question: string;
  answer: string;
  caseSensitive?: boolean;
}

// ─── Legacy content block payloads ───────────────────────────────────────────

/** Data payload for a `text` block (rich HTML content). */
export interface TextBlockData { html: string; }

/** Data payload for a `video` block. */
export interface VideoBlockData { url: string; caption?: string; autoplay?: boolean; }

/** Data payload for an `image` block. */
export interface ImageBlockData { url: string; alt?: string; caption?: string; width?: "full" | "half" | "quarter"; }

/** Data payload for a `pdf` block. */
export interface PdfBlockData { url: string; title?: string; downloadable?: boolean; }

/** Data payload for a `resource` block (downloadable file). */
export interface ResourceBlockData { url: string; title: string; description?: string; fileType?: string; }

/** A single checklist item. */
export interface ChecklistItem { id: string; text: string; required?: boolean; }

/** Data payload for a `checklist` block. */
export interface ChecklistBlockData { title?: string; items: ChecklistItem[]; requireAll?: boolean; supportingMediaUrl?: string; }

/** Data payload for an `acknowledgment` block. */
export interface AcknowledgmentBlockData { statement: string; checkboxLabel?: string; }

/** Data payload for a `policy_ack` block. */
export interface PolicyAckBlockData { policyTitle: string; policyText: string; checkboxLabel?: string; requireSignature?: boolean; }

/** Data payload for a `signature` block. */
export interface SignatureBlockData { prompt?: string; label?: string; supportingMediaUrl?: string; }

/** Data payload for a `callout` block. */
export interface CalloutBlockData { title?: string; body: string; variant: "info" | "tip" | "note"; }

/** Data payload for a `warning` block. */
export interface WarningBlockData { title?: string; body: string; variant: "warning" | "danger" | "caution"; oshaRef?: string; }

/** Data payload for a `safety_tip` block. */
export interface SafetyTipBlockData { tip: string; icon?: string; }

/** Data payload for an `assignment` block. */
export interface AssignmentBlockData {
  title: string;
  instructions: string;
  submissionType: "text" | "file" | "either";
  dueOffsetDays?: number;
  supportingMediaUrl?: string;
}

/**
 * Data payload for a `quiz_question` (legacy alias) block.
 * When `question.type === "fill_blank"`, `fillBlank` holds the word-bank
 * payload (reusing `DragDropData`'s shape) instead of `question.options`.
 */
export interface QuizQuestionBlockData { question: QuizQuestion; fillBlank?: DragDropData; }

/**
 * Union of all possible block data payloads.
 * Use the parent block's `type` field to narrow to the correct payload type.
 */
export type BlockData =
  | CanvasSlideData
  | FillInTheBlankData
  | DragDropData
  | SlideTitleData
  | SlideBulletedListData
  | SlideImageData
  | SlideVideoData
  | SlideFileData
  | SlideTableData
  | SlideQuoteData
  | SlideComparisonData
  | SlideExpandableListData
  | SlideHorizontalSeriesData
  | SlideRevealData
  | SlideScrollingMixData
  | SlideScrollingTextData
  | SlideSequenceData
  | SlideVerticalSeriesData
  | QuizMultipleChoiceData
  | QuizTrueFalseData
  | QuizMatchData
  | QuizNumbersData
  | QuizWordsData
  | TextBlockData
  | VideoBlockData
  | ImageBlockData
  | PdfBlockData
  | ResourceBlockData
  | ChecklistBlockData
  | AcknowledgmentBlockData
  | PolicyAckBlockData
  | SignatureBlockData
  | CalloutBlockData
  | WarningBlockData
  | SafetyTipBlockData
  | QuizQuestionBlockData
  | AssignmentBlockData;

/**
 * A saved content block as stored in the database.
 */
export interface ContentBlock {
  /** Database primary key. */
  id: number;
  /** The lesson this block belongs to. */
  lessonId: number;
  /** Block type discriminant. */
  type: BlockType;
  /** Parsed block data payload. */
  data: BlockData;
  /** Display order within the lesson. */
  sortOrder: number;
}

/**
 * A draft block in the builder (may not yet be saved to the database).
 * New blocks have a temporary string `id`; saved blocks have a numeric string `id`
 * matching the database primary key.
 */
export interface DraftBlock {
  /** Temporary UUID for new blocks; numeric string for saved blocks. */
  id: string;
  /** Database primary key (only set for saved blocks). */
  dbId?: number;
  /** The lesson this block belongs to. */
  lessonId: number;
  /** Block type discriminant. */
  type: BlockType;
  /** Block data payload. */
  data: BlockData;
  /** Display order within the lesson. */
  sortOrder: number;
  /** Whether this block has unsaved local changes. */
  isDirty?: boolean;
  /** Whether this block has never been saved to the database. */
  isNew?: boolean;
}

// ─── Quiz settings ────────────────────────────────────────────────────────────

/**
 * Quiz-level settings for a lesson of type `"quiz"`.
 */
export interface QuizSettings {
  title: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showCorrectAnswers: boolean;
  mustPassToComplete: boolean;
  questions: QuizQuestion[];
}

// ─── Module / Lesson tree ─────────────────────────────────────────────────────

/**
 * A lesson as represented in the builder's left-panel tree.
 */
export interface BuilderLesson {
  id: number;
  courseId: number;
  moduleId?: number | null;
  title: string;
  type: LessonType;
  sortOrder: number;
  durationMinutes: number;
  isRequired: boolean;
  body?: string | null;
  contentUrl?: string | null;
  isDirty?: boolean;
}

/**
 * A module (section) as represented in the builder's left-panel tree.
 * Contains an ordered list of lessons.
 */
export interface BuilderModule {
  id: number;
  courseId: number;
  title: string;
  sortOrder: number;
  lessons: BuilderLesson[];
}

// ─── Preview mode ─────────────────────────────────────────────────────────────

/** The device viewport to simulate in the course preview. */
export type PreviewDevice = "desktop" | "tablet" | "mobile";

/** The learner role to simulate in the course preview. */
export type PreviewRole = "employee" | "quiz" | "certificate";

// ─── Slide Library ────────────────────────────────────────────────────────────

/**
 * A single entry in the slide library modal.
 */
export interface SlideLibraryItem {
  type: BlockType;
  label: string;
  description: string;
  category: "teach" | "quiz" | "engage" | "more";
  previewComponent?: string;
}

/**
 * The full slide library — all available block types grouped by category.
 * Used to populate the "Add Slide" modal in the builder.
 */
export const SLIDE_LIBRARY: SlideLibraryItem[] = [
  // ── TEACH ──────────────────────────────────────────────────────────────────
  { type: "canvas_slide",          label: "Canvas Slide",       description: "Free-form canvas with text, images, and video",  category: "teach" },
  { type: "slide_title",           label: "Title",              description: "Introduce the lesson",                           category: "teach" },
  { type: "slide_bulleted_list",   label: "Bulleted list",      description: "Show a list of bullet points",                   category: "teach" },
  { type: "slide_image",           label: "Image",              description: "Display an image",                               category: "teach" },
  { type: "slide_file",            label: "File",               description: "Attach a file or PDF",                          category: "teach" },
  { type: "slide_video",           label: "Video",              description: "Embed or upload a video",                       category: "teach" },
  { type: "slide_table",           label: "Table",              description: "Organize text in a table",                      category: "teach" },
  { type: "slide_quote",           label: "Quote",              description: "Show a quotation",                               category: "teach" },
  { type: "slide_comparison",      label: "Comparison",         description: "Compare two text blocks",                       category: "teach" },
  { type: "slide_expandable_list", label: "Expandable list",    description: "Show a list of concepts",                       category: "teach" },
  { type: "slide_horizontal_series", label: "Horizontal series", description: "Show text blocks in order",                    category: "teach" },
  { type: "slide_reveal",          label: "Reveal",             description: "Show a list of concepts",                       category: "teach" },
  { type: "slide_scrolling_mix",   label: "Scrolling mix",      description: "Show a mix of text and media",                  category: "teach" },
  { type: "slide_scrolling_text",  label: "Scrolling text",     description: "Show long-form text",                           category: "teach" },
  { type: "slide_sequence",        label: "Sequence",           description: "Show a sequence of text",                       category: "teach" },
  { type: "slide_vertical_series", label: "Vertical series",    description: "Show text blocks in order",                     category: "teach" },
  // ── QUIZ ───────────────────────────────────────────────────────────────────
  { type: "quiz_multiple_choice",  label: "Multiple choice",    description: "Single correct answer",                         category: "quiz" },
  { type: "quiz_fitb",             label: "Fill in the blank",  description: "Type the missing word(s)",                      category: "quiz" },
  { type: "quiz_dragdrop",         label: "Drag & drop",        description: "Drag words from a word bank",                   category: "quiz" },
  { type: "quiz_true_false",       label: "True / False",       description: "True or false question",                        category: "quiz" },
  { type: "quiz_match",            label: "Match",              description: "Match items together",                          category: "quiz" },
  { type: "quiz_numbers",          label: "Numbers",            description: "Enter a numeric answer",                        category: "quiz" },
  { type: "quiz_words",            label: "Words",              description: "Enter a text answer",                           category: "quiz" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — CANVAS ELEMENT TYPES (new in v1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base properties shared by all canvas elements.
 *
 * Position (`x`, `y`) and size (`w`, `h`) are expressed as percentages (0–100)
 * of the canvas dimensions, so layouts scale correctly across screen sizes.
 */
export interface BaseCanvasElement {
  /** Unique identifier (UUID v4). */
  id: string;
  /** Element type discriminant. */
  type: "text" | "image" | "video" | "shape";
  /**
   * Horizontal position as a percentage of canvas width.
   * 0 = left edge, 100 = right edge.
   */
  x: number;
  /**
   * Vertical position as a percentage of canvas height.
   * 0 = top edge, 100 = bottom edge.
   */
  y: number;
  /** Element width as a percentage of canvas width. */
  w: number;
  /** Element height as a percentage of canvas height. */
  h: number;
  /**
   * Stacking order. Higher values appear in front of lower values.
   * Range: 1–100.
   */
  zIndex: number;
  /**
   * Whether the element is locked.
   * Locked elements cannot be moved or resized in the editor.
   */
  locked: boolean;
}

// ─── Text element ─────────────────────────────────────────────────────────────

/**
 * A text box element on the canvas.
 * Supports rich formatting: font family, size, weight, style, color, and alignment.
 */
export interface CanvasTextElement extends BaseCanvasElement {
  type: "text";
  /** The text content. Supports newlines (`\n`) for multi-line text. */
  content: string;
  /**
   * Font family name.
   * Must be one of the fonts loaded via Google Fonts CDN.
   * @example "Inter", "Montserrat", "Bebas Neue"
   */
  fontFamily: string;
  /**
   * Font size in pixels, relative to the 960px reference canvas width.
   * Scaled proportionally when the canvas is resized.
   */
  fontSize: number;
  /**
   * CSS font-weight value.
   */
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
  /** Whether the text is italicised. */
  italic: boolean;
  /** Whether the text has an underline decoration. */
  underline: boolean;
  /** CSS color value for the text. */
  color: string;
  /** Horizontal text alignment. */
  align: "left" | "center" | "right";
  /**
   * Background color for the text box.
   * Use `"transparent"` for no background.
   */
  backgroundColor: string;
  /** Border radius of the text box in pixels. */
  borderRadius: number;
  /** Inner padding of the text box in pixels. */
  padding: number;
}

// ─── Image element ────────────────────────────────────────────────────────────

/**
 * An image element on the canvas.
 */
export interface CanvasImageElement extends BaseCanvasElement {
  type: "image";
  /**
   * Image source URL.
   * Can be a Manus storage URL (`/manus-storage/…`), an external CDN URL,
   * or an empty string for a placeholder.
   */
  url: string;
  /** Alt text for accessibility. */
  alt: string;
  /**
   * CSS `object-fit` value for how the image fills its container.
   */
  objectFit: "cover" | "contain" | "fill";
  /** Border radius in pixels. */
  borderRadius: number;
  /**
   * Opacity of the image element.
   * Range: 0 (fully transparent) to 1 (fully opaque).
   */
  opacity: number;
}

// ─── Video element ────────────────────────────────────────────────────────────

/** The video hosting provider. */
export type VideoProvider = "youtube" | "vimeo" | "upload" | "other";

/**
 * A video element on the canvas.
 * Supports YouTube, Vimeo, uploaded files, and other embeddable video services.
 */
export interface CanvasVideoElement extends BaseCanvasElement {
  type: "video";
  /**
   * Video URL.
   * - YouTube: `https://www.youtube.com/watch?v=…` (auto-converted to embed URL)
   * - Vimeo: `https://vimeo.com/…`
   * - Upload: Manus storage URL (`/manus-storage/…`)
   */
  url: string;
  /** The video hosting provider. */
  provider: VideoProvider;
  /**
   * Whether the video should autoplay when the slide becomes active.
   */
  autoplay: boolean;
  /** Optional caption displayed below the video in the learner view. */
  caption?: string;
}

// ─── Shape element ────────────────────────────────────────────────────────────

/**
 * A geometric shape element on the canvas.
 * Used for decorative elements, dividers, and background accents.
 */
export interface CanvasShapeElement extends BaseCanvasElement {
  type: "shape";
  /** The shape geometry. */
  shape: "rectangle" | "circle" | "line";
  /** CSS fill color for the shape interior. */
  fill: string;
  /**
   * CSS stroke color for the shape border.
   * Use `"transparent"` for no border.
   */
  stroke: string;
  /** Stroke width in pixels. */
  strokeWidth: number;
  /** Border radius in pixels (only applies to rectangles). */
  borderRadius: number;
  /**
   * Opacity of the shape element.
   * Range: 0 (fully transparent) to 1 (fully opaque).
   */
  opacity: number;
}

/**
 * Union type of all canvas element types.
 * Use the `type` discriminant to narrow to a specific element type.
 */
export type CanvasElement =
  | CanvasTextElement
  | CanvasImageElement
  | CanvasVideoElement
  | CanvasShapeElement;

// ─── Slide background ─────────────────────────────────────────────────────────

/**
 * Background configuration for a canvas slide.
 */
export interface CanvasBackground {
  /**
   * Background image URL.
   * `null` = no background image (use `color` instead).
   */
  imageUrl: string | null;
  /**
   * Background color (CSS hex or rgba string).
   */
  color: string;
  /**
   * Opacity of the dark overlay applied on top of the background image.
   * Range: 0 (no overlay) to 1 (fully opaque).
   */
  overlayOpacity: number;
  /** Color of the overlay. Typically `"#000000"` (black). */
  overlayColor: string;
}

// ─── Canvas slide data ────────────────────────────────────────────────────────

/**
 * The complete data payload for a `canvas_slide` block.
 * Stored as JSON in the `content` field of the `lesson_blocks` table.
 */
export interface CanvasSlideData {
  /** Slide background configuration. */
  background: CanvasBackground;
  /**
   * Ordered list of canvas elements on this slide.
   * Elements are rendered in ascending `zIndex` order.
   */
  elements: CanvasElement[];
  /**
   * The ID of the chapter this slide belongs to.
   * `null` = not assigned to a chapter.
   */
  chapterId?: number | null;
  /**
   * Instructor notes for this slide.
   * Not visible to learners; shown in the builder's notes panel.
   */
  notes: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — INTERACTIVE QUESTION TYPES (new in v1)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Fill-in-the-blank ────────────────────────────────────────────────────────

/**
 * Data payload for a `quiz_fitb` (fill-in-the-blank) block.
 * Stored as JSON in the `content` field of the `lesson_blocks` table.
 */
export interface FillInTheBlankData {
  /**
   * The sentence template with `{{blank}}` placeholders.
   * @example "Always wear your {{blank}} before entering a {{blank}} area."
   */
  template: string;
  /**
   * The correct answers for each blank, in order.
   * Multiple accepted answers can be separated by a pipe (`|`).
   * Answers are compared case-insensitively.
   * @example ["hard hat", "restricted|hazardous"]
   */
  correctAnswers: string[];
  /** Optional explanation shown after the learner submits their answers. */
  explanation?: string;
}

// ─── Drag-and-drop word bank ──────────────────────────────────────────────────

/**
 * Data payload for a `quiz_dragdrop` (drag-and-drop word bank) block.
 * Stored as JSON in the `content` field of the `lesson_blocks` table.
 */
export interface DragDropData {
  /**
   * The sentence template with `{{blank}}` placeholders.
   * Same format as `FillInTheBlankData.template`.
   */
  template: string;
  /**
   * The correct answers for each blank, in order.
   * Each entry must exactly match one of the words in `wordBank`.
   */
  correctAnswers: string[];
  /**
   * The pool of word chips shown in the word bank.
   * Should include all correct answers plus optional distractor words.
   * The word bank is shuffled randomly when the question is rendered.
   */
  wordBank: string[];
  /** Optional explanation shown after the learner submits their answers. */
  explanation?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — CHAPTER / SECTION TYPES (new in v1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A chapter (section) within a lesson.
 * Chapters group blocks into named sections for navigation and progress tracking.
 * Maps to the `lesson_chapters` database table.
 */
export interface LessonChapter {
  /** Database primary key. */
  id: number;
  /** The lesson this chapter belongs to. */
  lessonId: number;
  /** Display name of the chapter. */
  title: string;
  /**
   * Display order of this chapter within the lesson.
   * Lower values appear first.
   */
  order: number;
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
}
