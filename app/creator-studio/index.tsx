import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { BarChart3, Camera, DollarSign, LineChart, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { CreatorGuard } from '../../components/guards/RoleGuard';

export default function CreatorStudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <CreatorGuard testID="creatorStudioGuard">
      <View style={[styles.container, { paddingTop: insets.top + theme.spacing.md }]} testID="creatorStudioScreen">
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header} testID="creatorStudioHeader">
            <Text style={styles.title}>Creator Studio</Text>
            <Text style={styles.subtitle}>Craft outstanding content and track your channel growth.</Text>
          </View>

          <View style={styles.section} testID="creatorQuickActions">
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <FeatureCard
                testID="uploadVideoAction"
                icon={Camera}
                title="Upload Video"
                description="Share a new story with the community"
                onPress={() => router.push('/upload')}
              />
              <FeatureCard
                testID="manageVideosAction"
                icon={Settings}
                title="Manage Library"
                description="Edit titles, metadata, and monetization"
                onPress={() => router.push('/profile')}
              />
              <FeatureCard
                testID="monetizationAction"
                icon={DollarSign}
                title="Monetization"
                description="Check earnings and optimize revenue"
                onPress={() => router.push('/creator-studio/monetization')}
              />
              <FeatureCard
                testID="analyticsAction"
                icon={BarChart3}
                title="Analytics"
                description="Understand how audiences engage with videos"
                onPress={() => router.push('/creator-studio/analytics')}
              />
            </View>
          </View>

          <View style={styles.section} testID="creatorInsights">
            <Text style={styles.sectionTitle}>Today’s Snapshot</Text>
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotRow}>
                <LineChart color={theme.colors.primary} size={24} />
                <View style={styles.snapshotTextGroup}>
                  <Text style={styles.snapshotValue}>12.4K</Text>
                  <Text style={styles.snapshotLabel}>Views in the last 48 hours</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.snapshotRow}>
                <DollarSign color={theme.colors.primary} size={24} />
                <View style={styles.snapshotTextGroup}>
                  <Text style={styles.snapshotValue}>$342.18</Text>
                  <Text style={styles.snapshotLabel}>Estimated revenue this month</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </CreatorGuard>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
  testID: string;
}

function FeatureCard({ icon: Icon, title, description, onPress, testID }: FeatureCardProps) {
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
    color: theme.colors.text,
    fontWeight: '700' as const,
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
  actionsGrid: {
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
    fontSize: theme.fontSizes.lg,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  snapshotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  snapshotRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.md,
  },
  snapshotTextGroup: {
    gap: 4,
    flex: 1,
  },
  snapshotValue: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  snapshotLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
