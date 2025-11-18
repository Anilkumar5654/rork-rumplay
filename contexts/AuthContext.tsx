import { TRPCClientError } from "@trpc/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import type { User, UserRole } from "../types";
import { trpcClient, setTrpcAuthToken } from "../lib/trpc";
import { getEnvApiRootUrl } from "@/utils/env";

const AUTH_USER_KEY = "rork_auth_user";
const AUTH_TOKEN_KEY = "rork_auth_token";

const API_ROOT = getEnvApiRootUrl();

const AUTH_ENDPOINTS = {
  login: `${API_ROOT}/auth/login`,
  register: `${API_ROOT}/auth/register`,
  me: `${API_ROOT}/auth/me`,
  logout: `${API_ROOT}/auth/logout`,
} as const;

const secureStoreAvailable = Platform.OS !== "web" && typeof SecureStore.getItemAsync === "function";

const tokenStore = {
  get: async () => {
    if (secureStoreAvailable) {
      try {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      } catch (error) {
        console.error("AuthContext tokenStore.get error", error);
        return null;
      }
    }

    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("AuthContext tokenStore.get storage error", error);
      return null;
    }
  },
  set: async (token: string) => {
    if (secureStoreAvailable) {
      try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
        return;
      } catch (error) {
        console.error("AuthContext tokenStore.set secure error", error);
      }
    }

    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error("AuthContext tokenStore.set storage error", error);
    }
  },
  remove: async () => {
    if (secureStoreAvailable) {
      try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      } catch (error) {
        console.error("AuthContext tokenStore.remove secure error", error);
      }
    }

    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("AuthContext tokenStore.remove storage error", error);
    }
  },
};

export type BackendUserPayload = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  phone: string | null;
  channelId: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  subscriptions: User["subscriptions"];
  memberships: User["memberships"];
  reactions: User["reactions"];
  watchHistory: User["watchHistory"];
  watchHistoryDetailed: User["watchHistoryDetailed"];
  savedVideos: User["savedVideos"];
  likedVideos: User["likedVideos"];
  rolesAssignedBy?: string;
};

type AuthMeResponse = {
  success: boolean;
  user?: BackendUserPayload;
  error?: string;
  message?: string;
};

type AuthApiResponse = {
  success: boolean;
  token?: string;
  user?: BackendUserPayload;
  error?: string;
  message?: string;
};

type AuthHandlerResult =
  | { success: true; token: string; user: User }
  | { success: false; message: string };

const mapBackendUser = (data: BackendUserPayload): User => {
  const apiRoot = getEnvApiRootUrl();
  const apiBaseUrl = apiRoot.replace('/api', '');
  
  let avatarUrl = data.avatar ?? "";
  if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
    avatarUrl = `${apiBaseUrl}${avatarUrl}`;
  }
  
  return {
    id: data.id,
    email: data.email,
    username: data.username,
    displayName: data.displayName ?? data.username,
    avatar: avatarUrl,
    bio: data.bio ?? "",
    phone: data.phone ?? null,
    channelId: data.channelId ?? null,
    role: data.role,
    rolesAssignedBy: data.rolesAssignedBy,
    subscriptions: data.subscriptions ?? [],
    memberships: data.memberships ?? [],
    reactions: data.reactions ?? [],
    watchHistory: data.watchHistory ?? [],
    watchHistoryDetailed: data.watchHistoryDetailed ?? [],
    savedVideos: data.savedVideos ?? [],
    likedVideos: data.likedVideos ?? [],
    password: undefined,
    createdAt: data.createdAt,
  };
};

const resolveAuthErrorMessage = (error: unknown): string => {
  console.log("[AuthContext] resolveAuthErrorMessage", error);
  const apiUrl = API_ROOT;

  if (error instanceof TRPCClientError) {
    const dataMessage = typeof error.data?.message === "string" ? error.data.message : null;
    if (typeof error.message === "string" && error.message.toLowerCase().includes("unexpected token")) {
      return `Cannot connect to backend at ${apiUrl}. Make sure the backend server is running.`;
    }
    if (typeof error.message === "string" && error.message.toLowerCase().includes("fetch")) {
      return `Network error: Cannot reach backend at ${apiUrl}. Please check if the server is running.`;
    }
    if (dataMessage && dataMessage.length > 0) {
      return dataMessage;
    }
    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("Network request failed")) {
      return `Cannot connect to backend at ${apiUrl}. Ensure the server is running and accessible.`;
    }
    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  return "Unable to process the request. Please try again.";
};

