/**
 * LMS Context — Bastion LMS (UI Prototype)
 *
 * This is a static, front-end-only context. There is no real authentication,
 * no database, and no network calls here — `user` is fixed mock data from
 * `mockData.ts`, and `role` is a local switch so every screen can be reviewed
 * from all three perspectives (Platform Admin / Safety Manager / Field Worker)
 * without needing a backend. Nothing in this file calls tRPC or redirects
 * anywhere outside the app.
 *
 * Impersonation is preserved as UI-only state for the same reason it existed
 * before: platform admins can "preview as" any client admin or employee.
 */

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { MOCK_USER, type MockRole } from "./mockData";

export type LMSRole = MockRole;

export interface ImpersonationTarget {
  /** The user being impersonated */
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userLmsRole: string;
  /** The company being viewed */
  companyId: number;
  companyName: string;
  /** What role perspective to show */
  viewAs: "client-admin" | "employee";
}

interface LMSContextType {
  /** The real authenticated user's role */
  realRole: LMSRole;
  /**
   * The effective role — equals realRole unless impersonating.
   * Use this for all role-based UI decisions.
   */
  role: LMSRole;
  setRole: (r: LMSRole) => void;
  /** Mock signed-in user */
  user: {
    id?: number;
    name?: string | null;
    email?: string | null;
    lmsRole?: string;
    companyId?: number | null;
    role?: string;
  } | null;
  /**
   * The effective user — equals user unless impersonating.
   * Use this for companyId, name, etc. in all LMS pages.
   */
  effectiveUser: {
    id?: number;
    name?: string | null;
    email?: string | null;
    lmsRole?: string;
    companyId?: number | null;
    role?: string;
  } | null;
  /** Effective companyId — from impersonation target or real user */
  effectiveCompanyId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Always false in the prototype — no demo self-registration flow is wired up here. */
  isDemo: boolean;
  /** Current impersonation state — null means not impersonating */
  impersonation: ImpersonationTarget | null;
  /** Start impersonating a user/company */
  startImpersonation: (target: ImpersonationTarget) => void;
  /** Exit impersonation and return to platform admin view */
  exitImpersonation: () => void;
}

const LMSContext = createContext<LMSContextType>({
  realRole: "client-admin",
  role: "client-admin",
  setRole: () => {},
  user: null,
  effectiveUser: null,
  effectiveCompanyId: null,
  isAuthenticated: true,
  isLoading: false,
  isDemo: false,
  impersonation: null,
  startImpersonation: () => {},
  exitImpersonation: () => {},
});

export function LMSProvider({ children }: { children: ReactNode }) {
  // Default view when the prototype loads. Switchable via the sidebar's
  // role switcher so every screen can be reviewed from any perspective.
  const [role, setRole] = useState<LMSRole>("client-admin");
  const [impersonation, setImpersonation] = useState<ImpersonationTarget | null>(null);

  const startImpersonation = useCallback((target: ImpersonationTarget) => {
    setImpersonation(target);
  }, []);

  const exitImpersonation = useCallback(() => {
    setImpersonation(null);
  }, []);

  const user = {
    id: MOCK_USER.id,
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    lmsRole: MOCK_USER.lmsRole,
    companyId: MOCK_USER.companyId,
    role: MOCK_USER.role,
  };

  // realRole always mirrors the switcher in this prototype — there's no
  // separate "actual" account role since nothing is authenticated for real.
  const realRole: LMSRole = role;

  const effectiveRole: LMSRole = impersonation ? impersonation.viewAs : role;

  const effectiveUser = impersonation
    ? {
        id: impersonation.userId,
        name: impersonation.userName,
        email: impersonation.userEmail,
        lmsRole: impersonation.userLmsRole,
        companyId: impersonation.companyId,
        role: "user",
      }
    : user;

  const effectiveCompanyId = impersonation ? impersonation.companyId : user.companyId;

  return (
    <LMSContext.Provider
      value={{
        realRole,
        role: effectiveRole,
        setRole,
        user,
        effectiveUser,
        effectiveCompanyId,
        isAuthenticated: true,
        isLoading: false,
        isDemo: false,
        impersonation,
        startImpersonation,
        exitImpersonation,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  return useContext(LMSContext);
}
