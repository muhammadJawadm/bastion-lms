/**
 * LMS Clients — Platform Admin only
 * Manage client companies: list, create, update, deactivate.
 */

import { useState } from "react";
import { Building2, Plus, Search, Loader2, X, MoreHorizontal } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const INDUSTRIES = [
  { value: "construction", label: "Construction" },
  { value: "maritime", label: "Maritime" },
  { value: "electrical", label: "Electrical" },
  { value: "utilities", label: "Utilities" },
  { value: "general_industry", label: "General Industry" },
  { value: "oil_gas", label: "Oil & Gas" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

const PLANS = [
  { value: "starter", label: "Starter (up to 25 users)" },
  { value: "professional", label: "Professional (26–100 users)" },
  { value: "enterprise", label: "Enterprise (100+ users)" },
];

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-gray-100 text-gray-600",
  professional: "bg-[#00A3FF]/10 text-[#00A3FF]",
  enterprise: "bg-[#0047AB]/10 text-[#1E90FF]",
};

type CreateForm = {
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  plan: string;
};

const DEFAULT_FORM: CreateForm = {
  name: "", industry: "construction", contactName: "", contactEmail: "",
  contactPhone: "", address: "", city: "", state: "", zip: "", plan: "starter",
};

function AddClientModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const utils = trpc.useUtils();

  const createCompany = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Client company created successfully");
      utils.companies.list.invalidate();
      utils.companies.platformStats.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    createCompany.mutate({
      name: form.name,
      industry: form.industry as any,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zip: form.zip || undefined,
      plan: form.plan as any,
    });
  };

  const field = (key: keyof CreateForm, label: string, type = "text", placeholder = "") => (
    <div key={key}>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:border-[#0047AB]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Add Client Company</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field("name", "Company Name *", "text", "e.g. ABC Construction Inc.")}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Industry *</label>
            <select
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:border-[#0047AB]"
            >
              {INDUSTRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Subscription Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:border-[#0047AB]"
            >
              {PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Contact Information</div>
            <div className="space-y-3">
              {field("contactName", "Contact Name", "text", "Full name")}
              {field("contactEmail", "Contact Email", "email", "email@company.com")}
              {field("contactPhone", "Phone", "tel", "(555) 000-0000")}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Address (Optional)</div>
            <div className="space-y-3">
              {field("address", "Street Address")}
              <div className="grid grid-cols-3 gap-3">
                {field("city", "City")}
                {field("state", "State")}
                {field("zip", "ZIP")}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-bold text-sm uppercase tracking-wide py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCompany.isPending}
              className="flex-1 bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createCompany.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LMSClients() {
  const { role, setRole } = useLMS();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const utils = trpc.useUtils();

  const { data: companies, isLoading } = trpc.companies.list.useQuery();
  const updateCompany = trpc.companies.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated");
      utils.companies.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = companies?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const active = companies?.filter((c) => c.isActive).length ?? 0;

  return (
    <LMSLayout
      title="Clients"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Clients" }]}
      role={role}
      onRoleChange={setRole}
    >
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} />}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-white text-3xl uppercase">Client Companies</h2>
            <p className="text-white/60 text-sm mt-0.5">{companies?.length ?? 0} clients registered</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-[#0047AB] hover:bg-[#1E90FF] text-white font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Clients", value: companies?.length ?? 0 },
            { label: "Active", value: active },
            { label: "Inactive", value: (companies?.length ?? 0) - active },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="font-display font-extrabold text-[#0F1C2E] text-2xl uppercase">{s.value}</div>
              <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/30 focus:border-[#1E90FF] bg-white"
          />
        </div>

        {/* Client Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-[#0047AB]" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((company) => (
              <div key={company.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F1C2E]/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#0F1C2E]" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm leading-tight">{company.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{(company.industry ?? "").replace("_", " ")}</div>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-gray-500 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {(company.contactName || company.contactEmail) && (
                  <div className="text-sm text-gray-500 mb-3">
                    {company.contactName && <div className="font-medium text-xs">{company.contactName}</div>}
                    {company.contactEmail && <div className="text-xs text-gray-400">{company.contactEmail}</div>}
                    {company.contactPhone && <div className="text-xs text-gray-400">{company.contactPhone}</div>}
                  </div>
                )}

                {(company.city || company.state) && (
                  <div className="text-xs text-gray-400 mb-3">
                    {[company.city, company.state].filter(Boolean).join(", ")}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="flex gap-2 flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${PLAN_COLORS[company.plan ?? "starter"]}`}>
                      {company.plan}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                      company.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {company.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    onClick={() => updateCompany.mutate({ id: company.id, isActive: !company.isActive })}
                    className="text-xs text-[#00A3FF] font-semibold hover:underline"
                  >
                    {company.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-14 h-14 text-gray-200 mb-4" />
            <h4 className="font-display font-bold text-gray-400 text-xl uppercase">
              {search ? "No Clients Found" : "No Clients Yet"}
            </h4>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              {search ? `No clients match "${search}"` : "Add your first client company to get started."}
            </p>
            {!search && (
              <button
                onClick={() => setShowAdd(true)}
                className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-sm font-bold uppercase tracking-wide px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add First Client
              </button>
            )}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
