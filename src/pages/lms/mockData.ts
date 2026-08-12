/**
 * mockData.ts — Static fixture data for the Bastion LMS UI prototype.
 *
 * The entire LMS (outside of /lms/demo/*) currently runs on this file instead
 * of live tRPC calls. Nothing here touches the network, the database, or any
 * Manus platform service — it exists purely so the interface can be reviewed
 * and clicked through before backend work resumes.
 */

/**
 * Mock file "upload" — instead of sending base64 to a storage backend, just
 * hand the data back as a data: URI. Browsers render those directly, so
 * images/video/PDF previews work with zero network calls.
 */
export async function mockUploadFile(input: { base64: string; mimeType: string; filename?: string; folder?: string }): Promise<{ url: string }> {
  return { url: `data:${input.mimeType};base64,${input.base64}` };
}

export type MockRole = "platform-admin" | "client-admin" | "employee";

export interface MockUser {
  id: number;
  name: string;
  email: string;
  companyId: number;
  lmsRole: "platform_admin" | "client_admin" | "employee";
  role: "admin" | "user";
  jobTitle?: string;
}

export interface MockCompany {
  id: number;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  plan: "starter" | "professional" | "enterprise";
  isActive: boolean;
}

export interface MockCourse {
  id: number;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  category: string;
  durationMinutes: number;
  issuesCertificate: boolean;
  coverImageUrl: string | null;
  lessonCount: number;
  enrollmentCount: number;
  passScore?: number;
  isDemo?: boolean;
}

export interface MockEmployee {
  id: number;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  isActive: boolean;
  companyId: number;
}

