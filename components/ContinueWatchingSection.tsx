import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useAppState } from '../contexts/AppStateContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function ContinueWatchingSection() {
  const router = useRouter();
  const { currentUser, videos } = useAppState();
  
  const continueWatching = currentUser.watchHistoryDetailed
    .filter(item => {
      if (!item.duration || item.duration === 0) return false;
      const progress = item.position / item.duration;
      return progress > 0.05 && progress < 0.9;
    })
    .slice(0, 10)
    .map(item => ({
      ...item,
      video: videos.find(v => v.id === item.videoId),
    }))
    .filter(item => item.video);

  if (continueWatching.length === 0) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Continue Watching</Text>
        <Text style={styles.subtitle}>Pick up where you left off</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + theme.spacing.md}
        decelerationRate="fast"
      >
        {continueWatching.map((item) => {
          const video = item.video!;
          const progress = item.duration > 0 ? item.position / item.duration : 0;
          const remainingTime = item.duration - item.position;
          
          return (
            <TouchableOpacity
              key={item.videoId}
              style={styles.card}
              onPress={() => router.push(`/video/${item.videoId}`)}
            >
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
                
                <View style={styles.overlay}>
                  <View style={styles.playButtonContainer}>
                    <View style={styles.playButton}>
                      <Play color="#FFFFFF" size={32} fill="#FFFFFF" />
                    </View>
                  </View>
                  
                  <View style={styles.timeRemaining}>
                    <Text style={styles.timeText}>{formatTime(remainingTime)} left</Text>
                  </View>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                </View>
              </View>
              
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <View style={styles.channelRow}>
                  <Image source={{ uri: video.channelAvatar }} style={styles.channelAvatar} />
                  <Text style={styles.channelName} numberOfLines={1}>
                    {video.channelName}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden' as const,
  },
  thumbnailContainer: {
    position: 'relative' as const,
    width: '100%',
    height: CARD_WIDTH * (9 / 16),
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playButtonContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  timeRemaining: {
    position: 'absolute' as const,
    bottom: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.sm,
    fontWeight: '600' as const,
  },
  progressBarContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  videoInfo: {
    padding: theme.spacing.md,
  },
  videoTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  channelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  channelAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  channelName: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});
