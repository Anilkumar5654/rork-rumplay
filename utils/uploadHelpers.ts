import { Platform } from "react-native";
import { getEnvApiRootUrl } from "./env";

const LOG_PREFIX = "[UploadHelpers]";

type UploadResponse = {
  success: boolean;
  url?: string;
  path?: string;
  filename?: string;
  error?: string;
  message?: string;
  file_url?: string;
};

type VideoUploadOptions = {
  videoUri: string;
  thumbnailUri?: string;
  title: string;
  description?: string;
  isShort?: boolean;
  token: string;
};

const inferExtension = (uri: string, fallback: string): string => {
  const sanitized = uri.split("?")[0];
  const segment = sanitized.split("/").pop() ?? "";
  const ext = segment.split(".").pop();
  return ext ? ext.toLowerCase() : fallback;
};

const mimeFromExtension = (extension: string): string => {
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    case "webm":
      return "video/webm";
    case "3gp":
      return "video/3gpp";
    default:
      return "application/octet-stream";
  }
};

const createFileObject = async (uri: string, fileName: string, mimeType: string) => {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error("Unable to access file data");
    }
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  }

  return {
    uri,
    name: fileName,
    type: mimeType,
  };
};

export const uploadVideoToBackend = async (options: VideoUploadOptions): Promise<UploadResponse> => {
  const { videoUri, thumbnailUri, title, description, isShort, token } = options;

  try {
    const apiRoot = getEnvApiRootUrl();
    const uploadEndpoint = isShort ? `${apiRoot}/shorts/upload` : `${apiRoot}/video/upload`;

    console.log(`${LOG_PREFIX} Uploading ${isShort ? "short" : "video"} to ${uploadEndpoint}`);

    const videoExtension = inferExtension(videoUri, "mp4");
    const videoMimeType = mimeFromExtension(videoExtension);
    const videoFileName = `video-${Date.now()}.${videoExtension}`;

    const formData = new FormData();
    formData.append("title", title);
    if (description) {
      formData.append("description", description);
    }

    const videoFile = await createFileObject(videoUri, videoFileName, videoMimeType);
    formData.append("file", videoFile as any);

    if (thumbnailUri) {
      const thumbnailExtension = inferExtension(thumbnailUri, "jpg");
      const thumbnailMimeType = mimeFromExtension(thumbnailExtension);
      const thumbnailFileName = `thumbnail-${Date.now()}.${thumbnailExtension}`;

      const thumbnailFile = await createFileObject(thumbnailUri, thumbnailFileName, thumbnailMimeType);
      formData.append("thumbnail", thumbnailFile as any);
    }

    const response = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      console.error(`${LOG_PREFIX} Non-JSON response`, raw);
      throw new Error("Server returned invalid response. Expected JSON.");
    }

    const result = (await response.json()) as UploadResponse;

    if (!response.ok || !result.success) {
      const errorMessage = result.error ?? result.message ?? "Upload failed";
      console.error(`${LOG_PREFIX} Upload failed`, errorMessage);
      throw new Error(errorMessage);
    }

    const finalUrl = result.url ?? result.file_url ?? "";
    console.log(`${LOG_PREFIX} Upload successful`, finalUrl);
    
    return {
      ...result,
      url: finalUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    console.error(`${LOG_PREFIX} uploadVideoToBackend error`, message, error);
    return {
      success: false,
      error: message,
    };
  }
};

export const uploadMediaFile = async (
  uri: string,
  fileName: string,
  folder: "videos" | "shorts" | "thumbnails" | "profiles",
  token: string
): Promise<UploadResponse> => {
  try {
    const apiRoot = getEnvApiRootUrl();
    const uploadEndpoint = `${apiRoot}/upload`;

    console.log(`${LOG_PREFIX} Uploading media file to ${uploadEndpoint}`, { folder, fileName });

    const extension = inferExtension(uri, "jpg");
    const mimeType = mimeFromExtension(extension);
    const finalFileName = fileName || `file-${Date.now()}.${extension}`;

    const formData = new FormData();
    formData.append("folder", folder);

    const fileObject = await createFileObject(uri, finalFileName, mimeType);
    formData.append("file", fileObject as any);

    const response = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      console.error(`${LOG_PREFIX} Non-JSON response`, raw);
      throw new Error("Server returned invalid response. Expected JSON.");
    }

    const result = (await response.json()) as UploadResponse;

    if (!response.ok || !result.success) {
      const errorMessage = result.error ?? result.message ?? "Upload failed";
      console.error(`${LOG_PREFIX} Upload failed`, errorMessage);
      throw new Error(errorMessage);
    }

    const finalUrl = result.url ?? result.file_url ?? "";
    console.log(`${LOG_PREFIX} Media upload successful`, finalUrl);
    
    return {
      ...result,
      url: finalUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    console.error(`${LOG_PREFIX} uploadMediaFile error`, message, error);
    return {
      success: false,
      error: message,
    };
  }
};
