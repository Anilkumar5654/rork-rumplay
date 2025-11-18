import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Video, Channel, User, Settings, Playlist, Report, UserReaction, Subscription, WatchHistoryItem } from '../types';
import { defaultUser, defaultMonetization } from '../utils/defaults';
import { mockVideos, mockChannels, mockUsers, mockPlaylists } from '../mocks/data';

const STORAGE_KEYS = {
  VIDEOS: 'playtube_videos',
  CHANNELS: 'playtube_channels',
  USERS: 'playtube_users',
  CURRENT_USER: 'playtube_current_user',
  SETTINGS: 'playtube_settings',
  PLAYLISTS: 'playtube_playlists',
  REPORTS: 'playtube_reports',
};

const defaultSettings: Settings = {
  theme: 'dark',
  accentColor: '#FF2D95',
  autoPlayNext: true,
  autoPlayOnWifiOnly: false,
  pipEnabled: true,
  autoPlayOnOpen: true,
  miniPlayerEnabled: true,
  backgroundAudioEnabled: false,
  notificationsEnabled: true,
  videoQuality: 'auto',
  experimentalFeatures: false,
};

export const [AppStateProvider, useAppState] = createContextHook(() => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        storedVideos,
        storedChannels,
        storedUsers,
        storedCurrentUser,
        storedSettings,
        storedPlaylists,
        storedReports,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VIDEOS),
        AsyncStorage.getItem(STORAGE_KEYS.CHANNELS),
        AsyncStorage.getItem(STORAGE_KEYS.USERS),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.REPORTS),
      ]);

      const parsedVideos = storedVideos ? JSON.parse(storedVideos) : mockVideos;
      const parsedChannels = storedChannels ? JSON.parse(storedChannels) : mockChannels;
      const parsedUsers = storedUsers ? JSON.parse(storedUsers) : mockUsers;
      const parsedCurrentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : mockUsers[0];
      const parsedSettings = storedSettings ? JSON.parse(storedSettings) : defaultSettings;
      const parsedPlaylists = storedPlaylists ? JSON.parse(storedPlaylists) : mockPlaylists;
      const parsedReports = storedReports ? JSON.parse(storedReports) : [];

      const migratedChannels = parsedChannels.map((ch: Channel) => ({
        ...ch,
        monetization: ch.monetization || defaultMonetization,
      }));

      const migratedVideos = parsedVideos.map((v: Video) => ({
        ...v,
        comments: v.comments || [],
      }));

      const migratedSettings = {
        ...defaultSettings,
        ...parsedSettings,
      };

      const migratedUsers = parsedUsers.map((u: User) => ({
        ...u,
        role: u.role || 'user',
        phone: u.phone ?? null,
        watchHistoryDetailed: u.watchHistoryDetailed || [],
      }));

      const migratedCurrentUser = {
        ...parsedCurrentUser,
        role: parsedCurrentUser.role || 'user',
        phone: parsedCurrentUser.phone ?? null,
        watchHistoryDetailed: parsedCurrentUser.watchHistoryDetailed || [],
      };

      setVideos(migratedVideos);
      setChannels(migratedChannels);
      setUsers(migratedUsers);
      setCurrentUser(migratedCurrentUser);
      setSettings(migratedSettings);
      setPlaylists(parsedPlaylists);
      setReports(parsedReports);
      setIsLoading(false);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(migratedVideos)),
        AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(migratedChannels)),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setVideos(mockVideos);
      setChannels(mockChannels);
      setUsers(mockUsers);
      setCurrentUser(mockUsers[0]);
      setSettings(defaultSettings);
      setPlaylists(mockPlaylists);
      setReports([]);
      setIsLoading(false);
    }
  };

  const saveVideos = useCallback(async (newVideos: Video[]) => {
    setVideos(newVideos);
    await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(newVideos));
  }, []);

  const saveChannels = useCallback(async (newChannels: Channel[]) => {
    setChannels(newChannels);
    await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(newChannels));
  }, []);

  const saveCurrentUser = useCallback(async (user: User) => {
    setCurrentUser(user);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }, []);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, []);

  const savePlaylists = useCallback(async (newPlaylists: Playlist[]) => {
    setPlaylists(newPlaylists);
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(newPlaylists));
  }, []);

  const getVideoById = useCallback((id: string): Video | undefined => {
    return videos.find(v => v.id === id);
  }, [videos]);

  const getChannelById = useCallback((id: string): Channel | undefined => {
    return channels.find(ch => ch.id === id);
  }, [channels]);

  const updateVideo = useCallback(async (videoId: string, updates: Partial<Video>) => {
    const updatedVideos = videos.map(v => v.id === videoId ? { ...v, ...updates } : v);
    await saveVideos(updatedVideos);
  }, [videos, saveVideos]);

  const updateChannel = useCallback(async (channelId: string, updates: Partial<Channel>) => {
    const updatedChannels = channels.map(ch => ch.id === channelId ? { ...ch, ...updates } : ch);
    await saveChannels(updatedChannels);
  }, [channels, saveChannels]);

  const addVideo = useCallback(async (video: Video) => {
    const updatedVideos = [video, ...videos];
    await saveVideos(updatedVideos);
  }, [videos, saveVideos]);

  const deleteVideo = useCallback(async (videoId: string) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    await saveVideos(updatedVideos);
  }, [videos, saveVideos]);

  const toggleSubscription = useCallback(async (channelId: string) => {
    const isSubscribed = currentUser.subscriptions.some(sub => sub.channelId === channelId);
    
    let updatedSubscriptions: Subscription[];
    let subscriberDelta = 0;

    if (isSubscribed) {
      updatedSubscriptions = currentUser.subscriptions.filter(sub => sub.channelId !== channelId);
      subscriberDelta = -1;
    } else {
      updatedSubscriptions = [
        ...currentUser.subscriptions,
        {
          channelId,
          subscribedAt: new Date().toISOString(),
          notifications: true,
        },
      ];
      subscriberDelta = 1;
    }

    const updatedUser = { ...currentUser, subscriptions: updatedSubscriptions };
    await saveCurrentUser(updatedUser);

    const channel = channels.find(ch => ch.id === channelId);
    if (channel) {
      await updateChannel(channelId, {
        subscriberCount: Math.max(0, channel.subscriberCount + subscriberDelta),
      });
    }
  }, [currentUser, channels, saveCurrentUser, updateChannel]);

  const toggleVideoReaction = useCallback(async (videoId: string, type: 'like' | 'dislike') => {
    const existingReaction = currentUser.reactions.find(r => r.videoId === videoId);
    let updatedReactions: UserReaction[];
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (existingReaction) {
      if (existingReaction.type === type) {
        updatedReactions = currentUser.reactions.filter(r => r.videoId !== videoId);
        if (type === 'like') {
          likeDelta = -1;
          const updatedLiked = currentUser.likedVideos.filter(id => id !== videoId);
          await saveCurrentUser({ ...currentUser, reactions: updatedReactions, likedVideos: updatedLiked });
        } else {
          dislikeDelta = -1;
          await saveCurrentUser({ ...currentUser, reactions: updatedReactions });
        }
      } else {
        updatedReactions = currentUser.reactions.map(r =>
          r.videoId === videoId ? { ...r, type, timestamp: new Date().toISOString() } : r
        );
        if (type === 'like') {
          likeDelta = 1;
          dislikeDelta = -1;
          const updatedLiked = [...currentUser.likedVideos, videoId];
          await saveCurrentUser({ ...currentUser, reactions: updatedReactions, likedVideos: updatedLiked });
        } else {
          likeDelta = -1;
          dislikeDelta = 1;
          const updatedLiked = currentUser.likedVideos.filter(id => id !== videoId);
          await saveCurrentUser({ ...currentUser, reactions: updatedReactions, likedVideos: updatedLiked });
        }
      }
    } else {
      updatedReactions = [
        ...currentUser.reactions,
        { videoId, type, timestamp: new Date().toISOString() },
      ];
      if (type === 'like') {
        likeDelta = 1;
        const updatedLiked = [...currentUser.likedVideos, videoId];
        await saveCurrentUser({ ...currentUser, reactions: updatedReactions, likedVideos: updatedLiked });
      } else {
        dislikeDelta = 1;
        await saveCurrentUser({ ...currentUser, reactions: updatedReactions });
      }
    }

    const video = videos.find(v => v.id === videoId);
    if (video) {
      await updateVideo(videoId, {
        likes: Math.max(0, video.likes + likeDelta),
        dislikes: Math.max(0, video.dislikes + dislikeDelta),
      });
    }
  }, [currentUser, videos, saveCurrentUser, updateVideo]);

  const addToWatchHistory = useCallback(async (videoId: string, position?: number, duration?: number) => {
    const updatedSimpleHistory = currentUser.watchHistory.includes(videoId)
      ? currentUser.watchHistory
      : [videoId, ...currentUser.watchHistory].slice(0, 100);

    const existingIndex = currentUser.watchHistoryDetailed.findIndex(item => item.videoId === videoId);
    let updatedDetailedHistory = [...currentUser.watchHistoryDetailed];

    const historyItem: WatchHistoryItem = {
      videoId,
      lastWatchedAt: new Date().toISOString(),
      position: position || 0,
      duration: duration || 0,
    };

    if (existingIndex >= 0) {
      updatedDetailedHistory[existingIndex] = historyItem;
    } else {
      updatedDetailedHistory = [historyItem, ...updatedDetailedHistory].slice(0, 100);
    }

    await saveCurrentUser({
      ...currentUser,
      watchHistory: updatedSimpleHistory,
      watchHistoryDetailed: updatedDetailedHistory,
    });
  }, [currentUser, saveCurrentUser]);

  const getWatchPosition = useCallback((videoId: string): number => {
    const item = currentUser.watchHistoryDetailed.find(h => h.videoId === videoId);
    return item?.position || 0;
  }, [currentUser]);

  const toggleSaveVideo = useCallback(async (videoId: string) => {
    const isSaved = currentUser.savedVideos.includes(videoId);
    const updatedSaved = isSaved
      ? currentUser.savedVideos.filter(id => id !== videoId)
      : [...currentUser.savedVideos, videoId];
    await saveCurrentUser({ ...currentUser, savedVideos: updatedSaved });
  }, [currentUser, saveCurrentUser]);

  const addReport = useCallback(async (report: Report) => {
    const updatedReports = [...reports, report];
    setReports(updatedReports);
    await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));

    const video = videos.find(v => v.id === report.videoId);
    if (video) {
      const channel = channels.find(ch => ch.id === video.channelId);
      if (channel?.monetization) {
        await updateChannel(channel.id, {
          monetization: {
            ...channel.monetization,
            pendingReports: channel.monetization.pendingReports + 1,
          },
        });
      }
    }
  }, [reports, videos, channels, updateChannel]);

  const isChannelNameUnique = useCallback((name: string, excludeChannelId?: string): boolean => {
    return !channels.some(ch => 
      ch.name.toLowerCase() === name.toLowerCase() && ch.id !== excludeChannelId
    );
  }, [channels]);

  const isUsernameUnique = useCallback((username: string, excludeUserId?: string): boolean => {
    return !users.some(u => 
      u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeUserId
    );
  }, [users]);

  const value = useMemo(() => ({
    videos,
    channels,
    users,
    currentUser,
    settings,
    playlists,
    reports,
    isLoading,
    getVideoById,
    getChannelById,
    updateVideo,
    updateChannel,
    addVideo,
    deleteVideo,
    toggleSubscription,
    toggleVideoReaction,
    addToWatchHistory,
    toggleSaveVideo,
    saveCurrentUser,
    saveSettings,
    savePlaylists,
    addReport,
    getWatchPosition,
    isChannelNameUnique,
    isUsernameUnique,
  }), [
    videos,
    channels,
    users,
    currentUser,
    settings,
    playlists,
    reports,
    isLoading,
    getVideoById,
    getChannelById,
    updateVideo,
    updateChannel,
    addVideo,
    deleteVideo,
    toggleSubscription,
    toggleVideoReaction,
    addToWatchHistory,
    toggleSaveVideo,
    saveCurrentUser,
    saveSettings,
    savePlaylists,
    addReport,
    getWatchPosition,
    isChannelNameUnique,
    isUsernameUnique,
  ]);

  return value;
});
