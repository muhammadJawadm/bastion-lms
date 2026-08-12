/**
 * @file builder/SlideCanvas.tsx
 * @description Free-form canvas slide editor for the Bastion LMS Course Builder.
 *
 * Architecture:
 *  - The canvas is a fixed 16:9 aspect-ratio container.
 *  - All element positions and sizes are stored as percentages (0–100) of the canvas
 *    dimensions so the layout scales correctly across screen sizes.
 *  - Elements are rendered as absolutely-positioned divs inside the canvas.
 *  - Clicking an element selects it; the selected element shows resize handles.
 *  - Dragging the element body moves it; dragging a resize handle resizes it.
 *  - The parent component receives updates via `onChange` whenever an element changes.
 *
 * @module SlideCanvas
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import type {
  CanvasElement,
  CanvasSlideData,
  CanvasTextElement,
  CanvasImageElement,
  CanvasVideoElement,
  CanvasShapeElement,
} from "./types";
import { v4 as uuidv4 } from "uuid";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Reference canvas width in pixels (used for font-size scaling). */
const CANVAS_REF_WIDTH = 960;

/** Minimum element width as a percentage of canvas width. */
const MIN_W_PCT = 5;

/** Minimum element height as a percentage of canvas height. */
const MIN_H_PCT = 3;

/** Snap grid size in percentage points (0 = no snapping). */
const SNAP_GRID = 0.5;

// ─── Helper: snap to grid ─────────────────────────────────────────────────────

/**
 * Snaps a value to the nearest grid increment.
 * @param value - The raw value to snap.
 * @param grid  - The grid increment (e.g. 0.5 for half-percent snapping).
 * @returns The snapped value.
 */
function snapToGrid(value: number, grid: number): number {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}

// ─── Helper: clamp ────────────────────────────────────────────────────────────

/**
 * Clamps a value between a minimum and maximum.
 * @param value - The value to clamp.
 * @param min   - Minimum allowed value.
 * @param max   - Maximum allowed value.
 * @returns The clamped value.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Helper: YouTube URL → embed URL ─────────────────────────────────────────

/**
 * Converts a YouTube watch URL to an embed URL.
 * If the URL is already an embed URL or is not a YouTube URL, it is returned unchanged.
 *
 * @param url - The YouTube URL to convert.
 * @returns The YouTube embed URL.
 *
 * @example
 * toYouTubeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
 * // → "https://www.youtube.com/embed/dQw4w9WgXcQ"
 */
function toYouTubeEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.pathname === "/watch") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    // Not a valid URL — return as-is
  }
  return url;
}

// ─── Element Renderers ────────────────────────────────────────────────────────

/**
 * Props shared by all element renderer components.
 */
interface ElementRendererProps {
  /** The element to render. */
  element: CanvasElement;
  /** Current canvas width in pixels (used for font-size scaling). */
  canvasWidth: number;
  /** Whether this element is currently selected in the editor. */
  isSelected: boolean;
  /** Whether the canvas is in read-only (learner) mode. */
  readOnly: boolean;
}

/**
 * Renders a text element on the canvas.
 * Font size is scaled proportionally to the current canvas width.
 */
function TextElementRenderer({ element, canvasWidth, isSelected }: ElementRendererProps) {
  const el = element as CanvasTextElement;

  /** Scale factor: ratio of actual canvas width to reference width. */
  const scale: number = canvasWidth / CANVAS_REF_WIDTH;

  /** Scaled font size in pixels. */
  const scaledFontSize: number = el.fontSize * scale;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: el.fontFamily,
        fontSize: `${scaledFontSize}px`,
        fontWeight: el.fontWeight,
        fontStyle: el.italic ? "italic" : "normal",
        textDecoration: el.underline ? "underline" : "none",
        color: el.color,
        textAlign: el.align,
        backgroundColor: el.backgroundColor === "transparent" ? undefined : el.backgroundColor,
        borderRadius: `${el.borderRadius}px`,
        padding: `${el.padding}px`,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "hidden",
        cursor: isSelected ? "text" : "default",
        userSelect: "none",
        lineHeight: 1.3,
      }}
    >
      {el.content || (isSelected ? <span style={{ opacity: 0.4 }}>Type something…</span> : null)}
    </div>
  );
}

/**
 * Renders an image element on the canvas.
 */
