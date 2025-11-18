import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle, DollarSign, Edit3, X, Upload, ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { theme } from "@/constants/theme";
import { useAppState } from "@/contexts/AppStateContext";
import { useAuth } from "@/contexts/AuthContext";
import { defaultChannel } from "@/utils/defaults";
import { getEnvApiRootUrl } from "@/utils/env";

const { width } = Dimensions.get("window");

type TabType = "Videos" | "Shorts" | "About" | "Manage";

type ChannelEditData = {
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
};

type ChannelData = {
  id: string;
  userId: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  handleLastChanged: string | null;
  createdAt: string;
  isOwner?: boolean;
};

type ChannelApiResponse = {
  success: boolean;
  channel?: ChannelData;
  error?: string;
  message?: string;
};

export default function ChannelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { videos, currentUser, toggleSubscription, getChannelById } = useAppState();
  const { authUser, authToken } = useAuth();

  const channelIdParam = params.id as string | undefined;
  const channelId = channelIdParam ?? '';
  const [channel, setChannel] = useState(getChannelById(channelId) || defaultChannel);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [, setIsLoadingChannel] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabType>("Videos");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<ChannelEditData>({
    name: channel.name,
    handle: channel.handle || '',
    description: channel.description || '',
    avatar: channel.avatar,
    banner: channel.banner,
  });
  const [avatarFile, setAvatarFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [bannerFile, setBannerFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isOwnChannel = useMemo(() => {
    if (channelData?.isOwner !== undefined) {
      return channelData.isOwner;
    }
    if (!authUser || !channelData) return false;
    return authUser.id === channelData.userId || authUser.channelId === channelId;
  }, [authUser, channelData, channelId]);
  
  const isSubscribed = currentUser.subscriptions.some((s) => s.channelId === channelId);

  const apiRoot = useMemo(() => getEnvApiRootUrl(), []);

  const channelVideos = videos.filter((v) => v.channelId === channelId && !v.isShort);
  const channelShorts = videos.filter((v) => v.channelId === channelId && v.isShort);

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatSubscribers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(2)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const fetchChannelData = useCallback(async () => {
    try {
      setIsLoadingChannel(true);
      const endpoint = channelId 
        ? `${apiRoot}/channel/view_channel?id=${channelId}`
        : `${apiRoot}/channel/view_channel`;
      
      console.log('[ChannelScreen] GET', endpoint);
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      const data = (await response.json()) as ChannelApiResponse;
      
      if (data.success && data.channel) {
        setChannelData(data.channel);
        setChannel({
          ...channel,
          name: data.channel.name,
          handle: data.channel.handle,
          description: data.channel.description,
          avatar: data.channel.avatar,
          banner: data.channel.banner,
        });
      }
    } catch (error) {
      console.error('[ChannelScreen] fetchChannelData error', error);
    } finally {
      setIsLoadingChannel(false);
    }
  }, [apiRoot, channelId, channel, authToken]);

  const pickImage = useCallback(async (type: 'avatar' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as ImagePicker.MediaTypeOptions,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'avatar') {
          setAvatarFile(result.assets[0]);
        } else {
          setBannerFile(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('[ChannelScreen] pickImage error', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const handleEditChannel = useCallback(async () => {
    if (!authToken) {
      Alert.alert('Authentication required', 'Please login to edit your channel.');
      return;
    }

    if (!editData.name.trim()) {
      Alert.alert('Validation error', 'Channel name is required.');
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = `${apiRoot}/channel/edit_channel`;
      console.log('[ChannelScreen] POST', endpoint);
      
      const formData = new FormData();
      
      if (editData.name.trim()) {
        formData.append('name', editData.name.trim());
      }
      
      if (editData.handle.trim()) {
        formData.append('handle', editData.handle.trim());
      }
      
      if (editData.description.trim()) {
        formData.append('description', editData.description.trim());
      }
      
      if (avatarFile) {
        const uriParts = avatarFile.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('avatar', {
          uri: avatarFile.uri,
          name: `avatar.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      
      if (bannerFile) {
        const uriParts = bannerFile.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('banner', {
          uri: bannerFile.uri,
          name: `banner.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      const raw = await response.text();
      console.log('[ChannelScreen] edit response', raw.slice(0, 300));
      
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Server returned invalid JSON');
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to update channel');
      }

      if (data.channel) {
        setChannelData(data.channel);
        const updatedChannel = {
          ...channel,
          name: data.channel.name,
          handle: data.channel.handle || channel.handle,
          description: data.channel.description || '',
          avatar: data.channel.avatar || channel.avatar,
          banner: data.channel.banner || channel.banner,
        };
        setChannel(updatedChannel);
        setEditData({
          name: updatedChannel.name,
          handle: updatedChannel.handle || '',
          description: updatedChannel.description || '',
          avatar: updatedChannel.avatar,
          banner: updatedChannel.banner,
        });
      }

      setAvatarFile(null);
      setBannerFile(null);
      setIsEditModalVisible(false);
      Alert.alert('Success', data.message || 'Channel updated successfully!');
      await fetchChannelData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update channel';
      console.error('[ChannelScreen] handleEditChannel error', message, error);
      Alert.alert('Update failed', message);
    } finally {
      setIsSaving(false);
    }
  }, [authToken, apiRoot, editData, avatarFile, bannerFile, channel, fetchChannelData]);

  const openEditModal = useCallback(() => {
    setEditData({
      name: channel.name,
      handle: channel.handle || '',
      description: channel.description || '',
      avatar: channel.avatar,
      banner: channel.banner,
    });
    setAvatarFile(null);
    setBannerFile(null);
    setIsEditModalVisible(true);
  }, [channel]);

  useEffect(() => {
    if (channelId) {
      const currentChannel = getChannelById(channelId);
      if (currentChannel) {
        setChannel(currentChannel);
      }
    }
  }, [channelId, getChannelById]);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  const tabs: TabType[] = isOwnChannel 
    ? ["Videos", "Shorts", "About", "Manage"]
    : ["Videos", "Shorts", "About"];

  const renderVideoGrid = (videoList: typeof videos) => (
    <View style={styles.videoGrid}>
      {videoList.map((video) => (
        <TouchableOpacity
          key={video.id}
          style={styles.gridItem}
          onPress={() => {
            if (video.isShort) {
              router.push(`/shorts/${video.id}`);
            } else {
              router.push(`/video/${video.id}`);
            }
          }}
        >
          <Image source={{ uri: video.thumbnail }} style={styles.gridThumbnail} />
          <Text style={styles.gridTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.gridViews}>{formatViews(video.views)} views</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAbout = () => (
    <View style={styles.aboutSection}>
      <Text style={styles.aboutTitle}>About</Text>
      <Text style={styles.aboutText}>{channel.description || "No description available"}</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatSubscribers(channel.subscriberCount)}</Text>
          <Text style={styles.statLabel}>Subscribers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatViews(channel.totalViews)}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{channelVideos.length + channelShorts.length}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
      </View>

      {channel.monetization.enabled && (
        <View style={styles.monetizationBadge}>
          <DollarSign color={theme.colors.success} size={20} />
          <Text style={styles.monetizationText}>Monetization Enabled</Text>
        </View>
      )}
    </View>
  );

  const renderManage = () => {
    if (!isOwnChannel) return null;

    const { monetization } = channel;
    const isEligible = 
      channel.subscriberCount >= monetization.eligibility.minSubscribers &&
      channel.totalWatchHours >= monetization.eligibility.minWatchHours;

    return (
      <View style={styles.manageSection}>
        <Text style={styles.sectionTitle}>Channel Management</Text>

        <View style={styles.manageCard}>
          <Text style={styles.cardTitle}>Monetization</Text>
          {!monetization.enabled ? (
            <>
              <Text style={styles.cardDesc}>Eligibility Requirements:</Text>
              <View style={styles.requirement}>
                <CheckCircle
                  color={
                    channel.subscriberCount >= monetization.eligibility.minSubscribers
                      ? theme.colors.success
                      : theme.colors.textSecondary
                  }
                  size={20}
                />
                <Text style={styles.requirementText}>
                  {formatSubscribers(channel.subscriberCount)} / {formatSubscribers(monetization.eligibility.minSubscribers)} subscribers
                </Text>
              </View>
              <View style={styles.requirement}>
                <CheckCircle
                  color={
                    channel.totalWatchHours >= monetization.eligibility.minWatchHours
                      ? theme.colors.success
                      : theme.colors.textSecondary
                  }
                  size={20}
                />
                <Text style={styles.requirementText}>
                  {channel.totalWatchHours} / {monetization.eligibility.minWatchHours} watch hours
                </Text>
              </View>
              {isEligible && (
                <TouchableOpacity style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>Apply for Monetization</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.cardDesc}>Monetization is active</Text>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Total Earnings:</Text>
                <Text style={styles.earningsValue}>
                  ${monetization.earnings.total.toLocaleString()}
                </Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Monthly:</Text>
                <Text style={styles.earningsValue}>
                  ${monetization.earnings.monthly.toLocaleString()}
                </Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Est. RPM:</Text>
                <Text style={styles.earningsValue}>${monetization.estimatedRPM}</Text>
              </View>
            </>
          )}
        </View>

        {monetization.enabled && monetization.membershipTiers.length > 0 && (
          <View style={styles.manageCard}>
            <Text style={styles.cardTitle}>Membership Tiers</Text>
            {monetization.membershipTiers.map((tier) => (
              <View key={tier.id} style={styles.tierItem}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierPrice}>${tier.price}/month</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/(tabs)/profile');
          }
        }}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        {isOwnChannel && (
          <TouchableOpacity onPress={openEditModal} style={styles.editButton}>
            <Edit3 color={theme.colors.text} size={20} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: channel.banner }} style={styles.banner} />

        <View style={styles.channelHeader}>
          <Image source={{ uri: channel.avatar }} style={styles.avatar} />
          <View style={styles.channelInfo}>
            <View style={styles.channelNameRow}>
              <Text style={styles.channelName}>{channel.name}</Text>
              {channel.verified && (
                <CheckCircle color={theme.colors.primary} size={20} />
              )}
              {channel.monetization.enabled && (
                <DollarSign color={theme.colors.success} size={20} />
              )}
            </View>
            <Text style={styles.subscriberCount}>
              {formatSubscribers(channel.subscriberCount)} subscribers
            </Text>
          </View>
        </View>

        {!isOwnChannel && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
              onPress={() => toggleSubscription(channelId)}
            >
              <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTab === "Videos" && renderVideoGrid(channelVideos)}
        {selectedTab === "Shorts" && renderVideoGrid(channelShorts)}
        {selectedTab === "About" && renderAbout()}
        {selectedTab === "Manage" && renderManage()}
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => !isSaving && setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Channel</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
              >
                <X color={theme.colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Channel Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Enter channel name"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!isSaving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Handle *</Text>
                <Text style={styles.formHint}>Can be changed once every 20 days</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.handle}
                  onChangeText={(text) => setEditData({ ...editData, handle: text })}
                  placeholder="@yourhandle"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!isSaving}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editData.description}
                  onChangeText={(text) => setEditData({ ...editData, description: text })}
                  placeholder="Tell viewers about your channel"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Avatar</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => pickImage('avatar')}
                  disabled={isSaving}
                >
                  {avatarFile ? (
                    <Image source={{ uri: avatarFile.uri }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <ImageIcon color={theme.colors.textSecondary} size={32} />
                      <Text style={styles.imagePickerText}>Tap to select avatar</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Banner</Text>
                <TouchableOpacity
                  style={styles.bannerPicker}
                  onPress={() => pickImage('banner')}
                  disabled={isSaving}
                >
                  {bannerFile ? (
                    <Image source={{ uri: bannerFile.uri }} style={styles.bannerPreview} />
                  ) : (
                    <View style={styles.bannerPickerPlaceholder}>
                      <Upload color={theme.colors.textSecondary} size={32} />
                      <Text style={styles.imagePickerText}>Tap to select banner</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isSaving && styles.modalButtonDisabled]}
                onPress={handleEditChannel}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  editButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
  },
  editButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  banner: {
    width,
    height: 150,
    backgroundColor: theme.colors.surface,
  },
  channelHeader: {
    flexDirection: "row" as const,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
  },
  channelInfo: {
    flex: 1,
    justifyContent: "center" as const,
  },
  channelNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  channelName: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
  },
  subscriberCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  actionRow: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subscribeBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    alignItems: "center" as const,
  },
  subscribedBtn: {
    backgroundColor: theme.colors.surface,
  },
  subscribeText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  subscribedText: {
    color: theme.colors.text,
  },
  tabsContainer: {
    flexDirection: "row" as const,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center" as const,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: "500" as const,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: "600" as const,
  },
  videoGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    padding: theme.spacing.xs,
  },
  gridItem: {
    width: (width - theme.spacing.xs * 2) / 2,
    padding: theme.spacing.xs,
  },
  gridThumbnail: {
    width: "100%",
    height: 120,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  gridTitle: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  gridViews: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  aboutSection: {
    padding: theme.spacing.md,
  },
  aboutTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  aboutText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  monetizationBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
  },
  monetizationText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.success,
    fontWeight: "600" as const,
  },
  manageSection: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  manageCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "bold" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardDesc: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  requirement: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  requirementText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    alignItems: "center" as const,
    marginTop: theme.spacing.md,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
  earningsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  earningsLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  earningsValue: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: "600" as const,
  },
  tierItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tierName: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: "600" as const,
  },
  tierPrice: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: "600" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "bold" as const,
    color: theme.colors.text,
  },
  modalBody: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  formLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  formHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  formTextArea: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  modalFooter: {
    flexDirection: "row" as const,
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 44,
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonSave: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextCancel: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: theme.colors.text,
  },
  modalButtonTextSave: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: theme.radii.full,
    overflow: "hidden" as const,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePickerPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
  },
  imagePickerText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    textAlign: "center" as const,
  },
  bannerPicker: {
    width: "100%",
    height: 150,
    borderRadius: theme.radii.md,
    overflow: "hidden" as const,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bannerPreview: {
    width: "100%",
    height: "100%",
  },
  bannerPickerPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
  },
});
