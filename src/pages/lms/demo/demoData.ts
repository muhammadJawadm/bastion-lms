/**
 * Demo data fixtures for Bastion LMS interactive demo.
 * Used by LMSDemoEmployee and LMSDemoAdmin pages.
 * All data is static and fictional — no real users or companies.
 */

export const DEMO_COMPANY = {
  id: 1,
  name: "Pacific Coast Contractors, Inc.",
  industry: "construction",
  plan: "professional",
  isActive: true,
  contactEmail: "safety@pacificcoastcontractors.com",
  employeeCount: 52,
};

export const DEMO_EMPLOYEE = {
  id: 101,
  name: "Marcus Rivera",
  email: "m.rivera@pacificcoastcontractors.com",
  jobTitle: "Lead Ironworker",
  department: "Structural Steel",
  lmsRole: "employee",
};

export const DEMO_ADMIN = {
  id: 1,
  name: "Sarah Chen",
  email: "s.chen@pacificcoastcontractors.com",
  jobTitle: "EHS Manager",
  department: "Safety",
  lmsRole: "client-admin",
};

export const DEMO_COURSES = [
  {
    id: 1,
    title: "Construction Safety Fundamentals",
    description: "Covers fall protection, scaffolding, electrical safety, excavation, and more. Completion certificate issued upon passing.",
    category: "safety",
    duration: 600,
    lessonCount: 12,
    thumbnail: null,
    isPublished: true,
    passingScore: 70,
  },
  {
    id: 2,
    title: "Fall Protection — Competent Person",
    description: "OSHA-required Competent Person training for supervisors overseeing work at heights. Covers harness inspection, anchor points, and rescue procedures.",
    category: "competent-person",
    duration: 240,
    lessonCount: 6,
    thumbnail: null,
    isPublished: true,
    passingScore: 80,
  },
  {
    id: 3,
    title: "Hazard Communication (HazCom) / GHS",
    description: "OSHA 1910.1200 compliance training covering SDS sheets, labeling, and chemical hazard identification.",
    category: "general-industry",
    duration: 120,
    lessonCount: 4,
    thumbnail: null,
    isPublished: true,
    passingScore: 70,
  },
  {
    id: 4,
    title: "Lockout / Tagout (LOTO)",
    description: "Authorized and Affected Employee training for OSHA 1910.147. Covers energy control procedures, lockout devices, and verification.",
    category: "general-industry",
    duration: 90,
    lessonCount: 3,
    thumbnail: null,
    isPublished: true,
    passingScore: 75,
  },
  {
    id: 5,
    title: "Scaffold Safety — Erector & User",
    description: "Covers scaffold types, load capacities, fall protection requirements, and inspection procedures per OSHA 1926 Subpart Q.",
    category: "construction",
    duration: 180,
    lessonCount: 5,
    thumbnail: null,
    isPublished: true,
    passingScore: 70,
  },
  {
    id: 6,
    title: "First Aid / CPR / AED",
    description: "American Red Cross certified First Aid, CPR, and AED training. Valid for 2 years. Includes hands-on skills verification.",
    category: "first-aid",
    duration: 240,
    lessonCount: 8,
    thumbnail: null,
    isPublished: true,
    passingScore: 80,
  },
];

export const DEMO_EMPLOYEE_ENROLLMENTS = [
  {
    id: 1,
    courseId: 1,
    courseTitle: "Construction Safety Fundamentals",
    status: "completed",
    progressPct: 100,
    score: 88,
    enrolledAt: new Date("2026-01-15"),
    completedAt: new Date("2026-01-22"),
    dueDate: new Date("2026-02-01"),
    certificateNumber: "BRSG-2026-A8F2K1",
  },
  {
    id: 2,
    courseId: 2,
    courseTitle: "Fall Protection — Competent Person",
    status: "in_progress",
    progressPct: 67,
    score: null,
    enrolledAt: new Date("2026-03-01"),
    completedAt: null,
    dueDate: new Date("2026-06-30"),
    certificateNumber: null,
  },
  {
    id: 3,
    courseId: 3,
    courseTitle: "Hazard Communication (HazCom) / GHS",
    status: "completed",
    progressPct: 100,
    score: 92,
    enrolledAt: new Date("2026-02-10"),
    completedAt: new Date("2026-02-12"),
    dueDate: new Date("2026-03-01"),
    certificateNumber: "BRSG-2026-B3C9D7",
  },
  {
    id: 4,
    courseId: 4,
    courseTitle: "Lockout / Tagout (LOTO)",
    status: "not_started",
    progressPct: 0,
    score: null,
    enrolledAt: new Date("2026-05-01"),
    completedAt: null,
    dueDate: new Date("2026-07-15"),
    certificateNumber: null,
  },
];