function ImageElementRenderer({ element }: ElementRendererProps) {
  const el = element as CanvasImageElement;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: `${el.borderRadius}px`,
        overflow: "hidden",
        opacity: el.opacity,
      }}
    >
      {el.url ? (
        <img
          src={el.url}
          alt={el.alt}
          style={{ width: "100%", height: "100%", objectFit: el.objectFit, display: "block" }}
          draggable={false}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.1)",
            border: "2px dashed rgba(255,255,255,0.3)",
            borderRadius: `${el.borderRadius}px`,
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
          }}
        >
          Click to add image
        </div>
      )}
    </div>
  );
}

/**
 * Renders a video element on the canvas.
 * YouTube and Vimeo URLs are rendered as iframes; uploaded files as HTML5 video.
 */
function VideoElementRenderer({ element, readOnly }: ElementRendererProps) {
  const el = element as CanvasVideoElement;

  if (!el.url) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.4)",
          border: "2px dashed rgba(255,255,255,0.3)",
          color: "rgba(255,255,255,0.5)",
          fontSize: "14px",
          borderRadius: "8px",
        }}
      >
        Click to add video
      </div>
    );
  }

  if (el.provider === "upload") {
    return (
      <video
        src={el.url}
        controls
        autoPlay={readOnly && el.autoplay}
        style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
      />
    );
  }

  /** Convert YouTube watch URL to embed URL. */
  const embedUrl: string =
    el.provider === "youtube"
      ? toYouTubeEmbed(el.url)
      : el.url;

  return (
    <iframe
      src={embedUrl}
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Embedded video"
    />
  );
}

/**
 * Renders a shape element on the canvas.
 */
function ShapeElementRenderer({ element }: ElementRendererProps) {
  const el = element as CanvasShapeElement;

  if (el.shape === "circle") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: el.fill,
          border: el.stroke !== "transparent" ? `${el.strokeWidth}px solid ${el.stroke}` : undefined,
          opacity: el.opacity,
        }}
      />
    );
  }

  if (el.shape === "line") {
    return (
      <div
        style={{
          width: "100%",
          height: `${el.strokeWidth}px`,
          background: el.stroke !== "transparent" ? el.stroke : el.fill,
          opacity: el.opacity,
          marginTop: "auto",
          marginBottom: "auto",
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: el.fill,
        border: el.stroke !== "transparent" ? `${el.strokeWidth}px solid ${el.stroke}` : undefined,
        borderRadius: `${el.borderRadius}px`,
        opacity: el.opacity,
      }}
    />
  );
}

/**
 * Dispatches to the correct element renderer based on `element.type`.
 */
function ElementRenderer(props: ElementRendererProps) {
  switch (props.element.type) {
    case "text":  return <TextElementRenderer {...props} />;
    case "image": return <ImageElementRenderer {...props} />;
    case "video": return <VideoElementRenderer {...props} />;
    case "shape": return <ShapeElementRenderer {...props} />;
    default:      return null;
  }
}

// ─── Resize Handle ────────────────────────────────────────────────────────────

/**
 * The eight possible resize handle positions.
 * Each handle allows resizing in a specific direction.
 */
type ResizeHandle =
  | "nw" | "n" | "ne"
  | "w"             | "e"
  | "sw" | "s" | "se";

/**
 * Props for the ResizeHandles component.
 */
