/**
 * LMSDemoEmployee — Interactive demo of the Employee view
 * Uses static demo data — no auth required.
 * Shows: My Training, Certificates, Course Library, and a course player preview.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, Award, Clock, CheckCircle2, ChevronRight,
  ArrowLeft, PlayCircle, FileText, Lock, Download,
  AlertTriangle, User, LogOut,
} from "lucide-react";
import {
  DEMO_EMPLOYEE,
  DEMO_COMPANY,
  DEMO_EMPLOYEE_ENROLLMENTS,
  DEMO_CERTIFICATES,
  DEMO_COURSES,
} from "./demoData";

type DemoTab = "training" | "courses" | "certificates";

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

export default function LMSDemoEmployee() {
  const [tab, setTab] = useState<DemoTab>("training");

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Demo Banner */}
      <div className="bg-[#0047AB] text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-3 z-50 sticky top-0">
        <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded">Demo Mode</span>
        <span className="text-blue-100">You are previewing the <strong className="text-white">Employee</strong> experience — no login required.</span>
        <Link href="/lms/about#demo">
          <button className="ml-4 bg-white text-[#0047AB] text-xs font-bold uppercase tracking-wide px-3 py-1 rounded hover:bg-blue-50 transition-colors">
            ← Back to Demo Picker
          </button>
        </Link>
      </div>

      {/* Sidebar + Content layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-[#0F1C2E] flex flex-col flex-shrink-0 min-h-screen">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-white uppercase tracking-wide text-base">Bastion</span>
              <span className="text-[#1E90FF] font-bold text-[10px] uppercase tracking-[2px]">LMS</span>
            </div>
            <div className="text-white/30 text-xs mt-1">{DEMO_COMPANY.name}</div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {[
              { id: "training", label: "My Training", icon: BookOpen },
              { id: "courses", label: "Course Library", icon: PlayCircle },
              { id: "certificates", label: "Certificates", icon: Award },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as DemoTab)}
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

          {/* User info */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0047AB] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {DEMO_EMPLOYEE.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold truncate">{DEMO_EMPLOYEE.name}</div>
                <div className="text-white/40 text-[10px] truncate">{DEMO_EMPLOYEE.jobTitle}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* My Training Tab */}
          {tab === "training" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">My Training</h1>
                <p className="text-gray-500 text-sm mt-1">Hello, {DEMO_EMPLOYEE.name.split(" ")[0]}. Here are your assigned courses.</p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Assigned", value: DEMO_EMPLOYEE_ENROLLMENTS.length, color: "bg-[#0047AB]/10 text-[#1E90FF]", icon: BookOpen },
                  { label: "Completed", value: DEMO_EMPLOYEE_ENROLLMENTS.filter(e => e.status === "completed").length, color: "bg-green-100 text-green-600", icon: CheckCircle2 },
                  { label: "In Progress", value: DEMO_EMPLOYEE_ENROLLMENTS.filter(e => e.status === "in_progress").length, color: "bg-blue-100 text-blue-600", icon: Clock },
                  { label: "Certificates", value: DEMO_CERTIFICATES.length, color: "bg-amber-100 text-amber-600", icon: Award },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="font-display font-extrabold text-[#0F1C2E] text-2xl">{s.value}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Enrollment list */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-display font-bold text-[#0F1C2E] text-lg uppercase">Assigned Courses</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {DEMO_EMPLOYEE_ENROLLMENTS.map((enrollment) => (
                    <div key={enrollment.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        enrollment.status === "completed" ? "bg-green-100" :
                        enrollment.status === "in_progress" ? "bg-blue-100" :
                        enrollment.status === "overdue" ? "bg-red-100" : "bg-gray-100"
                      }`}>
                        {enrollment.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                         enrollment.status === "in_progress" ? <PlayCircle className="w-5 h-5 text-blue-600" /> :
                         enrollment.status === "overdue" ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                         <Lock className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#0F1C2E] text-sm">{enrollment.courseTitle}</div>
                        <div className="flex items-center gap-3 mt-1">
                          {statusBadge(enrollment.status)}
                          {enrollment.dueDate && (
                            <span className="text-xs text-gray-400">
                              Due {enrollment.dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {enrollment.status === "in_progress" && (
                          <div className="mt-2 h-1.5 bg-gray-100 rounded-full w-48">
                            <div className="h-1.5 bg-[#0047AB] rounded-full" style={{ width: `${enrollment.progressPct}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {enrollment.status === "completed" && enrollment.score !== null && (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{enrollment.score}%</span>
                        )}
                        <button
                          className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-colors ${
                            enrollment.status === "completed"
                              ? "bg-gray-100 text-gray-400 cursor-default"
                              : "bg-[#0047AB] text-white hover:bg-[#1E90FF]"
                          }`}
                          onClick={() => {
                            if (enrollment.status !== "completed") {
                              alert("Demo mode: In a live session, this would open the course player for " + enrollment.courseTitle);
                            }
                          }}
                        >
                          {enrollment.status === "completed" ? "Review" : enrollment.status === "in_progress" ? "Continue" : "Start"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Course Library Tab */}
          {tab === "courses" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">Course Library</h1>
                <p className="text-gray-500 text-sm mt-1">Browse available safety training courses.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {DEMO_COURSES.map((course, i) => {
                  const enrolled = DEMO_EMPLOYEE_ENROLLMENTS.find(e => e.courseId === course.id);
                  return (
                    <div key={course.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                      {/* Color header */}
                      <div className="h-2 bg-gradient-to-r from-[#0047AB] to-[#1E90FF]" />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-display font-bold text-[#0F1C2E] text-sm uppercase leading-tight">{course.title}</h3>
                          {enrolled && statusBadge(enrolled.status)}
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessonCount} lessons</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round(course.duration / 60)}h</span>
                          </div>
                          <button
                            className="text-xs font-bold uppercase tracking-wide bg-[#0047AB] hover:bg-[#1E90FF] text-white px-3 py-1.5 rounded-lg transition-colors"
                            onClick={() => alert(`Demo mode: In a live session, this would open "${course.title}"`)}
                          >
                            {enrolled ? "Open" : "Enroll"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {tab === "certificates" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">My Certificates</h1>
                <p className="text-gray-500 text-sm mt-1">Your completed training certificates. Download as PDF for job site verification.</p>
              </div>
              {DEMO_CERTIFICATES.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
                  <Award className="w-12 h-12 text-gray-200 mb-4" />
                  <p className="text-gray-400 text-sm">No certificates yet. Complete a course to earn your first certificate.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {DEMO_CERTIFICATES.map((cert) => (
                    <div key={cert.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                      <div className="w-14 h-14 rounded-xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
                        <Award className="w-7 h-7 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-[#0F1C2E] text-sm uppercase">{cert.courseTitle}</div>
                        <div className="text-gray-400 text-xs mt-1 font-mono">{cert.certificateNumber}</div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Issued: {cert.issuedAt.toLocaleDateString()}</span>
                          <span>Expires: {cert.expiresAt.toLocaleDateString()}</span>
                          <span className="text-green-600 font-semibold">Score: {cert.score}%</span>
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-2 bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
                        onClick={() => alert(`Demo mode: In a live session, this would download a branded PDF certificate for "${cert.courseTitle}"`)}
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
