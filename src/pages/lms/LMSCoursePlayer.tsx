/**
 * @file LMSCoursePlayer.tsx
 * @description Learner-facing course player for the Bastion LMS.
 *
 * Renders all lesson types:
 *  - video_embed / video_upload — YouTube, Vimeo, or direct video file
 *  - pdf                        — Link to open PDF in new tab
 *  - text                       — Rich HTML body
 *  - quiz                       — Multiple-choice quiz modal
 *  - slides / canvas_slide      — Canvas-based slide viewer (new)
 *  - quiz_fitb                  — Fill-in-the-blank interactive question
 *  - quiz_dragdrop              — Drag-and-drop word bank question
 *
 * Chapters (sections) are shown in the sidebar with collapsible groups.
 * Progress is tracked per lesson via the enrollments.updateProgress procedure.
 *
 * Responsive: works on mobile (single-column) and desktop (two-column).
 */

import { useState, useMemo, useCallback } from "react";
import { Link, useParams } from "wouter";
import {
  Play, ChevronLeft, ChevronRight,
  CheckCircle2, Lock, FileText, Type, Video, Award, X, Loader2,
  ExternalLink, Layers, BookOpen
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { FillInTheBlankViewer, DragDropViewer } from "./builder/InteractiveQuestions";
import { MOCK_COURSES, MOCK_LESSONS, MOCK_BLOCKS, MOCK_MY_ENROLLMENTS } from "./mockData";
import type {
  CanvasSlideData, CanvasElement, CanvasTextElement,
  CanvasImageElement, CanvasVideoElement,
  FillInTheBlankData, DragDropData,
} from "./builder/types";

// ─── Icon / colour maps ───────────────────────────────────────────────────────

/** Maps lesson type to a Lucide icon component for the sidebar. */
const typeIcon: Record<string, React.ElementType> = {
  video_embed: Video,
  video_upload: Video,
  pdf: FileText,
  text: Type,
  quiz: CheckCircle2,
  slides: Layers,
  canvas_slide: Layers,
  quiz_fitb: BookOpen,
  quiz_dragdrop: BookOpen,
};

/** Maps lesson type to a Tailwind text-colour class. */
const typeColor: Record<string, string> = {
  video_embed: "text-[#1E90FF]",
  video_upload: "text-[#1E90FF]",
  pdf: "text-[#00A3FF]",
  text: "text-purple-500",
  quiz: "text-green-500",
  slides: "text-amber-500",
  canvas_slide: "text-amber-500",
  quiz_fitb: "text-teal-500",
  quiz_dragdrop: "text-teal-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders a YouTube, Vimeo, or direct video URL as an embedded player.
 * @param url - The raw video URL or embed URL.
 */
function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return (
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video lesson"
      />
    );
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <iframe
        className="w-full h-full"
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo lesson"
      />
    );
  }
  return <video className="w-full h-full" controls src={url} />;
}

/**
 * Renders a single canvas element (text, image, or video) positioned on the slide.
 * All coordinates are percentages of the canvas width/height (0–100).
 * @param el - The canvas element descriptor from the slide's `elements` array.
 */
function CanvasElementRenderer({ el }: { el: CanvasElement }) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex ?? 1,
  };

  if (el.type === "text") {
    const t = el as CanvasTextElement;
    return (
      <div
        style={{
          ...style,
          fontFamily: t.fontFamily ?? "inherit",
          fontSize: t.fontSize ?? 16,
          fontWeight: t.fontWeight ?? "normal",
          fontStyle: t.italic ? "italic" : "normal",
          textDecoration: t.underline ? "underline" : "none",
          textAlign: (t.align as React.CSSProperties["textAlign"]) ?? "left",
          color: t.color ?? "#ffffff",
          lineHeight: 1.4,
          overflow: "hidden",
          padding: "4px",
        }}
      >
        {t.content}
      </div>
    );
  }

  if (el.type === "image") {
    const img = el as CanvasImageElement;
    return (
        <img
        src={img.url}
        alt={img.alt ?? ""}
        style={{ ...style, objectFit: "cover" }}
        draggable={false}
      />
    );
  }

  if (el.type === "video") {
    const v = el as CanvasVideoElement;
    return (
      <div style={style}>
        <VideoEmbed url={v.url} />
      </div>
    );
  }

  return null;
}

/**
 * Renders a canvas slide in read-only (learner) mode.
 * The slide maintains a 16:9 aspect ratio and scales to fit its container.
 * @param data - The parsed CanvasSlideData from the lesson block's `data` field.
 */
