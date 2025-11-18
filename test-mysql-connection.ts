import { getPool } from "./backend/utils/mysqlClient";

console.log("======================================");
console.log("Testing MySQL Remote Connection");
console.log("======================================\n");

async function testConnection() {
  try {
    console.log("1. Getting connection pool...");
    const pool = getPool();
    
    console.log("2. Attempting to execute test query...");
    const [rows] = await pool.query("SELECT 1 as test, NOW() as currentTime");
    
    console.log("✅ SUCCESS! MySQL connection is working!");
    console.log("Test query result:", rows);
    
    console.log("\n3. Testing database schema...");
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Available tables:", tables);
    
    console.log("\n4. Testing users table...");
    const [users] = await pool.query("SELECT COUNT(*) as userCount FROM users");
    console.log("User count:", users);
    
    console.log("\n✅ All database tests passed!");
    console.log("\n======================================");
    console.log("MySQL Configuration Summary:");
    console.log("======================================");
    console.log("Host:", process.env.DB_HOST);
    console.log("Database:", process.env.DB_NAME);
    console.log("User:", process.env.DB_USER);
    console.log("Port:", process.env.DB_PORT || "3306");
    console.log("======================================\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ FAILED! MySQL connection error:");
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("\nStack trace:", error.stack);
      
      if (error.message.includes("ENOTFOUND")) {
        console.error("\n💡 Fix: The hostname cannot be resolved.");
        console.error("   Check that DB_HOST is correct in your env file.");
        console.error("   Current DB_HOST:", process.env.DB_HOST);
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("\n💡 Fix: Connection refused by the server.");
        console.error("   1. Check that the MySQL server is running");
        console.error("   2. Verify the port number (current:", process.env.DB_PORT || "3306", ")");
      } else if (error.message.includes("Access denied")) {
        console.error("\n💡 Fix: Invalid credentials.");
        console.error("   Check DB_USER and DB_PASSWORD in your env file.");
      } else if (error.message.includes("Unknown database")) {
        console.error("\n💡 Fix: Database does not exist.");
        console.error("   Check DB_NAME in your env file.");
        console.error("   Current DB_NAME:", process.env.DB_NAME);
      } else if (error.message.includes("ER_HOST_NOT_PRIVILEGED") || error.message.includes("not allowed to connect")) {
        console.error("\n💡 Fix: Remote access not enabled or IP not whitelisted.");
        console.error("   1. Go to Hostinger cPanel > Remote MySQL");
        console.error("   2. Add '%' to allow all IPs or add your specific IP");
        console.error("   3. Save and try again");
      }
    }
    
    console.error("\n======================================");
    console.error("Current Configuration:");
    console.error("======================================");
    console.error("DB_HOST:", process.env.DB_HOST || "(not set)");
    console.error("DB_NAME:", process.env.DB_NAME || "(not set)");
    console.error("DB_USER:", process.env.DB_USER || "(not set)");
    console.error("DB_PORT:", process.env.DB_PORT || "3306 (default)");
    console.error("======================================\n");
    
    process.exit(1);
  }
}

testConnection();
