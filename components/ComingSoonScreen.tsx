import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Clock, Sparkles } from "lucide-react-native";
import { theme } from "../constants/theme";

type ComingSoonScreenProps = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  testID?: string;
};

export default function ComingSoonScreen({
  title = "Coming Soon",
  subtitle = "We are crafting an elevated experience here. Check back shortly.",
  actionLabel = "Back to Home",
  onActionPress,
  testID = "comingSoonScreen",
}: ComingSoonScreenProps) {
  const router = useRouter();

  const handleActionPress = () => {
    if (onActionPress) {
      onActionPress();
      return;
    }
    router.push("/(tabs)/home");
  };

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.glow} />
      <View style={styles.contentCard}>
        <View style={styles.badge}>
          <Sparkles color={theme.colors.primary} size={28} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.statusPill}>
          <Clock color={theme.colors.primary} size={18} />
          <Text style={styles.statusText}>In active development</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleActionPress} activeOpacity={0.85} testID={`${testID}-action`}>
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: `${theme.colors.primary}20`,
    opacity: 0.75,
  },
  contentCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSizes.xxxl,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}15`,
  },
  statusText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: theme.spacing.sm,
    width: "100%",
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.md,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
