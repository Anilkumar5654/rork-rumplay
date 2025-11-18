import { createPool, Pool } from "mysql2/promise";

let pool: Pool | null = null;
let connectionTested = false;

const resolveConfig = () => {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const portValue = process.env.DB_PORT;
  
  console.log("[MySQL] Resolving database configuration...");
  console.log("[MySQL] DB_HOST:", host || "(not set)");
  console.log("[MySQL] DB_USER:", user || "(not set)");
  console.log("[MySQL] DB_NAME:", database || "(not set)");
  console.log("[MySQL] DB_PORT:", portValue || "3306 (default)");
  
  if (!host || !user || !password || !database) {
    console.error("[MySQL] ❌ Database configuration incomplete!");
    console.error("[MySQL] Missing values:", {
      host: !host ? "missing" : "ok",
      user: !user ? "missing" : "ok",
      password: !password ? "missing" : "ok",
      database: !database ? "missing" : "ok",
    });
    throw new Error("Database configuration incomplete. Check your env file.");
  }
  
  const port = portValue ? Number(portValue) : 3306;
  if (Number.isNaN(port)) {
    console.error("[MySQL] ❌ Database port must be a number, got:", portValue);
    throw new Error("Database port must be a number");
  }
  
  console.log("[MySQL] ✓ Configuration resolved successfully");
  return { 
    host, 
    user, 
    password, 
    database, 
    port, 
    connectionLimit: 10, 
    namedPlaceholders: true,
    connectTimeout: 10000,
  }; 
};

const testConnection = async (pool: Pool) => {
  if (connectionTested) {
    return;
  }
  
  try {
    console.log("[MySQL] Testing database connection...");
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    connectionTested = true;
    console.log("[MySQL] ✓ Database connection successful!");
  } catch (error) {
    console.error("[MySQL] ❌ Database connection failed!");
    if (error instanceof Error) {
      console.error("[MySQL] Error:", error.message);
      
      if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        console.error("[MySQL] → Cannot reach database server. Check DB_HOST in your env file.");
        console.error("[MySQL] → For Hostinger, use the REMOTE MySQL hostname (e.g., srv1616.hstgr.io)");
        console.error("[MySQL] → NOT 'localhost' unless the backend runs on the same server.");
      } else if (error.message.includes("Access denied")) {
        console.error("[MySQL] → Wrong credentials. Check DB_USER and DB_PASSWORD in your env file.");
      } else if (error.message.includes("Unknown database")) {
        console.error("[MySQL] → Database doesn't exist. Check DB_NAME in your env file.");
      }
    }
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    const config = resolveConfig();
    console.log("[MySQL] Creating connection pool...");
    pool = createPool(config);
    
    void testConnection(pool).catch((error) => {
      console.error("[MySQL] Initial connection test failed:", error);
    });
  }
  return pool;
};

export const closePool = async () => {
  if (pool) {
    console.log("[MySQL] Closing connection pool...");
    await pool.end();
    pool = null;
    connectionTested = false;
    console.log("[MySQL] ✓ Connection pool closed");
  }
};
