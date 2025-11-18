import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export type RequireAuthOptions = {
  redirectPath?: string;
  reason?: string;
  onAuthenticated?: () => void;
};

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPrompting, setIsPrompting] = useState(false);

  return useCallback(
    ({ redirectPath, reason, onAuthenticated }: RequireAuthOptions = {}) => {
      if (isAuthenticated) {
        onAuthenticated?.();
        return true;
      }

      if (isPrompting) {
        return false;
      }

      setIsPrompting(true);

      const target = redirectPath ?? pathname ?? "/(tabs)/home";

      const navigateToLogin = () => {
        setIsPrompting(false);
        router.push({ pathname: "/login", params: { redirect: target } });
      };

      if (reason) {
        Alert.alert("Login required", reason, [
          { text: "Cancel", style: "cancel", onPress: () => setIsPrompting(false) },
          { text: "Login", onPress: navigateToLogin },
        ]);
      } else {
        navigateToLogin();
      }

      return false;
    },
    [isAuthenticated, isPrompting, pathname, router]
  );
}
