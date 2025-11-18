import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radio, Eye } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useAppState } from '../../contexts/AppStateContext';
import { Video } from '../../types';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videos } = useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'live' | 'categories'>('trending');

  const liveVideos = videos.filter(v => v.isLive);
  const trendingVideos = [...videos]
    .filter(v => !v.isShort && !v.isLive)
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const categoriesData = [
    { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#9146FF' },
    { id: 'music', name: 'Music', icon: '🎵', color: '#FF0050' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#00B894' },
    { id: 'technology', name: 'Tech', icon: '💻', color: '#0984E3' },
    { id: 'education', name: 'Education', icon: '📚', color: '#FDCB6E' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#E17055' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const renderLiveCard = (video: Video) => (
    <TouchableOpacity
      key={video.id}
      style={styles.liveCard}
      onPress={() => router.push(`/video/${video.id}`)}
    >
      <View style={styles.liveThumbnailContainer}>
        <Image source={{ uri: video.thumbnail }} style={styles.liveThumbnail} />
        <View style={styles.liveBadge}>
          <Radio color="#FFFFFF" size={12} fill="#FFFFFF" />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <View style={styles.viewersBadge}>
          <Eye color="#FFFFFF" size={12} />
          <Text style={styles.viewersText}>{formatViews(video.views)}</Text>
        </View>
      </View>
      <View style={styles.liveInfo}>
        <Image source={{ uri: video.channelAvatar }} style={styles.liveChannelAvatar} />
        <View style={styles.liveMeta}>
          <Text style={styles.liveTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.liveChannelName}>{video.channelName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingCard = (video: Video, index: number) => (
    <TouchableOpacity
      key={video.id}
      style={styles.trendingCard}
      onPress={() => router.push(`/video/${video.id}`)}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <Image source={{ uri: video.thumbnail }} style={styles.trendingThumbnail} />
      <View style={styles.trendingInfo}>
        <Text style={styles.trendingTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.trendingChannel}>{video.channelName}</Text>
        <View style={styles.trendingStats}>
          <Eye color={theme.colors.textSecondary} size={14} />
          <Text style={styles.trendingViewsText}>{formatViews(video.views)} views</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryCard = (category: typeof categoriesData[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, { backgroundColor: category.color }]}
      onPress={() => router.push(`/search?category=${category.id}`)}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trending' && styles.tabActive]}
            onPress={() => setActiveTab('trending')}
          >
            <Text style={[styles.tabText, activeTab === 'trending' && styles.tabTextActive]}>
              Trending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'live' && styles.tabActive]}
            onPress={() => setActiveTab('live')}
          >
            <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
              Live
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'categories' && styles.tabActive]}
            onPress={() => setActiveTab('categories')}
          >
            <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
              Categories
            </Text>
          </TouchableOpacity>
        </View>
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
        {activeTab === 'live' && (
          <View style={styles.section}>
            {liveVideos.length > 0 ? (
              liveVideos.map(renderLiveCard)
            ) : (
              <View style={styles.emptyState}>
                <Radio color={theme.colors.textSecondary} size={64} />
                <Text style={styles.emptyStateTitle}>No Live Streams</Text>
                <Text style={styles.emptyStateText}>
                  Check back later for live content
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'trending' && (
          <View style={styles.section}>
            {trendingVideos.map((video, index) => renderTrendingCard(video, index))}
          </View>
        )}

        {activeTab === 'categories' && (
          <View style={styles.categoriesGrid}>
            {categoriesData.map(renderCategoryCard)}
          </View>
        )}
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
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tabs: {
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
  },
  liveCard: {
    marginBottom: theme.spacing.lg,
  },
  liveThumbnailContainer: {
    position: 'relative' as const,
    width: '100%',
    height: (width - theme.spacing.md * 2) * (9 / 16),
    borderRadius: theme.radii.xl,
    overflow: 'hidden' as const,
  },
  liveThumbnail: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute' as const,
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
    backgroundColor: '#FF0000',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.xs,
    fontWeight: 'bold' as const,
  },
  viewersBadge: {
    position: 'absolute' as const,
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  viewersText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.xs,
    fontWeight: '600' as const,
  },
  liveInfo: {
    flexDirection: 'row' as const,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  liveChannelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  liveMeta: {
    flex: 1,
  },
  liveTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  liveChannelName: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  trendingCard: {
    flexDirection: 'row' as const,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    position: 'relative' as const,
  },
  rankBadge: {
    width: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  rankText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.primary,
  },
  trendingThumbnail: {
    width: 160,
    height: 90,
    borderRadius: theme.radii.lg,
  },
  trendingInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  trendingTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  trendingChannel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  trendingStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  trendingViewsText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  categoriesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  categoryCard: {
    width: (width - theme.spacing.md * 3) / 2,
    height: 120,
    borderRadius: theme.radii.xl,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  categoryIcon: {
    fontSize: 48,
  },
  categoryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
  },
});
