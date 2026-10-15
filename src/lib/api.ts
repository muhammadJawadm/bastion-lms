/**
 * Bastion LMS API client — thin fetch wrapper around the real backend
 * described in `Bastion-LMS.postman_collection.json`.
 *
 * Notes carried over from that collection on purpose:
 *  - The server mounts every router at the root — there is NO `/api` prefix.
 *    `VITE_API_BASE_URL` is just the host:port (defaults to the collection's
 *    own `http://localhost:5000`).
 *  - Every success response is shaped `{ data: ... }`, with a `token` field
 *    added alongside `data` on login/register/profile calls.
 *  - Auth is a bearer token read from this module's token storage and sent
 *    on every request once set — callers don't need to attach it by hand.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "https://16.192.77.140.nip.io";

const TOKEN_KEY = "bastion_lms_token";

/** Small wrapper around localStorage so the rest of the app never touches the key directly. */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore — e.g. private browsing with storage blocked */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Skip attaching the stored bearer token (login/register/etc. are public). */
  noAuth?: boolean;
  /** Pass a FormData body as-is (uploads) instead of JSON-encoding it. */
  formData?: FormData;
}

/**
 * Core request helper. Unwraps `{ data }` envelopes are left to callers —
 * this returns the full parsed JSON body so a caller can also read a
 * sibling `token` field (login/register/profile) when present.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (!options.noAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData; // browser sets the multipart Content-Type/boundary itself
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.", null);
  }

  const text = await res.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, json);
  }

  return json as T;
}

// ─── Auth ───────────────────────────────────────────────────────────────────
// Matches collection folder "1. Auth - Signup & Login" exactly — see that
// collection for the manual-OTP run order this depends on.

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  companyId?: string;
  role: "platform_admin" | "client_admin" | "employee" | "user";
  department?: string;
  jobTitle?: string;
  mustChangePassword?: boolean;
  [key: string]: unknown;
}

interface AuthResponse {
  data: AuthUser;
  token?: string;
}

export function registerCompanyAdmin(input: { name: string; email: string; password: string; companyName: string }) {
  return apiFetch<AuthResponse>("/users/register", { method: "POST", body: input, noAuth: true });
}

export function loginUser(input: { email: string; password: string }) {
  return apiFetch<AuthResponse>("/users/login", { method: "POST", body: input, noAuth: true });
}

export function verifyOtp(input: { email: string; otp: string }) {
  return apiFetch<AuthResponse>("/users/verify-otp", { method: "POST", body: input, noAuth: true });
}

export function resendOtp(input: { email: string }) {
  return apiFetch<{ message?: string }>("/users/resend-otp", { method: "POST", body: input, noAuth: true });
}

export function forgotPassword(input: { email: string }) {
  return apiFetch<{ message?: string }>("/users/forgot-password", { method: "POST", body: input, noAuth: true });
}

export function verifyResetOtp(input: { email: string; otp: string }) {
  return apiFetch<{ message?: string }>("/users/verify-reset-otp", { method: "POST", body: input, noAuth: true });
}

export function resetPassword(input: { email: string; password: string; confirmPassword: string }) {
  return apiFetch<{ message?: string }>("/users/reset-password", { method: "POST", body: input, noAuth: true });
}

/** Own profile — re-issues a fresh token, per the collection's note on 1.5/3.6. */
export function getMyProfile() {
  return apiFetch<AuthResponse>("/users/profile");
}

export function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string; confirmPassword: string }
) {
  return apiFetch<{ message?: string }>(`/users/${userId}/change-password`, { method: "PATCH", body: input });
}

