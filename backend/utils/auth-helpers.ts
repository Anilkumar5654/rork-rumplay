import type { StoredUser } from "./database";

export const sanitizeUser = (user: StoredUser | null) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    phone: user.phone,
    channelId: user.channelId,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    subscriptions: user.subscriptions,
    memberships: user.memberships,
    reactions: user.reactions,
    watchHistory: user.watchHistory,
    watchHistoryDetailed: user.watchHistoryDetailed,
    savedVideos: user.savedVideos,
    likedVideos: user.likedVideos,
    rolesAssignedBy: user.rolesAssignedBy,
  } as const;
};
