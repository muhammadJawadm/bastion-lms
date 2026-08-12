/**
 * LMS Settings — Bastion LMS (UI Prototype)
 * Company Profile and Notifications are real, editable forms backed by
 * mock stores (companyStore / notificationPrefsStore). Branding is
 * plan-gated and Integrations/Security are disabled — those stay
 * read-only/tooltip-explained rather than faking editability.
 */

import { useState } from "react";
import { Shield, Bell, Palette, Link2, Lock, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLMS } from "./LMSContext";
import { LMSLayout } from "./LMSLayout";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  companyStore,
  patchCompany,
  notificationPrefsStore,
  patchNotificationPrefs,
  type MockCompany,
  type MockNotificationPrefs,
} from "./mockData";

const TABS = [
  { id: "company", label: "Company Profile", icon: Shield, disabled: false },
  { id: "branding", label: "Branding", icon: Palette, disabled: false },
  { id: "notifications", label: "Notifications", icon: Bell, disabled: false },
  { id: "integrations", label: "Integrations", icon: Link2, disabled: true },
  { id: "security", label: "Security", icon: Lock, disabled: true },
];

const INDUSTRY_OPTIONS = [
  { value: "construction", label: "Construction" },
  { value: "electrical", label: "Electrical" },
  { value: "utilities", label: "Utilities" },
  { value: "maritime", label: "Maritime" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

const NOTIFICATION_ITEMS: { key: keyof MockNotificationPrefs; label: string; desc: string }[] = [
  { key: "trainingDueReminders", label: "Training due reminders", desc: "Send employees reminders 7 days before due date" },
  { key: "overdueTrainingAlerts", label: "Overdue training alerts", desc: "Alert managers when training becomes overdue" },
  { key: "courseCompletionNotifications", label: "Course completion notifications", desc: "Notify managers when employees complete training" },
  { key: "certificateExpirationWarnings", label: "Certificate expiration warnings", desc: "Alert 30 days before certificates expire" },
  { key: "newCourseAssignments", label: "New course assignments", desc: "Email employees when new training is assigned" },
  { key: "weeklyComplianceDigest", label: "Weekly compliance digest", desc: "Weekly summary report sent to administrators" },
];

export default function LMSSettings() {
  const { role, setRole } = useLMS();
  const [activeTab, setActiveTab] = useState("company");
  const isLoading = false;

  // ── Company Profile form state ──
  const [company, setCompany] = useState<MockCompany>({ ...companyStore });
  const [savingCompany, setSavingCompany] = useState(false);
  const companyDirty = JSON.stringify(company) !== JSON.stringify(companyStore);

  const handleCompanyField = <K extends keyof MockCompany>(key: K, value: MockCompany[K]) => {
    setCompany((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    await new Promise((r) => setTimeout(r, 400));
    patchCompany(company);
    setSavingCompany(false);
    toast.success("Company profile updated");
  };

  const handleCancelCompany = () => {
    setCompany({ ...companyStore });
  };

  // ── Notifications form state ──
  const [prefs, setPrefs] = useState<MockNotificationPrefs>({ ...notificationPrefsStore });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const prefsDirty = JSON.stringify(prefs) !== JSON.stringify(notificationPrefsStore);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    await new Promise((r) => setTimeout(r, 400));
    patchNotificationPrefs(prefs);
    setSavingPrefs(false);
    toast.success("Notification preferences saved");
  };

  const handleCancelPrefs = () => {
    setPrefs({ ...notificationPrefsStore });
  };

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
              const button = (
                <button
                  key={tab.id}
                  disabled={tab.disabled}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left flex-shrink-0",
                    tab.disabled
                      ? "text-white/25 cursor-not-allowed"
                      : activeTab === tab.id
                      ? "bg-[#0047AB] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
              if (!tab.disabled) return button;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">Contact your account manager to enable this feature</TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "company" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Company Profile</h3>
                  {companyDirty && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelCompany} disabled={savingCompany}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#0047AB] hover:bg-[#003a8c]"
                        onClick={handleSaveCompany}
                        disabled={savingCompany}
                      >
                        {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Name</label>
                        <Input
                          value={company.name}
                          onChange={(e) => handleCompanyField("name", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Industry</label>
                        <Select value={company.industry} onValueChange={(v) => handleCompanyField("industry", v)}>
                          <SelectTrigger className="w-full bg-white focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRY_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Primary Contact</label>
                        <Input
                          value={company.contactName}
                          onChange={(e) => handleCompanyField("contactName", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contact Email</label>
                        <Input
                          type="email"
                          value={company.contactEmail}
                          onChange={(e) => handleCompanyField("contactEmail", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                        <Input
                          value={company.contactPhone}
                          onChange={(e) => handleCompanyField("contactPhone", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
                        <div className="flex gap-2">
                          <Input
                            value={company.city}
                            onChange={(e) => handleCompanyField("city", e.target.value)}
                            placeholder="City"
                            className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                          />
                          <Input
                            value={company.state}
                            onChange={(e) => handleCompanyField("state", e.target.value)}
                            placeholder="State"
                            className="w-20 focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-blue-700 text-xs leading-relaxed">
                        Changes here update your company profile across the LMS, including the billing contact shown
                        under Billing. For account-level changes (plan, company ID), email{" "}
                        <a href="mailto:info@bastionrsg.com" className="underline font-medium hover:text-blue-900">info@bastionrsg.com</a>.
                      </p>
                    </div>
                  </>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Notification Settings</h3>
                    <p className="text-gray-400 text-sm mt-1">Choose which automated notifications your team receives.</p>
                  </div>
                  {prefsDirty && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelPrefs} disabled={savingPrefs}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#0047AB] hover:bg-[#003a8c]"
                        onClick={handleSavePrefs}
                        disabled={savingPrefs}
                      >
                        {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {NOTIFICATION_ITEMS.map((n) => (
                    <div key={n.key} className="flex items-center justify-between p-4 bg-[#F4F6F9] rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{n.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{n.desc}</div>
                      </div>
                      <Switch
                        checked={prefs[n.key]}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, [n.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
