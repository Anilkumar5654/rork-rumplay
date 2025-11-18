import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function SuperAdminUsersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Global Account Controls"
        subtitle="Cross-platform governance, escalations, and advanced audit tooling are rolling out soon."
        actionLabel="Back to Super Admin"
        onActionPress={() => router.push("/super-admin")}
        testID="superAdminUsersComingSoon"
      />
    </SafeAreaView>
  );
}
