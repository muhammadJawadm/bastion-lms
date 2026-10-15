/**
 * LMS Dashboard — Bastion LMS
 * Client Admin and Employee dashboards are wired to the real backend
 * (`src/lib/api.ts`) — Enrollments, People, Certificates, Courses, all
 * company-scoped automatically. Platform Admin dashboard stays on mock
 * data for now — no real platform-admin endpoints are wired up yet.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Users, BookOpen, AlertTriangle, Award, TrendingUp, ArrowRight,
  Clock, CheckCircle2, Building2, Plus
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MOCK_PLATFORM_STATS, MOCK_COMPANIES } from "./mockData";
import {
  getEnrollments, getCompanyPeople, getCertificates, getCourses,
  ApiError, type EnrollmentRecord, type CompanyPerson, type CertificateRecord, type Course,
} from "@/lib/api";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; href?: string;
}) {
  const content = (
    <div className={cn(
      "bg-white rounded-xl p-5 border border-gray-100 transition-all",
      href && "cursor-pointer hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-gray-300" />}
      </div>
      <div className="font-display font-extrabold text-[#0F1C2E] text-3xl uppercase">{value}</div>
      <div className="text-gray-500 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3.5 w-24" />
    </div>
  );
}

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
  );
}

function SectionCard({ title, action, children, className }: {
  title: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100", className)}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Platform Admin Dashboard ─────────────────────────────────────────────────

function PlatformAdminDashboard() {
  const stats = MOCK_PLATFORM_STATS;
  const companies = MOCK_COMPANIES;
  const isLoading = false;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      {isLoading ? <StatGridSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Active Clients" value={stats?.totalCompanies ?? 0} sub="Client companies" color="bg-[#0047AB]/10 text-[#1E90FF]" href="/lms/clients" />
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} sub="Across all clients" color="bg-[#0F1C2E]/10 text-[#0F1C2E]" />
          <StatCard icon={BookOpen} label="Courses Published" value={stats?.totalCourses ?? 0} sub="Available courses" color="bg-[#00A3FF]/10 text-[#00A3FF]" href="/lms/courses" />
          <StatCard icon={Award} label="Certs Issued" value={stats?.totalCompletions ?? 0} sub="Total completions" color="bg-green-100 text-green-600" />
        </div>
      )}

      {/* Client Table */}
      <SectionCard
        title="Client Overview"
        action={
          <Button asChild size="sm" className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide gap-1.5">
            <Link href="/lms/admin/companies"><Plus className="w-3.5 h-3.5" /> Add Client</Link>
          </Button>
        }
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : companies && companies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Client</TableHead>
                <TableHead className="px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Industry</TableHead>
                <TableHead className="px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Plan</TableHead>
                <TableHead className="px-6 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Status</TableHead>
                <TableHead className="px-6 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="border-gray-50">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0F1C2E]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#0F1C2E]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{company.name}</div>
                        {company.contactEmail && <div className="text-xs text-gray-400">{company.contactEmail}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-600 capitalize">{company.industry?.replace("_", " ")}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className="bg-[#0047AB]/10 text-[#1E90FF] border-transparent text-[10px] font-bold uppercase tracking-wide">
                      {company.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge className={cn(
                      "border-transparent text-[10px] font-bold uppercase tracking-wide",
                      company.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Link href="/lms/admin/companies">
                      <span className="text-xs text-[#1E90FF] font-semibold hover:underline cursor-pointer">Manage</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="py-12 border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-50">
                <Building2 className="text-gray-300" />
              </EmptyMedia>
              <EmptyTitle className="font-display uppercase text-gray-400">No Clients Yet</EmptyTitle>
              <EmptyDescription>Add your first client company to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide gap-1.5">
                <Link href="/lms/admin/companies"><Plus className="w-3.5 h-3.5" /> Add First Client</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </SectionCard>

      {/* Quick Actions */}
      <div className="bg-[#0F1C2E] rounded-xl p-6">
        <h3 className="font-display font-bold text-white text-xl uppercase mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Client", href: "/lms/admin/companies", icon: Building2 },
            { label: "Build a Course", href: "/lms/builder", icon: Plus },
            { label: "Course Library", href: "/lms/courses", icon: BookOpen },
            { label: "Run Report", href: "/lms/reports", icon: TrendingUp },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                asChild
                variant="outline"
                className="w-full bg-white/8 hover:bg-[#0047AB] border-white/10 hover:border-[#0047AB] text-white text-sm font-semibold py-3 h-auto gap-2 justify-start px-4"
              >
                <Link href={action.href}>
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Client Admin Dashboard ───────────────────────────────────────────────────

function ClientAdminDashboard() {
  const { user, effectiveCompanyId } = useLMS();

  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [people, setPeople] = useState<CompanyPerson[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!effectiveCompanyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [enrollRes, peopleRes, certRes, courseRes] = await Promise.all([
        getEnrollments(),
        getCompanyPeople({ role: "all" }),
        getCertificates(),
        getCourses(),
      ]);
      setEnrollments(enrollRes.data);
      setPeople(peopleRes.data);
      setCertificates(certRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!effectiveCompanyId) {
    return (
      <Empty className="py-16 border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-[#0047AB]/10">
            <AlertTriangle className="text-[#1E90FF]" />
          </EmptyMedia>
          <EmptyTitle className="font-display uppercase text-gray-600">No Company Assigned</EmptyTitle>
          <EmptyDescription>Contact your platform administrator to be assigned to a company.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const peopleById = new Map(people.map((p) => [p._id, p]));
  const courseById = new Map(courses.map((c) => [c._id, c]));
  const getEmployeeName = (userId: string) => peopleById.get(userId)?.name ?? `Employee #${userId}`;
  const getCourseTitle = (courseId: string) => courseById.get(courseId)?.title ?? `Course #${courseId}`;

  const overdue = enrollments.filter((e) => e.status === "overdue");
  const completed = enrollments.filter((e) => e.status === "completed");
  const total = enrollments.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Build trend data from enrollments (last 6 months)
  const now = new Date();
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthName = d.toLocaleString("default", { month: "short" });
    const monthEnrollments = enrollments.filter((e) => {
      if (!e.createdAt) return false;
      const ea = new Date(e.createdAt);
      return ea.getFullYear() === d.getFullYear() && ea.getMonth() === d.getMonth();
    });
    const monthCompleted = monthEnrollments.filter((e) => e.status === "completed");
    return { month: monthName, assigned: monthEnrollments.length, completed: monthCompleted.length };
  });

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      {isLoading ? <StatGridSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Employees" value={people.length} sub="Active employees" color="bg-[#0F1C2E]/10 text-[#0F1C2E]" href="/lms/employees" />
          <StatCard icon={CheckCircle2} label="Completion Rate" value={`${completionRate}%`} sub={`${completed.length} of ${total} completed`} color="bg-green-100 text-green-600" />
          <StatCard icon={AlertTriangle} label="Overdue Training" value={overdue.length} sub="Requires attention" color="bg-[#0047AB]/10 text-[#1E90FF]" href="/lms/assignments" />
          <StatCard icon={Award} label="Certs Issued" value={certificates.length} sub="Completed trainings" color="bg-amber-100 text-amber-600" href="/lms/reports" />
        </div>
      )}

      {/* Completion Trend */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Completion Trend</h3>
            <p className="text-gray-400 text-xs mt-0.5">Assigned vs Completed — Last 6 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#0047AB]" /><span className="text-gray-500">Assigned</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#00A3FF]" /><span className="text-gray-500">Completed</span></div>
          </div>
        </div>
        {isLoading ? <Skeleton className="h-[200px] w-full rounded-lg" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0047AB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0047AB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A3FF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00A3FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Area type="monotone" dataKey="assigned" stroke="#1E90FF" strokeWidth={2} fill="url(#colorAssigned)" />
              <Area type="monotone" dataKey="completed" stroke="#00A3FF" strokeWidth={2} fill="url(#colorCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Overdue Table */}
      <SectionCard
        title="Overdue Training"
        action={
          <Button asChild variant="ghost" size="sm" className="text-xs text-[#1E90FF] font-semibold hover:text-[#1E90FF] hover:bg-[#1E90FF]/5 gap-1">
            <Link href="/lms/assignments">View All <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        }
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
          </div>
        ) : overdue.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {overdue.slice(0, 5).map((e) => (
              <div key={e._id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#0047AB]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1E90FF] text-xs font-bold">
                    {getEmployeeName(e.userId).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{getEmployeeName(e.userId)}</div>
                  <div className="text-xs text-gray-400">{getCourseTitle(e.courseId)}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[#1E90FF]" />
                  <span className="text-xs font-bold text-[#1E90FF]">Overdue</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="py-10 border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-green-50">
                <CheckCircle2 className="text-green-500" />
              </EmptyMedia>
              <EmptyTitle className="text-gray-600">No overdue training</EmptyTitle>
              <EmptyDescription>All employees are on track.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </SectionCard>

      {/* Quick Actions */}
      <div className="bg-[#0F1C2E] rounded-xl p-6">
        <h3 className="font-display font-bold text-white text-xl uppercase mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Assign Training", href: "/lms/assignments", icon: BookOpen },
            { label: "Add Employees", href: "/lms/employees", icon: Users },
            { label: "Build a Course", href: "/lms/builder", icon: Plus },
            { label: "Run Report", href: "/lms/reports", icon: TrendingUp },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                asChild
                variant="outline"
                className="w-full bg-white/8 hover:bg-[#0047AB] border-white/10 hover:border-[#0047AB] text-white text-sm font-semibold py-3 h-auto gap-2 justify-start px-4"
              >
                <Link href={action.href}>
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Employee Dashboard ───────────────────────────────────────────────────────

function EmployeeDashboard() {
  const { user } = useLMS();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [enrollRes, certRes, courseRes] = await Promise.all([
        getEnrollments({ userId: user.id }),
        getCertificates({ userId: user.id }),
        getCourses(),
      ]);
      setEnrollments(enrollRes.data);
      setCertificates(certRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load your training.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const courseById = new Map(courses.map((c) => [c._id, c]));
  const pending = enrollments.filter((e) => e.status !== "completed");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Welcome */}
      <div className="bg-[#0F1C2E] rounded-xl p-6 text-white">
        <div className="text-white/50 text-sm mb-1">Welcome back,</div>
        <h2 className="font-display font-extrabold text-3xl uppercase mb-1">{user?.name ?? "Field Worker"}</h2>
        {isLoading ? (
          <Skeleton className="h-4 w-48 bg-white/10" />
        ) : pending.length > 0 ? (
          <div className="flex items-center gap-2 text-[#1E90FF]">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold">{pending.length} training assignment{pending.length !== 1 ? "s" : ""} pending</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold">All training up to date</span>
          </div>
        )}
      </div>

      {/* Assigned Courses */}
      <div>
        <h3 className="font-display font-bold text-white text-xl uppercase mb-4">My Training</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : enrollments.length > 0 ? (
          <div className="space-y-3">
            {enrollments.map((e) => (
              <Link key={e._id} href={`/lms/courses/${e.courseId}`}>
                <div className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex">
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm font-bold text-gray-800 leading-tight">{courseById.get(e.courseId)?.title ?? `Course #${e.courseId}`}</div>
                      {e.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : e.dueDate ? (
                        <Badge className="bg-[#0047AB]/10 text-[#1E90FF] border-transparent text-[10px] font-bold flex-shrink-0">
                          Due {new Date(e.dueDate).toLocaleDateString()}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-400 mb-2 capitalize">{e.status?.replace("_", " ")}</div>
                    {e.status !== "completed" ? (
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{e.progressPct === 0 ? "Not started" : `${e.progressPct}% complete`}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0047AB] rounded-full transition-all" style={{ width: `${e.progressPct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold">Completed · Certificate Available</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty className="bg-white rounded-xl border border-gray-100 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-50">
                <BookOpen className="text-gray-300" />
              </EmptyMedia>
              <EmptyTitle className="font-display uppercase text-gray-400">No Training Assigned</EmptyTitle>
              <EmptyDescription>Your safety manager will assign training courses here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {/* My Certificates */}
      {!isLoading && certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase mb-4">My Certificates</h3>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert._id} className="flex items-center gap-3 p-3 bg-[#F4F6F9] rounded-lg">
                <Award className="w-8 h-8 text-[#1E90FF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800">{cert.certificateTitle || `Certificate #${cert.certificateNumber ?? ""}`}</div>
                  <div className="text-xs text-gray-400">
                    {cert.certificateNumber && `#${cert.certificateNumber} · `}
                    {cert.issuedAt && `Issued ${new Date(cert.issuedAt).toLocaleDateString()}`}
                    {cert.expiresAt && ` · Expires ${new Date(cert.expiresAt).toLocaleDateString()}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#1E90FF] font-semibold hover:text-[#1E90FF] hover:bg-[#1E90FF]/5 flex-shrink-0"
                  onClick={() => toast.info("Certificate download coming soon")}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LMSDashboard() {
  const { role, setRole, isDemo } = useLMS();

  const title = role === "employee" ? "My Training" : "Dashboard";
  const breadcrumbs = [
    { label: "Bastion LMS", href: "/lms" },
    { label: title },
  ];

  return (
    <LMSLayout title={title} breadcrumbs={breadcrumbs} role={role} onRoleChange={setRole}>
      {/* Demo account banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-semibold text-sm">You're on a Demo Account</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Demo accounts can only access pre-built sample courses. To unlock full access for your team, contact{" "}
              <a href="mailto:info@bastionrsg.com" className="underline hover:text-amber-900 font-medium">info@bastionrsg.com</a>.
            </p>
          </div>
        </div>
      )}
      {role === "platform-admin" && <PlatformAdminDashboard />}
      {role === "client-admin" && <ClientAdminDashboard />}
      {role === "employee" && <EmployeeDashboard />}
    </LMSLayout>
  );
}
