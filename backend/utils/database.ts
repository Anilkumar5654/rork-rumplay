import crypto from "crypto";
import { RowDataPacket } from "mysql2/promise";
import type { Membership, Subscription, UserReaction, UserRole, WatchHistoryItem, Monetization } from "../../types";
import { getPool } from "./mysqlClient";

export type StoredRole = {
  id: string;
  name: UserRole | (string & {});
  description: string;
  createdAt: string;
};

export type StoredSession = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type StoredChannel = {
  id: string;
  userId: string;
  name: string;
  handle: string;
  avatar: string | null;
  banner: string | null;
  description: string;
  subscriberCount: number;
  totalViews: number;
  totalWatchHours: number;
  verified: boolean;
  monetization: Monetization;
  createdAt: string;
  updatedAt: string;
};

export type StoredUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  avatar: string | null;
  bio: string;
  phone: string | null;
  channelId: string | null;
  role: UserRole | (string & {});
  rolesAssignedBy?: string;
  createdAt: string;
  updatedAt: string;
  subscriptions: Subscription[];
  memberships: Membership[];
  reactions: UserReaction[];
  watchHistory: string[];
  watchHistoryDetailed: WatchHistoryItem[];
  savedVideos: string[];
  likedVideos: string[];
};

type RoleRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  created_at: Date;
};

type SessionRow = RowDataPacket & {
  token: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
};

type ChannelRow = RowDataPacket & {
  id: string;
  user_id: string;
  name: string;
  handle: string;
  avatar: string | null;
  banner: string | null;
  description: string;
  subscriber_count: number;
  total_views: number;
  total_watch_hours: number;
  verified: number;
  monetization: string | Buffer | null;
  created_at: Date;
  updated_at: Date;
};

type UserRow = RowDataPacket & {
  id: string;
  username: string;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: string;
  profile_pic: string | null;
  bio: string | null;
  phone: string | null;
  channel_id: string | null;
  roles_assigned_by: string | null;
  subscriptions: string | Buffer | null;
  memberships: string | Buffer | null;
  reactions: string | Buffer | null;
  watch_history: string | Buffer | null;
  watch_history_detailed: string | Buffer | null;
  saved_videos: string | Buffer | null;
  liked_videos: string | Buffer | null;
  created_at: Date;
  updated_at: Date;
};

