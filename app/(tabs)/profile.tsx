import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Settings,
  History,
  ThumbsUp,
  Bookmark,
  ListVideo,
  LogOut,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useAppState } from "../../contexts/AppStateContext";
import { useAuth } from "../../contexts/AuthContext";
import { getEnvApiRootUrl } from "@/utils/env";
import { useProfileData } from "@/hooks/useProfileData";

type ChannelApiPayload = {
  id: string;
  name: string;
  handle?: string | null;
  avatar?: string | null;
  banner?: string | null;
  description?: string | null;
};

type ChannelResponse = {
  success: boolean;
  channel?: ChannelApiPayload;
  error?: string;
  message?: string;
};

type ChannelDetails = {
  id: string;
  name: string;
  handle: string | null;
  avatar: string;
  banner: string;
  description: string;
};

const FALLBACK_AVATAR_URI = "https://api.dicebear.com/7.x/thumbs/svg?seed=profile" as const;

const parseChannelJson = (input: string): ChannelResponse => {
  try {
    return JSON.parse(input) as ChannelResponse;
  } catch (error) {
    console.error("[ProfileScreen] parseChannelJson error", error, input.slice(0, 120));
    throw new Error("Server returned invalid JSON response");
  }
};

const toAbsoluteUrl = (value: string | null | undefined, baseUrl: string): string => {
  if (!value || value.length === 0) {
    return "";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/")) {
    return `${baseUrl}${value}`;
  }
  return `${baseUrl}/${value}`;
};

