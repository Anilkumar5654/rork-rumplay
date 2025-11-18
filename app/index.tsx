import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useRootNavigationState } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../constants/theme";

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isAuthLoading, isAuthenticated, roleDestination } = useAuth();

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }

    if (isAuthLoading) {
      return;
    }

    const targetRoute = isAuthenticated ? (roleDestination ?? "/(tabs)/home") : "/(tabs)/home";
    
    const timeoutId = setTimeout(() => {
      router.replace(targetRoute);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [navigationState?.key, isAuthLoading, isAuthenticated, roleDestination, router]);

  return (
    <SafeAreaView style={styles.container} testID="index-boot-screen">
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
