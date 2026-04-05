import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_KEY       = 'trader5_user';
const LOGIN_TIME_KEY = 'trader5_login_time';
const TTL_KEY        = 'trader5_session_ttl';

const TTL_DEFAULT    = 24 * 60 * 60 * 1000;        // 24 hours
const TTL_REMEMBER   = 30 * 24 * 60 * 60 * 1000;   // 30 days

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoredUser = {
  email: string;
  fullName?: string;
  nfa_code?: string | null;
  [key: string]: any;
};

// ─── Storage helpers (usable outside of React components) ─────────────────────

/** Save user to localStorage after successful 2FA. */
export function saveSession(user: StoredUser, rememberMe = false): void {
  const ttl = rememberMe ? TTL_REMEMBER : TTL_DEFAULT;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
  localStorage.setItem(TTL_KEY, ttl.toString());
}

/** Read the stored user. Returns null if not logged in or session expired. */
export function getStoredUser(): StoredUser | null {
  try {
    const user      = localStorage.getItem(USER_KEY);
    const loginTime = localStorage.getItem(LOGIN_TIME_KEY);
    const ttl       = localStorage.getItem(TTL_KEY);

    if (!user || !loginTime || !ttl) return null;

    const elapsed = Date.now() - Number(loginTime);
    if (elapsed > Number(ttl)) {
      clearSession();
      return null;
    }

    return JSON.parse(user) as StoredUser;
  } catch {
    clearSession();
    return null;
  }
}

/** Remove all session data — call this on logout or expiry. */
export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_TIME_KEY);
  localStorage.removeItem(TTL_KEY);
}

/** Returns true if a valid, non-expired session exists. */
export function isSessionActive(): boolean {
  return getStoredUser() !== null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — call at the top of any protected page/component.
 *
 * - Checks session validity on mount and redirects to /signin if expired
 * - Returns the stored user and a logout function
 *
 * Usage:
 *   const { user, logout } = useAuth();
 */
export function useAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate('/signin', { replace: true });
    }
  }, [navigate]);

  const logout = useCallback(() => {
    clearSession();
    navigate('/signin', { replace: true });
  }, [navigate]);

  const user = getStoredUser();

  return { user, logout };
}

// Redirects ai_admin away from regular pages and regular users away from admin
export function useAdminAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate('/signin', { replace: true });
    } else if (user.role !== 'ai_admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const logout = useCallback(() => {
    clearSession();
    navigate('/signin', { replace: true });
  }, [navigate]);

  const user = getStoredUser();
  return { user, logout };
}