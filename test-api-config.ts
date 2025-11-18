import { getEnvApiBaseUrl, getEnvApiRootUrl, getEnvTrpcEndpoint, getEnvUploadEndpoint } from "./utils/env";

console.log("======================================");
console.log("API Configuration Test");
console.log("======================================\n");

console.log("1. Environment Variables:");
console.log("   EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL || "(not set)");
console.log("");

console.log("2. Resolved URLs:");
console.log("   Base URL:", getEnvApiBaseUrl());
console.log("   API Root:", getEnvApiRootUrl());
console.log("   tRPC Endpoint:", getEnvTrpcEndpoint());
console.log("   Upload Endpoint:", getEnvUploadEndpoint());
console.log("");

console.log("3. Testing API Health Endpoint...");

async function testApiHealth() {
  const healthUrl = `${getEnvApiRootUrl()}/health`;
  
  try {
    console.log(`   Fetching: ${healthUrl}`);
    const response = await fetch(healthUrl);
    
    console.log(`   Response status: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get("content-type");
    console.log(`   Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes("application/json")) {
      console.error("   ❌ ERROR: Response is not JSON!");
      const text = await response.text();
      console.error("   Response body:", text.substring(0, 500));
      
      console.error("\n💡 Fix: Backend is not running or returning HTML instead of JSON");
      console.error("   1. Make sure to run: bun run start");
      console.error("   2. Check that backend/hono.ts is being served");
      console.error("   3. Verify EXPO_PUBLIC_API_URL points to the correct dev server");
      return false;
    }
    
    const data = await response.json();
    console.log("   Response data:", JSON.stringify(data, null, 2));
    
    if (data.status === "ok") {
      console.log("\n✅ SUCCESS! API is responding correctly with JSON!");
      return true;
    } else {
      console.error("\n❌ ERROR: Unexpected response from API");
      return false;
    }
  } catch (error) {
    console.error("\n❌ FAILED! Cannot connect to API:");
    if (error instanceof Error) {
      console.error("   Error:", error.message);
      
      if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        console.error("\n💡 Fix: Backend server is not running");
        console.error("   Run: bun run start");
        console.error("   This will start both the frontend and backend");
      }
    }
    return false;
  }
}

async function testLoginEndpoint() {
  console.log("\n4. Testing Login Endpoint...");
  const loginUrl = `${getEnvApiRootUrl()}/auth/login`;
  
  try {
    console.log(`   Posting to: ${loginUrl}`);
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "test123"
      })
    });
    
    console.log(`   Response status: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get("content-type");
    console.log(`   Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes("application/json")) {
      console.error("   ❌ ERROR: Login endpoint is not returning JSON!");
      const text = await response.text();
      console.error("   Response body:", text.substring(0, 500));
      return false;
    }
    
    const data = await response.json();
    console.log("   Response data:", JSON.stringify(data, null, 2));
    console.log("\n✅ Login endpoint is responding with JSON (credentials invalid as expected)");
    return true;
  } catch (error) {
    console.error("\n❌ FAILED! Login endpoint error:");
    if (error instanceof Error) {
      console.error("   Error:", error.message);
    }
    return false;
  }
}

async function runAllTests() {
  console.log("======================================\n");
  
  const healthOk = await testApiHealth();
  if (!healthOk) {
    console.error("\n⚠️  Health check failed. Skipping remaining tests.");
    process.exit(1);
  }
  
  const loginOk = await testLoginEndpoint();
  
  console.log("\n======================================");
  console.log("Test Summary:");
  console.log("======================================");
  console.log("Health Endpoint:", healthOk ? "✅ PASS" : "❌ FAIL");
  console.log("Login Endpoint:", loginOk ? "✅ PASS" : "❌ FAIL");
  console.log("======================================\n");
  
  if (healthOk && loginOk) {
    console.log("🎉 All API tests passed! Your backend is configured correctly.\n");
    console.log("Next steps:");
    console.log("1. Run: bun run start");
    console.log("2. Open your app in Expo Go");
    console.log("3. Try logging in or registering");
    process.exit(0);
  } else {
    console.error("❌ Some tests failed. Please fix the issues above.\n");
    process.exit(1);
  }
}

runAllTests();
