import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function SuperAdminRolesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Role Assignment"
        subtitle="Enterprise-grade role orchestration and conditional permissions are being refined."
        actionLabel="Back to Super Admin"
        onActionPress={() => router.push("/super-admin")}
        testID="superAdminRolesComingSoon"
      />
    </SafeAreaView>
  );
}
