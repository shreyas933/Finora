export const generateInvestorDemoData = () => {
  const now = new Date();
  
  // Helper to generate dates relative to today
  const getPastDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  // 1. Core Pitch Transactions (Salary, Subscriptions, AI Radar Targets)
  const transactions = [
    // Income
    { name: "TechCorp Inc. Payroll", amount: 15400, category: "Income", type: "income" as const, date: getPastDate(1) },
    { name: "TechCorp Inc. Payroll", amount: 15400, category: "Income", type: "income" as const, date: getPastDate(30) },
    { name: "TechCorp Inc. Payroll", amount: 15400, category: "Income", type: "income" as const, date: getPastDate(60) },
    { name: "Stripe Payout - Side Hustle", amount: 2850, category: "Income", type: "income" as const, date: getPastDate(14) },
    
    // Subscriptions for the Predictive Radar
    { name: "NETFLIX.COM", amount: 18.99, category: "Entertainment", type: "expense" as const, date: getPastDate(5) },
    { name: "NETFLIX.COM", amount: 18.99, category: "Entertainment", type: "expense" as const, date: getPastDate(35) },
    { name: "Amazon Prime Video", amount: 14.99, category: "Entertainment", type: "expense" as const, date: getPastDate(12) },
    { name: "Amazon Prime Video", amount: 14.99, category: "Entertainment", type: "expense" as const, date: getPastDate(42) },
    { name: "Equinox Gym Membership", amount: 230.00, category: "Health", type: "expense" as const, date: getPastDate(2) },
    { name: "Equinox Gym Membership", amount: 230.00, category: "Health", type: "expense" as const, date: getPastDate(32) },
    { name: "AT&T Mobile", amount: 85.00, category: "Utilities", type: "expense" as const, date: getPastDate(10) },
    { name: "AT&T Mobile", amount: 85.00, category: "Utilities", type: "expense" as const, date: getPastDate(40) },

    // General high-end spending for visuals
    { name: "Delta Airlines - SFO to JFK", amount: 850.40, category: "Travel", type: "expense" as const, date: getPastDate(4) },
    { name: "Whole Foods Market", amount: 142.30, category: "Food & Dining", type: "expense" as const, date: getPastDate(6) },
    { name: "Whole Foods Market", amount: 184.20, category: "Food & Dining", type: "expense" as const, date: getPastDate(18) },
    { name: "Uber Ride", amount: 34.50, category: "Transportation", type: "expense" as const, date: getPastDate(1) },
    { name: "Uber Ride", amount: 28.90, category: "Transportation", type: "expense" as const, date: getPastDate(3) },
    { name: "Uber Eats", amount: 45.20, category: "Food & Dining", type: "expense" as const, date: getPastDate(8) },
    { name: "Apple Store - Airpods", amount: 249.00, category: "Shopping", type: "expense" as const, date: getPastDate(15) },
    { name: "Airbnb - Weekend Getaway", amount: 650.00, category: "Travel", type: "expense" as const, date: getPastDate(20) },
    { name: "Starbucks Coffee", amount: 6.50, category: "Food & Dining", type: "expense" as const, date: getPastDate(2) },
    { name: "Starbucks Coffee", amount: 7.20, category: "Food & Dining", type: "expense" as const, date: getPastDate(4) },
    { name: "Starbucks Coffee", amount: 5.80, category: "Food & Dining", type: "expense" as const, date: getPastDate(7) },
    { name: "Tesla Supercharger", amount: 18.00, category: "Transportation", type: "expense" as const, date: getPastDate(11) },
    { name: "Vanguard Index Fund Auto-Buy", amount: 1500.00, category: "Investment", type: "expense" as const, date: getPastDate(15) },
    { name: "Vanguard Index Fund Auto-Buy", amount: 1500.00, category: "Investment", type: "expense" as const, date: getPastDate(45) },
  ];

  // 2. Goals
  const goals = [
    { name: "Tesla Model 3 Down Payment", target_amount: 15000, current_amount: 12500, target_date: getPastDate(-60) },
    { name: "Bali Summer Vacation", target_amount: 5000, current_amount: 2100, target_date: getPastDate(-90) },
    { name: "Emergency Fund", target_amount: 50000, current_amount: 48000, target_date: getPastDate(-180) },
  ];

  // 3. Investments
  const investments = [
    { name: "S&P 500 (VOO)", type: "ETF", invested: 45000, current_value: 52400 },
    { name: "Apple (AAPL)", type: "Stock", invested: 12000, current_value: 18340 },
    { name: "Bitcoin (BTC)", type: "Crypto", invested: 8000, current_value: 24100 },
    { name: "High Yield Savings", type: "Cash", invested: 25000, current_value: 25800 }
  ];

  // 4. Wealth Net Worth History (For beautiful spline/area charts)
  const wealthHistory = Array.from({ length: 6 }, (_, i) => ({
    date: new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).toISOString(),
    assets: 180000 + i * 15000 + Math.random() * 5000,
    liabilities: 45000 - i * 2000 - Math.random() * 1000
  }));

  // 5. Budgets Cache for Safe-To-Spend calculations
  const budgets = [
    { name: "Food & Dining", limit: 1200 },
    { name: "Shopping", limit: 800 },
    { name: "Entertainment", limit: 400 }
  ];

  return { transactions, goals, investments, wealthHistory, budgets };
};
