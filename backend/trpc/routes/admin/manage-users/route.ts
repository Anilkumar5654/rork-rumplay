import { z } from "zod";
import { adminProcedure, superAdminProcedure } from "../../../create-context";
import { deleteUserById, listUsers, updateUser } from "../../../../utils/database";
import type { StoredUser } from "../../../../utils/database";

const sanitizeUser = (user: StoredUser) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  avatar: user.avatar,
  bio: user.bio,
  channelId: user.channelId,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getAllUsersProcedure = adminProcedure
  .input(z.void())
  .query(async ({ ctx }) => {
    const users = await listUsers();

    return {
      success: true,
      users: users.map(sanitizeUser),
      requestedBy: ctx.user?.id,
    } as const;
  });

export const updateUserRoleProcedure = superAdminProcedure
  .input(
    z.object({
      targetUserId: z.string(),
      newRole: z.enum(["user", "creator", "admin", "superadmin"]),
    })
  )
  .mutation(async ({ input, ctx }) => {
    if (ctx.user?.id === input.targetUserId) {
      throw new Error("Super admin cannot change their own role");
    }

    const updated = await updateUser(input.targetUserId, {
      role: input.newRole,
      rolesAssignedBy: ctx.user?.id,
    });

    return {
      success: true,
      user: sanitizeUser(updated),
    } as const;
  });

export const deleteUserProcedure = adminProcedure
  .input(
    z.object({
      targetUserId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    if (ctx.user?.role !== "superadmin" && ctx.user?.id === input.targetUserId) {
      throw new Error("Cannot delete your own account");
    }

    await deleteUserById(input.targetUserId);

    return {
      success: true,
      targetUserId: input.targetUserId,
    } as const;
  });
