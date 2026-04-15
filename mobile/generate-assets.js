// Generate minimal valid PNG files for Expo build
const fs = require('fs');
const path = require('path');

// Minimal PNG generator (creates a solid color PNG)
function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let cr = n;
      for (let k = 0; k < 8; k++) {
        cr = (cr & 1) ? (0xedb88320 ^ (cr >>> 1)) : (cr >>> 1);
      }
      table[n] = cr;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crcVal]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw image data
  const rawRow = Buffer.alloc(1 + width * 3); // filter byte + RGB
  rawRow[0] = 0; // no filter
  for (let x = 0; x < width; x++) {
    rawRow[1 + x * 3] = r;
    rawRow[1 + x * 3 + 1] = g;
    rawRow[1 + x * 3 + 2] = b;
  }
  
  const rawData = Buffer.alloc(rawRow.length * height);
  for (let y = 0; y < height; y++) {
    rawRow.copy(rawData, y * rawRow.length);
  }

  // Deflate using zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

const assetsDir = path.join(__dirname, 'assets');

// icon.png (1024x1024) - dark with orange accent
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, 15, 23, 42));

// adaptive-icon.png (1024x1024)
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, 15, 23, 42));

// splash-icon.png (200x200) - for splash screen
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), createPNG(200, 200, 255, 140, 46));

// favicon.png (48x48)
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createPNG(48, 48, 15, 23, 42));

console.log('Assets generated successfully!');
