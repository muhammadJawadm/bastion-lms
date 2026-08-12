/**
 * LMSAdminAnalytics — Platform Admin: KPI dashboard
 * Real-time platform metrics: companies, users, enrollments, completions,
 * certificates, support tickets, conversations, and completion rate.
 */
import {
  Building2, Users, BookOpen, Award, TrendingUp, MessageSquare,
  MessageCircle, CheckCircle2, Loader2, BarChart3, Target,
  AlertCircle, Activity,
} from "lucide-react";
import { LMSLayout } from "../LMSLayout";
import { useLMS } from "../LMSContext";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            trend.value >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className="font-display font-extrabold text-[#0F1C2E] text-3xl uppercase">{value}</div>
        <div className="text-gray-500 text-xs mt-0.5">{label}</div>
        {sub && <div className="text-gray-400 text-xs mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Completion Rate Gauge ────────────────────────────────────────────────────

function CompletionGauge({ rate }: { rate: number }) {
  const data = [
    { name: "Completed", value: rate },
    { name: "Remaining", value: 100 - rate },
  ];
  const COLORS = ["#0047AB", "#E5E7EB"];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center">
      <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Course Completion Rate</div>
      <div className="relative">
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx={90}
            cy={90}
            startAngle={90}
            endAngle={-270}
            innerRadius={55}
            outerRadius={80}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-extrabold text-[#0047AB] text-3xl uppercase">{rate}%</span>
          <span className="text-gray-400 text-[10px] uppercase tracking-wide">Completed</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0047AB] inline-block" />Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />In Progress</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LMSAdminAnalytics() {
  const { role, setRole } = useLMS();
  const { data: kpis, isLoading } = trpc.platformAdmin.kpis.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const { data: tickets } = trpc.support.allTickets.useQuery();

  if (isLoading) {
    return (
      <LMSLayout title="Platform Analytics" role={role} onRoleChange={setRole}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0047AB]" />
        </div>
      </LMSLayout>
    );
  }

  // ── Derived data for charts ──────────────────────────────────────────────

  // Companies by industry
  const industryMap: Record<string, number> = {};
  (companies ?? []).forEach(c => {
    const label = c.industry.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
    industryMap[label] = (industryMap[label] ?? 0) + 1;
  });
  const industryData = Object.entries(industryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Companies by plan
  const planMap: Record<string, number> = { starter: 0, professional: 0, enterprise: 0 };
  (companies ?? []).forEach(c => { planMap[c.plan] = (planMap[c.plan] ?? 0) + 1; });
  const planData = [
    { name: "Starter", value: planMap.starter, color: "#94A3B8" },
    { name: "Professional", value: planMap.professional, color: "#0047AB" },
    { name: "Enterprise", value: planMap.enterprise, color: "#F59E0B" },
  ];

  // Ticket status breakdown
  const ticketStatusMap: Record<string, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  (tickets ?? []).forEach(t => { ticketStatusMap[t.status] = (ticketStatusMap[t.status] ?? 0) + 1; });
  const ticketData = [
    { name: "Open", value: ticketStatusMap.open, color: "#3B82F6" },
    { name: "In Progress", value: ticketStatusMap.in_progress, color: "#F59E0B" },
    { name: "Resolved", value: ticketStatusMap.resolved, color: "#10B981" },
    { name: "Closed", value: ticketStatusMap.closed, color: "#94A3B8" },
  ];

  // Simulated monthly enrollment trend (last 6 months)
  const enrollmentTrend = [
    { month: "Jan", enrollments: 0, completions: 0 },
    { month: "Feb", enrollments: 0, completions: 0 },
    { month: "Mar", enrollments: 0, completions: 0 },
    { month: "Apr", enrollments: 0, completions: 0 },
    { month: "May", enrollments: 0, completions: 0 },
    { month: "Jun", enrollments: kpis?.totalEnrollments ?? 0, completions: kpis?.totalCompletions ?? 0 },
  ];

  const resolvedRate = kpis?.totalTickets
    ? Math.round(((ticketStatusMap.resolved + ticketStatusMap.closed) / kpis.totalTickets) * 100)
    : 0;

  return (
    <LMSLayout
      title="Platform Analytics"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Platform Analytics" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-tight">Platform Analytics</h1>
          <p className="text-white/60 text-sm mt-1">Key performance indicators across all client companies</p>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Client Companies" value={kpis?.totalCompanies ?? 0} icon={Building2} color="bg-[#0047AB]/10 text-[#0047AB]" />
          <KPICard label="Total Users" value={kpis?.totalUsers ?? 0} sub="Active learners" icon={Users} color="bg-[#0F1C2E]/10 text-[#0F1C2E]" />
          <KPICard label="Published Courses" value={kpis?.totalCourses ?? 0} icon={BookOpen} color="bg-[#00A3FF]/10 text-[#00A3FF]" />
          <KPICard label="Certificates Issued" value={kpis?.totalCertificates ?? 0} icon={Award} color="bg-amber-100 text-amber-600" />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Enrollments" value={kpis?.totalEnrollments ?? 0} icon={TrendingUp} color="bg-green-100 text-green-600" />
          <KPICard label="Completions" value={kpis?.totalCompletions ?? 0} icon={CheckCircle2} color="bg-green-100 text-green-700" />
          <KPICard label="Support Tickets" value={kpis?.totalTickets ?? 0} sub={`${kpis?.openTickets ?? 0} open`} icon={MessageSquare} color="bg-blue-100 text-blue-600" />
          <KPICard label="Conversations" value={kpis?.totalConversations ?? 0} icon={MessageCircle} color="bg-purple-100 text-purple-600" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Completion Rate Gauge */}
          <CompletionGauge rate={kpis?.completionRate ?? 0} />

          {/* Plan Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Companies by Plan</div>
            <PieChart width={200} height={180} className="mx-auto">
              <Pie data={planData} cx={100} cy={80} outerRadius={70} dataKey="value" strokeWidth={0}>
                {planData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
              <Tooltip formatter={(v) => [`${v} companies`, ""]} />
            </PieChart>
          </div>

          {/* Support Ticket Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Ticket Status</div>
            <div className="space-y-3 mt-2">
              {ticketData.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{name}</span>
                    <span className="font-semibold text-gray-800">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: kpis?.totalTickets ? `${(value / kpis.totalTickets) * 100}%` : "0%",
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-400">Resolution Rate</span>
                <span className="font-bold text-green-600">{resolvedRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Enrollment Trend (6 months)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0047AB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0047AB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                <Area type="monotone" dataKey="enrollments" stroke="#0047AB" strokeWidth={2} fill="url(#enrollGrad)" name="Enrollments" />
                <Area type="monotone" dataKey="completions" stroke="#10B981" strokeWidth={2} fill="url(#compGrad)" name="Completions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Companies by Industry */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Companies by Industry</div>
            {industryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <BarChart3 className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No company data yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={industryData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                  <Bar dataKey="value" fill="#0047AB" radius={[0, 4, 4, 0]} name="Companies" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Health Summary */}
        <div className="bg-[#0F1C2E] rounded-xl p-6">
          <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">Platform Health Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Completion Rate",
                value: `${kpis?.completionRate ?? 0}%`,
                status: (kpis?.completionRate ?? 0) >= 60 ? "good" : "warn",
                icon: Target,
              },
              {
                label: "Open Tickets",
                value: kpis?.openTickets ?? 0,
                status: (kpis?.openTickets ?? 0) === 0 ? "good" : (kpis?.openTickets ?? 0) <= 5 ? "warn" : "bad",
                icon: AlertCircle,
              },
              {
                label: "Active Companies",
                value: companies?.filter(c => c.isActive).length ?? 0,
                status: "good",
                icon: Building2,
              },
              {
                label: "Platform Activity",
                value: (kpis?.totalEnrollments ?? 0) > 0 ? "Active" : "Low",
                status: (kpis?.totalEnrollments ?? 0) > 0 ? "good" : "warn",
                icon: Activity,
              },
            ].map(({ label, value, status, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  status === "good" ? "bg-green-500/20" : status === "warn" ? "bg-amber-500/20" : "bg-red-500/20"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    status === "good" ? "text-green-400" : status === "warn" ? "text-amber-400" : "text-red-400"
                  }`} />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{value}</div>
                  <div className="text-gray-400 text-xs">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
