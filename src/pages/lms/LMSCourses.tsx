/**
 * @file LMSCourses.tsx
 * @description Course Library page for the Bastion LMS (UI Prototype).
 *
 * This page serves two audiences depending on the active LMS role:
 *  - **Platform Admin / Client Admin** — Can create, edit, publish, archive, and assign courses.
 *  - **Employee (Learner)** — Can browse published courses and view their own enrollments.
 *
 * Data flow:
 *  - Runs entirely on static mock data (mockData.ts) — no tRPC, no network calls.
 *  - Client-side filtering is applied for search, category, and status.
 *
 * Sub-components defined in this file:
 *  - `CoverUploadZone`    — Drag-and-drop / click-to-upload image picker for course covers.
 *  - `CreateCourseModal`  — Modal form for creating a new course (title, description, cover image).
 *  - `CourseCard`         — Grid/list card showing course metadata and admin action menu.
 *  - `LMSCourses`         — Main page component (default export).
 */

import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Plus, BookOpen, Award, ChevronRight,
  X, Filter, Upload, Image as ImageIcon,
  GraduationCap, LayoutGrid, List, MoreHorizontal,
  Globe, Lock, Archive, ArchiveRestore, Pencil, Users, Loader2, Clock, ArrowRight,
  Copy, ArrowUpDown,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { CourseSectionTabs } from "./components/CourseSectionTabs";
import { toast } from "sonner";
import { coursesStore, addCourse, patchCourse, type MockCourse } from "./mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * Human-readable labels for each course category.
 * Keys match the `category` enum in `drizzle/schema.ts → courses`.
 */
const CATEGORY_LABELS: Record<string, string> = {
  construction: "Construction",
  maritime: "Maritime",
  electrical: "Electrical",
  utilities: "Utilities",
  general_industry: "General Industry",
  oil_gas: "Oil & Gas",
  manufacturing: "Manufacturing",
  other: "Other",
};

/** Tailwind badge classes per category, kept in the Bastion cobalt/vivid-blue family. */
const CATEGORY_COLORS: Record<string, string> = {
  construction: "bg-orange-400/15 text-orange-300",
  maritime: "bg-[#1E90FF]/15 text-[#7DD3FC]",
  electrical: "bg-yellow-400/15 text-yellow-300",
  utilities: "bg-purple-400/15 text-purple-300",
  general_industry: "bg-green-400/15 text-green-300",
  oil_gas: "bg-gray-400/15 text-gray-300",
  manufacturing: "bg-red-400/15 text-red-300",
  other: "bg-white/10 text-white/60",
};

/**
 * Fallback gradient backgrounds for courses that have no uploaded cover image.
 * Kept within the Bastion cobalt/navy/vivid-blue family so cards without a
 * cover still read as part of the same brand instead of arbitrary colors.
 */
const COVER_GRADIENTS: string[] = [
  "from-[#0047AB] to-[#0F1C2E]",
  "from-[#0F1C2E] to-[#1a2d4a]",
  "from-[#1E90FF] to-[#0047AB]",
  "from-[#0047AB] to-[#1565C0]",
  "from-[#0F1C2E] to-[#0047AB]",
  "from-[#1565C0] to-[#0F1C2E]",
];

/**
 * Returns a deterministic Tailwind gradient class string for a given course ID.
 * Uses modulo arithmetic so the gradient is stable across renders.
 */
function getCoverGradient(id: number): string {
  return COVER_GRADIENTS[id % COVER_GRADIENTS.length];
}

/** Short relative-time label for course card metadata (e.g. "Updated 3d ago"). */
function formatRelativeUpdated(date?: Date): string | null {
  if (!date) return null;
  const days = Math.round((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 30) return `Updated ${days}d ago`;
  const months = Math.round(days / 30);
  return `Updated ${months}mo ago`;
}

// ─── Cover Image Upload Zone ────────────────────────────────────────────────

interface CoverUploadZoneProps {
  value: string | null;
  onChange: (url: string | null, base64?: string, contentType?: string, fileName?: string) => void;
}

function CoverUploadZone({ value, onChange }: CoverUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  const handleFile = (file: File): void => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange(base64, base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden h-40",
        dragging ? "border-[#0047AB] bg-[#0047AB]/5" : "border-gray-200 bg-gray-50 hover:border-[#0047AB]/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {value ? (
        <>
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
              <Upload size={16} className="text-gray-400" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          </div>
          <p className="text-gray-400 text-xs text-center">Drag & drop or click to upload cover image</p>
        </div>
      )}
    </div>
  );
}

// ─── Create Course Modal ─────────────────────────────────────────────────────

interface CreateCourseModalProps {
  onClose: () => void;
  onCreated: (course: MockCourse) => void;
}

