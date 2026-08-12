/**
 * LMSAdminCompanies — Platform Admin: full company management
 * View all client companies, stats, plan, activate/deactivate, add new.
 */
import { useState } from "react";
import {
  Building2, Plus, Search, CheckCircle2, XCircle, Users,
  BookOpen, Award, ChevronRight, Edit2, ToggleLeft, ToggleRight,
  Loader2, Filter,
} from "lucide-react";
import { LMSLayout } from "../LMSLayout";
import { useLMS } from "../LMSContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Add Company Modal ────────────────────────────────────────────────────────

function AddCompanyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", industry: "construction" as const, plan: "starter" as const,
    contactName: "", contactEmail: "", contactPhone: "",
    address: "", city: "", state: "", zip: "",
  });
  const utils = trpc.useUtils();
  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Client company created");
      utils.companies.list.invalidate();
      utils.platformAdmin.kpis.invalidate();
      onClose();
      setForm({ name: "", industry: "construction", plan: "starter", contactName: "", contactEmail: "", contactPhone: "", address: "", city: "", state: "", zip: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0F1C2E] border border-[#1E3A5F] text-white">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-white uppercase tracking-wide">Add Client Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wide">Company Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white placeholder:text-gray-500" placeholder="Pacific Coast Contractors, Inc." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide">Industry</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v as typeof form.industry }))}>
                <SelectTrigger className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F1C2E] border-[#1E3A5F] text-white">
                  {["construction","maritime","electrical","utilities","general_industry","oil_gas","manufacturing","other"].map(i => (
                    <SelectItem key={i} value={i} className="capitalize">{i.replace("_"," ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide">Plan</Label>
              <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v as typeof form.plan }))}>
                <SelectTrigger className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F1C2E] border-[#1E3A5F] text-white">
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide">Contact Name</Label>
              <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white placeholder:text-gray-500" placeholder="Jane Smith" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide">Contact Email</Label>
              <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white placeholder:text-gray-500" placeholder="jane@company.com" />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs uppercase tracking-wide">Contact Phone</Label>
            <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
              className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white placeholder:text-gray-500" placeholder="(760) 555-0100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide">City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white placeholder:text-gray-500" placeholder="San Diego" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wide">State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="mt-1 bg-[#1A2E4A] border-[#1E3A5F] text-white placeholder:text-gray-500" placeholder="CA" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1E3A5F] text-gray-300 hover:bg-[#1A2E4A]">Cancel</Button>
          <Button
            disabled={!form.name || createMutation.isPending}
            onClick={() => createMutation.mutate(form)}
            className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold uppercase tracking-wide"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Plan Modal ──────────────────────────────────────────────────────────

function EditPlanModal({ company, onClose }: { company: { id: number; name: string; plan: string } | null; onClose: () => void }) {
  const [plan, setPlan] = useState<"starter" | "professional" | "enterprise">(
    (company?.plan as "starter" | "professional" | "enterprise") ?? "starter"
  );
  const utils = trpc.useUtils();
  const updatePlan = trpc.platformAdmin.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plan updated");
      utils.companies.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={!!company} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-[#0F1C2E] border border-[#1E3A5F] text-white">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-white uppercase tracking-wide">Change Plan</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-gray-400 text-sm mb-4">{company?.name}</p>
          <Select value={plan} onValueChange={v => setPlan(v as typeof plan)}>
            <SelectTrigger className="bg-[#1A2E4A] border-[#1E3A5F] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1C2E] border-[#1E3A5F] text-white">
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1E3A5F] text-gray-300 hover:bg-[#1A2E4A]">Cancel</Button>
          <Button
            disabled={updatePlan.isPending}
            onClick={() => company && updatePlan.mutate({ companyId: company.id, plan })}
            className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold uppercase tracking-wide"
          >
            {updatePlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-gray-100 text-gray-600",
  professional: "bg-[#0047AB]/10 text-[#1E90FF]",
  enterprise: "bg-amber-100 text-amber-700",
};

const INDUSTRY_LABELS: Record<string, string> = {
  construction: "Construction",
  maritime: "Maritime",
  electrical: "Electrical",
  utilities: "Utilities",
  general_industry: "General Industry",
  oil_gas: "Oil & Gas",
  manufacturing: "Manufacturing",
  other: "Other",
};

export default function LMSAdminCompanies() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "starter" | "professional" | "enterprise">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editPlanCompany, setEditPlanCompany] = useState<{ id: number; name: string; plan: string } | null>(null);

  const { data: companies, isLoading } = trpc.companies.list.useQuery();
  const { data: kpis } = trpc.platformAdmin.kpis.useQuery();
  const utils = trpc.useUtils();

  const toggleActive = trpc.platformAdmin.toggleCompany.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Company activated" : "Company deactivated");
      utils.companies.list.invalidate();
      utils.platformAdmin.kpis.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (companies ?? []).filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactEmail ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? c.isActive : !c.isActive);
    const matchPlan = planFilter === "all" || c.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const { role, setRole } = useLMS();

  return (
    <LMSLayout
      title="Companies"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Companies" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-tight">Companies</h1>
            <p className="text-white/60 text-sm mt-1">Manage all client organizations on the platform</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Companies", value: kpis?.totalCompanies ?? companies?.length ?? 0, icon: Building2, color: "bg-[#0047AB]/10 text-[#1E90FF]" },
            { label: "Active", value: companies?.filter(c => c.isActive).length ?? 0, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
            { label: "Total Users", value: kpis?.totalUsers ?? 0, icon: Users, color: "bg-[#0F1C2E]/10 text-[#0F1C2E]" },
            { label: "Courses Published", value: kpis?.totalCourses ?? 0, icon: BookOpen, color: "bg-[#00A3FF]/10 text-[#00A3FF]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="font-display font-extrabold text-[#0F1C2E] text-3xl uppercase">{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search companies or contacts..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:border-[#0047AB]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as typeof planFilter)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 text-gray-700"
              >
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Company Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-[#0047AB]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-12 h-12 text-gray-200 mb-4" />
              <h4 className="font-display font-bold text-gray-400 text-lg uppercase">No Companies Found</h4>
              <p className="text-gray-400 text-sm mt-1">
                {search || statusFilter !== "all" || planFilter !== "all" ? "Try adjusting your filters." : "Add your first client company to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-3 font-semibold">Company</th>
                    <th className="px-6 py-3 font-semibold">Industry</th>
                    <th className="px-6 py-3 font-semibold">Contact</th>
                    <th className="px-6 py-3 font-semibold">Plan</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#0F1C2E]/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-[#0F1C2E]" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{company.name}</div>
                            {company.city && <div className="text-xs text-gray-400">{company.city}{company.state ? `, ${company.state}` : ""}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {INDUSTRY_LABELS[company.industry] ?? company.industry}
                      </td>
                      <td className="px-6 py-4">
                        {company.contactName && <div className="text-sm text-gray-700">{company.contactName}</div>}
                        {company.contactEmail && <div className="text-xs text-gray-400">{company.contactEmail}</div>}
                        {company.contactPhone && <div className="text-xs text-gray-400">{company.contactPhone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditPlanCompany({ id: company.id, name: company.name, plan: company.plan })}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition-opacity hover:opacity-80 ${PLAN_COLORS[company.plan] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {company.plan}
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                          company.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {company.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive.mutate({ companyId: company.id, isActive: !company.isActive })}
                            className={`p-1.5 rounded-lg transition-colors ${company.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                            title={company.isActive ? "Deactivate" : "Activate"}
                          >
                            {company.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddCompanyModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditPlanModal company={editPlanCompany} onClose={() => setEditPlanCompany(null)} />
    </LMSLayout>
  );
}
