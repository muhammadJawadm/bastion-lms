/**
 * @file LMSCourseBuilder.tsx
 * @description Admin-only Course Builder index page for the Bastion LMS.
 *
 * Sub-components defined in this file:
 *  - `CoverUploadZone`    — Drag-and-drop / click-to-upload image picker.
 *  - `CreateCourseModal`  — Modal form for creating a new course.
 *  - `BuilderCourseCard`  — Card component for the builder's course grid/list.
 *  - `LMSCourseBuilder`   — Main page component (default export).
 */

import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Plus, BookOpen, Loader2, X, Upload, Image as ImageIcon,
  GraduationCap, LayoutGrid, List, MoreHorizontal,
  Globe, Lock, Archive, Pencil, Trash2, Clock,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Fallback gradient backgrounds for courses that have no uploaded cover image.
 * A deterministic gradient is selected based on `course.id % COVER_GRADIENTS.length`
 * so each course always gets the same colour even after a page refresh.
 */
const COVER_GRADIENTS: string[] = [
  "from-blue-600 to-indigo-800",
  "from-slate-600 to-slate-800",
  "from-teal-600 to-cyan-800",
  "from-violet-600 to-purple-800",
  "from-orange-600 to-red-800",
  "from-emerald-600 to-green-800",
];

/**
 * Returns a deterministic Tailwind gradient class string for a given course ID.
 * Uses modulo arithmetic so the gradient is stable across renders.
 *
 * @param id - The numeric course ID from the database.
 * @returns A Tailwind `from-{color} to-{color}` gradient class string.
 */
function getCoverGradient(id: number): string {
  return COVER_GRADIENTS[id % COVER_GRADIENTS.length];
}

// ─── Cover Image Upload Zone ────────────────────────────────────────────────

/**
 * Props for the `CoverUploadZone` component.
 */
interface CoverUploadZoneProps {
  /** Current preview URL (base64 data URL while editing). `null` = no image selected. */
  value: string | null;
  /**
   * Called whenever the user selects a new image.
   * @param previewUrl   - Base64 data URL for the live preview.
   * @param base64       - Raw base64 string (without the data URL prefix) for upload.
   * @param contentType  - MIME type of the selected file (e.g. `"image/jpeg"`).
   * @param fileName     - Original file name (e.g. `"cover.jpg"`).
   */
  onChange: (previewUrl: string, base64?: string, contentType?: string, fileName?: string) => void;
}

/**
 * Drag-and-drop / click-to-upload image picker for course cover images.
 *
 * Constraints:
 *  - Accepts image files only (`image/*` MIME type).
 *  - Maximum file size: 5 MB.
 *  - Shows a live preview of the selected image.
 *
 * The component reads the file as a base64 data URL so it can be passed
 * to `trpc.uploads.uploadBase64` without a separate multipart form.
 */
function CoverUploadZone({
  value,
  onChange,
}: CoverUploadZoneProps) {
  /** Hidden file input element — triggered programmatically on zone click. */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates and reads a `File` object into a base64 data URL.
   * Calls `onChange` with the result so the parent can store the preview and upload payload.
   *
   * @param file - The `File` object selected or dropped by the user.
   */
  const handleFile = useCallback((file: File): void => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Strip the "data:<mime>;base64," prefix to get the raw base64 string
      const base64 = dataUrl.split(",")[1];
      onChange(dataUrl, base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  /**
   * Handles the `drop` event on the upload zone.
   * Extracts the first dropped file and passes it to `handleFile`.
   */
  const handleDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className="relative w-full h-44 rounded-xl border-2 border-dashed border-[#3a3f5c] bg-[#252a45] overflow-hidden cursor-pointer hover:border-[#5b5fc7] transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      {/* Hidden file input — triggered by clicking the zone */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        /* Show live preview when an image has been selected */
        <img src={value} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        /* Placeholder UI when no image is selected */
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f35] border border-[#3a3f5c] flex items-center justify-center">
              <Upload size={18} className="text-[#5b5fc7]" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1a1f35] border border-[#3a3f5c] flex items-center justify-center">
              <ImageIcon size={18} className="text-[#5b5fc7]" />
            </div>
          </div>
          <p className="text-[#6b7db3] text-xs">Upload or drag a cover image</p>
        </div>
      )}
    </div>
  );
}

// ─── Create Course Modal ─────────────────────────────────────────────────────

/**
 * Props for the `CreateCourseModal` component.
 */
interface CreateCourseModalProps {
  /** Called when the user dismisses the modal without creating a course. */
  onClose: () => void;
  /**
   * Called after the course has been successfully created.
   * @param id - The database ID of the newly created course.
   */
  onCreated: (id: number) => void;
}

