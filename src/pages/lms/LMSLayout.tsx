/**
 * LMS Layout — Bastion LMS (UI Prototype)
 * Color scheme: cobalt #0047AB, bright blue #1E90FF, dark navy #0F1C2E
 * No real auth here — sign out just returns to /lms/login. The role switcher
 * is always available so every screen can be reviewed from any perspective.
 * Impersonation: Platform admins can preview as client admin or employee.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Settings,
  Bell,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Building2,
  GraduationCap,
  Menu,
  X,
  ClipboardList,
  MessageSquare,
  MessageCircle,
  Activity,
  HardHat,
  Eye,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLMS, type LMSRole } from "./LMSContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ImpersonationPicker from "./components/ImpersonationPicker";
import ImpersonationBanner from "./components/ImpersonationBanner";

// ─── Navigation Config ────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: LMSRole[];
  badge?: string;
  section?: string; // section header label
}

const NAV_ITEMS: NavItem[] = [
  // ── Common ──────────────────────────────────────────────────────────────
  { label: "Dashboard",     icon: LayoutDashboard, href: "/lms/dashboard",  roles: ["platform-admin", "client-admin", "employee"] },
  { label: "My Training",   icon: BookOpen,         href: "/lms/my-training", roles: ["employee"] },

  // ── Client Admin ─────────────────────────────────────────────────────────
  { label: "Course Library", icon: BookOpen,       href: "/lms/courses",       roles: ["client-admin"], section: "Training" },
  { label: "Course Builder", icon: GraduationCap,  href: "/lms/builder", roles: ["client-admin"] },
  { label: "Toolbox Talks",  icon: HardHat,        href: "/lms/toolbox",       roles: ["client-admin"] },
  { label: "Assignments",    icon: ClipboardList,  href: "/lms/assignments",   roles: ["client-admin"] },
  { label: "Employees",      icon: Users,          href: "/lms/employees",   roles: ["client-admin"] },
  { label: "Analytics",      icon: BarChart3,      href: "/lms/analytics",   roles: ["client-admin"], section: "Insights" },
  { label: "Reports",        icon: FileText,       href: "/lms/reports",     roles: ["client-admin"] },

  // ── Platform Admin ───────────────────────────────────────────────────────
  { label: "Companies",      icon: Building2,      href: "/lms/admin/companies",     roles: ["platform-admin"], section: "Platform" },
  { label: "Course Library", icon: BookOpen,       href: "/lms/courses",             roles: ["platform-admin"] },
  { label: "Course Builder", icon: GraduationCap,  href: "/lms/builder", roles: ["platform-admin"] },
  { label: "Toolbox Talks",  icon: HardHat,        href: "/lms/toolbox",             roles: ["platform-admin"] },
  { label: "Assignments",    icon: ClipboardList,  href: "/lms/assignments",         roles: ["platform-admin"] },
  { label: "Employees",      icon: Users,          href: "/lms/employees",           roles: ["platform-admin"] },
  { label: "Questions",      icon: MessageSquare,  href: "/lms/admin/questions",     roles: ["platform-admin"], section: "Support" },
  { label: "Conversations",  icon: MessageCircle,  href: "/lms/admin/conversations", roles: ["platform-admin"] },
  { label: "Analytics",      icon: Activity,       href: "/lms/admin/analytics",     roles: ["platform-admin"], section: "Insights" },
  { label: "Reports",        icon: FileText,       href: "/lms/reports",             roles: ["platform-admin"] },

  // ── Settings (all) ───────────────────────────────────────────────────────────────────────
  { label: "Settings", icon: Settings,    href: "/lms/settings", roles: ["platform-admin", "client-admin", "employee"], section: "Account" },
  { label: "Billing",  icon: CreditCard,  href: "/lms/billing",  roles: ["platform-admin", "client-admin"] },
];

const ROLE_LABELS: Record<LMSRole, string> = {
  "platform-admin": "Platform Admin",
  "client-admin": "Safety Manager",
  "employee": "Field Worker",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sidebar Content (shared between desktop rail and mobile sheet) ───────────

function SidebarContent({
  role,
  onRoleChange,
  userName,
  isAuthenticated,
  onOpenImpersonation,
  onNavigate,
}: {
  role: LMSRole;
  onRoleChange: (r: LMSRole) => void;
  userName?: string | null;
  isAuthenticated: boolean;
  onOpenImpersonation?: () => void;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const { realRole, impersonation, exitImpersonation } = useLMS();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const handleSignOut = () => { window.location.href = "/lms/login"; };

  const initials = getInitials(userName);

  return (
    <div className="flex flex-col h-full bg-[#0F1C2E]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/lms" onClick={onNavigate}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <img
              src="/bastion_logo.png"
              alt="Bastion Risk and Safety Group"
              className="h-9 w-auto object-contain flex-shrink-0 transition-transform group-hover:scale-105"
            />
            <div>
              <div className="font-display font-extrabold text-white text-lg uppercase leading-none tracking-wide">Bastion</div>
              <div className="text-[#1E90FF] text-[10px] font-bold uppercase tracking-[2px]">LMS</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Back links */}
      <div className="px-4 py-2.5 border-b border-white/10 flex flex-col gap-1">
        <Link href="/lms/about" onClick={onNavigate}>
          <div className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors cursor-pointer group py-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Bastion LMS</span>
          </div>
        </Link>
      </div>

      {/* Impersonation controls — only for real platform admins */}
      {realRole === "platform-admin" && (
        <div className="px-4 py-3 border-b border-white/10">
          {impersonation ? (
            <div className="space-y-2">
              <div className="text-[10px] text-amber-400 uppercase tracking-[1.5px] font-semibold">Preview Mode Active</div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2">
                <div className="text-amber-300 text-xs font-semibold truncate">{impersonation.companyName}</div>
                <div className="text-amber-400/70 text-[10px] mt-0.5">
                  {impersonation.viewAs === "client-admin" ? "Client Admin view" : "Employee view"}
                  {impersonation.userName ? ` · ${impersonation.userName}` : ""}
                </div>
              </div>
              <Button
                onClick={exitImpersonation}
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-400/50 bg-transparent hover:bg-amber-500/10"
              >
                <X className="w-3 h-3" />
                Exit Preview
              </Button>
            </div>
          ) : (
            <button
              onClick={onOpenImpersonation}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all text-xs font-semibold group"
            >
              <Eye className="w-3.5 h-3.5 group-hover:text-[#1E90FF] transition-colors" />
              <span>Preview as Client / Employee</span>
            </button>
          )}
        </div>
      )}

      {/* Role Switcher — lets you review every screen from any perspective */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-[10px] text-white/40 uppercase tracking-[1.5px] font-semibold mb-2">Viewing as</div>
        <div className="flex flex-col gap-1">
          {(["platform-admin", "client-admin", "employee"] as LMSRole[]).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={cn(
                "text-left text-xs px-2.5 py-1.5 rounded font-semibold transition-all",
                role === r
                  ? "bg-[#1E90FF]/20 text-[#7DD3FC]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <div key={`${item.href}-${item.label}`}>
              {/* Section header */}
              {item.section && (
                <div className="px-3 pt-4 pb-1.5 first:pt-0">
                  <span className="text-[9px] font-bold uppercase tracking-[2px] text-white/25">{item.section}</span>
                </div>
              )}
              <Link href={item.href} onClick={onNavigate}>
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group mb-0.5",
                    isActive
                      ? "bg-[#0047AB] text-white shadow-sm shadow-[#0047AB]/30"
                      : "text-white/60 hover:text-white hover:bg-white/8"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-white/50 group-hover:text-[#1E90FF]")} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge className="bg-[#1E90FF] text-white border-transparent text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 ring-1 ring-white/10">
            <AvatarFallback className="bg-[#0047AB] text-white text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">
              {userName ?? (isAuthenticated ? "Loading..." : "Demo User")}
            </div>
            <Badge
              variant="outline"
              className="mt-0.5 border-transparent bg-[#1E90FF]/15 text-[#7DD3FC] text-[10px] font-bold uppercase tracking-wide px-1.5 py-0"
            >
              {ROLE_LABELS[role]}
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  handleSignOut();
                }}
                className="text-white/40 hover:text-white/70 transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isAuthenticated ? "Sign out" : "Sign in"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({
  title,
  breadcrumbs,
  userName,
  isAuthenticated,
  onOpenMobileMenu,
}: {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  userName?: string | null;
  isAuthenticated: boolean;
  onOpenMobileMenu: () => void;
}) {
  const initials = getInitials(userName);

  return (
    <header className="h-14 bg-[#0F1C2E]/95 backdrop-blur border-b border-white/10 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
      <button onClick={onOpenMobileMenu} className="lg:hidden text-white/70 hover:text-white transition-colors -ml-1 p-1.5">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {breadcrumbs?.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
            {crumb.href ? (
              <Link href={crumb.href}>
                <span className="text-white/50 hover:text-[#1E90FF] cursor-pointer transition-colors truncate">{crumb.label}</span>
              </Link>
            ) : (
              <span className="text-white font-semibold truncate">{crumb.label}</span>
            )}
          </span>
        ))}
        {!breadcrumbs && <span className="text-white font-semibold">{title}</span>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => { window.location.href = "/lms/login"; }}
          variant="ghost"
          size="sm"
          className="hidden lg:flex text-white/50 hover:text-white hover:bg-white/10 gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isAuthenticated ? "Sign Out" : "Sign In"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="relative p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0047AB] rounded-full ring-2 ring-[#0F1C2E]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>
        <Avatar className="size-8 ring-1 ring-white/10">
          <AvatarFallback className="bg-[#0047AB] text-white text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

interface LMSLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  role: LMSRole;
  onRoleChange: (r: LMSRole) => void;
}

