// Load environment variables - prioritize .env.local over .env
const fs = require('fs');
const path = require('path');

// Try to load .env.local first, then .env
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, 'utf8');
  envLocal.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[match[1].trim()] = value;
    }
  });
}

// Fallback to .env if .env.local doesn't have DATABASE_URL
if (!process.env.DATABASE_URL && fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[match[1].trim()] = value;
    }
  });
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL is not set in your environment variables.');
    console.log('Please add it to your .env.local file.');
    process.exit(1);
  }

  // Extract connection info
  const url = process.env.DATABASE_URL;
  const hostMatch = url.match(/@([^:]+):(\d+)/);
  if (hostMatch) {
    console.log('Host:', hostMatch[1]);
    console.log('Port:', hostMatch[2]);
  }

  try {
    console.log('\n⏳ Attempting to connect...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting steps:');
      console.log('1. Check if your Neon database is active:');
      console.log('   → Go to https://neon.tech/dashboard');
      console.log('   → Select your project');
      console.log('   → Verify the database is running (Neon wakes up quickly if paused)\n');
      
      console.log('2. Verify your DATABASE_URL format:');
      console.log('   Neon connection: postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require\n');
      
      console.log('3. Get your connection string from Neon:');
      console.log('   → Go to Neon Dashboard → Your Project');
      console.log('   → Copy the connection string from the project overview\n');
      
      console.log('4. Check your connection string is correct:');
      console.log('   → Ensure it includes ?sslmode=require');
      console.log('   → Verify username and password are correct');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

