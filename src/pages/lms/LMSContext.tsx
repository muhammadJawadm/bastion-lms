/**
 * LMS Context — Bastion LMS
 *
 * Real authentication, wired to the backend described in
 * `Bastion-LMS.postman_collection.json` (see `src/lib/api.ts`). On mount,
 * a stored token (if any) is exchanged for the current profile via
 * `GET /users/profile`; `login()` stores the token returned by the real
 * login/verify-otp calls and populates `user` from the response.
 *
 * `role`/`setRole`/`impersonation` are kept for backward compatibility with
 * existing pages that still read them, but they're no longer a free-standing
 * "preview as" switch — `role` now mirrors the real signed-in user's role
 * (mapped to this app's kebab-case `LMSRole`) unless a platform_admin is
 * actively impersonating someone.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getMyProfile, tokenStorage, type AuthUser } from "@/lib/api";

export type LMSRole = "platform-admin" | "client-admin" | "employee";

/**
 * The backend's role enum is snake_case and has a 4th value ("user") for
 * mobile-only accounts that this web app doesn't serve — map it onto
 * "employee" here so existing role-gated UI keeps working without needing
 * to know about that distinction.
 */
function toLmsRole(backendRole: AuthUser["role"] | undefined): LMSRole {
  switch (backendRole) {
    case "platform_admin":
      return "platform-admin";
    case "client_admin":
      return "client-admin";
    case "employee":
    case "user":
    default:
      return "employee";
  }
}

export interface ImpersonationTarget {
  /** The user being impersonated */
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userLmsRole: string;
  /** The company being viewed */
  companyId: string;
  companyName: string;
  /** What role perspective to show */
  viewAs: "client-admin" | "employee";
}

export interface LMSUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  lmsRole?: string;
  companyId?: string | null;
  role?: string;
  mustChangePassword?: boolean;
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
  /** The signed-in user, from the real backend. */
  user: LMSUser | null;
  /**
   * The effective user — equals user unless impersonating.
   * Use this for companyId, name, etc. in all LMS pages.
   */
  effectiveUser: LMSUser | null;
  /** Effective companyId — from impersonation target or real user */
  effectiveCompanyId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  /** Current impersonation state — null means not impersonating */
  impersonation: ImpersonationTarget | null;
  /** Start impersonating a user/company */
  startImpersonation: (target: ImpersonationTarget) => void;
  /** Exit impersonation and return to platform admin view */
  exitImpersonation: () => void;
  /** Store a token + user from a successful login/verify-otp response. */
  login: (token: string, authUser: AuthUser) => void;
  /** Clear the stored session. */
  logout: () => void;
  /** Re-fetch the current profile (e.g. after settings change company name). */
  refreshProfile: () => Promise<void>;
}

const LMSContext = createContext<LMSContextType>({
  realRole: "client-admin",
  role: "client-admin",
  setRole: () => {},
  user: null,
  effectiveUser: null,
  effectiveCompanyId: null,
  isAuthenticated: false,
  isLoading: true,
  isDemo: false,
  impersonation: null,
  startImpersonation: () => {},
  exitImpersonation: () => {},
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

function toLmsUser(authUser: AuthUser): LMSUser {
  return {
    id: authUser._id,
    name: authUser.name,
    email: authUser.email,
    lmsRole: authUser.role,
    companyId: authUser.companyId ?? null,
    role: authUser.role,
    mustChangePassword: authUser.mustChangePassword,
  };
}

export function LMSProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonation, setImpersonation] = useState<ImpersonationTarget | null>(null);

  // On mount: if a token is already stored (returning visit), exchange it
  // for the current profile. A stale/expired/invalid token just clears
  // itself out — the app falls back to "signed out" rather than looping.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMyProfile()
      .then((res) => {
        setAuthUser(res.data);
        if (res.token) tokenStorage.set(res.token);
      })
      .catch(() => {
        tokenStorage.clear();
        setAuthUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((token: string, newUser: AuthUser) => {
    tokenStorage.set(token);
    setAuthUser(newUser);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setAuthUser(null);
    setImpersonation(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!tokenStorage.get()) return;
    const res = await getMyProfile();
    setAuthUser(res.data);
    if (res.token) tokenStorage.set(res.token);
  }, []);

  const startImpersonation = useCallback((target: ImpersonationTarget) => {
    setImpersonation(target);
  }, []);

  const exitImpersonation = useCallback(() => {
    setImpersonation(null);
  }, []);

  const user = authUser ? toLmsUser(authUser) : null;
  const realRole: LMSRole = toLmsRole(authUser?.role);
  const effectiveRole: LMSRole = impersonation ? impersonation.viewAs : realRole;

  const effectiveUser: LMSUser | null = impersonation
    ? {
        id: impersonation.userId,
        name: impersonation.userName,
        email: impersonation.userEmail,
        lmsRole: impersonation.userLmsRole,
        companyId: impersonation.companyId,
        role: "user",
      }
    : user;

  const effectiveCompanyId = impersonation ? impersonation.companyId : (user?.companyId ?? null);

  return (
    <LMSContext.Provider
      value={{
        realRole,
        role: effectiveRole,
        setRole: () => {
          // No-op now that role comes from a real signed-in account — kept
          // so existing call sites (role-switcher UI, already removed from
          // the nav) don't need to be touched to keep compiling.
        },
        user,
        effectiveUser,
        effectiveCompanyId,
        isAuthenticated: !!authUser,
        isLoading,
        isDemo: false,
        impersonation,
        startImpersonation,
        exitImpersonation,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  return useContext(LMSContext);
}
