import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

type StoredUserRecord = AuthUser & {
  password: string;
};

type AuthSession = {
  user: AuthUser;
  token: string;
};

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (username: string, email: string, password: string) => Promise<AuthActionResult>;
  logout: () => void;
};

const AUTH_SESSION_STORAGE_KEY = 'learn-dl-auth-session';
const AUTH_USERS_STORAGE_KEY = 'learn-dl-auth-users';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUsers(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((user): user is StoredUserRecord => {
      if (!user || typeof user !== 'object') {
        return false;
      }

      const record = user as Record<string, unknown>;
      return (
        typeof record.id === 'string' &&
        typeof record.username === 'string' &&
        typeof record.email === 'string' &&
        typeof record.password === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistUsers(users: StoredUserRecord[]) {
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
}

function toSessionToken(userId: string): string {
  return `local-${userId}-${Date.now()}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function makeUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!rawSession) {
        return;
      }

      const parsed = JSON.parse(rawSession) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      const record = parsed as Record<string, unknown>;
      const rawUser = record.user;
      const rawToken = record.token;

      if (!rawUser || typeof rawUser !== 'object' || typeof rawToken !== 'string') {
        return;
      }

      const userRecord = rawUser as Record<string, unknown>;
      if (
        typeof userRecord.id !== 'string' ||
        typeof userRecord.username !== 'string' ||
        typeof userRecord.email !== 'string'
      ) {
        return;
      }

      setUser({
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
      });
      setToken(rawToken);
    } catch {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistSession = (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  };

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    const users = readStoredUsers();
    const matchedUser = users.find((candidate) => candidate.email === normalizedEmail);

    if (!matchedUser || matchedUser.password !== normalizedPassword) {
      return { success: false, error: 'Invalid email or password.' };
    }

    persistSession({
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
      },
      token: toSessionToken(matchedUser.id),
    });

    return { success: true };
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<AuthActionResult> => {
    const normalizedUsername = username.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();

    if (!normalizedUsername) {
      return { success: false, error: 'Username is required.' };
    }

    if (!normalizedEmail) {
      return { success: false, error: 'Email is required.' };
    }

    if (normalizedPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const users = readStoredUsers();
    const hasDuplicate = users.some((candidate) => candidate.email === normalizedEmail);
    if (hasDuplicate) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const createdUser: StoredUserRecord = {
      id: makeUserId(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: normalizedPassword,
    };

    const updatedUsers = [createdUser, ...users];
    persistUsers(updatedUsers);

    persistSession({
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
      },
      token: toSessionToken(createdUser.id),
    });

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
