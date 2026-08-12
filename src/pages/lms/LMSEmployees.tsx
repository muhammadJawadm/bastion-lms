/**
 * LMS Employees — Client Admin view (UI Prototype)
 * Manage employees: list, invite by email, bulk CSV upload, view training status.
 * Runs entirely on local mock state — invites and imports just add rows to an
 * in-memory list seeded from mockData.ts. No tRPC, no network calls.
 */

import { useState, useRef } from "react";
import { Search, Plus, Upload, Download, Loader2, Users } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MOCK_EMPLOYEES, type MockEmployee } from "./mockData";

function initialsOf(value: string): string {
  return value.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

let nextMockId = Math.max(...MOCK_EMPLOYEES.map((e) => e.id)) + 1;

function InviteModal({ companyId, open, onClose, onInvited }: {
  companyId: number; open: boolean; onClose: () => void; onInvited: (e: MockEmployee) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email is required"); return; }
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      onInvited({
        id: nextMockId++,
        name: name || email.split("@")[0],
        email,
        department: dept || "Unassigned",
        jobTitle: jobTitle || "—",
        isActive: true,
        companyId,
      });
      toast.success(`Invitation sent to ${email}`);
      setEmail(""); setName(""); setDept(""); setJobTitle("");
      onClose();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Invite Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          <DialogFooter className="pt-2 sm:justify-stretch">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

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
      }));
      onImported(rows);
      toast.success(`Imported ${rows.length} employees`);
      setCsvText("");
      onClose();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <DialogTitle className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Bulk CSV Import</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="bg-[#F4F6F9] rounded-lg p-4 text-sm text-gray-600">
            <div className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2">CSV Format (one row per employee):</div>
            <code className="text-xs font-mono">email, name, department, job_title</code>
            <div className="text-xs text-gray-400 mt-1">Only email is required. Header row is optional.</div>
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

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-3 border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isPending || !csvText.trim()}
              className="flex-1 h-auto py-3 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : "Import Employees"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LMSEmployees() {
  const { role, setRole, user } = useLMS();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [employees, setEmployees] = useState<MockEmployee[]>(MOCK_EMPLOYEES);

  // Use the logged-in user's companyId; fall back to 0 (platform admin sees nothing here)
  const companyId = (user as any)?.companyId ?? 0;

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.name ?? "").toLowerCase().includes(q) ||
      (e.email ?? "").toLowerCase().includes(q) ||
      (e.department ?? "").toLowerCase().includes(q)
    );
  });

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
      <InviteModal companyId={companyId} open={showInvite} onClose={() => setShowInvite(false)} onInvited={(e) => setEmployees((prev) => [e, ...prev])} />
      <CSVUploadModal companyId={companyId} open={showCSV} onClose={() => setShowCSV(false)} onImported={(rows) => setEmployees((prev) => [...rows, ...prev])} />

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
              <Upload className="w-4 h-4" /> Bulk Import
            </Button>
            <Button onClick={() => setShowInvite(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
              <Plus className="w-4 h-4" /> Invite
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
          />
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-[#F4F6F9] hover:bg-[#F4F6F9]">
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Employee</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Department</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Job Title</TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.id} className="border-gray-50">
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
                        emp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {emp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
                {search ? `No employees match "${search}"` : "Invite employees individually or upload a CSV to get started."}
              </EmptyDescription>
            </EmptyHeader>
            {!search && (
              <EmptyContent>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowCSV(true)} className="border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB]/5 text-sm font-bold uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
                    <Upload className="w-4 h-4" /> Bulk Import
                  </Button>
                  <Button onClick={() => setShowInvite(true)} className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide gap-2 h-auto py-2.5 px-5">
                    <Plus className="w-4 h-4" /> Invite Employee
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
