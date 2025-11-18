import React, { Component, ReactNode, ErrorInfo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/constants/theme";

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ScreenErrorBoundary extends Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  public constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ScreenErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ScreenErrorBoundary captured error", error, info);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private getDisplayMessage = (): string => {
    const rawMessage = this.state.error?.message ?? "";
    if (!rawMessage) {
      return "We hit an unexpected issue while loading this screen.";
    }
    const normalized = rawMessage.toLowerCase();
    if (normalized.includes("multipart") && normalized.includes("response")) {
      return "Live reload stream broke. Restart the Expo dev server or reload the app to continue.";
    }
    if (normalized.includes("network request failed")) {
      return "Network request failed. Confirm the device and dev server share the same network or use tunnel mode.";
    }
    return rawMessage;
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback} testID="screen-error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.getDisplayMessage()}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleReset}
            activeOpacity={0.85}
            testID="screen-error-retry"
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: "700" as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: theme.fontSizes.md,
    fontWeight: "600" as const,
  },
});
