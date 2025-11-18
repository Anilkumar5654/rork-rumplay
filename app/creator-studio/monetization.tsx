import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function CreatorStudioMonetizationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Creator Monetization"
        subtitle="Real-time earnings dashboards, sponsorship insights, and payout controls are almost ready."
        actionLabel="Back to Studio"
        onActionPress={() => router.push("/creator-studio")}
        testID="creatorMonetizationComingSoon"
      />
    </SafeAreaView>
  );
}
