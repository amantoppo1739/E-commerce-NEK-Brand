/**
 * Neon Database Setup Helper
 * This script helps verify your Neon connection and setup
 */

// Load environment variables - prioritize .env.local over .env
const fs = require('fs');
const path = require('path');

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

async function setupNeon() {
  console.log('🚀 Neon Database Setup Helper\n');
  console.log('='.repeat(50));
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in your environment variables.');
    console.log('\n📝 Steps to fix:');
    console.log('1. Create a Neon account at https://neon.tech');
    console.log('2. Create a new project');
    console.log('3. Copy the connection string from the project dashboard');
    console.log('4. Add it to your .env.local file:');
    console.log('   DATABASE_URL="postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  const isNeon = dbUrl.includes('neon.tech');

  console.log('📋 Connection Details:');
  console.log(`   Provider: ${isNeon ? '✅ Neon' : '❓ Unknown (should be Neon)'}`);
  
  const hostMatch = dbUrl.match(/@([^:]+):/);
  if (hostMatch) {
    console.log(`   Host: ${hostMatch[1]}`);
  }

  // Test connection
  console.log('\n🔍 Testing connection...');
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;
    
    console.log(`✅ Connection successful! (${duration}ms)`);
    console.log('\n📊 Next steps:');
    console.log('1. Push your schema: npm run db:push');
    console.log('2. Seed your database: npm run db:seed');
    console.log('3. Update DATABASE_URL in Vercel environment variables');
    console.log('4. Redeploy on Vercel');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Verify your connection string is correct');
      console.log('2. Check that your Neon database is active');
      console.log('3. Ensure SSL is enabled (sslmode=require)');
      console.log('4. Check Neon dashboard for any errors');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupNeon();

