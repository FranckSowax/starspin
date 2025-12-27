#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🚀 StarSpin - Supabase Database Setup\n');

// Supabase credentials
const supabaseUrl = 'https://egemjezgejptazoucwci.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZW1qZXpnZWpwdGF6b3Vjd2NpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc4NjA1OSwiZXhwIjoyMDgyMzYyMDU5fQ.HJJStxiUl5BoGF6VFqWsDC6uFHKemB27A4fTVKCfgcI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.from('_').select('*').limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n⚠️  Could not verify connection.');
  }
  
  console.log('📋 Next steps:');
  console.log('');
  console.log('1. Open Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/egemjezgejptazoucwci');
  console.log('');
  console.log('2. Go to SQL Editor (left sidebar)');
  console.log('');
  console.log('3. Create a new query and paste the content from:');
  console.log('   supabase/schema.sql');
  console.log('');
  console.log('4. Run the query to create all tables');
  console.log('');
  console.log('5. Then run: npm run dev');
  console.log('');
  console.log('✨ Your StarSpin database will be ready!');
}

main();