const defaultMonetization: Monetization = {
  enabled: false,
  enabledAt: null,
  eligibility: {
    minSubscribers: 1000,
    minWatchHours: 4000,
  },
  adsEnabled: false,
  membershipTiers: [],
  estimatedRPM: 3,
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

const parseJsonField = <T>(value: string | Buffer | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  const input = Buffer.isBuffer(value) ? value.toString("utf-8") : value;
  if (input.length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(input) as T;
  } catch (error) {
    console.error("[DB] JSON parse error", error);
    return fallback;
  }
};

const mapRoleRow = (row: RoleRow): StoredRole => ({
  id: row.id,
  name: row.name as StoredRole["name"],
  description: row.description,
  createdAt: row.created_at.toISOString(),
});

const mapChannelRow = (row: ChannelRow): StoredChannel => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  handle: row.handle,
  avatar: row.avatar,
  banner: row.banner,
  description: row.description,
  subscriberCount: row.subscriber_count,
  totalViews: row.total_views,
  totalWatchHours: row.total_watch_hours,
  verified: row.verified === 1,
  monetization: parseJsonField(row.monetization, defaultMonetization),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const mapUserRow = (row: UserRow): StoredUser => {
  const fallbackAvatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(row.username)}`;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.name,
    passwordHash: row.password_hash,
    salt: row.password_salt,
    avatar: row.profile_pic ?? fallbackAvatar,
    bio: row.bio ?? "",
    phone: row.phone,
    channelId: row.channel_id,
    role: row.role as StoredUser["role"],
    rolesAssignedBy: row.roles_assigned_by ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    subscriptions: parseJsonField<Subscription[]>(row.subscriptions, []),
    memberships: parseJsonField<Membership[]>(row.memberships, []),
    reactions: parseJsonField<UserReaction[]>(row.reactions, []),
    watchHistory: parseJsonField<string[]>(row.watch_history, []),
    watchHistoryDetailed: parseJsonField<WatchHistoryItem[]>(row.watch_history_detailed, []),
    savedVideos: parseJsonField<string[]>(row.saved_videos, []),
    likedVideos: parseJsonField<string[]>(row.liked_videos, []),
  };
};

const ensureDefaultRoles = async () => {
  const pool = getPool();
  const defaults: { name: string; description: string }[] = [
    { name: "user", description: "Default viewer role" },
    { name: "creator", description: "Creator role" },
    { name: "admin", description: "Admin role" },
    { name: "superadmin", description: "Super admin role" },
  ];
  await Promise.all(
    defaults.map(async (item) => {
      await pool.execute(
        "INSERT IGNORE INTO roles (name, description) VALUES (:name, :description)",
        { name: item.name, description: item.description }
      );
    })
  );
};

void ensureDefaultRoles().catch((error) => {
  console.error("[DB] Failed to ensure default roles", error);
});

const hashPassword = (password: string, salt: string) => {
  return crypto.scryptSync(password, salt, 64).toString("hex");
};

export const listRoles = async (): Promise<StoredRole[]> => {
  const pool = getPool();
  const [rows] = await pool.query<RoleRow[]>(
    "SELECT id, name, description, created_at FROM roles ORDER BY created_at ASC"
  );
  return rows.map(mapRoleRow);
};

export const createRole = async (name: string, description: string): Promise<StoredRole> => {
  const pool = getPool();
  const normalized = name.toLowerCase();
  const [existing] = await pool.query<RoleRow[]>(
    "SELECT id, name, description, created_at FROM roles WHERE name = :name LIMIT 1",
    { name: normalized }
  );
  if (existing.length > 0) {
    throw new Error("Role already exists");
  }
  await pool.execute(
    "INSERT INTO roles (name, description) VALUES (:name, :description)",
    { name: normalized, description }
  );
  const [rows] = await pool.query<RoleRow[]>(
    "SELECT id, name, description, created_at FROM roles WHERE name = :name LIMIT 1",
    { name: normalized }
  );
  if (rows.length === 0) {
    throw new Error("Failed to create role");
  }
  return mapRoleRow(rows[0]);
};

export const createUser = async (params: {
  email: string;
  username: string;
  displayName: string;
  password: string;
  role?: UserRole | (string & {});
  avatar?: string | null;
  bio?: string;
  phone?: string | null;
}): Promise<StoredUser> => {
  const pool = getPool();
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(params.password, salt);
  const id = crypto.randomUUID();
  const fallbackAvatar = params.avatar ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(params.username)}`;
  try {
    await pool.execute(
      `INSERT INTO users (
        id,
        username,
        name,
        email,
        password_hash,
        password_salt,
        role,
        profile_pic,
        bio,
        phone,
        channel_id,
        roles_assigned_by,
        subscriptions,
        memberships,
        reactions,
        watch_history,
        watch_history_detailed,
        saved_videos,
        liked_videos
      ) VALUES (
        :id,
        :username,
        :name,
        :email,
        :passwordHash,
        :salt,
        :role,
        :profilePic,
        :bio,
        :phone,
        NULL,
        NULL,
        :subscriptions,
        :memberships,
        :reactions,
        :watchHistory,
        :watchHistoryDetailed,
        :savedVideos,
        :likedVideos
      )`,
      {
        id,
        username: params.username,
        name: params.displayName,
        email: params.email.toLowerCase(),
        passwordHash,
        salt,
        role: params.role ?? "user",
        profilePic: fallbackAvatar,
        bio: params.bio ?? "",
        phone: params.phone ?? null,
        subscriptions: JSON.stringify([]),
        memberships: JSON.stringify([]),
        reactions: JSON.stringify([]),
        watchHistory: JSON.stringify([]),
        watchHistoryDetailed: JSON.stringify([]),
        savedVideos: JSON.stringify([]),
        likedVideos: JSON.stringify([]),
      }
    );
  } catch (error) {
    console.error("[DB] Failed to create user", error);
    throw new Error("Unable to create user");
  }
  const created = await findUserById(id);
  if (!created) {
    throw new Error("User creation failed");
  }
  return created;
};

export const findUserByEmail = async (email: string): Promise<StoredUser | null> => {
  const pool = getPool();
  const [rows] = await pool.query<UserRow[]>(
    "SELECT * FROM users WHERE email = :email LIMIT 1",
    { email: email.toLowerCase() }
  );
  if (rows.length === 0) {
    return null;
  }
  return mapUserRow(rows[0]);
};

