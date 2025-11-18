/**
 * Upload Examples - Expo SDK v54+ File API
 * 
 * This file demonstrates how to use the new upload functions with JWT authentication.
 * All deprecated readAsStringAsync calls have been replaced with the new File API.
 */

import { uploadVideoToBackend, uploadMediaFile } from './uploadHelpers';

/**
 * Example 1: Upload a video with thumbnail
 */
export const exampleVideoUpload = async (
  videoUri: string,
  thumbnailUri: string,
  authToken: string
) => {
  try {
    const result = await uploadVideoToBackend({
      videoUri,
      thumbnailUri,
      title: "My Awesome Video",
      description: "This is a test video upload",
      isShort: false,
      token: authToken,
    });

    if (result.success) {
      console.log("Video uploaded successfully:", result.url);
      return result;
    } else {
      console.error("Upload failed:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Example 2: Upload a short video
 */
export const exampleShortUpload = async (
  videoUri: string,
  thumbnailUri: string,
  authToken: string
) => {
  try {
    const result = await uploadVideoToBackend({
      videoUri,
      thumbnailUri,
      title: "My Short Video",
      description: "Quick 30-second clip",
      isShort: true,
      token: authToken,
    });

    if (result.success) {
      console.log("Short uploaded successfully:", result.url);
      return result;
    } else {
      console.error("Upload failed:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Example 3: Upload a profile picture
 */
export const exampleProfilePictureUpload = async (
  imageUri: string,
  authToken: string
) => {
  try {
    const result = await uploadMediaFile(
      imageUri,
      `profile-${Date.now()}.jpg`,
      "profiles",
      authToken
    );

    if (result.success) {
      console.log("Profile picture uploaded:", result.url);
      return result;
    } else {
      console.error("Upload failed:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Example 4: Upload a thumbnail only
 */
export const exampleThumbnailUpload = async (
  thumbnailUri: string,
  authToken: string
) => {
  try {
    const result = await uploadMediaFile(
      thumbnailUri,
      `thumbnail-${Date.now()}.jpg`,
      "thumbnails",
      authToken
    );

    if (result.success) {
      console.log("Thumbnail uploaded:", result.url);
      return result;
    } else {
      console.error("Upload failed:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Example 5: Complete upload flow with error handling
 */
export const exampleCompleteUploadFlow = async (
  videoUri: string,
  thumbnailUri: string,
  title: string,
  description: string,
  authToken: string,
  onProgress?: (progress: number, message: string) => void
) => {
  try {
    onProgress?.(10, "Starting upload...");

    onProgress?.(30, "Uploading video...");
    const result = await uploadVideoToBackend({
      videoUri,
      thumbnailUri,
      title,
      description,
      isShort: false,
      token: authToken,
    });

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    onProgress?.(100, "Upload complete!");

    return {
      success: true,
      videoUrl: result.url,
      videoPath: result.path,
      filename: result.filename,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    onProgress?.(0, `Error: ${message}`);
    
    return {
      success: false,
      error: message,
    };
  }
};