export interface MockEnrollment {
  id: number;
  userId: number;
  courseId: number;
  companyId: number;
  status: "assigned" | "in_progress" | "completed" | "overdue" | "waived";
  progressPct: number;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface MockCertificate {
  id: number;
  certificateNumber: string;
  userId: number;
  courseId: number;
  companyId: number;
  score: number | null;
  issuedAt: Date;
  expiresAt: Date | null;
}

// ─── The logged-in user (Safety Manager persona, matches Settings fixtures) ──

export const MOCK_USER: MockUser = {
  id: 1,
  name: "Sarah Chen",
  email: "s.chen@pacificcoastcontractors.com",
  companyId: 1,
  lmsRole: "client_admin",
  role: "user",
  jobTitle: "Safety Manager",
};

export const MOCK_COMPANY: MockCompany = {
  id: 1,
  name: "Pacific Coast Contractors, Inc.",
  industry: "construction",
  contactName: "Sarah Chen",
  contactEmail: "s.chen@pacificcoastcontractors.com",
  contactPhone: "(703) 282-0803",
  city: "San Diego",
  state: "CA",
  plan: "professional",
  isActive: true,
};

export const MOCK_COMPANIES: MockCompany[] = [
  MOCK_COMPANY,
  { id: 2, name: "Summit Electrical Group", industry: "electrical", contactName: "Marcus Reyes", contactEmail: "marcus@summitelectrical.com", contactPhone: "(619) 555-0142", city: "Chula Vista", state: "CA", plan: "starter", isActive: true },
  { id: 3, name: "Northgate Utilities", industry: "utilities", contactName: "Dana Whitfield", contactEmail: "dana@northgateutil.com", contactPhone: "(858) 555-0198", city: "Oceanside", state: "CA", plan: "enterprise", isActive: true },
  { id: 4, name: "Blue Anchor Maritime", industry: "maritime", contactName: "Tom Alvarez", contactEmail: "tom@blueanchor.com", contactPhone: "(619) 555-0177", city: "San Diego", state: "CA", plan: "starter", isActive: false },
];

// ─── Courses ──────────────────────────────────────────────────────────────

export const MOCK_COURSES: MockCourse[] = [
  { id: 1, title: "Fall Protection Fundamentals", description: "Core requirements for working at height, anchor points, and PFAS inspection under 29 CFR 1926.502.", status: "published", category: "construction", durationMinutes: 45, issuesCertificate: true, coverImageUrl: null, lessonCount: 6, enrollmentCount: 24 },
  { id: 2, title: "Confined Space Entry", description: "Permit-required confined space procedures, atmospheric testing, and rescue planning.", status: "published", category: "construction", durationMinutes: 60, issuesCertificate: true, coverImageUrl: null, lessonCount: 8, enrollmentCount: 15 },
  { id: 3, title: "Lockout/Tagout (LOTO) Awareness", description: "Energy control procedures for servicing and maintaining equipment safely.", status: "published", category: "manufacturing", durationMinutes: 30, issuesCertificate: true, coverImageUrl: null, lessonCount: 5, enrollmentCount: 18 },
  { id: 4, title: "Trench & Excavation Safety", description: "Protective systems, soil classification, and daily inspection requirements.", status: "published", category: "construction", durationMinutes: 40, issuesCertificate: true, coverImageUrl: null, lessonCount: 6, enrollmentCount: 12 },
  { id: 5, title: "Hazard Communication (HazCom/GHS)", description: "Safety data sheets, container labeling, and chemical hazard awareness.", status: "draft", category: "general_industry", durationMinutes: 35, issuesCertificate: false, coverImageUrl: null, lessonCount: 4, enrollmentCount: 0 },
  { id: 6, title: "Electrical Safety — Arc Flash Awareness", description: "NFPA 70E basics, PPE categories, and boundary requirements around energized equipment.", status: "published", category: "electrical", durationMinutes: 50, issuesCertificate: true, coverImageUrl: null, lessonCount: 7, enrollmentCount: 9 },
];

// Mutable store so a course created/edited on the catalogue page is still
// there when navigating into the course builder (separate route components
// can't share React state — see toolboxTalksStore for the same pattern).
export let coursesStore: MockCourse[] = [...MOCK_COURSES];
let nextCourseId = Math.max(...MOCK_COURSES.map((c) => c.id), 0) + 1;

export function addCourse(course: Omit<MockCourse, "id">): MockCourse {
  const created: MockCourse = { ...course, id: nextCourseId++ };
  coursesStore = [created, ...coursesStore];
  return created;
}
export function getCourse(id: number): MockCourse | undefined {
  return coursesStore.find((c) => c.id === id);
}
export function patchCourse(id: number, patch: Partial<MockCourse>): void {
  coursesStore = coursesStore.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

// ─── Employees ────────────────────────────────────────────────────────────

export const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: 2, name: "James Rodriguez", email: "j.rodriguez@pacificcoastcontractors.com", department: "Framing Crew", jobTitle: "Journeyman Carpenter", isActive: true, companyId: 1 },
  { id: 3, name: "Amy Nguyen", email: "a.nguyen@pacificcoastcontractors.com", department: "Safety", jobTitle: "Safety Officer", isActive: true, companyId: 1 },
  { id: 4, name: "Derek Wallace", email: "d.wallace@pacificcoastcontractors.com", department: "Excavation", jobTitle: "Equipment Operator", isActive: true, companyId: 1 },
  { id: 5, name: "Priya Patel", email: "p.patel@pacificcoastcontractors.com", department: "Electrical", jobTitle: "Electrician", isActive: true, companyId: 1 },
  { id: 6, name: "Marcus Bell", email: "m.bell@pacificcoastcontractors.com", department: "Framing Crew", jobTitle: "Foreman", isActive: true, companyId: 1 },
  { id: 7, name: "Lisa Tran", email: "l.tran@pacificcoastcontractors.com", department: "Site Ops", jobTitle: "Project Coordinator", isActive: true, companyId: 1 },
  { id: 8, name: "Carlos Mendez", email: "c.mendez@pacificcoastcontractors.com", department: "Excavation", jobTitle: "Laborer", isActive: false, companyId: 1 },
  { id: 9, name: "Emily Osei", email: "e.osei@pacificcoastcontractors.com", department: "Electrical", jobTitle: "Apprentice Electrician", isActive: true, companyId: 1 },
];

// ─── Enrollments (drives dashboards, assignments, reports, analytics) ──────

