import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { findSession, findUserById } from "../utils/database";
import type { StoredUser } from "../utils/database";
import type { UserRole } from "../../types";

const AUTH_HEADER = "authorization";

const normalizeToken = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (value.toLowerCase().startsWith("bearer ")) {
    return value.substring(7).trim();
  }

  return value.trim();
};

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.header(AUTH_HEADER);
  const token = normalizeToken(authHeader ?? null);

  if (!token) {
    return {
      req: opts.req,
      token: null,
      user: null as StoredUser | null,
    };
  }

  const session = await findSession(token);

  if (!session) {
    return {
      req: opts.req,
      token: null,
      user: null as StoredUser | null,
    };
  }

  const user = await findUserById(session.userId);

  return {
    req: opts.req,
    token,
    user: user ?? null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const enforceAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const enforceRole = (roles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient role" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuthenticated);
export const roleProtectedProcedure = (roles: UserRole[]) => protectedProcedure.use(enforceRole(roles));
export const userProcedure = roleProtectedProcedure(["user", "creator", "admin", "superadmin"]);
export const creatorProcedure = roleProtectedProcedure(["creator", "admin", "superadmin"]);
export const adminProcedure = roleProtectedProcedure(["admin", "superadmin"]);
export const superAdminProcedure = roleProtectedProcedure(["superadmin"]);