const mapChannelData = (channel: ChannelApiPayload, baseUrl: string): ChannelDetails => {
  return {
    id: channel.id,
    name: channel.name,
    handle: channel.handle ?? null,
    avatar: toAbsoluteUrl(channel.avatar ?? "", baseUrl),
    banner: toAbsoluteUrl(channel.banner ?? "", baseUrl),
    description: channel.description ?? "",
  };
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAppState();
  const { authUser, isAuthenticated, isAuthLoading, roleDestination, logout, authToken } = useAuth();
  const { profile, isProfileLoading, refreshProfile } = useProfileData();

  const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [isChannelLoading, setIsChannelLoading] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const apiRoot = useMemo(() => getEnvApiRootUrl(), []);
  const apiBaseUrl = useMemo(() => apiRoot.replace("/api", ""), [apiRoot]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const activeUser = useMemo(() => {
    if (profile) {
      return profile;
    }
    if (authUser) {
      return authUser;
    }
    return currentUser;
  }, [profile, authUser, currentUser]);

  const fetchChannelDetails = useCallback(async () => {
    const hasChannel = Boolean(activeUser.channelId);
    if (!authToken || !hasChannel) {
      setChannelDetails(null);
      setChannelError(null);
      return;
    }

    setIsChannelLoading(true);
    setChannelError(null);

    const endpoint = `${apiRoot}/channel/view_channel`;
    
    try {
      console.log("[ProfileScreen] GET", endpoint, "(without ID to fetch logged-in user's channel)");
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const raw = await response.text();
      console.log("[ProfileScreen] channel response", raw.slice(0, 160));
      const data = parseChannelJson(raw);
      if (!response.ok || !data.success || !data.channel) {
        throw new Error(data.error ?? data.message ?? `Request failed with status ${response.status}`);
      }
      const mapped = mapChannelData(data.channel, apiBaseUrl);
      setChannelDetails(mapped);
      setChannelError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to load channel details";
      console.warn("[ProfileScreen] fetchChannelDetails failed", errorMessage);
      setChannelDetails(null);
      setChannelError(errorMessage);
    } finally {
      setIsChannelLoading(false);
    }
  }, [activeUser.channelId, apiRoot, apiBaseUrl, authToken]);

  const handleCreateChannel = useCallback(async () => {
    if (!authToken) {
      Alert.alert("Login required", "Please login to create your channel.", [
        {
          text: "Go to Login",
          onPress: () => router.push("/login"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
      return;
    }

    setIsCreatingChannel(true);
    setChannelError(null);

    const endpoint = `${apiRoot}/channel/create-auto`;
    console.log("[ProfileScreen] POST", endpoint);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const raw = await response.text();
      console.log("[ProfileScreen] create channel response", raw.slice(0, 160));
      const data = parseChannelJson(raw);
      if (!data.success) {
        throw new Error(data.error ?? data.message ?? `Request failed with status ${response.status}`);
      }
      if (!data.channel) {
        throw new Error("Channel data missing in response");
      }
      const mapped = mapChannelData(data.channel, apiBaseUrl);
      setChannelDetails(mapped);
      Alert.alert("Channel created", data.message ?? "Your channel is live now!");
      await refreshProfile();
      await fetchChannelDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create channel";
      console.error("[ProfileScreen] handleCreateChannel error", message, error);
      setChannelError(message);
      Alert.alert("Channel error", message);
    } finally {
      setIsCreatingChannel(false);
    }
  }, [apiRoot, authToken, apiBaseUrl, fetchChannelDetails, refreshProfile, router]);

  useEffect(() => {
    if (activeUser.channelId) {
      fetchChannelDetails();
    } else {
      setChannelDetails(null);
      setChannelError(null);
    }
  }, [activeUser.channelId, fetchChannelDetails]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && authUser) {
        console.log("Profile screen focused, refreshing profile data");
        refreshProfile();
        fetchChannelDetails();
      }
    }, [isAuthenticated, authUser, refreshProfile, fetchChannelDetails])
  );

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }, [logout, router]);

  const resolvedAvatar = useMemo(() => {
    if (profile?.avatar && profile.avatar.length > 0) {
      return profile.avatar;
    }
    if (authUser?.avatar && authUser.avatar.length > 0) {
      return authUser.avatar;
    }
    if (activeUser.avatar && activeUser.avatar.length > 0) {
      return activeUser.avatar;
    }
    return FALLBACK_AVATAR_URI;
  }, [profile?.avatar, authUser?.avatar, activeUser.avatar]);

  const roleAction = useMemo(() => {
    switch (activeUser.role) {
      case "superadmin":
        return { label: "Admin Area", route: "/super-admin" as const };
      case "admin":
        return { label: "Control Panel", route: "/admin-dashboard" as const };
      case "creator":
        return { label: "Creator Studio", route: "/creator-studio" as const };
      default:
        if (activeUser.channelId) {
          const label = channelDetails?.name ?? "View My Channel";
          const route = `/channel/${activeUser.channelId}` as const;
          return { label, route };
        }
        return null;
    }
  }, [activeUser.role, activeUser.channelId, channelDetails?.name]);

  const menuItems = [
    { icon: History, label: "History", count: activeUser.watchHistory?.length || 0, route: null, onPress: null },
    { icon: ThumbsUp, label: "Liked Videos", count: activeUser.likedVideos?.length || 0, route: null, onPress: null },
    { icon: Bookmark, label: "Saved Videos", count: activeUser.savedVideos?.length || 0, route: null, onPress: null },
    { icon: ListVideo, label: "Playlists", count: 0, route: null, onPress: null },
    { icon: Settings, label: "Settings", count: null, route: "/settings", onPress: null },
    { icon: LogOut, label: "Logout", count: null, route: null, onPress: handleLogout },
  ] as const;

  if (isAuthLoading || isProfileLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const renderChannelSection = () => {
    if (activeUser.channelId) {
      const isDisabled = isChannelLoading || Boolean(channelError);
      const avatarSource = channelDetails?.avatar && channelDetails.avatar.length > 0 ? channelDetails.avatar : resolvedAvatar;
      const subtitle = channelDetails?.handle ?? (channelError ?? "Tap to open your channel");

      return (
        <TouchableOpacity
          style={[styles.channelCard, isDisabled && styles.channelCardDisabled]}
          onPress={() => router.push(`/channel/${activeUser.channelId}`)}
          disabled={isChannelLoading}
          testID="view-channel-button"
        >
          <View style={styles.channelCardRow}>
            <Image source={{ uri: avatarSource }} style={styles.channelAvatar} />
            <View style={styles.channelCardInfo}>
              <Text style={styles.channelCardName}>{channelDetails?.name ?? "View My Channel"}</Text>
              <Text style={styles.channelCardHandle}>{subtitle}</Text>
              {isChannelLoading ? (
                <Text style={styles.channelCardHint}>Refreshing channel...</Text>
              ) : (
                <Text style={styles.channelCardHint}>Open channel profile</Text>
              )}
            </View>
            <ArrowRight color={theme.colors.text} size={22} />
          </View>
          {channelError ? <Text style={styles.channelErrorText}>{channelError}</Text> : null}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.createChannelCard}>
        <View style={styles.createChannelBadge}>
          <Sparkles color={theme.colors.primary} size={22} />
        </View>
        <Text style={styles.createChannelTitle}>Launch your channel</Text>
        <Text style={styles.createChannelSubtitle}>Share your videos, build a community, and unlock creator tools.</Text>
        <TouchableOpacity
          style={styles.createChannelButton}
          onPress={handleCreateChannel}
          disabled={isCreatingChannel}
          testID="create-channel-button"
        >
          {isCreatingChannel ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <Text style={styles.createChannelButtonText}>Create Channel</Text>
          )}
        </TouchableOpacity>
        {channelError ? <Text style={styles.channelErrorText}>{channelError}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: resolvedAvatar }}
            style={styles.avatar}
            testID="profile-avatar"
          />
          <Text style={styles.displayName}>{activeUser.displayName}</Text>
          <Text style={styles.username}>@{activeUser.username}</Text>
          {activeUser.bio && <Text style={styles.bio}>{activeUser.bio}</Text>}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/edit-profile")}
            testID="profile-edit-button"
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {roleAction && (
            <TouchableOpacity
              style={styles.roleActionButton}
              onPress={() => {
                const targetRoute = roleAction.route ?? roleDestination;
                if (targetRoute) {
                  router.push(targetRoute as any);
                }
              }}
              testID="role-action-button"
            >
              <Text style={styles.roleActionLabel}>{roleAction.label}</Text>
            </TouchableOpacity>
          )}

          {activeUser.phone && (
            <Text style={styles.phoneText}>{activeUser.phone}</Text>
          )}
        </View>

        <View style={styles.channelSection}>{renderChannelSection()}</View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeUser.subscriptions?.length || 0}</Text>
            <Text style={styles.statLabel}>Subscriptions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeUser.likedVideos?.length || 0}</Text>
            <Text style={styles.statLabel}>Liked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeUser.watchHistory?.length || 0}</Text>
            <Text style={styles.statLabel}>Watched</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => {
                  if (item.onPress) {
                    item.onPress();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <Icon color={theme.colors.text} size={24} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                {item.count !== null && (
                  <Text style={styles.menuItemCount}>{item.count}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center" as const,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  roleActionButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleActionLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  displayName: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  username: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  bio: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    textAlign: "center" as const,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    marginTop: theme.spacing.sm,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  phoneText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  channelSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  createChannelCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  createChannelBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  createChannelTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "700" as const,
    color: theme.colors.text,
  },
  createChannelSubtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  createChannelButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    alignItems: "center" as const,
  },
  createChannelButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  channelCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  channelCardDisabled: {
    opacity: 0.9,
  },
  channelCardRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.md,
  },
  channelAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border,
  },
  channelCardInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  channelCardName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700" as const,
    color: theme.colors.text,
  },
  channelCardHandle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  channelCardHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  channelErrorText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.error,
  },
  statsSection: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  menuSection: {
    paddingVertical: theme.spacing.md,
  },
  menuItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  menuItemLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.md,
  },
  menuItemLabel: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontWeight: "500" as const,
  },
  menuItemCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});
