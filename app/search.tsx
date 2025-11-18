import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAppState } from '@/contexts/AppStateContext';
import { Video, Channel } from '@/types';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'videos' | 'shorts' | 'channels';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videos, channels } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { videos: [], channels: [] };

    const query = searchQuery.toLowerCase();
    const filteredVideos = videos.filter(
      v =>
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.channelName.toLowerCase().includes(query) ||
        v.tags.some(tag => tag.toLowerCase().includes(query))
    );

    const filteredChannels = channels.filter(
      ch =>
        ch.name.toLowerCase().includes(query) ||
        ch.description.toLowerCase().includes(query)
    );

    return { videos: filteredVideos, channels: filteredChannels };
  }, [searchQuery, videos, channels]);

  const displayResults = useMemo(() => {
    const { videos: vids, channels: chs } = searchResults;

    switch (selectedFilter) {
      case 'videos':
        return vids.filter(v => !v.isShort);
      case 'shorts':
        return vids.filter(v => v.isShort);
      case 'channels':
        return chs;
      case 'all':
      default:
        return [...chs, ...vids];
    }
  }, [searchResults, selectedFilter]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isChannel = 'subscriberCount' in item;

    if (isChannel) {
      const channel = item as Channel;
      return (
        <TouchableOpacity
          style={styles.channelCard}
          onPress={() => router.push(`/channel/${channel.id}`)}
        >
          <Image source={{ uri: channel.avatar }} style={styles.channelAvatar} />
          <View style={styles.channelInfo}>
            <Text style={styles.channelName} numberOfLines={1}>
              {channel.name}
            </Text>
            <Text style={styles.channelStats}>
              {formatViews(channel.subscriberCount)} subscribers
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    const video = item as Video;
    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => router.push(`/${video.isShort ? 'shorts' : 'video'}/${video.id}`)}
      >
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
          {video.isShort && (
            <View style={styles.shortBadge}>
              <Text style={styles.shortBadgeText}>SHORT</Text>
            </View>
          )}
          {!video.isShort && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
            </View>
          )}
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.videoStats}>
            {video.channelName} • {formatViews(video.views)} views
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <SearchIcon color={theme.colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, shorts, channels..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={theme.colors.textSecondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim().length > 0 && (
        <View style={styles.filtersContainer}>
          {(['all', 'videos', 'shorts', 'channels'] as FilterType[]).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={displayResults}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <SearchIcon color={theme.colors.textSecondary} size={64} />
            <Text style={styles.emptyStateText}>
              {searchQuery.trim().length > 0
                ? 'No results found'
                : 'Search for videos, shorts, or channels'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
  },
  filtersContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  resultsList: {
    padding: theme.spacing.md,
  },
  channelCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
  },
  channelAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.md,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  channelStats: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  videoCard: {
    flexDirection: 'row' as const,
    marginBottom: theme.spacing.md,
  },
  thumbnailContainer: {
    position: 'relative' as const,
    width: 150,
    height: 85,
    borderRadius: theme.radii.md,
    overflow: 'hidden' as const,
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  shortBadge: {
    position: 'absolute' as const,
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  shortBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  durationBadge: {
    position: 'absolute' as const,
    bottom: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.xs,
    fontWeight: '600' as const,
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  videoTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  videoStats: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyStateText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    textAlign: 'center' as const,
  },
});
