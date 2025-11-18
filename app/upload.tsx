import React from "react";
import ComingSoonScreen from "../components/ComingSoonScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";

export default function UploadScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ComingSoonScreen
        title="Upload Studio Refresh"
        subtitle="A richer creator upload experience is on the way. For now, continue sharing via the in-app modal."
        actionLabel="Back to Home"
        testID="uploadComingSoon"
      />
    </SafeAreaView>
  );
}
