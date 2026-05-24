/**
 * FINORA Investor Demo Seeder
 * Run: node scripts/seed-demo.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tqmkivmfjarmgqihvbtm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTExNTYsImV4cCI6MjA5MTA2NzE1Nn0.5Hm-uu7ZRYjxizIPfoC4jUAgVqrm49jGSsVUasU4Z9Y';
const EMAIL = 'yuzizhi4@gmail.com';
const PASSWORD = 'yuzi123';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Synthetic Demo Data ──────────────────────────────────────────────────────

function getPastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const TRANSACTIONS = [
  // Income
  { name: 'TechCorp Inc. Payroll', amount: 15400, category: 'Income', type: 'income', date: getPastDate(1) },
  { name: 'TechCorp Inc. Payroll', amount: 15400, category: 'Income', type: 'income', date: getPastDate(30) },
  { name: 'TechCorp Inc. Payroll', amount: 15400, category: 'Income', type: 'income', date: getPastDate(60) },
  { name: 'Stripe Payout – Side Hustle', amount: 2850, category: 'Income', type: 'income', date: getPastDate(14) },
  { name: 'Freelance Design – Acme Corp', amount: 4200, category: 'Income', type: 'income', date: getPastDate(45) },

  // Known subscriptions (for the AI Radar)
  { name: 'NETFLIX.COM', amount: 18.99, category: 'Entertainment', type: 'expense', date: getPastDate(5) },
  { name: 'NETFLIX.COM', amount: 18.99, category: 'Entertainment', type: 'expense', date: getPastDate(35) },
  { name: 'Amazon Prime', amount: 14.99, category: 'Entertainment', type: 'expense', date: getPastDate(12) },
  { name: 'Amazon Prime', amount: 14.99, category: 'Entertainment', type: 'expense', date: getPastDate(42) },
  { name: 'Spotify Premium', amount: 9.99, category: 'Entertainment', type: 'expense', date: getPastDate(8) },
  { name: 'Spotify Premium', amount: 9.99, category: 'Entertainment', type: 'expense', date: getPastDate(38) },
  { name: 'Equinox Gym Membership', amount: 230, category: 'Health', type: 'expense', date: getPastDate(2) },
  { name: 'Equinox Gym Membership', amount: 230, category: 'Health', type: 'expense', date: getPastDate(32) },
  { name: 'AT&T Mobile', amount: 85, category: 'Utilities', type: 'expense', date: getPastDate(10) },
  { name: 'AT&T Mobile', amount: 85, category: 'Utilities', type: 'expense', date: getPastDate(40) },
  { name: 'Apple iCloud+', amount: 2.99, category: 'Utilities', type: 'expense', date: getPastDate(7) },
  { name: 'Apple iCloud+', amount: 2.99, category: 'Utilities', type: 'expense', date: getPastDate(37) },
  { name: 'Disney+ Bundle', amount: 13.99, category: 'Entertainment', type: 'expense', date: getPastDate(15) },
  { name: 'Disney+ Bundle', amount: 13.99, category: 'Entertainment', type: 'expense', date: getPastDate(45) },
  { name: 'YouTube Premium', amount: 13.99, category: 'Entertainment', type: 'expense', date: getPastDate(20) },
  { name: 'YouTube Premium', amount: 13.99, category: 'Entertainment', type: 'expense', date: getPastDate(50) },

  // Lifestyle & shopping
  { name: 'Delta Airlines – SFO to JFK', amount: 850.40, category: 'Travel', type: 'expense', date: getPastDate(4) },
  { name: 'Whole Foods Market', amount: 142.30, category: 'Food & Dining', type: 'expense', date: getPastDate(6) },
  { name: 'Whole Foods Market', amount: 184.20, category: 'Food & Dining', type: 'expense', date: getPastDate(18) },
  { name: 'Whole Foods Market', amount: 97.50, category: 'Food & Dining', type: 'expense', date: getPastDate(48) },
  { name: 'Uber Ride', amount: 34.50, category: 'Transportation', type: 'expense', date: getPastDate(1) },
  { name: 'Uber Ride', amount: 28.90, category: 'Transportation', type: 'expense', date: getPastDate(3) },
  { name: 'Uber Ride', amount: 22.10, category: 'Transportation', type: 'expense', date: getPastDate(9) },
  { name: 'Uber Eats', amount: 45.20, category: 'Food & Dining', type: 'expense', date: getPastDate(8) },
  { name: 'Uber Eats', amount: 38.60, category: 'Food & Dining', type: 'expense', date: getPastDate(22) },
  { name: 'Apple Store – AirPods Pro', amount: 249, category: 'Shopping', type: 'expense', date: getPastDate(15) },
  { name: 'Airbnb – Weekend Getaway', amount: 650, category: 'Travel', type: 'expense', date: getPastDate(20) },
  { name: 'Starbucks Coffee', amount: 6.50, category: 'Food & Dining', type: 'expense', date: getPastDate(2) },
  { name: 'Starbucks Coffee', amount: 7.20, category: 'Food & Dining', type: 'expense', date: getPastDate(4) },
  { name: 'Starbucks Coffee', amount: 5.80, category: 'Food & Dining', type: 'expense', date: getPastDate(7) },
  { name: 'Tesla Supercharger', amount: 18, category: 'Transportation', type: 'expense', date: getPastDate(11) },
  { name: 'Vanguard Index Fund Auto-Buy', amount: 1500, category: 'Investment', type: 'expense', date: getPastDate(15) },
  { name: 'Vanguard Index Fund Auto-Buy', amount: 1500, category: 'Investment', type: 'expense', date: getPastDate(45) },
  { name: 'Nike Store Online', amount: 189.99, category: 'Shopping', type: 'expense', date: getPastDate(25) },
  { name: 'Restaurant – Nobu NYC', amount: 320, category: 'Food & Dining', type: 'expense', date: getPastDate(30) },
  { name: 'CVS Pharmacy', amount: 42.60, category: 'Health', type: 'expense', date: getPastDate(33) },
  { name: 'Home Depot', amount: 215.40, category: 'Shopping', type: 'expense', date: getPastDate(55) },
];

const GOALS = [
  { name: 'Tesla Model 3 Down Payment', target_amount: 15000, current_amount: 12500, target_date: getPastDate(-60) },
  { name: 'Bali Summer Vacation', target_amount: 5000, current_amount: 2100, target_date: getPastDate(-90) },
  { name: 'Emergency Fund (6 months)', target_amount: 50000, current_amount: 48000, target_date: getPastDate(-180) },
  { name: 'MacBook Pro Upgrade', target_amount: 3500, current_amount: 3500, target_date: getPastDate(-10) },
];

const INVESTMENTS = [
  { name: 'S&P 500 ETF (VOO)', type: 'ETF', invested: 45000, current_value: 52400 },
  { name: 'Apple (AAPL)', type: 'Stock', invested: 12000, current_value: 18340 },
  { name: 'Bitcoin (BTC)', type: 'Crypto', invested: 8000, current_value: 24100 },
  { name: 'High Yield Savings', type: 'Cash', invested: 25000, current_value: 25800 },
  { name: 'Tesla (TSLA)', type: 'Stock', invested: 5000, current_value: 7200 },
];

// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 FINORA Investor Demo Seeder');
  console.log('──────────────────────────────');

  // 1. Sign in
  console.log(`\n1. Signing in as ${EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authError || !authData.user) {
    console.error('❌ Login failed:', authError?.message);
    process.exit(1);
  }
  const userId = authData.user.id;
  console.log(`   ✅ Signed in. User ID: ${userId}`);

  // 2. Clear existing data
  console.log('\n2. Clearing existing data...');
  await Promise.all([
    supabase.from('transactions').delete().eq('user_id', userId),
    supabase.from('goals').delete().eq('user_id', userId),
    supabase.from('investments').delete().eq('user_id', userId),
  ]);
  console.log('   ✅ All existing records removed.');

  // 3. Insert Transactions
  console.log(`\n3. Inserting ${TRANSACTIONS.length} transactions...`);
  const txPayload = TRANSACTIONS.map(t => ({ ...t, user_id: userId }));
  const { error: txError } = await supabase.from('transactions').insert(txPayload);
  if (txError) console.error('   ❌ Transaction error:', txError.message);
  else console.log(`   ✅ ${TRANSACTIONS.length} transactions inserted.`);

  // 4. Insert Goals
  console.log(`\n4. Inserting ${GOALS.length} goals...`);
  const goalsPayload = GOALS.map(g => ({ ...g, user_id: userId }));
  const { error: goalsError } = await supabase.from('goals').insert(goalsPayload);
  if (goalsError) console.error('   ❌ Goals error:', goalsError.message);
  else console.log(`   ✅ ${GOALS.length} goals inserted.`);

  // 5. Insert Investments
  console.log(`\n5. Inserting ${INVESTMENTS.length} investments...`);
  const invPayload = INVESTMENTS.map(i => ({ ...i, user_id: userId }));
  const { error: invError } = await supabase.from('investments').insert(invPayload);
  if (invError) console.error('   ❌ Investments error:', invError.message);
  else console.log(`   ✅ ${INVESTMENTS.length} investments inserted.`);

  console.log('\n──────────────────────────────');
  console.log('🎉 Investor Demo account fully seeded (Supabase)!');
  console.log('\n6. Browser localStorage setup (run in DevTools console after login):');
  
  const creditCards = [
    { id: 'cc1', name: 'Amex Platinum', bank: 'American Express', number: '1008', network: 'amex', color: 'gold', limit: '50000', perks: ['lounge', 'travel', 'dining'] },
    { id: 'cc2', name: 'Chase Sapphire Reserve', bank: 'Chase', number: '4291', network: 'visa', color: 'blue', limit: '35000', perks: ['travel', 'dining', 'cashback'] },
    { id: 'cc3', name: 'Apple Card', bank: 'Goldman Sachs', number: '7734', network: 'mastercard', color: 'graphite', limit: '15000', perks: ['cashback', 'shopping'] },
  ];

  const budgets = [
    { name: 'Food & Dining', limit: 1200 },
    { name: 'Shopping', limit: 800 },
    { name: 'Entertainment', limit: 400 },
    { name: 'Transportation', limit: 300 },
    { name: 'Health', limit: 500 },
    { name: 'Travel', limit: 2000 },
  ];

  console.log('\n   Paste this in your browser DevTools console (F12 > Console):');
  console.log('   ─────────────────────────────────────────────────────────');
  console.log(`   localStorage.setItem('finora_currency', 'USD');`);
  console.log(`   localStorage.setItem('finora_credit_cards', '${JSON.stringify(creditCards)}');`);
  console.log(`   localStorage.setItem('finora_budgets', '${JSON.stringify(budgets)}');`);
  console.log(`   localStorage.setItem('finora_onboarding_done', 'true');`);
  console.log(`   location.reload();`);
  console.log('   ─────────────────────────────────────────────────────────');
  console.log('\n   Log in as yuzizhi4@gmail.com then paste and press Enter!');
  process.exit(0);
}

main();
