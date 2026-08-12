/* ============================================================
   COURSE PREVIEW — Multi-device preview of lesson content
   ============================================================ */
import { useState } from "react";
import { Monitor, Tablet, Smartphone, X, Shield, CheckCircle, AlertTriangle, Info, Lightbulb, FileText, Package, CheckSquare, PenLine, ThumbsUp, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DraftBlock, PreviewDevice, TextBlockData, VideoBlockData, ImageBlockData, PdfBlockData, ResourceBlockData, ChecklistBlockData, AcknowledgmentBlockData, PolicyAckBlockData, CalloutBlockData, WarningBlockData, SafetyTipBlockData, QuizQuestionBlockData, CanvasSlideData, CanvasElement, FillInTheBlankData, DragDropData } from "./types";
import { FillInTheBlankViewer, DragDropViewer } from "./InteractiveQuestions";

interface CoursePreviewProps {
  courseName: string;
  lessonTitle: string;
  blocks: DraftBlock[];
  onClose: () => void;
}

export function CoursePreview({ courseName, lessonTitle, blocks, onClose }: CoursePreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");

  const deviceFrames: { id: PreviewDevice; label: string; icon: React.ReactNode; width: string }[] = [
    { id: "desktop", label: "Desktop", icon: <Monitor size={16} />, width: "w-full max-w-4xl" },
    { id: "tablet", label: "Tablet", icon: <Tablet size={16} />, width: "w-[768px]" },
    { id: "mobile", label: "Mobile", icon: <Smartphone size={16} />, width: "w-[390px]" },
  ];

  return (
    <div className="fixed inset-0 bg-[#0F1C2E]/90 z-50 flex flex-col">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0F1C2E] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-[#1E90FF]" />
          <span className="text-white font-display font-bold text-sm">Preview Mode</span>
          <span className="text-white/40 text-sm font-body">—</span>
          <span className="text-white/70 text-sm font-body">{courseName} / {lessonTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {deviceFrames.map(d => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors",
                device === d.id ? "bg-[#1E90FF] text-white" : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              {d.icon}
              {d.label}
            </button>
          ))}
          <div className="w-px h-5 bg-white/20 mx-2" />
          <Button variant="outline" size="sm" onClick={onClose} className="text-white border-white/30 hover:bg-white/10 font-display font-bold text-xs">
            <X size={14} className="mr-1" />Exit Preview
          </Button>
        </div>
      </div>

      {/* Preview canvas */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-100">
        <div className={cn("transition-all duration-300", deviceFrames.find(d => d.id === device)?.width)}>
          {/* Browser chrome for desktop/tablet */}
          {device !== "mobile" && (
            <div className="bg-gray-200 rounded-t-xl px-4 py-2 flex items-center gap-2 border border-gray-300 border-b-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 font-body text-center">
                bastionrsg.com/lms/learn/...
              </div>
            </div>
          )}

          {/* Phone chrome for mobile */}
          {device === "mobile" && (
            <div className="bg-gray-800 rounded-t-3xl px-4 pt-4 pb-2 flex justify-center border border-gray-700 border-b-0">
              <div className="w-20 h-1.5 bg-gray-600 rounded-full" />
            </div>
          )}

          {/* Content area */}
          <div className={cn(
            "bg-white overflow-auto shadow-2xl",
            device === "mobile" ? "rounded-b-3xl border border-gray-700 border-t-0 max-h-[700px]" : "rounded-b-xl border border-gray-300 border-t-0 max-h-[700px]"
          )}>
            {/* LMS lesson header */}
            <div className="bg-[#0F1C2E] px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-[#1E90FF]" />
                <span className="text-blue-200 text-xs font-body">{courseName}</span>
              </div>
              <h1 className={cn("text-white font-display font-bold", device === "mobile" ? "text-lg" : "text-xl")}>
                {lessonTitle}
              </h1>
            </div>

            {/* Lesson content */}
            <div className={cn("space-y-4 py-6", device === "mobile" ? "px-4" : "px-8")}>
              {blocks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="font-body text-sm">No content blocks yet.</p>
                  <p className="font-body text-xs mt-1">Add blocks in the editor to see them here.</p>
                </div>
              ) : (
                blocks.map(block => (
                  <PreviewBlock key={block.id} block={block} device={device} />
                ))
              )}
            </div>

            {/* Navigation footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
              <button className="text-sm font-display font-bold text-gray-500 hover:text-gray-700">← Previous</button>
              <button className="px-6 py-2 bg-[#0047AB] hover:bg-[#1565C0] text-white text-sm font-display font-bold rounded-lg transition-colors">
                Next Lesson →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Individual block preview renderers ──────────────────────────────────────

function PreviewBlock({ block, device }: { block: DraftBlock; device: PreviewDevice }) {
  const data = block.data as Record<string, unknown>;

  switch (block.type) {
    case "text":
      return (
        <div
          className="prose prose-sm max-w-none font-body text-gray-800"
          dangerouslySetInnerHTML={{ __html: (data.html as string) || "" }}
        />
      );

    case "video": {
      const url = data.url as string;
      if (!url) return <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm font-body">No video URL set</div>;
      return (
        <div className="space-y-2">
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe src={getVideoEmbedUrl(url)} className="w-full h-full" allowFullScreen title="Video" />
          </div>
          {!!data.caption && <p className="text-xs text-gray-500 font-body text-center">{data.caption as string}</p>}
        </div>
      );
    }

    case "image": {
      const url = data.url as string;
      if (!url) return <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm font-body">No image URL set</div>;
      const widthClass = data.width === "half" ? "max-w-sm mx-auto" : data.width === "quarter" ? "max-w-xs mx-auto" : "w-full";
      return (
        <div className={widthClass}>
          <img src={url} alt={(data.alt as string) || ""} className="w-full rounded-xl" />
          {!!data.caption && <p className="text-xs text-gray-500 font-body text-center mt-1">{data.caption as string}</p>}
        </div>
      );
    }

    case "pdf":
      return (
        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <FileText size={20} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-gray-800 text-sm">{(data.title as string) || "PDF Document"}</p>
            <p className="text-xs text-gray-500 font-body">Click to view</p>
          </div>
          {!!data.downloadable && (
            <button className="text-xs font-display font-bold text-[#0047AB] hover:underline shrink-0">Download</button>
          )}
        </div>
      );

    case "resource":
      return (
        <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
            <Package size={20} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-gray-800 text-sm">{(data.title as string) || "Resource"}</p>
            {!!data.description && <p className="text-xs text-gray-500 font-body">{data.description as string}</p>}
          </div>
          <span className="text-xs font-display font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded shrink-0">
            {(data.fileType as string) || "File"}
          </span>
        </div>
      );

    case "checklist": {
      const items = (data.items as ChecklistBlockData["items"]) ?? [];
      return (
        <div className="border border-teal-200 rounded-xl overflow-hidden">
          <div className="bg-teal-600 px-4 py-3 flex items-center gap-2">
            <CheckSquare size={16} className="text-white" />
            <span className="text-white font-display font-bold text-sm">{(data.title as string) || "Safety Checklist"}</span>
          </div>
          <div className="p-4 space-y-2 bg-teal-50">
            {items.map((item, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded accent-teal-600" />
                <span className="text-sm font-body text-gray-700">{item.text || `Item ${i + 1}`}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case "acknowledgment":
      return (
        <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50 space-y-3">
          <p className="text-sm font-body text-indigo-800">{(data.statement as string) || "I acknowledge this content."}</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded accent-indigo-600" />
            <span className="text-sm font-display font-bold text-indigo-700">{(data.checkboxLabel as string) || "I acknowledge"}</span>
          </label>
        </div>
      );

    case "policy_ack":
      return (
        <div className="border border-violet-200 rounded-xl overflow-hidden">
          <div className="bg-violet-600 px-4 py-3 flex items-center gap-2">
            <FileCheck size={16} className="text-white" />
            <span className="text-white font-display font-bold text-sm">{(data.policyTitle as string) || "Policy"}</span>
          </div>
          <div className="p-4 bg-violet-50 space-y-3">
            <div className="max-h-32 overflow-y-auto bg-white border border-violet-200 rounded p-3">
              <p className="text-xs font-body text-gray-700 whitespace-pre-wrap">{(data.policyText as string) || "Policy text..."}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded accent-violet-600" />
              <span className="text-sm font-display font-bold text-violet-700">{(data.checkboxLabel as string) || "I agree"}</span>
            </label>
          </div>
        </div>
      );

    case "signature":
      return (
        <div className="border border-pink-200 rounded-xl p-4 bg-pink-50 space-y-3">
          <p className="text-sm font-body text-pink-800">{(data.prompt as string) || "Please sign below."}</p>
          <div className="space-y-1">
            <label className="text-xs font-display font-bold text-pink-700">{(data.label as string) || "Full Name"}</label>
            <input
              type="text"
              placeholder="Type your full name"
              className="w-full border border-pink-300 rounded-lg px-3 py-2 text-sm font-body bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </div>
      );

    case "callout": {
      const variant = (data.variant as string) || "info";
      const styles = {
        info: { bg: "bg-sky-50 border-sky-200", icon: <Info size={16} className="text-sky-600" />, title: "text-sky-800", body: "text-sky-700" },
        tip: { bg: "bg-green-50 border-green-200", icon: <CheckCircle size={16} className="text-green-600" />, title: "text-green-800", body: "text-green-700" },
        note: { bg: "bg-gray-50 border-gray-200", icon: <Info size={16} className="text-gray-500" />, title: "text-gray-800", body: "text-gray-600" },
      }[variant] ?? { bg: "bg-sky-50 border-sky-200", icon: <Info size={16} className="text-sky-600" />, title: "text-sky-800", body: "text-sky-700" };
      return (
        <div className={cn("border rounded-xl p-4 flex gap-3", styles.bg)}>
          <div className="shrink-0 mt-0.5">{styles.icon}</div>
          <div>
            {!!data.title && <p className={cn("font-display font-bold text-sm mb-1", styles.title)}>{data.title as string}</p>}
            <p className={cn("text-sm font-body", styles.body)}>{(data.body as string) || ""}</p>
          </div>
        </div>
      );
    }

    case "warning": {
      const variant = (data.variant as string) || "warning";
      const styles = {
        warning: { bg: "bg-yellow-50 border-yellow-300", icon: <AlertTriangle size={16} className="text-yellow-600" />, title: "text-yellow-800", body: "text-yellow-700" },
        caution: { bg: "bg-orange-50 border-orange-300", icon: <AlertTriangle size={16} className="text-orange-600" />, title: "text-orange-800", body: "text-orange-700" },
        danger: { bg: "bg-red-50 border-red-400", icon: <AlertTriangle size={16} className="text-red-600" />, title: "text-red-800", body: "text-red-700" },
      }[variant] ?? { bg: "bg-yellow-50 border-yellow-300", icon: <AlertTriangle size={16} className="text-yellow-600" />, title: "text-yellow-800", body: "text-yellow-700" };
      return (
        <div className={cn("border-2 rounded-xl p-4", styles.bg)}>
          <div className="flex items-center gap-2 mb-2">
            {styles.icon}
            <span className={cn("font-display font-bold text-sm uppercase tracking-wide", styles.title)}>
              {(data.title as string) || variant.toUpperCase()}
            </span>
            {!!data.oshaRef && (
              <span className="ml-auto text-xs font-body text-gray-500">{data.oshaRef as string}</span>
            )}
          </div>
          <p className={cn("text-sm font-body", styles.body)}>{(data.body as string) || ""}</p>
        </div>
      );
    }

    case "safety_tip":
      return (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm font-body text-amber-800">{(data.tip as string) || ""}</p>
        </div>
      );

    case "quiz_question": {
      const q = (data.question as import("./types").QuizQuestion);
      if (!q) return null;
      return (
        <div className="border-2 border-[#0047AB] rounded-xl overflow-hidden">
          <div className="bg-[#0047AB] px-4 py-3">
            <span className="text-white font-display font-bold text-xs uppercase tracking-widest">Knowledge Check</span>
          </div>
          <div className="p-4 space-y-3 bg-blue-50">
            <p className="font-display font-bold text-gray-800 text-sm">{q.question}</p>
            <div className="space-y-2">
              {q.type === "true_false" ? (
                ["True", "False"].map((opt, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 bg-white border border-blue-200 rounded-lg cursor-pointer hover:border-[#0047AB] transition-colors">
                    <input type="radio" name={`q-${q.id}`} className="accent-[#0047AB]" />
                    <span className="text-sm font-body text-gray-700">{opt}</span>
                  </label>
                ))
              ) : (
                (q.options ?? []).map((opt, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 bg-white border border-blue-200 rounded-lg cursor-pointer hover:border-[#0047AB] transition-colors">
                    <input
                      type={q.type === "select_all" ? "checkbox" : "radio"}
                      name={`q-${q.id}`}
                      className="accent-[#0047AB]"
                    />
                    <span className="text-sm font-body text-gray-700">{opt || `Option ${String.fromCharCode(65 + i)}`}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    case "canvas_slide": {
      const slideData = block.data as CanvasSlideData;
      if (!slideData) return null;
      const bg = slideData.background;
      const bgStyle: React.CSSProperties = {
        backgroundColor: bg?.color ?? "#0F1C2E",
        backgroundImage: bg?.imageUrl ? `url(${bg.imageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        paddingTop: "56.25%", // 16:9 aspect ratio
        overflow: "hidden",
      };
      return (
        <div className="w-full rounded-xl overflow-hidden shadow-lg" style={bgStyle}>
          {/* Overlay */}
          {bg?.imageUrl && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: bg.overlayColor ?? "#000", opacity: bg.overlayOpacity ?? 0 }}
            />
          )}
          {/* Canvas elements */}
          {(slideData.elements ?? []).map((el: CanvasElement) => {
            const elStyle: React.CSSProperties = {
              position: "absolute",
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              zIndex: el.zIndex ?? 10,
            };
            if (el.type === "text") {
              return (
                <div key={el.id} style={{
                  ...elStyle,
                  fontFamily: el.fontFamily,
                  fontSize: `${el.fontSize * 0.4}px`, // scale down for preview
                  fontWeight: el.fontWeight,
                  fontStyle: el.italic ? "italic" : "normal",
                  textDecoration: el.underline ? "underline" : "none",
                  color: el.color,
                  textAlign: el.align as React.CSSProperties["textAlign"],
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                  padding: `${el.padding ?? 0}px`,
                }}>
                  {el.content}
                </div>
              );
            }
            if (el.type === "image") {
              return el.url ? (
                <img key={el.id} src={el.url} alt={el.alt ?? ""} style={{
                  ...elStyle,
                  objectFit: el.objectFit ?? "cover",
                  borderRadius: `${el.borderRadius ?? 0}px`,
                  opacity: el.opacity ?? 1,
                }} />
              ) : (
                <div key={el.id} style={{ ...elStyle, background: "rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Image</span>
                </div>
              );
            }
            if (el.type === "video") {
              return (
                <div key={el.id} style={{ ...elStyle, background: "#000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>▶ Video</span>
                </div>
              );
            }
            if (el.type === "shape") {
              return (
                <div key={el.id} style={{
                  ...elStyle,
                  backgroundColor: el.fill ?? "transparent",
                  border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke}` : undefined,
                  borderRadius: `${el.borderRadius ?? 0}px`,
                  opacity: el.opacity ?? 1,
                }} />
              );
            }
            return null;
          })}
        </div>
      );
    }

    case "quiz_fitb":
      return (
        <FillInTheBlankViewer
          data={block.data as FillInTheBlankData}
        />
      );

    case "quiz_dragdrop":
      return (
        <DragDropViewer
          data={block.data as DragDropData}
        />
      );

    default:
      return null;
  }
}

function getVideoEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* ignore */ }
  return url;
}
