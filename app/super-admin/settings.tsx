import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function SuperAdminSettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Platform Settings"
        subtitle="System policies, thresholds, and platform-wide toggles will arrive in an upcoming release."
        actionLabel="Back to Super Admin"
        onActionPress={() => router.push("/super-admin")}
        testID="superAdminSettingsComingSoon"
      />
    </SafeAreaView>
  );
}
