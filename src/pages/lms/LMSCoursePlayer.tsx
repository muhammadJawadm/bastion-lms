/**
 * @file LMSCoursePlayer.tsx
 * @description Learner-facing course player for the Bastion LMS, wired to
 * the real backend. A course is a list of lessons, each lesson a list of
 * blocks ("pages") — the player flattens every lesson's blocks into one
 * ordered sequence and plays through it page by page, persisting progress
 * via `PATCH /enrollments/:id` as the learner advances. Hitting the last
 * page sets progressPct to 100, which the backend auto-completes and
 * (if the course issuesCertificate) auto-issues a Certificate for.
 *
 * Renders the block types the Course Builder actually produces: video, pdf,
 * text, canvas_slide, quiz_fitb, quiz_dragdrop, quiz_question. Any other
 * block type (image, resource, checklist, acknowledgment, policy_ack,
 * signature, callout, warning, safety_tip, the slide_* structured types)
 * shows a plain "not supported in playback yet" placeholder rather than
 * breaking — porting the Course Builder's full rich-block renderer into
 * read-only playback is a separate, larger task.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useParams } from "wouter";
import {
  Play, ChevronLeft, ChevronRight,
  CheckCircle2, Lock, FileText, Type, Video, Award, Loader2,
  ExternalLink, Layers, BookOpen, AlertCircle,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { FillInTheBlankViewer, DragDropViewer } from "./builder/InteractiveQuestions";
import {
  getCourseById, getEnrollments, updateEnrollment,
  ApiError, type Course, type LessonBlock, type EnrollmentRecord,
} from "@/lib/api";
import { toast } from "sonner";
import type {
  CanvasSlideData, CanvasElement, CanvasTextElement,
  CanvasImageElement, CanvasVideoElement,
  FillInTheBlankData, DragDropData, VideoBlockData, PdfBlockData, TextBlockData,
  QuizQuestionBlockData, QuizQuestion,
} from "./builder/types";

// ─── Icon / colour maps ───────────────────────────────────────────────────────

/** Maps block type to a Lucide icon component for the sidebar. Falls back to a generic icon for types not explicitly listed. */
const typeIcon: Record<string, React.ElementType> = {
  video: Video,
  pdf: FileText,
  text: Type,
  canvas_slide: Layers,
  quiz_fitb: BookOpen,
  quiz_dragdrop: BookOpen,
  quiz_question: CheckCircle2,
};

/** Maps block type to a Tailwind text-colour class. */
const typeColor: Record<string, string> = {
  video: "text-[#1E90FF]",
  pdf: "text-[#00A3FF]",
  text: "text-purple-500",
  canvas_slide: "text-amber-500",
  quiz_fitb: "text-teal-500",
  quiz_dragdrop: "text-teal-500",
  quiz_question: "text-green-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Renders a YouTube, Vimeo, or direct video URL as an embedded player. */
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

/** Renders a single canvas element (text, image, or video) positioned on the slide. */
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

/** Renders a canvas slide in read-only (learner) mode. */
function CanvasSlideViewer({ data }: { data: CanvasSlideData }) {
  return (
    <div className="w-full" style={{ aspectRatio: "16/9", position: "relative" }}>
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          backgroundColor: data.background?.color ?? "#0F1C2E",
          backgroundImage: data.background?.imageUrl ? `url(${data.background.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {data.background?.imageUrl && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${data.background.overlayOpacity ?? 0.4})` }}
          />
        )}
      </div>
      {data.elements?.map((el) => (
        <CanvasElementRenderer key={el.id} el={el} />
      ))}
    </div>
  );
}

