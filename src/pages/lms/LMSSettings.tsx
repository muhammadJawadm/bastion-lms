/**
 * LMS Settings — Bastion LMS
 * Company Profile, Branding, and Notifications are real, editable forms
 * backed by the live backend (`GET/PATCH /company/:companyId/*`). Logo
 * uploads go through the same Cloudinary proxy used elsewhere
 * (`POST /uploads`, folder "company-logos"). Integrations and Security
 * stay disabled/tooltip-explained — no backend support yet.
 */

import { useEffect, useRef, useState } from "react";
import { Shield, Bell, Palette, Link2, Lock, Info, Loader2, Upload } from "lucide-react";
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
  getCompany,
  updateCompanyProfile,
  updateCompanyBranding,
  updateCompanyNotifications,
  uploadCourseFile,
  ApiError,
  type CompanyRecord,
  type CompanyNotificationPrefs,
} from "@/lib/api";

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

const NOTIFICATION_ITEMS: { key: keyof CompanyNotificationPrefs; label: string; desc: string }[] = [
  { key: "trainingDueReminders", label: "Training due reminders", desc: "Send employees reminders 7 days before due date" },
  { key: "overdueTrainingAlerts", label: "Overdue training alerts", desc: "Alert managers when training becomes overdue" },
  { key: "courseCompletionNotifications", label: "Course completion notifications", desc: "Notify managers when employees complete training" },
  { key: "certificateExpirationWarnings", label: "Certificate expiration warnings", desc: "Alert 30 days before certificates expire" },
  { key: "newCourseAssignments", label: "New course assignments", desc: "Email employees when new training is assigned" },
  { key: "weeklyComplianceDigest", label: "Weekly compliance digest", desc: "Weekly summary report sent to administrators" },
];

interface ProfileForm {
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
}

