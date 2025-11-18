import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { Play, Pause, X } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAppState } from "@/contexts/AppStateContext";
import { Video as AppVideo } from "@/types";

const MINI_PLAYER_HEIGHT = 80;
const FALLBACK_THUMBNAIL = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=60";

export default function MiniPlayer() {
  const router = useRouter();
  const { currentVideoId, isPlaying, play, pause, closePlayer, showMiniPlayer } = usePlayer();
  const { getVideoById } = useAppState();

  const video = useMemo<AppVideo | null>(() => {
    if (!currentVideoId) {
      return null;
    }

    try {
      return getVideoById(currentVideoId) ?? null;
    } catch (error) {
      console.error('MiniPlayer getVideoById error', error);
      return null;
    }
  }, [currentVideoId, getVideoById]);

  const panY = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          Animated.timing(panY, {
            toValue: 200,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            closePlayer();
            panY.setValue(0);
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!showMiniPlayer || !video) {
    return null;
  }

  const handleTap = () => {
    router.push(`/video/${video.id}`);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleClose = () => {
    closePlayer();
  };

  return (
    <Animated.View
      testID="mini-player"
      style={[
        styles.container,
        {
          transform: [{ translateY: panY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.content} onPress={handleTap} activeOpacity={0.9}>
        <Image source={{ uri: video.thumbnail || FALLBACK_THUMBNAIL }} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {video.title}
          </Text>
          <Text style={styles.channel} numberOfLines={1}>
            {video.channelName}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
            {isPlaying ? (
              <Pause color={theme.colors.text} size={24} />
            ) : (
              <Play color={theme.colors.text} size={24} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
            <X color={theme.colors.text} size={24} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute" as const,
    bottom: 16,
    left: 16,
    right: 16,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
  },
  info: {
    flex: 1,
    justifyContent: "center" as const,
  },
  title: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: 2,
  },
  channel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  controls: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
  },
  controlButton: {
    padding: theme.spacing.xs,
  },
});
