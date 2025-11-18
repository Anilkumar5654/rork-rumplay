import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function AdminManageVideosScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Video Library Review"
        subtitle="Powerful compliance tooling for video reviews is almost here. Our moderation dashboard is being polished for release."
        actionLabel="Back to Admin"
        onActionPress={() => router.push("/admin-dashboard")}
        testID="adminManageVideosComingSoon"
      />
    </SafeAreaView>
  );
}
