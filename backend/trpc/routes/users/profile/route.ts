import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { findUserById, updateUser, verifyPassword } from "../../../../utils/database";
import type { StoredUser } from "../../../../utils/database";

const sanitizeUser = (user: StoredUser | null) => {
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
  };
};

export const updateProfileProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string().optional(),
      username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/).optional(),
      displayName: z.string().min(2).max(64).optional(),
      email: z.string().email().optional(),
      bio: z.string().max(280).optional(),
      phone: z
        .string()
        .regex(/^[+\d\s()-]{6,20}$/)
        .max(32)
        .optional(),
      avatar: z.string().nullable().optional(),
      newPassword: z.string().min(8).optional(),
      currentPassword: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const targetUserId = input.userId ?? ctx.user?.id;

    if (!targetUserId) {
      throw new Error("Missing user target");
    }

    const targetUser = await findUserById(targetUserId);

    if (!targetUser) {
      throw new Error("User not found");
    }

    const isSelf = ctx.user?.id === targetUserId;
    const isSuperAdmin = ctx.user?.role === "superadmin";

    if (!isSelf && !isSuperAdmin) {
      throw new Error("You are not allowed to edit this profile");
    }

    if (input.newPassword && !isSuperAdmin) {
      if (!input.currentPassword) {
        throw new Error("Current password required to set a new password");
      }

      const valid = verifyPassword(targetUser, input.currentPassword);

      if (!valid) {
        throw new Error("Current password is incorrect");
      }
    }

    const updated = await updateUser(targetUserId, {
      username: input.username ?? targetUser.username,
      displayName: input.displayName ?? targetUser.displayName,
      email: input.email ?? targetUser.email,
      bio: input.bio ?? targetUser.bio,
      avatar: input.avatar === undefined ? targetUser.avatar : input.avatar,
      phone: input.phone === undefined ? targetUser.phone : input.phone,
      password: input.newPassword,
    });

    return {
      success: true,
      user: sanitizeUser(updated),
    } as const;
  });

export const getUserProfileProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    const targetUserId = input.userId ?? ctx.user?.id;

    if (!targetUserId) {
      throw new Error("Missing user target");
    }

    const user = await findUserById(targetUserId);

    if (!user) {
      throw new Error("User not found");
    }

    if (ctx.user?.id !== targetUserId && ctx.user?.role !== "superadmin") {
      throw new Error("Not allowed to access this profile");
    }

    return {
      success: true,
      user: sanitizeUser(user),
    } as const;
  });
