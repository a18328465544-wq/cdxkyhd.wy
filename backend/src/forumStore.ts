import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";

export const FORUM_CATEGORIES = [
  {key: "gpu", label: "显卡选购"},
  {key: "build", label: "装机配置"},
  {key: "used", label: "二手检测"},
  {key: "troubleshoot", label: "故障求助"},
  {key: "shop", label: "门店交流"},
] as const;

export type ForumCategoryKey = typeof FORUM_CATEGORIES[number]["key"];
export type ForumContentStatus = "pending" | "approved" | "rejected" | "hidden";
export type ForumReportStatus = "open" | "dismissed" | "actioned";
export type ForumRole = "user" | "admin";

export interface ForumUserRecord {
  id: string;
  phoneHash?: string;
  username?: string;
  passwordHash?: string;
  nickname: string;
  status: "active" | "muted";
  createdAt: string;
  lastSeenAt: string;
}

export interface ForumProductReference {
  id: string;
  name: string;
  category: string;
}

export interface ForumPostRecord {
  id: string;
  title: string;
  body: string;
  category: ForumCategoryKey;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  status: ForumContentStatus;
  attachmentIds: string[];
  product?: ForumProductReference;
}

export interface ForumReplyRecord {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status: ForumContentStatus;
  attachmentIds: string[];
}

export interface ForumReportRecord {
  id: string;
  targetType: "post" | "reply";
  targetId: string;
  reporterId: string;
  reason: string;
  details: string;
  status: ForumReportStatus;
  createdAt: string;
}

export interface ForumAttachmentRecord {
  id: string;
  ownerId: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  createdAt: string;
}

export interface ForumModerationLogRecord {
  id: string;
  actor: string;
  action: string;
  targetType: "post" | "reply" | "report";
  targetId: string;
  note: string;
  createdAt: string;
}

export interface ForumData {
  version: 1;
  users: ForumUserRecord[];
  posts: ForumPostRecord[];
  replies: ForumReplyRecord[];
  reports: ForumReportRecord[];
  attachments: ForumAttachmentRecord[];
  moderationLogs: ForumModerationLogRecord[];
}

function emptyData(): ForumData {
  return {version: 1, users: [], posts: [], replies: [], reports: [], attachments: [], moderationLogs: []};
}

function cloneData(data: ForumData): ForumData {
  return JSON.parse(JSON.stringify(data)) as ForumData;
}

export class ForumStore {
  private data: ForumData;
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(private readonly filePath: string, data: ForumData) {
    this.data = data;
  }

  static async open(directory: string): Promise<ForumStore> {
    await mkdir(directory, {recursive: true});
    const filePath = path.join(directory, "forum.json");
    let data: ForumData;

    try {
      const contents = await readFile(filePath, "utf8");
      const parsed: unknown = JSON.parse(contents);
      if (!parsed || typeof parsed !== "object" || (parsed as {version?: unknown}).version !== 1) {
        throw new Error("论坛数据文件格式不受支持，未覆盖原文件。请先备份并迁移数据。");
      }
      data = parsed as ForumData;
      for (const key of ["users", "posts", "replies", "reports", "attachments", "moderationLogs"] as const) {
        if (!Array.isArray(data[key])) throw new Error(`论坛数据文件缺少 ${key} 集合，未覆盖原文件。`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      data = emptyData();
      const store = new ForumStore(filePath, data);
      await store.persist(data);
      return store;
    }

    return new ForumStore(filePath, data);
  }

  snapshot(): ForumData {
    return cloneData(this.data);
  }

  update<T>(operation: (draft: ForumData) => T | Promise<T>): Promise<T> {
    const task = this.writeQueue.then(async () => {
      const draft = cloneData(this.data);
      const result = await operation(draft);
      await this.persist(draft);
      this.data = draft;
      return result;
    });
    this.writeQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  private async persist(data: ForumData): Promise<void> {
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(data), {encoding: "utf8", mode: 0o600});
    await rename(temporaryPath, this.filePath);
  }
}

