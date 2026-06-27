const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'public', 'ai-cfo.png');
const buffer = fs.readFileSync(pngPath);

// Check PNG signature
if (buffer.readUInt32BE(0) !== 0x89504E47 || buffer.readUInt32BE(4) !== 0x0D0A1A0A) {
  console.log('Not a valid PNG');
  process.exit(1);
}

// Read IHDR chunk
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);
const bitDepth = buffer.readUInt8(24);
const colorType = buffer.readUInt8(25);

console.log(`Dimensions: ${width}x${height}`);
console.log(`Bit Depth: ${bitDepth}`);
console.log(`Color Type: ${colorType} (${getColorTypeString(colorType)})`);

function getColorTypeString(type) {
  switch (type) {
    case 0: return 'Grayscale';
    case 2: return 'Truecolor (RGB)';
    case 3: return 'Indexed Color';
    case 4: return 'Grayscale with Alpha';
    case 6: return 'Truecolor with Alpha (RGBA)';
    default: return 'Unknown';
  }
}
