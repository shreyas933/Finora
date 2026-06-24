const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  const email = `test_newline_${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  console.log(`Signing up test user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError.message);
    return;
  }

  const user = signUpData.user;
  const session = signUpData.session;
  console.log('Sign up successful, user ID:', user.id);

  const token = session ? session.access_token : null;
  console.log('Access token retrieved:', token ? 'YES' : 'NO');

  // Let's create an authenticated client using the user's access token
  const authSupabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  console.log('Inserting transaction with newline in name...');
  const { data: insertData, error: insertError } = await authSupabase.from('transactions').insert({
    user_id: user.id,
    name: 'Vendekin\ntechnologies Pri (HDFC Bank 5866) || Other',
    amount: 60,
    category: 'Uncategorized',
    type: 'expense',
    date: new Date().toISOString()
  }).select();

  if (insertError) {
    console.error('Insert error with newline name:', insertError.message);
  } else {
    console.log('Insert successful! Data:', insertData);
  }

  // Cleanup: Let's delete the transaction we just created
  if (insertData && insertData.length > 0) {
    console.log('Cleaning up transaction...');
    const { error: deleteError } = await authSupabase
      .from('transactions')
      .delete()
      .eq('id', insertData[0].id);
    if (deleteError) {
      console.error('Delete error:', deleteError.message);
    } else {
      console.log('Cleanup successful.');
    }
  }
}

run();
