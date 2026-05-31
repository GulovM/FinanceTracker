import * as cookie from "cookie";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { emailToUnionId, signSessionToken } from "./lib/session";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { findUserByUnionId, upsertUser } from "./queries/users";

const loginInput = z.object({
  email: z.string().trim().email(),
});

export const authRouter = createRouter({
  login: publicQuery.input(loginInput).mutation(async ({ ctx, input }) => {
    const email = input.email.toLowerCase();
    const unionId = emailToUnionId(email);
    const name = email.split("@")[0] || email;

    await upsertUser({
      unionId,
      email,
      name,
      lastSignInAt: new Date(),
    });

    const user = await findUserByUnionId(unionId);
    if (!user) {
      throw new Error("Failed to create user session.");
    }

    const token = await signSessionToken({ unionId });
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: Session.maxAgeMs / 1000,
      }),
    );

    return user;
  }),
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
