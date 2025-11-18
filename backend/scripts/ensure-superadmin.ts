import { findUserByEmail, createUser, updateUser } from "../utils/database";
import { SUPER_ADMIN_EMAIL } from "../constants/auth";

const ensureSuperadmin = async () => {
  try {
    const existing = await findUserByEmail(SUPER_ADMIN_EMAIL);
    const newPassword = "SuperAdmin#2025$Secure!xyz";

    if (existing) {
      console.log(`✓ Superadmin user already exists: ${SUPER_ADMIN_EMAIL}`);
      console.log(`  - User ID: ${existing.id}`);
      console.log(`  - Updating password...`);

      await updateUser(existing.id, {
        password: newPassword,
        role: "superadmin",
      });

      console.log(`✓ Password updated successfully`);
      console.log(`  - New Password: ${newPassword}`);
      return existing;
    }

    console.log(`Creating superadmin user: ${SUPER_ADMIN_EMAIL}`);

    const user = await createUser({
      email: SUPER_ADMIN_EMAIL,
      username: "superadmin",
      displayName: "Super Admin",
      password: newPassword,
      role: "superadmin",
    });

    console.log(`✓ Superadmin user created successfully`);
    console.log(`  - User ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Password: ${newPassword}`);

    return user;
  } catch (error) {
    console.error("Error ensuring superadmin:", error);
    throw error;
  }
};

ensureSuperadmin().catch((error) => {
  console.error("Failed to ensure superadmin:", error);
});
