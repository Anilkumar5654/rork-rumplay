import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { X, Video as VideoIcon, Camera, Image as ImageIcon, Calendar } from "lucide-react-native";
import { theme } from "../constants/theme";
import { useAppState } from "../contexts/AppStateContext";
import { useAuth } from "../contexts/AuthContext";
import { Video, VideoUploadData, UploadProgress, UploadFolder } from "../types";
import { getEnvApiBaseUrl, getEnvUploadEndpoint } from "../utils/env";

const CATEGORIES = [
  "Technology",
  "Gaming",
  "Food",
  "Fitness",
  "Music",
  "Education",
  "Entertainment",
  "Sports",
  "Travel",
  "Lifestyle",
];

const VISIBILITY_OPTIONS = [
  { value: "public" as const, label: "Public", description: "Everyone can see" },
  { value: "private" as const, label: "Private", description: "Only you can see" },
  { value: "unlisted" as const, label: "Unlisted", description: "Only with link" },
  { value: "scheduled" as const, label: "Scheduled", description: "Publish later" },
];

type MediaMeta = {
  uri: string;
  name: string;
  mimeType: string;
};

const LOG_PREFIX = "[UploadModal]";

export default function UploadModal({ visible, onClose, onUploadComplete }: { visible: boolean; onClose: () => void; onUploadComplete?: () => void }) {
  const { addVideo, currentUser, getChannelById } = useAppState();
  const { authToken } = useAuth();

  let apiBase: string = "";
  let uploadEndpoint: string = "";
  try {
    apiBase = getEnvApiBaseUrl();
    uploadEndpoint = getEnvUploadEndpoint();
  } catch (error) {
    console.error(`${LOG_PREFIX} Missing API base URL`, error);
  }

  const [uploadData, setUploadData] = useState<Partial<VideoUploadData>>({
    title: "",
    description: "",
    category: "Technology",
    tags: [],
    videoUri: "",
    thumbnailUri: "",
    duration: 0,
    isShort: false,
    visibility: "public",
    scheduledDate: undefined,
  });

  const [progress, setProgress] = useState<UploadProgress>({
    progress: 0,
    status: "idle",
    message: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [videoMeta, setVideoMeta] = useState<MediaMeta | null>(null);
  const [thumbnailMeta, setThumbnailMeta] = useState<MediaMeta | null>(null);

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

  const ensureMeta = (meta: MediaMeta | null, fallbackUri: string, prefix: string, fallbackExtension: string): MediaMeta => {
    const targetUri = meta?.uri ?? fallbackUri;
    if (!targetUri) {
      throw new Error("Missing media reference");
    }
    const extension = inferExtension(targetUri, fallbackExtension);
    const name = meta?.name ?? `${prefix}-${Date.now()}.${extension}`;
    const mimeType = meta?.mimeType ?? mimeFromExtension(extension);
    return { uri: targetUri, name, mimeType: mimeType.toLowerCase() };
  };

  const createVideoMetaFromAsset = (asset: ImagePickerAsset): MediaMeta => {
    const extension = inferExtension(asset.uri, "mp4");
    const candidateMime = ((asset as { mimeType?: string }).mimeType ?? asset.type ?? mimeFromExtension(extension)).toLowerCase();
    const name = asset.fileName ?? `video-${Date.now()}.${extension}`;
    return { uri: asset.uri, name, mimeType: candidateMime };
  };

  const createThumbnailMetaFromUri = (uri: string): MediaMeta => {
    return ensureMeta(null, uri, "thumbnail", "jpg");
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

  const resetModal = () => {
    setUploadData({
      title: "",
      description: "",
      category: "Technology",
      tags: [],
      videoUri: "",
      thumbnailUri: "",
      duration: 0,
      isShort: false,
      visibility: "public",
      scheduledDate: undefined,
    });
    setProgress({
      progress: 0,
      status: "idle",
      message: "",
    });
    setTagInput("");
    setVideoMeta(null);
    setThumbnailMeta(null);
  };

  const handleClose = () => {
    if (progress.status === "uploading" || progress.status === "processing") {
      Alert.alert("Upload in Progress", "Please wait for the upload to complete.");
      return;
    }
    resetModal();
    onClose();
  };

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        Alert.alert("Permission Required", "Camera and media permissions are required.");
        return false;
      }
    }
    return true;
  };

  const generateThumbnail = async (videoUri: string) => {
    try {
      if (Platform.OS === "web") {
        return `https://picsum.photos/1280/720?random=${Date.now()}`;
      }
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000, quality: 0.8 });
      return uri;
    } catch (error) {
      console.error(`${LOG_PREFIX} Thumbnail generation failed`, error);
      return `https://picsum.photos/1280/720?fallback=${Date.now()}`;
    }
  };

  const getVideoDuration = async (videoUri: string): Promise<number> => {
    return new Promise((resolve) => {
      if (Platform.OS === "web") {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve(Math.floor(video.duration));
        };
        video.onerror = () => resolve(0);
        video.src = videoUri;
      } else {
        resolve(0);
      }
    });
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as ImagePickerAsset;
        setProgress({ progress: 10, status: "processing", message: "Processing video..." });

        const duration = asset.duration || (await getVideoDuration(asset.uri)) || 0;
        const isShort = duration > 0 && duration < 60;
        const thumbnailUri = await generateThumbnail(asset.uri);

        setUploadData((prev) => ({
          ...prev,
          videoUri: asset.uri,
          thumbnailUri,
          duration,
          isShort,
        }));

        setVideoMeta(createVideoMetaFromAsset(asset));
        setThumbnailMeta(createThumbnailMetaFromUri(thumbnailUri));

        setProgress({ progress: 0, status: "idle", message: "" });

        if (isShort) {
          Alert.alert("Short Detected", "This video is under 60 seconds and will be uploaded as a Short.");
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Video pick failed`, error);
      Alert.alert("Error", "Failed to pick video.");
      setProgress({ progress: 0, status: "error", message: "Failed to pick video" });
    }
  };

  const recordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as ImagePickerAsset;
        setProgress({ progress: 10, status: "processing", message: "Processing video..." });

        const duration = asset.duration || (await getVideoDuration(asset.uri)) || 0;
        const isShort = duration > 0 && duration < 60;
        const thumbnailUri = await generateThumbnail(asset.uri);

        setUploadData((prev) => ({
          ...prev,
          videoUri: asset.uri,
          thumbnailUri,
          duration,
          isShort,
        }));

        setVideoMeta(createVideoMetaFromAsset(asset));
        setThumbnailMeta(createThumbnailMetaFromUri(thumbnailUri));

        setProgress({ progress: 0, status: "idle", message: "" });

        if (isShort) {
          Alert.alert("Short Detected", "This video is under 60 seconds and will be uploaded as a Short.");
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Video record failed`, error);
      Alert.alert("Error", "Failed to record video.");
      setProgress({ progress: 0, status: "error", message: "Failed to record video" });
    }
  };

  const pickThumbnail = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: uploadData.isShort ? [9, 16] : [16, 9],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as ImagePickerAsset;
        setUploadData((prev) => ({ ...prev, thumbnailUri: asset.uri }));
        setThumbnailMeta(createThumbnailMetaFromUri(asset.uri));
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Thumbnail pick failed`, error);
      Alert.alert("Error", "Failed to pick thumbnail.");
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setUploadData((prev) => ({
        ...prev,
        tags: prev.tags && prev.tags.length < 10 ? [...prev.tags, tagInput.trim()] : prev.tags ?? [tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setUploadData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) ?? [],
    }));
  };

  const validateUpload = (): boolean => {
    if (!apiBase) {
      Alert.alert("Configuration Error", "Backend URL not configured.");
      return false;
    }
    if (!uploadEndpoint) {
      Alert.alert("Configuration Error", "Upload endpoint not configured.");
      return false;
    }
    if (!uploadData.videoUri) {
      Alert.alert("Error", "Please select or record a video.");
      return false;
    }
    if (!uploadData.title || uploadData.title.trim().length < 3) {
      Alert.alert("Error", "Please enter a title (minimum 3 characters).");
      return false;
    }
    if (!uploadData.thumbnailUri) {
      Alert.alert("Error", "Please select a thumbnail.");
      return false;
    }
    if (uploadData.visibility === "scheduled" && !uploadData.scheduledDate) {
      Alert.alert("Error", "Please select a scheduled date.");
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateUpload()) {
      return;
    }

    if (!authToken) {
      Alert.alert("Error", "Not authenticated. Please login again.");
      return;
    }

    try {
      setProgress({ progress: 10, status: "uploading", message: "Preparing upload..." });

      const resolvedVideoMeta = ensureMeta(videoMeta, uploadData.videoUri ?? "", "video", "mp4");
      const resolvedThumbnailMeta = ensureMeta(thumbnailMeta, uploadData.thumbnailUri ?? "", "thumbnail", "jpg");

      console.log(`${LOG_PREFIX} Creating FormData for upload`);
      const formData = new FormData();

      const videoFile = await createFileObject(resolvedVideoMeta.uri, resolvedVideoMeta.name, resolvedVideoMeta.mimeType);
      formData.append("video", videoFile as any);

      const thumbnailFile = await createFileObject(resolvedThumbnailMeta.uri, resolvedThumbnailMeta.name, resolvedThumbnailMeta.mimeType);
      formData.append("thumbnail", thumbnailFile as any);

      formData.append("title", uploadData.title || "Untitled Video");
      formData.append("description", uploadData.description || "");
      formData.append("category", uploadData.category || "Technology");
      formData.append("privacy", uploadData.visibility || "public");
      formData.append("is_short", uploadData.isShort ? "1" : "0");

      if (uploadData.tags && uploadData.tags.length > 0) {
        formData.append("tags", uploadData.tags.join(","));
      }

      console.log(`${LOG_PREFIX} FINAL FORM DATA:`, Array.from((formData as any).entries()));

      setProgress({ progress: 30, status: "uploading", message: "Uploading video..." });

      const uploadUrl = `${apiBase}/api/video/upload`;
      console.log(`${LOG_PREFIX} Uploading to: ${uploadUrl}`);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
        body: formData,
      });

      console.log(`${LOG_PREFIX} Upload response status:`, response.status);

      if (response.status === 401) {
        console.error(`${LOG_PREFIX} 401 Unauthorized - Token may be invalid`);
        Alert.alert("Authentication Error", "Your session has expired. Please login again.");
        setProgress({ progress: 0, status: "error", message: "Authentication failed" });
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text();
        console.error(`${LOG_PREFIX} Non-JSON response:`, rawText.substring(0, 500));
        throw new Error("Server returned invalid response. Expected JSON.");
      }

      const result = await response.json();
      console.log(`${LOG_PREFIX} Upload result:`, JSON.stringify(result, null, 2));

      if (!response.ok) {
        const errorMessage = result.error ?? result.message ?? `Upload failed with status ${response.status}`;
        console.error(`${LOG_PREFIX} Upload failed (HTTP ${response.status}):`, errorMessage);
        console.error(`${LOG_PREFIX} Full response:`, JSON.stringify(result, null, 2));
        throw new Error(errorMessage);
      }

      if (!result.success) {
        const errorMessage = result.error ?? result.message ?? "Upload failed";
        console.error(`${LOG_PREFIX} Backend returned success=false:`, errorMessage);
        console.error(`${LOG_PREFIX} Full response:`, JSON.stringify(result, null, 2));
        throw new Error(errorMessage);
      }

      setProgress({ progress: 85, status: "processing", message: "Saving video..." });

      const videoUrl = result.file_url ?? result.video_url ?? result.url ?? "";
      const thumbnailUrl = result.thumbnail_url ?? result.thumbnail ?? "";

      const userChannel = currentUser.channelId ? getChannelById(currentUser.channelId) : null;

      const newVideo: Video = {
        id: result.id ?? `v${Date.now()}`,
        title: uploadData.title || "Untitled Video",
        description: uploadData.description || "",
        thumbnail: thumbnailUrl,
        videoUrl: videoUrl,
        channelId: currentUser.channelId || "ch1",
        channelName: userChannel?.name || currentUser.displayName,
        channelAvatar: userChannel?.avatar || currentUser.avatar,
        views: 0,
        likes: 0,
        dislikes: 0,
        uploadDate: new Date().toISOString(),
        duration: uploadData.duration || 0,
        category: uploadData.category || "General",
        tags: uploadData.tags || [],
        comments: [],
        isShort: uploadData.isShort || false,
        isLive: false,
        visibility: uploadData.visibility || "public",
        scheduledDate: uploadData.scheduledDate,
        uploaderId: currentUser.id,
      };

      await addVideo(newVideo);

      setProgress({ progress: 100, status: "completed", message: "Upload completed!" });

      setTimeout(() => {
        Alert.alert("Success", "Video uploaded successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetModal();
              onClose();
              onUploadComplete?.();
            },
          },
        ]);
      }, 350);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      console.error(`${LOG_PREFIX} Upload error:`, error);
      setProgress({ progress: 0, status: "error", message });
      Alert.alert("Upload Failed", message);
    }
  };

  const isUploading = progress.status === "uploading" || progress.status === "processing";

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Video</Text>
          <TouchableOpacity onPress={handleClose} disabled={isUploading} testID="upload-close-button">
            <X color={theme.colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!uploadData.videoUri ? (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickVideo} disabled={isUploading} testID="upload-pick-video">
                <VideoIcon color={theme.colors.primary} size={48} />
                <Text style={styles.uploadButtonText}>Pick from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={recordVideo} disabled={isUploading} testID="upload-record-video">
                <Camera color={theme.colors.primary} size={48} />
                <Text style={styles.uploadButtonText}>Record Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.videoPreview}>
                <Image source={{ uri: uploadData.thumbnailUri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.changeThumbnailButton} onPress={pickThumbnail} disabled={isUploading} testID="upload-change-thumbnail">
                  <ImageIcon color="#FFFFFF" size={16} />
                  <Text style={styles.changeThumbnailText}>Change Thumbnail</Text>
                </TouchableOpacity>
                {uploadData.isShort && (
                  <View style={styles.shortBadge}>
                    <Text style={styles.shortBadgeText}>SHORT</Text>
                  </View>
                )}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>
                  Title <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter video title"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={uploadData.title}
                  onChangeText={(text) => setUploadData((prev) => ({ ...prev, title: text }))}
                  editable={!isUploading}
                  maxLength={100}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter video description"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={uploadData.description}
                  onChangeText={(text) => setUploadData((prev) => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  editable={!isUploading}
                  maxLength={500}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>
                  Category <Text style={styles.required}>*</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, uploadData.category === cat && styles.categoryChipActive]}
                      onPress={() => setUploadData((prev) => ({ ...prev, category: cat }))}
                      disabled={isUploading}
                    >
                      <Text style={[styles.categoryChipText, uploadData.category === cat && styles.categoryChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Add tags..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                    returnKeyType="done"
                    editable={!isUploading}
                  />
                  <TouchableOpacity style={styles.addTagButton} onPress={addTag} disabled={isUploading} testID="upload-add-tag">
                    <Text style={styles.addTagButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {uploadData.tags?.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)} disabled={isUploading}>
                        <X color={theme.colors.text} size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>
                  Visibility <Text style={styles.required}>*</Text>
                </Text>
                {VISIBILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.visibilityOption, uploadData.visibility === option.value && styles.visibilityOptionActive]}
                    onPress={() => setUploadData((prev) => ({ ...prev, visibility: option.value }))}
                    disabled={isUploading}
                  >
                    <View style={styles.visibilityOptionContent}>
                      <Text style={styles.visibilityLabel}>{option.label}</Text>
                      <Text style={styles.visibilityDescription}>{option.description}</Text>
                    </View>
                    <View style={[styles.radio, uploadData.visibility === option.value && styles.radioActive]} />
                  </TouchableOpacity>
                ))}
              </View>

              {uploadData.visibility === "scheduled" && (
                <View style={styles.formSection}>
                  <Text style={styles.label}>
                    Scheduled Date <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity style={styles.dateButton} disabled>
                    <Calendar color={theme.colors.text} size={20} />
                    <Text style={styles.dateButtonText}>{uploadData.scheduledDate || "Select date and time"}</Text>
                  </TouchableOpacity>
                  <Text style={styles.helperText}>Scheduling functionality coming soon</Text>
                </View>
              )}

              {isUploading && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress.message}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.uploadSubmitButton, isUploading && styles.uploadSubmitButtonDisabled]}
                onPress={handleUpload}
                disabled={isUploading}
                testID="upload-submit-button"
              >
                {isUploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.uploadSubmitButtonText}>Upload Video</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  uploadOptions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  uploadButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    alignItems: "center" as const,
    gap: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed" as const,
  },
  uploadButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  videoPreview: {
    position: "relative" as const,
    marginBottom: theme.spacing.xl,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },
  changeThumbnailButton: {
    position: "absolute" as const,
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.overlay,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
  },
  changeThumbnailText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.xs,
    fontWeight: "600" as const,
  },
  shortBadge: {
    position: "absolute" as const,
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  shortBadgeText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.xs,
    fontWeight: "bold" as const,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top" as const,
  },
  categoryChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  tagInputContainer: {
    flexDirection: "row" as const,
    gap: theme.spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addTagButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: "center" as const,
    borderRadius: theme.radii.lg,
  },
  addTagButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
  },
  tagsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  tag: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    gap: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  visibilityOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  visibilityOptionActive: {
    borderColor: theme.colors.primary,
  },
  visibilityOptionContent: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: 2,
  },
  visibilityDescription: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.full,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  radioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  dateButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  helperText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  progressSection: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    overflow: "hidden" as const,
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: "center" as const,
  },
  uploadSubmitButton: {
    backgroundColor: theme.colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.xl,
  },
  uploadSubmitButtonDisabled: {
    opacity: 0.5,
  },
  uploadSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "bold" as const,
  },
});
