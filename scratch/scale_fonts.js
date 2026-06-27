const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(app)', 'credit', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace mapping
const replacements = [
  { from: /text-\[7px\]/g, to: 'text-[9px]' },
  { from: /text-\[8px\]/g, to: 'text-[10px]' },
  { from: /text-\[9px\]/g, to: 'text-[11px]' },
  { from: /text-\[10px\]/g, to: 'text-xs' },
  { from: /text-\[11px\]/g, to: 'text-sm' },
  { from: /text-\[12px\]/g, to: 'text-sm' },
  { from: /\btext-xs\b/g, to: 'text-sm' },
  { from: /\btext-sm\b/g, to: 'text-base' }
];

// Wait! If I replace text-xs to text-sm, and THEN text-sm to text-base, the text-xs will become text-base!
// I need to process them in a way that avoids double replacement.
// Or just do a single pass replacement function.

const replaceRegex = /text-\[7px\]|text-\[8px\]|text-\[9px\]|text-\[10px\]|text-\[11px\]|text-\[12px\]|\btext-xs\b|\btext-sm\b/g;

const map = {
  'text-[7px]': 'text-[9px]',
  'text-[8px]': 'text-[10px]',
  'text-[9px]': 'text-xs',
  'text-[10px]': 'text-sm',
  'text-[11px]': 'text-sm',
  'text-[12px]': 'text-sm',
  'text-xs': 'text-sm',
  'text-sm': 'text-base'
};

content = content.replace(replaceRegex, match => map[match]);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Font sizes scaled up successfully.');
