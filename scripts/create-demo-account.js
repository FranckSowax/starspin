#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🎭 Création d\'un compte démo StarSpin\n');

const supabaseUrl = 'https://egemjezgejptazoucwci.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZW1qZXpnZWpwdGF6b3Vjd2NpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc4NjA1OSwiZXhwIjoyMDgyMzYyMDU5fQ.HJJStxiUl5BoGF6VFqWsDC6uFHKemB27A4fTVKCfgcI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoAccount() {
  try {
    console.log('📧 Création du compte utilisateur...');
    
    // Créer un utilisateur avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@starspin.app',
      password: 'Demo123!',
      email_confirm: true,
      user_metadata: {
        name: 'Demo Account'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Le compte demo@starspin.app existe déjà');
        console.log('   Utilisation du compte existant...\n');
        
        // Récupérer l'utilisateur existant
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'demo@starspin.app');
        
        if (!demoUser) {
          throw new Error('Impossible de trouver le compte démo');
        }

        // Vérifier si le marchand existe
        const { data: existingMerchant } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', demoUser.id)
          .single();

        if (existingMerchant) {
          console.log('✅ Compte démo déjà configuré!\n');
          displayCredentials(existingMerchant);
          return;
        }

        // Créer le marchand pour l'utilisateur existant
        await createMerchant(demoUser.id);
        return;
      }
      throw authError;
    }

    console.log('✅ Utilisateur créé avec succès');
    console.log(`   ID: ${authData.user.id}\n`);

    // Créer le profil marchand
    await createMerchant(authData.user.id);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function createMerchant(userId) {
  console.log('🏪 Création du profil marchand...');
  
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .insert({
      id: userId,
      email: 'demo@starspin.app',
      name: 'Compte Démo',
      business_name: 'Café Demo StarSpin',
      subscription_tier: 'pro',
      google_review_link: 'https://g.page/r/demo',
      instagram_handle: 'starspin_demo',
      tiktok_handle: 'starspin_demo'
    })
    .select()
    .single();

  if (merchantError) throw merchantError;
  
  console.log('✅ Profil marchand créé\n');

  // Créer des prix de démonstration
  console.log('🎁 Création des prix de démonstration...');
  
  const prizes = [
    {
      merchant_id: userId,
      name: '10% de réduction',
      description: 'Obtenez 10% de réduction sur votre prochain achat',
      probability: 30.0
    },
    {
      merchant_id: userId,
      name: 'Café gratuit',
      description: 'Un café offert lors de votre prochaine visite',
      probability: 25.0
    },
    {
      merchant_id: userId,
      name: '20% de réduction',
      description: 'Profitez de 20% de réduction',
      probability: 20.0
    },
    {
      merchant_id: userId,
      name: 'Dessert gratuit',
      description: 'Un dessert au choix offert',
      probability: 15.0
    },
    {
      merchant_id: userId,
      name: 'Réessayez',
      description: 'Pas de chance cette fois, réessayez demain!',
      probability: 10.0
    }
  ];

  const { error: prizesError } = await supabase
    .from('prizes')
    .insert(prizes);

  if (prizesError) throw prizesError;
  
  console.log(`✅ ${prizes.length} prix créés (total: 100%)\n`);

  displayCredentials(merchant);
}

function displayCredentials(merchant) {
  console.log('='.repeat(60));
  console.log('🎉 COMPTE DÉMO CRÉÉ AVEC SUCCÈS!');
  console.log('='.repeat(60));
  console.log('\n📧 Identifiants de connexion:');
  console.log('   Email    : demo@starspin.app');
  console.log('   Password : Demo123!');
  console.log('\n🏪 Informations du compte:');
  console.log(`   Business : ${merchant.business_name}`);
  console.log(`   Tier     : ${merchant.subscription_tier}`);
  console.log(`   ID       : ${merchant.id}`);
  console.log('\n🔗 URLs de test:');
  console.log(`   Dashboard : http://localhost:3000/dashboard`);
  console.log(`   Login     : http://localhost:3000/auth/login`);
  console.log(`   Rating    : http://localhost:3000/rate/${merchant.id}`);
  console.log('\n📱 Pour tester le flux client:');
  console.log(`   1. Ouvrez: http://localhost:3000/rate/${merchant.id}`);
  console.log('   2. Donnez une note de 4 ou 5 étoiles');
  console.log('   3. Cliquez sur "Done" sur la page sociale');
  console.log('   4. Tournez la roue pour gagner un prix');
  console.log('   5. Recevez votre coupon avec QR code');
  console.log('\n💡 Conseils:');
  console.log('   - Connectez-vous au dashboard pour voir les statistiques');
  console.log('   - Ajoutez/modifiez des prix dans "Manage Prizes"');
  console.log('   - Générez votre QR code dans "Generate QR Code"');
  console.log('   - Consultez les feedbacks dans "View Feedback"');
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Bon test de StarSpin!\n');
}

createDemoAccount();
