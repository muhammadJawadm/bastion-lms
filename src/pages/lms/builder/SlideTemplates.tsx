/**
 * @file builder/SlideTemplates.tsx
 * @description Pre-built slide template library for the Bastion LMS Course Builder.
 *
 * Provides 12 ready-to-use slide templates specifically designed for workplace
 * safety training. Each template is a complete `CanvasSlideData` payload that
 * can be inserted as a new slide into any lesson.
 *
 * Template categories:
 *  - **Title** — course/module title slides
 *  - **Content** — text + image layouts for presenting information
 *  - **Hazard** — warning/hazard identification layouts
 *  - **Procedure** — step-by-step procedure layouts
 *  - **Quiz** — placeholder slides for interactive questions
 *  - **Summary** — end-of-module recap layouts
 *
 * @module SlideTemplates
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import type { CanvasSlideData, CanvasTextElement, CanvasShapeElement, CanvasImageElement } from "./types";

// ─── Template definitions ─────────────────────────────────────────────────────

/**
 * A single slide template entry in the library.
 */
export interface SlideTemplate {
  /** Unique identifier for the template. */
  id: string;
  /** Display name shown in the template picker. */
  name: string;
  /** Short description of the template's intended use. */
  description: string;
  /** Category for grouping in the template picker. */
  category: "title" | "content" | "hazard" | "procedure" | "quiz" | "summary";
  /** Preview thumbnail background color (used in the picker UI). */
  previewColor: string;
  /**
   * Factory function that returns a fresh copy of the template data.
   * Called each time the template is applied to ensure unique element IDs.
   */
  create: () => CanvasSlideData;
}

// ─── Helper: create text element ─────────────────────────────────────────────

/**
 * Creates a text element with the given overrides.
 * All IDs are freshly generated to avoid collisions.
 */
