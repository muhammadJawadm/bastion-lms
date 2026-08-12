/**
 * LMS Employees — Client Admin view (UI Prototype)
 * Manage employees: list, invite by email, bulk CSV upload, view training status.
 * Runs entirely on local mock state — invites and imports just add rows to an
 * in-memory list seeded from mockData.ts. No tRPC, no network calls.
 */

import { useMemo, useState, useRef } from "react";
import { Link } from "wouter";
import {
  Search, Plus, Upload, Download, Loader2, Users, ClipboardList, Award,
  Clock, Mail, Briefcase, Building2, X, KeyRound, Copy, Check, Smartphone, RefreshCw,
} from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_EMPLOYEES, MOCK_COURSES, enrollmentsStore, type MockEmployee } from "./mockData";

const ROLE_LABELS: Record<MockEmployee["lmsRole"], string> = {
  client_admin: "Client Admin",
  employee: "Employee",
};

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  assigned: "Not Started",
  in_progress: "In Progress",
  completed: "Complete",
  overdue: "Overdue",
  waived: "Waived",
};

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  assigned: "bg-gray-100 text-gray-500",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  waived: "bg-purple-100 text-purple-600",
};

function initialsOf(value: string): string {
  return value.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

/** Generates a random temporary password for a new mobile-app login — this is a UI
 * prototype, so there's no real auth backend; the value is only ever shown once to
 * the admin so they can hand it to the employee for their first mobile sign-in. */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** A single-line credential value with a copy-to-clipboard button. */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</Label>
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#F4F6F9]">
        <span className="text-sm font-mono text-gray-800 flex-1 truncate">{value}</span>
        <button type="button" onClick={handleCopy} className="text-gray-400 hover:text-[#0047AB] transition-colors shrink-0" title="Copy">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/** Training stats for one employee, joined from the shared enrollmentsStore. */
function getTrainingStats(userId: number) {
  const rows = enrollmentsStore.filter((e) => e.userId === userId);
  const completed = rows.filter((e) => e.status === "completed").length;
  const completionPct = rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;
  let lastActivity: Date | null = null;
  for (const e of rows) {
    const candidate = e.completedAt ?? e.createdAt;
    if (!lastActivity || new Date(candidate) > new Date(lastActivity)) lastActivity = candidate;
  }
  return { assigned: rows.length, completed, completionPct, lastActivity, enrollments: rows };
}

let nextMockId = Math.max(...MOCK_EMPLOYEES.map((e) => e.id)) + 1;

function CreateUserModal({ companyId, open, onClose, onCreated }: {
  companyId: number; open: boolean; onClose: () => void; onCreated: (e: MockEmployee) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [lmsRole, setLmsRole] = useState<MockEmployee["lmsRole"]>("employee");
  const [tempPassword, setTempPassword] = useState(() => generateTempPassword());
  const [emailCreds, setEmailCreds] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const reset = () => {
    setEmail(""); setName(""); setDept(""); setJobTitle(""); setLmsRole("employee");
    setTempPassword(generateTempPassword()); setEmailCreds(true); setCreated(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email is required"); return; }
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onCreated({
        id: nextMockId++,
        name: name || email.split("@")[0],
        email,
        department: dept || "Unassigned",
        jobTitle: jobTitle || "—",
        isActive: true,
        companyId,
        lmsRole,
      });
      setCreated({ email, password: tempPassword });
      toast.success(emailCreds ? `Account created — login details emailed to ${email}` : "Account created");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {created ? (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left shrink-0">
              <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Account Created</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Smartphone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-blue-700 text-xs leading-relaxed">
                  Share these details with the employee — they'll use them to sign in on the Bastion mobile app.
                  {emailCreds && " We've also emailed them a copy."}
                </p>
              </div>
              <CopyField label="Email" value={created.email} />
              <CopyField label="Temporary Password" value={created.password} />
              <p className="text-[11px] text-gray-400">The employee will be prompted to set their own password on first sign-in.</p>
            </div>
            <DialogFooter className="p-6 pt-4 border-t border-gray-100 shrink-0">
              <Button onClick={handleClose} className="w-full h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide">
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left shrink-0">
              <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Create User</DialogTitle>
              <p className="text-xs text-gray-400 font-normal normal-case mt-1">
                Creates a login the employee will use in the Bastion mobile app. There's no self-signup on mobile — accounts are provisioned here.
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email Address *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@company.com" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Department</Label>
                  <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="e.g. Framing Crew" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Job Title</Label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Journeyman Carpenter" className="focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Role</Label>
                  <Select value={lmsRole} onValueChange={(v) => setLmsRole(v as MockEmployee["lmsRole"])}>
                    <SelectTrigger className="w-full focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="client_admin">Client Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="font-mono focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20" />
                    <Button type="button" variant="outline" onClick={() => setTempPassword(generateTempPassword())} className="shrink-0 border-gray-200 text-gray-500 hover:text-[#0047AB]" title="Generate new password">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-400">Used for the employee's first mobile app sign-in — they'll be asked to set their own password after.</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-bold text-gray-600">Email login details</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Send the credentials to the employee automatically</div>
                  </div>
                  <Switch checked={emailCreds} onCheckedChange={setEmailCreds} />
                </div>
              </div>
              <DialogFooter className="p-6 pt-4 border-t border-gray-100 shrink-0 sm:justify-stretch">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><KeyRound className="w-4 h-4" /> Create User</>}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CSVUploadModal({ companyId, open, onClose, onImported }: {
  companyId: number; open: boolean; onClose: () => void; onImported: (rows: MockEmployee[]) => void;
}) {
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string }[] | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleClose = () => { setCsvText(""); setCreatedCreds(null); onClose(); };

  const handleImport = () => {
    if (!csvText.trim()) { toast.error("Please select or paste a CSV file"); return; }
    const lines = csvText.trim().split("\n").filter(Boolean);
    const header = lines[0]?.toLowerCase() ?? "";
    const hasHeader = header.includes("email") || header.includes("name");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const parsed = dataLines.map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return { email: cols[0] ?? "", name: cols[1], department: cols[2], jobTitle: cols[3] };
    }).filter((e) => e.email);
    if (parsed.length === 0) { toast.error("No valid rows found. Make sure column 1 is email."); return; }
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      const rows: MockEmployee[] = parsed.map((p) => ({
        id: nextMockId++,
        name: p.name || p.email.split("@")[0],
        email: p.email,
        department: p.department || "Unassigned",
        jobTitle: p.jobTitle || "—",
        isActive: true,
        companyId,
        lmsRole: "employee",
      }));
      onImported(rows);
      setCreatedCreds(rows.map((r) => ({ email: r.email, password: generateTempPassword() })));
      toast.success(`Created ${rows.length} employee accounts`);
      setCsvText("");
    }, 500);
  };

  const copyAllCreds = () => {
    if (!createdCreds) return;
    const text = createdCreds.map((c) => `${c.email}\t${c.password}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied all logins to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {createdCreds ? (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left shrink-0">
              <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Accounts Created</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Smartphone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-blue-700 text-xs leading-relaxed">
                  Share each temporary password with that employee — they'll use it to sign in on the Bastion mobile app for the first time.
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                {createdCreds.map((c) => (
                  <div key={c.email} className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700 truncate">{c.email}</span>
                    <span className="font-mono text-gray-500 shrink-0">{c.password}</span>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={copyAllCreds} className="w-full border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide gap-2">
                <Copy className="w-4 h-4" /> Copy All Logins
              </Button>
            </div>
            <DialogFooter className="p-6 pt-4 border-t border-gray-100 shrink-0">
              <Button onClick={handleClose} className="w-full h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide">
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left shrink-0">
              <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Bulk Create Users</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="bg-[#F4F6F9] rounded-lg p-4 text-sm text-gray-600">
                <div className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2">CSV Format (one row per employee):</div>
                <code className="text-xs font-mono">email, name, department, job_title</code>
                <div className="text-xs text-gray-400 mt-1">Only email is required. Header row is optional. A login is created for each row — there's no self-signup on the mobile app.</div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Upload CSV File</Label>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 text-center hover:border-[#0047AB] hover:bg-[#0047AB]/5 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">Click to upload CSV file</div>
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Or Paste CSV Data</Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={5}
                  placeholder={"john@company.com, John Smith, Framing Crew, Carpenter\njane@company.com, Jane Doe, Safety, Safety Officer"}
                  className="text-xs font-mono focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20 resize-none"
                />
              </div>
            </div>
            <div className="p-6 pt-4 border-t border-gray-100 shrink-0 flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isPending || !csvText.trim()}
                className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2"
              >
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Users"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Employee Detail Drawer ───────────────────────────────────────────────────

function EmployeeDetailDrawer({ employee, onClose, onUpdate }: {
  employee: MockEmployee;
  onClose: () => void;
  onUpdate: (patch: Partial<MockEmployee>) => void;
}) {
  const stats = getTrainingStats(employee.id);
  const courseTitle = (courseId: number) => MOCK_COURSES.find((c) => c.id === courseId)?.title ?? `Course #${courseId}`;
  const [resetPassword, setResetPassword] = useState<string | null>(null);

  const handleResetPassword = () => {
    setResetPassword(generateTempPassword());
    toast.success("New temporary password generated");
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetTitle className="sr-only">{employee.name}</SheetTitle>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Employee Detail</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-[#0047AB]/10 text-[#0047AB] text-base font-bold">
                {initialsOf(employee.name ?? employee.email ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-display font-bold text-[#0F1C2E] text-lg truncate">{employee.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Mail className="w-3 h-3" /> {employee.email}
              </div>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="p-6 space-y-4 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                <Building2 className="w-3 h-3" /> Group
              </div>
              <div className="text-sm text-gray-800">{employee.department || "—"}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                <Briefcase className="w-3 h-3" /> Job Title
              </div>
              <div className="text-sm text-gray-800">{employee.jobTitle || "—"}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-bold text-gray-600">Role</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Client Admins can manage courses, employees, and billing.</div>
            </div>
            <Select value={employee.lmsRole} onValueChange={(v) => onUpdate({ lmsRole: v as MockEmployee["lmsRole"] })}>
              <SelectTrigger className="w-36 h-9 text-xs focus-visible:border-[#0047AB] focus-visible:ring-[#0047AB]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="client_admin">Client Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-bold text-gray-600">Active</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Inactive employees keep their history but can't sign in.</div>
            </div>
            <Switch checked={employee.isActive} onCheckedChange={(v) => onUpdate({ isActive: v })} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-bold text-gray-600">Mobile App Login</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Reset their password if they're locked out.</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetPassword} className="h-auto py-1.5 text-xs font-bold gap-1.5 border-gray-200 text-gray-600 hover:text-[#0047AB] hover:border-[#0047AB]/40">
              <KeyRound className="w-3.5 h-3.5" /> Reset Password
            </Button>
          </div>
          {resetPassword && <CopyField label="New Temporary Password" value={resetPassword} />}
        </div>

        {/* Training summary */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#F4F6F9] rounded-lg p-3 text-center">
              <div className="font-display font-extrabold text-[#0F1C2E] text-xl">{stats.assigned}</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wide mt-0.5">Assigned</div>
            </div>
            <div className="bg-[#F4F6F9] rounded-lg p-3 text-center">
              <div className="font-display font-extrabold text-green-600 text-xl">{stats.completionPct}%</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wide mt-0.5">Completion</div>
            </div>
            <div className="bg-[#F4F6F9] rounded-lg p-3 text-center">
              <div className="font-display font-extrabold text-[#0F1C2E] text-xl">{stats.completed}</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wide mt-0.5">Completed</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2.5">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> Assigned Training
            </div>
            <Button asChild size="sm" variant="outline" className="h-auto py-1.5 text-xs font-bold gap-1.5 border-[#0047AB]/30 text-[#0047AB] hover:bg-[#0047AB]/5">
              <Link href="/lms/assignments"><Plus className="w-3 h-3" /> Assign</Link>
            </Button>
          </div>

          {stats.enrollments.length > 0 ? (
            <div className="space-y-2">
              {stats.enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 p-3 bg-[#F4F6F9] rounded-lg">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{courseTitle(e.courseId)}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      {e.status === "completed" ? <Award className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {e.progressPct}% complete
                    </div>
                  </div>
                  <Badge className={cn("shrink-0 border-transparent text-[10px] font-bold uppercase tracking-wide", ENROLLMENT_STATUS_COLORS[e.status])}>
                    {ENROLLMENT_STATUS_LABELS[e.status] ?? e.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No training assigned yet.</p>
          )}
        </div>

        {/* Last activity */}
        <div className="p-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Last Activity</div>
          <div className="text-sm text-gray-700">
            {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "No activity yet"}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function LMSEmployees() {
  const { role, setRole, user } = useLMS();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | MockEmployee["lmsRole"]>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [employees, setEmployees] = useState<MockEmployee[]>(MOCK_EMPLOYEES);
  const [detailEmployee, setDetailEmployee] = useState<MockEmployee | null>(null);

  // Use the logged-in user's companyId; fall back to 0 (platform admin sees nothing here)
  const companyId = (user as any)?.companyId ?? 0;

  // "Group" maps to department — this app's data model doesn't have a
  // separate group entity, and department already functions as the crew/team
  // grouping unit (e.g. "Framing Crew", "Safety", "Excavation").
  const groups = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      (e.name ?? "").toLowerCase().includes(q) ||
      (e.email ?? "").toLowerCase().includes(q) ||
      (e.department ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || e.lmsRole === roleFilter;
    const matchGroup = groupFilter === "all" || e.department === groupFilter;
    return matchSearch && matchRole && matchGroup;
  });

  function handleUpdateEmployee(id: number, patch: Partial<MockEmployee>) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setDetailEmployee((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    toast.success("Employee updated");
  }

  const downloadTemplate = () => {
    const csv = "email,name,department,job_title\njohn@company.com,John Smith,Framing Crew,Carpenter\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employee_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (companyId === 0) {
    return (
      <LMSLayout
        title="Employees"
        breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Employees" }]}
        role={role}
        onRoleChange={setRole}
      >
        <Empty className="py-20 border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-white/5 size-14">
              <Users className="text-white/20 size-7" />
            </EmptyMedia>
            <EmptyTitle className="font-display uppercase text-white/60 text-xl">Platform Admin View</EmptyTitle>
            <EmptyDescription className="text-white/40">Switch to "Safety Manager" role to manage employees for a specific company.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout
      title="Employees"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Employees" }]}
      role={role}
      onRoleChange={setRole}
    >
      <CreateUserModal companyId={companyId} open={showCreateUser} onClose={() => setShowCreateUser(false)} onCreated={(e) => setEmployees((prev) => [e, ...prev])} />
      <CSVUploadModal companyId={companyId} open={showCSV} onClose={() => setShowCSV(false)} onImported={(rows) => setEmployees((prev) => [...rows, ...prev])} />
      {detailEmployee && (
        <EmployeeDetailDrawer
          employee={detailEmployee}
          onClose={() => setDetailEmployee(null)}
          onUpdate={(patch) => handleUpdateEmployee(detailEmployee.id, patch)}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">Employees</h2>
            <p className="text-white/60 text-sm mt-0.5">{employees.length} employees registered</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 bg-transparent font-bold text-sm uppercase tracking-wide gap-2 h-auto py-2.5">
              <Download className="w-4 h-4" /> Template
            </Button>
            <Button variant="outline" onClick={() => setShowCSV(true)} className="border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/10 bg-transparent font-bold text-sm uppercase tracking-wide gap-2 h-auto py-2.5">
              <Upload className="w-4 h-4" /> Bulk Create
            </Button>
            <Button onClick={() => setShowCreateUser(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
              <Plus className="w-4 h-4" /> Create User
            </Button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
            />
          </div>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="w-full sm:w-44 bg-white focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="client_admin">Client Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Employee</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Group</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Job Title</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Role</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Training</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Last Activity</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => {
                  const stats = getTrainingStats(emp.id);
                  return (
                  <TableRow key={emp.id} className="border-gray-50 cursor-pointer hover:bg-gray-50/70" onClick={() => setDetailEmployee(emp)}>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-[#0047AB]/10 text-[#1E90FF] text-xs font-bold">
                            {initialsOf(emp.name ?? emp.email ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-800">{emp.name ?? "—"}</div>
                          <div className="text-xs text-gray-400">{emp.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 hidden md:table-cell">{emp.department ?? "—"}</TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 hidden lg:table-cell">{emp.jobTitle ?? "—"}</TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge className={`border-transparent text-[10px] font-bold uppercase tracking-wide ${
                        emp.lmsRole === "client_admin" ? "bg-[#0047AB]/10 text-[#0047AB]" : "bg-gray-100 text-gray-500"
                      }`}>
                        {ROLE_LABELS[emp.lmsRole]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3 hidden xl:table-cell">
                      {stats.assigned > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#0047AB] h-1.5 rounded-full" style={{ width: `${stats.completionPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{stats.completed}/{stats.assigned}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-400 text-xs hidden xl:table-cell">
                      {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge className={`border-transparent text-[10px] font-bold uppercase tracking-wide ${
                        emp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {emp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="bg-white rounded-xl border border-gray-100 py-20">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-gray-50 size-14">
                <Users className="text-gray-300 size-7" />
              </EmptyMedia>
              <EmptyTitle className="font-display uppercase text-gray-400 text-xl">
                {search ? "No Employees Found" : "No Employees Yet"}
              </EmptyTitle>
              <EmptyDescription>
                {search ? `No employees match "${search}"` : "Create user accounts individually or upload a CSV to get started — employees log into the mobile app with the credentials created here."}
              </EmptyDescription>
            </EmptyHeader>
            {!search && (
              <EmptyContent>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowCSV(true)} className="border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB]/5 text-sm font-bold uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
                    <Upload className="w-4 h-4" /> Bulk Create
                  </Button>
                  <Button onClick={() => setShowCreateUser(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
                    <Plus className="w-4 h-4" /> Create User
                  </Button>
                </div>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </LMSLayout>
  );
}
