import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAppState } from "@/contexts/AppStateContext";
import type { User } from "@/types";
import { getEnvApiRootUrl } from "@/utils/env";

type BackendProfileUser = {
  id: string;
  username: string;
  name?: string | null;
  displayName?: string | null;
  email: string;
  role: string;
  avatar?: string | null;
  profile_pic?: string | null;
  bio?: string | null;
  phone?: string | null;
  channelId?: string | null;
  subscriptions?: unknown;
  memberships?: unknown;
  reactions?: unknown;
  watchHistory?: unknown;
  watchHistoryDetailed?: unknown;
  savedVideos?: unknown;
  likedVideos?: unknown;
  createdAt: string;
};

type ProfileApiResponse = {
  success: boolean;
  user?: BackendProfileUser;
  error?: string;
  message?: string;
};

type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  phone?: string;
  profilePicUri?: string | null;
};

const getProfileQueryKey = (apiRoot: string, token: string | null) => ["profile", apiRoot, token];

const parseJsonStrict = (input: string): ProfileApiResponse => {
  try {
    return JSON.parse(input) as ProfileApiResponse;
  } catch (error) {
    console.error("[useProfileData] parseJsonStrict error", error, input.slice(0, 120));
    throw new Error("Server returned invalid JSON response");
  }
};

const normalizeArray = <T>(value: unknown, fallback: T[]): T[] => {
  if (!value) {
    return fallback;
  }
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as T[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error("[useProfileData] normalizeArray parse error", error, value);
    }
  }
  return fallback;
};

const inferExtension = (uri: string): string => {
  const sanitized = uri.split("?")[0];
  const segment = sanitized.split("/").pop() ?? "";
  const ext = segment.split(".").pop();
  if (ext) {
    return ext.toLowerCase();
  }
  if (uri.startsWith("data:image/png")) {
    return "png";
  }
  if (uri.startsWith("data:image/jpeg") || uri.startsWith("data:image/jpg")) {
    return "jpg";
  }
  return "jpg";
};

const resolveMimeType = (extension: string): string => {
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }
  return "application/octet-stream";
};

const resolveAvatarUrl = (avatar: string | null | undefined, apiRoot: string): string => {
  if (!avatar || avatar.length === 0) {
    return "";
  }
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  const baseUrl = apiRoot.replace("/api", "");
  if (avatar.startsWith("/")) {
    return `${baseUrl}${avatar}`;
  }
  return `${baseUrl}/${avatar}`;
};

const mapBackendUser = (user: BackendProfileUser, apiRoot: string): User => {
  const displayNameCandidate =
    (user.displayName && user.displayName.length > 0 ? user.displayName : null) ??
    (user.name && user.name.length > 0 ? user.name : null);
  const resolvedAvatar = resolveAvatarUrl(user.avatar ?? user.profile_pic ?? "", apiRoot);

  return {
    id: user.id,
    username: user.username,
    displayName: displayNameCandidate ?? user.username,
    email: user.email,
    avatar: resolvedAvatar,
    bio: user.bio ?? "",
    phone: user.phone ?? null,
    channelId: user.channelId ?? null,
    role: user.role as User["role"],
    rolesAssignedBy: undefined,
    subscriptions: normalizeArray(user.subscriptions, [] as User["subscriptions"]),
    memberships: normalizeArray(user.memberships, [] as User["memberships"]),
    reactions: normalizeArray(user.reactions, [] as User["reactions"]),
    watchHistory: normalizeArray(user.watchHistory, [] as User["watchHistory"]),
    watchHistoryDetailed: normalizeArray(user.watchHistoryDetailed, [] as User["watchHistoryDetailed"]),
    savedVideos: normalizeArray(user.savedVideos, [] as User["savedVideos"]),
    likedVideos: normalizeArray(user.likedVideos, [] as User["likedVideos"]),
    createdAt: user.createdAt,
  };
};

