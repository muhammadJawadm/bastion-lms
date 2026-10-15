/**
 * ImpersonationPicker — Platform Admin Only
 *
 * A modal dialog that lets the platform admin select:
 *   1. A client company
 *   2. A role perspective (Client Admin or Employee)
 *   3. Optionally, a specific employee to preview as
 *
 * On confirm, calls startImpersonation() from LMSContext.
 */

import { useState } from "react";
import { useLMS, ImpersonationTarget } from "../LMSContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Users, ChevronRight, Eye, Search, X } from "lucide-react";
import { MOCK_COMPANIES, MOCK_EMPLOYEES, MOCK_USER } from "../mockData";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImpersonationPicker({ open, onClose }: Props) {
  const { startImpersonation } = useLMS();
  const [step, setStep] = useState<"company" | "role">("company");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [viewAs, setViewAs] = useState<"client-admin" | "employee">("client-admin");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Mock data — no network calls. Company 1 (Pacific Coast Contractors) has a
  // full mock roster; other companies preview with an empty employee list.
  const companies = MOCK_COMPANIES;
  const companiesLoading = false;

  const companyData = selectedCompanyId
    ? {
        company: MOCK_COMPANIES.find((c) => c.id === selectedCompanyId)!,
        employees:
          selectedCompanyId === MOCK_USER.companyId
            ? [
                { id: MOCK_USER.id, name: MOCK_USER.name, email: MOCK_USER.email, jobTitle: MOCK_USER.jobTitle, lmsRole: "client_admin" as const },
                ...MOCK_EMPLOYEES.map((e) => ({ id: e.id, name: e.name, email: e.email, jobTitle: e.jobTitle, lmsRole: "employee" as const })),
              ]
            : [],
      }
    : undefined;
  const companyLoading = false;

  const filteredCompanies = (companies ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const employees = (companyData?.employees ?? []).filter(
    (e) => viewAs === "employee" ? e.lmsRole === "employee" : e.lmsRole === "client_admin"
  );

  function handleSelectCompany(id: number) {
    setSelectedCompanyId(id);
    setSelectedUserId(null);
    setStep("role");
  }

  function handleConfirm() {
    if (!selectedCompanyId || !companyData) return;

    // If a specific user was selected, use their details; otherwise use a generic preview
    const targetEmployee = selectedUserId
      ? companyData.employees.find((e) => e.id === selectedUserId)
      : null;

    const target: ImpersonationTarget = {
      userId: String(targetEmployee?.id ?? 0),
      userName: targetEmployee?.name ?? null,
      userEmail: targetEmployee?.email ?? null,
      userLmsRole: viewAs === "client-admin" ? "client_admin" : "employee",
      companyId: String(selectedCompanyId),
      companyName: companyData.company.name,
      viewAs,
    };

    startImpersonation(target);
    onClose();
    // Reset state for next time
    setStep("company");
    setSelectedCompanyId(null);
    setSelectedUserId(null);
    setSearch("");
  }

  function handleBack() {
    setStep("company");
    setSelectedCompanyId(null);
    setSelectedUserId(null);
  }

  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0047AB]/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-[#0047AB]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#0F1C2E]">Preview As</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">View the LMS from a client's perspective</p>
            </div>
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <button
              onClick={() => step === "role" && handleBack()}
              className={step === "role" ? "text-[#0047AB] hover:underline cursor-pointer" : "text-gray-700 font-medium"}
            >
              Select Company
            </button>
            {step === "role" && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">Select Role</span>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Company Selection */}
          {step === "company" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/20 focus:border-[#0047AB]"
                />
              </div>

              {companiesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No companies found</p>
                  <p className="text-xs mt-1">Add client companies from the Platform Admin panel</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company.id)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#0047AB]/30 hover:bg-[#0047AB]/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0F1C2E] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{company.name}</div>
                        <div className="text-xs text-gray-400 capitalize mt-0.5">
                          {company.industry?.replace("_", " ")} · {company.plan} plan
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0047AB] transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Role + User Selection */}
          {step === "role" && (
            <div className="space-y-4">
              {selectedCompany && (
                <div className="flex items-center gap-2 p-3 bg-[#0047AB]/5 rounded-lg border border-[#0047AB]/15">
                  <Building2 className="w-4 h-4 text-[#0047AB] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#0047AB]">{selectedCompany.name}</span>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">View As</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["client-admin", "employee"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setViewAs(r); setSelectedUserId(null); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        viewAs === r
                          ? "border-[#0047AB] bg-[#0047AB]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        viewAs === r ? "bg-[#0047AB]" : "bg-gray-100"
                      }`}>
                        {r === "client-admin" ? (
                          <Building2 className={`w-4 h-4 ${viewAs === r ? "text-white" : "text-gray-500"}`} />
                        ) : (
                          <Users className={`w-4 h-4 ${viewAs === r ? "text-white" : "text-gray-500"}`} />
                        )}
                      </div>
                      <div className={`text-sm font-bold ${viewAs === r ? "text-[#0047AB]" : "text-gray-700"}`}>
                        {r === "client-admin" ? "Client Admin" : "Employee"}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {r === "client-admin"
                          ? "Manage courses, employees, reports"
                          : "My training, certificates"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional: pick a specific user */}
              {!companyLoading && employees.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Specific User <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedUserId === null
                          ? "bg-[#0047AB]/10 text-[#0047AB] font-semibold"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        ?
                      </div>
                      Generic {viewAs === "client-admin" ? "Client Admin" : "Employee"} view
                    </button>
                    {employees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedUserId(emp.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedUserId === emp.id
                            ? "bg-[#0047AB]/10 text-[#0047AB] font-semibold"
                            : "hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-[#0047AB]/20 flex items-center justify-center text-[10px] font-bold text-[#0047AB] flex-shrink-0">
                          {(emp.name ?? emp.email ?? "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="truncate">{emp.name ?? emp.email}</div>
                          {emp.jobTitle && <div className="text-xs text-gray-400 truncate">{emp.jobTitle}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {companyLoading && (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500">
            <X className="w-4 h-4 mr-1.5" /> Cancel
          </Button>
          {step === "role" && (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedCompanyId || companyLoading}
              className="bg-[#0047AB] hover:bg-[#1565C0] text-white"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Preview as {viewAs === "client-admin" ? "Client Admin" : "Employee"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
