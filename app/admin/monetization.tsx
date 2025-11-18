import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function AdminMonetizationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Monetization Console"
        subtitle="Revenue insights, payouts, and compliance reviews are entering final QA before launch."
        actionLabel="Back to Admin"
        onActionPress={() => router.push("/admin-dashboard")}
        testID="adminMonetizationComingSoon"
      />
    </SafeAreaView>
  );
}