function txt(overrides: Partial<CanvasTextElement> & Pick<CanvasTextElement, "content" | "x" | "y" | "w" | "h">): CanvasTextElement {
  return {
    id: uuidv4(),
    type: "text",
    zIndex: 10,
    locked: false,
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
 * Creates a shape element with the given overrides.
 */
function shape(overrides: Partial<CanvasShapeElement> & Pick<CanvasShapeElement, "x" | "y" | "w" | "h">): CanvasShapeElement {
  return {
    id: uuidv4(),
    type: "shape",
    zIndex: 2,
    locked: false,
    shape: "rectangle",
    fill: "#1E90FF",
    stroke: "transparent",
    strokeWidth: 0,
    borderRadius: 0,
    opacity: 1,
    ...overrides,
  };
}

/**
 * Creates an image placeholder element.
 */
function imgPlaceholder(overrides: Partial<CanvasImageElement> & Pick<CanvasImageElement, "x" | "y" | "w" | "h">): CanvasImageElement {
  return {
    id: uuidv4(),
    type: "image",
    zIndex: 5,
    locked: false,
    url: "",
    alt: "Add image",
    objectFit: "cover",
    borderRadius: 8,
    opacity: 1,
    ...overrides,
  };
}

// ─── Template library ─────────────────────────────────────────────────────────

/**
 * The full library of pre-built slide templates.
 * Each template's `create()` function generates fresh element IDs.
 */
export const SLIDE_TEMPLATES: SlideTemplate[] = [

  // ── 1. Course Title ────────────────────────────────────────────────────────
  {
    id: "title-course",
    name: "Course Title",
    description: "Bold title slide with subtitle and company branding bar",
    category: "title",
    previewColor: "#0F1C2E",
    create: (): CanvasSlideData => ({
      background: { color: "#0F1C2E", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Blue accent bar at bottom
        shape({ x: 0, y: 88, w: 100, h: 12, fill: "#0047AB", borderRadius: 0, zIndex: 1 }),
        // Top accent line
        shape({ x: 0, y: 0, w: 100, h: 1.5, fill: "#1E90FF", borderRadius: 0, zIndex: 1 }),
        // Course title
        txt({ content: "Course Title", x: 8, y: 22, w: 84, h: 22, fontSize: 72, fontWeight: 900, color: "#ffffff", align: "center", zIndex: 10 }),
        // Subtitle
        txt({ content: "Module 1 — Introduction", x: 8, y: 50, w: 84, h: 10, fontSize: 28, fontWeight: 400, color: "#90CAF9", align: "center", zIndex: 10 }),
        // Company name in footer
        txt({ content: "Bastion Risk and Safety Group", x: 8, y: 90, w: 84, h: 8, fontSize: 18, fontWeight: 600, color: "#ffffff", align: "center", zIndex: 11 }),
      ],
      notes: "Replace the title and subtitle with your course information.",
    }),
  },

  // ── 2. Module Title ────────────────────────────────────────────────────────
  {
    id: "title-module",
    name: "Module Title",
    description: "Section divider slide with large module number and title",
    category: "title",
    previewColor: "#0047AB",
    create: (): CanvasSlideData => ({
      background: { color: "#0047AB", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Large module number (decorative)
        txt({ content: "01", x: 5, y: 5, w: 30, h: 50, fontSize: 160, fontWeight: 900, color: "rgba(255,255,255,0.08)", align: "left", zIndex: 2 }),
        // Module label
        txt({ content: "MODULE 1", x: 8, y: 30, w: 84, h: 10, fontSize: 18, fontWeight: 700, color: "#90CAF9", align: "left", zIndex: 10 }),
        // Module title
        txt({ content: "Hazard Identification", x: 8, y: 42, w: 84, h: 20, fontSize: 56, fontWeight: 900, color: "#ffffff", align: "left", zIndex: 10 }),
        // Divider line
        shape({ x: 8, y: 66, w: 20, h: 0.8, fill: "#1E90FF", zIndex: 5 }),
        // Subtitle
        txt({ content: "Recognizing and reporting workplace hazards", x: 8, y: 70, w: 70, h: 10, fontSize: 22, fontWeight: 400, color: "#BBDEFB", align: "left", zIndex: 10 }),
      ],
      notes: "Use this slide at the start of each module to orient learners.",
    }),
  },

  // ── 3. Title + Image ──────────────────────────────────────────────────────
  {
    id: "content-title-image",
    name: "Title + Image",
    description: "Heading on the left, image placeholder on the right",
    category: "content",
    previewColor: "#1a1f35",
    create: (): CanvasSlideData => ({
      background: { color: "#0F1C2E", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Left text column
        txt({ content: "Key Concept", x: 5, y: 8, w: 48, h: 14, fontSize: 42, fontWeight: 800, color: "#ffffff", align: "left", zIndex: 10 }),
        txt({ content: "Add your explanation here. Keep it concise and focused on one key idea per slide.", x: 5, y: 26, w: 48, h: 50, fontSize: 22, fontWeight: 400, color: "#BBDEFB", align: "left", zIndex: 10 }),
        // Blue accent dot
        shape({ x: 5, y: 22, w: 1.5, h: 3, fill: "#1E90FF", borderRadius: 4, zIndex: 5 }),
        // Right image placeholder
        imgPlaceholder({ x: 56, y: 8, w: 40, h: 84, borderRadius: 12, zIndex: 5 }),
      ],
      notes: "Replace the placeholder with a relevant safety image.",
    }),
  },

  // ── 4. Full-Width Text ────────────────────────────────────────────────────
  {
    id: "content-text-only",
    name: "Text Slide",
    description: "Clean text-only slide with headline and body copy",
    category: "content",
    previewColor: "#0F1C2E",
    create: (): CanvasSlideData => ({
      background: { color: "#0F1C2E", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Top accent bar
        shape({ x: 0, y: 0, w: 100, h: 1, fill: "#1E90FF", zIndex: 1 }),
        // Headline
        txt({ content: "Slide Headline", x: 8, y: 12, w: 84, h: 16, fontSize: 48, fontWeight: 800, color: "#ffffff", align: "left", zIndex: 10 }),
        // Divider
        shape({ x: 8, y: 30, w: 15, h: 0.8, fill: "#1E90FF", zIndex: 5 }),
        // Body text
        txt({ content: "Add your content here. Use short, clear sentences. Aim for no more than 4–5 lines per slide to keep learners engaged.", x: 8, y: 35, w: 84, h: 45, fontSize: 24, fontWeight: 400, color: "#BBDEFB", align: "left", zIndex: 10 }),
      ],
      notes: "",
    }),
  },

  // ── 5. Two-Column ─────────────────────────────────────────────────────────
  {
    id: "content-two-column",
    name: "Two Columns",
    description: "Side-by-side columns for comparing two concepts",
    category: "content",
    previewColor: "#0F1C2E",
    create: (): CanvasSlideData => ({
      background: { color: "#0F1C2E", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Title
        txt({ content: "Comparing Approaches", x: 8, y: 5, w: 84, h: 12, fontSize: 36, fontWeight: 800, color: "#ffffff", align: "center", zIndex: 10 }),
        // Left column background
        shape({ x: 5, y: 20, w: 42, h: 72, fill: "rgba(30,144,255,0.1)", borderRadius: 12, stroke: "rgba(30,144,255,0.3)", strokeWidth: 1, zIndex: 3 }),
        // Right column background
        shape({ x: 53, y: 20, w: 42, h: 72, fill: "rgba(255,255,255,0.05)", borderRadius: 12, stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, zIndex: 3 }),
        // Left column header
        txt({ content: "Correct", x: 8, y: 23, w: 36, h: 10, fontSize: 22, fontWeight: 700, color: "#4FC3F7", align: "center", zIndex: 10 }),
        // Right column header
        txt({ content: "Incorrect", x: 56, y: 23, w: 36, h: 10, fontSize: 22, fontWeight: 700, color: "#EF9A9A", align: "center", zIndex: 10 }),
        // Left content
        txt({ content: "• Point one\n• Point two\n• Point three", x: 8, y: 36, w: 36, h: 50, fontSize: 18, fontWeight: 400, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Right content
        txt({ content: "• Point one\n• Point two\n• Point three", x: 56, y: 36, w: 36, h: 50, fontSize: 18, fontWeight: 400, color: "#FFCDD2", align: "left", zIndex: 10 }),
      ],
      notes: "Use this template to contrast correct vs. incorrect procedures.",
    }),
  },

  // ── 6. Hazard Warning ─────────────────────────────────────────────────────
  {
    id: "hazard-warning",
    name: "Hazard Warning",
    description: "High-visibility warning slide with yellow/black hazard styling",
    category: "hazard",
    previewColor: "#1a1200",
    create: (): CanvasSlideData => ({
      background: { color: "#1a1200", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Yellow warning bar at top
        shape({ x: 0, y: 0, w: 100, h: 18, fill: "#F9A825", borderRadius: 0, zIndex: 1 }),
        // WARNING label
        txt({ content: "⚠ WARNING", x: 5, y: 2, w: 90, h: 14, fontSize: 52, fontWeight: 900, color: "#000000", align: "center", zIndex: 10 }),
        // Hazard title
        txt({ content: "Hazard Title", x: 8, y: 22, w: 84, h: 16, fontSize: 44, fontWeight: 800, color: "#F9A825", align: "center", zIndex: 10 }),
        // Description
        txt({ content: "Describe the hazard clearly. What is the risk? Who is at risk? What are the consequences?", x: 10, y: 42, w: 80, h: 30, fontSize: 22, fontWeight: 400, color: "#ffffff", align: "center", zIndex: 10 }),
        // Bottom bar
        shape({ x: 0, y: 88, w: 100, h: 12, fill: "#F9A825", borderRadius: 0, zIndex: 1 }),
        txt({ content: "Report all hazards immediately to your supervisor", x: 5, y: 90, w: 90, h: 8, fontSize: 18, fontWeight: 600, color: "#000000", align: "center", zIndex: 10 }),
      ],
      notes: "Use this template for hazard identification slides.",
    }),
  },

  // ── 7. Hazard + Image ─────────────────────────────────────────────────────
  {
    id: "hazard-image",
    name: "Hazard + Photo",
    description: "Hazard description with a photo of the hazard on the right",
    category: "hazard",
    previewColor: "#2d0a0a",
    create: (): CanvasSlideData => ({
      background: { color: "#1a0a0a", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Red accent bar
        shape({ x: 0, y: 0, w: 100, h: 1.5, fill: "#EF5350", zIndex: 1 }),
        // Hazard label
        txt({ content: "HAZARD IDENTIFIED", x: 5, y: 5, w: 50, h: 8, fontSize: 16, fontWeight: 700, color: "#EF9A9A", align: "left", zIndex: 10 }),
        // Title
        txt({ content: "Hazard Name", x: 5, y: 14, w: 50, h: 16, fontSize: 44, fontWeight: 900, color: "#ffffff", align: "left", zIndex: 10 }),
        // Description
        txt({ content: "Describe the hazard, its location, and who is at risk.", x: 5, y: 33, w: 50, h: 20, fontSize: 20, fontWeight: 400, color: "#FFCDD2", align: "left", zIndex: 10 }),
        // Controls label
        txt({ content: "Controls:", x: 5, y: 56, w: 50, h: 8, fontSize: 18, fontWeight: 700, color: "#EF9A9A", align: "left", zIndex: 10 }),
        txt({ content: "• Control measure 1\n• Control measure 2\n• Control measure 3", x: 5, y: 65, w: 50, h: 25, fontSize: 18, fontWeight: 400, color: "#ffffff", align: "left", zIndex: 10 }),
        // Right image
        imgPlaceholder({ x: 58, y: 8, w: 38, h: 84, borderRadius: 12, zIndex: 5 }),
      ],
      notes: "Add a photo of the actual hazard in the image placeholder.",
    }),
  },

  // ── 8. Step-by-Step Procedure ─────────────────────────────────────────────
  {
    id: "procedure-steps",
    name: "Step-by-Step",
    description: "Numbered procedure steps with a clean, scannable layout",
    category: "procedure",
    previewColor: "#0a1628",
    create: (): CanvasSlideData => ({
      background: { color: "#0a1628", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Title
        txt({ content: "Procedure Title", x: 8, y: 5, w: 84, h: 12, fontSize: 38, fontWeight: 800, color: "#ffffff", align: "left", zIndex: 10 }),
        // Step 1
        shape({ x: 8, y: 22, w: 6, h: 10, fill: "#0047AB", borderRadius: 50, zIndex: 5 }),
        txt({ content: "1", x: 8, y: 22, w: 6, h: 10, fontSize: 22, fontWeight: 900, color: "#ffffff", align: "center", zIndex: 10 }),
        txt({ content: "Step one description goes here", x: 17, y: 23, w: 76, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Step 2
        shape({ x: 8, y: 36, w: 6, h: 10, fill: "#0047AB", borderRadius: 50, zIndex: 5 }),
        txt({ content: "2", x: 8, y: 36, w: 6, h: 10, fontSize: 22, fontWeight: 900, color: "#ffffff", align: "center", zIndex: 10 }),
        txt({ content: "Step two description goes here", x: 17, y: 37, w: 76, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Step 3
        shape({ x: 8, y: 50, w: 6, h: 10, fill: "#0047AB", borderRadius: 50, zIndex: 5 }),
        txt({ content: "3", x: 8, y: 50, w: 6, h: 10, fontSize: 22, fontWeight: 900, color: "#ffffff", align: "center", zIndex: 10 }),
        txt({ content: "Step three description goes here", x: 17, y: 51, w: 76, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Step 4
        shape({ x: 8, y: 64, w: 6, h: 10, fill: "#0047AB", borderRadius: 50, zIndex: 5 }),
        txt({ content: "4", x: 8, y: 64, w: 6, h: 10, fontSize: 22, fontWeight: 900, color: "#ffffff", align: "center", zIndex: 10 }),
        txt({ content: "Step four description goes here", x: 17, y: 65, w: 76, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
      ],
      notes: "Replace each step with the actual procedure steps. Add or remove steps as needed.",
    }),
  },

  // ── 9. PPE Required ───────────────────────────────────────────────────────
  {
    id: "procedure-ppe",
    name: "PPE Required",
    description: "PPE requirements slide with icon grid layout",
    category: "procedure",
    previewColor: "#003300",
    create: (): CanvasSlideData => ({
      background: { color: "#001a00", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Green accent bar
        shape({ x: 0, y: 0, w: 100, h: 1.5, fill: "#4CAF50", zIndex: 1 }),
        // Title
        txt({ content: "Required PPE", x: 8, y: 5, w: 84, h: 14, fontSize: 48, fontWeight: 900, color: "#ffffff", align: "center", zIndex: 10 }),
        txt({ content: "The following personal protective equipment is REQUIRED for this task:", x: 8, y: 20, w: 84, h: 10, fontSize: 20, fontWeight: 400, color: "#A5D6A7", align: "center", zIndex: 10 }),
        // PPE item boxes (4 across)
        shape({ x: 5, y: 34, w: 20, h: 40, fill: "rgba(76,175,80,0.15)", borderRadius: 12, stroke: "rgba(76,175,80,0.4)", strokeWidth: 1, zIndex: 3 }),
        shape({ x: 28, y: 34, w: 20, h: 40, fill: "rgba(76,175,80,0.15)", borderRadius: 12, stroke: "rgba(76,175,80,0.4)", strokeWidth: 1, zIndex: 3 }),
        shape({ x: 51, y: 34, w: 20, h: 40, fill: "rgba(76,175,80,0.15)", borderRadius: 12, stroke: "rgba(76,175,80,0.4)", strokeWidth: 1, zIndex: 3 }),
        shape({ x: 74, y: 34, w: 20, h: 40, fill: "rgba(76,175,80,0.15)", borderRadius: 12, stroke: "rgba(76,175,80,0.4)", strokeWidth: 1, zIndex: 3 }),
        // PPE labels
        txt({ content: "Hard Hat", x: 5, y: 66, w: 20, h: 8, fontSize: 16, fontWeight: 600, color: "#A5D6A7", align: "center", zIndex: 10 }),
        txt({ content: "Safety Vest", x: 28, y: 66, w: 20, h: 8, fontSize: 16, fontWeight: 600, color: "#A5D6A7", align: "center", zIndex: 10 }),
        txt({ content: "Safety Boots", x: 51, y: 66, w: 20, h: 8, fontSize: 16, fontWeight: 600, color: "#A5D6A7", align: "center", zIndex: 10 }),
        txt({ content: "Safety Glasses", x: 74, y: 66, w: 20, h: 8, fontSize: 16, fontWeight: 600, color: "#A5D6A7", align: "center", zIndex: 10 }),
        // Add image placeholder instructions
        txt({ content: "Add PPE images in each box", x: 5, y: 40, w: 90, h: 20, fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.2)", align: "center", zIndex: 10 }),
      ],
      notes: "Add images of each PPE item in the boxes. Update labels to match required PPE for this task.",
    }),
  },

  // ── 10. Knowledge Check (MC) ──────────────────────────────────────────────
  {
    id: "quiz-mc",
    name: "Knowledge Check",
    description: "Quiz slide placeholder — add a multiple choice question",
    category: "quiz",
    previewColor: "#1a0047",
    create: (): CanvasSlideData => ({
      background: { color: "#0d0028", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Purple accent bar
        shape({ x: 0, y: 0, w: 100, h: 1.5, fill: "#7C4DFF", zIndex: 1 }),
        // Quiz label
        txt({ content: "KNOWLEDGE CHECK", x: 8, y: 5, w: 84, h: 8, fontSize: 16, fontWeight: 700, color: "#B39DDB", align: "center", zIndex: 10 }),
        // Instruction
        txt({ content: "Add a multiple choice question using the + button in the toolbar", x: 8, y: 35, w: 84, h: 30, fontSize: 24, fontWeight: 400, color: "rgba(255,255,255,0.3)", align: "center", zIndex: 10 }),
      ],
      notes: "Delete this placeholder text and add a Multiple Choice question block using the toolbar.",
    }),
  },

  // ── 11. Video Slide ───────────────────────────────────────────────────────
  {
    id: "content-video",
    name: "Video Slide",
    description: "Full-width video embed with title and caption",
    category: "content",
    previewColor: "#000000",
    create: (): CanvasSlideData => ({
      background: { color: "#000000", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Title bar
        shape({ x: 0, y: 0, w: 100, h: 14, fill: "#0F1C2E", zIndex: 1 }),
        txt({ content: "Video Title", x: 5, y: 2, w: 90, h: 10, fontSize: 28, fontWeight: 700, color: "#ffffff", align: "left", zIndex: 10 }),
        // Video placeholder
        {
          id: uuidv4(),
          type: "video",
          x: 5,
          y: 16,
          w: 90,
          h: 72,
          zIndex: 5,
          locked: false,
          url: "",
          provider: "youtube",
          autoplay: false,
          caption: "Add a caption or learning objective here",
        },
        // Caption
        txt({ content: "Add a caption or learning objective here", x: 5, y: 90, w: 90, h: 8, fontSize: 16, fontWeight: 400, color: "#90CAF9", align: "center", zIndex: 10 }),
      ],
      notes: "Paste a YouTube URL into the video element using the Properties panel on the right.",
    }),
  },

  // ── 12. Module Summary ────────────────────────────────────────────────────
  {
    id: "summary-module",
    name: "Module Summary",
    description: "End-of-module recap with key takeaways list",
    category: "summary",
    previewColor: "#0F1C2E",
    create: (): CanvasSlideData => ({
      background: { color: "#0F1C2E", imageUrl: null, overlayOpacity: 0, overlayColor: "#000" },
      elements: [
        // Top bar
        shape({ x: 0, y: 0, w: 100, h: 1.5, fill: "#1E90FF", zIndex: 1 }),
        // Label
        txt({ content: "MODULE SUMMARY", x: 8, y: 5, w: 84, h: 8, fontSize: 16, fontWeight: 700, color: "#90CAF9", align: "left", zIndex: 10 }),
        // Title
        txt({ content: "Key Takeaways", x: 8, y: 14, w: 84, h: 14, fontSize: 44, fontWeight: 900, color: "#ffffff", align: "left", zIndex: 10 }),
        // Divider
        shape({ x: 8, y: 30, w: 15, h: 0.8, fill: "#1E90FF", zIndex: 5 }),
        // Takeaway 1
        shape({ x: 8, y: 35, w: 1.5, h: 8, fill: "#1E90FF", borderRadius: 4, zIndex: 5 }),
        txt({ content: "Key takeaway one — what should learners remember?", x: 12, y: 35, w: 80, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Takeaway 2
        shape({ x: 8, y: 47, w: 1.5, h: 8, fill: "#1E90FF", borderRadius: 4, zIndex: 5 }),
        txt({ content: "Key takeaway two — another important point", x: 12, y: 47, w: 80, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Takeaway 3
        shape({ x: 8, y: 59, w: 1.5, h: 8, fill: "#1E90FF", borderRadius: 4, zIndex: 5 }),
        txt({ content: "Key takeaway three — reinforce the main message", x: 12, y: 59, w: 80, h: 8, fontSize: 20, fontWeight: 500, color: "#E3F2FD", align: "left", zIndex: 10 }),
        // Bottom CTA
        shape({ x: 0, y: 88, w: 100, h: 12, fill: "#0047AB", borderRadius: 0, zIndex: 1 }),
        txt({ content: "Proceed to the knowledge check when you are ready.", x: 8, y: 90, w: 84, h: 8, fontSize: 18, fontWeight: 500, color: "#ffffff", align: "center", zIndex: 10 }),
      ],
      notes: "Replace the takeaways with the 3 most important points from this module.",
    }),
  },
];

// ─── Category labels ──────────────────────────────────────────────────────────

/** Human-readable labels for each template category. */
const CATEGORY_LABELS: Record<SlideTemplate["category"], string> = {
  title: "Title Slides",
  content: "Content Slides",
  hazard: "Hazard Slides",
  procedure: "Procedure Slides",
  quiz: "Quiz Slides",
  summary: "Summary Slides",
};

/** Display order for categories in the picker. */
const CATEGORY_ORDER: SlideTemplate["category"][] = [
  "title",
  "content",
  "procedure",
  "hazard",
  "quiz",
  "summary",
];

// ─── Template mini-canvas preview ────────────────────────────────────────────

/**
 * Renders a miniature SVG preview of a slide template.
 *
 * Each template's `CanvasSlideData` elements are scaled down proportionally
 * into a 16:9 SVG viewport so the user can see the actual layout before
 * selecting the template.
 *
 * @param template - The slide template to preview
 */
function TemplateMiniPreview({ template }: { template: SlideTemplate }) {
  /** SVG viewport dimensions (16:9 aspect ratio). */
  const VW = 160;
  const VH = 90;

  /** Scale a percentage-based coordinate to SVG units. */
  const sx = (pct: number) => (pct / 100) * VW;
  const sy = (pct: number) => (pct / 100) * VH;

  const slide = template.create();
  const bg = slide.background;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Background fill */}
      <rect
        x={0} y={0} width={VW} height={VH}
        fill={bg.imageUrl ? "#334155" : bg.color}
      />

      {/* Render each element in z-index order */}
      {[...slide.elements]
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((el) => {
          const x = sx(el.x);
          const y = sy(el.y);
          const w = sx(el.w);
          const h = sy(el.h);
          const r = el.type === "shape" ? Math.min((el as { borderRadius?: number }).borderRadius ?? 0, 8) : 0;

          if (el.type === "shape") {
            const s = el as { fill?: string; stroke?: string; strokeWidth?: number; borderRadius?: number };
            return (
              <rect
                key={el.id}
                x={x} y={y} width={Math.max(w, 0.5)} height={Math.max(h, 0.5)}
                rx={r} ry={r}
                fill={s.fill ?? "#ffffff"}
                stroke={s.stroke}
                strokeWidth={s.stroke ? (s.strokeWidth ?? 1) * 0.3 : 0}
                opacity={0.9}
              />
            );
          }

          if (el.type === "text") {
            const t = el as { content?: string; color?: string; fontWeight?: number; fontSize?: number; align?: string };
            const lines = (t.content ?? "").split("\n").slice(0, 3);
            const lineH = Math.max(h / Math.max(lines.length, 1), 2);
            const anchor = t.align === "center" ? "middle" : t.align === "right" ? "end" : "start";
            const textX = t.align === "center" ? x + w / 2 : t.align === "right" ? x + w : x;
            const weight = (t.fontWeight ?? 400) >= 700 ? "bold" : "normal";
            const fSize = Math.max(Math.min((t.fontSize ?? 24) * (VW / 1600), 7), 2.5);

            return (
              <g key={el.id}>
                {lines.map((line, i) => (
                  <text
                    key={i}
                    x={textX}
                    y={y + lineH * i + lineH * 0.75}
                    textAnchor={anchor}
                    fill={t.color ?? "#ffffff"}
                    fontSize={fSize}
                    fontWeight={weight}
                    fontFamily="Inter, sans-serif"
                    clipPath={`url(#clip-${el.id})`}
                  >
                    {line}
                  </text>
                ))}
                <clipPath id={`clip-${el.id}`}>
                  <rect x={x} y={y} width={w} height={h} />
                </clipPath>
              </g>
            );
          }

          if (el.type === "image") {
            /* Image placeholder — show a subtle grid pattern */
            return (
              <g key={el.id}>
                <rect x={x} y={y} width={w} height={h} rx={Math.min(r, 6)} fill="#334155" opacity={0.8} />
                <line x1={x} y1={y} x2={x + w} y2={y + h} stroke="#475569" strokeWidth={0.4} />
                <line x1={x + w} y1={y} x2={x} y2={y + h} stroke="#475569" strokeWidth={0.4} />
                <rect x={x} y={y} width={w} height={h} rx={Math.min(r, 6)} fill="none" stroke="#64748b" strokeWidth={0.5} />
              </g>
            );
          }

          if (el.type === "video") {
            /* Video placeholder — dark rect with a play triangle */
            const cx = x + w / 2;
            const cy = y + h / 2;
            const ps = Math.min(w, h) * 0.18;
            return (
              <g key={el.id}>
                <rect x={x} y={y} width={w} height={h} rx={3} fill="#0f172a" />
                <polygon
                  points={`${cx - ps},${cy - ps} ${cx + ps},${cy} ${cx - ps},${cy + ps}`}
                  fill="rgba(255,255,255,0.35)"
                />
              </g>
            );
          }

          return null;
        })}
    </svg>
  );
}

// ─── TemplateLibrary component ────────────────────────────────────────────────

/**
 * Props for the TemplateLibrary component.
 */
export interface TemplateLibraryProps {
  /**
   * Callback fired when the user selects a template.
   * Receives a fresh copy of the template's `CanvasSlideData`.
   */
  onSelect: (data: CanvasSlideData) => void;
  /** Callback fired when the user dismisses the template picker. */
  onClose: () => void;
}

/**
 * TemplateLibrary — a modal-style template picker for the canvas slide editor.
 *
 * Displays all templates grouped by category. Each card shows a live SVG
 * mini-preview of the actual slide layout so users can see what they are
 * selecting before clicking.
 */
export function TemplateLibrary({ onSelect, onClose }: TemplateLibraryProps) {
  /** The currently active category filter. `null` = show all. */
  const [activeCategory, setActiveCategory] = useState<SlideTemplate["category"] | null>(null);

  /** Templates filtered by the active category. */
  const filteredTemplates: SlideTemplate[] = activeCategory
    ? SLIDE_TEMPLATES.filter((t) => t.category === activeCategory)
    : SLIDE_TEMPLATES;

  /** Group filtered templates by category for display. */
  const grouped: Partial<Record<SlideTemplate["category"], SlideTemplate[]>> = {};
  for (const template of filteredTemplates) {
    if (!grouped[template.category]) grouped[template.category] = [];
    grouped[template.category]!.push(template);
  }

  /** Category emoji icons for visual distinction. */
  const CATEGORY_EMOJI: Record<SlideTemplate["category"], string> = {
    title: "🏷️",
    content: "📄",
    procedure: "🔢",
    hazard: "⚠️",
    quiz: "🎯",
    summary: "✅",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Slide Templates</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {SLIDE_TEMPLATES.length} templates — click any to apply it as a new slide
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Category filter tabs — flex-wrap so they never overflow */}
        <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-gray-700 shrink-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0",
              activeCategory === null
                ? "bg-blue-600 text-white"
                : "bg-[#1a1f35] text-gray-300 hover:text-white border border-gray-600"
            )}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0",
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1f35] text-gray-300 hover:text-white border border-gray-600"
              )}
            >
              {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Template grid — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {CATEGORY_ORDER.filter((cat) => grouped[cat]).map((cat) => (
            <div key={cat}>
              {/* Category heading */}
              <h3 className="text-xs font-display font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span>{CATEGORY_EMOJI[cat]}</span>
                {CATEGORY_LABELS[cat]}
              </h3>
              {/* Template cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {grouped[cat]!.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelect(template.create());
                      onClose();
                    }}
                    className="group text-left rounded-xl overflow-hidden border border-gray-700 hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5"
                  >
                    {/* Live SVG mini-preview — 16:9 aspect ratio */}
                    <div className="w-full" style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                      <TemplateMiniPreview template={template} />
                    </div>

                    {/* Template info bar */}
                    <div className="p-2.5 bg-[#1a1f35] border-t border-gray-700">
                      <p className="text-xs font-display font-bold text-white truncate">{template.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-500">{SLIDE_TEMPLATES.length} templates available</p>
          <button
            onClick={onClose}
            className="text-sm font-display font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Build from scratch →
          </button>
        </div>
      </div>
    </div>
  );
}
