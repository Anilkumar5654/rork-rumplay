import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreVertical,
} from "lucide-react-native";
import { theme } from "@/constants/theme";
import { useAppState } from "@/contexts/AppStateContext";

const { height } = Dimensions.get("window");

export default function ShortsPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { videos, currentUser, toggleVideoReaction } = useAppState();

  const shortId = params.id as string;
  const shorts = videos.filter((v) => v.isShort);
  const initialIndex = shorts.findIndex((s) => s.id === shortId);

  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const flatListRef = useRef<FlatList>(null);

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const renderShort = ({ item, index }: { item: any; index: number }) => {
    const userReaction = currentUser.reactions.find((r) => r.videoId === item.id);
    const isActive = index === currentIndex;

    return (
      <View style={styles.shortContainer}>
        <ExpoVideo
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
        />

        <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#FFFFFF" size={28} />
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleVideoReaction(item.id, "like")}
            >
              <ThumbsUp
                color="#FFFFFF"
                size={32}
                fill={userReaction?.type === "like" ? "#FFFFFF" : "none"}
              />
              <Text style={styles.actionText}>{formatViews(item.likes)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <MessageCircle color="#FFFFFF" size={32} />
              <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Share2 color="#FFFFFF" size={32} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <MoreVertical color="#FFFFFF" size={32} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomInfo}>
            <TouchableOpacity 
              style={styles.channelRow}
              onPress={() => router.push(`/channel/${item.channelId}`)}
            >
              <Image 
                source={{ uri: item.channelAvatar }} 
                style={styles.channelAvatar} 
              />
              <Text style={styles.channelName}>@{item.channelName}</Text>
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={shorts}
        renderItem={renderShort}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
        }}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  shortContainer: {
    height,
    position: "relative" as const,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between" as const,
  },
  backButton: {
    alignSelf: "flex-start" as const,
    padding: theme.spacing.md,
  },
  rightActions: {
    position: "absolute" as const,
    right: theme.spacing.md,
    bottom: 100,
    gap: theme.spacing.lg,
  },
  actionBtn: {
    alignItems: "center" as const,
    gap: theme.spacing.xs,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.xs,
    fontWeight: "600" as const,
  },
  bottomInfo: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  channelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  channelAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  channelName: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  title: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.sm,
  },
});
