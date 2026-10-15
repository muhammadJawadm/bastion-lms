/**
 * LMS My Training — Employee view
 * Wired to the real backend — the logged-in user's own enrollments and
 * certificates, via `src/lib/api.ts`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, AlertTriangle, Award, Play, BookOpen, Download } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEnrollments, getCertificates, getCourses,
  ApiError, type EnrollmentRecord, type CertificateRecord, type Course,
} from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: typeof Clock }> = {
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", Icon: Clock },
  assigned: { label: "Not Started", color: "bg-gray-100 text-gray-500", Icon: Clock },
  completed: { label: "Complete", color: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", Icon: AlertTriangle },
  waived: { label: "Waived", color: "bg-purple-100 text-purple-600", Icon: CheckCircle2 },
};

export default function LMSMyTraining() {
  const { role, setRole, user } = useLMS();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(true);

  const displayName = user?.name ?? "there";

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoadingEnrollments(false);
      setLoadingCerts(false);
      return;
    }
    setLoadingEnrollments(true);
    setLoadingCerts(true);
    try {
      const [enrollRes, courseRes] = await Promise.all([
        getEnrollments({ userId: user.id }),
        getCourses(),
      ]);
      setEnrollments(enrollRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load your training.");
    } finally {
      setLoadingEnrollments(false);
    }
    try {
      const certRes = await getCertificates({ userId: user.id });
      setCertificates(certRes.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't load your certificates.");
    } finally {
      setLoadingCerts(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const courseById = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c._id, c));
    return map;
  }, [courses]);

  const active = enrollments.filter((e) => e.status !== "completed" && e.status !== "waived");
  const completed = enrollments.filter((e) => e.status === "completed");

  return (
    <LMSLayout
      title="My Training"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "My Training" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-[#0F1C2E] rounded-xl p-6 text-white">
          <div className="text-white/50 text-sm mb-1">Welcome back,</div>
          <div className="font-display font-extrabold text-2xl uppercase">{displayName}</div>
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <div className="text-white/50">Active</div>
              <div className="font-bold text-xl">{active.length}</div>
            </div>
            <div>
              <div className="text-white/50">Completed</div>
              <div className="font-bold text-xl">{completed.length}</div>
            </div>
            <div>
              <div className="text-white/50">Certificates</div>
              <div className="font-bold text-xl">{certificates.length}</div>
            </div>
          </div>
        </div>

        {/* Active Training */}
        <div>
          <h3 className="font-display font-bold text-white text-xl uppercase mb-3">Active Training</h3>
          {loadingEnrollments ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : active.length > 0 ? (
            <div className="space-y-3">
              {active.map((enrollment) => {
                const cfg = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.assigned;
                const Icon = cfg.Icon;
                return (
                  <Link key={enrollment._id} href={`/lms/courses/${enrollment.courseId}`}>
                    <div className="bg-white rounded-xl border border-gray-100 hover:border-[#0047AB]/30 hover:shadow-sm transition-all p-4 cursor-pointer group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#0F1C2E] text-sm truncate">{courseById.get(enrollment.courseId)?.title ?? `Course #${enrollment.courseId}`}</div>
                          {enrollment.dueDate && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              Due {new Date(enrollment.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <Badge className={`border-transparent text-[10px] font-bold uppercase tracking-wide gap-1 ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-[#0047AB] h-1.5 rounded-full transition-all"
                          style={{ width: `${enrollment.progressPct ?? 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{enrollment.progressPct ?? 0}% complete</span>
                        <span className="text-[#0047AB] font-bold group-hover:text-[#1E90FF] flex items-center gap-1 transition-colors">
                          <Play className="w-3 h-3" /> Continue
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50">
                  <BookOpen className="text-gray-300" />
                </EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold text-sm">No active training assigned</EmptyTitle>
                <EmptyDescription>Your safety manager will assign courses here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h3 className="font-display font-bold text-white text-xl uppercase mb-3">Completed</h3>
            <div className="space-y-2">
              {completed.map((enrollment) => (
                <div key={enrollment._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0F1C2E] text-sm">{courseById.get(enrollment.courseId)?.title ?? `Course #${enrollment.courseId}`}</div>
                    {enrollment.completionAt && (
                      <div className="text-xs text-gray-400">Completed {new Date(enrollment.completionAt).toLocaleDateString()}</div>
                    )}
                  </div>
                  <Badge className="border-transparent text-xs font-bold text-green-600 bg-green-50">100%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        <div>
          <h3 className="font-display font-bold text-white text-xl uppercase mb-3">My Certificates</h3>
          {loadingCerts ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : certificates.length > 0 ? (
            <div className="space-y-2">
              {certificates.map((cert) => {
                const certCourse = cert.courseId ? courseById.get(cert.courseId) : undefined;
                const certTitle = cert.certificateTitle || certCourse?.certificateTitle || certCourse?.title || "Certificate";
                return (
                <div key={cert._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0047AB]/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-[#0047AB]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0F1C2E] text-sm truncate">{certTitle}</div>
                    <div className="text-xs text-gray-400">
                      {cert.certificateNumber && `Certificate #${cert.certificateNumber} · `}
                      {cert.issuedAt && `Issued ${new Date(cert.issuedAt).toLocaleDateString()}`}
                      {cert.expiresAt && ` · Expires ${new Date(cert.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cert.score != null && (
                      <Badge className="border-transparent text-xs font-bold text-[#0047AB] bg-[#0047AB]/10">
                        Score: {cert.score}%
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold gap-1 h-auto py-1.5 px-3"
                      onClick={(e) => { e.stopPropagation(); toast.info("Certificate download coming soon"); }}
                    >
                      <Download className="w-3 h-3" /> PDF
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <Empty className="bg-white rounded-xl border border-gray-100 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-50">
                  <Award className="text-gray-300" />
                </EmptyMedia>
                <EmptyTitle className="text-gray-500 font-semibold text-sm">No certificates yet</EmptyTitle>
                <EmptyDescription>Complete a course to earn your first certificate.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </LMSLayout>
  );
}
