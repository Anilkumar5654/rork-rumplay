import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function AdminManageUsersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="User Management Hub"
        subtitle="Granular moderation tools and audit trails are almost ready. Thanks for your patience while we finalize the experience."
        actionLabel="Back to Admin"
        onActionPress={() => router.push("/admin-dashboard")}
        testID="adminManageUsersComingSoon"
      />
    </SafeAreaView>
  );
}
