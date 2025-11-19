import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getEnvApiRootUrl } from "@/utils/env";

type BackendVideoDetails = {
  id: string;
  user_id: string;
  channel_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  views: number;
  likes: number;
  dislikes: number;
  privacy?: string;
  category?: string;
  tags?: string[] | string | null;
  duration?: number;
  is_short?: number;
  created_at: string;
  updated_at?: string;
  uploader: {
    id: string;
    username: string;
    name?: string | null;
    profile_pic?: string | null;
    channel_id: string;
  };
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_disliked?: boolean;
};

type BackendChannelDetails = {
  id: string;
  user_id: string;
  name: string;
  handle?: string | null;
  avatar?: string | null;
  banner?: string | null;
  description?: string | null;
  subscriber_count: number;
  total_views?: number;
  verified?: number | boolean;
  created_at?: string;
  video_count?: number;
  is_subscribed?: boolean;
};

type BackendCommentUser = {
  username: string;
  name?: string | null;
  profile_pic?: string | null;
};

type BackendComment = {
  id: string;
  video_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user: BackendCommentUser;
};

type BackendRecommendedVideo = {
  id: string;
  title: string;
  video_url?: string;
  thumbnail: string;
  views: number;
  likes?: number;
  duration?: number;
  category?: string;
  created_at?: string;
  uploader?: {
    username?: string;
    name?: string;
    profile_pic?: string;
  };
};

type VideoScreenResponse = {
  success: boolean;
  video?: BackendVideoDetails;
  channel?: BackendChannelDetails;
  comments?: BackendComment[];
  recommended?: BackendRecommendedVideo[];
  error?: string;
  message?: string;
};

type NormalizedVideoDetails = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  views: number;
  likes: number;
  dislikes: number;
  tags: string[];
  duration: number;
  createdAt: string;
  channelId: string;
  uploaderId: string;
  channelName: string;
  channelUsername: string;
  channelAvatar: string;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
};

type NormalizedChannelDetails = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  description: string;
  subscriberCount: number;
  isSubscribed: boolean;
};

type NormalizedComment = {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
};

type NormalizedRecommendedVideo = {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  channelName: string;
  channelUsername: string;
};

type VideoScreenData = {
  video: NormalizedVideoDetails | null;
  channel: NormalizedChannelDetails | null;
  comments: NormalizedComment[];
  related: NormalizedRecommendedVideo[];
};

type MutationActionResponse = {
  success: boolean;
  message?: string;
  likes?: number;
  dislikes?: number;
  subscriber_count?: number;
  comment_id?: string;
  views?: number;
  error?: string;
};

const parseJsonStrict = <T>(input: string): T => {
  try {
    return JSON.parse(input) as T;
  } catch (error) {
    console.error("[useVideoScreenData] parseJsonStrict", error, input.slice(0, 120));
    throw new Error("Invalid server response");
  }
};

const resolveAssetUrl = (value: string | null | undefined, apiRoot: string): string => {
  if (!value || value.length === 0) {
    return "";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  const base = apiRoot.replace("/api", "");
  if (value.startsWith("/")) {
    return `${base}${value}`;
  }
  return `${base}/${value}`;
};

const normalizeTags = (tags: BackendVideoDetails["tags"]): string[] => {
  if (!tags) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags;
  }
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string") as string[];
      }
    } catch (error) {
      console.error("[useVideoScreenData] normalizeTags", error, tags);
    }
    return tags.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
  }
  return [];
};

const mapVideoDetails = (video: BackendVideoDetails, apiRoot: string): NormalizedVideoDetails => {
  return {
    id: video.id,
    title: video.title,
    description: video.description ?? "",
    videoUrl: video.video_url,
    thumbnail: resolveAssetUrl(video.thumbnail, apiRoot),
    views: video.views,
    likes: video.likes,
    dislikes: video.dislikes,
    tags: normalizeTags(video.tags),
    duration: typeof video.duration === "number" ? video.duration : 0,
    createdAt: video.created_at,
    channelId: video.channel_id,
    uploaderId: video.user_id,
    channelName: video.uploader.name ?? video.uploader.username,
    channelUsername: video.uploader.username,
    channelAvatar: resolveAssetUrl(video.uploader.profile_pic ?? "", apiRoot),
    isLiked: Boolean(video.is_liked),
    isDisliked: Boolean(video.is_disliked),
    isSaved: Boolean(video.is_saved),
  };
};

const mapChannelDetails = (channel: BackendChannelDetails, apiRoot: string): NormalizedChannelDetails => {
  return {
    id: channel.id,
    name: channel.name,
    handle: channel.handle ?? "",
    avatar: resolveAssetUrl(channel.avatar ?? "", apiRoot),
    banner: resolveAssetUrl(channel.banner ?? "", apiRoot),
    description: channel.description ?? "",
    subscriberCount: channel.subscriber_count,
    isSubscribed: Boolean(channel.is_subscribed),
  };
};

const mapComment = (comment: BackendComment, apiRoot: string): NormalizedComment => {
  const displayName = comment.user.name && comment.user.name.length > 0 ? comment.user.name : comment.user.username;
  return {
    id: comment.id,
    authorId: comment.user_id,
    authorUsername: comment.user.username,
    authorDisplayName: displayName,
    authorAvatar: resolveAssetUrl(comment.user.profile_pic ?? "", apiRoot),
    text: comment.comment,
    createdAt: comment.created_at,
  };
};

