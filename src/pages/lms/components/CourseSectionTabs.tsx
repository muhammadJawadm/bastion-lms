/**
 * CourseSectionTabs — in-page sub-navigation for the "Courses" destination.
 * The Company Admin redesign folds Course Builder and Assignments into one
 * primary sidebar tab ("Courses"); this bar lets an admin switch between the
 * two underlying routes without returning to the sidebar. Each route stays
 * independent — this is a navigation affordance, not a merged component.
 */

import { Link } from "wouter";
import { BookOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export type CourseSection = "courses" | "assignments";

const SECTIONS: { id: CourseSection; label: string; href: string; icon: React.ElementType }[] = [
  { id: "courses", label: "My Courses", href: "/lms/courses", icon: BookOpen },
  { id: "assignments", label: "Assignments", href: "/lms/assignments", icon: ClipboardList },
];

export function CourseSectionTabs({ active }: { active: CourseSection }) {
  return (
    <div className="flex items-center gap-1 border-b border-white/10 mb-5 -mt-1">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const isActive = s.id === active;
        return (
          <Link key={s.id} href={s.href}>
            <div
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                isActive
                  ? "border-[#1E90FF] text-white"
                  : "border-transparent text-white/50 hover:text-white/80"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default CourseSectionTabs;