export function LMSLayout({ children, title, breadcrumbs, role, onRoleChange }: LMSLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [impersonationPickerOpen, setImpersonationPickerOpen] = useState(false);
  const { user, isAuthenticated, impersonation } = useLMS();

  return (
    <>
      {/* Impersonation banner — sits above everything */}
      <ImpersonationBanner />

      {/* Impersonation picker modal */}
      <ImpersonationPicker
        open={impersonationPickerOpen}
        onClose={() => setImpersonationPickerOpen(false)}
      />

      <div
        className="flex h-screen bg-[#0F1C2E] overflow-hidden font-sans"
        style={{ paddingTop: impersonation ? "2.5rem" : undefined }}
      >
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0 border-r border-white/10">
          <SidebarContent
            role={role}
            onRoleChange={onRoleChange}
            userName={user?.name}
            isAuthenticated={isAuthenticated}
            onOpenImpersonation={() => setImpersonationPickerOpen(true)}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 border-white/10 bg-[#0F1C2E] [&>button]:text-white/50 [&>button]:hover:text-white">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              role={role}
              onRoleChange={onRoleChange}
              userName={user?.name}
              isAuthenticated={isAuthenticated}
              onOpenImpersonation={() => { setMobileOpen(false); setImpersonationPickerOpen(true); }}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            title={title}
            breadcrumbs={breadcrumbs}
            userName={user?.name}
            isAuthenticated={isAuthenticated}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0F1C2E]">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default LMSLayout;