/**
 * Modal dialog for creating a new course from the Course Builder index page.
 *
 * Creation flow:
 *  1. User fills in title (required) and optional description + cover image.
 *  2. If a cover image was selected, `trpc.uploads.uploadBase64` uploads it to S3 first.
 *  3. `trpc.courses.create` is called with the title, description, and CDN cover URL.
 *  4. `onCreated(id)` is called so the parent can navigate to the Course Builder editor.
 *
 * Unlike `LMSCourses.tsx`'s modal, this version uploads the cover BEFORE creating the
 * course (rather than after), so the cover URL is included in the initial create call.
 */
function CreateCourseModal({
  onClose,
  onCreated,
}: CreateCourseModalProps) {
  /** Controlled value for the course title input. */
  const [title, setTitle] = useState<string>("");

  /** Controlled value for the course description textarea. */
  const [description, setDescription] = useState<string>("");

  /** Base64 data URL shown in the `CoverUploadZone` preview. `null` = no image selected. */
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  /** Raw base64 string (without data URL prefix) sent to the upload mutation. */
  const [coverBase64, setCoverBase64] = useState<string | null>(null);

  /** MIME type of the selected cover image (e.g. `"image/jpeg"`, `"image/png"`). */
  const [coverContentType, setCoverContentType] = useState<string>("image/jpeg");

  /** Original file name of the selected cover image (e.g. `"cover.jpg"`). */
  const [coverFileName, setCoverFileName] = useState<string>("cover.jpg");

  /** tRPC query utilities — used to invalidate the course list cache after creation. */
  const utils = trpc.useUtils();

  /** Mutation for uploading a base64-encoded image to S3. Returns a CDN URL. */
  const uploadFile = trpc.uploads.uploadBase64.useMutation();

  /**
   * Mutation for creating a new course record.
   * On success: invalidates the course list cache and calls `onCreated` with the new ID.
   */
  const createCourse = trpc.courses.create.useMutation({
    onSuccess: (course) => {
      utils.courses.list.invalidate();
      toast.success("Course created!");
      onCreated(course.id);
    },
    onError: (err) => toast.error(err.message),
  });

  /**
   * True while either the upload or the create mutation is in flight.
   * Used to disable the submit button and show a loading spinner.
   */
  const isPending: boolean = uploadFile.isPending || createCourse.isPending;

  /**
   * Form submission handler.
   * Validates the title, optionally uploads the cover image, then creates the course.
   *
   * @param e - The React form submit event.
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a course title");
      return;
    }

    // Upload cover image first (if one was selected) so the URL is ready for the create call
    let coverImageUrl: string | undefined;
    if (coverBase64) {
      try {
        const result = await uploadFile.mutateAsync({
          base64: coverBase64,
          contentType: coverContentType,
          fileName: coverFileName,
          folder: "covers",
        });
        coverImageUrl = result.url;
      } catch {
        // Cover upload failure is fatal here — abort so the user can retry
        toast.error("Failed to upload cover image");
        return;
      }
    }

    // Create the course with the (optional) cover URL already set
    createCourse.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      coverImageUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1f35] rounded-2xl shadow-2xl w-full max-w-lg border border-[#2a2f4a] max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2f4a]">
          <h2 className="text-white font-bold text-xl">Course details</h2>
          <button onClick={onClose} className="text-[#6b7db3] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cover image upload zone */}
          <CoverUploadZone
            value={coverPreview}
            onChange={(url, base64, contentType, fileName) => {
              setCoverPreview(url);
              setCoverBase64(base64 ?? null);
              if (contentType) setCoverContentType(contentType);
              if (fileName) setCoverFileName(fileName);
            }}
          />

          {/* Title field (required) */}
          <div>
            <label className="block text-white text-sm font-semibold mb-1.5">
              Title <span className="text-[#6b7db3] font-normal">(required)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled course"
              className="w-full bg-[#252a45] border border-[#3a3f5c] rounded-xl px-4 py-3 text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]/30 transition-colors"
            />
          </div>

          {/* Description field (optional) */}
          <div>
            <label className="block text-white text-sm font-semibold mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a brief description"
              rows={3}
              className="w-full bg-[#252a45] border border-[#3a3f5c] rounded-xl px-4 py-3 text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]/30 transition-colors resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#3a3f5c] text-[#8892b0] font-semibold py-3 rounded-xl hover:bg-[#252a45] transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#5b5fc7] hover:bg-[#6b6fd7] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Builder Course Card ─────────────────────────────────────────────────────

/**
 * Shape of the course data expected by `BuilderCourseCard`.
 * A subset of the full `Course` type — only the fields needed for the builder card.
 */
