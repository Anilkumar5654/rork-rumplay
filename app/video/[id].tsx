import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  Share as RNShare,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import {
  ArrowLeft,
  Flag,
  MessageCircle,
  Pause,
  Play,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { theme } from "@/constants/theme";
import { useAppState } from "@/contexts/AppStateContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useVideoScreenData } from "@/hooks/useVideoScreenData";
import { useAuth } from "@/contexts/AuthContext";
import { getEnvApiBaseUrl, getEnvApiRootUrl } from "@/utils/env";

const { width, height } = Dimensions.get("window");
const PLAYER_HEIGHT = width * (9 / 16);

type ReactionAction = "like" | "unlike" | "dislike" | "undislike";

type ReactionResponse = {
  success: boolean;
  message?: string;
  likes?: number;
  dislikes?: number;
  error?: string;
};

type CommentResponse = {
  success: boolean;
  comment_id?: string;
  message?: string;
  error?: string;
};

type SubscriptionResponse = {
  success: boolean;
  subscriber_count?: number;
  message?: string;
  error?: string;
};

type ViewResponse = {
  success: boolean;
  views?: number;
  message?: string;
  error?: string;
};

type ReportOption = {
  id: string;
  label: string;
};

const REPORT_OPTIONS: ReportOption[] = [
  { id: "spam", label: "Spam or misleading" },
  { id: "abuse", label: "Hateful or abusive" },
  { id: "inappropriate", label: "Inappropriate content" },
];

const parseJsonStrict = <T,>(input: string): T => {
  try {
    return JSON.parse(input) as T;
  } catch (error) {
    console.error("[VideoPlayer] parseJsonStrict", error, input.slice(0, 120));
    throw new Error("Server returned invalid JSON");
  }
};

const buildJsonHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
};

const formatTime = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks}w ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
};