function CanvasSlideViewer({ data }: { data: CanvasSlideData }) {
  return (
    <div className="w-full" style={{ aspectRatio: "16/9", position: "relative" }}>
      {/* Background */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          backgroundColor: data.background?.color ?? "#0F1C2E",
          backgroundImage: data.background?.imageUrl
            ? `url(${data.background.imageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Optional dark overlay for legibility */}
        {data.background?.imageUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: `rgba(0,0,0,${data.background.overlayOpacity ?? 0.4})`,
            }}
          />
        )}
      </div>

      {/* Canvas elements */}
      {data.elements?.map((el) => (
        <CanvasElementRenderer key={el.id} el={el} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * LMSCoursePlayer — full learner-facing course playback experience.
 *
 * Route: /lms/courses/:id
 *
 * Features:
 *  - Loads course + lessons via tRPC
 *  - Loads lesson blocks for the active lesson (for canvas/interactive types)
 *  - Loads chapters to group lessons in the sidebar
 *  - Tracks progress via enrollments.updateProgress
 *  - Fully responsive (mobile + desktop)
 */
export default function LMSCoursePlayer() {
  const { role, setRole } = useLMS();
  const params = useParams<{ id?: string }>();
  const courseId = params.id ? Number(params.id) : undefined;

  // ── Navigation state ──────────────────────────────────────────────────────
  /** Index of the currently displayed lesson in the `lessons` array. */
  const [activeLesson, setActiveLesson] = useState<number>(0);

  /** Index of the currently displayed slide within a canvas-type lesson. */
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // ── Quiz state ────────────────────────────────────────────────────────────
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizStep, setQuizStep] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // ── Interactive question state ────────────────────────────────────────────
  /** Whether the current interactive question has been answered. */
  const [interactiveAnswered, setInteractiveAnswered] = useState<boolean>(false);

  // ── Data (static mock, no network calls) ─────────────────────────────────
  const course = courseId ? MOCK_COURSES.find((c) => c.id === courseId) : undefined;
  const loadingCourse = false;

  const lessons = courseId ? MOCK_LESSONS.filter((l) => l.courseId === courseId).sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const loadingLessons = false;

  const currentLesson = lessons?.[activeLesson];

  /** Lesson blocks for the active lesson (canvas/interactive types, or general content). */
  const lessonBlocks = currentLesson ? MOCK_BLOCKS.filter((b) => b.lessonId === currentLesson.id).sort((a, b) => a.sortOrder - b.sortOrder) : [];

  /** Chapters aren't modeled in the prototype's mock data — lessons render as a flat list. */
  const chapters: { id: number; title: string }[] = [];

  // Enrollment / progress
  const myEnrollments = MOCK_MY_ENROLLMENTS;
  const enrollment = myEnrollments?.find((e) => e.courseId === courseId);
  const enrollmentId = enrollment?.id;

  const updateProgress = {
    mutate: (_input: { enrollmentId: number; progressPct: number; status?: string }) => {
      // No-op in the prototype — progress isn't persisted anywhere.
    },
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const isLoading = loadingCourse || loadingLessons;
  const totalLessons = lessons?.length ?? 0;
  const progress = totalLessons > 0 ? Math.round((activeLesson / totalLessons) * 100) : 0;

  /**
   * Canvas slides for the current lesson (if type === "slides").
   * Each `canvas_slide` block in `lessonBlocks` represents one slide.
   */
  const canvasSlides = useMemo(() => {
    if (!lessonBlocks) return [];
    return lessonBlocks
      .filter((b) => b.type === "canvas_slide")
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [lessonBlocks]);

  /** Current canvas slide data, parsed from the block's JSON `data` field. */
  const currentCanvasSlide = useMemo((): CanvasSlideData | null => {
    const block = canvasSlides[activeSlide];
    if (!block) return null;
    try {
      return (block.data as CanvasSlideData) ?? null;
    } catch {
      return null;
    }
  }, [canvasSlides, activeSlide]);

  /** Fill-in-the-blank data for the current lesson (if type === "quiz_fitb"). */
  const fitbData = useMemo((): FillInTheBlankData | null => {
    if (!lessonBlocks) return null;
    const block = lessonBlocks.find((b) => b.type === "quiz_fitb");
    if (!block) return null;
    try {
      return block.data as FillInTheBlankData;
    } catch {
      return null;
    }
  }, [lessonBlocks]);

  /** Drag-and-drop data for the current lesson (if type === "quiz_dragdrop"). */
  const dragDropData = useMemo((): DragDropData | null => {
    if (!lessonBlocks) return null;
    const block = lessonBlocks.find((b) => b.type === "quiz_dragdrop");
    if (!block) return null;
    try {
      return block.data as DragDropData;
    } catch {
      return null;
    }
  }, [lessonBlocks]);

  /** Legacy quiz questions for lessons with type === "quiz". */
  const quizQuestions = useMemo(() => {
    if (!currentLesson || currentLesson.type !== "quiz") return [];
    try {
      return JSON.parse(currentLesson.body ?? "[]") as Array<{
        q: string;
        options: string[];
        correct: number;
      }>;
    } catch {
      return [];
    }
  }, [currentLesson]);

  // ── Navigation handlers ───────────────────────────────────────────────────

  /**
   * Advances to the next lesson (or next slide within a canvas lesson).
   * Persists progress to the database when moving between lessons.
   */
  const handleNextLesson = useCallback(() => {
    if (!lessons) return;

    // If in a canvas lesson, advance slides first
    if (currentLesson?.type === "slides" && canvasSlides.length > 0) {
      if (activeSlide < canvasSlides.length - 1) {
        setActiveSlide(activeSlide + 1);
        return;
      }
      // All slides viewed — fall through to next lesson
    }

    // Legacy quiz type — open quiz modal
    if (currentLesson?.type === "quiz") {
      setShowQuiz(true);
      setAnswers(Array(quizQuestions.length).fill(null));
      return;
    }

    if (activeLesson < lessons.length - 1) {
      const next = activeLesson + 1;
      setActiveLesson(next);
      setActiveSlide(0);
      setInteractiveAnswered(false);
      if (enrollmentId) {
        const pct = Math.round((next / lessons.length) * 100);
        updateProgress.mutate({ enrollmentId, progressPct: pct });
      }
    }
  }, [
    lessons, currentLesson, canvasSlides, activeSlide, activeLesson,
    quizQuestions, enrollmentId, updateProgress,
  ]);

  /** Handles legacy quiz submission and progress update. */
  function submitQuiz() {
    const score = answers.filter((a, i) => a === quizQuestions[i]?.correct).length;
    const pct = Math.round((score / quizQuestions.length) * 100);
    setQuizScore(pct);
    setQuizComplete(true);
    if (pct >= 70 && enrollmentId) {
      updateProgress.mutate({ enrollmentId, progressPct: 100, status: "completed" });
    }
  }

  // ── Render guards ─────────────────────────────────────────────────────────

  if (!courseId) {
    return (
      <LMSLayout
        title="Course Player"
        breadcrumbs={[{ label: "My Training", href: "/lms/my-training" }, { label: "Course" }]}
        role={role}
        onRoleChange={setRole}
      >
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Video className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-400 font-semibold">No course selected</p>
          <Link href="/lms/my-training">
            <button className="mt-4 text-[#0047AB] text-sm font-bold hover:underline">← Back to My Training</button>
          </Link>
        </div>
      </LMSLayout>
    );
  }

  if (isLoading) {
    return (
      <LMSLayout
        title="Course Player"
        breadcrumbs={[{ label: "My Training", href: "/lms/my-training" }, { label: "Loading..." }]}
        role={role}
        onRoleChange={setRole}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0047AB]" />
        </div>
      </LMSLayout>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <LMSLayout
      title="Course Player"
      breadcrumbs={[
        { label: "My Training", href: "/lms/my-training" },
        { label: course?.title ?? "Course" },
      ]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full">

        {/* ── Main content area ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Media / Canvas player */}
          <div className="bg-[#0F1C2E] rounded-xl overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>

              {/* ── Canvas slides ── */}
              {currentLesson?.type === "slides" && currentCanvasSlide ? (
                <div className="absolute inset-0">
                  <CanvasSlideViewer data={currentCanvasSlide} />
                  {/* Slide counter */}
                  {canvasSlides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {canvasSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveSlide(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === activeSlide ? "bg-white scale-125" : "bg-white/40"
                          }`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : currentLesson?.type === "slides" && canvasSlides.length === 0 ? (
                /* Slides lesson with no blocks yet */
                <div className="absolute inset-0 flex items-center justify-center text-white/40">
                  <Layers className="w-16 h-16" />
                </div>

              ) : /* ── Fill-in-the-blank ── */
              (currentLesson?.type as string) === "quiz_fitb" && fitbData ? (
                <div className="absolute inset-0 overflow-y-auto p-6 flex items-center justify-center">
                  <FillInTheBlankViewer
                    data={fitbData}
                    onAnswer={(correct) => {
                      setInteractiveAnswered(true);
                      if (correct && enrollmentId) {
                        updateProgress.mutate({
                          enrollmentId,
                          progressPct: Math.round(((activeLesson + 1) / totalLessons) * 100),
                        });
                      }
                    }}
                  />
                </div>

              ) : /* ── Drag-and-drop ── */
              (currentLesson?.type as string) === "quiz_dragdrop" && dragDropData ? (
                <div className="absolute inset-0 overflow-y-auto p-6 flex items-center justify-center">
                  <DragDropViewer
                    data={dragDropData}
                    onAnswer={(correct) => {
                      setInteractiveAnswered(true);
                      if (correct && enrollmentId) {
                        updateProgress.mutate({
                          enrollmentId,
                          progressPct: Math.round(((activeLesson + 1) / totalLessons) * 100),
                        });
                      }
                    }}
                  />
                </div>

              ) : /* ── Video ── */
              (currentLesson?.type === "video_embed" || currentLesson?.type === "video_upload") && currentLesson.contentUrl ? (
                <VideoEmbed url={currentLesson.contentUrl} />

              ) : /* ── PDF ── */
              currentLesson?.type === "pdf" && currentLesson.contentUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 p-8">
                  <FileText className="w-16 h-16 text-[#1E90FF]" />
                  <p className="text-lg font-semibold">{currentLesson.title}</p>
                  <a
                    href={currentLesson.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide px-6 py-3 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open PDF
                  </a>
                </div>

              ) : /* ── Text ── */
              currentLesson?.type === "text" ? (
                <div className="absolute inset-0 overflow-y-auto text-white p-8 text-sm leading-relaxed">
                  <div
                    className="max-w-2xl mx-auto prose prose-invert"
                    dangerouslySetInnerHTML={{ __html: currentLesson.body ?? "No content available." }}
                  />
                </div>

              ) : /* ── Legacy quiz ── */
              currentLesson?.type === "quiz" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                  <p className="text-xl font-bold uppercase">Knowledge Check</p>
                  <p className="text-white/60 text-sm">{quizQuestions.length} questions</p>
                  <button
                    onClick={() => {
                      setShowQuiz(true);
                      setAnswers(Array(quizQuestions.length).fill(null));
                      setQuizComplete(false);
                    }}
                    className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Quiz
                  </button>
                </div>

              ) : (
                /* Empty / unknown type */
                <div className="absolute inset-0 flex items-center justify-center text-white/40">
                  <Video className="w-16 h-16" />
                </div>
              )}

              {/* Lesson / slide counter badge */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {currentLesson?.type === "slides" && canvasSlides.length > 0
                  ? `Slide ${activeSlide + 1} of ${canvasSlides.length}`
                  : `Lesson ${activeLesson + 1} of ${totalLessons}`}
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="px-4 py-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0047AB] rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lesson info + navigation */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-wide mb-1">
                  {course?.category?.replace("_", " ")}
                </div>
                <h2 className="font-display font-bold text-[#0F1C2E] text-2xl uppercase">
                  {currentLesson?.title ?? course?.title}
                </h2>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="font-display font-extrabold text-3xl text-[#0F1C2E]">{progress}%</div>
                <div className="text-xs text-gray-400">Complete</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (currentLesson?.type === "slides" && activeSlide > 0) {
                    setActiveSlide(activeSlide - 1);
                  } else {
                    setActiveLesson(Math.max(0, activeLesson - 1));
                    setActiveSlide(0);
                    setInteractiveAnswered(false);
                  }
                }}
                disabled={activeLesson === 0 && activeSlide === 0}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={handleNextLesson}
                className="flex items-center gap-1.5 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide px-5 py-2 rounded-lg transition-colors"
              >
                {activeLesson >= totalLessons - 1 &&
                  (currentLesson?.type !== "slides" || activeSlide >= canvasSlides.length - 1)
                  ? "Complete Course"
                  : currentLesson?.type === "slides" && activeSlide < canvasSlides.length - 1
                  ? "Next Slide"
                  : "Next Lesson"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Lesson Sidebar ────────────────────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Course Content</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0047AB] rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-500">{activeLesson}/{totalLessons}</span>
              </div>
            </div>

            {/* Chapter sections (if any) */}
            {chapters && chapters.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {chapters.map((chapter) => (
                  <div key={chapter.id}>
                    {/* Chapter header */}
                    <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {chapter.title}
                    </div>
                    {/* Lessons in this chapter */}
                    {lessons
                      ?.filter((l) => l.moduleId === chapter.id)
                      .map((lesson) => {
                        const i = lessons.indexOf(lesson);
                        return (
                          <LessonSidebarItem
                            key={lesson.id}
                            lesson={lesson}
                            index={i}
                            activeLesson={activeLesson}
                            onSelect={setActiveLesson}
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
            ) : (
              /* Flat lesson list (no chapters) */
              <div className="divide-y divide-gray-50">
                {lessons && lessons.length > 0 ? (
                  lessons.map((lesson, i) => (
                    <LessonSidebarItem
                      key={lesson.id}
                      lesson={lesson}
                      index={i}
                      activeLesson={activeLesson}
                      onSelect={setActiveLesson}
                    />
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">No lessons available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legacy Quiz Modal ──────────────────────────────────────────────── */}
      {showQuiz && quizQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            {!quizComplete ? (
              <>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-[#0F1C2E] text-2xl uppercase">Knowledge Check</h3>
                    <button onClick={() => setShowQuiz(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0047AB] rounded-full transition-all"
                        style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">{quizStep + 1}/{quizQuestions.length}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-800 font-semibold leading-relaxed">{quizQuestions[quizStep]?.q}</p>
                  <div className="space-y-2">
                    {quizQuestions[quizStep]?.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers(answers.map((a, ai) => ai === quizStep ? i : a))}
                        className={`w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                          answers[quizStep] === i
                            ? "border-[#0047AB] bg-[#0047AB]/5 text-[#1E90FF]"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-6 pt-0 flex justify-between">
                  <button
                    onClick={() => setQuizStep(Math.max(0, quizStep - 1))}
                    disabled={quizStep === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 font-semibold text-sm flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  {quizStep < quizQuestions.length - 1 ? (
                    <button
                      onClick={() => setQuizStep(quizStep + 1)}
                      disabled={answers[quizStep] === null}
                      className="bg-[#0047AB] disabled:opacity-40 hover:bg-[#1E90FF] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={submitQuiz}
                      disabled={answers[quizStep] === null}
                      className="bg-[#0047AB] disabled:opacity-40 hover:bg-[#1E90FF] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${quizScore >= 70 ? "bg-green-100" : "bg-amber-100"}`}>
                  <Award className={`w-8 h-8 ${quizScore >= 70 ? "text-green-500" : "text-amber-500"}`} />
                </div>
                <h3 className="font-display font-extrabold text-[#0F1C2E] text-3xl uppercase mb-2">
                  {quizScore >= 70 ? "Congratulations!" : "Keep Practicing"}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  You scored{" "}
                  <span className={`font-bold ${quizScore >= 70 ? "text-green-600" : "text-amber-600"}`}>
                    {quizScore}%
                  </span>.{" "}
                  {quizScore >= 70
                    ? "You passed! Your certificate is being generated."
                    : "A score of 70% is required to pass."}
                </p>
                <div className="flex gap-3 justify-center">
                  {quizScore < 70 && (
                    <button
                      onClick={() => {
                        setQuizComplete(false);
                        setQuizStep(0);
                        setAnswers(Array(quizQuestions.length).fill(null));
                      }}
                      className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors"
                    >
                      Retry Quiz
                    </button>
                  )}
                  <button
                    onClick={() => { setShowQuiz(false); setQuizComplete(false); }}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-5 py-3 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    {quizScore >= 70 ? "Done" : "Close"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </LMSLayout>
  );
}

// ─── Sidebar lesson item ──────────────────────────────────────────────────────

/**
 * A single lesson row in the course sidebar.
 * Shows completion state, lock state, lesson type icon, and title.
 */
function LessonSidebarItem({
  lesson,
  index,
  activeLesson,
  onSelect,
}: {
  lesson: { id: number; title: string; type: string };
  index: number;
  activeLesson: number;
  onSelect: (i: number) => void;
}) {
  const ct = lesson.type as keyof typeof typeIcon;
  const Icon = typeIcon[ct] ?? Video;
  const isActive = index === activeLesson;
  const isCompleted = index < activeLesson;
  const isLocked = index > activeLesson + 1;

  return (
    <button
      onClick={() => !isLocked && onSelect(index)}
      disabled={isLocked}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive
          ? "bg-[#0047AB]/5 border-l-2 border-[#0047AB]"
          : isLocked
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCompleted ? "bg-green-100" : isActive ? "bg-[#0047AB]/10" : "bg-gray-100"
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : isLocked ? (
          <Lock className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <Icon
            className={`w-3.5 h-3.5 ${
              isActive ? "text-[#1E90FF]" : (typeColor[ct] ?? "text-gray-400")
            }`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-xs font-semibold truncate ${
            isActive ? "text-[#1E90FF]" : isCompleted ? "text-gray-500" : "text-gray-700"
          }`}
        >
          {lesson.title}
        </div>
        <div className="text-[10px] text-gray-400 capitalize">
          {lesson.type.replace(/_/g, " ")}
        </div>
      </div>
    </button>
  );
}
