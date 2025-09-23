const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function sendPasswordResetEmails() {
  console.log('Sending password reset emails...\n');

  const accounts = [
    { email: 'dacruznico38@gmail.com', role: 'Admin' },
    { email: 'n.dacruz.riper@gmail.com', role: 'Vendor' },
  ];

  for (const account of accounts) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        account.email,
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      );

      if (error) {
        console.error(`❌ Error for ${account.email}:`, error.message);
      } else {
        console.log(`✅ Password reset email sent to ${account.email} (${account.role})`);
      }
    } catch (err) {
      console.error(`❌ Failed for ${account.email}:`, err);
    }
  }

  console.log('\n📧 Check your email inbox for password reset links!');
  console.log('If you don\'t receive emails, you can use the "Forgot Password" link on the login page.');
}

sendPasswordResetEmails();