import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";

export default function PlaylistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Playlist Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  text: {
    color: theme.colors.text,
    fontSize: 18,
  },
});
