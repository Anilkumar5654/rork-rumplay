import { mkdirSync, existsSync, chmodSync } from "fs";
import path from "path";

const folders = {
  videos: "videos",
  shorts: "shorts",
  thumbnails: "thumbnails",
  profiles: "profiles",
  banners: "banners",
  logs: "logs",
  temp: "temp",
} as const;

export type UploadFolder = keyof typeof folders;

type EnsureResult = {
  absolutePath: string;
  relativePath: string;
  filename: string;
};

const publicRoot = path.join(process.cwd(), "public_html");
const uploadRoot = path.join(publicRoot, "uploads");

const sanitizeFilename = (rawName: string): string => {
  const trimmed = rawName.trim().replace(/\s+/g, "-");
  const cleaned = trimmed.replace(/[^a-zA-Z0-9_.-]/g, "");
  return cleaned.length > 0 ? cleaned : `file-${Date.now()}`;
};

export const ensureUploadDirs = (): void => {
  if (!existsSync(publicRoot)) {
    mkdirSync(publicRoot, { recursive: true });
    chmodSync(publicRoot, 0o755);
  }

  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true });
    chmodSync(uploadRoot, 0o755);
  }

  Object.values(folders).forEach((folderName) => {
    const fullPath = path.join(uploadRoot, folderName);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      chmodSync(fullPath, 0o755);
    }
  });
};

export const resolveUploadPath = (folder: UploadFolder, rawFilename: string): EnsureResult => {
  const safeName = sanitizeFilename(rawFilename);
  const timestamp = Date.now();
  const uniqueName = `${timestamp}-${safeName}`;
  const publicRelativePath = path.join("uploads", folders[folder], uniqueName).replace(/\\/g, "/");
  const absolutePath = path.join(publicRoot, publicRelativePath);
  return {
    absolutePath,
    relativePath: `/${publicRelativePath}`,
    filename: uniqueName,
  };
};