function CreateCourseModal({ onClose, onCreated }: CreateCourseModalProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Course title is required"); return; }

    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onCreated(addCourse({
        title: title.trim(),
        description: description.trim(),
        status: "draft",
        category: "construction",
        durationMinutes: 30,
        issuesCertificate: true,
        coverImageUrl: coverPreview,
        lessonCount: 0,
        enrollmentCount: 0,
      }));
      toast.success("Course created!");
    }, 500);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Course Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <CoverUploadZone
            value={coverPreview}
            onChange={(url) => setCoverPreview(url)}
          />

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Title <span className="text-gray-400 normal-case font-normal">(required)</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled course"
              className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a brief description"
              rows={3}
              className="resize-none focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20"
            />
          </div>

          <DialogFooter className="pt-2 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────

interface CourseCardCourse {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  category: string;
  durationMinutes?: number | null;
  issuesCertificate?: boolean | null;
  coverImageUrl?: string | null;
  lessonCount?: number;
  enrollmentCount?: number;
  updatedAt?: Date;
}

interface CourseCardProps {
  course: CourseCardCourse;
  isAdmin: boolean;
  onDuplicate?: () => void;
  onToggleArchive?: () => void;
}

function CourseCard({ course, isAdmin, onDuplicate, onToggleArchive }: CourseCardProps) {
  const gradient: string = getCoverGradient(course.id);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#0F1C2E] border border-white/10 hover:border-white/20 transition-all hover:shadow-xl hover:shadow-black/30">
      {/* Cover */}
      <Link href={isAdmin ? `/lms/builder/${course.id}` : `/lms/courses/${course.id}`}>
        <div className={cn("h-40 relative overflow-hidden bg-gradient-to-br", gradient)}>
          {course.coverImageUrl && (
            <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute top-3 left-3">
            {course.status === "published" ? (
              <Badge className="gap-1 bg-green-500/20 text-green-300 border-green-500/30 text-[10px] font-bold uppercase tracking-wide">
                <Globe size={9} /> Published
              </Badge>
            ) : course.status === "archived" ? (
              <Badge className="gap-1 bg-white/10 text-white/60 border-white/20 text-[10px] font-bold uppercase tracking-wide">
                <Archive size={9} /> Archived
              </Badge>
            ) : (
              <Badge className="gap-1 bg-yellow-400/20 text-yellow-300 border-yellow-400/30 text-[10px] font-bold uppercase tracking-wide">
                <Lock size={9} /> Draft
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <GraduationCap size={11} className="text-white/40" />
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Course</span>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white/30 hover:text-white p-1 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem asChild>
                  <Link href={`/lms/builder/${course.id}`} className="gap-2 text-xs cursor-pointer"><Pencil size={12} /> Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/lms/assignments?courseId=${course.id}`} className="gap-2 text-xs cursor-pointer"><Users size={12} /> Assign</Link>
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="gap-2 text-xs cursor-pointer">
                    <Copy size={12} /> Duplicate
                  </DropdownMenuItem>
                )}
                {onToggleArchive && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleArchive(); }} className="gap-2 text-xs cursor-pointer">
                    {course.status === "archived" ? <><ArchiveRestore size={12} /> Unarchive</> : <><Archive size={12} /> Archive</>}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Link href={isAdmin ? `/lms/builder/${course.id}` : `/lms/courses/${course.id}`}>
          <h3 className="text-white font-semibold text-sm leading-snug mb-1 hover:text-[#1E90FF] transition-colors line-clamp-2 cursor-pointer">
            {course.title}
          </h3>
        </Link>

        {course.description && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">{course.description}</p>
        )}

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
          {course.lessonCount !== undefined && (
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <BookOpen size={11} />
              <span>{course.lessonCount}</span>
            </div>
          )}
          {course.durationMinutes != null && (
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Clock size={11} />
              <span>{course.durationMinutes}m</span>
            </div>
          )}
          {course.enrollmentCount !== undefined && (
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Users size={11} />
              <span>{course.enrollmentCount}</span>
            </div>
          )}
          {course.issuesCertificate && (
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Award size={11} />
            </div>
          )}
          <div className="ml-auto">
            <Badge className={cn("border-transparent text-[10px] font-bold uppercase tracking-wide", CATEGORY_COLORS[course.category] ?? "bg-white/10 text-white/60")}>
              {CATEGORY_LABELS[course.category] ?? course.category}
            </Badge>
          </div>
        </div>
        {formatRelativeUpdated(course.updatedAt) && (
          <div className="text-white/30 text-[10px] mt-1.5">{formatRelativeUpdated(course.updatedAt)}</div>
        )}
      </div>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#0F1C2E] border border-white/10">
      <Skeleton className="h-40 w-full bg-white/5 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16 bg-white/5" />
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        <Skeleton className="h-3 w-full bg-white/5" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LMSCourses() {
  const { role, setRole } = useLMS();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated" | "title" | "status">("updated");
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [courses, setCourses] = useState<MockCourse[]>(coursesStore);

  const refreshCourses = () => setCourses([...coursesStore]);

  const isAdmin: boolean = role === "platform-admin" || role === "client-admin";
  // Employees/demo viewers only see published courses, same as the real app.
  const visibleCourses = isAdmin ? courses : courses.filter((c) => c.status === "published");
  const isLoading = false;

  const filtered = visibleCourses
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = c.title.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || c.category === filterCategory;
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      // "updated" (default) — most recently updated first
      return (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    });

  function handleDuplicateCourse(course: MockCourse) {
    addCourse({
      title: `${course.title} (Copy)`,
      description: course.description,
      status: "draft",
      category: course.category,
      durationMinutes: course.durationMinutes,
      issuesCertificate: course.issuesCertificate,
      coverImageUrl: course.coverImageUrl,
      lessonCount: course.lessonCount,
      enrollmentCount: 0,
    });
    refreshCourses();
    toast.success("Course duplicated as a draft");
  }

  function handleToggleArchive(course: MockCourse) {
    const nextStatus = course.status === "archived" ? "draft" : "archived";
    patchCourse(course.id, { status: nextStatus });
    refreshCourses();
    toast.success(nextStatus === "archived" ? "Course archived" : "Course restored to draft");
  }

  return (
    <LMSLayout
      title="Courses"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Courses" }]}
      role={role}
      onRoleChange={setRole}
    >
      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={(course) => {
            // Route straight into the Course Builder — no detour back to this list.
            setShowCreate(false);
            navigate(`/lms/builder/${course.id}`);
          }}
        />
      )}

      <CourseSectionTabs active="courses" />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">My Courses</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-white/50 text-sm">{filtered.length} course{filtered.length !== 1 ? "s" : ""}</p>
              <Link href="/lms/reports">
                <span className="flex items-center gap-1 text-[#1E90FF] text-xs font-semibold hover:underline cursor-pointer">
                  View Full Report <ArrowRight size={11} />
                </span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60")}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60")}
              >
                <List size={15} />
              </button>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreate(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm gap-2 h-auto py-2 px-4">
                <Plus size={15} /> Create Course
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-white/30 flex-shrink-0" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white/70 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/70 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={13} className="text-white/30 flex-shrink-0" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/70 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="title">Title (A–Z)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Course Grid / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isAdmin={isAdmin}
                  onDuplicate={isAdmin ? () => handleDuplicateCourse(course) : undefined}
                  onToggleArchive={isAdmin ? () => handleToggleArchive(course) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((course) => (
                <Link key={course.id} href={isAdmin ? `/lms/builder/${course.id}` : `/lms/courses/${course.id}`}>
                  <div className="flex items-center gap-4 bg-[#0F1C2E] border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all group">
                    <div className={cn("w-16 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gradient-to-br", getCoverGradient(course.id))}>
                      {course.coverImageUrl && (
                        <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-[#1E90FF] transition-colors">{course.title}</p>
                      {course.description && (
                        <p className="text-white/40 text-xs truncate mt-0.5">{course.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={cn("border-transparent text-[10px] font-bold uppercase tracking-wide", CATEGORY_COLORS[course.category] ?? "bg-white/10 text-white/60")}>
                        {CATEGORY_LABELS[course.category] ?? course.category}
                      </Badge>
                      {isAdmin && (
                        <Badge className={cn(
                          "border-transparent text-[10px] font-bold uppercase tracking-wide",
                          course.status === "published" ? "bg-green-500/20 text-green-300" :
                          course.status === "archived" ? "bg-white/10 text-white/60" :
                          "bg-yellow-400/20 text-yellow-300"
                        )}>
                          {course.status}
                        </Badge>
                      )}
                      <ChevronRight size={14} className="text-white/30 group-hover:text-[#1E90FF] transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <Empty className="border-none py-24">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white/5 size-16">
                <BookOpen size={28} className="text-white/20" />
              </EmptyMedia>
              <EmptyTitle className="text-white font-bold text-lg">
                {search || filterCategory !== "all" ? "No Courses Found" : "No Courses Yet"}
              </EmptyTitle>
              <EmptyDescription className="text-white/50">
                {search || filterCategory !== "all"
                  ? "Try adjusting your search or filters."
                  : isAdmin
                  ? "Create your first course to get started."
                  : "No courses are available yet. Check back soon."}
              </EmptyDescription>
            </EmptyHeader>
            {isAdmin && !search && filterCategory === "all" && (
              <EmptyContent>
                <Button onClick={() => setShowCreate(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm gap-2 h-auto py-2.5 px-5">
                  <Plus size={15} /> Create First Course
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </LMSLayout>
  );
}