interface BrandingForm {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

const DEFAULT_PROFILE: ProfileForm = { name: "", industry: "other", contactName: "", contactEmail: "", contactPhone: "", city: "", state: "" };
const DEFAULT_BRANDING: BrandingForm = { logoUrl: "", primaryColor: "#0047AB", accentColor: "#0F1C2E" };
const DEFAULT_NOTIFICATIONS: CompanyNotificationPrefs = {
  trainingDueReminders: true,
  overdueTrainingAlerts: true,
  courseCompletionNotifications: true,
  certificateExpirationWarnings: true,
  newCourseAssignments: true,
  weeklyComplianceDigest: true,
};

function toProfileForm(c: CompanyRecord): ProfileForm {
  return {
    name: c.name ?? "",
    industry: c.industry ?? "other",
    contactName: c.contactName ?? "",
    contactEmail: c.contactEmail ?? "",
    contactPhone: c.contactPhone ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
  };
}

function toBrandingForm(c: CompanyRecord): BrandingForm {
  return {
    logoUrl: c.logoUrl ?? "",
    primaryColor: c.primaryColor ?? DEFAULT_BRANDING.primaryColor,
    accentColor: c.accentColor ?? DEFAULT_BRANDING.accentColor,
  };
}

function toNotificationsForm(c: CompanyRecord): CompanyNotificationPrefs {
  return { ...DEFAULT_NOTIFICATIONS, ...(c.notifications ?? {}) };
}

export default function LMSSettings() {
  const { role, setRole, effectiveCompanyId } = useLMS();
  const [activeTab, setActiveTab] = useState("company");
  const [isLoading, setIsLoading] = useState(true);
  const [, setCompanyRecord] = useState<CompanyRecord | null>(null);

  // ── Company Profile form state ──
  const [profileSaved, setProfileSaved] = useState<ProfileForm>(DEFAULT_PROFILE);
  const [profile, setProfile] = useState<ProfileForm>(DEFAULT_PROFILE);
  const [savingCompany, setSavingCompany] = useState(false);
  const companyDirty = JSON.stringify(profile) !== JSON.stringify(profileSaved);

  // ── Branding form state ──
  const [brandingSaved, setBrandingSaved] = useState<BrandingForm>(DEFAULT_BRANDING);
  const [branding, setBranding] = useState<BrandingForm>(DEFAULT_BRANDING);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const brandingDirty = !!logoFile || JSON.stringify(branding) !== JSON.stringify(brandingSaved);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Notifications form state ──
  const [prefsSaved, setPrefsSaved] = useState<CompanyNotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [prefs, setPrefs] = useState<CompanyNotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const prefsDirty = JSON.stringify(prefs) !== JSON.stringify(prefsSaved);

  useEffect(() => {
    if (!effectiveCompanyId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getCompany(effectiveCompanyId);
        if (cancelled) return;
        setCompanyRecord(res.data);
        const p = toProfileForm(res.data);
        const b = toBrandingForm(res.data);
        const n = toNotificationsForm(res.data);
        setProfile(p);
        setProfileSaved(p);
        setBranding(b);
        setBrandingSaved(b);
        setPrefs(n);
        setPrefsSaved(n);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : "Couldn't load company settings.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveCompanyId]);

  const handleProfileField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveCompany = async () => {
    if (!effectiveCompanyId) return;
    setSavingCompany(true);
    try {
      const res = await updateCompanyProfile(effectiveCompanyId, profile);
      const p = toProfileForm(res.data);
      setCompanyRecord(res.data);
      setProfile(p);
      setProfileSaved(p);
      toast.success("Company profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the company profile.");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCancelCompany = () => setProfile(profileSaved);

  const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveBranding = async () => {
    if (!effectiveCompanyId) return;
    setSavingBranding(true);
    try {
      let logoUrl = branding.logoUrl;
      if (logoFile) {
        const uploaded = await uploadCourseFile(logoFile, "company-logos");
        logoUrl = uploaded.url;
      }
      const res = await updateCompanyBranding(effectiveCompanyId, {
        logoUrl,
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
      });
      const b = toBrandingForm(res.data);
      setCompanyRecord(res.data);
      setBranding(b);
      setBrandingSaved(b);
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Branding updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save branding.");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleCancelBranding = () => {
    setBranding(brandingSaved);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSavePrefs = async () => {
    if (!effectiveCompanyId) return;
    setSavingPrefs(true);
    try {
      const changed: Partial<CompanyNotificationPrefs> = {};
      (Object.keys(prefs) as (keyof CompanyNotificationPrefs)[]).forEach((key) => {
        if (prefs[key] !== prefsSaved[key]) changed[key] = prefs[key];
      });
      const res = await updateCompanyNotifications(effectiveCompanyId, changed);
      const n = toNotificationsForm(res.data);
      setCompanyRecord(res.data);
      setPrefs(n);
      setPrefsSaved(n);
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save notification preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCancelPrefs = () => setPrefs(prefsSaved);

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
                          value={profile.name}
                          onChange={(e) => handleProfileField("name", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Industry</label>
                        <Select value={profile.industry} onValueChange={(v) => handleProfileField("industry", v)}>
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
                          value={profile.contactName}
                          onChange={(e) => handleProfileField("contactName", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contact Email</label>
                        <Input
                          type="email"
                          value={profile.contactEmail}
                          onChange={(e) => handleProfileField("contactEmail", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                        <Input
                          value={profile.contactPhone}
                          onChange={(e) => handleProfileField("contactPhone", e.target.value)}
                          className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
                        <div className="flex gap-2">
                          <Input
                            value={profile.city}
                            onChange={(e) => handleProfileField("city", e.target.value)}
                            placeholder="City"
                            className="focus-visible:border-[#1E90FF] focus-visible:ring-[#1E90FF]/20"
                          />
                          <Input
                            value={profile.state}
                            onChange={(e) => handleProfileField("state", e.target.value)}
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
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-[#0F1C2E] text-xl uppercase">Custom Branding</h3>
                  {brandingDirty && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelBranding} disabled={savingBranding}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#0047AB] hover:bg-[#003a8c]"
                        onClick={handleSaveBranding}
                        disabled={savingBranding}
                      >
                        {savingBranding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <Skeleton className="h-32 w-full rounded-xl" />
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Logo</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-3 overflow-hidden bg-[#0F1C2E]">
                          {logoPreview || branding.logoUrl ? (
                            <img src={logoPreview ?? branding.logoUrl} alt="Company logo" className="w-full h-full object-cover" />
                          ) : (
                            <Shield className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {logoPreview || branding.logoUrl ? "Custom logo" : "Using default Bastion LMS branding"}
                        </p>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoPick} />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Logo
                        </Button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Primary Color</label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                          <input
                            type="color"
                            value={branding.primaryColor}
                            onChange={(e) => setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <Input
                            value={branding.primaryColor}
                            onChange={(e) => setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))}
                            className="border-0 shadow-none p-0 h-auto font-mono text-sm text-gray-700 focus-visible:ring-0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Accent Color</label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                          <input
                            type="color"
                            value={branding.accentColor}
                            onChange={(e) => setBranding((prev) => ({ ...prev, accentColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <Input
                            value={branding.accentColor}
                            onChange={(e) => setBranding((prev) => ({ ...prev, accentColor: e.target.value }))}
                            className="border-0 shadow-none p-0 h-auto font-mono text-sm text-gray-700 focus-visible:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">White-label branding replaces the Bastion LMS logo and colors across the LMS for your company's users.</p>
                  </>
                )}
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
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
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
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
