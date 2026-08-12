/**
 * LMSDemoAdmin — Interactive demo of the Client Administrator view
 * Uses static demo data — no auth required.
 * Shows: Dashboard, Employees, Assignments, Courses, Analytics.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  Users, BookOpen, Award, AlertTriangle, CheckCircle2,
  BarChart3, Plus, Building2, TrendingUp, Clock,
  ChevronRight, Download, FileText, Settings,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DEMO_COMPANY,
  DEMO_ADMIN,
  DEMO_COMPANY_STATS,
  DEMO_ALL_ENROLLMENTS,
  DEMO_TREND_DATA,
  DEMO_EMPLOYEES,
  DEMO_COURSES,
} from "./demoData";

type AdminTab = "dashboard" | "employees" | "assignments" | "courses" | "analytics";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    not_started: "bg-gray-100 text-gray-500",
    overdue: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    not_started: "Not Started",
    overdue: "Overdue",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {labels[status] ?? status}
    </span>
  );
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

export default function LMSDemoAdmin() {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const pieData = [
    { name: "Completed", value: DEMO_COMPANY_STATS.completionRate },
    { name: "In Progress", value: Math.round((DEMO_COMPANY_STATS.inProgressCount / DEMO_COMPANY_STATS.totalEmployees) * 100) },
    { name: "Not Started", value: Math.round((DEMO_COMPANY_STATS.notStartedCount / DEMO_COMPANY_STATS.totalEmployees) * 100) },
    { name: "Overdue", value: Math.round((DEMO_COMPANY_STATS.overdueCount / DEMO_COMPANY_STATS.totalEmployees) * 100) },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Demo Banner */}
      <div className="bg-[#0F1C2E] text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-3 z-50 sticky top-0">
        <span className="bg-[#1E90FF]/30 text-[#7DD3FC] text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded">Demo Mode</span>
        <span className="text-white/70">You are previewing the <strong className="text-white">Administrator</strong> experience — no login required.</span>
        <Link href="/lms/about#demo">
          <button className="ml-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded transition-colors border border-white/20">
            ← Back to Demo Picker
          </button>
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-[#0F1C2E] flex flex-col flex-shrink-0 min-h-screen">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-white uppercase tracking-wide text-base">Bastion</span>
              <span className="text-[#1E90FF] font-bold text-[10px] uppercase tracking-[2px]">LMS</span>
            </div>
            <div className="text-white/30 text-xs mt-1">{DEMO_COMPANY.name}</div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "employees", label: "Employees", icon: Users },
              { id: "assignments", label: "Assignments", icon: CheckCircle2 },
              { id: "courses", label: "Course Library", icon: BookOpen },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
                    active ? "bg-[#0047AB] text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0047AB] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {DEMO_ADMIN.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold truncate">{DEMO_ADMIN.name}</div>
                <div className="text-white/40 text-[10px] truncate">{DEMO_ADMIN.jobTitle}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Dashboard ── */}
          {tab === "dashboard" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">Dashboard</h1>
                  <p className="text-gray-500 text-sm mt-1">{DEMO_COMPANY.name} · {DEMO_COMPANY.industry}</p>
                </div>
                <div className="bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Employees", value: DEMO_COMPANY_STATS.totalEmployees, icon: Users, color: "bg-[#0F1C2E]/10 text-[#0F1C2E]" },
                  { label: "Completion Rate", value: `${DEMO_COMPANY_STATS.completionRate}%`, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
                  { label: "Overdue Training", value: DEMO_COMPANY_STATS.overdueCount, icon: AlertTriangle, color: "bg-red-100 text-red-500" },
                  { label: "Certs Issued", value: DEMO_COMPANY_STATS.completions, icon: Award, color: "bg-amber-100 text-amber-600" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-display font-extrabold text-[#0F1C2E] text-3xl uppercase">{s.value}</div>
                      <div className="text-gray-500 text-sm mt-0.5">{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Trend Chart */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-4">Training Activity — Last 6 Months</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={DEMO_TREND_DATA}>
                    <defs>
                      <linearGradient id="assignedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0047AB" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0047AB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Area type="monotone" dataKey="assigned" stroke="#0047AB" fill="url(#assignedGrad)" strokeWidth={2} name="Assigned" />
                    <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#completedGrad)" strokeWidth={2} name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Recent Activity</h3>
                  <button onClick={() => setTab("assignments")} className="text-xs text-[#1E90FF] font-semibold hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {DEMO_ALL_ENROLLMENTS.slice(0, 5).map((e) => (
                    <div key={e.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#0047AB]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0047AB] font-bold text-xs">{e.employeeName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#0F1C2E]">{e.employeeName}</span>
                        <span className="text-gray-400 text-sm"> · {e.courseTitle}</span>
                      </div>
                      {statusBadge(e.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Employees ── */}
          {tab === "employees" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">Employees</h1>
                  <p className="text-gray-500 text-sm mt-1">{DEMO_EMPLOYEES.length} of {DEMO_COMPANY_STATS.totalEmployees} shown</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => alert("Demo mode: CSV bulk upload would open here")}
                  >
                    <FileText className="w-3.5 h-3.5" /> Import CSV
                  </button>
                  <button
                    className="flex items-center gap-1.5 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg transition-colors"
                    onClick={() => alert("Demo mode: Invite employee dialog would open here")}
                  >
                    <Plus className="w-3.5 h-3.5" /> Invite Employee
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold">Department</th>
                      <th className="px-6 py-3 font-semibold">Role</th>
                      <th className="px-6 py-3 font-semibold">Completions</th>
                      <th className="px-6 py-3 font-semibold">Overdue</th>
                      <th className="px-6 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {DEMO_EMPLOYEES.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0047AB]/10 flex items-center justify-center text-[#0047AB] font-bold text-sm flex-shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-[#0F1C2E]">{emp.name}</div>
                              <div className="text-xs text-gray-400">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{emp.department}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                            emp.lmsRole === "client-admin" ? "bg-[#0047AB]/10 text-[#1E90FF]" : "bg-gray-100 text-gray-500"
                          }`}>
                            {emp.lmsRole === "client-admin" ? "Admin" : "Employee"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-600 font-bold">{emp.completions}</span>
                        </td>
                        <td className="px-6 py-4">
                          {emp.overdue > 0 ? (
                            <span className="text-red-500 font-bold">{emp.overdue}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="text-xs text-[#1E90FF] font-semibold hover:underline"
                            onClick={() => alert(`Demo mode: Would open profile for ${emp.name}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Assignments ── */}
          {tab === "assignments" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">Assignments</h1>
                  <p className="text-gray-500 text-sm mt-1">Track training completion across your workforce.</p>
                </div>
                <button
                  className="flex items-center gap-1.5 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg transition-colors"
                  onClick={() => alert("Demo mode: Assign training dialog would open here")}
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Training
                </button>
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Completed", value: DEMO_ALL_ENROLLMENTS.filter(e => e.status === "completed").length, color: "text-green-600" },
                  { label: "In Progress", value: DEMO_ALL_ENROLLMENTS.filter(e => e.status === "in_progress").length, color: "text-blue-600" },
                  { label: "Not Started", value: DEMO_ALL_ENROLLMENTS.filter(e => e.status === "not_started").length, color: "text-gray-400" },
                  { label: "Overdue", value: DEMO_ALL_ENROLLMENTS.filter(e => e.status === "overdue").length, color: "text-red-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                    <div className={`font-display font-extrabold text-3xl ${s.color}`}>{s.value}</div>
                    <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold">Course</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Progress</th>
                      <th className="px-6 py-3 font-semibold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {DEMO_ALL_ENROLLMENTS.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-[#0F1C2E]">{e.employeeName}</td>
                        <td className="px-6 py-3 text-gray-600 max-w-[200px] truncate">{e.courseTitle}</td>
                        <td className="px-6 py-3">{statusBadge(e.status)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-gray-100 rounded-full w-20">
                              <div className="h-1.5 bg-[#0047AB] rounded-full" style={{ width: `${e.progressPct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400">{e.progressPct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{e.dueDate.toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Courses ── */}
          {tab === "courses" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">Course Library</h1>
                  <p className="text-gray-500 text-sm mt-1">{DEMO_COURSES.length} courses available</p>
                </div>
                <button
                  className="flex items-center gap-1.5 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg transition-colors"
                  onClick={() => alert("Demo mode: Course builder would open here")}
                >
                  <Plus className="w-3.5 h-3.5" /> Build Course
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {DEMO_COURSES.map((course) => (
                  <div key={course.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-[#0047AB] to-[#1E90FF]" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display font-bold text-[#0F1C2E] text-sm uppercase leading-tight">{course.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">Published</span>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{course.lessonCount} lessons</span>
                          <span>{Math.round(course.duration / 60)}h</span>
                          <span>Pass: {course.passingScore}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-xs text-[#1E90FF] font-semibold hover:underline"
                            onClick={() => alert(`Demo mode: Would open course builder for "${course.title}"`)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs font-bold bg-[#0047AB] hover:bg-[#1E90FF] text-white px-3 py-1.5 rounded-lg transition-colors"
                            onClick={() => alert(`Demo mode: Would assign "${course.title}" to employees`)}
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {tab === "analytics" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">Analytics</h1>
                  <p className="text-gray-500 text-sm mt-1">Compliance overview for {DEMO_COMPANY.name}</p>
                </div>
                <button
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => alert("Demo mode: Would export compliance report as CSV")}
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-4">Completion Breakdown</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${val}%`} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Trend */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-display font-bold text-[#0F1C2E] text-lg uppercase mb-4">Monthly Training Activity</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={DEMO_TREND_DATA}>
                      <defs>
                        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0047AB" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#0047AB" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="assigned" stroke="#0047AB" fill="url(#aGrad)" strokeWidth={2} name="Assigned" />
                      <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#cGrad)" strokeWidth={2} name="Completed" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats summary */}
              <div className="bg-[#0F1C2E] rounded-xl p-6">
                <h3 className="font-display font-bold text-white text-lg uppercase mb-4">Compliance Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Employees", value: DEMO_COMPANY_STATS.totalEmployees },
                    { label: "Completion Rate", value: `${DEMO_COMPANY_STATS.completionRate}%` },
                    { label: "Certs Issued", value: DEMO_COMPANY_STATS.completions },
                    { label: "Overdue", value: DEMO_COMPANY_STATS.overdueCount },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/8 rounded-lg p-4 text-center">
                      <div className="font-display font-extrabold text-white text-2xl">{s.value}</div>
                      <div className="text-white/50 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
