import React, { useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Video as VideoIcon,
  Tv,
  DollarSign,
  Trash2,
  Edit,
  Shield,
  Search,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAppState } from '@/contexts/AppStateContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Video, Channel, UserRole } from '@/types';

type Tab = 'users' | 'videos' | 'channels' | 'monetization';

export default function AdminPanelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videos, channels, users, deleteVideo, updateVideo, updateChannel } = useAppState();
  const { authUser, isSuperAdmin } = useAuth();
  const [selectedTab, setSelectedTab] = useState<Tab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        v.channelName.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;
    const query = searchQuery.toLowerCase();
    return channels.filter((ch) => ch.name.toLowerCase().includes(query));
  }, [channels, searchQuery]);

  if (!isSuperAdmin()) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <View style={styles.accessDenied}>
          <Shield color={theme.colors.textSecondary} size={64} />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            Only Super Admins can access this panel
          </Text>
        </View>
      </View>
    );
  }

  const handleDeleteVideo = (video: Video) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVideo(video.id);
            Alert.alert('Success', 'Video deleted successfully');
          },
        },
      ]
    );
  };

  const handleChangeVisibility = (video: Video) => {
    const visibilityOptions: ('public' | 'private' | 'unlisted' | 'scheduled')[] = [
      'public',
      'private',
      'unlisted',
      'scheduled',
    ];

    Alert.alert(
      'Change Visibility',
      `Current: ${video.visibility || 'public'}`,
      visibilityOptions.map((vis) => ({
        text: vis.charAt(0).toUpperCase() + vis.slice(1),
        onPress: async () => {
          await updateVideo(video.id, { visibility: vis });
          Alert.alert('Success', `Visibility changed to ${vis}`);
        },
      }))
    );
  };

  const handleChangeUserRole = async (user: User, newRole: UserRole) => {
    Alert.alert(
      'Change User Role',
      `Change ${user.username}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            const usersData = await AsyncStorage.getItem('playtube_users');
            if (usersData) {
              const allUsers: User[] = JSON.parse(usersData);
              const updatedUsers = allUsers.map((u) =>
                u.id === user.id ? { ...u, role: newRole } : u
              );
              await AsyncStorage.setItem('playtube_users', JSON.stringify(updatedUsers));
              Alert.alert('Success', `Role changed to ${newRole}`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === authUser?.id) {
      Alert.alert('Error', 'You cannot delete your own account from here');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const usersData = await AsyncStorage.getItem('playtube_users');
            if (usersData) {
              const allUsers: User[] = JSON.parse(usersData);
              const updatedUsers = allUsers.filter((u) => u.id !== user.id);
              await AsyncStorage.setItem('playtube_users', JSON.stringify(updatedUsers));
              Alert.alert('Success', 'User deleted successfully');
            }
          },
        },
      ]
    );
  };

  const handleToggleMonetization = (channel: Channel) => {
    Alert.alert(
      'Toggle Monetization',
      `${channel.monetization.enabled ? 'Disable' : 'Enable'} monetization for ${channel.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: channel.monetization.enabled ? 'Disable' : 'Enable',
          onPress: async () => {
            await updateChannel(channel.id, {
              monetization: {
                ...channel.monetization,
                enabled: !channel.monetization.enabled,
                enabledAt: !channel.monetization.enabled
                  ? new Date().toISOString()
                  : channel.monetization.enabledAt,
              },
            });
            Alert.alert(
              'Success',
              `Monetization ${channel.monetization.enabled ? 'disabled' : 'enabled'}`
            );
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'videos', label: 'Videos', icon: VideoIcon, count: videos.length },
    { id: 'channels', label: 'Channels', icon: Tv, count: channels.length },
    { id: 'monetization', label: 'Monetization', icon: DollarSign, count: null },
  ];

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.superAdminBadge}>
          <Shield color="#FFD700" size={16} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search color={theme.colors.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabs}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(tab.id as Tab)}
            >
              <Icon
                color={
                  selectedTab === tab.id
                    ? '#FFFFFF'
                    : theme.colors.text
                }
                size={20}
              />
              <Text
                style={[
                  styles.tabLabel,
                  selectedTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== null && (
                <View style={styles.tabCount}>
                  <Text style={styles.tabCountText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'users' && (
          <View style={styles.section}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.displayName}</Text>
                  <Text style={styles.userMeta}>
                    @{user.username} • {user.email}
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setEditingUser(user);
                      setRoleModalVisible(true);
                    }}
                  >
                    <Shield color={theme.colors.primary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <Trash2 color={theme.colors.error} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'videos' && (
          <View style={styles.section}>
            {filteredVideos.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={styles.videoMeta}>
                    {video.channelName} • {formatViews(video.views)} views
                  </Text>
                  <View style={styles.visibilityContainer}>
                    <Text style={styles.visibilityLabel}>
                      Visibility: {video.visibility || 'public'}
                    </Text>
                  </View>
                </View>
                <View style={styles.videoActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleChangeVisibility(video)}
                  >
                    <Edit color={theme.colors.primary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteVideo(video)}
                  >
                    <Trash2 color={theme.colors.error} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'channels' && (
          <View style={styles.section}>
            {filteredChannels.map((channel) => (
              <View key={channel.id} style={styles.channelCard}>
                <Image source={{ uri: channel.avatar }} style={styles.channelAvatar} />
                <View style={styles.channelInfo}>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.channelMeta}>
                    {formatViews(channel.subscriberCount)} subscribers • {formatViews(channel.totalViews)} views
                  </Text>
                  <Text style={styles.channelMeta}>
                    Monetization: {channel.monetization.enabled ? '✅ Enabled' : '❌ Disabled'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.monetizationButton}
                  onPress={() => handleToggleMonetization(channel)}
                >
                  <DollarSign
                    color={
                      channel.monetization.enabled
                        ? theme.colors.success
                        : theme.colors.textSecondary
                    }
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'monetization' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monetization Overview</Text>
            {channels
              .filter((ch) => ch.monetization.enabled)
              .map((channel) => (
                <View key={channel.id} style={styles.monetizationCard}>
                  <Text style={styles.monetizationChannelName}>{channel.name}</Text>
                  <View style={styles.monetizationStats}>
                    <View style={styles.monetizationStatItem}>
                      <Text style={styles.monetizationStatValue}>
                        ${channel.monetization.earnings.total.toFixed(2)}
                      </Text>
                      <Text style={styles.monetizationStatLabel}>Total Earnings</Text>
                    </View>
                    <View style={styles.monetizationStatItem}>
                      <Text style={styles.monetizationStatValue}>
                        ${channel.monetization.earnings.monthly.toFixed(2)}
                      </Text>
                      <Text style={styles.monetizationStatLabel}>Monthly</Text>
                    </View>
                    <View style={styles.monetizationStatItem}>
                      <Text style={styles.monetizationStatValue}>
                        ${channel.monetization.estimatedRPM.toFixed(2)}
                      </Text>
                      <Text style={styles.monetizationStatLabel}>RPM</Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={roleModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change User Role</Text>
            <Text style={styles.modalSubtitle}>
              {editingUser?.username} ({editingUser?.role})
            </Text>
            <View style={styles.roleOptions}>
              {(['user', 'admin', 'superadmin'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    editingUser?.role === role && styles.roleOptionActive,
                  ]}
                  onPress={() => {
                    if (editingUser) {
                      handleChangeUserRole(editingUser, role);
                      setRoleModalVisible(false);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      editingUser?.role === role && styles.roleOptionTextActive,
                    ]}
                  >
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center' as const,
    marginHorizontal: theme.spacing.md,
  },
  superAdminBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabs: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  tabCountText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  userCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  userName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  userActions: {
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  videoCard: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
  },
  videoThumbnail: {
    width: 120,
    height: 68,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.border,
  },
  videoInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  videoTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  visibilityContainer: {
    marginTop: 4,
  },
  visibilityLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    fontWeight: '600' as const,
  },
  videoActions: {
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  channelCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.sm,
  },
  channelAvatar: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border,
  },
  channelInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  channelName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  channelMeta: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  monetizationButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  monetizationCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.md,
  },
  monetizationChannelName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  monetizationStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  monetizationStatItem: {
    alignItems: 'center' as const,
  },
  monetizationStatValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.success,
    marginBottom: 4,
  },
  monetizationStatLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: theme.spacing.xl,
  },
  accessDeniedText: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  accessDeniedSubtext: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center' as const,
  },
  modalSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center' as const,
  },
  roleOptions: {
    gap: theme.spacing.sm,
  },
  roleOption: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  roleOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  roleOptionText: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
  },
  roleOptionTextActive: {
    color: theme.colors.primary,
  },
  modalCancelButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background,
  },
  modalCancelText: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
  },
});
