import { Tabs, useRouter } from "expo-router";
import { Home, Compass, PlaySquare, Tv, UserCircle } from "lucide-react-native";
import React from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { theme } from "../../constants/theme";
import MiniPlayer from "../../components/MiniPlayer";
import { useAuth } from "../../contexts/AuthContext";
import { useRequireAuth } from "../../hooks/useRequireAuth";

export default function TabLayout() {
  const { authUser, isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const requireAuth = useRequireAuth();

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer} testID="tabs-loading-state">
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600" as const,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="shorts"
          options={{
            title: "Shorts",
            tabBarIcon: ({ color, size }) => <PlaySquare color={color} size={size + 4} />,
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            title: "Subscriptions",
            tabBarIcon: ({ color, size }) => <Tv color={color} size={size} />,
          }}
          listeners={{
            tabPress: (event) => {
              if (!isAuthenticated) {
                event.preventDefault();
                requireAuth({
                  redirectPath: "/(tabs)/subscriptions",
                  reason: "Sign in to view channels you follow.",
                  onAuthenticated: () => {
                    router.push("/(tabs)/subscriptions");
                  },
                });
              }
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => {
              const defaultImage = "https://via.placeholder.com/32/4A5568/FFFFFF?text=U";
              const avatarUri = isAuthenticated && authUser?.avatar ? authUser.avatar : defaultImage;
              
              return (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.profileImage,
                    focused && styles.profileImageActive,
                  ]}
                  testID="tab-profile-avatar"
                />
              );
            },
          }}
          listeners={{
            tabPress: (event) => {
              if (!isAuthenticated) {
                event.preventDefault();
                requireAuth({
                  redirectPath: "/(tabs)/profile",
                  reason: "Sign in to manage your profile.",
                  onAuthenticated: () => {
                    router.push("/(tabs)/profile");
                  },
                });
              }
            },
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  profileImageActive: {
    borderColor: theme.colors.primary,
  },

});
