import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function CreatorStudioAnalyticsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Performance Analytics"
        subtitle="Deep audience metrics, retention funnels, and growth forecasts are being finalized."
        actionLabel="Back to Studio"
        onActionPress={() => router.push("/creator-studio")}
        testID="creatorAnalyticsComingSoon"
      />
    </SafeAreaView>
  );
}
