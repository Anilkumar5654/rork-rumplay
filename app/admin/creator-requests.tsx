import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function AdminCreatorRequestsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Creator Applications"
        subtitle="Application workflows, verification tasks, and onboarding insights launch soon."
        actionLabel="Back to Admin"
        onActionPress={() => router.push("/admin-dashboard")}
        testID="adminCreatorRequestsComingSoon"
      />
    </SafeAreaView>
  );
}