const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export const MOCK_ENROLLMENTS: MockEnrollment[] = [
  { id: 1, userId: 2, courseId: 1, companyId: 1, status: "completed", progressPct: 100, dueDate: daysAgo(20), completedAt: daysAgo(18), createdAt: daysAgo(35) },
  { id: 2, userId: 2, courseId: 4, companyId: 1, status: "in_progress", progressPct: 60, dueDate: daysFromNow(5), completedAt: null, createdAt: daysAgo(10) },
  { id: 3, userId: 3, courseId: 1, companyId: 1, status: "completed", progressPct: 100, dueDate: daysAgo(30), completedAt: daysAgo(29), createdAt: daysAgo(40) },
  { id: 4, userId: 3, courseId: 2, companyId: 1, status: "completed", progressPct: 100, dueDate: daysAgo(15), completedAt: daysAgo(14), createdAt: daysAgo(25) },
  { id: 5, userId: 4, courseId: 4, companyId: 1, status: "overdue", progressPct: 20, dueDate: daysAgo(4), completedAt: null, createdAt: daysAgo(20) },
  { id: 6, userId: 4, courseId: 2, companyId: 1, status: "in_progress", progressPct: 45, dueDate: daysFromNow(9), completedAt: null, createdAt: daysAgo(8) },
  { id: 7, userId: 5, courseId: 6, companyId: 1, status: "completed", progressPct: 100, dueDate: daysAgo(12), completedAt: daysAgo(11), createdAt: daysAgo(22) },
  { id: 8, userId: 5, courseId: 3, companyId: 1, status: "assigned", progressPct: 0, dueDate: daysFromNow(14), completedAt: null, createdAt: daysAgo(3) },
  { id: 9, userId: 6, courseId: 1, companyId: 1, status: "completed", progressPct: 100, dueDate: daysAgo(25), completedAt: daysAgo(24), createdAt: daysAgo(38) },
  { id: 10, userId: 6, courseId: 4, companyId: 1, status: "overdue", progressPct: 10, dueDate: daysAgo(2), completedAt: null, createdAt: daysAgo(18) },
  { id: 11, userId: 7, courseId: 3, companyId: 1, status: "in_progress", progressPct: 75, dueDate: daysFromNow(3), completedAt: null, createdAt: daysAgo(9) },
  { id: 12, userId: 9, courseId: 6, companyId: 1, status: "assigned", progressPct: 0, dueDate: daysFromNow(20), completedAt: null, createdAt: daysAgo(1) },
  { id: 13, userId: 9, courseId: 3, companyId: 1, status: "in_progress", progressPct: 30, dueDate: daysFromNow(11), completedAt: null, createdAt: daysAgo(6) },
];

// The signed-in employee's own enrollments (used on My Training / employee dashboard).
export const MOCK_MY_ENROLLMENTS: MockEnrollment[] = [
  { id: 101, userId: MOCK_USER.id, courseId: 1, companyId: 1, status: "completed", progressPct: 100, dueDate: daysAgo(40), completedAt: daysAgo(38), createdAt: daysAgo(50) },
  { id: 102, userId: MOCK_USER.id, courseId: 2, companyId: 1, status: "in_progress", progressPct: 55, dueDate: daysFromNow(6), completedAt: null, createdAt: daysAgo(12) },
  { id: 103, userId: MOCK_USER.id, courseId: 6, companyId: 1, status: "assigned", progressPct: 0, dueDate: daysFromNow(18), completedAt: null, createdAt: daysAgo(2) },
];

// ─── Certificates ───────────────────────────────────────────────────────────

export const MOCK_CERTIFICATES: MockCertificate[] = [
  { id: 1, certificateNumber: "BLMS-2026-A1B2C3D4", userId: 2, courseId: 1, companyId: 1, score: 92, issuedAt: daysAgo(18), expiresAt: daysFromNow(365 * 3 - 18) },
  { id: 2, certificateNumber: "BLMS-2026-E5F6G7H8", userId: 3, courseId: 1, companyId: 1, score: 88, issuedAt: daysAgo(29), expiresAt: daysFromNow(365 * 3 - 29) },
  { id: 3, certificateNumber: "BLMS-2026-I9J0K1L2", userId: 3, courseId: 2, companyId: 1, score: 95, issuedAt: daysAgo(14), expiresAt: daysFromNow(365 * 3 - 14) },
  { id: 4, certificateNumber: "BLMS-2026-M3N4O5P6", userId: 5, courseId: 6, companyId: 1, score: 90, issuedAt: daysAgo(11), expiresAt: daysFromNow(365 * 3 - 11) },
  { id: 5, certificateNumber: "BLMS-2026-Q7R8S9T0", userId: 6, courseId: 1, companyId: 1, score: 84, issuedAt: daysAgo(24), expiresAt: daysFromNow(365 * 3 - 24) },
];

