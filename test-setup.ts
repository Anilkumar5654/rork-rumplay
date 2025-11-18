#!/usr/bin/env bun

import { getPool } from './backend/utils/mysqlClient.ts';
import { uploadToHostinger } from './backend/utils/hostingerUpload.ts';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
};

console.log('\n' + '='.repeat(60));
console.log('🔍 Testing Backend Setup');
console.log('='.repeat(60) + '\n');

let allPassed = true;

async function testDatabaseConnection() {
  log.info('Testing database connection...');
  
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT 1 as test, NOW() as time');
    
    if (Array.isArray(rows) && rows.length > 0) {
      log.success('Database connection successful');
      console.log(`   Server time: ${(rows[0] as any).time}\n`);
      return true;
    } else {
      log.error('Database query returned unexpected result');
      return false;
    }
  } catch (error) {
    log.error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    console.log('   Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in env file\n');
    return false;
  }
}

async function testDatabaseTables() {
  log.info('Checking database tables...');
  
  try {
    const pool = getPool();
    const [rows] = await pool.query('SHOW TABLES');
    
    if (Array.isArray(rows) && rows.length >= 13) {
      log.success(`Found ${rows.length} tables in database`);
      
      const requiredTables = [
        'roles', 'users', 'sessions', 'channels', 
        'videos', 'video_likes', 'video_comments',
        'shorts', 'short_likes', 'short_comments',
        'subscriptions', 'notifications', 'earnings'
      ];
      
      const tableNames = rows.map((row: any) => Object.values(row)[0] as string);
      const missingTables = requiredTables.filter(t => !tableNames.includes(t));
      
      if (missingTables.length > 0) {
        log.warn(`Missing tables: ${missingTables.join(', ')}`);
        console.log('   Run backend/schema.sql in phpMyAdmin\n');
        return false;
      }
      
      console.log('   All required tables present\n');
      return true;
    } else {
      log.error('Not enough tables found. Expected at least 13 tables.');
      console.log('   Run backend/schema.sql in phpMyAdmin\n');
      return false;
    }
  } catch (error) {
    log.error(`Failed to check tables: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function testFTPConnection() {
  log.info('Testing FTP connection and upload...');
  
  try {
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent, 'utf-8');
    const testFilename = `test-${Date.now()}.txt`;
    
    const result = await uploadToHostinger(testBuffer, 'thumbnails', testFilename);
    
    if (result.success) {
      log.success('FTP upload successful');
      console.log(`   Test file URL: ${result.url}`);
      console.log('   You can delete this test file from Hostinger File Manager\n');
      return true;
    } else {
      log.error(`FTP upload failed: ${result.error}`);
      console.log('   Check HOSTINGER_FTP_HOST, HOSTINGER_FTP_USER, HOSTINGER_FTP_PASSWORD in env file\n');
      return false;
    }
  } catch (error) {
    log.error(`FTP test failed: ${error instanceof Error ? error.message : String(error)}`);
    console.log('   Verify FTP credentials in env file\n');
    return false;
  }
}

async function testEnvironmentVariables() {
  log.info('Checking environment variables...');
  
  const required = {
    'DB_HOST': process.env.DB_HOST,
    'DB_USER': process.env.DB_USER,
    'DB_PASSWORD': process.env.DB_PASSWORD,
    'DB_NAME': process.env.DB_NAME,
    'HOSTINGER_FTP_HOST': process.env.HOSTINGER_FTP_HOST,
    'HOSTINGER_FTP_USER': process.env.HOSTINGER_FTP_USER,
    'HOSTINGER_FTP_PASSWORD': process.env.HOSTINGER_FTP_PASSWORD,
    'PUBLIC_BASE_URL': process.env.PUBLIC_BASE_URL,
  };
  
  const missing: string[] = [];
  const masked: string[] = [];
  
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.includes('your_') || value === '') {
      missing.push(key);
    } else {
      masked.push(key);
    }
  }
  
  if (missing.length > 0) {
    log.error('Missing or unconfigured environment variables:');
    missing.forEach(key => console.log(`   - ${key}`));
    console.log('   Update these in the env file\n');
    return false;
  } else {
    log.success('All environment variables configured');
    console.log(`   Configured: ${masked.length} variables\n`);
    return true;
  }
}

async function runTests() {
  console.log('Starting comprehensive tests...\n');
  
  const envTest = await testEnvironmentVariables();
  allPassed = allPassed && envTest;
  
  if (!envTest) {
    log.error('Environment variables not configured. Please update env file first.\n');
    process.exit(1);
  }
  
  const dbTest = await testDatabaseConnection();
  allPassed = allPassed && dbTest;
  
  if (dbTest) {
    const tablesTest = await testDatabaseTables();
    allPassed = allPassed && tablesTest;
  }
  
  const ftpTest = await testFTPConnection();
  allPassed = allPassed && ftpTest;
  
  console.log('='.repeat(60));
  if (allPassed) {
    log.success('🎉 All tests passed! Your setup is complete and ready to use.');
    console.log('\nYou can now run: bun start');
  } else {
    log.error('⚠️  Some tests failed. Please fix the issues above.');
    console.log('\nSee SETUP_INSTRUCTIONS.md for detailed troubleshooting.');
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch((error) => {
  log.error(`Test script failed: ${error}`);
  process.exit(1);
});
