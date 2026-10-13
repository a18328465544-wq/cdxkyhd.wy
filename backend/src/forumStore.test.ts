import assert from "node:assert/strict";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {ForumStore} from "./forumStore.js";

test("forum store persists updates and serializes concurrent writes", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "cdx-forum-store-"));
  context.after(() => rm(directory, {recursive: true, force: true}));
  const store = await ForumStore.open(directory);

  await Promise.all(Array.from({length: 12}, (_, index) => store.update((draft) => {
    draft.users.push({
      id: `user-${index}`,
      username: `player_${index}`,
      passwordHash: `hash-${index}`,
      nickname: `玩家${index}`,
      status: "active",
      createdAt: new Date(index).toISOString(),
      lastSeenAt: new Date(index).toISOString(),
    });
  })));

  const reopened = await ForumStore.open(directory);
  assert.equal(reopened.snapshot().users.length, 12);
  assert.equal(reopened.snapshot().version, 1);
});

test("forum store refuses unsupported data without overwriting it", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "cdx-forum-invalid-"));
  context.after(() => rm(directory, {recursive: true, force: true}));
  const filePath = path.join(directory, "forum.json");
  const original = JSON.stringify({version: 99, posts: []});
  const {writeFile} = await import("node:fs/promises");
  await writeFile(filePath, original, "utf8");

  await assert.rejects(ForumStore.open(directory), /格式不受支持/);
  assert.equal(await readFile(filePath, "utf8"), original);
});

