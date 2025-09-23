const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestAccounts() {
  console.log('Creating test accounts...');

  // Test Admin Account
  const adminEmail = 'admin@test.com';
  const adminPassword = 'admin123456';

  // Test Vendor Account
  const vendorEmail = 'vendor@test.com';
  const vendorPassword = 'vendor123456';

  try {
    // Create admin account
    console.log('Creating admin account...');
    const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
        role: 'admin'
      }
    });

    if (adminError) {
      console.error('Admin creation error:', adminError);
    } else {
      console.log('✅ Admin account created:', adminEmail);

      // Update role in public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          full_name: 'Test Admin'
        })
        .eq('id', adminAuth.user.id);

      if (updateError) {
        console.error('Error updating admin role:', updateError);
      }
    }

    // Create vendor account
    console.log('Creating vendor account...');
    const { data: vendorAuth, error: vendorError } = await supabase.auth.admin.createUser({
      email: vendorEmail,
      password: vendorPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Vendor',
        role: 'vendeur'
      }
    });

    if (vendorError) {
      console.error('Vendor creation error:', vendorError);
    } else {
      console.log('✅ Vendor account created:', vendorEmail);

      // Update role and vendor status in public.users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'vendeur',
          full_name: 'Test Vendor',
          is_vendor: true,
          vendor_name: 'Test Vendor Store',
          vendor_status: 'active',
          vendor_verification_status: 'verified'
        })
        .eq('id', vendorAuth.user.id);

      if (updateError) {
        console.error('Error updating vendor role:', updateError);
      }
    }

    console.log('\n📝 Test Accounts Created:');
    console.log('========================');
    console.log('Admin Login:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('');
    console.log('Vendor Login:');
    console.log('Email:', vendorEmail);
    console.log('Password:', vendorPassword);
    console.log('========================');

  } catch (error) {
    console.error('Error creating accounts:', error);
  }
}

createTestAccounts();