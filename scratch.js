const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace text-primary when preceded or followed by bg-primary/X
  content = content.replace(/bg-primary\/(\d+)([^'"}]+)text-primary(?!\-)/g, 'bg-primary/$1$2text-red-400');
  content = content.replace(/text-primary([^'"}]+)bg-primary\/(\d+)/g, 'text-red-400$1bg-primary/$2');
  
  // Handle case where text-primary is exactly adjacent or something, though ([^'"}]+) needs to handle spaces
  
  // Also handle text-primary/70
  content = content.replace(/bg-primary\/(\d+)([^'"}]+)text-primary\/70/g, 'bg-primary/$1$2text-red-400/80');
  content = content.replace(/text-primary\/70([^'"}]+)bg-primary\/(\d+)/g, 'text-red-400/80$1bg-primary/$2');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    changed++;
  }
});
console.log('Total files changed:', changed);
