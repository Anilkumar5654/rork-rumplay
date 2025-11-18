#!/usr/bin/env node

const API_URL = 'https://moviedbr.com';
const API_ROOT_ENDPOINT = 'https://moviedbr.com/';
const API_HEALTH_ENDPOINT = 'https://moviedbr.com/api/health';
const API_TRPC_ENDPOINT = 'https://moviedbr.com/api/trpc';

console.log('='.repeat(60));
console.log('Backend Connectivity Test');
console.log('='.repeat(60));
console.log();

async function testEndpoint(name, url) {
  try {
    console.log(`Testing ${name}...`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    const text = await response.text();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    try {
      const json = JSON.parse(text);
      console.log('Response:', JSON.stringify(json, null, 2));
      console.log('✅ Success - Endpoint is working!\n');
      return true;
    } catch (_e) {
      console.log('Response (first 200 chars):', text.substring(0, 200));
      console.log('❌ Error - Expected JSON but got:', typeof text);
      console.log('   This usually means the server is returning an error page.\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    console.log('   The backend server is likely not running or not accessible.\n');
    return false;
  }
}

async function runTests() {
  console.log(`API Base URL: ${API_URL}\n`);
  
  const results = {
    root: await testEndpoint('Root Endpoint', API_ROOT_ENDPOINT),
    health: await testEndpoint('Health Check', API_HEALTH_ENDPOINT),
    trpc: await testEndpoint('tRPC Endpoint', API_TRPC_ENDPOINT),
  };
  
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log();
  
  if (Object.values(results).every(r => r)) {
    console.log('🎉 All tests passed! Backend is ready.');
  } else if (results.root) {
    console.log('⚠️  Backend is running but some endpoints failed.');
    console.log('   Check backend logs for errors.');
  } else {
    console.log('❌ Backend is not accessible.');
    console.log('   Make sure the backend server is running on port 8787.');
    console.log();
    console.log('How to start the backend:');
    console.log('1. Check if backend code exists in the backend/ directory');
    console.log('2. The backend should auto-start with the Expo dev server');
    console.log('3. Look for "Backend server started on port 8787" in logs');
  }
  
  console.log();
  console.log('Next Steps:');
  console.log('1. If backend is not running, check your project setup');
  console.log('2. If backend is on a different port, update .env file');
  console.log('3. If using a physical device, use your local IP instead of localhost');
  console.log('4. Check firewall settings if connection times out');
}

runTests().catch(console.error);
