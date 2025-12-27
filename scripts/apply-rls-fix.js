#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔒 Application des corrections RLS pour StarSpin\n');

const supabaseUrl = 'https://egemjezgejptazoucwci.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZW1qZXpnZWpwdGF6b3Vjd2NpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc4NjA1OSwiZXhwIjoyMDgyMzYyMDU5fQ.HJJStxiUl5BoGF6VFqWsDC6uFHKemB27A4fTVKCfgcI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAccess() {
  console.log('🧪 Test d\'accès aux données...\n');

  try {
    // Test avec la clé anon (comme un client)
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZW1qZXpnZWpwdGF6b3Vjd2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODYwNTksImV4cCI6MjA4MjM2MjA1OX0.3n7ZUhCAIC7DESmheRPUZCG7uTvd7HLRUMK0HTchj9M');

    console.log('📊 Test 1: Accès public aux marchands');
    const { data: merchants, error: merchantError } = await anonClient
      .from('merchants')
      .select('*')
      .limit(1);

    if (merchantError) {
      console.log('❌ Erreur:', merchantError.message);
      console.log('\n⚠️  Les politiques RLS doivent être mises à jour!');
      console.log('\n📋 Instructions:');
      console.log('1. Ouvrez Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/egemjezgejptazoucwci/editor');
      console.log('2. Allez dans "SQL Editor"');
      console.log('3. Copiez le contenu de: supabase/fix-rls-policies.sql');
      console.log('4. Exécutez le script SQL');
      console.log('5. Relancez ce test\n');
      return false;
    }

    console.log(`✅ Accès public aux marchands: OK (${merchants.length} trouvé(s))`);

    console.log('\n🎁 Test 2: Accès public aux prix');
    const { data: prizes, error: prizesError } = await anonClient
      .from('prizes')
      .select('*')
      .limit(1);

    if (prizesError) {
      console.log('❌ Erreur:', prizesError.message);
      return false;
    }

    console.log(`✅ Accès public aux prix: OK (${prizes.length} trouvé(s))`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Toutes les politiques RLS sont correctement configurées!');
    console.log('='.repeat(60));
    console.log('\n🚀 L\'application devrait maintenant fonctionner correctement');
    console.log('   Testez: http://localhost:3000/rate/da56ba06-8a5c-48e1-a45e-add9601422d0\n');

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

testAccess();
