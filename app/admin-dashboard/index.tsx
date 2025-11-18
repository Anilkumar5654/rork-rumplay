import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldHalf, UserCog, Layers, PlaySquare, Award, Wallet } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const allowedRoles = new Set(['admin', 'superadmin']);

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (authUser && !allowedRoles.has(authUser.role)) {
      router.replace('/(tabs)');
    }
  }, [authUser, isAuthenticated, router]);

  if (!isAuthenticated || !authUser || !allowedRoles.has(authUser.role)) {
    return <View style={styles.gatingContainer} testID="adminDashboardGuard" />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]} testID="adminDashboardScreen">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} testID="adminDashboardHeader">
          <View>
            <Text style={styles.title}>Admin Command Center</Text>
            <Text style={styles.subtitle}>Moderate community activity, empower creators, and keep everything running smoothly.</Text>
          </View>
          <View style={styles.badge} testID="adminRoleBadge">
            <ShieldHalf color={theme.colors.primary} size={20} />
            <Text style={styles.badgeText}>{authUser.role === 'superadmin' ? 'Super Admin' : 'Admin'}</Text>
          </View>
        </View>

        <View style={styles.section} testID="adminManagementSection">
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.grid}>
            <AdminFeature
              testID="manageUsersAction"
              icon={UserCog}
              title="Manage Users"
              description="Edit profiles, handle reports, and adjust roles"
              onPress={() => router.push('/admin/manage-users')}
            />
            <AdminFeature
              testID="manageVideosAction"
              icon={PlaySquare}
              title="Video Library"
              description="Review uploads, enforce policies, remove violations"
              onPress={() => router.push('/admin/manage-videos')}
            />
            <AdminFeature
              testID="creatorRequestsAction"
              icon={Award}
              title="Creator Requests"
              description="Approve new channels and verify identities"
              onPress={() => router.push('/admin/creator-requests')}
            />
            <AdminFeature
              testID="categoriesAction"
              icon={Layers}
              title="Categories"
              description="Curate discovery taxonomy and featured shelves"
              onPress={() => router.push('/admin/categories')}
            />
            <AdminFeature
              testID="monetizationAction"
              icon={Wallet}
              title="Monetization"
              description="Monitor payouts, eligibility, and escalations"
              onPress={() => router.push('/admin/monetization')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface AdminFeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
  testID: string;
}

function AdminFeature({ icon: Icon, title, description, onPress, testID }: AdminFeatureProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} testID={testID}>
      <View style={styles.iconWrapper}>
        <Icon color={theme.colors.primary} size={22} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gatingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.md,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: theme.fontSizes.xxxl,
    color: theme.colors.text,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    maxWidth: 240,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600' as const,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    rowGap: theme.spacing.md,
  },
  card: {
    width: '48%',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: '600' as const,
  },
  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 18,
  },
});
