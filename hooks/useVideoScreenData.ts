import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

type BackendVideoDetailsResponse = {
  success: boolean;
  video?: BackendVideoDetails;
  error?: string;
  message?: string;
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

type BackendChannelResponse = {
  success: boolean;
  channel?: BackendChannelDetails;
  error?: string;
  message?: string;
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

type BackendCommentsResponse = {
  success: boolean;
  comments?: BackendComment[];
  error?: string;
  message?: string;
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

type BackendRecommendedResponse = {
  success: boolean;
  videos?: BackendRecommendedVideo[];
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

export const useVideoDetailsQuery = (videoId: string | null, apiRoot: string, token: string | null) => {
  return useQuery({
    queryKey: ["video", "details", apiRoot, videoId, token],
    enabled: Boolean(videoId),
    queryFn: async () => {
      if (!videoId) {
        throw new Error("Missing video id");
      }
      console.log("[useVideoScreenData] fetching video details", videoId);
      const response = await fetch(`${apiRoot}/video/details.php?video_id=${encodeURIComponent(videoId)}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
      });
      const raw = await response.text();
      const data = parseJsonStrict<BackendVideoDetailsResponse>(raw);
      if (!response.ok || !data.success || !data.video) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useVideoScreenData] video details failed", message, raw.slice(0, 200));
        throw new Error(message);
      }
      return mapVideoDetails(data.video, apiRoot);
    },
  });
};

export const useChannelDetailsQuery = (channelId: string | null, apiRoot: string, token: string | null) => {
  return useQuery({
    queryKey: ["channel", "details", apiRoot, channelId, token],
    enabled: Boolean(channelId),
    queryFn: async () => {
      if (!channelId) {
        throw new Error("Missing channel id");
      }
      console.log("[useVideoScreenData] fetching channel details", channelId);
      const response = await fetch(`${apiRoot}/channel/details.php?channel_id=${encodeURIComponent(channelId)}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
      });
      const raw = await response.text();
      const data = parseJsonStrict<BackendChannelResponse>(raw);
      if (!response.ok || !data.success || !data.channel) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useVideoScreenData] channel details failed", message, raw.slice(0, 200));
        throw new Error(message);
      }
      return mapChannelDetails(data.channel, apiRoot);
    },
  });
};

export const useVideoCommentsQuery = (videoId: string | null, apiRoot: string, token: string | null) => {
  return useQuery({
    queryKey: ["video", "comments", apiRoot, videoId, token],
    enabled: Boolean(videoId),
    queryFn: async () => {
      if (!videoId) {
        throw new Error("Missing video id");
      }
      console.log("[useVideoScreenData] fetching comments", videoId);
      const response = await fetch(`${apiRoot}/video/comments.php?video_id=${encodeURIComponent(videoId)}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
      });
      const raw = await response.text();
      const data = parseJsonStrict<BackendCommentsResponse>(raw);
      if (!response.ok || !data.success || !data.comments) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useVideoScreenData] comments failed", message, raw.slice(0, 200));
        throw new Error(message);
      }
      return data.comments.map((item) => mapComment(item, apiRoot));
    },
  });
};

export const useRecommendedVideosQuery = (videoId: string | null, apiRoot: string, token: string | null) => {
  return useQuery({
    queryKey: ["video", "recommended", apiRoot, videoId, token],
    enabled: Boolean(videoId),
    queryFn: async () => {
      if (!videoId) {
        throw new Error("Missing video id");
      }
      console.log("[useVideoScreenData] fetching recommended", videoId);
      const response = await fetch(`${apiRoot}/video/recommended.php?video_id=${encodeURIComponent(videoId)}`, {
        method: "GET",
        headers: buildAuthHeaders(token),
      });
      const raw = await response.text();
      const data = parseJsonStrict<BackendRecommendedResponse>(raw);
      if (!response.ok || !data.success || !data.videos) {
        const message = data.error ?? data.message ?? `Request failed with status ${response.status}`;
        console.error("[useVideoScreenData] recommended failed", message, raw.slice(0, 200));
        throw new Error(message);
      }
      return data.videos.map((item) => mapRecommended(item, apiRoot));
    },
  });
};

export const useVideoScreenData = (videoId: string | null) => {
  const { authToken } = useAuth();
  const apiRoot = getEnvApiRootUrl();
  const videoQuery = useVideoDetailsQuery(videoId, apiRoot, authToken);
  const channelId = videoQuery.data?.channelId ?? null;
  const channelQuery = useChannelDetailsQuery(channelId, apiRoot, authToken);
  const commentsQuery = useVideoCommentsQuery(videoId, apiRoot, authToken);
  const recommendedQuery = useRecommendedVideosQuery(videoId, apiRoot, authToken);

  const data: VideoScreenData = useMemo(() => ({
    video: videoQuery.data ?? null,
    channel: channelQuery.data ?? null,
    comments: commentsQuery.data ?? [],
    related: recommendedQuery.data ?? [],
  }), [videoQuery.data, channelQuery.data, commentsQuery.data, recommendedQuery.data]);

  return {
    data,
    videoQuery,
    channelQuery,
    commentsQuery,
    recommendedQuery,
  };
};

export type { NormalizedVideoDetails, NormalizedChannelDetails, NormalizedComment, NormalizedRecommendedVideo };