/** Builds a `?key=value&...` query string, skipping undefined/empty values. */
function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`).join("&");
}

interface Envelope<T> {
  data: T;
}

// ─── Courses ────────────────────────────────────────────────────────────────
// Matches collection folder "4. Courses" — see that collection for the exact
// request/response shapes this depends on.

export interface Course {
  _id: string;
  title: string;
  companyId: string | null;
  createdBy?: string;
  description?: string;
  category?: string;
  status: "draft" | "published" | "archived";
  durationMinutes?: number;
  passScore?: number;
  issuesCertificate?: boolean;
  certificateTitle?: string;
  coverImageUrl?: string | null;
  lessonCount?: number;
  enrollmentCount?: number;
  /** Library listing only (4.5) — whether this companyId:null course was already added to your company. */
  added?: boolean;
  modules?: CourseModule[];
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CourseModule {
  _id: string;
  title: string;
  sortOrder?: number;
}

/** companyId/createdBy are derived from the caller's token now — never sent. */
export function createCourse(input: { title: string; coverImageUrl?: string }) {
  return apiFetch<Envelope<Course>>("/courses", { method: "POST", body: input });
}

export function deleteCourse(id: string) {
  return apiFetch<{ message?: string }>(`/courses/${id}`, { method: "DELETE" });
}

export function updateCourseSettings(input: {
  courseId: string;
  /** Not in the collection's example body — send-and-see; harmless if the backend ignores it. */
  title?: string;
  description?: string;
  category?: string;
  status?: Course["status"];
  durationMinutes?: number | string;
  passScore?: number | string;
  issuesCertificate?: boolean;
  certificateTitle?: string;
  coverImageUrl?: string;
}) {
  return apiFetch<Envelope<Course>>("/courses/settings", { method: "PATCH", body: input });
}

export function getCourses(params: { search?: string; status?: string } = {}) {
  return apiFetch<Envelope<Course[]>>(`/courses${buildQuery(params)}`);
}

export function getCourseById(id: string) {
  return apiFetch<Envelope<Course>>(`/courses/${id}`);
}

/** companyId:null courses, flagged "added" per your own company automatically (4.8). */
export function getCourseLibrary() {
  return apiFetch<Envelope<Course[]>>("/courses/library");
}

export function addLibraryCourseToCompany(libraryCourseId: string) {
  return apiFetch<Envelope<Course>>(`/courses/library/${libraryCourseId}/add-to-company`, { method: "POST" });
}

// ─── Modules ────────────────────────────────────────────────────────────────
// Embedded on Course.modules — Lesson.moduleId points at a module's _id.

export function addModule(courseId: string, input: { title: string }) {
  return apiFetch<Envelope<CourseModule>>(`/courses/${courseId}/modules`, { method: "POST", body: input });
}

export function getModules(courseId: string) {
  return apiFetch<Envelope<CourseModule[]>>(`/courses/${courseId}/modules`);
}

export function updateModule(moduleId: string, input: { title?: string; sortOrder?: number }) {
  return apiFetch<Envelope<CourseModule>>(`/modules/${moduleId}`, { method: "PATCH", body: input });
}

/** Unassigns (doesn't delete) any lesson pointing at this module. */
export function deleteModule(moduleId: string) {
  return apiFetch<{ message?: string }>(`/modules/${moduleId}`, { method: "DELETE" });
}

// ─── Lessons & Blocks ("Pages") ─────────────────────────────────────────────
// Matches collection folder "5. Lessons & Pages".

export interface LessonBlock {
  _id: string;
  type: string;
  title?: string;
  /** Free-form per `type` — the backend stores this as Mixed with no validation. */
  data: any;
  sortOrder?: number;
}

export interface Lesson {
  _id: string;
  courseId: string;
  moduleId?: string | null;
  title: string;
  isRequired?: boolean;
  durationMinutes?: number;
  blocks: LessonBlock[];
  createdAt?: string;
  updatedAt?: string;
}

/** Auto-seeds one block on creation, per the backend's own behavior. */
export function createLesson(courseId: string, input: { title: string; moduleId?: string }) {
  return apiFetch<Envelope<Lesson>>(`/courses/${courseId}/lessons`, { method: "POST", body: input });
}

export function getLessonById(lessonId: string) {
  return apiFetch<Envelope<Lesson>>(`/lessons/${lessonId}`);
}

export function updateLesson(
  lessonId: string,
  input: { title?: string; isRequired?: boolean; durationMinutes?: number | string; moduleId?: string | null }
) {
  return apiFetch<Envelope<Lesson>>(`/lessons/${lessonId}`, { method: "PATCH", body: input });
}

export function addBlock(lessonId: string, input: { type: string; title?: string; data: unknown }) {
  return apiFetch<Envelope<LessonBlock>>(`/lessons/${lessonId}/blocks`, { method: "POST", body: input });
}

export function updateBlock(lessonId: string, blockId: string, input: { title?: string; data?: unknown }) {
  return apiFetch<Envelope<LessonBlock>>(`/lessons/${lessonId}/blocks/${blockId}`, { method: "PATCH", body: input });
}

/** Full ordered array of block ids — drag-reorder in one call. */
export function reorderBlocks(lessonId: string, order: string[]) {
  return apiFetch<{ message?: string }>(`/lessons/${lessonId}/blocks/reorder`, { method: "POST", body: { order } });
}

export function deleteBlock(lessonId: string, blockId: string) {
  return apiFetch<{ message?: string }>(`/lessons/${lessonId}/blocks/${blockId}`, { method: "DELETE" });
}

export function deleteLesson(lessonId: string) {
  return apiFetch<{ message?: string }>(`/lessons/${lessonId}`, { method: "DELETE" });
}

// ─── Forms ──────────────────────────────────────────────────────────────────
// Matches collection folder "6. Forms".

export interface FormFieldRecord {
  _id: string;
  type: string;
  label: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
  answerSetId?: string;
  min?: number;
  max?: number;
  flagValues?: string[];
}

export interface FormColumnRecord {
  _id: string;
  label: string;
}

export type FormItemRecord =
  | { _id: string; kind: "section"; title?: string; fields: FormFieldRecord[] }
  | { _id: string; kind: "table"; title?: string; columns: FormColumnRecord[] }
  | { _id: string; kind: "instruction"; body: string };

export interface FormPageRecord {
  _id: string;
  title: string;
  items: FormItemRecord[];
}

export interface FormRecord {
  _id: string;
  title: string;
  description?: string;
  companyId: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  status: "draft" | "published";
  logic?: unknown[];
  reportLayout?: unknown;
  pages?: FormPageRecord[];
  createdAt?: string;
  updatedAt?: string;
}

/** companyId is derived from the caller's token now — never sent. */
export function createForm(input: { title: string; description?: string; ownerId: string }) {
  return apiFetch<Envelope<FormRecord>>("/forms", { method: "POST", body: input });
}

export function getForms(params: { search?: string; status?: string } = {}) {
  return apiFetch<Envelope<FormRecord[]>>(`/forms${buildQuery(params)}`);
}

export function getFormById(id: string) {
  return apiFetch<Envelope<FormRecord>>(`/forms/${id}`);
}

export function updateForm(
  id: string,
  input: Partial<{ title: string; description: string; status: FormRecord["status"]; logic: unknown[]; reportLayout: unknown }>
) {
  return apiFetch<Envelope<FormRecord>>(`/forms/${id}`, { method: "PATCH", body: input });
}

/** Cascades to its responses. */
export function deleteForm(id: string) {
  return apiFetch<{ message?: string }>(`/forms/${id}`, { method: "DELETE" });
}

export function addFormPage(formId: string, input: { title: string }) {
  return apiFetch<Envelope<FormPageRecord>>(`/forms/${formId}/pages`, { method: "POST", body: input });
}

export function deleteFormPage(formId: string, pageId: string) {
  return apiFetch<{ message?: string }>(`/forms/${formId}/pages/${pageId}`, { method: "DELETE" });
}

export function updateFormPage(formId: string, pageId: string, input: { title?: string }) {
  return apiFetch<Envelope<FormPageRecord>>(`/forms/${formId}/pages/${pageId}`, { method: "PATCH", body: input });
}

export function reorderFormPages(formId: string, order: string[]) {
  return apiFetch<{ message?: string }>(`/forms/${formId}/pages/reorder`, { method: "POST", body: { order } });
}

export type AddFormItemInput =
  | { kind: "section"; title?: string }
  | { kind: "table"; title?: string }
  | { kind: "instruction"; body: string };

export function addFormItem(formId: string, pageId: string, input: AddFormItemInput) {
  return apiFetch<Envelope<FormItemRecord>>(`/forms/${formId}/pages/${pageId}/items`, { method: "POST", body: input });
}

/** NOT in the collection (section/table/instruction items got no update or delete example) — guessed REST shapes; confirm or add server-side. */
export function updateFormItem(formId: string, pageId: string, itemId: string, input: Partial<{ title: string; body: string }>) {
  return apiFetch<Envelope<FormItemRecord>>(`/forms/${formId}/pages/${pageId}/items/${itemId}`, { method: "PATCH", body: input });
}

export function deleteFormItem(formId: string, pageId: string, itemId: string) {
  return apiFetch<{ message?: string }>(`/forms/${formId}/pages/${pageId}/items/${itemId}`, { method: "DELETE" });
}

export interface AddFormFieldInput {
  type: string;
  label: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
  answerSetId?: string;
  min?: number;
  max?: number;
  flagValues?: string[];
}

export function addFormField(formId: string, pageId: string, itemId: string, input: AddFormFieldInput) {
  return apiFetch<Envelope<FormFieldRecord>>(`/forms/${formId}/pages/${pageId}/items/${itemId}/fields`, { method: "POST", body: input });
}

export function updateFormField(
  formId: string,
  pageId: string,
  itemId: string,
  fieldId: string,
  input: Partial<AddFormFieldInput>
) {
  return apiFetch<Envelope<FormFieldRecord>>(`/forms/${formId}/pages/${pageId}/items/${itemId}/fields/${fieldId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteFormField(formId: string, pageId: string, itemId: string, fieldId: string) {
  return apiFetch<{ message?: string }>(`/forms/${formId}/pages/${pageId}/items/${itemId}/fields/${fieldId}`, { method: "DELETE" });
}

export function addFormColumn(formId: string, pageId: string, itemId: string, input: { label: string }) {
  return apiFetch<Envelope<FormColumnRecord>>(`/forms/${formId}/pages/${pageId}/items/${itemId}/columns`, { method: "POST", body: input });
}

export function updateFormColumn(formId: string, pageId: string, itemId: string, columnId: string, input: { label: string }) {
  return apiFetch<Envelope<FormColumnRecord>>(`/forms/${formId}/pages/${pageId}/items/${itemId}/columns/${columnId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteFormColumn(formId: string, pageId: string, itemId: string, columnId: string) {
  return apiFetch<{ message?: string }>(`/forms/${formId}/pages/${pageId}/items/${itemId}/columns/${columnId}`, { method: "DELETE" });
}

export interface FormResponseAnswer {
  fieldId: string;
  value: string;
  flagged?: boolean;
}

export interface FormResponseTableRow {
  itemId: string;
  rows: { cells: { columnId: string; value: string }[] }[];
}

export interface FormResponseRecord {
  _id: string;
  formId: string;
  companyId: string;
  submittedBy: string;
  answers: FormResponseAnswer[];
  tableRows?: FormResponseTableRow[];
  createdAt?: string;
}

export function submitFormResponse(
  formId: string,
  input: { companyId: string; submittedBy: string; answers: { fieldId: string; value: string }[]; tableRows?: FormResponseTableRow[] }
) {
  return apiFetch<Envelope<FormResponseRecord>>(`/forms/${formId}/responses`, { method: "POST", body: input });
}

export function getFormResponses(formId: string) {
  return apiFetch<Envelope<FormResponseRecord[]>>(`/forms/${formId}/responses`);
}

export function getFormResponseById(formId: string, responseId: string) {
  return apiFetch<Envelope<FormResponseRecord>>(`/forms/${formId}/responses/${responseId}`);
}

// ─── Answer Sets ──────────────────────────────────────────────────────────────
// Matches collection folder "7. Answer Sets" — reusable, org-wide option lists
// a choice field can point at via `answerSetId` instead of inlining `options`.

export interface AnswerSetRecord {
  _id: string;
  companyId: string;
  label: string;
  options: string[];
}

/** companyId is derived from the caller's token now — never sent. */
export function createAnswerSet(input: { label: string; options: string[] }) {
  return apiFetch<Envelope<AnswerSetRecord>>("/answer-sets", { method: "POST", body: input });
}

export function getAnswerSets() {
  return apiFetch<Envelope<AnswerSetRecord[]>>("/answer-sets");
}

export function updateAnswerSet(id: string, input: Partial<{ label: string; options: string[] }>) {
  return apiFetch<Envelope<AnswerSetRecord>>(`/answer-sets/${id}`, { method: "PATCH", body: input });
}

export function deleteAnswerSet(id: string) {
  return apiFetch<{ message?: string }>(`/answer-sets/${id}`, { method: "DELETE" });
}

// ─── People (Users & Co-Admins) ────────────────────────────────────────────
// Matches collection folder "3. People (Users & Co-Admins)". One unified
// `/users` resource, always scoped to the caller's own company — there is no
// separate "employee" role any more, just "user" (mobile/field workers,
// carrying department/jobTitle) and "client_admin" (can have several per
// company). `role` on CompanyPerson narrows further if needed by callers.

export interface CompanyPerson {
  _id: string;
  name: string;
  email: string;
  role: "user" | "client_admin";
  companyId?: string;
  department?: string;
  jobTitle?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** `role` defaults to the backend's own default (user-only) when omitted; pass "all" for everyone. */
export function getCompanyPeople(params: { role?: "user" | "client_admin" | "all"; search?: string } = {}) {
  return apiFetch<Envelope<CompanyPerson[]>>(`/users${buildQuery(params)}`);
}

export function getPersonById(id: string) {
  return apiFetch<Envelope<CompanyPerson>>(`/users/${id}`);
}

/** Creates a mobile "user" by default — pass role:"client_admin" to add a co-admin instead. companyId is always forced to the caller's own. */
export function createCompanyPerson(input: { name: string; email: string; password: string; department?: string; jobTitle?: string; role?: "user" | "client_admin" }) {
  return apiFetch<Envelope<CompanyPerson>>("/users", { method: "POST", body: input });
}

/** `password` isn't demonstrated anywhere (no admin-reset-password example) — guessed as accepted by this same generic PATCH; confirm or add a dedicated endpoint server-side. */
export function updatePerson(id: string, input: Partial<{ name: string; department: string; jobTitle: string; role: "user" | "client_admin"; isActive: boolean; password: string }>) {
  return apiFetch<Envelope<CompanyPerson>>(`/users/${id}`, { method: "PATCH", body: input });
}

export function deletePerson(id: string) {
  return apiFetch<{ message?: string }>(`/users/${id}`, { method: "DELETE" });
}

// ─── Enrollments ────────────────────────────────────────────────────────────
// Matches collection folder "7. Enrollments" — always scoped to the caller's
// own company. Powers Dashboard/Employees/Assignments/MyTraining.

export interface EnrollmentRecord {
  _id: string;
  courseId: string;
  userId: string;
  companyId?: string;
  /** Raw 5-value status — not the mobile app's 3-value simplification. */
  status: "assigned" | "in_progress" | "overdue" | "completed" | "waived";
  progressPct: number;
  dueDate?: string | null;
  completionAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function getEnrollments(params: {
  courseId?: string;
  userId?: string;
  status?: EnrollmentRecord["status"];
  search?: string;
  perPage?: number | string;
  pageNo?: number | string;
} = {}) {
  return apiFetch<Envelope<EnrollmentRecord[]>>(
    `/enrollments${buildQuery({
      courseId: params.courseId,
      userId: params.userId,
      status: params.status,
      search: params.search,
      perPage: params.perPage !== undefined ? String(params.perPage) : undefined,
      pageNo: params.pageNo !== undefined ? String(params.pageNo) : undefined,
    })}`
  );
}

export function createEnrollment(input: { courseId: string; userId: string; dueDate?: string }) {
  return apiFetch<Envelope<EnrollmentRecord>>("/enrollments", { method: "POST", body: input });
}

export function getEnrollmentById(id: string) {
  return apiFetch<Envelope<EnrollmentRecord>>(`/enrollments/${id}`);
}

/** A Company Admin can set status/dueDate directly (not just progressPct, which is what a mobile user's own token is limited to). Hitting progressPct:100 auto-completes and, if the course issuesCertificate, auto-issues a Certificate. */
export function updateEnrollment(id: string, input: Partial<{ status: EnrollmentRecord["status"]; dueDate: string; progressPct: number }>) {
  return apiFetch<Envelope<EnrollmentRecord>>(`/enrollments/${id}`, { method: "PATCH", body: input });
}

export function deleteEnrollment(id: string) {
  return apiFetch<{ message?: string }>(`/enrollments/${id}`, { method: "DELETE" });
}

// ─── Certificates ───────────────────────────────────────────────────────────
// Matches collection folder "8. Certificates" — always scoped to the
// caller's own company. Most are auto-issued by `updateEnrollment` hitting
// 100%; `issueCertificate` is for training tracked outside a course/
// enrollment entirely (e.g. in-person sessions).

export interface CertificateRecord {
  _id: string;
  userId: string;
  courseId?: string;
  companyId?: string;
  certificateTitle?: string;
  certificateNumber?: string;
  score?: number | null;
  issuedAt?: string;
  expiresAt?: string | null;
}

export function getCertificates(params: { userId?: string; courseId?: string } = {}) {
  return apiFetch<Envelope<CertificateRecord[]>>(`/certificates${buildQuery(params)}`);
}

export function getCertificateById(id: string) {
  return apiFetch<Envelope<CertificateRecord>>(`/certificates/${id}`);
}

export function issueCertificate(input: { userId: string; certificateTitle: string; score?: number; courseId?: string }) {
  return apiFetch<Envelope<CertificateRecord>>("/certificates", { method: "POST", body: input });
}

/** Revokes a certificate. */
export function deleteCertificate(id: string) {
  return apiFetch<{ message?: string }>(`/certificates/${id}`, { method: "DELETE" });
}

// ─── Uploads ────────────────────────────────────────────────────────────────
// Cloudinary-backed. Two paths depending on file size:
//  - ≤20MB  → one multipart POST to /uploads (simple proxy).
//  - >20MB  → signed chunked upload straight to Cloudinary (/uploads/signature
//             then /uploads/confirm) — required for lesson videos, which can
//             be 200-300MB and would otherwise hit per-request body limits.
// `uploadCourseFile` picks the right path automatically; callers just need a
// File, a folder, and an optional progress callback.

export type UploadFolder =
  | "course-covers" | "lesson-media" | "form-media" | "signatures"
  | "certificates" | "avatars" | "supporting-media";

export interface UploadRecord {
  _id: string;
  url: string;
  storageKey?: string;
  resourceType?: string;
  [key: string]: unknown;
}

export interface UploadResult {
  success: boolean;
  url: string;
  id: string;
  data: UploadRecord;
}

const SIMPLE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024; // routing boundary, not a hard server cap
const MAX_UPLOAD_BYTES = 300 * 1024 * 1024; // client-side hard reject
const CLOUDINARY_CHUNK_SIZE = 20 * 1024 * 1024; // Cloudinary's recommended chunk size

function simpleUpload(file: File, folder: UploadFolder): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  return apiFetch<UploadResult>("/uploads", { method: "POST", formData });
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  /** Backend-prefixed folder (e.g. "bastion-lms/lesson-media") — resend exactly as received. */
  folder: string;
}

function getUploadSignature(folder: UploadFolder) {
  return apiFetch<Envelope<UploadSignature>>(`/uploads/signature${buildQuery({ folder })}`);
}

interface ConfirmUploadInput {
  publicId: string;
  url: string;
  resourceType: string;
  folder: UploadFolder;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

function confirmUpload(input: ConfirmUploadInput): Promise<UploadResult> {
  return apiFetch<UploadResult>("/uploads/confirm", { method: "POST", body: input });
}

export function getUploads() {
  return apiFetch<Envelope<UploadRecord[]>>("/uploads");
}

export function getUploadById(id: string) {
  return apiFetch<Envelope<UploadRecord>>(`/uploads/${id}`);
}

/** Removes the upload from Cloudinary too — call on replace/remove so files don't orphan. */
export function deleteUpload(id: string) {
  return apiFetch<{ message?: string }>(`/uploads/${id}`, { method: "DELETE" });
}

interface CloudinaryChunkResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  bytes: number;
}

/** One chunk, straight to Cloudinary (not through apiFetch — different host, different auth, and only XHR gives upload progress). */
function uploadChunkToCloudinary(params: {
  sig: UploadSignature;
  chunk: Blob;
  start: number;
  end: number;
  totalSize: number;
  uploadId: string;
  onChunkProgress: (loadedInChunk: number) => void;
}): Promise<CloudinaryChunkResult | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${params.sig.cloudName}/auto/upload`);
    xhr.setRequestHeader("X-Unique-Upload-Id", params.uploadId);
    xhr.setRequestHeader("Content-Range", `bytes ${params.start}-${params.end - 1}/${params.totalSize}`);
    xhr.upload.onprogress = (e) => params.onChunkProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
        } catch {
          resolve(null); // intermediate chunk ack — no useful body
        }
      } else {
        reject(new Error(`Cloudinary chunk upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during chunk upload"));
    const formData = new FormData();
    formData.append("file", params.chunk);
    formData.append("api_key", params.sig.apiKey);
    formData.append("timestamp", String(params.sig.timestamp));
    formData.append("signature", params.sig.signature);
    formData.append("folder", params.sig.folder);
    xhr.send(formData);
  });
}

/** Sends every chunk of one file under one signature. Each chunk gets up to 3 attempts before the whole upload fails. */
async function runChunkedUpload(
  file: File,
  sig: UploadSignature,
  onProgress?: (pct: number) => void
): Promise<CloudinaryChunkResult> {
  const uploadId = crypto.randomUUID();
  const total = file.size;
  let start = 0;
  let lastResult: CloudinaryChunkResult | null = null;

  while (start < total) {
    const end = Math.min(start + CLOUDINARY_CHUNK_SIZE, total);
    const chunk = file.slice(start, end);

    for (let attempt = 1; ; attempt++) {
      try {
        const result = await uploadChunkToCloudinary({
          sig, chunk, start, end, totalSize: total, uploadId,
          onChunkProgress: (loaded) => onProgress?.(Math.round(((start + loaded) / total) * 100)),
        });
        if (result) lastResult = result;
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
      }
    }
    start = end;
    onProgress?.(Math.round((start / total) * 100));
  }

  if (!lastResult) throw new ApiError(0, "Upload finished but Cloudinary returned no result.", null);
  return lastResult;
}

/**
 * Uploads a course content file (video/image/PDF) and returns the same
 * `{ url, id, ... }` shape regardless of which path was used. `onProgress`
 * receives 0-100; for small files it'll just jump straight to 100.
 */
export async function uploadCourseFile(
  file: File,
  folder: UploadFolder,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(0, "File is too large (max 300 MB).", null);
  }

  if (file.size <= SIMPLE_UPLOAD_MAX_BYTES) {
    onProgress?.(0);
    const result = await simpleUpload(file, folder);
    onProgress?.(100);
    return result;
  }

  // Large file — signed chunked upload straight to Cloudinary.
  let sigRes = await getUploadSignature(folder);
  let cloudResult: CloudinaryChunkResult;
  try {
    cloudResult = await runChunkedUpload(file, sigRes.data, onProgress);
  } catch {
    // A signature can't be refreshed mid-session (the timestamp is baked into
    // it) — on failure, get a fresh one and restart the whole sequence from
    // byte 0, once. Only plausible on an extremely stalled connection.
    sigRes = await getUploadSignature(folder);
    cloudResult = await runChunkedUpload(file, sigRes.data, onProgress);
  }

  return confirmUpload({
    publicId: cloudResult.public_id,
    url: cloudResult.secure_url,
    resourceType: cloudResult.resource_type,
    folder,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
}