const getInitials = (text: string) => {
  if (!text || text.length === 0) {
    return "?";
  }
  const words = text.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

export default function VideoPlayerScreen() {
  const router = useRouter();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const params = useLocalSearchParams();
  const rawVideoId = params.id;
  const videoId = useMemo(() => {
    if (Array.isArray(rawVideoId)) {
      return rawVideoId[0] ?? null;
    }
    if (typeof rawVideoId === "string" && rawVideoId.length > 0) {
      return rawVideoId;
    }
    return null;
  }, [rawVideoId]);
  const insets = useSafeAreaInsets();
  const { authUser, authToken, refreshAuthUser } = useAuth();
  const { addToWatchHistory, getWatchPosition, settings } = useAppState();
  const { videoRef, setCurrentVideoId, minimizePlayer } = usePlayer();
  const queryClient = useQueryClient();
  const apiRoot = useMemo(() => getEnvApiRootUrl(), []);
  const appBaseUrl = useMemo(() => getEnvApiBaseUrl(), []);

  const {
    data,
    videoQuery,
    channelQuery,
    commentsQuery,
    recommendedQuery,
  } = useVideoScreenData(videoId);

  const video = data.video;
  const channel = data.channel;
  const comments = data.comments;
  const relatedVideos = data.related;

  const [isPlaying, setIsPlaying] = useState(settings.autoPlayOnOpen);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);

  const panY = useRef(new Animated.Value(0)).current;
  const lastSaveTime = useRef(0);
  const addToWatchHistoryRef = useRef(addToWatchHistory);
  const getWatchPositionRef = useRef(getWatchPosition);
  const viewedVideoRef = useRef<string | null>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    addToWatchHistoryRef.current = addToWatchHistory;
  }, [addToWatchHistory]);

  useEffect(() => {
    getWatchPositionRef.current = getWatchPosition;
  }, [getWatchPosition]);

  useEffect(() => {
    if (!videoId) {
      return;
    }
    setCurrentVideoId(videoId);
    addToWatchHistoryRef.current(videoId);
    const savedPosition = getWatchPositionRef.current(videoId);
    if (savedPosition > 0 && videoRef.current) {
      setTimeout(() => {
        videoRef.current?.setPositionAsync(savedPosition).catch((error) => {
          console.error("[VideoPlayer] failed to restore position", error);
        });
      }, 500);
    }
  }, [videoId, setCurrentVideoId, videoRef]);

  useEffect(() => {
    if (!video) {
      setUserReaction(null);
      return;
    }
    if (video.isLiked) {
      setUserReaction("like");
      return;
    }
    if (video.isDisliked) {
      setUserReaction("dislike");
      return;
    }
    setUserReaction(null);
  }, [video]);

  const { mutate: incrementView } = useMutation<ViewResponse, Error, string>({
    mutationFn: async (targetVideoId) => {
      console.log("[VideoPlayer] incrementing view", targetVideoId);
      const response = await fetch(`${apiRoot}/video/view.php`, {
        method: "POST",
        headers: buildJsonHeaders(authToken ?? null),
        body: JSON.stringify({ video_id: targetVideoId }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<ViewResponse>(raw);
      if (!response.ok || !data.success) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return data;
    },
  });

  useEffect(() => {
    if (!video?.id) {
      return;
    }
    if (viewedVideoRef.current === video.id) {
      return;
    }
    viewedVideoRef.current = video.id;
    incrementView(video.id, {
      onError: (error) => {
        console.error("[VideoPlayer] view increment failed", error);
      },
    });
  }, [video?.id, incrementView]);

  const {
    mutate: sendReaction,
    isPending: isReactionPending,
  } = useMutation<ReactionResponse, Error, ReactionAction>({
    mutationFn: async (action) => {
      if (!videoId) {
        throw new Error("Missing video");
      }
      if (!authToken) {
        throw new Error("Please login to react to videos");
      }
      console.log("[VideoPlayer] reaction", action, videoId);
      const response = await fetch(`${apiRoot}/video/like.php`, {
        method: "POST",
        headers: buildJsonHeaders(authToken),
        body: JSON.stringify({
          video_id: videoId,
          action,
        }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<ReactionResponse>(raw);
      if (!response.ok || !data.success) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", "details"] });
    },
    onError: (error) => {
      Alert.alert("Reaction failed", error.message);
    },
  });

  const {
    mutate: updateSubscription,
    isPending: isSubscribePending,
  } = useMutation<SubscriptionResponse, Error, "subscribe" | "unsubscribe">({
    mutationFn: async (action) => {
      if (!channel?.id) {
        throw new Error("Channel not available");
      }
      if (!authToken) {
        throw new Error("Please login to manage subscriptions");
      }
      const endpoint = action === "subscribe" ? "subscribe.php" : "unsubscribe.php";
      console.log("[VideoPlayer] subscription", action, channel.id);
      const response = await fetch(`${apiRoot}/subscription/${endpoint}`, {
        method: "POST",
        headers: buildJsonHeaders(authToken),
        body: JSON.stringify({ channel_id: channel.id }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<SubscriptionResponse>(raw);
      if (!response.ok || !data.success) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["channel", "details"] });
      queryClient.invalidateQueries({ queryKey: ["video", "details"] });
      await refreshAuthUser();
    },
    onError: (error) => {
      Alert.alert("Subscription failed", error.message);
    },
  });

  const {
    mutate: submitComment,
    isPending: isCommentPending,
  } = useMutation<CommentResponse, Error, string>({
    mutationFn: async (message) => {
      if (!videoId) {
        throw new Error("Missing video");
      }
      if (!authToken) {
        throw new Error("Please login to comment");
      }
      console.log("[VideoPlayer] adding comment", videoId);
      const response = await fetch(`${apiRoot}/video/comment.php`, {
        method: "POST",
        headers: buildJsonHeaders(authToken),
        body: JSON.stringify({
          video_id: videoId,
          comment: message,
        }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<CommentResponse>(raw);
      if (!response.ok || !data.success) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", "comments"] });
      queryClient.invalidateQueries({ queryKey: ["video", "details"] });
      setCommentText("");
    },
    onError: (error) => {
      Alert.alert("Comment failed", error.message);
    },
  });

  const handleSafeBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.replace("/(tabs)/home");
  }, [navigation, router]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && settings.miniPlayerEnabled;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(panY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            minimizePlayer();
            handleSafeBack();
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

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        return;
      }
      setPosition(status.positionMillis);
      setDuration(status.durationMillis ?? 0);
      setIsPlaying(status.isPlaying);
      const now = Date.now();
      if (videoId && now - lastSaveTime.current > 5000) {
        lastSaveTime.current = now;
        addToWatchHistoryRef.current(videoId, status.positionMillis, status.durationMillis ?? 0);
      }
    },
    [videoId]
  );

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
  }, [isPlaying, fadeAnim]);

  const handlePlayerPress = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isPlaying, videoRef]);

  const handleForward = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }
    const newPosition = Math.min(position + 10000, duration);
    await videoRef.current.setPositionAsync(newPosition);
  }, [position, duration, videoRef]);

  const handleBackward = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }
    const newPosition = Math.max(position - 10000, 0);
    await videoRef.current.setPositionAsync(newPosition);
  }, [position, videoRef]);

  const handleReaction = useCallback((type: "like" | "dislike") => {
    if (!videoId) {
      return;
    }
    const previous = userReaction;
    if (type === "like") {
      const nextAction: ReactionAction = previous === "like" ? "unlike" : "like";
      const nextState = previous === "like" ? null : "like";
      setUserReaction(nextState);
      sendReaction(nextAction, {
        onError: () => setUserReaction(previous),
      });
    } else {
      const nextAction: ReactionAction = previous === "dislike" ? "undislike" : "dislike";
      const nextState = previous === "dislike" ? null : "dislike";
      setUserReaction(nextState);
      sendReaction(nextAction, {
        onError: () => setUserReaction(previous),
      });
    }
  }, [sendReaction, userReaction, videoId]);

  const handleSubscribe = useCallback(() => {
    if (!channel) {
      return;
    }
    const action = channel.isSubscribed ? "unsubscribe" : "subscribe";
    updateSubscription(action);
  }, [channel, updateSubscription]);

  const handleAddComment = useCallback(() => {
    const trimmed = commentText.trim();
    if (trimmed.length === 0) {
      return;
    }
    submitComment(trimmed);
  }, [commentText, submitComment]);

  const handleShare = useCallback(async () => {
    if (!video) {
      return;
    }
    const shareUrl = `${appBaseUrl}/watch/${video.id}`;
    try {
      await RNShare.share({
        message: `Check out this video: ${video.title}\n${shareUrl}`,
        url: shareUrl,
        title: video.title,
      });
    } catch (error) {
      console.error("[VideoPlayer] share failed", error);
    }
  }, [video, appBaseUrl]);

  const handleReport = useCallback((option: ReportOption) => {
    console.log("[VideoPlayer] report option selected", option.id);
    setShowReportModal(false);
    Alert.alert("Report submitted", "Thanks for helping keep the community safe.");
  }, []);

  const isLoading = (videoQuery.isLoading || channelQuery.isLoading) && !video;
  const fatalError = videoQuery.error || channelQuery.error;

  const channelAvatarUri = useMemo(() => {
    if (channel?.avatar) {
      return channel.avatar;
    }
    if (video?.channelAvatar) {
      return video.channelAvatar;
    }
    return "";
  }, [channel?.avatar, video?.channelAvatar]);

  const channelName = channel?.name ?? video?.channelName ?? "";
  const isSubscribed = channel?.isSubscribed ?? false;
  const subscriberDisplay = formatCompactNumber(channel?.subscriberCount ?? 0);

  const renderCommentAvatar = (userName: string, uri: string) => {
    if (uri && uri.length > 0) {
      return <Image source={{ uri }} style={styles.commentAvatar} />;
    }
    return (
      <View style={styles.commentAvatarFallback}>
        <Text style={styles.commentAvatarFallbackText}>{getInitials(userName)}</Text>
      </View>
    );
  };

  const renderChannelAvatar = () => {
    if (channelAvatarUri && channelAvatarUri.length > 0) {
      return <Image source={{ uri: channelAvatarUri }} style={styles.channelAvatar} />;
    }
    return (
      <View style={styles.channelAvatarFallback}>
        <Text style={styles.channelAvatarFallbackText}>{getInitials(channelName)}</Text>
      </View>
    );
  };

  if (!videoId) {
    return (
      <View style={styles.fallbackContainer} testID="video-missing-screen">
        <Text style={styles.fallbackText}>Video not found.</Text>
        <TouchableOpacity
          onPress={handleSafeBack}
          style={styles.fallbackButton}
          testID="video-missing-back"
        >
          <Text style={styles.fallbackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (fatalError) {
    const message = fatalError instanceof Error ? fatalError.message : "Unable to load this video.";
    return (
      <View style={styles.fallbackContainer} testID="video-error-screen">
        <Text style={styles.fallbackText}>{message}</Text>
        <TouchableOpacity
          onPress={() => {
            videoQuery.refetch();
            channelQuery.refetch();
          }}
          style={styles.fallbackButton}
          testID="video-error-retry-button"
        >
          <Text style={styles.fallbackButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: panY }] }]}
      {...panResponder.panHandlers}
      testID="video-player-screen"
    >
      <View style={[styles.playerContainer, { paddingTop: insets.top }]} testID="video-player-wrapper">
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleSafeBack}
          testID="video-back-button"
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playerTouchable}
          activeOpacity={1}
          onPress={handlePlayerPress}
          testID="video-player-touchable"
        >
          {video ? (
            <ExpoVideo
              ref={videoRef}
              source={{ uri: video.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={settings.autoPlayOnOpen}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              testID="video-player-instance"
            />
          ) : (
            <View style={[styles.video, styles.videoPlaceholder]}>
              <ActivityIndicator color="#ffffff" />
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#ffffff" size="large" />
            </View>
          )}

          {showControls && video && (
            <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}
              testID="video-controls-overlay"
            >
              <View style={styles.centerControls}>
                <TouchableOpacity onPress={handleBackward} style={styles.controlButton} testID="video-seek-back">
                  <Text style={styles.controlButtonText}>-10s</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePlayPause} style={styles.playButton} testID="video-play-toggle">
                  {isPlaying ? <Pause color="#FFFFFF" size={48} /> : <Play color="#FFFFFF" size={48} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForward} style={styles.controlButton} testID="video-seek-forward">
                  <Text style={styles.controlButtonText}>+10s</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomControls}>
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, Math.max(0, duration > 0 ? (position / duration) * 100 : 0))}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        testID="video-content-scroll"
      >
        {video && (
          <View style={styles.videoInfoSection}>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <Text style={styles.videoStats}>
              {formatCompactNumber(video.views)} views • {formatTimeAgo(video.createdAt)}
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, userReaction === "like" && styles.actionButtonActive]}
            onPress={() => handleReaction("like")}
            disabled={isReactionPending}
            testID="video-like-button"
          >
            <ThumbsUp
              color={userReaction === "like" ? theme.colors.primary : theme.colors.text}
              size={24}
              fill={userReaction === "like" ? theme.colors.primary : "none"}
            />
            <Text style={[styles.actionText, userReaction === "like" && styles.actionTextActive]}>
              {formatCompactNumber(video?.likes ?? 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, userReaction === "dislike" && styles.actionButtonActive]}
            onPress={() => handleReaction("dislike")}
            disabled={isReactionPending}
            testID="video-dislike-button"
          >
            <ThumbsDown
              color={userReaction === "dislike" ? theme.colors.primary : theme.colors.text}
              size={24}
              fill={userReaction === "dislike" ? theme.colors.primary : "none"}
            />
            <Text style={[styles.actionText, userReaction === "dislike" && styles.actionTextActive]}>Dislike</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare} testID="video-share-button">
            <Share2 color={theme.colors.text} size={24} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowReportModal(true)}
            testID="video-report-button"
          >
            <Flag color={theme.colors.text} size={24} />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.channelSection}>
          <TouchableOpacity
            style={styles.channelInfo}
            onPress={() => router.push(`/channel/${channel?.id ?? video?.channelId ?? ""}`)}
            testID="video-channel-button"
          >
            {renderChannelAvatar()}
            <View style={styles.channelMeta}>
              <Text style={styles.channelName}>{channelName}</Text>
              <Text style={styles.subscriberCount}>{subscriberDisplay} subscribers</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
            onPress={handleSubscribe}
            disabled={isSubscribePending}
            testID="video-subscribe-button"
          >
            <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Text>
          </TouchableOpacity>
        </View>

        {video?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{video.description}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.commentsHeader}
          onPress={() => setShowComments((prev) => !prev)}
          testID="video-comments-toggle"
        >
          <MessageCircle color={theme.colors.text} size={24} />
          <Text style={styles.commentsHeaderText}>Comments ({comments.length})</Text>
        </TouchableOpacity>

        {showComments && (
          <View style={styles.commentsSection}>
            <View style={styles.addCommentContainer}>
              {renderCommentAvatar(authUser?.displayName ?? "You", authUser?.avatar ?? "")}
              <TextInput
                style={styles.commentInput}
                placeholder={authUser ? "Add a comment..." : "Login to comment"}
                placeholderTextColor={theme.colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                editable={Boolean(authUser)}
                testID="video-comment-input"
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!authUser || isCommentPending || commentText.trim().length === 0}
                testID="video-comment-submit"
              >
                <Send color={authUser ? theme.colors.primary : theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            {commentsQuery.isError && (
              <Text style={styles.commentsErrorText}>Unable to load comments at the moment.</Text>
            )}

            {comments.length === 0 ? (
              <Text style={styles.emptyCommentsText}>Be the first to comment.</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  {renderCommentAvatar(comment.authorDisplayName, comment.authorAvatar)}
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUserName}>{comment.authorDisplayName}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.relatedSection}>
          <Text style={styles.sectionTitle}>Related Videos</Text>
          {recommendedQuery.isError && (
            <Text style={styles.relatedErrorText}>Unable to load related videos right now.</Text>
          )}
          {relatedVideos.map((relatedVideo) => (
            <TouchableOpacity
              key={relatedVideo.id}
              style={styles.relatedVideoCard}
              onPress={() => router.push(`/video/${relatedVideo.id}`)}
              testID={`related-video-${relatedVideo.id}`}
            >
              <Image source={{ uri: relatedVideo.thumbnail }} style={styles.relatedThumbnail} />
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedTitle} numberOfLines={2}>
                  {relatedVideo.title}
                </Text>
                <Text style={styles.relatedChannel}>{relatedVideo.channelName}</Text>
                <Text style={styles.relatedStats}>
                  {formatCompactNumber(relatedVideo.views)} views
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Video</Text>
            {REPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.reportOption}
                onPress={() => handleReport(option)}
                testID={`video-report-${option.id}`}
              >
                <Text style={styles.reportOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowReportModal(false)}
              testID="video-report-cancel"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  playerContainer: {
    position: "relative" as const,
    backgroundColor: "#000000",
  },
  backButton: {
    position: "absolute" as const,
    top: 50,
    left: theme.spacing.md,
    zIndex: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  playerTouchable: {
    width: "100%",
    height: PLAYER_HEIGHT,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#000000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between" as const,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  centerControls: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.xl,
  },
  controlButton: {
    padding: theme.spacing.md,
  },
  controlButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  playButton: {
    padding: theme.spacing.md,
  },
  bottomControls: {
    padding: theme.spacing.md,
  },
  progressContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl * 2,
  },
  videoInfoSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  videoTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  videoStats: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionButton: {
    alignItems: "center" as const,
    gap: theme.spacing.xs,
  },
  actionButtonActive: {},
  actionText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text,
  },
  actionTextActive: {
    color: theme.colors.primary,
  },
  channelSection: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  channelInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
    flex: 1,
  },
  channelAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
  },
  channelAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  channelAvatarFallbackText: {
    color: theme.colors.text,
    fontWeight: "700" as const,
    fontSize: theme.fontSizes.md,
  },
  channelMeta: {
    flex: 1,
  },
  channelName: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  subscriberCount: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  subscribedButton: {
    backgroundColor: theme.colors.surface,
  },
  subscribeText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
  },
  subscribedText: {
    color: theme.colors.text,
  },
  descriptionSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  description: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  commentsHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentsHeaderText: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  commentsSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  commentsErrorText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
  },
  addCommentContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
  },
  commentAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  commentAvatarFallbackText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text,
    fontWeight: "600" as const,
  },
  commentInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
  },
  commentItem: {
    flexDirection: "row" as const,
    gap: theme.spacing.sm,
  },
  commentContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  commentHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
  },
  commentUserName: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  commentTime: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  commentText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  emptyCommentsText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  relatedSection: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  relatedErrorText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "bold" as const,
    color: theme.colors.text,
  },
  relatedVideoCard: {
    flexDirection: "row" as const,
    gap: theme.spacing.sm,
  },
  relatedThumbnail: {
    width: 160,
    height: 90,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  relatedInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  relatedTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  relatedChannel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  relatedStats: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
  },
  reportOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reportOptionText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  modalCancel: {
    paddingVertical: theme.spacing.md,
    alignItems: "center" as const,
  },
  modalCancelText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: "600" as const,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  fallbackText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    marginBottom: theme.spacing.md,
    textAlign: "center" as const,
  },
  fallbackButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  fallbackButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
  },
});