const performAuthMutation = async (url: string, payload: Record<string, unknown>): Promise<AuthApiResponse> => {
  console.log(`[AuthContext] POST ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      console.error("AuthContext performAuthMutation non-JSON response", contentType, raw);
      return { success: false, error: "Server returned invalid response. Expected JSON." };
    }

    const data = (await response.json()) as AuthApiResponse;

    if (!response.ok && !data.error && !data.message) {
      console.warn("AuthContext performAuthMutation non-OK without error", response.status);
      return { success: false, error: `Request failed with status ${response.status}` };
    }

    return data;
  } catch (error) {
    const message = resolveAuthErrorMessage(error);
    console.error("AuthContext performAuthMutation error", message, error);
    return { success: false, error: message };
  }
};

const fetchCurrentUser = async (token: string): Promise<BackendUserPayload | null> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.me, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to validate session");
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("AuthContext fetchCurrentUser received non-JSON response", contentType);
      throw new Error("Server returned invalid response. Expected JSON.");
    }

    const data = (await response.json()) as AuthMeResponse;
    if (!data.success || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("AuthContext fetchCurrentUser error", error);
    throw error;
  }
};

const revokeSessionRemote = async (token: string | null) => {
  if (!token) {
    return;
  }

  try {
    const response = await fetch(AUTH_ENDPOINTS.logout, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn("AuthContext revokeSessionRemote non 2xx", response.status);
    }
  } catch (error) {
    console.error("AuthContext revokeSessionRemote error", error);
  }
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const persistSession = useCallback(async (token: string) => {
    await tokenStore.set(token);
    setTrpcAuthToken(token);
    setAuthTokenState(token);
  }, []);

  const clearSession = useCallback(async () => {
    console.log("AuthContext clearSession");
    await tokenStore.remove();
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    setTrpcAuthToken(null);
    setAuthTokenState(null);
    setAuthUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshAuthUser = useCallback(
    async (forcedToken?: string) => {
      const sessionToken = forcedToken ?? authToken;

      if (!sessionToken) {
        await clearSession();
        return { success: false, error: "Missing session token" } as const;
      }

      try {
        const backendUser = await fetchCurrentUser(sessionToken);
        if (!backendUser) {
          await clearSession();
          return { success: false, error: "Session expired" } as const;
        }

        const mapped = mapBackendUser(backendUser);
        setAuthUser(mapped);
        setIsAuthenticated(true);
        setAuthError(null);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(backendUser));
        return { success: true, user: mapped } as const;
      } catch (error) {
        console.error("AuthContext refreshAuthUser error", error);
        await clearSession();
        return { success: false, error: "Unable to fetch profile" } as const;
      }
    },
    [authToken, clearSession]
  );

  const bootstrapAuth = useCallback(async () => {
    console.log("AuthContext bootstrapAuth start");
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const storedToken = await tokenStore.get();
      if (!storedToken) {
        await clearSession();
        return;
      }

      setTrpcAuthToken(storedToken);
      setAuthTokenState(storedToken);
      const result = await refreshAuthUser(storedToken);

      if (!result.success) {
        await clearSession();
      }
    } catch (error) {
      console.error("AuthContext bootstrapAuth failure", error);
      setAuthError("Authentication check failed. Please login again.");
      await clearSession();
    } finally {
      setIsAuthLoading(false);
    }
  }, [clearSession, refreshAuthUser]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthHandlerResult> => {
      try {
        const response = await performAuthMutation(AUTH_ENDPOINTS.login, { email, password });

        if (!response.success) {
          const resolvedMessage = response.error ?? response.message ?? "Invalid login credentials.";
          setAuthError(resolvedMessage);
          return { success: false, message: resolvedMessage };
        }

        if (!response.token || !response.user) {
          const missingDataMessage = "Missing token or user data in response.";
          setAuthError(missingDataMessage);
          return { success: false, message: missingDataMessage };
        }

        await persistSession(response.token);
        const mapped = mapBackendUser(response.user);
        setAuthUser(mapped);
        setIsAuthenticated(true);
        setAuthError(null);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

        console.log("AuthContext login success", mapped.id, mapped.role);

        return {
          success: true,
          token: response.token,
          user: mapped,
        };
      } catch (error) {
        const message = resolveAuthErrorMessage(error);
        console.error("AuthContext login error", message, error);
        setAuthError(message);
        await clearSession();
        return { success: false, message };
      }
    },
    [clearSession, persistSession]
  );

  const register = useCallback(
    async (email: string, password: string, username: string): Promise<AuthHandlerResult> => {
      try {
        const response = await performAuthMutation(AUTH_ENDPOINTS.register, {
          email,
          password,
          username,
          displayName: username,
        });

        if (!response.success) {
          const resolvedMessage = response.error ?? response.message ?? "Registration failed.";
          setAuthError(resolvedMessage);
          return { success: false, message: resolvedMessage };
        }

        if (!response.token || !response.user) {
          const missingDataMessage = "Missing token or user data in response.";
          setAuthError(missingDataMessage);
          return { success: false, message: missingDataMessage };
        }

        await persistSession(response.token);
        const mapped = mapBackendUser(response.user);
        setAuthUser(mapped);
        setIsAuthenticated(true);
        setAuthError(null);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

        console.log("AuthContext register success", mapped.id, mapped.role);

        return {
          success: true,
          token: response.token,
          user: mapped,
        };
      } catch (error) {
        const message = resolveAuthErrorMessage(error);
        console.error("AuthContext register error", message, error);
        setAuthError(message);
        await clearSession();
        return { success: false, message };
      }
    },
    [clearSession, persistSession]
  );

  const logout = useCallback(async () => {
    await revokeSessionRemote(authToken);
    await clearSession();
    console.log("AuthContext logout");
  }, [authToken, clearSession]);

  const updateAuthUser = useCallback(
    async (updates: Partial<BackendUserPayload> & { newPassword?: string; currentPassword?: string }) => {
      if (!authUser) {
        return { success: false, error: "No authenticated user." } as const;
      }

      try {
        const response = await trpcClient.users.updateProfile.mutate({
          username: updates.username,
          displayName: updates.displayName,
          email: updates.email,
          bio: updates.bio,
          phone: updates.phone ?? undefined,
          avatar: updates.avatar ?? undefined,
          newPassword: updates.newPassword,
          currentPassword: updates.currentPassword,
        });

        if (!response.success || !response.user) {
          return { success: false, error: "Unable to update profile." } as const;
        }

        const mapped = mapBackendUser(response.user as BackendUserPayload);
        setAuthUser(mapped);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        console.log("AuthContext updateAuthUser", mapped.id);
        return { success: true, user: mapped } as const;
      } catch (error) {
        const message = resolveAuthErrorMessage(error);
        console.error("AuthContext updateAuthUser error", message, error);
        return { success: false, error: message } as const;
      }
    },
    [authUser]
  );

  const assignRole = useCallback(
    async (targetUserId: string, role: UserRole) => {
      try {
        const response = await trpcClient.admin.updateUserRole.mutate({
          targetUserId,
          newRole: role,
        });

        if (!response.success || !response.user) {
          return { success: false, error: "Unable to assign role." } as const;
        }

        if (authUser?.id === targetUserId) {
          const mapped = mapBackendUser(response.user as BackendUserPayload);
          setAuthUser(mapped);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        }

        return { success: true, user: mapBackendUser(response.user as BackendUserPayload) } as const;
      } catch (error) {
        const message = resolveAuthErrorMessage(error);
        console.error("AuthContext assignRole error", message, error);
        return { success: false, error: message } as const;
      }
    },
    [authUser]
  );

  const isSuperAdmin = useCallback(() => authUser?.role === "superadmin", [authUser]);
  const isAdmin = useCallback(() => authUser?.role === "admin" || authUser?.role === "superadmin", [authUser]);
  const isCreator = useCallback(() => authUser?.role === "creator", [authUser]);

  const roleDestination = useMemo(() => {
    switch (authUser?.role) {
      case "superadmin":
        return "/super-admin";
      case "admin":
        return "/admin-dashboard";
      case "creator":
        return "/creator-studio";
      default:
        return "/(tabs)/home";
    }
  }, [authUser?.role]);

  const value = useMemo(
    () => ({
      authUser,
      authToken,
      isAuthLoading,
      isAuthenticated,
      authError,
      login,
      register,
      logout,
      updateAuthUser,
      assignRole,
      isSuperAdmin,
      isAdmin,
      isCreator,
      roleDestination,
      refreshAuthUser,
    }),
    [
      assignRole,
      authError,
      authToken,
      authUser,
      isAdmin,
      isAuthenticated,
      isAuthLoading,
      isCreator,
      isSuperAdmin,
      login,
      logout,
      refreshAuthUser,
      register,
      roleDestination,
      updateAuthUser,
    ]
  );

  return value;
});
