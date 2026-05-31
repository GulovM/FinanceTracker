import * as cookie from "cookie";
import * as jose from "jose";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { findUserByUnionId } from "../queries/users";
import { env } from "./env";

const JWT_ALG = "HS256";

type SessionPayload = {
  unionId: string;
};

export function emailToUnionId(email: string) {
  return `email:${email.trim().toLowerCase()}`;
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.sessionSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(env.sessionSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const unionId = payload.unionId;
    if (typeof unionId !== "string" || !unionId) {
      return null;
    }
    return { unionId };
  } catch {
    return null;
  }
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please sign in again.");
  }

  return user;
}
