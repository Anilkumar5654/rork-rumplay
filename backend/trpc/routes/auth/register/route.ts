import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { createSession, createUser } from "../../../../utils/database";
import { sanitizeUser } from "../../../../utils/auth-helpers";
import { SUPER_ADMIN_EMAIL } from "../../../../constants/auth";

export const registerProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
      displayName: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const role = input.email.toLowerCase() === SUPER_ADMIN_EMAIL ? "superadmin" : "user";
      const user = await createUser({
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        password: input.password,
        role,
      });

      const session = await createSession(user.id);

      return {
        success: true,
        token: session.token,
        user: sanitizeUser(user),
      } as const;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to register",
      } as const;
    }
  });