interface ResizeHandlesProps {
  /** Callback fired when the user starts dragging a resize handle. */
  onResizeStart: (handle: ResizeHandle, e: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * Renders the eight resize handles around a selected element.
 */
function ResizeHandles({ onResizeStart }: ResizeHandlesProps) {
  /** Mapping from handle position to CSS positioning styles. */
  const handles: { pos: ResizeHandle; style: React.CSSProperties }[] = [
    { pos: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { pos: "n",  style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
    { pos: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { pos: "w",  style: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "w-resize" } },
    { pos: "e",  style: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "e-resize" } },
    { pos: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { pos: "s",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
    { pos: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  ];

  return (
    <>
      {handles.map(({ pos, style }) => (
        <div
          key={pos}
          onPointerDown={(e) => { e.stopPropagation(); onResizeStart(pos, e); }}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            background: "#fff",
            border: "2px solid #1E90FF",
            borderRadius: 2,
            zIndex: 9999,
            ...style,
          }}
        />
      ))}
    </>
  );
}

// ─── CanvasElement wrapper ────────────────────────────────────────────────────

/**
 * Props for the CanvasElementWrapper component.
 */
interface CanvasElementWrapperProps {
  /** The element to render. */
  element: CanvasElement;
  /** Whether this element is currently selected. */
  isSelected: boolean;
  /** Current canvas width in pixels. */
  canvasWidth: number;
  /** Current canvas height in pixels. */
  canvasHeight: number;
  /** Whether the canvas is in read-only mode. */
  readOnly: boolean;
  /** Callback fired when the element is clicked (to select it). */
  onSelect: (id: string) => void;
  /** Callback fired when the element's position or size changes. */
  onChange: (updated: CanvasElement) => void;
}

/**
 * Wraps a canvas element with drag-to-move and resize-handle behaviour.
 * Position and size are stored as percentages and converted to pixels for rendering.
 */
function CanvasElementWrapper({
  element,
  isSelected,
  canvasWidth,
  canvasHeight,
  readOnly,
  onSelect,
  onChange,
}: CanvasElementWrapperProps) {
  /** Ref to the wrapper div (used to calculate pointer offsets). */
  const wrapperRef = useRef<HTMLDivElement>(null);

  /** Whether the user is currently dragging the element body. */
  const isDragging = useRef<boolean>(false);

  /** Whether the user is currently resizing via a handle. */
  const isResizing = useRef<boolean>(false);

  /** The active resize handle direction. */
  const resizeHandle = useRef<ResizeHandle | null>(null);

  /** Pointer position at the start of the drag/resize operation (in pixels). */
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  /** Element state at the start of the drag/resize operation (in percentages). */
  const startState = useRef<{ x: number; y: number; w: number; h: number }>({
    x: 0, y: 0, w: 0, h: 0,
  });

  /** Convert percentage to pixels. */
  const pctToPixels = useCallback(
    (pct: number, axis: "x" | "y"): number =>
      (pct / 100) * (axis === "x" ? canvasWidth : canvasHeight),
    [canvasWidth, canvasHeight]
  );

  /** Convert pixels to percentage. */
  const pixelsToPct = useCallback(
    (px: number, axis: "x" | "y"): number =>
      (px / (axis === "x" ? canvasWidth : canvasHeight)) * 100,
    [canvasWidth, canvasHeight]
  );

  /** Handle pointer-down on the element body (start drag). */
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (readOnly || element.locked) return;
      e.stopPropagation();
      onSelect(element.id);

      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      startState.current = { x: element.x, y: element.y, w: element.w, h: element.h };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [readOnly, element, onSelect]
  );

  /** Handle pointer-move (drag or resize in progress). */
  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging.current && !isResizing.current) return;

      /** Delta in pixels since drag/resize started. */
      const dx: number = e.clientX - dragStart.current.x;
      const dy: number = e.clientY - dragStart.current.y;

      /** Delta converted to percentage. */
      const dxPct: number = pixelsToPct(dx, "x");
      const dyPct: number = pixelsToPct(dy, "y");

      if (isDragging.current) {
        /** New position clamped to canvas bounds. */
        const newX: number = clamp(
          snapToGrid(startState.current.x + dxPct, SNAP_GRID),
          0,
          100 - element.w
        );
        const newY: number = clamp(
          snapToGrid(startState.current.y + dyPct, SNAP_GRID),
          0,
          100 - element.h
        );
        onChange({ ...element, x: newX, y: newY });
      } else if (isResizing.current && resizeHandle.current) {
        const h = resizeHandle.current;
        let { x, y, w, h: ht } = startState.current;

        // Apply delta based on which handle is being dragged
        if (h.includes("e")) w = Math.max(MIN_W_PCT, snapToGrid(w + dxPct, SNAP_GRID));
        if (h.includes("s")) ht = Math.max(MIN_H_PCT, snapToGrid(ht + dyPct, SNAP_GRID));
        if (h.includes("w")) {
          const newW = Math.max(MIN_W_PCT, snapToGrid(w - dxPct, SNAP_GRID));
          x = snapToGrid(x + (w - newW), SNAP_GRID);
          w = newW;
        }
        if (h.includes("n")) {
          const newH = Math.max(MIN_H_PCT, snapToGrid(ht - dyPct, SNAP_GRID));
          y = snapToGrid(y + (ht - newH), SNAP_GRID);
          ht = newH;
        }

        onChange({
          ...element,
          x: clamp(x, 0, 100),
          y: clamp(y, 0, 100),
          w: clamp(w, MIN_W_PCT, 100),
          h: clamp(ht, MIN_H_PCT, 100),
        });
      }
    },
    [element, onChange, pixelsToPct]
  );

