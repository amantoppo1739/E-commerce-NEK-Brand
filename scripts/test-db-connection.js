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
      console.log('1. Check if your Supabase database is paused:');
      console.log('   → Go to https://supabase.com/dashboard');
      console.log('   → Select your project');
      console.log('   → Go to Settings → Database');
      console.log('   → Click "Restore" or "Wake up" if paused\n');
      
      console.log('2. Verify your DATABASE_URL format:');
      console.log('   Direct connection: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres');
      console.log('   Pooler connection: postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true\n');
      
      console.log('3. Try using the direct connection string instead of pooler:');
      console.log('   → Go to Supabase Dashboard → Settings → Database');
      console.log('   → Copy the "Connection string" (not "Connection pooling")\n');
      
      console.log('4. Check your database password is correct in the connection string');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

