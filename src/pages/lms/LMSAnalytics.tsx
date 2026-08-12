/**
 * LMS Analytics — Bastion LMS (UI Prototype)
 * Runs entirely on static mock data — no tRPC, no network calls.
 * Platform Admin: platform-wide stats
 * Client Admin: company-specific stats
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { TrendingUp, Users, BookOpen, Award, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_PLATFORM_STATS, MOCK_COMPANY_STATS, MOCK_ENROLLMENTS, MOCK_COURSES } from "./mockData";

const PIE_COLORS = ["#22c55e", "#3b82f6", "#e5e7eb", "#ef4444", "#a855f7"];

export default function LMSAnalytics() {
  const { role, setRole } = useLMS();

  const isPlatformAdmin = role === "platform-admin";

  const platformStats = MOCK_PLATFORM_STATS;
  const companyStats = MOCK_COMPANY_STATS;
  const enrollments = MOCK_ENROLLMENTS;

  // Joined so the course completion chart can show real titles instead of raw IDs.
  const courses = MOCK_COURSES;
  const courseById = useMemo(() => {
    const map = new Map<number, string>();
    courses?.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [courses]);

  const isLoading = false;

  // Build enrollment status pie data from real enrollments
  const pieData = useMemo(() => {
    if (!enrollments) return [];
    const counts: Record<string, number> = {};
    for (const e of enrollments) {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    }
    const labels: Record<string, string> = {
      completed: "Completed",
      in_progress: "In Progress",
      assigned: "Not Started",
      overdue: "Overdue",
      waived: "Waived",
    };
    return Object.entries(counts).map(([status, count]) => ({
      name: labels[status] ?? status,
      value: count,
    }));
  }, [enrollments]);

  // Build course completion bar data
  const courseBarData = useMemo(() => {
    if (!enrollments) return [];
    const byCourse: Record<number, { completed: number; total: number }> = {};
    for (const e of enrollments) {
      if (!byCourse[e.courseId]) byCourse[e.courseId] = { completed: 0, total: 0 };
      byCourse[e.courseId].total++;
      if (e.status === "completed") byCourse[e.courseId].completed++;
    }
    return Object.entries(byCourse).map(([courseId, { completed, total }]) => ({
      name: courseById.get(Number(courseId)) ?? `Course #${courseId}`,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      total,
    })).slice(0, 8);
  }, [enrollments, courseById]);

  const stats = isPlatformAdmin ? [
    { label: "Total Companies", value: platformStats?.totalCompanies ?? 0, icon: Users, color: "text-[#0047AB]" },
    { label: "Total Users", value: platformStats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Total Courses", value: platformStats?.totalCourses ?? 0, icon: BookOpen, color: "text-purple-600" },
    { label: "Completions", value: platformStats?.totalCompletions ?? 0, icon: Award, color: "text-green-600" },
  ] : [
    { label: "Employees", value: companyStats?.totalEmployees ?? 0, icon: Users, color: "text-[#0047AB]" },
    { label: "Enrollments", value: companyStats?.totalEnrollments ?? 0, icon: BookOpen, color: "text-blue-600" },
    { label: "Completions", value: companyStats?.completions ?? 0, icon: CheckCircle2, color: "text-green-600" },
    { label: "Overdue", value: companyStats?.overdue ?? 0, icon: Award, color: "text-purple-600" },
  ];

  return (
    <LMSLayout
      title="Analytics"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Analytics" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-extrabold text-white text-3xl uppercase">Analytics</h2>
          <p className="text-white/60 text-sm mt-0.5">
            {isPlatformAdmin ? "Platform-wide training metrics" : "Your company's training metrics"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                <Skeleton className="w-5 h-5 mb-3" />
                <Skeleton className="h-8 w-14 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className={`${color} mb-3`}><Icon className="w-5 h-5" /></div>
                  <div className="font-display font-extrabold text-3xl text-[#0F1C2E]">{value}</div>
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>

            {!isPlatformAdmin && (
              <>
                {/* Completion Rate */}
                {companyStats && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-4">Overall Completion Rate</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-display font-extrabold text-[#0047AB]">
                        {companyStats.totalEnrollments > 0
                          ? Math.round((companyStats.completions / companyStats.totalEnrollments) * 100)
                          : 0}%
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className="bg-[#0047AB] h-3 rounded-full transition-all"
                            style={{
                              width: `${companyStats.totalEnrollments > 0
                                ? Math.round((companyStats.completions / companyStats.totalEnrollments) * 100)
                                : 0}%`
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {companyStats.completions} of {companyStats.totalEnrollments} enrollments completed
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enrollment Status Pie */}
                {pieData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-4">Enrollment Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Course Completion Bar Chart */}
                {courseBarData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-4">Completion Rate by Course</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={courseBarData} margin={{ top: 0, right: 10, left: -20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="completionRate" fill="#0047AB" radius={[4, 4, 0, 0]} name="Completion Rate" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {!companyStats && pieData.length === 0 && courseBarData.length === 0 && (
                  <Empty className="bg-white rounded-xl border border-gray-100 py-16">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="bg-gray-50"><TrendingUp className="text-gray-300" /></EmptyMedia>
                      <EmptyTitle className="text-gray-500 font-semibold">No training activity yet</EmptyTitle>
                      <EmptyDescription>Charts will populate once employees are enrolled in courses.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </>
            )}

            {isPlatformAdmin && (
              <Empty className="bg-white rounded-xl border border-gray-100 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-gray-50"><TrendingUp className="text-gray-300" /></EmptyMedia>
                  <EmptyTitle className="font-display uppercase text-gray-400">Platform Analytics</EmptyTitle>
                  <EmptyDescription>
                    Detailed cross-company analytics with trend charts and compliance heatmaps are coming in a future release.
                    Use the stats above for a platform-wide overview.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        )}
      </div>
    </LMSLayout>
  );
}