export const MOCK_MY_CERTIFICATES: MockCertificate[] = [
  { id: 201, certificateNumber: "BLMS-2026-U1V2W3X4", userId: MOCK_USER.id, courseId: 1, companyId: 1, score: 96, issuedAt: daysAgo(38), expiresAt: daysFromNow(365 * 3 - 38) },
];

// ─── Aggregate stats ────────────────────────────────────────────────────────

export const MOCK_PLATFORM_STATS = {
  totalCompanies: MOCK_COMPANIES.length,
  totalUsers: 47,
  totalCourses: MOCK_COURSES.length,
  totalCompletions: MOCK_ENROLLMENTS.filter((e) => e.status === "completed").length + 12,
};

export const MOCK_COMPANY_STATS = {
  totalEmployees: MOCK_EMPLOYEES.filter((e) => e.isActive).length,
  totalEnrollments: MOCK_ENROLLMENTS.length,
  completions: MOCK_ENROLLMENTS.filter((e) => e.status === "completed").length,
  overdue: MOCK_ENROLLMENTS.filter((e) => e.status === "overdue").length,
};

// ─── Billing (Stripe) ───────────────────────────────────────────────────────

export const MOCK_PLANS = [
  { id: "starter", name: "Starter", monthlyPrice: 9900, annualPrice: 7900, maxUsers: 25, features: ["Up to 25 employees", "Core course library", "Certificate generation", "Email support"] },
  { id: "professional", name: "Professional", monthlyPrice: 24900, annualPrice: 19900, maxUsers: 150, features: ["Up to 150 employees", "Custom course builder", "Toolbox Talks library", "Advanced reporting", "Priority support"] },
  { id: "enterprise", name: "Enterprise", monthlyPrice: 59900, annualPrice: 49900, maxUsers: 0, features: ["Unlimited employees", "White-label branding", "Dedicated account manager", "API access (coming soon)", "SLA-backed support"] },
] as const;

export const MOCK_SUBSCRIPTION = {
  hasSubscription: true,
  plan: { id: "professional", name: "Professional" },
  currentPeriodEnd: daysFromNow(22),
  cancelAtPeriodEnd: false,
};

// ─── Course Builder: modules, lessons, blocks ──────────────────────────────

export interface MockModule {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  sortOrder: number;
}

