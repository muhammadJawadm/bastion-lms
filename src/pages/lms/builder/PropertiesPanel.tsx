/**
 * @file builder/PropertiesPanel.tsx
 * @description Properties panel for the Bastion LMS Canvas Slide Editor.
 *
 * Renders a context-sensitive right-side panel that shows editable properties
 * for the currently selected canvas element.
 *
 * Panel sections by element type:
 *  - **Text**  — content, font family, font size, weight, style, color, alignment, background
 *  - **Image** — URL upload/paste, alt text, object-fit, border-radius, opacity
 *  - **Video** — URL, provider, autoplay, caption
 *  - **Shape** — shape type, fill, stroke, border-radius, opacity
 *  - **Slide** — background color/image, overlay opacity
 *
 * @module PropertiesPanel
 */

import React, { useCallback, useRef } from "react";
import { Upload, Link2, Trash2, Lock, Unlock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  CanvasElement,
  CanvasTextElement,
  CanvasImageElement,
  CanvasVideoElement,
  CanvasShapeElement,
  CanvasSlideData,
} from "./types";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Font options ─────────────────────────────────────────────────────────────

/**
 * Available font families in the canvas editor.
 * All fonts are loaded via Google Fonts CDN in index.html.
 */
const FONT_FAMILIES: string[] = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "Bebas Neue",
  "Anton",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

/**
 * Available font sizes for the text element editor.
 * Expressed in pixels relative to the 960px reference canvas width.
 */
const FONT_SIZES: number[] = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120];

// ─── Section wrapper ──────────────────────────────────────────────────────────

/**
 * Props for the PanelSection component.
 */
interface PanelSectionProps {
  /** Section heading label. */
  title: string;
  /** Section content. */
  children: React.ReactNode;
}

/**
 * A collapsible section within the properties panel.
 */
function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-display font-bold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Color picker row ─────────────────────────────────────────────────────────

/**
 * Props for the ColorRow component.
 */
interface ColorRowProps {
  /** Label for the color input. */
  label: string;
  /** Current color value (CSS hex string). */
  value: string;
  /** Callback fired when the color changes. */
  onChange: (value: string) => void;
}

/**
 * A labeled color picker row.
 */
function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-gray-300 shrink-0">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value === "transparent" ? "#000000" : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-gray-600 cursor-pointer bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 h-7 text-xs bg-[#1a1f35] border-gray-600 text-white"
        />
      </div>
    </div>
  );
}

// ─── Image upload helper ──────────────────────────────────────────────────────

/**
 * Props for the ImageUploadRow component.
 */
interface ImageUploadRowProps {
  /** Label for the upload row. */
  label: string;
  /** Current image URL. */
  value: string;
  /** Callback fired when the URL changes. */
  onChange: (url: string) => void;
}

/**
 * A labeled image upload row with paste-URL and file-upload options.
 */
function ImageUploadRow({ label, value, onChange }: ImageUploadRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** tRPC mutation for uploading a base64-encoded image. */
  const uploadMutation = trpc.uploads?.uploadBase64?.useMutation?.({
    onSuccess: (data: { url: string }) => {
      onChange(data.url);
      toast.success("Image uploaded");
    },
    onError: () => {
      toast.error("Upload failed — please try pasting a URL instead");
    },
  });

  /** Handle file selection from the file input. */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation?.mutate?.({ base64, contentType: file.type, fileName: file.name, folder: "images" });
      };
      reader.readAsDataURL(file);
    },
    [uploadMutation]
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-300">{label}</Label>
      <div className="flex gap-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL…"
          className="flex-1 h-7 text-xs bg-[#1a1f35] border-gray-600 text-white placeholder:text-gray-500"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 border-gray-600 text-gray-300 hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          <Upload size={12} />
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─── Text element properties ──────────────────────────────────────────────────

/**
 * Props for the TextProperties component.
 */
interface TextPropertiesProps {
  /** The text element being edited. */
  element: CanvasTextElement;
  /** Callback fired when the element changes. */
  onChange: (updated: CanvasTextElement) => void;
}

/**
 * Properties panel section for a text element.
 * Covers content, font, size, weight, style, color, alignment, and background.
 */