export const findUserById = async (id: string): Promise<StoredUser | null> => {
  const pool = getPool();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE id = :id LIMIT 1", { id });
  if (rows.length === 0) {
    return null;
  }
  return mapUserRow(rows[0]);
};

export const verifyPassword = (user: StoredUser, password: string): boolean => {
  const computed = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(user.passwordHash, "hex"));
};

export const createSession = async (userId: string, durationHours = 12): Promise<StoredSession> => {
  const pool = getPool();
  const token = crypto.randomBytes(48).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1000);
  await pool.execute("DELETE FROM sessions WHERE user_id = :userId", { userId });
  await pool.execute(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (:token, :userId, :createdAt, :expiresAt)",
    {
      token,
      userId,
      createdAt,
      expiresAt,
    }
  );
  return {
    token,
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

export const findSession = async (token: string): Promise<StoredSession | null> => {
  const pool = getPool();
  const [rows] = await pool.query<SessionRow[]>(
    "SELECT token, user_id, created_at, expires_at FROM sessions WHERE token = :token LIMIT 1",
    { token }
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  if (new Date(row.expires_at) <= new Date()) {
    await pool.execute("DELETE FROM sessions WHERE token = :token", { token });
    return null;
  }
  return {
    token: row.token,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
};

export const revokeSession = async (token: string): Promise<void> => {
  const pool = getPool();
  await pool.execute("DELETE FROM sessions WHERE token = :token", { token });
};

export const updateUser = async (
  userId: string,
  updates: Partial<Omit<StoredUser, "id" | "createdAt" | "passwordHash" | "salt">> & { password?: string; role?: StoredUser["role"] }
): Promise<StoredUser> => {
  const pool = getPool();
  const existing = await findUserById(userId);
  if (!existing) {
    throw new Error("User not found");
  }
  if (updates.email && updates.email.toLowerCase() !== existing.email) {
    const [emailRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1",
      { email: updates.email.toLowerCase(), id: userId }
    );
    if (emailRows.length > 0) {
      throw new Error("Email already exists");
    }
  }
  if (updates.username && updates.username !== existing.username) {
    const [usernameRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = :username AND id <> :id LIMIT 1",
      { username: updates.username, id: userId }
    );
    if (usernameRows.length > 0) {
      throw new Error("Username already exists");
    }
  }
  let passwordHash = existing.passwordHash;
  let salt = existing.salt;
  if (updates.password) {
    salt = crypto.randomBytes(16).toString("hex");
    passwordHash = hashPassword(updates.password, salt);
  }
  const avatar = updates.avatar ?? existing.avatar;
  const bio = updates.bio ?? existing.bio;
  const phone = updates.phone ?? existing.phone;
  const role = updates.role ?? existing.role;
  const subscriptions = JSON.stringify(updates.subscriptions ?? existing.subscriptions);
  const memberships = JSON.stringify(updates.memberships ?? existing.memberships);
  const reactions = JSON.stringify(updates.reactions ?? existing.reactions);
  const watchHistory = JSON.stringify(updates.watchHistory ?? existing.watchHistory);
  const watchHistoryDetailed = JSON.stringify(updates.watchHistoryDetailed ?? existing.watchHistoryDetailed);
  const savedVideos = JSON.stringify(updates.savedVideos ?? existing.savedVideos);
  const likedVideos = JSON.stringify(updates.likedVideos ?? existing.likedVideos);
  await pool.execute(
    `UPDATE users SET
      username = :username,
      name = :name,
      email = :email,
      profile_pic = :avatar,
      bio = :bio,
      phone = :phone,
      channel_id = :channelId,
      roles_assigned_by = :rolesAssignedBy,
      role = :role,
      password_hash = :passwordHash,
      password_salt = :salt,
      subscriptions = :subscriptions,
      memberships = :memberships,
      reactions = :reactions,
      watch_history = :watchHistory,
      watch_history_detailed = :watchHistoryDetailed,
      saved_videos = :savedVideos,
      liked_videos = :likedVideos,
      updated_at = NOW()
    WHERE id = :id`,
    {
      id: userId,
      username: updates.username ?? existing.username,
      name: updates.displayName ?? existing.displayName,
      email: (updates.email ?? existing.email).toLowerCase(),
      avatar,
      bio,
      phone,
      channelId: updates.channelId ?? existing.channelId,
      rolesAssignedBy: updates.rolesAssignedBy ?? existing.rolesAssignedBy ?? null,
      role,
      passwordHash,
      salt,
      subscriptions,
      memberships,
      reactions,
      watchHistory,
      watchHistoryDetailed,
      savedVideos,
      likedVideos,
    }
  );
  const updated = await findUserById(userId);
  if (!updated) {
    throw new Error("Failed to update user");
  }
  return updated;
};

export const upsertChannel = async (
  userId: string,
  payload: Omit<StoredChannel, "id" | "createdAt" | "updatedAt" | "userId"> & { id?: string }
): Promise<StoredChannel> => {
  const pool = getPool();
  if (payload.handle) {
    const [handleRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM channels WHERE handle = :handle AND user_id <> :userId",
      { handle: payload.handle, userId }
    );
    if (handleRows.length > 0) {
      throw new Error("Channel handle already exists");
    }
  }
  const monetization = JSON.stringify(payload.monetization ?? defaultMonetization);
  if (payload.id) {
    const [existingRows] = await pool.query<ChannelRow[]>(
      "SELECT * FROM channels WHERE id = :id AND user_id = :userId LIMIT 1",
      { id: payload.id, userId }
    );
    if (existingRows.length === 0) {
      throw new Error("Channel not found");
    }
    await pool.execute(
      `UPDATE channels SET
        name = :name,
        handle = :handle,
        avatar = :avatar,
        banner = :banner,
        description = :description,
        subscriber_count = :subscriberCount,
        total_views = :totalViews,
        total_watch_hours = :totalWatchHours,
        verified = :verified,
        monetization = :monetization,
        updated_at = NOW()
      WHERE id = :id`,
      {
        id: payload.id,
        name: payload.name,
        handle: payload.handle,
        avatar: payload.avatar,
        banner: payload.banner,
        description: payload.description,
        subscriberCount: payload.subscriberCount,
        totalViews: payload.totalViews,
        totalWatchHours: payload.totalWatchHours,
        verified: payload.verified ? 1 : 0,
        monetization,
      }
    );
    const [rows] = await pool.query<ChannelRow[]>(
      "SELECT * FROM channels WHERE id = :id LIMIT 1",
      { id: payload.id }
    );
    if (rows.length === 0) {
      throw new Error("Failed to update channel");
    }
    return mapChannelRow(rows[0]);
  }
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO channels (
      id,
      user_id,
      name,
      handle,
      avatar,
      banner,
      description,
      subscriber_count,
      total_views,
      total_watch_hours,
      verified,
      monetization
    ) VALUES (
      :id,
      :userId,
      :name,
      :handle,
      :avatar,
      :banner,
      :description,
      :subscriberCount,
      :totalViews,
      :totalWatchHours,
      :verified,
      :monetization
    )`,
    {
      id,
      userId,
      name: payload.name,
      handle: payload.handle,
      avatar: payload.avatar,
      banner: payload.banner,
      description: payload.description,
      subscriberCount: payload.subscriberCount,
      totalViews: payload.totalViews,
      totalWatchHours: payload.totalWatchHours,
      verified: payload.verified ? 1 : 0,
      monetization,
    }
  );
  await pool.execute("UPDATE users SET channel_id = :channelId WHERE id = :userId", { channelId: id, userId });
  const [rows] = await pool.query<ChannelRow[]>(
    "SELECT * FROM channels WHERE id = :id LIMIT 1",
    { id }
  );
  if (rows.length === 0) {
    throw new Error("Failed to create channel");
  }
  return mapChannelRow(rows[0]);
};

export const listUsers = async (): Promise<StoredUser[]> => {
  const pool = getPool();
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(mapUserRow);
};

export const deleteUserById = async (userId: string): Promise<void> => {
  const pool = getPool();
  const existing = await findUserById(userId);
  if (!existing) {
    throw new Error("User not found");
  }
  if ((existing.role as string).toLowerCase() === "superadmin") {
    throw new Error("Cannot delete super admin");
  }
  await pool.execute("DELETE FROM users WHERE id = :id", { id: userId });
};

type VideoInsertPayload = {
  userId: string;
  channelId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  privacy: "public" | "private" | "unlisted" | "scheduled";
  category: string;
  tags: string[];
  isShort: boolean;
  duration?: number;
  scheduledDate?: string | null;
};

type ShortInsertPayload = {
  userId: string;
  channelId: string;
  shortUrl: string;
  thumbnail: string;
  description: string;
};

export const findChannelByUserId = async (userId: string): Promise<StoredChannel | null> => {
  const pool = getPool();
  const [rows] = await pool.query<ChannelRow[]>(
    "SELECT * FROM channels WHERE user_id = :userId LIMIT 1",
    { userId }
  );
  if (rows.length === 0) {
    return null;
  }
  return mapChannelRow(rows[0]);
};

export const ensureChannelForUser = async (user: StoredUser): Promise<StoredChannel> => {
  const existing = await findChannelByUserId(user.id);
  if (existing) {
    return existing;
  }
  const pool = getPool();
  const monetization = JSON.stringify(defaultMonetization);
  const displayName = user.displayName ?? user.username;
  const baseHandle = user.username.startsWith("@") ? user.username : `@${user.username}`;
  let attempt = 0;
  while (attempt < 10) {
    const handleCandidate = attempt === 0 ? baseHandle : `${baseHandle}${attempt}`;
    const id = crypto.randomUUID();
    try {
      await pool.execute(
        `INSERT INTO channels (
          id,
          user_id,
          name,
          handle,
          avatar,
          banner,
          description,
          subscriber_count,
          total_views,
          total_watch_hours,
          verified,
          monetization
        ) VALUES (
          :id,
          :userId,
          :name,
          :handle,
          :avatar,
          :banner,
          :description,
          0,
          0,
          0,
          0,
          :monetization
        )`,
        {
          id,
          userId: user.id,
          name: `${displayName}'s Channel`,
          handle: handleCandidate,
          avatar: user.avatar,
          banner: null,
          description: user.bio && user.bio.length > 0 ? user.bio : "Welcome to my channel",
          monetization,
        }
      );
      await pool.execute("UPDATE users SET channel_id = :channelId WHERE id = :userId", {
        channelId: id,
        userId: user.id,
      });
      const [rows] = await pool.query<ChannelRow[]>(
        "SELECT * FROM channels WHERE id = :id LIMIT 1",
        { id }
      );
      if (rows.length === 0) {
        throw new Error("Channel creation failed");
      }
      return mapChannelRow(rows[0]);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "ER_DUP_ENTRY"
      ) {
        attempt += 1;
        continue;
      }
      console.error("[DB] ensureChannelForUser error", error);
      throw error instanceof Error ? error : new Error("Unable to create channel");
    }
  }
  throw new Error("Unable to allocate unique channel handle");
};

