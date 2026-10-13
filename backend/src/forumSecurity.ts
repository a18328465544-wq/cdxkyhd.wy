import {createHmac, createHash, randomBytes, scrypt, timingSafeEqual} from "node:crypto";
import {isIP} from "node:net";
import type {Request, Response} from "express";
import type {ForumRole} from "./forumStore.js";

const SESSION_COOKIES: Record<ForumRole, string> = {
  user: "forum_session",
  admin: "forum_admin_session",
};
export const FORUM_SESSION_SECONDS = 60 * 60 * 24 * 7;

export interface ForumSessionClaims {
  sub: string;
  role: ForumRole;
  exp: number;
}

export function forumClientAddress(req: Request): string {
  const remote = req.socket.remoteAddress || "unknown";
  const isLocalProxy = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
  const realIp = req.get("x-real-ip");
  return isLocalProxy && realIp && isIP(realIp) ? realIp : remote;
}

export function normalizeForumUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const username = value.trim().toLowerCase();
  return /^[a-z0-9_]{4,20}$/.test(username) ? username : null;
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function validForumPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 10 && value.length <= 128;
}

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, {N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024}, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashForumPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derivePassword(password, salt);
  return `scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyForumPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelism, saltHex, keyHex, extra] = stored.split("$");
  if (algorithm !== "scrypt" || cost !== "16384" || blockSize !== "8" || parallelism !== "1" ||
      !/^[a-f0-9]{32}$/.test(saltHex || "") || !/^[a-f0-9]{128}$/.test(keyHex || "") || extra !== undefined) return false;
  const key = await derivePassword(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(key, Buffer.from(keyHex, "hex"));
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createForumSessionToken(claims: ForumSessionClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readForumSessionToken(token: string | undefined, secret: string, now = Date.now()): ForumSessionClaims | null {
  if (!token || !secret) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined || !constantTimeEqual(signature, sign(payload, secret))) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ForumSessionClaims;
    if (
      typeof claims.sub !== "string" ||
      (claims.role !== "user" && claims.role !== "admin") ||
      !Number.isInteger(claims.exp) || claims.exp <= Math.floor(now / 1000)
    ) return null;
    return claims;
  } catch {
    return null;
  }
}

function parseCookieHeader(header = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const segment of header.split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 1) continue;
    const name = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (name) result.set(name, value);
  }
  return result;
}

export function getForumSession(req: Request, secret: string, role: ForumRole = "user"): ForumSessionClaims | null {
  const cookies = parseCookieHeader(req.headers.cookie);
  return readForumSessionToken(cookies.get(SESSION_COOKIES[role]), secret);
}

export function setForumSession(res: Response, claims: ForumSessionClaims, secret: string, secure: boolean): void {
  const parts = [
    `${SESSION_COOKIES[claims.role]}=${createForumSessionToken(claims, secret)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${FORUM_SESSION_SECONDS}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearForumSession(res: Response, secure: boolean, role: ForumRole = "user"): void {
  const parts = [`${SESSION_COOKIES[role]}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export class InMemoryRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  consume(key: string, limit: number, windowMs: number, now = Date.now()): {allowed: boolean; retryAfterMs: number} {
    const active = (this.attempts.get(key) || []).filter((time) => now - time < windowMs);
    if (active.length >= limit) {
      this.attempts.set(key, active);
      return {allowed: false, retryAfterMs: Math.max(1, windowMs - (now - active[0]))};
    }
    active.push(now);
    this.attempts.set(key, active);
    if (this.attempts.size > 5000) {
      for (const [storedKey, times] of this.attempts) {
        if (times.every((time) => now - time >= windowMs)) this.attempts.delete(storedKey);
      }
    }
    return {allowed: true, retryAfterMs: 0};
  }
}

