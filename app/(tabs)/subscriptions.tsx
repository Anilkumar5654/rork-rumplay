import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import { useAppState } from "../../contexts/AppStateContext";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get("window");

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videos, currentUser, channels } = useAppState();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const subscribedChannelIds = currentUser.subscriptions.map((s) => s.channelId);
  const subscribedVideos = videos.filter((v) => 
    subscribedChannelIds.includes(v.channelId) && !v.isShort
  ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelsRow}
        >
          {subscribedChannelIds.map((channelId) => {
            const channel = channels.find((ch) => ch.id === channelId);
            if (!channel) return null;
            return (
              <TouchableOpacity
                key={channel.id}
                style={styles.channelItem}
                onPress={() => router.push(`/channel/${channel.id}`)}
              >
                <Image source={{ uri: channel.avatar }} style={styles.channelAvatar} />
                <Text style={styles.channelName} numberOfLines={1}>
                  {channel.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.videosSection}>
          {subscribedVideos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No videos from your subscriptions yet</Text>
            </View>
          ) : (
            subscribedVideos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.videoCard}
                onPress={() => router.push(`/video/${video.id}`)}
              >
                <View style={styles.thumbnailContainer}>
                  <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Image source={{ uri: video.channelAvatar }} style={styles.videoAvatar} />
                  <View style={styles.videoMeta}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text style={styles.videoStats}>
                      {video.channelName} • {formatViews(video.views)} views • {formatTimeAgo(video.uploadDate)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  channelsRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  channelItem: {
    alignItems: "center" as const,
    width: 80,
  },
  channelAvatar: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  channelName: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xs,
    textAlign: "center" as const,
  },
  videosSection: {
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center" as const,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
  },
  videoCard: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  thumbnailContainer: {
    position: "relative" as const,
  },
  videoThumbnail: {
    width: "100%",
    height: (width - theme.spacing.md * 2) * (9 / 16),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },
  durationBadge: {
    position: "absolute" as const,
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.xs,
    fontWeight: "600" as const,
  },
  videoInfo: {
    flexDirection: "row" as const,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  videoAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
  },
  videoMeta: {
    flex: 1,
  },
  videoTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  videoStats: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
    marginTop: 4,
  },
});
