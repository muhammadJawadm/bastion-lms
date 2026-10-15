/**
 * LMS Assignments — Client Admin view
 * Assign training to employees, view enrollment status. Wired to the real
 * backend (`src/lib/api.ts`) — Enrollments + Courses + People, all scoped to
 * the caller's own company automatically.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Clock, CheckCircle2, AlertTriangle, Users, BookOpen, Loader2 } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { CourseSectionTabs } from "./components/CourseSectionTabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getCourses, getCompanyPeople, getEnrollments, createEnrollment,
  ApiError, type Course, type CompanyPerson, type EnrollmentRecord,
} from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  assigned: { label: "Not Started", color: "bg-gray-100 text-gray-500" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Complete", color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
  waived: { label: "Waived", color: "bg-purple-100 text-purple-600" },
};

function initialsOf(value: string): string {
  return value.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AssignModal({
  courses, people, open, onClose, onAssigned,
}: {
  courses: Course[];
  people: CompanyPerson[];
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [isPending, setIsPending] = useState(false);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const ids = people.map((p) => p._id);
    setSelectedUsers(ids.length === selectedUsers.length ? [] : ids);
  };

  const handleAssign = async () => {
    if (!selectedCourse) { toast.error("Select a course"); return; }
    if (selectedUsers.length === 0) { toast.error("Select at least one employee"); return; }
    setIsPending(true);
    try {
      await Promise.all(selectedUsers.map((userId) =>
        createEnrollment({ courseId: selectedCourse, userId, dueDate: dueDate || undefined })
      ));
      onAssigned();
      toast.success(`Assigned to ${selectedUsers.length} employee(s)`);
      setSelectedCourse(""); setSelectedUsers([]); setDueDate("");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't assign training.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left sticky top-0 bg-white z-10">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Assign Training</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Course *</Label>
            <Select value={selectedCourse || undefined} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20">
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Due Date (optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Assign To *</Label>
              <button onClick={selectAll} className="text-xs text-[#0047AB] font-bold hover:text-[#1E90FF]">
                {selectedUsers.length === people.length && people.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
              {people.map((p) => (
                <label key={p._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={selectedUsers.includes(p._id)}
                    onCheckedChange={() => toggleUser(p._id)}
                    className="data-[state=checked]:bg-[#0047AB] data-[state=checked]:border-[#0047AB]"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{p.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{p.email}</div>
                  </div>
                </label>
              ))}
              {people.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">No employees found</div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isPending}
              className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : `Assign to ${selectedUsers.length} Employee${selectedUsers.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LMSAssignments() {
  const { role, setRole } = useLMS();
  const [showModal, setShowModal] = useState(false);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [people, setPeople] = useState<CompanyPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [enrollRes, courseRes, peopleRes] = await Promise.all([
        getEnrollments(),
        getCourses(),
        getCompanyPeople({ role: "user" }),
      ]);
      setEnrollments(enrollRes.data);
      setCourses(courseRes.data);
      setPeople(peopleRes.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load assignments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const employeeById = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    people.forEach((p) => map.set(p._id, { name: p.name, email: p.email }));
    return map;
  }, [people]);

  const courseById = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => map.set(c._id, c.title));
    return map;
  }, [courses]);

  const stats = useMemo(() => ({
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === "in_progress" || e.status === "assigned").length,
    completed: enrollments.filter((e) => e.status === "completed").length,
    overdue: enrollments.filter((e) => e.status === "overdue").length,
  }), [enrollments]);

  return (
    <LMSLayout
      title="Assignments"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Assignments" }]}
      role={role}
      onRoleChange={setRole}
    >
      <AssignModal courses={courses} people={people} open={showModal} onClose={() => setShowModal(false)} onAssigned={loadAll} />

      <CourseSectionTabs active="assignments" />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">Training Assignments</h2>
            <p className="text-white/60 text-sm mt-0.5">{stats.active} active assignments</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
            <Plus className="w-4 h-4" /> Assign Training
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: BookOpen, color: "text-[#0047AB]" },
            { label: "Active", value: stats.active, icon: Clock, color: "text-blue-600" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600" },
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
              <div className="font-display font-extrabold text-2xl text-[#0F1C2E]">{value}</div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Enrollments Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-white/40"><Loader2 className="animate-spin" size={24} /></div>
        ) : enrollments.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Employee</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Course</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Progress</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => {
                  const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.assigned;
                  const employee = employeeById.get(e.userId);
                  const courseTitle = courseById.get(e.courseId);
                  return (
                    <TableRow key={e._id} className="border-gray-50">
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-[#0047AB]/10 text-[#0047AB] text-[10px] font-bold">
                              {initialsOf(employee?.name ?? employee?.email ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-gray-700 font-medium leading-tight">{employee?.name ?? `Employee #${e.userId}`}</div>
                            {employee?.email && <div className="text-xs text-gray-400 leading-tight">{employee.email}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-600 hidden md:table-cell">{courseTitle ?? `Course #${e.courseId}`}</TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#0047AB] h-1.5 rounded-full" style={{ width: `${e.progressPct ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{e.progressPct ?? 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge className={`border-transparent text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="bg-white rounded-xl border border-gray-100 py-20">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-50 size-14">
                <BookOpen className="text-gray-300 size-7" />
              </EmptyMedia>
              <EmptyTitle className="font-display uppercase text-gray-400 text-xl">No Assignments Yet</EmptyTitle>
              <EmptyDescription>Assign courses to your employees to track their training progress.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setShowModal(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
                <Plus className="w-4 h-4" /> Assign Training
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </LMSLayout>
  );
}
