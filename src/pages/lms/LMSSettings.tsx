/**
 * LMS Settings — Bastion LMS (UI Prototype)
 * Company profile shows static mock data. There's no persistence here on
 * purpose — it's honest about what's a real save vs. what's just a screen
 * to review, rather than faking a "Saved!" state that doesn't go anywhere.
 */

import { useState } from "react";
import { Shield, Bell, Palette, Link2, Users, Lock, Info } from "lucide-react";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_COMPANY } from "./mockData";

const TABS = [
  { id: "company", label: "Company Profile", icon: Shield },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "users", label: "User Roles", icon: Users },
  { id: "security", label: "Security", icon: Lock },
];

function ComingSoon({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase mb-4">{label}</h3>
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-400 text-sm font-semibold">This section is coming soon.</p>
        <p className="text-gray-300 text-xs mt-1">Contact Bastion Risk and Safety Group to enable this feature for your account.</p>
      </div>
    </div>
  );
}

export default function LMSSettings() {
  const { role, setRole } = useLMS();
  const [activeTab, setActiveTab] = useState("company");

  const company = MOCK_COMPANY;
  const isLoading = false;

  const fields: { label: string; value: string | null | undefined }[] = company ? [
    { label: "Company Name", value: company.name },
    { label: "Industry", value: company.industry?.replace(/_/g, " ") },
    { label: "Primary Contact", value: company.contactName },
    { label: "Contact Email", value: company.contactEmail },
    { label: "Phone", value: company.contactPhone },
    { label: "Location", value: [company.city, company.state].filter(Boolean).join(", ") || null },
  ] : [];

  return (
    <LMSLayout
      title="Settings"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Settings" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display font-extrabold text-white text-3xl uppercase mb-6">Settings</h2>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="md:w-48 flex-shrink-0 flex md:flex-col gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left flex-shrink-0",
                    activeTab === tab.id
                      ? "bg-[#0047AB] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "company" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Company Profile</h3>

                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : company ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {fields.map((f) => (
                        <div key={f.label}>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                          <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700 capitalize">
                            {f.value || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-blue-700 text-xs leading-relaxed">
                        Company profile changes are currently handled by your Bastion account manager. Email{" "}
                        <a href="mailto:info@bastionrsg.com" className="underline font-medium hover:text-blue-900">info@bastionrsg.com</a> to update these details.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">No company assigned to your account yet.</p>
                )}
              </div>
            )}

            {activeTab === "branding" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Custom Branding</h3>
                <div className="p-4 bg-[#F4F6F9] rounded-xl border border-gray-200">
                  <div className="text-xs font-bold text-[#1E90FF] uppercase tracking-wide mb-1">Professional Plan Feature</div>
                  <p className="text-sm text-gray-600">Custom branding lets you replace the Bastion LMS logo and colors with your company's brand for a white-label experience.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Logo</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-[#0F1C2E] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-400">Using default Bastion LMS branding</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Primary Color</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
                      <div className="w-6 h-6 rounded bg-[#0047AB]" />
                      <span className="text-sm font-mono text-gray-700">#0047AB</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Accent Color</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
                      <div className="w-6 h-6 rounded bg-[#0F1C2E]" />
                      <span className="text-sm font-mono text-gray-700">#0F1C2E</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">White-label branding is available on the Professional and Enterprise plans. Contact your account manager to enable it.</p>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Notification Settings</h3>
                <p className="text-gray-400 text-sm -mt-2">Automated notifications are on our roadmap — this shows the categories that will be configurable here.</p>
                <div className="space-y-3">
                  {[
                    { label: "Training due reminders", desc: "Send employees reminders 7 days before due date" },
                    { label: "Overdue training alerts", desc: "Alert managers when training becomes overdue" },
                    { label: "Course completion notifications", desc: "Notify managers when employees complete training" },
                    { label: "Certificate expiration warnings", desc: "Alert 30 days before certificates expire" },
                    { label: "New course assignments", desc: "Email employees when new training is assigned" },
                    { label: "Weekly compliance digest", desc: "Weekly summary report sent to administrators" },
                  ].map((n) => (
                    <div key={n.label} className="flex items-center justify-between p-4 bg-[#F4F6F9] rounded-xl opacity-60">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{n.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{n.desc}</div>
                      </div>
                      <div className="relative w-11 h-6 rounded-full bg-gray-200 flex-shrink-0 cursor-not-allowed">
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "integrations" && <ComingSoon label="Integrations" icon={Link2} />}
            {activeTab === "users" && <ComingSoon label="User Roles" icon={Users} />}
            {activeTab === "security" && <ComingSoon label="Security" icon={Lock} />}
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
