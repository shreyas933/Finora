const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'public', 'ai-cfo.png');
const buffer = fs.readFileSync(pngPath);

let offset = 8;
let idatBuffers = [];
let width = 0;
let height = 0;
let colorType = 0;

while (offset < buffer.length) {
  const length = buffer.readUInt32BE(offset);
  const type = buffer.toString('ascii', offset + 4, offset + 8);
  
  if (type === 'IHDR') {
    width = buffer.readUInt32BE(offset + 8);
    height = buffer.readUInt32BE(offset + 12);
    colorType = buffer.readUInt8(offset + 17);
  }
  
  if (type === 'IDAT') {
    idatBuffers.push(buffer.subarray(offset + 8, offset + 8 + length));
  }
  
  if (type === 'IEND') {
    break;
  }
  
  offset += 12 + length;
}

if (colorType !== 6) {
  console.log(`Color type is ${colorType}, not RGBA. Cannot easily check transparency with this simple script.`);
  process.exit(0);
}

const compressed = Buffer.concat(idatBuffers);
zlib.inflate(compressed, (err, decompressed) => {
  if (err) {
    console.error('Decompression failed:', err);
    process.exit(1);
  }
  
  // Decompressed data contains scanlines. Each scanline starts with a filter byte (1 byte)
  // followed by pixel data (4 bytes per pixel for RGBA).
  let transparentPixels = 0;
  let opaquePixels = 0;
  let idx = 0;
  
  for (let y = 0; y < height; y++) {
    const filter = decompressed[idx++];
    for (let x = 0; x < width; x++) {
      const r = decompressed[idx++];
      const g = decompressed[idx++];
      const b = decompressed[idx++];
      const a = decompressed[idx++];
      if (a < 255) {
        transparentPixels++;
      } else {
        opaquePixels++;
      }
    }
  }
  
  console.log(`Scan complete.`);
  console.log(`Total pixels: ${width * height}`);
  console.log(`Transparent pixels (alpha < 255): ${transparentPixels}`);
  console.log(`Opaque pixels (alpha == 255): ${opaquePixels}`);
});