const buildFormData = async (payload: UpdateProfilePayload): Promise<{ formData: FormData; fieldNames: string[] }> => {
  const formData = new FormData();
  const fieldNames: string[] = [];
  if (payload.name !== undefined) {
    formData.append("name", payload.name);
    fieldNames.push("name");
  }
  if (payload.bio !== undefined) {
    formData.append("bio", payload.bio);
    fieldNames.push("bio");
  }
  if (payload.phone !== undefined) {
    formData.append("phone", payload.phone);
    fieldNames.push("phone");
  }
  if (payload.profilePicUri) {
    const extension = inferExtension(payload.profilePicUri);
    const filename = `profile-${Date.now()}.${extension}`;
    const mimeType = resolveMimeType(extension);
    if (Platform.OS === "web") {
      const response = await fetch(payload.profilePicUri);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      formData.append("profile_pic", file as any);
    } else {
      formData.append("profile_pic", {
        uri: payload.profilePicUri,
        name: filename,
        type: mimeType,
      } as any);
    }
    fieldNames.push("profile_pic");
  }
  return { formData, fieldNames };
};

export function useProfileData() {
  const { authToken, refreshAuthUser } = useAuth();
  const { saveCurrentUser } = useAppState();
  const queryClient = useQueryClient();
  const apiRoot = getEnvApiRootUrl();

  const profileQuery = useQuery({
    queryKey: getProfileQueryKey(apiRoot, authToken ?? null),
    enabled: Boolean(authToken),
    queryFn: async () => {
      if (!authToken) {
        throw new Error("Missing auth token");
      }
      console.log("[useProfileData] Fetching profile data");
      const response = await fetch(`${apiRoot}/user/my_profile`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const raw = await response.text();
      const data = parseJsonStrict(raw);
      if (!response.ok || !data.success || !data.user) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useProfileData] Profile fetch failed", message, raw.slice(0, 200));
        throw new Error(message);
      }
      const mapped = mapBackendUser(data.user, apiRoot);
      console.log("[useProfileData] Profile fetched", mapped.id);
      return mapped;
    },
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }
    console.log("[useProfileData] Syncing profile into AppState", profileQuery.data.id);
    saveCurrentUser(profileQuery.data).catch((error) => {
      console.error("[useProfileData] Failed to persist profile", error);
    });
  }, [profileQuery.data, saveCurrentUser]);

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!authToken) {
        throw new Error("Missing auth token");
      }
      const { formData, fieldNames } = await buildFormData(payload);
      if (fieldNames.length === 0) {
        throw new Error("No profile fields provided");
      }
      console.log("[useProfileData] Updating profile with fields", fieldNames);
      const response = await fetch(`${apiRoot}/user/edit_profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
        body: formData,
      });
      const raw = await response.text();
      const data = parseJsonStrict(raw);
      if (!response.ok || !data.success || !data.user) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useProfileData] Profile update failed", message, raw.slice(0, 200));
        throw new Error(message);
      }
      const mapped = mapBackendUser(data.user, apiRoot);
      console.log("[useProfileData] Profile updated", mapped.id);
      return mapped;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(getProfileQueryKey(apiRoot, authToken ?? null), data);
      saveCurrentUser(data).catch((error) => {
        console.error("[useProfileData] Failed to persist updated profile", error);
      });
      await refreshAuthUser();
    },
  });

  return useMemo(() => ({
    profile: profileQuery.data ?? null,
    isProfileLoading: profileQuery.isLoading || profileQuery.isFetching,
    profileError: profileQuery.error instanceof Error ? profileQuery.error : null,
    refreshProfile: profileQuery.refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdatingProfile: updateMutation.isPending,
    updateProfileError: updateMutation.error instanceof Error ? updateMutation.error : null,
  }), [profileQuery.data, profileQuery.isLoading, profileQuery.isFetching, profileQuery.error, profileQuery.refetch, updateMutation.mutateAsync, updateMutation.isPending, updateMutation.error]);
}