export const DEMO_CERTIFICATES = [
  {
    id: 1,
    certificateNumber: "BRSG-2026-A8F2K1",
    courseTitle: "Construction Safety Fundamentals",
    issuedAt: new Date("2026-01-22"),
    expiresAt: new Date("2029-01-22"),
    score: 88,
  },
  {
    id: 2,
    certificateNumber: "BRSG-2026-B3C9D7",
    courseTitle: "Hazard Communication (HazCom) / GHS",
    issuedAt: new Date("2026-02-12"),
    expiresAt: new Date("2029-02-12"),
    score: 92,
  },
];

export const DEMO_COMPANY_STATS = {
  totalEmployees: 52,
  completions: 147,
  completionRate: 83,
  overdueCount: 3,
  inProgressCount: 11,
  notStartedCount: 7,
};

export const DEMO_ALL_ENROLLMENTS = [
  { id: 1, employeeName: "Marcus Rivera", courseTitle: "Construction Safety Fundamentals", status: "completed", progressPct: 100, dueDate: new Date("2026-02-01") },
  { id: 2, employeeName: "Jordan Lee", courseTitle: "Construction Safety Fundamentals", status: "completed", progressPct: 100, dueDate: new Date("2026-02-01") },
  { id: 3, employeeName: "Tyler Brooks", courseTitle: "Fall Protection — Competent Person", status: "in_progress", progressPct: 45, dueDate: new Date("2026-06-30") },
  { id: 4, employeeName: "Priya Nair", courseTitle: "Hazard Communication (HazCom) / GHS", status: "completed", progressPct: 100, dueDate: new Date("2026-03-01") },
  { id: 5, employeeName: "Carlos Mendez", courseTitle: "Lockout / Tagout (LOTO)", status: "overdue", progressPct: 20, dueDate: new Date("2026-04-15") },
  { id: 6, employeeName: "Aisha Johnson", courseTitle: "Scaffold Safety — Erector & User", status: "not_started", progressPct: 0, dueDate: new Date("2026-07-01") },
  { id: 7, employeeName: "Devon Walsh", courseTitle: "First Aid / CPR / AED", status: "completed", progressPct: 100, dueDate: new Date("2026-03-15") },
  { id: 8, employeeName: "Sam Ortega", courseTitle: "Construction Safety Fundamentals", status: "overdue", progressPct: 60, dueDate: new Date("2026-05-01") },
];

export const DEMO_TREND_DATA = [
  { month: "Jan", assigned: 18, completed: 14 },
  { month: "Feb", assigned: 22, completed: 19 },
  { month: "Mar", assigned: 15, completed: 13 },
  { month: "Apr", assigned: 28, completed: 21 },
  { month: "May", assigned: 20, completed: 17 },
  { month: "Jun", assigned: 25, completed: 18 },
];

export const DEMO_EMPLOYEES = [
  { id: 101, name: "Marcus Rivera", email: "m.rivera@pacificcoast.com", jobTitle: "Lead Ironworker", department: "Structural Steel", lmsRole: "employee", completions: 2, overdue: 0 },
  { id: 102, name: "Jordan Lee", email: "j.lee@pacificcoast.com", jobTitle: "Foreman", department: "Concrete", lmsRole: "employee", completions: 4, overdue: 0 },
  { id: 103, name: "Tyler Brooks", email: "t.brooks@pacificcoast.com", jobTitle: "Ironworker", department: "Structural Steel", lmsRole: "employee", completions: 1, overdue: 1 },
  { id: 104, name: "Priya Nair", email: "p.nair@pacificcoast.com", jobTitle: "Safety Coordinator", department: "Safety", lmsRole: "client-admin", completions: 5, overdue: 0 },
  { id: 105, name: "Carlos Mendez", email: "c.mendez@pacificcoast.com", jobTitle: "Equipment Operator", department: "Heavy Equipment", lmsRole: "employee", completions: 0, overdue: 2 },
  { id: 106, name: "Aisha Johnson", email: "a.johnson@pacificcoast.com", jobTitle: "Carpenter", department: "Framing", lmsRole: "employee", completions: 3, overdue: 0 },
];
