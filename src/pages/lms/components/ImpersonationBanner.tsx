/**
 * ImpersonationBanner — Persistent top bar shown while platform admin is previewing as another user.
 * Displays who is being impersonated and provides a one-click exit.
 */

import { useLMS } from "../LMSContext";
import { Eye, X, Building2, User } from "lucide-react";

export default function ImpersonationBanner() {
  const { impersonation, exitImpersonation } = useLMS();

  if (!impersonation) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Previewing as</span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 opacity-80" />
            <span className="font-bold">{impersonation.companyName}</span>
          </span>
          <span className="opacity-70">·</span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 opacity-80" />
            <span>
              {impersonation.userName
                ? impersonation.userName
                : impersonation.viewAs === "client-admin"
                ? "Client Admin"
                : "Employee"}
            </span>
          </span>
          <span className="hidden md:inline opacity-70">
            ({impersonation.viewAs === "client-admin" ? "Client Admin view" : "Employee view"})
          </span>
        </div>
        <button
          onClick={exitImpersonation}
          className="flex items-center gap-1.5 text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          Exit Preview
        </button>
      </div>
    </div>
  );
}