interface BuilderCourse {
  /** Database ID — used to derive the fallback gradient and build navigation links. */
  id: number;
  /** Course title displayed as the card heading. */
  title: string;
  /** Optional short description shown below the title (truncated to 2 lines). */
  description?: string | null;
  /** Publication status: `"draft"` | `"published"` | `"archived"`. */
  status: string;
  /** Industry category key (e.g. `"construction"`, `"maritime"`). */
  category: string;
  /** Estimated duration in minutes — shown with a clock icon if set. */
  durationMinutes?: number | null;
  /** CDN URL for the course cover image. Falls back to a gradient if `null`. */
  coverImageUrl?: string | null;
  /** Number of lessons in the course — shown with a book icon. */
  lessonCount?: number;
}

/**
 * Course card component for the Course Builder index page.
 *
 * Always links to `/lms/builder/:id` (the Course Builder editor).
 * Provides an action menu with:
 *  - **Edit** — navigates to the builder.
 *  - **Delete** — prompts for confirmation then calls `trpc.courses.delete`.
 *
 * Note: `trpc.courses.delete` is accessed via optional chaining (`?.useMutation?.()`)
 * because the procedure may not be defined in all router configurations. The delete
 * button is only rendered when the mutation is available.
 */
function BuilderCourseCard({ course }: { course: BuilderCourse }) {
  /** Fallback gradient class string for courses without a cover image. */
  const gradient: string = getCoverGradient(course.id);

  /** tRPC query utilities — used to invalidate the course list after deletion. */
  const utils = trpc.useUtils();

  /**
   * Optional delete mutation.
   * Uses optional chaining because `trpc.courses.delete` may not exist in all environments.
   * The delete button is only shown when this mutation is available.
   */
  const deleteCourse = trpc.courses.delete?.useMutation?.({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("Course deleted");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  /** Whether the `⋯` action menu is currently open. */
  const [showMenu, setShowMenu] = useState<boolean>(false);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#1a1f35] border border-[#2a2f4a] hover:border-[#3a3f5c] transition-all hover:shadow-xl hover:shadow-black/30">
      {/* Cover image / gradient with hover overlay */}
      <Link href={`/lms/builder/${course.id}`}>
        <div className={cn("h-44 relative overflow-hidden bg-linear-to-br", gradient)}>
          {course.coverImageUrl && (
            <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
          )}
          {/* Publication status badge (top-left) */}
          <div className="absolute top-3 left-3">
            {course.status === "published" ? (
              <span className="flex items-center gap-1 bg-green-500/20 text-green-300 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-green-500/30">
                <Globe size={9} /> Published
              </span>
            ) : course.status === "archived" ? (
              <span className="flex items-center gap-1 bg-gray-500/20 text-gray-300 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-gray-500/30">
                <Archive size={9} /> Archived
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-yellow-500/30">
                <Lock size={9} /> Draft
              </span>
            )}
          </div>
          {/* "Edit Course" overlay — visible on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 bg-[#5b5fc7] text-white text-sm font-semibold px-4 py-2 rounded-lg">
              <Pencil size={14} /> Edit Course
            </div>
          </div>
        </div>
      </Link>

      {/* Card body: title, description, action menu */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Category label */}
            <div className="flex items-center gap-1.5 mb-1">
              <GraduationCap size={11} className="text-[#5b5fc7] shrink-0" />
              <span className="text-[#5b5fc7] text-[10px] font-bold uppercase tracking-wider">Course</span>
            </div>
            {/* Course title — links to builder */}
            <Link href={`/lms/builder/${course.id}`}>
              <h3 className="text-white font-semibold text-sm leading-snug hover:text-[#8892b0] transition-colors line-clamp-2">
                {course.title}
              </h3>
            </Link>
            {course.description && (
              <p className="text-[#6b7db3] text-xs mt-1 line-clamp-2">{course.description}</p>
            )}
          </div>

          {/* Action menu (⋯ button) */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 text-[#4a5070] hover:text-white transition-colors rounded"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-20 bg-[#1a1f35] border border-[#2a2f4a] rounded-xl shadow-2xl py-1 w-40">
                {/* Edit action */}
                <Link href={`/lms/builder/${course.id}`}>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#8892b0] hover:text-white hover:bg-[#252a45] transition-colors">
                    <Pencil size={13} /> Edit
                  </button>
                </Link>
                {/* Delete action — only shown when the delete mutation is available */}
                {deleteCourse && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm("Delete this course? This cannot be undone.")) {
                        deleteCourse.mutate({ id: course.id });
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#252a45] transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: lesson count and duration */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#2a2f4a]">
          <span className="flex items-center gap-1 text-[#4a5070] text-xs">
            <BookOpen size={11} /> {course.lessonCount ?? 0} lesson{(course.lessonCount ?? 0) !== 1 ? "s" : ""}
          </span>
          {course.durationMinutes && (
            <span className="flex items-center gap-1 text-[#4a5070] text-xs">
              <Clock size={11} /> {course.durationMinutes} min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

/**
 * Course Builder index page — the admin's starting point for building course content.
 *
 * Behaviour:
 *  - Fetches all courses (draft + published) via `trpc.courses.list`.
 *  - Supports grid and list view modes with a live search filter.
 *  - Provides a "Create course" button that opens `CreateCourseModal`.
 *  - After creation, navigates directly to the Course Builder editor (`/lms/builder/:id`).
 *
 * This page is intended for admin roles only. Non-admin users should be redirected
 * to `LMSCourses` (the learner-facing course library) instead.
 */
export default function LMSCourseBuilder() {
  /** Current LMS role from context — used for the role switcher in the layout. */
  const { role, setRole } = useLMS();

  /** Wouter navigation function — used to redirect to the builder after course creation. */
  const [, navigate] = useLocation();

  /** Whether the Create Course modal is currently open. */
  const [showCreate, setShowCreate] = useState<boolean>(false);

  /** Controlled search input value — filters courses by title. */
  const [search, setSearch] = useState<string>("");

  /** Current display mode: `"grid"` (card layout) or `"list"` (compact rows). */
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /**
   * Fetches all courses for the current admin.
   * The result includes draft, published, and archived courses.
   */
  const { data: courses, isLoading } = trpc.courses.list.useQuery();

  /**
   * Client-side filtered subset of `courses`.
   * Applies the search text filter (case-insensitive title match).
   */
  const filtered = (courses ?? []).filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <LMSLayout
      title="Course Builder"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Course Builder" }]}
      role={role}
      onRoleChange={setRole}
    >
      {/* Create Course modal — rendered at the top level so it overlays the page */}
      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            // Navigate directly to the builder editor for the newly created course
            navigate(`/lms/builder/${id}`);
          }}
        />
      )}

      <div className="space-y-5">
        {/* Page header: title, course count, view toggle, create button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-bold text-2xl">Course Builder</h2>
            <p className="text-[#6b7db3] text-sm mt-0.5">
              {filtered.length} course{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Grid / List view toggle */}
            <div className="flex items-center bg-[#1a1f35] border border-[#2a2f4a] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-[#2a2f4a] text-white" : "text-[#4a5070] hover:text-[#8892b0]")}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-[#2a2f4a] text-white" : "text-[#4a5070] hover:text-[#8892b0]")}
              >
                <List size={15} />
              </button>
            </div>
            {/* Create course CTA */}
            <button
              onClick={() => setShowCreate(true)}
              className="bg-[#5b5fc7] hover:bg-[#6b6fd7] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={15} /> Create course
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5070]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1a1f35] border border-[#2a2f4a] rounded-lg text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]/20 transition-colors"
          />
        </div>

        {/* Course Grid / List / Loading / Empty states */}
        {isLoading ? (
          /* Loading spinner while the course list query is in flight */
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[#5b5fc7]" />
          </div>
        ) : filtered.length > 0 ? (
          viewMode === "grid" ? (
            /* Grid view: responsive 1–4 column layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((course) => (
                <BuilderCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            /* List view: compact rows with thumbnail, title, status, and edit icon */
            <div className="space-y-2">
              {filtered.map((course) => (
                <Link key={course.id} href={`/lms/builder/${course.id}`}>
                  <div className="flex items-center gap-4 bg-[#1a1f35] border border-[#2a2f4a] hover:border-[#3a3f5c] rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer">
                    {/* Thumbnail */}
                    <div className={cn("w-16 h-12 rounded-lg shrink-0 bg-linear-to-br overflow-hidden", getCoverGradient(course.id))}>
                      {course.coverImageUrl && (
                        <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    {/* Title and description */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{course.title}</div>
                      {course.description && (
                        <div className="text-[#6b7db3] text-xs mt-0.5 truncate">{course.description}</div>
                      )}
                    </div>
                    {/* Metadata: lesson count, status badge, edit icon */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[#4a5070] text-xs">{course.lessonCount ?? 0} lessons</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full",
                        course.status === "published" ? "bg-green-500/20 text-green-300" :
                        course.status === "archived" ? "bg-gray-500/20 text-gray-300" :
                        "bg-yellow-500/20 text-yellow-300"
                      )}>
                        {course.status}
                      </span>
                      <Pencil size={14} className="text-[#4a5070]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          /* Empty state — shown when no courses exist or the search yields no results */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1f35] border border-[#2a2f4a] flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-[#3a3f5c]" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No courses yet</h3>
            <p className="text-[#6b7db3] text-sm mb-6 max-w-sm">
              Create your first course to start building training content for your team.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-[#5b5fc7] hover:bg-[#6b6fd7] text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Create your first course
            </button>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
