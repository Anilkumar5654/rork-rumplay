import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { createSession, findUserByEmail, verifyPassword } from "../../../../utils/database";
import { sanitizeUser } from "../../../../utils/auth-helpers";

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    const { email, password } = input;
    const user = await findUserByEmail(email.toLowerCase());

    if (!user) {
      return {
        success: false,
        error: "Invalid credentials",
      } as const;
    }

    const valid = verifyPassword(user, password);

    if (!valid) {
      return {
        success: false,
        error: "Invalid credentials",
      } as const;
    }

    const session = await createSession(user.id);

    return {
      success: true,
      token: session.token,
      user: sanitizeUser(user),
    } as const;
  });
