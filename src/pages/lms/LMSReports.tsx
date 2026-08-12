/**
 * LMS Reports — Bastion LMS (UI Prototype)
 * Runs entirely on static mock data — no tRPC, no network calls.
 */

import { useState, useMemo } from "react";
import { Download, FileText, Filter, CheckCircle2, AlertTriangle, Award, Users, BarChart3 } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MOCK_ENROLLMENTS, MOCK_CERTIFICATES, MOCK_EMPLOYEES, MOCK_COURSES } from "./mockData";

type ReportId = "compliance" | "overdue" | "certificates" | "employee" | "course" | "activity";

const REPORT_TYPES: { id: ReportId; label: string; icon: typeof CheckCircle2; desc: string; color: string }[] = [
  { id: "compliance", label: "Compliance Summary", icon: CheckCircle2, desc: "All enrollments across your company", color: "bg-green-100 text-green-600" },
  { id: "overdue", label: "Overdue Training", icon: AlertTriangle, desc: "Employees with past-due training assignments", color: "bg-red-100 text-red-600" },
  { id: "certificates", label: "Certificate Report", icon: Award, desc: "All issued certificates with expiration dates", color: "bg-amber-100 text-amber-600" },
  { id: "employee", label: "Employee Progress", icon: Users, desc: "Completion rate per employee", color: "bg-blue-100 text-blue-600" },
  { id: "course", label: "Course Activity", icon: BarChart3, desc: "Enrollment counts and completion rates per course", color: "bg-purple-100 text-purple-600" },
  { id: "activity", label: "Activity Log", icon: FileText, desc: "Full audit trail of all training activity", color: "bg-gray-100 text-gray-600" },
];

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  assigned: "bg-gray-100 text-gray-500",
  waived: "bg-purple-100 text-purple-600",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Complete",
  in_progress: "In Progress",
  overdue: "Overdue",
  assigned: "Not Started",
  waived: "Waived",
};

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
    </div>
  );
}

