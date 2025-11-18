import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import { useAppState } from "../../contexts/AppStateContext";

const { width } = Dimensions.get("window");
const SHORTS_PER_ROW = 2;
const SHORTS_WIDTH = (width - theme.spacing.md * 3) / SHORTS_PER_ROW;

export default function ShortsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const appState = useAppState();
  const videos = appState?.videos ?? [];
  const [refreshing, setRefreshing] = useState(false);

  const shorts = videos.filter((v) => v.isShort);

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Shorts</Text>
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
        <View style={styles.shortsGrid}>
          {shorts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Shorts available</Text>
            </View>
          ) : (
            shorts.map((short) => (
              <TouchableOpacity
                key={short.id}
                style={styles.shortCard}
                onPress={() => router.push(`/shorts/${short.id}`)}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: short.thumbnail }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.shortBadge}>
                    <Text style={styles.shortBadgeText}>SHORT</Text>
                  </View>
                </View>
                <Text style={styles.shortTitle} numberOfLines={2}>
                  {short.title}
                </Text>
                <Text style={styles.shortViews}>
                  {formatViews(short.views)} views
                </Text>
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
  shortsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  shortCard: {
    width: SHORTS_WIDTH,
    marginBottom: theme.spacing.sm,
  },
  thumbnailContainer: {
    position: "relative" as const,
  },
  thumbnail: {
    width: SHORTS_WIDTH,
    height: SHORTS_WIDTH * 1.77,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },
  shortBadge: {
    position: "absolute" as const,
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  shortBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold" as const,
    letterSpacing: 0.5,
  },
  shortTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: "500" as const,
    marginTop: theme.spacing.sm,
  },
  shortViews: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
});
