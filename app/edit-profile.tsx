import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { ArrowLeft, Camera, Check } from "lucide-react-native";
import { theme } from "@/constants/theme";
import { useProfileData } from "@/hooks/useProfileData";

const fallbackAvatar = "https://api.dicebear.com/7.x/thumbs/svg?seed=profile";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isProfileLoading, updateProfile, isUpdatingProfile, refreshProfile } = useProfileData();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [remoteAvatar, setRemoteAvatar] = useState("");
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setUsername(profile.username ?? "");
      setEmail(profile.email ?? "");
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
      setRemoteAvatar(profile.avatar ?? "");
      setLocalAvatarUri(null);
    }
  }, [profile]);

  const pickProfilePicture = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Please allow access to your photo library.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as ImagePickerAsset;
        setLocalAvatarUri(asset.uri);
      }
    } catch (error) {
      console.error("Error picking profile picture:", error);
      Alert.alert("Error", "Failed to pick profile picture. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required.");
      return;
    }

    if (!profile) {
      Alert.alert("Error", "Profile data is not available.");
      return;
    }

    const trimmedName = displayName.trim();
    const trimmedBio = bio.trim();
    const trimmedPhone = phone.trim();

    const updates: {
      name?: string;
      bio?: string;
      phone?: string;
      profilePicUri?: string | null;
    } = {};

    if (trimmedName !== (profile.displayName ?? "")) {
      updates.name = trimmedName;
    }
    if (trimmedBio !== (profile.bio ?? "")) {
      updates.bio = trimmedBio;
    }
    if (trimmedPhone !== (profile.phone ?? "")) {
      updates.phone = trimmedPhone;
    }
    if (localAvatarUri) {
      updates.profilePicUri = localAvatarUri;
    }

    if (Object.keys(updates).length === 0) {
      Alert.alert("No Changes", "There are no updates to save.");
      return;
    }

    try {
      await updateProfile(updates);
      await refreshProfile();
      setLocalAvatarUri(null);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to update profile: ${errorMessage}`);
    }
  };

  if (isProfileLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const displayedAvatar = localAvatarUri ?? remoteAvatar ?? fallbackAvatar;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isUpdatingProfile} testID="profile-save-button">
          {isUpdatingProfile ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Check color={theme.colors.primary} size={24} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: displayedAvatar || fallbackAvatar }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.changeAvatarBtn}
            onPress={pickProfilePicture}
            disabled={isUpdatingProfile}
            testID="profile-change-avatar-button"
          >
            {isUpdatingProfile ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Camera color={theme.colors.primary} size={24} />
                <Text style={styles.changeAvatarText}>Change Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={theme.colors.textSecondary}
              editable={!isUpdatingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={username}
              placeholder="Username"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              editable={false}
            />
            <Text style={styles.helperText}>Username cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!isUpdatingProfile}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              editable={!isUpdatingProfile}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center" as const,
    paddingVertical: theme.spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  changeAvatarBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
  },
  changeAvatarText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: "600" as const,
  },
  form: {
    padding: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  disabledInput: {
    opacity: 0.6,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top" as const,
  },
  helperText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
