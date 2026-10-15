/**
 * LMS Course Library — browse ready-made Bastion courses and add them to
 * the company. Deliberately separate from "Courses" (My Courses) in
 * naming, breadcrumb, content, and actions per the Company Admin redesign
 * brief — this page is read-mostly; the only write action is "Add to
 * Company", which calls `POST /courses/library/:id/add-to-company`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, BookOpen, Clock, CheckCircle2, Library, Filter, Loader2, Eye, Award, GraduationCap } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import { getCourseLibrary, addLibraryCourseToCompany, ApiError, type Course } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type DurationFilter = "all" | "short" | "medium" | "long";

function matchesDuration(minutes: number, filter: DurationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "short") return minutes < 30;
  if (filter === "medium") return minutes >= 30 && minutes <= 60;
  return minutes > 60;
}

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

function LibraryCard({ course, alreadyAdded, onAdd, onPreview, isAdding }: {
  course: Course;
  alreadyAdded: boolean;
  onAdd: () => void;
  onPreview: () => void;
  isAdding: boolean;
}) {
  return (
    <div className="bg-[#0F1C2E] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#0047AB]/15 flex items-center justify-center flex-shrink-0">
          <Library size={18} className="text-[#1E90FF]" />
        </div>
        <Badge className="border-transparent text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white/60">
          {(course.category && CATEGORY_LABELS[course.category]) ?? course.category ?? "Other"}
        </Badge>
      </div>
      <div>
        <button onClick={onPreview} className="text-left">
          <h3 className="text-white font-semibold text-sm leading-snug mb-1 hover:text-[#1E90FF] transition-colors">{course.title}</h3>
        </button>
        <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{course.description}</p>
      </div>
      <div className="flex items-center gap-3 text-white/40 text-xs pt-2 mt-auto border-t border-white/10">
        <span className="flex items-center gap-1"><BookOpen size={11} /> {course.lessonCount}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {course.durationMinutes}m</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onPreview}
          variant="outline"
          className="h-auto py-2 px-3 border-white/15 text-white/70 hover:text-white hover:bg-white/10 bg-transparent text-xs font-bold uppercase tracking-wide gap-1.5"
        >
          <Eye size={13} />
        </Button>
        {alreadyAdded ? (
          <Button disabled variant="outline" className="flex-1 h-auto py-2 border-green-500/30 text-green-400 bg-green-500/10 text-xs font-bold uppercase tracking-wide gap-1.5">
            <CheckCircle2 size={13} /> Added
          </Button>
        ) : (
          <Button
            onClick={onAdd}
            disabled={isAdding}
            className="flex-1 h-auto py-2 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide gap-1.5"
          >
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : "Add to Company"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ course, alreadyAdded, onAdd, isAdding, onClose }: {
  course: Course;
  alreadyAdded: boolean;
  onAdd: () => void;
  isAdding: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <Badge className="w-fit mb-2 border-transparent text-[10px] font-bold uppercase tracking-wide bg-[#0047AB]/10 text-[#0047AB]">
            {(course.category && CATEGORY_LABELS[course.category]) ?? course.category ?? "Other"}
          </Badge>
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">{course.title}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#F4F6F9] rounded-lg p-3 text-center">
              <BookOpen size={16} className="text-[#0047AB] mx-auto mb-1" />
              <div className="font-display font-bold text-[#0F1C2E] text-sm">{course.lessonCount}</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wide">Lessons</div>
            </div>
            <div className="bg-[#F4F6F9] rounded-lg p-3 text-center">
              <Clock size={16} className="text-[#0047AB] mx-auto mb-1" />
              <div className="font-display font-bold text-[#0F1C2E] text-sm">{course.durationMinutes}m</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wide">Duration</div>
            </div>
            <div className="bg-[#F4F6F9] rounded-lg p-3 text-center">
              <Award size={16} className="text-[#0047AB] mx-auto mb-1" />
              <div className="font-display font-bold text-[#0F1C2E] text-sm">{course.issuesCertificate ? "Yes" : "No"}</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wide">Certificate</div>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-2 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
            Close
          </Button>
          {alreadyAdded ? (
            <Button disabled className="flex-1 h-auto py-3 bg-green-100 text-green-700 font-bold text-sm uppercase tracking-wide gap-2">
              <CheckCircle2 size={14} /> Already Added
            </Button>
          ) : (
            <Button onClick={onAdd} disabled={isAdding} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isAdding ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : <><GraduationCap size={14} /> Add to Company</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LMSCourseLibrary() {
  const { role, setRole, effectiveCompanyId, user } = useLMS();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDuration, setFilterDuration] = useState<DurationFilter>("all");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [library, setLibrary] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    if (!effectiveCompanyId) {
      setLibrary([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getCourseLibrary();
      setLibrary(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load the course library.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const filtered = useMemo(() => {
    return library.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = c.title.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || c.category === filterCategory;
      const matchDuration = matchesDuration(c.durationMinutes ?? 0, filterDuration);
      return matchSearch && matchCat && matchDuration;
    });
  }, [library, search, filterCategory, filterDuration]);

  async function handleAdd(course: Course) {
    if (!effectiveCompanyId || !user?.id) return;
    setAddingId(course._id);
    try {
      await addLibraryCourseToCompany(course._id);
      await loadLibrary();
      toast.success(`"${course.title}" added to your Courses as a draft`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't add that course.");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <LMSLayout
      title="Course Library"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Course Library" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-extrabold text-white text-3xl uppercase">Course Library</h2>
          <p className="text-white/50 text-sm mt-0.5">
            Ready-made Bastion courses — add any of them to{" "}
            <Link href="/lms/courses"><span className="text-[#1E90FF] hover:underline cursor-pointer">My Courses</span></Link>{" "}
            to start assigning them to your team.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search the library..."
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
            <Select value={filterDuration} onValueChange={(v) => setFilterDuration(v as DurationFilter)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white/70 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Duration</SelectItem>
                <SelectItem value="short">Under 30 min</SelectItem>
                <SelectItem value="medium">30–60 min</SelectItem>
                <SelectItem value="long">Over 60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {previewCourse && (
          <PreviewModal
            course={previewCourse}
            alreadyAdded={!!previewCourse.added}
            isAdding={addingId === previewCourse._id}
            onAdd={() => handleAdd(previewCourse)}
            onClose={() => setPreviewCourse(null)}
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((course) => (
              <LibraryCard
                key={course._id}
                course={course}
                alreadyAdded={!!course.added}
                isAdding={addingId === course._id}
                onAdd={() => handleAdd(course)}
                onPreview={() => setPreviewCourse(course)}
              />
            ))}
          </div>
        ) : (
          <Empty className="border-none py-24">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white/5 size-16">
                <Library size={28} className="text-white/20" />
              </EmptyMedia>
              <EmptyTitle className="text-white font-bold text-lg">No Courses Found</EmptyTitle>
              <EmptyDescription className="text-white/50">Try adjusting your search or category filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </LMSLayout>
  );
}
