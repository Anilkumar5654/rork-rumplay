import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Text, Platform } from 'react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings, Maximize } from 'lucide-react-native';
import { theme } from '../constants/theme';



interface AdvancedVideoPlayerProps {
  videoRef: React.RefObject<ExpoVideo>;
  videoUri: string;
  onPlaybackStatusUpdate?: (status: any) => void;
  autoPlay?: boolean;
  onGestureMinimize?: () => void;
}

export default function AdvancedVideoPlayer({
  videoRef,
  videoUri,
  onPlaybackStatusUpdate,
  autoPlay = true,
  onGestureMinimize,
}: AdvancedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState<'auto' | '720p' | '480p' | '360p'>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const doubleTapLeft = useRef(new Animated.Value(0)).current;
  const doubleTapRight = useRef(new Animated.Value(0)).current;
  const lastTapLeft = useRef(0);
  const lastTapRight = useRef(0);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }
    }, 3000);
  }, [fadeAnim, isPlaying]);

  const handlePlaybackUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      onPlaybackStatusUpdate?.(status);
    }
  }, [onPlaybackStatusUpdate]);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
      resetControlsTimeout();
    }
  }, [isPlaying, videoRef, resetControlsTimeout]);

  const handleSeek = useCallback(async (milliseconds: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(milliseconds);
  }, [videoRef]);

  const handleForward = useCallback(async (seconds: number = 10) => {
    const newPosition = Math.min(position + seconds * 1000, duration);
    await handleSeek(newPosition);
    
    Animated.sequence([
      Animated.timing(doubleTapRight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(doubleTapRight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [position, duration, handleSeek, doubleTapRight]);

  const handleBackward = useCallback(async (seconds: number = 10) => {
    const newPosition = Math.max(position - seconds * 1000, 0);
    await handleSeek(newPosition);
    
    Animated.sequence([
      Animated.timing(doubleTapLeft, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(doubleTapLeft, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [position, handleSeek, doubleTapLeft]);

  const handleDoubleTapLeft = useCallback(() => {
    const now = Date.now();
    if (now - lastTapLeft.current < 300) {
      handleBackward();
    }
    lastTapLeft.current = now;
  }, [handleBackward]);

  const handleDoubleTapRight = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRight.current < 300) {
      handleForward();
    }
    lastTapRight.current = now;
  }, [handleForward]);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  }, [isMuted, videoRef]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const qualityOptions = [
    { label: 'Auto', value: 'auto' as const },
    { label: '720p', value: '720p' as const },
    { label: '480p', value: '480p' as const },
    { label: '360p', value: '360p' as const },
  ];

  return (
    <View style={styles.container}>
      <ExpoVideo
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isMuted={isMuted}
        onPlaybackStatusUpdate={handlePlaybackUpdate}
      />

      <TouchableOpacity
        style={[styles.tapZone, styles.leftZone]}
        activeOpacity={1}
        onPress={handleDoubleTapLeft}
      >
        <Animated.View
          style={[
            styles.tapIndicator,
            {
              opacity: doubleTapLeft,
              transform: [
                {
                  scale: doubleTapLeft.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <SkipBack color="#FFFFFF" size={48} />
          <Text style={styles.tapText}>-10s</Text>
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tapZone, styles.centerZone]}
        activeOpacity={1}
        onPress={() => {
          resetControlsTimeout();
        }}
      />

      <TouchableOpacity
        style={[styles.tapZone, styles.rightZone]}
        activeOpacity={1}
        onPress={handleDoubleTapRight}
      >
        <Animated.View
          style={[
            styles.tapIndicator,
            {
              opacity: doubleTapRight,
              transform: [
                {
                  scale: doubleTapRight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        >
          <SkipForward color="#FFFFFF" size={48} />
          <Text style={styles.tapText}>+10s</Text>
        </Animated.View>
      </TouchableOpacity>

      {showControls && (
        <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}>
          <View style={styles.topControls}>
            <TouchableOpacity onPress={toggleMute} style={styles.iconButton}>
              {isMuted ? (
                <VolumeX color="#FFFFFF" size={24} />
              ) : (
                <Volume2 color="#FFFFFF" size={24} />
              )}
            </TouchableOpacity>
            <View style={styles.spacer} />
            <TouchableOpacity 
              onPress={() => setShowQualityMenu(!showQualityMenu)} 
              style={styles.iconButton}
            >
              <Settings color="#FFFFFF" size={24} />
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.iconButton}>
                <Maximize color="#FFFFFF" size={24} />
              </TouchableOpacity>
            )}
          </View>

          {showQualityMenu && (
            <View style={styles.qualityMenu}>
              {qualityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.qualityOption,
                    quality === option.value && styles.qualityOptionActive,
                  ]}
                  onPress={() => {
                    setQuality(option.value);
                    setShowQualityMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.qualityText,
                      quality === option.value && styles.qualityTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.centerControls}>
            <TouchableOpacity onPress={() => handleBackward()} style={styles.controlButton}>
              <SkipBack color="#FFFFFF" size={32} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
              {isPlaying ? (
                <Pause color="#FFFFFF" size={48} fill="#FFFFFF" />
              ) : (
                <Play color="#FFFFFF" size={48} fill="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleForward()} style={styles.controlButton}>
              <SkipForward color="#FFFFFF" size={32} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(position / duration) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative' as const,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  tapZone: {
    position: 'absolute' as const,
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  leftZone: {
    left: 0,
    width: '30%',
  },
  centerZone: {
    left: '30%',
    width: '40%',
  },
  rightZone: {
    right: 0,
    width: '30%',
  },
  tapIndicator: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
  },
  tapText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.md,
    fontWeight: 'bold' as const,
    marginTop: theme.spacing.xs,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  qualityMenu: {
    position: 'absolute' as const,
    top: 60,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: theme.radii.lg,
    overflow: 'hidden' as const,
  },
  qualityOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minWidth: 100,
  },
  qualityOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.md,
    textAlign: 'center' as const,
  },
  qualityTextActive: {
    fontWeight: 'bold' as const,
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.xl,
  },
  controlButton: {
    padding: theme.spacing.md,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    padding: theme.spacing.md,
  },
  bottomControls: {
    padding: theme.spacing.md,
  },
  progressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.xs,
    minWidth: 45,
    fontWeight: '600' as const,
  },
});
