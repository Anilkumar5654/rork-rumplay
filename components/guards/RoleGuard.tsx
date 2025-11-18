import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import type { UserRole } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { theme } from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});

type RoleGuardProps = {
  allowedRoles?: UserRole[];
  enforceAuth?: boolean;
  fallbackPath?: string;
  children: ReactNode;
  testID?: string;
};

const RoleGuard = ({ allowedRoles, enforceAuth = true, fallbackPath = "/(tabs)/home", children, testID }: RoleGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthLoading, isAuthenticated, authUser } = useAuth();

  const isRoleAllowed = useMemo(() => {
    if (!allowedRoles || !authUser) {
      return true;
    }

    return allowedRoles.includes(authUser.role);
  }, [allowedRoles, authUser]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated && enforceAuth) {
      router.replace({ pathname: "/login", params: { redirect: pathname } });
      return;
    }

    if (isAuthenticated && enforceAuth && !isRoleAllowed) {
      router.replace(fallbackPath);
    }
  }, [enforceAuth, fallbackPath, isAuthenticated, isAuthLoading, isRoleAllowed, pathname, router]);

  if (isAuthLoading) {
    return (
      <View style={styles.container} testID={testID ? `${testID}-loading` : undefined}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (enforceAuth && (!isAuthenticated || !isRoleAllowed)) {
    return <View style={styles.container} testID={testID ? `${testID}-restricted` : undefined} />;
  }

  return <>{children}</>;
};

export const UserGuard = ({ children, testID }: { children: ReactNode; testID?: string }) => (
  <RoleGuard allowedRoles={["user", "creator", "admin", "superadmin"]} enforceAuth testID={testID}>
    {children}
  </RoleGuard>
);

export const CreatorGuard = ({ children, testID }: { children: ReactNode; testID?: string }) => (
  <RoleGuard allowedRoles={["creator", "admin", "superadmin"]} enforceAuth testID={testID}>
    {children}
  </RoleGuard>
);

export const AdminGuard = ({ children, testID }: { children: ReactNode; testID?: string }) => (
  <RoleGuard allowedRoles={["admin", "superadmin"]} enforceAuth testID={testID}>
    {children}
  </RoleGuard>
);

export const SuperAdminGuard = ({ children, testID }: { children: ReactNode; testID?: string }) => (
  <RoleGuard allowedRoles={["superadmin"]} enforceAuth fallbackPath="/admin-dashboard" testID={testID}>
    {children}
  </RoleGuard>
);

export default RoleGuard;
