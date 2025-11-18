import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "@/contexts/AppStateContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="register" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="search" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="admin" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="shorts-feed" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="video/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="channel/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="shorts/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="upload" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="playlist/[id]" options={{ headerShown: false, presentation: "card" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log("RootLayout ready");
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <AppStateProvider>
              <PlayerProvider>
                <View style={{ flex: 1 }}>
                  <RootLayoutNav />
                </View>
              </PlayerProvider>
            </AppStateProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