export interface MockLesson {
  id: number;
  courseId: number;
  moduleId: number | null;
  title: string;
  type: "text" | "video_embed" | "video_upload" | "pdf" | "quiz" | "image" | "resource" | "slides";
  body: string | null;
  contentUrl: string | null;
  description: string | null;
  durationMinutes: number;
  isRequired: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBlock {
  id: number;
  lessonId: number;
  type: string;
  // Loosely typed on purpose — the real shape depends on `type` (text, quiz,
  // canvas slide, etc.) and callers cast it to the specific block data type.
  data: any;
  sortOrder: number;
}

export const MOCK_MODULES: MockModule[] = [
  { id: 1, courseId: 1, title: "Fall Protection Basics", sortOrder: 0 },
];

export const MOCK_LESSONS: MockLesson[] = [
  { id: 1, courseId: 1, moduleId: 1, title: "Why Fall Protection Matters", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 10, isRequired: true, sortOrder: 0, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
  { id: 2, courseId: 1, moduleId: 1, title: "Anchor Points & PFAS Inspection", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 15, isRequired: true, sortOrder: 1, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
  { id: 3, courseId: 1, moduleId: 1, title: "Knowledge Check", type: "quiz", body: null, contentUrl: null, description: null, durationMinutes: 5, isRequired: true, sortOrder: 2, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
  { id: 4, courseId: 2, moduleId: null, title: "Confined Space Overview", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 12, isRequired: true, sortOrder: 0, createdAt: daysAgo(45), updatedAt: daysAgo(45) },
  { id: 5, courseId: 3, moduleId: null, title: "Energy Control Procedures", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 10, isRequired: true, sortOrder: 0, createdAt: daysAgo(30), updatedAt: daysAgo(30) },
  { id: 6, courseId: 4, moduleId: null, title: "Protective Systems Overview", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 10, isRequired: true, sortOrder: 0, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
  { id: 7, courseId: 6, moduleId: null, title: "Arc Flash Boundaries", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 12, isRequired: true, sortOrder: 0, createdAt: daysAgo(15), updatedAt: daysAgo(15) },
  { id: 8, courseId: 5, moduleId: null, title: "Reading Safety Data Sheets", type: "text", body: null, contentUrl: null, description: null, durationMinutes: 10, isRequired: true, sortOrder: 0, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 9, courseId: 5, moduleId: null, title: "Container Labeling & GHS Pictograms", type: "quiz", body: null, contentUrl: null, description: null, durationMinutes: 8, isRequired: true, sortOrder: 1, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
];

export const MOCK_BLOCKS: MockBlock[] = [
  { id: 1, lessonId: 1, type: "text", data: { html: "<h2>Why Fall Protection Matters</h2><p>Falls are the leading cause of fatalities in construction. OSHA requires fall protection at <strong>6 feet or more</strong> in construction. This lesson covers when fall protection is required and the acceptable methods for protecting yourself and your crew.</p>" }, sortOrder: 0 },
  { id: 2, lessonId: 1, type: "safety_tip", data: { text: "Always inspect your harness before every use — remove it from service immediately if you find frayed webbing, cuts, or damaged hardware." }, sortOrder: 1 },
  { id: 3, lessonId: 2, type: "text", data: { html: "<h2>Anchor Points & PFAS Inspection</h2><p>Anchor points must be rated for <strong>5,000 lbs minimum</strong> per worker. Never tie off to rebar, conduit, or other unrated points. Before each use, inspect your harness, lanyard, and connectors for wear, corrosion, or damage.</p>" }, sortOrder: 0 },
  { id: 4, lessonId: 2, type: "checklist", data: { title: "Pre-Use Harness Inspection", items: [
    { id: "1", text: "Webbing free of frays, cuts, or burns", required: true },
    { id: "2", text: "Buckles and D-rings free of corrosion or cracks", required: true },
    { id: "3", text: "Labels and certification tags legible", required: true },
  ] }, sortOrder: 1 },
  { id: 5, lessonId: 3, type: "quiz_question", data: {
    question: "At what height is fall protection required in construction under OSHA 29 CFR 1926.502?",
    options: [
      { id: "a", text: "4 feet" },
      { id: "b", text: "6 feet" },
      { id: "c", text: "10 feet" },
      { id: "d", text: "15 feet" },
    ],
    correctOptionId: "b",
    oshaRef: "29 CFR 1926.502",
  }, sortOrder: 0 },
  { id: 6, lessonId: 4, type: "text", data: { html: "<h2>Confined Space Overview</h2><p>A permit-required confined space has limited entry/exit, is not designed for continuous occupancy, and may contain a serious atmospheric or engulfment hazard. Always test the atmosphere — oxygen, flammability, then toxicity — before entry.</p>" }, sortOrder: 0 },
  { id: 7, lessonId: 5, type: "text", data: { html: "<h2>Energy Control Procedures</h2><p>Lockout/Tagout protects workers from the unexpected release of hazardous energy. Each worker applies their own personal lock — locks are never shared, and only the person who applied a lock may remove it.</p>" }, sortOrder: 0 },
  { id: 8, lessonId: 6, type: "text", data: { html: "<h2>Protective Systems Overview</h2><p>Trenches 5 feet or deeper require a protective system unless the excavation is made entirely in stable rock. A Competent Person must classify the soil and inspect the excavation daily and after any event that could increase hazards.</p>" }, sortOrder: 0 },
  { id: 9, lessonId: 7, type: "text", data: { html: "<h2>Arc Flash Boundaries</h2><p>NFPA 70E defines approach boundaries around energized equipment. Only Qualified Persons wearing appropriate arc-rated PPE may cross the arc flash boundary. Always de-energize and verify zero energy state before servicing equipment when possible.</p>" }, sortOrder: 0 },
  { id: 10, lessonId: 8, type: "text", data: { html: "<h2>Reading Safety Data Sheets</h2><p>Every hazardous chemical on site must have an accessible Safety Data Sheet (SDS). Each SDS follows a standardized 16-section format covering identification, hazards, composition, first-aid measures, and handling/storage requirements. Read the SDS before using any new chemical.</p>" }, sortOrder: 0 },
  { id: 11, lessonId: 8, type: "safety_tip", data: { text: "SDS binders must be kept in a location accessible to all workers on every shift — not locked in a supervisor's office." }, sortOrder: 1 },
  { id: 12, lessonId: 9, type: "quiz_question", data: {
    question: "Under GHS, what does the pictogram of a flame over a circle indicate?",
    options: [
      { id: "a", text: "Corrosive material" },
      { id: "b", text: "Oxidizer" },
      { id: "c", text: "Health hazard" },
      { id: "d", text: "Environmental hazard" },
    ],
    correctOptionId: "b",
    oshaRef: "29 CFR 1910.1200",
  }, sortOrder: 0 },
];

// Mutable stores (see toolboxTalksStore above for why: separate route
// components can't share React state, but ES module live bindings mean every
// importer always sees the current value of a re-assigned `let` export).
export let modulesStore: MockModule[] = [...MOCK_MODULES];
export let lessonsStore: MockLesson[] = [...MOCK_LESSONS];
export let blocksStore: MockBlock[] = [...MOCK_BLOCKS];

let nextModuleId = Math.max(...MOCK_MODULES.map((m) => m.id), 0) + 1;
let nextLessonId = Math.max(...MOCK_LESSONS.map((l) => l.id), 0) + 1;
let nextBlockId = Math.max(...MOCK_BLOCKS.map((b) => b.id), 0) + 1;

export function getModulesByCourse(courseId: number): MockModule[] {
  return modulesStore.filter((m) => m.courseId === courseId);
}
export function addModule(courseId: number, title: string, sortOrder: number): MockModule {
  const created: MockModule = { id: nextModuleId++, courseId, title, sortOrder };
  modulesStore = [...modulesStore, created];
  return created;
}
export function removeModule(id: number): void {
  modulesStore = modulesStore.filter((m) => m.id !== id);
  // Lessons in a deleted module become unassigned, matching the real backend behavior.
  lessonsStore = lessonsStore.map((l) => (l.moduleId === id ? { ...l, moduleId: null } : l));
}

export function getLessonsByCourse(courseId: number): MockLesson[] {
  return lessonsStore.filter((l) => l.courseId === courseId);
}
export function addLesson(input: { courseId: number; moduleId: number | null; title: string; type: MockLesson["type"]; sortOrder: number }): MockLesson {
  const created: MockLesson = {
    id: nextLessonId++,
    courseId: input.courseId,
    moduleId: input.moduleId,
    title: input.title,
    type: input.type,
    body: null,
    contentUrl: null,
    description: null,
    durationMinutes: 5,
    isRequired: true,
    sortOrder: input.sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  lessonsStore = [...lessonsStore, created];
  return created;
}
export function patchLesson(id: number, patch: Partial<MockLesson>): void {
  lessonsStore = lessonsStore.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date() } : l));
}
export function removeLesson(id: number): void {
  lessonsStore = lessonsStore.filter((l) => l.id !== id);
  blocksStore = blocksStore.filter((b) => b.lessonId !== id);
}

export function getBlocksByLesson(lessonId: number): MockBlock[] {
  return blocksStore.filter((b) => b.lessonId === lessonId).sort((a, b) => a.sortOrder - b.sortOrder);
}
export function addBlock(input: { lessonId: number; type: string; data: any; sortOrder: number }): MockBlock {
  const created: MockBlock = { id: nextBlockId++, lessonId: input.lessonId, type: input.type, data: input.data, sortOrder: input.sortOrder };
  blocksStore = [...blocksStore, created];
  return created;
}
export function patchBlock(id: number, patch: Partial<MockBlock>): void {
  blocksStore = blocksStore.map((b) => (b.id === id ? { ...b, ...patch } : b));
}
export function removeBlock(id: number): void {
  blocksStore = blocksStore.filter((b) => b.id !== id);
}
export function reorderBlocks(lessonId: number, orderedIds: number[]): void {
  blocksStore = blocksStore.map((b) => {
    if (b.lessonId !== lessonId) return b;
    const idx = orderedIds.indexOf(b.id);
    return idx === -1 ? b : { ...b, sortOrder: idx };
  });
}

// ─── Toolbox Talks ──────────────────────────────────────────────────────────

export interface MockToolboxTalk {
  id: number;
  title: string;
  topic: string;
  industry: string;
  source: "library" | "custom";
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  regulatoryRef: string | null;
  requiresSignoff: boolean;
  companyId: number | null;
}

export interface MockToolboxSignoff {
  name: string;
  signature: string;
  jobTitle: string;
}

export interface MockToolboxSession {
  id: number;
  talkId: number;
  location: string | null;
  conductedBy: string | null;
  notes: string | null;
  status: "in_progress" | "completed";
  startedAt: Date;
  completedAt: Date | null;
  signoffs: MockToolboxSignoff[];
}

export const MOCK_TOOLBOX_TALKS: MockToolboxTalk[] = [
  { id: 1, title: "Fall Protection", topic: "fall_protection", industry: "construction", source: "library", content: "<h2>Fall Protection — Pre-Work Safety Briefing</h2><p>Falls are the leading cause of fatalities in construction. OSHA requires fall protection at 6 feet or more. Review anchor points, harness inspection, and guardrail requirements with your crew before work begins.</p>", keyPoints: ["Fall protection required at 6 ft in construction", "Inspect harness before every use", "Anchor points rated for 5,000 lbs minimum", "Never tie off to rebar or unrated points"], estimatedMinutes: 10, regulatoryRef: "29 CFR 1926.502", requiresSignoff: true, companyId: null },
  { id: 2, title: "Scaffolding Safety", topic: "scaffolding", industry: "construction", source: "library", content: "<h2>Scaffolding Safety — Pre-Work Briefing</h2><p>Scaffolds must be inspected by a Competent Person before each shift. Never use a red-tagged scaffold. Guardrails are required at 10 feet or more above a lower level.</p>", keyPoints: ["Scaffold inspected by Competent Person each shift", "Never use a red-tagged scaffold", "Guardrails required at 10 ft or more", "Do not exceed rated load capacity"], estimatedMinutes: 10, regulatoryRef: "29 CFR 1926.451", requiresSignoff: true, companyId: null },
  { id: 3, title: "Lockout/Tagout (LOTO)", topic: "lockout_tagout", industry: "general_industry", source: "library", content: "<h2>Lockout/Tagout — Pre-Work Briefing</h2><p>LOTO protects workers from unexpected energization during servicing. Each worker applies their own personal lock. Tags alone are never a substitute for a physical lock.</p>", keyPoints: ["Each worker applies their own personal lock", "Tags alone are not lockout", "Verify zero energy state before starting work", "Identify all energy sources first"], estimatedMinutes: 10, regulatoryRef: "29 CFR 1910.147", requiresSignoff: true, companyId: null },
  { id: 4, title: "Confined Space Entry", topic: "confined_space", industry: "general_industry", source: "library", content: "<h2>Confined Space Entry — Pre-Work Briefing</h2><p>Never enter a permit-required confined space without a valid entry permit. Test atmosphere in order: oxygen, flammability, toxicity. An attendant must remain outside at all times.</p>", keyPoints: ["Valid entry permit required before entry", "Test O2, then LEL, then toxic gases", "Attendant remains outside at all times", "Establish rescue procedures before entry"], estimatedMinutes: 12, regulatoryRef: "29 CFR 1910.146", requiresSignoff: true, companyId: null },
  { id: 5, title: "Electrical Safety", topic: "electrical", industry: "electrical", source: "library", content: "<h2>Electrical Safety — Pre-Work Briefing</h2><p>Treat all electrical equipment as energized until proven otherwise. Maintain 10-foot minimum clearance from overhead power lines. Inspect cords and tools before each use.</p>", keyPoints: ["Treat equipment as energized until proven otherwise", "10-ft minimum clearance from power lines", "GFCI protection required for 120V tools", "Never remove the grounding prong"], estimatedMinutes: 10, regulatoryRef: "29 CFR 1926.403", requiresSignoff: true, companyId: null },
  { id: 6, title: "Personal Protective Equipment (PPE)", topic: "ppe", industry: "all", source: "library", content: "<h2>PPE — Pre-Work Briefing</h2><p>PPE is your last line of defense. Inspect all PPE before each use and replace anything damaged. Hard hat, safety glasses, and steel-toed boots are required on all construction sites.</p>", keyPoints: ["PPE is the last line of defense", "Inspect PPE before every use", "Hard hat, glasses, boots required on-site", "Never modify PPE"], estimatedMinutes: 8, regulatoryRef: "29 CFR 1926.95", requiresSignoff: true, companyId: null },
  { id: 7, title: "Heat Illness Prevention", topic: "heat_illness", industry: "all", source: "library", content: "<h2>Heat Illness Prevention — Pre-Work Briefing</h2><p>Drink water every 20 minutes, even if not thirsty. Shade must be available when temperature exceeds 80°F. Know the signs of heat stroke and call 911 immediately if suspected.</p>", keyPoints: ["Drink 8oz of water every 20 minutes", "Shade required above 80°F", "Know the signs of heat stroke", "Buddy system — watch each other"], estimatedMinutes: 8, regulatoryRef: "Cal/OSHA Title 8 §3395", requiresSignoff: true, companyId: null },
  { id: 8, title: "Hazard Communication (HazCom)", topic: "hazcom", industry: "general_industry", source: "library", content: "<h2>Hazard Communication — Pre-Work Briefing</h2><p>All chemical containers must be labeled. SDS sheets must be accessible to every worker. Read the SDS before using any new chemical on site.</p>", keyPoints: ["All containers must be labeled", "SDS sheets accessible to all workers", "Read SDS before using a new chemical", "Report unlabeled containers immediately"], estimatedMinutes: 10, regulatoryRef: "29 CFR 1910.1200", requiresSignoff: true, companyId: null },
  { id: 9, title: "Weekly Crew Safety Check-In", topic: "custom", industry: "construction", source: "custom", content: "<h2>Weekly Crew Safety Check-In</h2><p>A quick briefing to review site conditions, upcoming tasks, and any near-misses from the past week before starting Monday's work.</p>", keyPoints: ["Review near-misses from last week", "Confirm PPE availability for the crew", "Walk the site for new hazards"], estimatedMinutes: 5, regulatoryRef: null, requiresSignoff: true, companyId: 1 },
];

// Mutable, module-level "store" so a talk duplicated/created on the library
// page is still there when the app navigates to the builder/deliver routes
// (separate component mounts can't share React state, but ES module live
// bindings mean every importer always sees the current value here).
export let toolboxTalksStore: MockToolboxTalk[] = [...MOCK_TOOLBOX_TALKS];
let nextToolboxTalkId = Math.max(...MOCK_TOOLBOX_TALKS.map((t) => t.id)) + 1;

export function addToolboxTalk(talk: Omit<MockToolboxTalk, "id">): MockToolboxTalk {
  const created: MockToolboxTalk = { ...talk, id: nextToolboxTalkId++ };
  toolboxTalksStore = [created, ...toolboxTalksStore];
  return created;
}

export function updateToolboxTalk(id: number, patch: Partial<MockToolboxTalk>): void {
  toolboxTalksStore = toolboxTalksStore.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export function removeToolboxTalk(id: number): void {
  toolboxTalksStore = toolboxTalksStore.filter((t) => t.id !== id);
}

export function getToolboxTalk(id: number): MockToolboxTalk | undefined {
  return toolboxTalksStore.find((t) => t.id === id);
}

const SEED_TOOLBOX_SESSIONS: MockToolboxSession[] = [
  { id: 1, talkId: 1, location: "Main Site — Building A", conductedBy: "Sarah Chen", notes: null, status: "completed", startedAt: daysAgo(6), completedAt: daysAgo(6), signoffs: [
    { name: "James Rodriguez", signature: "James Rodriguez", jobTitle: "Journeyman Carpenter" },
    { name: "Marcus Bell", signature: "Marcus Bell", jobTitle: "Foreman" },
  ] },
  { id: 2, talkId: 3, location: "Shop Floor", conductedBy: "Sarah Chen", notes: "Reviewed after near-miss on Tuesday.", status: "completed", startedAt: daysAgo(2), completedAt: daysAgo(2), signoffs: [
    { name: "Priya Patel", signature: "Priya Patel", jobTitle: "Electrician" },
    { name: "Emily Osei", signature: "Emily Osei", jobTitle: "Apprentice Electrician" },
  ] },
];

export let toolboxSessionsStore: MockToolboxSession[] = [...SEED_TOOLBOX_SESSIONS];
let nextToolboxSessionId = Math.max(...SEED_TOOLBOX_SESSIONS.map((s) => s.id)) + 1;

export function addToolboxSession(session: Omit<MockToolboxSession, "id">): MockToolboxSession {
  const created: MockToolboxSession = { ...session, id: nextToolboxSessionId++ };
  toolboxSessionsStore = [created, ...toolboxSessionsStore];
  return created;
}

export function updateToolboxSession(id: number, patch: Partial<MockToolboxSession>): void {
  toolboxSessionsStore = toolboxSessionsStore.map((s) => (s.id === id ? { ...s, ...patch } : s));
}
