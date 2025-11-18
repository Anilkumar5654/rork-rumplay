import { Video, Channel, User, Comment, Monetization } from '../types';

export const defaultMonetization: Monetization = {
  enabled: false,
  enabledAt: null,
  eligibility: {
    minSubscribers: 1000,
    minWatchHours: 4000,
  },
  adsEnabled: false,
  membershipTiers: [],
  estimatedRPM: 3.0,
  earnings: {
    total: 0,
    monthly: 0,
    lastPayout: null,
  },
  analytics: {
    totalViews: 0,
    adImpressions: 0,
    adClicks: 0,
    membershipRevenue: 0,
  },
  pendingReports: 0,
};

export const defaultChannel: Channel = {
  id: '',
  name: 'Unknown Channel',
  avatar: 'https://via.placeholder.com/150',
  banner: 'https://via.placeholder.com/1200x300',
  description: '',
  subscriberCount: 0,
  totalViews: 0,
  totalWatchHours: 0,
  verified: false,
  createdAt: new Date().toISOString(),
  monetization: defaultMonetization,
};

export const defaultVideo: Video = {
  id: '',
  title: 'Untitled Video',
  description: '',
  thumbnail: 'https://via.placeholder.com/1280x720',
  videoUrl: '',
  channelId: '',
  channelName: 'Unknown Channel',
  channelAvatar: 'https://via.placeholder.com/150',
  views: 0,
  likes: 0,
  dislikes: 0,
  uploadDate: new Date().toISOString(),
  duration: 0,
  category: 'General',
  tags: [],
  comments: [],
  isShort: false,
  isLive: false,
};

export const defaultUser: User = {
  id: '',
  username: '',
  displayName: '',
  email: '',
  avatar: 'https://via.placeholder.com/150',
  bio: '',
  phone: null,
  channelId: null,
  role: 'user' as const,
  subscriptions: [],
  memberships: [],
  reactions: [],
  watchHistory: [],
  watchHistoryDetailed: [],
  savedVideos: [],
  likedVideos: [],
  createdAt: new Date().toISOString(),
};

export const defaultComment: Comment = {
  id: '',
  userId: '',
  userName: 'Unknown User',
  userAvatar: 'https://via.placeholder.com/150',
  text: '',
  timestamp: new Date().toISOString(),
  likes: 0,
  replies: [],
};