  /** Handle pointer-up (end drag or resize). */
  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
    resizeHandle.current = null;
  }, []);

  /** Handle resize handle pointer-down (start resize). */
  const handleResizeStart = useCallback(
    (handle: ResizeHandle, e: ReactPointerEvent<HTMLDivElement>) => {
      if (readOnly || element.locked) return;
      e.stopPropagation();

      isResizing.current = true;
      resizeHandle.current = handle;
      dragStart.current = { x: e.clientX, y: e.clientY };
      startState.current = { x: element.x, y: element.y, w: element.w, h: element.h };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [readOnly, element]
  );

  /** Computed pixel position and size for the wrapper div. */
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.w}%`,
    height: `${element.h}%`,
    zIndex: element.zIndex,
    cursor: readOnly || element.locked ? "default" : "move",
    outline: isSelected ? "2px solid #1E90FF" : "none",
    outlineOffset: "1px",
    userSelect: "none",
    touchAction: "none",
  };

  return (
    <div
      ref={wrapperRef}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
    >
      {/* Render the element content */}
      <ElementRenderer
        element={element}
        canvasWidth={canvasWidth}
        isSelected={isSelected}
        readOnly={readOnly}
      />

      {/* Resize handles — only shown when selected and not in read-only mode */}
      {isSelected && !readOnly && !element.locked && (
        <ResizeHandles onResizeStart={handleResizeStart} />
      )}
    </div>
  );
}

// ─── SlideCanvas ──────────────────────────────────────────────────────────────

/**
 * Props for the SlideCanvas component.
 */
export interface SlideCanvasProps {
  /** The canvas slide data to render. */
  data: CanvasSlideData;
  /**
   * Callback fired whenever the slide data changes.
   * The parent component is responsible for persisting the updated data.
   */
  onChange?: (updated: CanvasSlideData) => void;
  /**
   * Whether the canvas is in read-only (learner) mode.
   * In read-only mode, elements cannot be moved, resized, or selected.
   * Default: `false`.
   */
  readOnly?: boolean;
  /**
   * The ID of the currently selected element.
   * Controlled from the parent so the PropertiesPanel can stay in sync.
   */
  selectedElementId?: string | null;
  /**
   * Callback fired when the user selects an element by clicking it.
   * The parent should update `selectedElementId` accordingly.
   */
  onSelectElement?: (id: string | null) => void;
  /** Optional additional CSS class names for the canvas container. */
  className?: string;
}

/**
 * SlideCanvas — the main free-form canvas editor.
 *
 * Renders a 16:9 canvas with a background (colour or image) and a stack of
 * absolutely-positioned elements (text, image, video, shape).
 *
 * In edit mode, elements can be:
 *  - Selected by clicking
 *  - Moved by dragging the element body
 *  - Resized by dragging any of the 8 resize handles
 *
 * In read-only mode, elements are rendered statically (no interaction).
 */
export function SlideCanvas({
  data,
  onChange,
  readOnly = false,
  selectedElementId,
  onSelectElement,
  className,
}: SlideCanvasProps) {
  /** Ref to the canvas container div (used to measure its pixel dimensions). */
  const canvasRef = useRef<HTMLDivElement>(null);

  /** Current canvas dimensions in pixels. */
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 960,
    height: 540,
  });

  /** Observe canvas size changes (e.g. when the panel is resized). */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** Handle clicking on the canvas background (deselects any selected element). */
  const handleCanvasClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (readOnly) return;
      // Only deselect if the click was directly on the canvas (not on an element)
      if (e.target === canvasRef.current) {
        onSelectElement?.(null);
      }
    },
    [readOnly, onSelectElement]
  );

  /**
   * Handle element change (position, size, or content update).
   * Replaces the element in the elements array and fires `onChange`.
   */
  const handleElementChange = useCallback(
    (updated: CanvasElement) => {
      if (!onChange) return;
      const newElements: CanvasElement[] = data.elements.map((el) =>
        el.id === updated.id ? updated : el
      );
      onChange({ ...data, elements: newElements });
    },
    [data, onChange]
  );

  /** Handle element selection. */
  const handleSelectElement = useCallback(
    (id: string) => {
      if (readOnly) return;
      onSelectElement?.(id);
    },
    [readOnly, onSelectElement]
  );

  /** Compute the background CSS for the canvas. */
  const backgroundStyle: React.CSSProperties = {
    background: data.background.imageUrl ? undefined : data.background.color,
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    userSelect: "none",
  };

  /** Sort elements by zIndex for correct stacking order. */
  const sortedElements: CanvasElement[] = [...data.elements].sort(
    (a, b) => a.zIndex - b.zIndex
  );

  return (
    <div
      ref={canvasRef}
      className={cn("select-none", className)}
      style={backgroundStyle}
      onClick={handleCanvasClick}
    >
      {/* Background image layer */}
      {data.background.imageUrl && (
        <>
          <img
            src={data.background.imageUrl}
            alt="Slide background"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
            }}
            draggable={false}
          />
          {/* Dark overlay for text legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: data.background.overlayColor,
              opacity: data.background.overlayOpacity,
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Canvas elements */}
      {sortedElements.map((element) => (
        <CanvasElementWrapper
          key={element.id}
          element={element}
          isSelected={selectedElementId === element.id}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          readOnly={readOnly}
          onSelect={handleSelectElement}
          onChange={handleElementChange}
        />
      ))}

      {/* Empty state hint (editor mode only) */}
      {!readOnly && data.elements.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.35)",
            fontSize: "13px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <span>Use the <strong style={{ color: "rgba(255,255,255,0.55)" }}>Text</strong>, <strong style={{ color: "rgba(255,255,255,0.55)" }}>Image</strong>, or <strong style={{ color: "rgba(255,255,255,0.55)" }}>Video</strong> buttons above to build your slide</span>
        </div>
      )}
    </div>
  );
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

/**
 * Creates a new default text element for the canvas.
 * @param overrides - Optional partial overrides for the default values.
 * @returns A new `CanvasTextElement` with a unique UUID.
 */
export function createTextElement(overrides?: Partial<CanvasTextElement>): CanvasTextElement {
  return {
    id: uuidv4(),
    type: "text",
    x: 10,
    y: 10,
    w: 80,
    h: 20,
    zIndex: 10,
    locked: false,
    content: "",
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: 700,
    italic: false,
    underline: false,
    color: "#ffffff",
    align: "left",
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 8,
    ...overrides,
  };
}

/**
 * Creates a new default image element for the canvas.
 * @param overrides - Optional partial overrides for the default values.
 * @returns A new `CanvasImageElement` with a unique UUID.
 */
export function createImageElement(overrides?: Partial<CanvasImageElement>): CanvasImageElement {
  return {
    id: uuidv4(),
    type: "image",
    x: 20,
    y: 20,
    w: 60,
    h: 50,
    zIndex: 5,
    locked: false,
    url: "",
    alt: "",
    objectFit: "cover",
    borderRadius: 8,
    opacity: 1,
    ...overrides,
  };
}

/**
 * Creates a new default video element for the canvas.
 * @param overrides - Optional partial overrides for the default values.
 * @returns A new `CanvasVideoElement` with a unique UUID.
 */
export function createVideoElement(overrides?: Partial<CanvasVideoElement>): CanvasVideoElement {
  return {
    id: uuidv4(),
    type: "video",
    x: 10,
    y: 10,
    w: 80,
    h: 70,
    zIndex: 5,
    locked: false,
    url: "",
    provider: "youtube",
    autoplay: false,
    ...overrides,
  };
}

/**
 * Creates a new default shape element for the canvas.
 * @param overrides - Optional partial overrides for the default values.
 * @returns A new `CanvasShapeElement` with a unique UUID.
 */
export function createShapeElement(overrides?: Partial<CanvasShapeElement>): CanvasShapeElement {
  return {
    id: uuidv4(),
    type: "shape",
    x: 10,
    y: 10,
    w: 30,
    h: 10,
    zIndex: 2,
    locked: false,
    shape: "rectangle",
    fill: "#1E90FF",
    stroke: "transparent",
    strokeWidth: 0,
    borderRadius: 4,
    opacity: 1,
    ...overrides,
  };
}

/**
 * Creates a default empty `CanvasSlideData` payload.
 * Used when adding a new canvas slide to a lesson.
 *
 * @param chapterId - Optional chapter ID to assign this slide to.
 * @returns A new `CanvasSlideData` with a dark navy background and no elements.
 */
export function createEmptyCanvasSlide(chapterId: number | null = null): CanvasSlideData {
  return {
    background: {
      imageUrl: null,
      color: "#0F1C2E",
      overlayOpacity: 0.5,
      overlayColor: "#000000",
    },
    elements: [],
    chapterId,
    notes: "",
  };
}