export default function LMSReports() {
  const { role, setRole, user } = useLMS();
  const [selectedReport, setSelectedReport] = useState<ReportId>("compliance");
  const [statusFilter, setStatusFilter] = useState("all");

  const companyId = (user as any)?.companyId ?? 0;

  const enrollments = MOCK_ENROLLMENTS;
  const isLoading = false;
  const certificates = MOCK_CERTIFICATES;
  const loadingCerts = false;
  // Joined to show real names/titles in the Employee and Course breakdown reports.
  const employees = MOCK_EMPLOYEES;
  const courses = MOCK_COURSES;

  const employeeById = useMemo(() => {
    const map = new Map<number, { name: string | null; email: string | null }>();
    employees?.forEach((e) => map.set(e.id, { name: e.name, email: e.email }));
    return map;
  }, [employees]);

  const courseById = useMemo(() => {
    const map = new Map<number, string>();
    courses?.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    if (!enrollments) return [];
    if (statusFilter === "all") return enrollments;
    return enrollments.filter((e) => e.status === statusFilter);
  }, [enrollments, statusFilter]);

  const overdue = useMemo(() => enrollments?.filter((e) => e.status === "overdue") ?? [], [enrollments]);
  const overdueCount = overdue.length;
  const completedCount = enrollments?.filter((e) => e.status === "completed").length ?? 0;

  const employeeBreakdown = useMemo(() => {
    if (!enrollments) return [];
    const byUser = new Map<number, { assigned: number; completed: number }>();
    enrollments.forEach((e) => {
      const row = byUser.get(e.userId) ?? { assigned: 0, completed: 0 };
      row.assigned += 1;
      if (e.status === "completed") row.completed += 1;
      byUser.set(e.userId, row);
    });
    return Array.from(byUser.entries())
      .map(([userId, row]) => ({ userId, ...row, rate: row.assigned > 0 ? Math.round((row.completed / row.assigned) * 100) : 0 }))
      .sort((a, b) => b.assigned - a.assigned);
  }, [enrollments]);

  const courseBreakdown = useMemo(() => {
    if (!enrollments) return [];
    const byCourse = new Map<number, { enrolled: number; completed: number }>();
    enrollments.forEach((e) => {
      const row = byCourse.get(e.courseId) ?? { enrolled: 0, completed: 0 };
      row.enrolled += 1;
      if (e.status === "completed") row.completed += 1;
      byCourse.set(e.courseId, row);
    });
    return Array.from(byCourse.entries())
      .map(([courseId, row]) => ({ courseId, ...row, rate: row.enrolled > 0 ? Math.round((row.completed / row.enrolled) * 100) : 0 }))
      .sort((a, b) => b.enrolled - a.enrolled);
  }, [enrollments]);

  function exportCSV() {
    if (!enrollments || enrollments.length === 0) {
      toast.error("No data to export");
      return;
    }
    const rows = [
      ["User ID", "Course ID", "Status", "Progress %", "Due Date", "Completed At"],
      ...enrollments.map((e) => [
        e.userId,
        e.courseId,
        e.status,
        e.progressPct ?? 0,
        e.dueDate ? new Date(e.dueDate).toLocaleDateString() : "",
        e.completedAt ? new Date(e.completedAt).toLocaleDateString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bastion-lms-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }

  function exportCertCSV() {
    if (!certificates || certificates.length === 0) {
      toast.error("No certificates to export");
      return;
    }
    const rows = [
      ["Certificate #", "User ID", "Course ID", "Score", "Issued At", "Expires At"],
      ...certificates.map((c) => [
        c.certificateNumber,
        c.userId,
        c.courseId,
        c.score ?? "",
        new Date(c.issuedAt).toLocaleDateString(),
        c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bastion-lms-certificates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate report exported");
  }

  const showExport = selectedReport === "compliance" || selectedReport === "overdue" || selectedReport === "certificates";

  return (
    <LMSLayout
      title="Reports"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Reports" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-6">
        {/* Report Type Selector */}
        <div>
          <h2 className="font-display font-extrabold text-white text-3xl uppercase mb-4">Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {REPORT_TYPES.map((rt) => {
              const Icon = rt.icon;
              return (
                <button
                  key={rt.id}
                  onClick={() => setSelectedReport(rt.id)}
                  className={cn(
                    "text-left p-4 rounded-xl border-2 transition-all",
                    selectedReport === rt.id
                      ? "border-[#0047AB] bg-[#0047AB]/5"
                      : "border-gray-100 bg-white hover:border-[#0047AB]/30"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", rt.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-display font-bold text-[#0F1C2E] text-sm uppercase">{rt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{rt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters + Export */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            {selectedReport === "compliance" ? (
              <>
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="assigned">Not Started</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <p className="text-sm text-gray-500">{REPORT_TYPES.find((r) => r.id === selectedReport)?.desc}</p>
            )}
          </div>
          {showExport && (
            <Button
              onClick={selectedReport === "certificates" ? exportCertCSV : exportCSV}
              className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2 h-auto py-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Enrollments", value: enrollments?.length ?? 0 },
            { label: "Completed", value: completedCount },
            { label: "Overdue", value: overdueCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="font-display font-extrabold text-2xl text-[#0F1C2E]">{value}</div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Data Table */}
        {selectedReport === "certificates" ? (
          loadingCerts ? <TableSkeleton /> : certificates && certificates.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Certificate #</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Employee</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Score</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Issued</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Expires</TableHead>
                    <TableHead className="px-5 py-3" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id} className="border-gray-50">
                      <TableCell className="px-5 py-3 font-mono text-xs text-gray-600">{cert.certificateNumber}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 hidden md:table-cell">{employeeById.get(cert.userId)?.name ?? `User #${cert.userId}`}</TableCell>
                      <TableCell className="px-5 py-3">
                        {cert.score != null ? <span className="font-bold text-[#0047AB]">{cert.score}%</span> : "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500">{new Date(cert.issuedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 hidden md:table-cell">
                        {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "No expiry"}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Button size="sm" className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold gap-1 h-auto py-1.5 px-3" onClick={() => toast.info("Certificate download coming soon")}>
                          <Download className="w-3 h-3" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><Award className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold">No certificates issued yet</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )
        ) : selectedReport === "employee" ? (
          isLoading ? <TableSkeleton /> : employeeBreakdown.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Employee</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Assigned</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Completed</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeBreakdown.map((row) => (
                    <TableRow key={row.userId} className="border-gray-50">
                      <TableCell className="px-5 py-3 text-gray-700 font-medium">{employeeById.get(row.userId)?.name ?? `Employee #${row.userId}`}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500">{row.assigned}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500">{row.completed}</TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#0047AB] h-1.5 rounded-full" style={{ width: `${row.rate}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{row.rate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><Users className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold">No employee data yet</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )
        ) : selectedReport === "course" ? (
          isLoading ? <TableSkeleton /> : courseBreakdown.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Course</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Enrolled</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Completed</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseBreakdown.map((row) => (
                    <TableRow key={row.courseId} className="border-gray-50">
                      <TableCell className="px-5 py-3 text-gray-700 font-medium">{courseById.get(row.courseId) ?? `Course #${row.courseId}`}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500">{row.enrolled}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500">{row.completed}</TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#0047AB] h-1.5 rounded-full" style={{ width: `${row.rate}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{row.rate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><BarChart3 className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold">No course activity yet</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )
        ) : selectedReport === "activity" ? (
          <Empty className="bg-white rounded-xl border border-gray-100 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-50"><FileText className="text-gray-300" /></EmptyMedia>
              <EmptyTitle className="text-gray-500 font-semibold">Activity Log Coming Soon</EmptyTitle>
              <EmptyDescription>A full audit trail of platform activity isn't tracked yet — this report will populate once that's built.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : isLoading ? <TableSkeleton /> : (
          (selectedReport === "overdue" ? overdue : filtered).length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Employee</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Course</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Progress</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedReport === "overdue" ? overdue : filtered).map((e) => (
                    <TableRow key={e.id} className="border-gray-50">
                      <TableCell className="px-5 py-3 text-gray-700 font-medium">{employeeById.get(e.userId)?.name ?? `Employee #${e.userId}`}</TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 hidden md:table-cell">{courseById.get(e.courseId) ?? `Course #${e.courseId}`}</TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#0047AB] h-1.5 rounded-full" style={{ width: `${e.progressPct ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{e.progressPct ?? 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge className={cn("border-transparent text-[10px] font-bold uppercase tracking-wide", STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-500")}>
                          {STATUS_LABELS[e.status] ?? e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {e.dueDate ? new Date(e.dueDate).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50"><FileText className="text-gray-300" /></EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold">No data for this report</EmptyTitle>
                <EmptyDescription>Assign training to employees to generate reports.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        )}
      </div>
    </LMSLayout>
  );
}
