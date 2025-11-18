import { Client as FTPClient } from "basic-ftp";
import { Readable } from "stream";

type UploadResult = {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
};

const getFTPConfig = () => {
  const host = process.env.HOSTINGER_FTP_HOST;
  const user = process.env.HOSTINGER_FTP_USER;
  const password = process.env.HOSTINGER_FTP_PASSWORD;
  const port = process.env.HOSTINGER_FTP_PORT;
  const uploadsPath = process.env.HOSTINGER_UPLOADS_PATH ?? "/public_html/uploads";
  const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "https://moviedbr.com";

  if (!host || !user || !password) {
    const missing = [];
    if (!host) missing.push("HOSTINGER_FTP_HOST");
    if (!user) missing.push("HOSTINGER_FTP_USER");
    if (!password) missing.push("HOSTINGER_FTP_PASSWORD");
    throw new Error(`Hostinger FTP configuration incomplete. Missing: ${missing.join(", ")}. Please configure these in your env file.`);
  }

  return {
    host,
    user,
    password,
    port: port ? Number(port) : 21,
    uploadsPath,
    publicBaseUrl,
  };
};

export const uploadToHostinger = async (
  buffer: Buffer,
  folder: "videos" | "shorts" | "thumbnails" | "profiles" | "banners",
  filename: string
): Promise<UploadResult> => {
  const client = new FTPClient();
  client.ftp.verbose = false;

  try {
    const config = getFTPConfig();

    console.log("[HostingerUpload] Connecting to FTP server:", config.host);
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false,
    });

    const remotePath = `${config.uploadsPath}/${folder}`;
    const remoteFilePath = `${remotePath}/${filename}`;

    console.log("[HostingerUpload] Ensuring directory exists:", remotePath);
    try {
      await client.ensureDir(remotePath);
    } catch (error) {
      console.warn("[HostingerUpload] Directory may already exist or creation failed:", error);
    }

    console.log("[HostingerUpload] Uploading file:", remoteFilePath);
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, remoteFilePath);

    const publicUrl = `${config.publicBaseUrl}/uploads/${folder}/${filename}`;

    console.log("[HostingerUpload] Upload successful:", publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: `/uploads/${folder}/${filename}`,
    };
  } catch (error) {
    console.error("[HostingerUpload] Upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  } finally {
    client.close();
  }
};

export const deleteFromHostinger = async (
  folder: "videos" | "shorts" | "thumbnails" | "profiles" | "banners",
  filename: string
): Promise<{ success: boolean; error?: string }> => {
  const client = new FTPClient();
  client.ftp.verbose = false;

  try {
    const config = getFTPConfig();

    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false,
    });

    const remoteFilePath = `${config.uploadsPath}/${folder}/${filename}`;
    console.log("[HostingerUpload] Deleting file:", remoteFilePath);

    await client.remove(remoteFilePath);

    console.log("[HostingerUpload] File deleted successfully");

    return { success: true };
  } catch (error) {
    console.error("[HostingerUpload] Delete failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  } finally {
    client.close();
  }
};
