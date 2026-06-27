// Test: Running Balance Algorithm
// Mirrors exactly what filteredWithBalance does in the transactions page

function computeFilteredWithBalance(transactions, filterType = "all", filterCategory = "all") {
  // Step 1: sort oldest -> newest, exclude "Starting Balance Adjustment"
  const allSorted = [...transactions]
    .filter(t => t.name !== "Starting Balance Adjustment")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Step 2: accumulate running balance
  let running = 0;
  const balanceMap = new Map();
  for (const tx of allSorted) {
    running += tx.type === "income" ? Number(tx.amount) : -Number(tx.amount);
    balanceMap.set(tx.id, running);
  }

  // Step 3: apply filters, attach balance
  const result = allSorted
    .filter(t => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    })
    .map(t => ({ ...t, runningBalance: balanceMap.get(t.id) ?? 0 }));

  // Step 4: reverse to newest-first
  return result.reverse();
}

// ─── Test Data ───────────────────────────────────────────────────────────────
const transactions = [
  { id: "1", name: "Salary",         type: "income",  amount: 50000, category: "Salary",    date: "2026-06-01T09:00:00Z" },
  { id: "2", name: "Rent",           type: "expense", amount: 15000, category: "Housing",   date: "2026-06-02T10:00:00Z" },
  { id: "3", name: "Store Purchase", type: "expense", amount: 200,   category: "Shopping",  date: "2026-06-03T12:00:00Z" },
  { id: "4", name: "Thomson Mart",   type: "expense", amount: 80,    category: "Shopping",  date: "2026-06-04T14:00:00Z" },
  { id: "5", name: "Groww Dividend", type: "income",  amount: 200,   category: "Income",    date: "2026-06-05T08:00:00Z" },
  { id: "6", name: "Zomato",         type: "expense", amount: 350,   category: "Food",      date: "2026-06-06T20:00:00Z" },
];

// ─── Test 1: All transactions, no filter ─────────────────────────────────────
console.log("\n=== Test 1: All Transactions (No Filter) ===");
console.log("Displayed newest → oldest. Bal after each tx:\n");
const all = computeFilteredWithBalance(transactions);
all.forEach(tx => {
  const arrow = tx.type === "income" ? "↑" : "↓";
  console.log(`  ${arrow} ${tx.name.padEnd(18)} ${String(tx.type === "income" ? "+" : "-").padStart(1)}₹${String(tx.amount).padStart(6)} | Bal: ₹${tx.runningBalance}`);
});

// Verify: top row (newest) should be Zomato, with balance = 50000 - 15000 - 200 - 80 + 200 - 350 = 34570
const expected_latest = 50000 - 15000 - 200 - 80 + 200 - 350;
console.log(`\n  Expected balance of newest row (Zomato): ₹${expected_latest}`);
console.log(`  Got:                                     ₹${all[0].runningBalance}`);
console.log(`  ✅ PASS: ${all[0].runningBalance === expected_latest}`);

// ─── Test 2: User's exact example – balance 2000, paid 200 ───────────────────
console.log("\n=== Test 2: User's Example (Balance 2000, Paid 200) ===");
const userExample = [
  { id: "a", name: "Starting Cash",   type: "income",  amount: 2000, category: "Salary", date: "2026-06-01T00:00:00Z" },
  { id: "b", name: "Store Purchase",  type: "expense", amount: 200,  category: "Shopping", date: "2026-06-02T00:00:00Z" },
];
const userResult = computeFilteredWithBalance(userExample);
userResult.forEach(tx => {
  const arrow = tx.type === "income" ? "↑" : "↓";
  console.log(`  ${arrow} ${tx.name.padEnd(20)} | Bal: ₹${tx.runningBalance}`);
});
console.log(`  ✅ After store purchase balance: ₹${userResult[0].runningBalance} (expected ₹1800)`);

// ─── Test 3: Expenses-only filter (running balance still reflects true history) ──
console.log("\n=== Test 3: Filter = 'expense' only (balance still shows true history) ===");
const expOnly = computeFilteredWithBalance(transactions, "expense");
expOnly.forEach(tx => {
  console.log(`  ↓ ${tx.name.padEnd(18)} -₹${String(tx.amount).padStart(6)} | Bal: ₹${tx.runningBalance}`);
});
console.log(`  (Note: Groww income is hidden by filter, but balance still reflects it in the Zomato row)`);

// ─── Test 4: Negative balance (expenses > income) ────────────────────────────
console.log("\n=== Test 4: Negative Balance ===");
const negativeCase = [
  { id: "x", name: "Income",         type: "income",  amount: 100,  category: "Salary",   date: "2026-06-01T00:00:00Z" },
  { id: "y", name: "Big Purchase",   type: "expense", amount: 500,  category: "Shopping", date: "2026-06-02T00:00:00Z" },
];
const negResult = computeFilteredWithBalance(negativeCase);
negResult.forEach(tx => {
  const sign = tx.runningBalance < 0 ? "🔴" : "🟢";
  console.log(`  ${sign} ${tx.name.padEnd(16)} | Bal: ₹${tx.runningBalance}`);
});

// ─── Test 5: Starting Balance Adjustment excluded ─────────────────────────────
console.log("\n=== Test 5: 'Starting Balance Adjustment' is excluded ===");
const withAdj = [
  ...transactions,
  { id: "adj", name: "Starting Balance Adjustment", type: "income", amount: 99999, category: "Savings", date: "2026-06-01T00:00:00Z" },
];
const adjResult = computeFilteredWithBalance(withAdj);
const hasAdj = adjResult.some(tx => tx.name === "Starting Balance Adjustment");
console.log(`  Adjustment row in results: ${hasAdj} (expected false)`);
console.log(`  ✅ PASS: ${!hasAdj}`);

console.log("\n✅ All tests complete.\n");
