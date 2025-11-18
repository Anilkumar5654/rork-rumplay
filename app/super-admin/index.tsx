import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Settings2, Users2, PlaySquare, Crown, Database, LogOut } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { SuperAdminGuard } from '../../components/guards/RoleGuard';

export default function SuperAdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SuperAdminGuard testID="superAdminGuard">
      <View style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]} testID="superAdminPanel">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} testID="superAdminHeader">
          <Text style={styles.title}>Super Admin Control</Text>
          <Text style={styles.subtitle}>Oversee every dimension of the platform. Fine-tune policies, manage roles, and keep the ecosystem thriving.</Text>
        </View>

        <View style={styles.section} testID="globalControlsSection">
          <Text style={styles.sectionTitle}>Global Controls</Text>
          <View style={styles.grid}>
            <ControlCard
              testID="userControlAction"
              icon={Users2}
              title="All Accounts"
              description="Promote, demote, ban, and review user journeys"
              onPress={() => router.push('/super-admin/users')}
            />
            <ControlCard
              testID="contentControlAction"
              icon={PlaySquare}
              title="All Content"
              description="Edit, remove, or spotlight any video or short"
              onPress={() => router.push('/super-admin/content')}
            />
            <ControlCard
              testID="roleControlAction"
              icon={Crown}
              title="Role Assignment"
              description="Grant admin privileges and manage hierarchy"
              onPress={() => router.push('/super-admin/roles')}
            />
            <ControlCard
              testID="settingsControlAction"
              icon={Settings2}
              title="App Settings"
              description="Adjust platform-wide policies and thresholds"
              onPress={() => router.push('/super-admin/settings')}
            />
            <ControlCard
              testID="infraControlAction"
              icon={Database}
              title="Infrastructure"
              description="Monitor database, backups, logs, and health"
              onPress={() => router.push('/super-admin/infrastructure')}
            />
            <ControlCard
              testID="broadcastControlAction"
              icon={Globe}
              title="System Broadcasts"
              description="Send updates or incidents to all users"
              onPress={() => router.push('/super-admin/broadcasts')}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          activeOpacity={0.85}
          testID="superAdminLogout"
        >
          <LogOut color={theme.colors.error} size={20} />
          <Text style={styles.logoutText}>Sign out of Super Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </SuperAdminGuard>
  );
}

interface ControlCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
  testID: string;
}

function ControlCard({ icon: Icon, title, description, onPress, testID }: ControlCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} testID={testID}>
      <View style={styles.cardIcon}>
        <Icon color={theme.colors.primary} size={24} />
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
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSizes.xxxl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
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
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.md,
    fontWeight: '600' as const,
  },
});