const mapRecommended = (video: BackendRecommendedVideo, apiRoot: string): NormalizedRecommendedVideo => {
  const channelName = video.uploader?.name && video.uploader.name.length > 0 ? video.uploader.name : video.uploader?.username ?? "";
  return {
    id: video.id,
    title: video.title,
    thumbnail: resolveAssetUrl(video.thumbnail, apiRoot),
    views: video.views,
    channelName,
    channelUsername: video.uploader?.username ?? channelName,
  };
};

const buildAuthHeaders = (token: string | null): Record<string, string> => {
  if (!token) {
    return {
      Accept: "application/json",
    };
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
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

export const useVideoScreenData = (videoId: string | null) => {
  const { authToken } = useAuth();
  const apiRoot = getEnvApiRootUrl();
  const queryClient = useQueryClient();

  const videoScreenQuery = useQuery({
    queryKey: ["video_screen", apiRoot, videoId, authToken],
    enabled: Boolean(videoId),
    queryFn: async () => {
      if (!videoId) {
        throw new Error("Missing video id");
      }
      console.log("[useVideoScreenData] fetching all data for video", videoId);
      const response = await fetch(
        `${apiRoot}/video/video_screen.php?action=fetch&video_id=${encodeURIComponent(videoId)}`,
        {
          method: "GET",
          headers: buildAuthHeaders(authToken),
        }
      );
      const raw = await response.text();
      const data = parseJsonStrict<VideoScreenResponse>(raw);
      if (!response.ok || !data.success || !data.video) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useVideoScreenData] fetch failed", message, raw.slice(0, 200));
        throw new Error(message);
      }

      return {
        video: mapVideoDetails(data.video, apiRoot),
        channel: data.channel ? mapChannelDetails(data.channel, apiRoot) : null,
        comments: (data.comments ?? []).map((item) => mapComment(item, apiRoot)),
        recommended: (data.recommended ?? []).map((item) => mapRecommended(item, apiRoot)),
      };
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async (action: "like" | "unlike" | "dislike" | "undislike") => {
      if (!videoId) throw new Error("Missing video");
      if (!authToken) throw new Error("Please login to react to videos");

      console.log("[useVideoScreenData] reaction", action, videoId);
      const response = await fetch(`${apiRoot}/video/video_screen.php?action=${action}`, {
        method: "POST",
        headers: buildJsonHeaders(authToken),
        body: JSON.stringify({ video_id: videoId }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<MutationActionResponse>(raw);
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? data.message ?? "Reaction failed");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video_screen"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (comment: string) => {
      if (!videoId) throw new Error("Missing video");
      if (!authToken) throw new Error("Please login to comment");

      console.log("[useVideoScreenData] adding comment", videoId);
      const response = await fetch(`${apiRoot}/video/video_screen.php?action=comment`, {
        method: "POST",
        headers: buildJsonHeaders(authToken),
        body: JSON.stringify({ video_id: videoId, comment }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<MutationActionResponse>(raw);
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? data.message ?? "Comment failed");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video_screen"] });
    },
  });

  const subscriptionMutation = useMutation({
    mutationFn: async (action: "subscribe" | "unsubscribe") => {
      if (!videoId) throw new Error("Missing video");
      if (!authToken) throw new Error("Please login to manage subscriptions");

      console.log("[useVideoScreenData] subscription", action, videoId);
      const response = await fetch(`${apiRoot}/video/video_screen.php?action=${action}`, {
        method: "POST",
        headers: buildJsonHeaders(authToken),
        body: JSON.stringify({ video_id: videoId }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<MutationActionResponse>(raw);
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? data.message ?? "Subscription failed");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video_screen"] });
    },
  });

  const viewMutation = useMutation({
    mutationFn: async (targetVideoId: string) => {
      console.log("[useVideoScreenData] incrementing view", targetVideoId);
      const response = await fetch(`${apiRoot}/video/video_screen.php?action=increment_view`, {
        method: "POST",
        headers: buildJsonHeaders(authToken ?? null),
        body: JSON.stringify({ video_id: targetVideoId }),
      });
      const raw = await response.text();
      const data = parseJsonStrict<MutationActionResponse>(raw);
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? data.message ?? "View increment failed");
      }
      return data;
    },
  });

  const data: VideoScreenData = useMemo(
    () => ({
      video: videoScreenQuery.data?.video ?? null,
      channel: videoScreenQuery.data?.channel ?? null,
      comments: videoScreenQuery.data?.comments ?? [],
      related: videoScreenQuery.data?.recommended ?? [],
    }),
    [videoScreenQuery.data]
  );

  return {
    data,
    isLoading: videoScreenQuery.isLoading,
    isError: videoScreenQuery.isError,
    error: videoScreenQuery.error,
    refetch: videoScreenQuery.refetch,
    reactionMutation,
    commentMutation,
    subscriptionMutation,
    viewMutation,
  };
};

export type { NormalizedVideoDetails, NormalizedChannelDetails, NormalizedComment, NormalizedRecommendedVideo };
