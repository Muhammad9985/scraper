const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw Image Data (Filter byte + RGBA for each pixel)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      // Calculate color: Indigo / Cyan Gradient with a centered "B" shape
      const rRatio = x / width;
      const gRatio = y / height;

      let r = Math.round(99 + (6 - 99) * rRatio);
      let g = Math.round(102 + (182 - 102) * gRatio);
      let b = Math.round(241 + (212 - 241) * rRatio);
      let a = 255;

      // Draw simple B letter in white in center
      const cx = x / width;
      const cy = y / height;
      const isVerticalStem = (cx >= 0.3 && cx <= 0.42 && cy >= 0.25 && cy <= 0.75);
      const isTopLoop = (cx >= 0.42 && cx <= 0.68 && cy >= 0.25 && cy <= 0.5) && (cy <= 0.32 || cy >= 0.43 || cx >= 0.6);
      const isBottomLoop = (cx >= 0.42 && cx <= 0.72 && cy >= 0.5 && cy <= 0.75) && (cy <= 0.57 || cy >= 0.68 || cx >= 0.64);

      if (isVerticalStem || isTopLoop || isBottomLoop) {
        r = 255;
        g = 255;
        b = 255;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // IDAT Chunk (zlib compressed)
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);

  const crcVal = crc32(Buffer.concat([Buffer.from(type), data]));
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

// CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xEDB88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

// Create icons directory if missing
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuffer = createPNG(size, size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuffer);
  console.log(`Created icon${size}.png (${size}x${size})`);
});
