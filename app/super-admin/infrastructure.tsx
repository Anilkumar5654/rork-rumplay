import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function SuperAdminInfrastructureScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Infrastructure Monitor"
        subtitle="Real-time infrastructure telemetry and failover controls are undergoing final testing."
        actionLabel="Back to Super Admin"
        onActionPress={() => router.push("/super-admin")}
        testID="superAdminInfrastructureComingSoon"
      />
    </SafeAreaView>
  );
}
