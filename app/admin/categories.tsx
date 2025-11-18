import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ComingSoonScreen from "../../components/ComingSoonScreen";
import { theme } from "../../constants/theme";

export default function AdminCategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Discovery Categories"
        subtitle="Curated shelves and taxonomy management are being crafted for a seamless rollout."
        actionLabel="Back to Admin"
        onActionPress={() => router.push("/admin-dashboard")}
        testID="adminCategoriesComingSoon"
      />
    </SafeAreaView>
  );
}
