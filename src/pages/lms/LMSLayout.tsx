

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  Library,
  UsersRound,
  SlidersHorizontal,
  CreditCard,
  Bell,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLMS, type LMSRole } from "./LMSContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import logo from "../../../public/logo.png"
import logo1 from "../../../public/logo1.png"

// ─── Navigation Config ────────────────────────────────────────────────────────
// Fixed, non-negotiable set: Dashboard + the six Company Admin destinations.

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      icon: LayoutDashboard,   href: "/lms/dashboard" },
  { label: "Forms",          icon: ClipboardCheck,    href: "/lms/forms" },
  { label: "Courses",        icon: GraduationCap,     href: "/lms/courses" },
  { label: "Course Library", icon: Library,           href: "/lms/course-library" },
  { label: "Employees",      icon: UsersRound,        href: "/lms/employees" },
  { label: "Settings",       icon: SlidersHorizontal, href: "/lms/settings" },
  { label: "Billing",        icon: CreditCard,        href: "/lms/billing" },
];

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
  userName,
  isAuthenticated,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  userName?: string | null;
  isAuthenticated: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const handleSignOut = () => { window.location.href = "/lms/login"; };

  const initials = getInitials(userName);

  return (
    <div className="flex flex-col h-full bg-[#0F1C2E]">
      {/* Logo — single lockup: collapse toggle + icon badge + live text, no duplicated marks */}
      <div className={cn("py-5 border-b border-white/10", collapsed ? "px-3" : "px-5")}>
        <div className={cn("flex items-center", collapsed ? "justify-center gap-1.5" : "gap-10")}>
          <Link href="/lms" onClick={onNavigate}>
            <div className={cn("flex items-center gap-2 cursor-pointer group", collapsed && "justify-center")}>
              {collapsed ? (
                <div className="w-9 h-9  ">
                  <img src={logo1} alt="Bastion LMS" />
                </div>
              ) : (
                <img src={logo} alt="Bastion LMS" />
              )}
            </div>
          </Link>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn("shrink-0 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors", collapsed ? "p-1" : "pl-6")}
            >
              {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Back link */}
      {!collapsed && (
        <div className="px-4 py-2.5 border-b border-white/10 flex flex-col gap-1">
          <Link href="/lms/about" onClick={onNavigate}>
            <div className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors cursor-pointer group py-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Bastion LMS</span>
            </div>
          </Link>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const link = (
            <Link href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer group mb-0.5",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-[#0047AB] text-white"
                    : "text-white/75 hover:text-white hover:bg-white/8"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-white/65 group-hover:text-[#1E90FF]")} />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </div>
            </Link>
          );
          return (
            <div key={item.href}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="size-8 ring-1 ring-white/10 flex-shrink-0">
            <AvatarFallback className="bg-[#0047AB] text-white text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">
                {userName ?? (isAuthenticated ? "Loading..." : "Demo User")}
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7DD3FC]">
                Company Admin
              </div>
            </div>
          )}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="text-white/40 hover:text-white/70 transition-colors p-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{isAuthenticated ? "Sign out" : "Sign in"}</TooltipContent>
            </Tooltip>
          )}
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
                <span className="text-white/70 hover:text-[#1E90FF] cursor-pointer transition-colors truncate">{crumb.label}</span>
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
          className="hidden lg:flex text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isAuthenticated ? "Sign Out" : "Sign In"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
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
  /** Accepted for backward compatibility with existing call sites — no longer used for nav filtering. */
  role?: LMSRole;
  /** Accepted for backward compatibility with existing call sites — no longer used. */
  onRoleChange?: (r: LMSRole) => void;
}

export function LMSLayout({ children, title, breadcrumbs }: LMSLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { user, isAuthenticated } = useLMS();

  return (
    <div className="lms-interface flex h-screen bg-[#0F1C2E] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:flex-shrink-0 border-r border-white/10 transition-all duration-200", desktopCollapsed ? "lg:w-18" : "lg:w-64")}>
        <SidebarContent
          userName={user?.name}
          isAuthenticated={isAuthenticated}
          collapsed={desktopCollapsed}
          onToggleCollapse={() => setDesktopCollapsed((c) => !c)}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 border-white/10 bg-[#0F1C2E] [&>button]:text-white/50 [&>button]:hover:text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            userName={user?.name}
            isAuthenticated={isAuthenticated}
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
  );
}

export default LMSLayout;
