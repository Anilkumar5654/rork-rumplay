import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function SuperAdminContentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Platform-Wide Content"
        subtitle="Universal content controls, takedown workflows, and archive tooling launch shortly."
        actionLabel="Back to Super Admin"
        onActionPress={() => router.push("/super-admin")}
        testID="superAdminContentComingSoon"
      />
    </SafeAreaView>
  );
}
