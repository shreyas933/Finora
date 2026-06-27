const financialContext = `
User Financial Context:
- Current Balance: $1,234.00
- Monthly Income: $5,000.00
- Monthly Expenses: $2,000.00
- Savings Rate: 60.00%
`;
const msg = 'trip';
const balanceMatch = financialContext.match(/Balance[:\s]+[^\d]*([0-9,.]+)/i);
const incomeMatch = financialContext.match(/Income[:\s]+[^\d]*([0-9,.]+)/i);
const expensesMatch = financialContext.match(/Expenses[:\s]+[^\d]*([0-9,.]+)/i);
const savingsMatch = financialContext.match(/Savings Rate[:\s]+([0-9.]+)/i);

const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 111300;
const income = incomeMatch ? parseFloat(incomeMatch[1].replace(/,/g, '')) : 150000;
const expenses = expensesMatch ? parseFloat(expensesMatch[1].replace(/,/g, '')) : 38700;
const savingsRate = savingsMatch ? parseFloat(savingsMatch[1]) : 74.2;

console.log({ balanceMatch, incomeMatch, expensesMatch, savingsMatch });
console.log({ balance, income, expenses, savingsRate });

if (msg.includes('trip') || msg.includes('travel') || msg.includes('vacation')) {
  console.log('Hits trip logic');
} else {
  console.log('Hits default');
}
