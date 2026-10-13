import assert from "node:assert/strict";
import test from "node:test";
import type {Request} from "express";
import {
  constantTimeEqual,
  createForumSessionToken,
  forumClientAddress,
  hashForumPassword,
  InMemoryRateLimiter,
  normalizeForumUsername,
  readForumSessionToken,
  validForumPassword,
  verifyForumPassword,
} from "./forumSecurity.js";

test("uses the proxy client IP only for loopback connections", () => {
  const request = (remoteAddress: string, realIp: string) => ({
    socket: {remoteAddress},
    get: () => realIp,
  }) as unknown as Request;
  assert.equal(forumClientAddress(request("127.0.0.1", "203.0.113.7")), "203.0.113.7");
  assert.equal(forumClientAddress(request("203.0.113.9", "203.0.113.7")), "203.0.113.9");
  assert.equal(forumClientAddress(request("127.0.0.1", "not-an-ip")), "127.0.0.1");
});

test("normalizes forum usernames and validates passwords", () => {
  assert.equal(normalizeForumUsername(" GPU_Fan "), "gpu_fan");
  assert.equal(normalizeForumUsername("ab"), null);
  assert.equal(normalizeForumUsername("玩家账号"), null);
  assert.equal(validForumPassword("secure-pass-123"), true);
  assert.equal(validForumPassword("too-short"), false);
});

test("session tokens are signed, role checked, and expire", () => {
  const secret = "forum-session-secret-at-least-32-bytes";
  const now = 1_800_000_000_000;
  const token = createForumSessionToken({sub: "user-1", role: "user", exp: Math.floor(now / 1000) + 60}, secret);
  assert.deepEqual(readForumSessionToken(token, secret, now), {sub: "user-1", role: "user", exp: Math.floor(now / 1000) + 60});
  assert.equal(readForumSessionToken(token, "different-secret-at-least-32-bytes", now), null);
  assert.equal(readForumSessionToken(token, secret, now + 61_000), null);
  assert.equal(readForumSessionToken(`${token.slice(0, -1)}x`, secret, now), null);
});

test("passwords use salted scrypt hashes and reject malformed values", async () => {
  const first = await hashForumPassword("secure-pass-123");
  const second = await hashForumPassword("secure-pass-123");
  assert.notEqual(first, second);
  assert.equal(await verifyForumPassword("secure-pass-123", first), true);
  assert.equal(await verifyForumPassword("wrong-pass-123", first), false);
  assert.equal(await verifyForumPassword("secure-pass-123", "invalid"), false);
  assert.equal(first.includes("secure-pass-123"), false);
  assert.equal(constantTimeEqual("same", "same"), true);
  assert.equal(constantTimeEqual("same", "else"), false);
});

test("rate limiter enforces a rolling window", () => {
  const limiter = new InMemoryRateLimiter();
  assert.equal(limiter.consume("user", 2, 1_000, 10).allowed, true);
  assert.equal(limiter.consume("user", 2, 1_000, 20).allowed, true);
  const rejected = limiter.consume("user", 2, 1_000, 30);
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.retryAfterMs, 980);
  assert.equal(limiter.consume("user", 2, 1_000, 1_011).allowed, true);
});