/** A single quiz_question block, played inline as one page (not a separate modal gate — each question is just another page now). */
function QuizQuestionViewer({ question, onAnswered }: { question: QuizQuestion; onAnswered: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const isMulti = question.correctIndices.length > 1;

  const toggle = (i: number) => {
    if (submitted) return;
    if (isMulti) {
      setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
    } else {
      setSelected([i]);
    }
  };

  const handleSubmit = () => {
    const correct = selected.length === question.correctIndices.length && selected.every((i) => question.correctIndices.includes(i));
    setSubmitted(true);
    onAnswered(correct);
  };

  const isCorrect = selected.length === question.correctIndices.length && selected.every((i) => question.correctIndices.includes(i));

  return (
    <div className="w-full max-w-lg mx-auto text-left">
      {question.imageUrl && <img src={question.imageUrl} alt="" className="w-full rounded-lg mb-4" />}
      <p className="text-white font-semibold text-lg mb-4">{question.question}</p>
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = selected.includes(i);
          const isRightAnswer = question.correctIndices.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={submitted}
              className={`w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                submitted
                  ? isRightAnswer ? "border-green-400 bg-green-400/10 text-green-300"
                  : isSelected ? "border-red-400 bg-red-400/10 text-red-300"
                  : "border-white/10 text-white/50"
                  : isSelected ? "border-[#1E90FF] bg-[#1E90FF]/10 text-white" : "border-white/15 hover:border-white/30 text-white/80"
              }`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          );
        })}
      </div>
      {submitted ? (
        <div className="mt-4 space-y-2">
          <p className={`text-sm font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
            {isCorrect ? "Correct!" : "Not quite."}
          </p>
          {question.explanation && <p className="text-white/60 text-xs leading-relaxed">{question.explanation}</p>}
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="mt-4 bg-[#0047AB] hover:bg-[#1E90FF] disabled:opacity-40 text-white font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}

/** Generic page content renderer, dispatched on block.type. */
function BlockViewer({ block, onAnswered }: { block: LessonBlock; onAnswered: (correct: boolean) => void }) {
  switch (block.type) {
    case "video": {
      const d = block.data as VideoBlockData;
      return d?.url ? <VideoEmbed url={d.url} /> : null;
    }
    case "pdf": {
      const d = block.data as PdfBlockData;
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 p-8">
          <FileText className="w-16 h-16 text-[#1E90FF]" />
          <p className="text-lg font-semibold">{d?.title ?? block.title ?? "Document"}</p>
          {d?.url && (
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide px-6 py-3 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open PDF
            </a>
          )}
        </div>
      );
    }
    case "text": {
      const d = block.data as TextBlockData;
      return (
        <div className="absolute inset-0 overflow-y-auto text-white p-8 text-sm leading-relaxed">
          <div className="max-w-2xl mx-auto prose prose-invert" dangerouslySetInnerHTML={{ __html: d?.html ?? "No content available." }} />
        </div>
      );
    }
    case "canvas_slide":
      return (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <CanvasSlideViewer data={block.data as CanvasSlideData} />
        </div>
      );
    case "quiz_fitb": {
      const d = block.data as FillInTheBlankData;
      return (
        <div className="absolute inset-0 overflow-y-auto p-6 flex items-center justify-center">
          <FillInTheBlankViewer data={d} onAnswer={onAnswered} />
        </div>
      );
    }
    case "quiz_dragdrop": {
      const d = block.data as DragDropData;
      return (
        <div className="absolute inset-0 overflow-y-auto p-6 flex items-center justify-center">
          <DragDropViewer data={d} onAnswer={onAnswered} />
        </div>
      );
    }
    case "quiz_question": {
      const d = block.data as QuizQuestionBlockData;
      return d?.question ? (
        <div className="absolute inset-0 overflow-y-auto p-6 flex items-center justify-center">
          <QuizQuestionViewer question={d.question} onAnswered={onAnswered} />
        </div>
      ) : null;
    }
    default:
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-3 p-8 text-center">
          <AlertCircle className="w-12 h-12" />
          <p className="text-sm">This content type ("{block.type}") isn't supported in playback yet.</p>
        </div>
      );
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * LMSCoursePlayer — full learner-facing course playback experience.
 * Route: /lms/courses/:id
 */
export default function LMSCoursePlayer() {
  const { role, setRole, user } = useLMS();
  const params = useParams<{ id?: string }>();
  const courseId = params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [courseComplete, setCourseComplete] = useState(false);

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getCourseById(courseId);
      setCourse(res.data);
      if (user?.id) {
        const enrollRes = await getEnrollments({ userId: user.id, courseId });
        setEnrollment(enrollRes.data[0] ?? null);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load this course.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, user?.id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const lessons = course?.lessons ?? [];

  /** Every lesson's blocks, flattened into one ordered, navigable sequence of pages. */
  const pages = useMemo(() => {
    return lessons.flatMap((l) =>
      [...(l.blocks ?? [])]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((block) => ({ lessonId: l._id, lessonTitle: l.title, block }))
    );
  }, [lessons]);

  const currentPage = pages[activePageIdx];
  const totalPages = pages.length;
  const progress = totalPages > 0 ? Math.round((activePageIdx / totalPages) * 100) : 0;

  const persistProgress = useCallback(async (pageIdx: number, complete = false) => {
    if (!enrollment) return;
    const pct = complete ? 100 : totalPages > 0 ? Math.round((pageIdx / totalPages) * 100) : 0;
    try {
      const res = await updateEnrollment(enrollment._id, { progressPct: pct });
      setEnrollment(res.data);
    } catch {
      // Non-fatal — the learner can keep going even if a progress save fails.
    }
  }, [enrollment, totalPages]);

  const handleNext = useCallback(() => {
    if (activePageIdx < totalPages - 1) {
      const next = activePageIdx + 1;
      setActivePageIdx(next);
      persistProgress(next);
    } else {
      persistProgress(activePageIdx, true);
      setCourseComplete(true);
      toast.success(course?.issuesCertificate ? "Course completed — your certificate is being issued." : "Course completed!");
    }
  }, [activePageIdx, totalPages, persistProgress, course?.issuesCertificate]);

  const handlePrev = useCallback(() => {
    setActivePageIdx((i) => Math.max(0, i - 1));
  }, []);

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

  if (!course) {
    return (
      <LMSLayout
        title="Course Player"
        breadcrumbs={[{ label: "My Training", href: "/lms/my-training" }, { label: "Not Found" }]}
        role={role}
        onRoleChange={setRole}
      >
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-400 font-semibold">Course not found</p>
          <Link href="/lms/my-training">
            <button className="mt-4 text-[#0047AB] text-sm font-bold hover:underline">← Back to My Training</button>
          </Link>
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
        { label: course.title },
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
              {courseComplete ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                  <Award className="w-16 h-16 text-green-400" />
                  <p className="text-xl font-bold uppercase">Course Complete!</p>
                  {course.issuesCertificate && <p className="text-white/60 text-sm">Your certificate will appear in My Training shortly.</p>}
                  <Link href="/lms/my-training">
                    <button className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide px-6 py-3 rounded-lg transition-colors">
                      Back to My Training
                    </button>
                  </Link>
                </div>
              ) : currentPage ? (
                <BlockViewer
                  block={currentPage.block}
                  onAnswered={() => persistProgress(activePageIdx)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-3">
                  <BookOpen className="w-16 h-16" />
                  <p className="text-sm">This course has no content yet.</p>
                </div>
              )}

              {!courseComplete && totalPages > 0 && (
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Page {activePageIdx + 1} of {totalPages}
                </div>
              )}
            </div>

            {/* Overall progress bar */}
            <div className="px-4 py-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#0047AB] rounded-full transition-all" style={{ width: `${courseComplete ? 100 : progress}%` }} />
              </div>
            </div>
          </div>

          {/* Lesson info + navigation */}
          {!courseComplete && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[#1E90FF] text-xs font-bold uppercase tracking-wide mb-1">
                    {course.category?.replace("_", " ")}
                  </div>
                  <h2 className="font-display font-bold text-[#0F1C2E] text-2xl uppercase">
                    {currentPage?.lessonTitle ?? course.title}
                  </h2>
                </div>
                <div className="flex-shrink-0 text-center">
                  <div className="font-display font-extrabold text-3xl text-[#0F1C2E]">{progress}%</div>
                  <div className="text-xs text-gray-400">Complete</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handlePrev}
                  disabled={activePageIdx === 0}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide px-5 py-2 rounded-lg transition-colors"
                >
                  {activePageIdx >= totalPages - 1 ? "Complete Course" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Lesson Sidebar ────────────────────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Course Content</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0047AB] rounded-full" style={{ width: `${courseComplete ? 100 : progress}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-500">{activePageIdx}/{totalPages}</span>
              </div>
            </div>

            {lessons.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {lessons.map((lesson) => {
                  const lessonPages = pages.filter((p) => p.lessonId === lesson._id);
                  if (lessonPages.length === 0) return null;
                  return (
                    <div key={lesson._id}>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {lesson.title}
                      </div>
                      {lessonPages.map((p) => {
                        const pageIdx = pages.indexOf(p);
                        const Icon = typeIcon[p.block.type] ?? Video;
                        const isActive = pageIdx === activePageIdx && !courseComplete;
                        const isCompleted = pageIdx < activePageIdx || courseComplete;
                        const isLocked = pageIdx > activePageIdx + 1;
                        return (
                          <button
                            key={p.block._id}
                            onClick={() => !isLocked && setActivePageIdx(pageIdx)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                              isActive ? "bg-[#0047AB]/5 border-l-2 border-[#0047AB]" : isLocked ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? "bg-green-100" : isActive ? "bg-[#0047AB]/10" : "bg-gray-100"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : isLocked ? (
                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                              ) : (
                                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#1E90FF]" : (typeColor[p.block.type] ?? "text-gray-400")}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-semibold truncate ${isActive ? "text-[#1E90FF]" : isCompleted ? "text-gray-500" : "text-gray-700"}`}>
                                {p.block.title || `Page ${pageIdx + 1}`}
                              </div>
                              <div className="text-[10px] text-gray-400 capitalize">{p.block.type.replace(/_/g, " ")}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">No lessons available</div>
            )}
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