export const insertVideoRecord = async (payload: VideoInsertPayload): Promise<string> => {
  const pool = getPool();
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO videos (
      id,
      user_id,
      channel_id,
      title,
      description,
      video_url,
      thumbnail,
      privacy,
      category,
      tags,
      is_short,
      duration,
      scheduled_date
    ) VALUES (
      :id,
      :userId,
      :channelId,
      :title,
      :description,
      :videoUrl,
      :thumbnail,
      :privacy,
      :category,
      :tags,
      :isShort,
      :duration,
      :scheduledDate
    )`,
    {
      id,
      userId: payload.userId,
      channelId: payload.channelId,
      title: payload.title,
      description: payload.description,
      videoUrl: payload.videoUrl,
      thumbnail: payload.thumbnail,
      privacy: payload.privacy,
      category: payload.category,
      tags: JSON.stringify(payload.tags),
      isShort: payload.isShort ? 1 : 0,
      duration: payload.duration ?? 0,
      scheduledDate: payload.scheduledDate ?? null,
    }
  );
  return id;
};

export const insertShortRecord = async (payload: ShortInsertPayload): Promise<string> => {
  const pool = getPool();
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO shorts (
      id,
      user_id,
      channel_id,
      short_url,
      thumbnail,
      description
    ) VALUES (
      :id,
      :userId,
      :channelId,
      :shortUrl,
      :thumbnail,
      :description
    )`,
    {
      id,
      userId: payload.userId,
      channelId: payload.channelId,
      shortUrl: payload.shortUrl,
      thumbnail: payload.thumbnail,
      description: payload.description,
    }
  );
  return id;
};