function TextProperties({ element, onChange }: TextPropertiesProps) {
  /** Helper to update a single field on the element. */
  const update = useCallback(
    <K extends keyof CanvasTextElement>(key: K, value: CanvasTextElement[K]) => {
      onChange({ ...element, [key]: value });
    },
    [element, onChange]
  );

  return (
    <>
      {/* Content */}
      <PanelSection title="Content">
        <textarea
          value={element.content}
          onChange={(e) => update("content", e.target.value)}
          placeholder="Type your text here…"
          rows={4}
          className="w-full text-xs bg-[#1a1f35] border border-gray-600 rounded-md p-2 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      {/* Typography */}
      <PanelSection title="Typography">
        {/* Font family */}
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Font</Label>
          <Select value={element.fontFamily} onValueChange={(v) => update("fontFamily", v)}>
            <SelectTrigger className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f35] border-gray-600">
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f} value={f} className="text-xs text-white" style={{ fontFamily: f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font size */}
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Size</Label>
          <Select
            value={String(element.fontSize)}
            onValueChange={(v) => update("fontSize", Number(v))}
          >
            <SelectTrigger className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f35] border-gray-600">
              {FONT_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs text-white">
                  {s}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font weight */}
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Weight</Label>
          <Select
            value={String(element.fontWeight)}
            onValueChange={(v) => update("fontWeight", Number(v) as CanvasTextElement["fontWeight"])}
          >
            <SelectTrigger className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f35] border-gray-600">
              {[400, 500, 600, 700, 800, 900].map((w) => (
                <SelectItem key={w} value={String(w)} className="text-xs text-white">
                  {w === 400 ? "Regular" : w === 500 ? "Medium" : w === 600 ? "Semi-Bold" : w === 700 ? "Bold" : w === 800 ? "Extra-Bold" : "Black"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => update("italic", !element.italic)}
            className={cn(
              "flex-1 h-7 text-xs rounded border font-italic transition-colors",
              element.italic
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-[#1a1f35] border-gray-600 text-gray-300 hover:text-white"
            )}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => update("underline", !element.underline)}
            className={cn(
              "flex-1 h-7 text-xs rounded border underline transition-colors",
              element.underline
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-[#1a1f35] border-gray-600 text-gray-300 hover:text-white"
            )}
          >
            U
          </button>
        </div>

        {/* Alignment */}
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Alignment</Label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                onClick={() => update("align", a)}
                className={cn(
                  "flex-1 h-7 text-xs rounded border transition-colors capitalize",
                  element.align === a
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-[#1a1f35] border-gray-600 text-gray-300 hover:text-white"
                )}
              >
                {a.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      {/* Colors */}
      <PanelSection title="Colors">
        <ColorRow label="Text" value={element.color} onChange={(v) => update("color", v)} />
        <ColorRow
          label="Background"
          value={element.backgroundColor}
          onChange={(v) => update("backgroundColor", v)}
        />
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      {/* Spacing */}
      <PanelSection title="Spacing">
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">
            Padding — {element.padding}px
          </Label>
          <Slider
            min={0} max={40} step={2}
            value={[element.padding]}
            onValueChange={([v]) => update("padding", v)}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">
            Border radius — {element.borderRadius}px
          </Label>
          <Slider
            min={0} max={32} step={2}
            value={[element.borderRadius]}
            onValueChange={([v]) => update("borderRadius", v)}
            className="w-full"
          />
        </div>
      </PanelSection>
    </>
  );
}

// ─── Image element properties ─────────────────────────────────────────────────

/**
 * Props for the ImageProperties component.
 */
interface ImagePropertiesProps {
  element: CanvasImageElement;
  onChange: (updated: CanvasImageElement) => void;
}

/**
 * Properties panel section for an image element.
 */
function ImageProperties({ element, onChange }: ImagePropertiesProps) {
  const update = useCallback(
    <K extends keyof CanvasImageElement>(key: K, value: CanvasImageElement[K]) => {
      onChange({ ...element, [key]: value });
    },
    [element, onChange]
  );

  return (
    <>
      <PanelSection title="Image">
        <ImageUploadRow label="Source" value={element.url} onChange={(v) => update("url", v)} />
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Alt text</Label>
          <Input
            value={element.alt}
            onChange={(e) => update("alt", e.target.value)}
            placeholder="Describe the image…"
            className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      <PanelSection title="Display">
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Fit</Label>
          <Select value={element.objectFit} onValueChange={(v) => update("objectFit", v as CanvasImageElement["objectFit"])}>
            <SelectTrigger className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f35] border-gray-600">
              <SelectItem value="cover" className="text-xs text-white">Cover (crop)</SelectItem>
              <SelectItem value="contain" className="text-xs text-white">Contain (letterbox)</SelectItem>
              <SelectItem value="fill" className="text-xs text-white">Fill (stretch)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">
            Border radius — {element.borderRadius}px
          </Label>
          <Slider
            min={0} max={64} step={4}
            value={[element.borderRadius]}
            onValueChange={([v]) => update("borderRadius", v)}
            className="w-full"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">
            Opacity — {Math.round(element.opacity * 100)}%
          </Label>
          <Slider
            min={0} max={100} step={5}
            value={[Math.round(element.opacity * 100)]}
            onValueChange={([v]) => update("opacity", v / 100)}
            className="w-full"
          />
        </div>
      </PanelSection>
    </>
  );
}

// ─── Video element properties ─────────────────────────────────────────────────

/**
 * Props for the VideoProperties component.
 */
interface VideoPropertiesProps {
  element: CanvasVideoElement;
  onChange: (updated: CanvasVideoElement) => void;
}

/**
 * Properties panel section for a video element.
 */
function VideoProperties({ element, onChange }: VideoPropertiesProps) {
  const update = useCallback(
    <K extends keyof CanvasVideoElement>(key: K, value: CanvasVideoElement[K]) => {
      onChange({ ...element, [key]: value });
    },
    [element, onChange]
  );

  return (
    <>
      <PanelSection title="Video">
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Provider</Label>
          <Select
            value={element.provider}
            onValueChange={(v) => update("provider", v as CanvasVideoElement["provider"])}
          >
            <SelectTrigger className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f35] border-gray-600">
              <SelectItem value="youtube" className="text-xs text-white">YouTube</SelectItem>
              <SelectItem value="vimeo" className="text-xs text-white">Vimeo</SelectItem>
              <SelectItem value="upload" className="text-xs text-white">Uploaded file</SelectItem>
              <SelectItem value="other" className="text-xs text-white">Other embed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">URL</Label>
          <Input
            value={element.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder={
              element.provider === "youtube"
                ? "https://www.youtube.com/watch?v=…"
                : element.provider === "vimeo"
                ? "https://vimeo.com/…"
                : "https://…"
            }
            className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Caption (optional)</Label>
          <Input
            value={element.caption ?? ""}
            onChange={(e) => update("caption", e.target.value || undefined)}
            placeholder="Caption shown below video…"
            className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={element.autoplay}
            onChange={(e) => update("autoplay", e.target.checked)}
            className="rounded border-gray-600"
          />
          <span className="text-xs text-gray-300">Autoplay when slide appears</span>
        </label>
      </PanelSection>
    </>
  );
}

// ─── Shape element properties ─────────────────────────────────────────────────

/**
 * Props for the ShapeProperties component.
 */
interface ShapePropertiesProps {
  element: CanvasShapeElement;
  onChange: (updated: CanvasShapeElement) => void;
}

/**
 * Properties panel section for a shape element.
 */
function ShapeProperties({ element, onChange }: ShapePropertiesProps) {
  const update = useCallback(
    <K extends keyof CanvasShapeElement>(key: K, value: CanvasShapeElement[K]) => {
      onChange({ ...element, [key]: value });
    },
    [element, onChange]
  );

  return (
    <>
      <PanelSection title="Shape">
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">Type</Label>
          <Select
            value={element.shape}
            onValueChange={(v) => update("shape", v as CanvasShapeElement["shape"])}
          >
            <SelectTrigger className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f35] border-gray-600">
              <SelectItem value="rectangle" className="text-xs text-white">Rectangle</SelectItem>
              <SelectItem value="circle" className="text-xs text-white">Circle</SelectItem>
              <SelectItem value="line" className="text-xs text-white">Line</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      <PanelSection title="Colors">
        <ColorRow label="Fill" value={element.fill} onChange={(v) => update("fill", v)} />
        <ColorRow label="Stroke" value={element.stroke} onChange={(v) => update("stroke", v)} />
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">
            Stroke width — {element.strokeWidth}px
          </Label>
          <Slider
            min={0} max={16} step={1}
            value={[element.strokeWidth]}
            onValueChange={([v]) => update("strokeWidth", v)}
            className="w-full"
          />
        </div>
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      <PanelSection title="Appearance">
        {element.shape !== "circle" && element.shape !== "line" && (
          <div>
            <Label className="text-xs text-gray-300 mb-1 block">
              Border radius — {element.borderRadius}px
            </Label>
            <Slider
              min={0} max={64} step={4}
              value={[element.borderRadius]}
              onValueChange={([v]) => update("borderRadius", v)}
              className="w-full"
            />
          </div>
        )}
        <div>
          <Label className="text-xs text-gray-300 mb-1 block">
            Opacity — {Math.round(element.opacity * 100)}%
          </Label>
          <Slider
            min={0} max={100} step={5}
            value={[Math.round(element.opacity * 100)]}
            onValueChange={([v]) => update("opacity", v / 100)}
            className="w-full"
          />
        </div>
      </PanelSection>
    </>
  );
}

// ─── Slide background properties ──────────────────────────────────────────────

/**
 * Props for the SlideBackgroundProperties component.
 */
interface SlideBackgroundPropertiesProps {
  /** The current slide data. */
  data: CanvasSlideData;
  /** Callback fired when the slide data changes. */
  onChange: (updated: CanvasSlideData) => void;
}

/**
 * Properties panel section for the slide background.
 * Shown when no element is selected.
 */
function SlideBackgroundProperties({ data, onChange }: SlideBackgroundPropertiesProps) {
  const updateBg = useCallback(
    <K extends keyof CanvasSlideData["background"]>(
      key: K,
      value: CanvasSlideData["background"][K]
    ) => {
      onChange({ ...data, background: { ...data.background, [key]: value } });
    },
    [data, onChange]
  );

  return (
    <>
      <PanelSection title="Background">
        <ColorRow
          label="Color"
          value={data.background.color}
          onChange={(v) => updateBg("color", v)}
        />
        <ImageUploadRow
          label="Background image"
          value={data.background.imageUrl ?? ""}
          onChange={(v) => updateBg("imageUrl", v || null)}
        />
        {data.background.imageUrl && (
          <>
            <ColorRow
              label="Overlay"
              value={data.background.overlayColor}
              onChange={(v) => updateBg("overlayColor", v)}
            />
            <div>
              <Label className="text-xs text-gray-300 mb-1 block">
                Overlay opacity — {Math.round(data.background.overlayOpacity * 100)}%
              </Label>
              <Slider
                min={0} max={100} step={5}
                value={[Math.round(data.background.overlayOpacity * 100)]}
                onValueChange={([v]) => updateBg("overlayOpacity", v / 100)}
                className="w-full"
              />
            </div>
          </>
        )}
      </PanelSection>

      <Separator className="bg-gray-700 my-3" />

      <PanelSection title="Notes">
        <textarea
          value={data.notes ?? ""}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Instructor notes (not visible to learners)…"
          rows={3}
          className="w-full text-xs bg-[#1a1f35] border border-gray-600 rounded-md p-2 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </PanelSection>
    </>
  );
}

// ─── Position & size controls ─────────────────────────────────────────────────

/**
 * Props for the PositionSizeControls component.
 */
interface PositionSizeControlsProps {
  /** The element to show position/size controls for. */
  element: CanvasElement;
  /** Callback fired when the element changes. */
  onChange: (updated: CanvasElement) => void;
}

/**
 * Numeric position and size controls for a canvas element.
 * Allows precise positioning when drag-and-drop is not accurate enough.
 */
function PositionSizeControls({ element, onChange }: PositionSizeControlsProps) {
  /** Helper to update a position/size field. */
  const update = useCallback(
    (key: "x" | "y" | "w" | "h" | "zIndex", value: number) => {
      onChange({ ...element, [key]: value });
    },
    [element, onChange]
  );

  return (
    <PanelSection title="Position & Size">
      <div className="grid grid-cols-2 gap-2">
        {(["x", "y", "w", "h"] as const).map((key) => (
          <div key={key}>
            <Label className="text-[10px] text-gray-400 mb-0.5 block uppercase">
              {key === "x" ? "Left %" : key === "y" ? "Top %" : key === "w" ? "Width %" : "Height %"}
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={Math.round(element[key] * 10) / 10}
              onChange={(e) => update(key, Number(e.target.value))}
              className="h-7 text-xs bg-[#1a1f35] border-gray-600 text-white"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <Label className="text-xs text-gray-300">Z-index</Label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => update("zIndex", Math.max(1, element.zIndex - 1))}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-600 text-gray-300 hover:text-white"
          >
            <ChevronDown size={12} />
          </button>
          <span className="text-xs text-white w-6 text-center">{element.zIndex}</span>
          <button
            onClick={() => update("zIndex", Math.min(100, element.zIndex + 1))}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-600 text-gray-300 hover:text-white"
          >
            <ChevronUp size={12} />
          </button>
        </div>
      </div>
    </PanelSection>
  );
}

// ─── PropertiesPanel ──────────────────────────────────────────────────────────

/**
 * Props for the PropertiesPanel component.
 */
export interface PropertiesPanelProps {
  /** The canvas slide data. */
  data: CanvasSlideData;
  /**
   * The ID of the currently selected element.
   * `null` = no element selected (shows slide background properties).
   */
  selectedElementId: string | null;
  /**
   * Callback fired when the slide data changes.
   * Covers both element changes and slide background changes.
   */
  onChange: (updated: CanvasSlideData) => void;
  /**
   * Callback fired when the user requests to delete the selected element.
   */
  onDeleteElement: (id: string) => void;
  /**
   * Callback fired when the user toggles the lock state of the selected element.
   */
  onToggleLock: (id: string) => void;
}

/**
 * PropertiesPanel — the right-side panel in the canvas slide editor.
 *
 * When an element is selected, shows that element's properties.
 * When no element is selected, shows the slide background properties.
 */
export function PropertiesPanel({
  data,
  selectedElementId,
  onChange,
  onDeleteElement,
  onToggleLock,
}: PropertiesPanelProps) {
  /** The currently selected element, or null if none. */
  const selectedElement: CanvasElement | null =
    selectedElementId
      ? data.elements.find((el) => el.id === selectedElementId) ?? null
      : null;

  /**
   * Handle element property changes.
   * Replaces the element in the elements array and fires `onChange`.
   */
  const handleElementChange = useCallback(
    (updated: CanvasElement) => {
      const newElements: CanvasElement[] = data.elements.map((el) =>
        el.id === updated.id ? updated : el
      );
      onChange({ ...data, elements: newElements });
    },
    [data, onChange]
  );

  return (
    <div className="w-64 flex-shrink-0 bg-[#111827] border-l border-gray-700 flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-xs font-display font-bold text-white uppercase tracking-widest">
          {selectedElement ? `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties` : "Slide Properties"}
        </span>
        {selectedElement && (
          <div className="flex items-center gap-1">
            {/* Lock/unlock toggle */}
            <button
              onClick={() => onToggleLock(selectedElement.id)}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white transition-colors"
              title={selectedElement.locked ? "Unlock element" : "Lock element"}
            >
              {selectedElement.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            {/* Delete element */}
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-400 transition-colors"
              title="Delete element"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Panel body — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {selectedElement ? (
          <>
            {/* Position & size controls (shown for all element types) */}
            <PositionSizeControls
              element={selectedElement}
              onChange={handleElementChange}
            />

            <Separator className="bg-gray-700 my-3" />

            {/* Type-specific properties */}
            {selectedElement.type === "text" && (
              <TextProperties
                element={selectedElement as CanvasTextElement}
                onChange={(updated) => handleElementChange(updated)}
              />
            )}
            {selectedElement.type === "image" && (
              <ImageProperties
                element={selectedElement as CanvasImageElement}
                onChange={(updated) => handleElementChange(updated)}
              />
            )}
            {selectedElement.type === "video" && (
              <VideoProperties
                element={selectedElement as CanvasVideoElement}
                onChange={(updated) => handleElementChange(updated)}
              />
            )}
            {selectedElement.type === "shape" && (
              <ShapeProperties
                element={selectedElement as CanvasShapeElement}
                onChange={(updated) => handleElementChange(updated)}
              />
            )}
          </>
        ) : (
          <SlideBackgroundProperties data={data} onChange={onChange} />
        )}
      </div>
    </div>
  );
}
