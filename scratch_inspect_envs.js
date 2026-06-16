const fs = require('fs');
const path = require('path');

const files = ['.env', '.env.local', '.env.production', '.env.development'];
files.forEach(f => {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    console.log(`\nKeys in ${f}:`);
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    lines.forEach(l => {
      const match = l.match(/^\s*([\w.-]+)\s*=/);
      if (match) {
        console.log(` - ${match[1]}`);
      }
    });
  } else {
    console.log(`\n${f} does not exist.`);
  }
});
