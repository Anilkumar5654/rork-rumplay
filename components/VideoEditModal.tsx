import React, { useState, useEffect } from "react";
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
import { X, Image as ImageIcon, Save, Trash2, BarChart } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { useAppState } from "@/contexts/AppStateContext";
import { Video, VideoAnalytics } from "@/types";

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
];

interface VideoEditModalProps {
  visible: boolean;
  video: Video | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function VideoEditModal({ visible, video, onClose, onUpdate }: VideoEditModalProps) {
  const { updateVideo, deleteVideo } = useAppState();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUri, setThumbnailUri] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const [isSaving, setIsSaving] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || "");
      setCategory(video.category);
      setTags(video.tags || []);
      setThumbnailUri(video.thumbnail);
      setVisibility((video.visibility as any) || "public");
    }
  }, [video]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Technology");
    setTags([]);
    setTagInput("");
    setThumbnailUri("");
    setVisibility("public");
    setShowAnalytics(false);
  };

  const handleClose = () => {
    if (isSaving) {
      Alert.alert("Saving", "Please wait while saving changes.");
      return;
    }
    resetForm();
    onClose();
  };

  const pickThumbnail = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Media library permission is required.");
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: video?.isShort ? [9, 16] : [16, 9],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking thumbnail:", error);
      Alert.alert("Error", "Failed to pick thumbnail.");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const validateChanges = (): boolean => {
    if (!title || title.trim().length < 3) {
      Alert.alert("Error", "Title must be at least 3 characters.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!video || !validateChanges()) return;

    setIsSaving(true);
    try {
      await updateVideo(video.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        thumbnail: thumbnailUri,
        visibility,
      });

      Alert.alert("Success", "Video updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            onClose();
            onUpdate?.();
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating video:", error);
      Alert.alert("Error", "Failed to update video.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!video) return;

    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this video? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVideo(video.id);
              Alert.alert("Deleted", "Video has been deleted.", [
                {
                  text: "OK",
                  onPress: () => {
                    resetForm();
                    onClose();
                    onUpdate?.();
                  },
                },
              ]);
            } catch (error) {
              console.error("Error deleting video:", error);
              Alert.alert("Error", "Failed to delete video.");
            }
          },
        },
      ]
    );
  };

  const renderAnalytics = () => {
    if (!video) return null;

    const analytics: VideoAnalytics = {
      videoId: video.id,
      views: video.views,
      likes: video.likes,
      dislikes: video.dislikes,
      comments: video.comments?.length || 0,
      watchTime: Math.floor(video.views * video.duration * 0.6),
      shares: Math.floor(video.views * 0.05),
      averageViewDuration: Math.floor(video.duration * 0.6),
      retentionRate: 60,
    };

    const formatNumber = (num: number): string => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hours > 0) return `${hours}h ${mins}m`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    };

    return (
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>Video Analytics</Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{formatNumber(analytics.views)}</Text>
            <Text style={styles.analyticsLabel}>Views</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{formatNumber(analytics.likes)}</Text>
            <Text style={styles.analyticsLabel}>Likes</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{analytics.comments}</Text>
            <Text style={styles.analyticsLabel}>Comments</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{formatNumber(analytics.shares)}</Text>
            <Text style={styles.analyticsLabel}>Shares</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{formatDuration(analytics.watchTime)}</Text>
            <Text style={styles.analyticsLabel}>Watch Time</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsValue}>{analytics.retentionRate}%</Text>
            <Text style={styles.analyticsLabel}>Retention</Text>
          </View>
        </View>

        <View style={styles.engagementSection}>
          <Text style={styles.engagementTitle}>Engagement</Text>
          <View style={styles.engagementBar}>
            <View 
              style={[
                styles.engagementFill, 
                { width: `${(analytics.likes / (analytics.likes + analytics.dislikes)) * 100}%` }
              ]} 
            />
          </View>
          <View style={styles.engagementStats}>
            <Text style={styles.engagementText}>
              👍 {formatNumber(analytics.likes)} likes
            </Text>
            <Text style={styles.engagementText}>
              👎 {formatNumber(analytics.dislikes)} dislikes
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!video) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Video</Text>
          <TouchableOpacity onPress={handleClose} disabled={isSaving}>
            <X color={theme.colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, !showAnalytics && styles.tabActive]}
              onPress={() => setShowAnalytics(false)}
            >
              <Text style={[styles.tabText, !showAnalytics && styles.tabTextActive]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, showAnalytics && styles.tabActive]}
              onPress={() => setShowAnalytics(true)}
            >
              <BarChart color={showAnalytics ? theme.colors.primary : theme.colors.textSecondary} size={16} />
              <Text style={[styles.tabText, showAnalytics && styles.tabTextActive]}>
                Analytics
              </Text>
            </TouchableOpacity>
          </View>

          {showAnalytics ? (
            renderAnalytics()
          ) : (
            <>
              <View style={styles.videoPreview}>
                <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.changeThumbnailButton} onPress={pickThumbnail}>
                  <ImageIcon color="#FFFFFF" size={16} />
                  <Text style={styles.changeThumbnailText}>Change Thumbnail</Text>
                </TouchableOpacity>
                {video.isShort && (
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
                  value={title}
                  onChangeText={setTitle}
                  editable={!isSaving}
                  maxLength={100}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter video description"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  editable={!isSaving}
                  maxLength={500}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipActive,
                      ]}
                      onPress={() => setCategory(cat)}
                      disabled={isSaving}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
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
                    editable={!isSaving}
                  />
                  <TouchableOpacity style={styles.addTagButton} onPress={addTag} disabled={isSaving}>
                    <Text style={styles.addTagButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)} disabled={isSaving}>
                        <X color={theme.colors.text} size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Visibility</Text>
                {VISIBILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.visibilityOption,
                      visibility === option.value && styles.visibilityOptionActive,
                    ]}
                    onPress={() => setVisibility(option.value)}
                    disabled={isSaving}
                  >
                    <View style={styles.visibilityOptionContent}>
                      <Text style={styles.visibilityLabel}>{option.label}</Text>
                      <Text style={styles.visibilityDescription}>{option.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        visibility === option.value && styles.radioActive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Save color="#FFFFFF" size={20} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={isSaving}
                >
                  <Trash2 color={theme.colors.error} size={20} />
                  <Text style={styles.deleteButtonText}>Delete Video</Text>
                </TouchableOpacity>
              </View>
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
  tabContainer: {
    flexDirection: "row" as const,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
  },
  tabActive: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
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
  actionButtons: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "bold" as const,
  },
  deleteButton: {
    backgroundColor: theme.colors.surface,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  analyticsContainer: {
    paddingBottom: theme.spacing.xl,
  },
  analyticsTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  analyticsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  analyticsCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    alignItems: "center" as const,
  },
  analyticsValue: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: "bold" as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  analyticsLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  engagementSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
  },
  engagementTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  engagementBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    overflow: "hidden" as const,
    marginBottom: theme.spacing.sm,
  },
  engagementFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  engagementStats: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  engagementText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
});
