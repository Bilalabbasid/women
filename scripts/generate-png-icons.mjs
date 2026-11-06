import fs from 'node:fs';
import zlib from 'node:zlib';

// CRC32 table & function
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function encodePng(width, height, getPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(2, 9); // RGB
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Distance from point (px, py) to segment (x1, y1)-(x2, y2)
function distToSeg(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Render the MenoVerdict mark (normalized 0..1 coordinates)
function markPixel(nx, ny, pad = 0.0) {
  const BG_PAPER = [247, 246, 242]; // #F7F6F2
  const GREEN = [31, 90, 76];       // #1F5A4C
  const MINT = [230, 239, 235];     // #E6EFEB

  const u = (nx - pad) / (1 - 2 * pad);
  const v = (ny - pad) / (1 - 2 * pad);
  if (u < 0 || u > 1 || v < 0 || v > 1) return GREEN;

  // Rounded corner check for non-maskable icons
  if (pad === 0) {
    const r = 0.18;
    const cx = u < r ? r : u > 1 - r ? 1 - r : u;
    const cy = v < r ? r : v > 1 - r ? 1 - r : v;
    if (Math.hypot(u - cx, v - cy) > r) return BG_PAPER;
  }

  const stroke = 0.055;
  // Letter 'M' segments on left/center (u: 0.20..0.64, v: 0.28..0.72)
  const dM = Math.min(
    distToSeg(u, v, 0.20, 0.72, 0.20, 0.28),
    distToSeg(u, v, 0.20, 0.28, 0.42, 0.56),
    distToSeg(u, v, 0.42, 0.56, 0.64, 0.28),
    distToSeg(u, v, 0.64, 0.28, 0.64, 0.72),
  );
  if (dM <= stroke) return BG_PAPER;

  // Verdict checkmark on lower-right (u: 0.58..0.84, v: 0.42..0.68)
  const dCheck = Math.min(
    distToSeg(u, v, 0.58, 0.56, 0.68, 0.66),
    distToSeg(u, v, 0.68, 0.66, 0.84, 0.43),
  );
  if (dCheck <= stroke) return MINT;

  return GREEN;
}

// Create multi-size ICO (16x16, 32x32, 48x48 PNG payloads inside ICO container)
function createIco(sizes) {
  const pngBuffers = sizes.map((s) =>
    encodePng(s, s, (x, y, w, h) => markPixel((x + 0.5) / w, (y + 0.5) / h, 0))
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(sizes.length, 4);

  const dirEntries = [];
  let offset = 6 + sizes.length * 16;

  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const png = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0);
    entry.writeUInt8(s === 256 ? 0 : s, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

// Generate 1200x630 Open Graph default image
function createOgPng() {
  const W = 1200;
  const H = 630;
  const PAPER = [247, 246, 242];
  const GREEN = [31, 90, 76];
  const INK = [28, 35, 33];
  const RULE = [220, 218, 210];

  return encodePng(W, H, (x, y) => {
    // Top and bottom accent bars
    if (y < 16 || y >= H - 16) return GREEN;
    // Inner editorial frame border
    if ((x === 48 || x === W - 48) && y >= 48 && y <= H - 48) return RULE;
    if ((y === 48 || y === H - 48) && x >= 48 && x <= W - 48) return RULE;

    // Brand mark box at (100..260, 195..355) -> 160x160
    if (x >= 100 && x < 260 && y >= 195 && y < 355) {
      return markPixel((x - 100) / 160, (y - 195) / 160, 0);
    }

    // Editorial horizontal rule and accent bars representing headline & tagline blocks
    if (x >= 300 && x <= 820 && y >= 235 && y < 275) return INK;
    if (x >= 300 && x <= 680 && y >= 300 && y < 322) return GREEN;
    if (x >= 100 && x <= 1100 && y >= 420 && y < 423) return RULE;
    // Evidence badge pill at bottom left
    if (x >= 100 && x <= 420 && y >= 460 && y < 504) return GREEN;

    return PAPER;
  });
}

fs.mkdirSync('./public/icons', { recursive: true });

// 1. Multi-resolution favicon.ico (16, 32, 48 px)
fs.writeFileSync('./public/favicon.ico', createIco([16, 32, 48]));

// 2. apple-touch-icon.png (180x180)
const apple180 = encodePng(180, 180, (x, y, w, h) => markPixel((x + 0.5) / w, (y + 0.5) / h, 0.05));
fs.writeFileSync('./public/apple-touch-icon.png', apple180);
fs.writeFileSync('./public/icons/apple-touch-icon.png', apple180);

// 3. icon-192.png (192x192)
const png192 = encodePng(192, 192, (x, y, w, h) => markPixel((x + 0.5) / w, (y + 0.5) / h, 0));
fs.writeFileSync('./public/icons/icon-192.png', png192);
fs.writeFileSync('./public/icon-192.png', png192);

// 4. icon-512.png (512x512)
const png512 = encodePng(512, 512, (x, y, w, h) => markPixel((x + 0.5) / w, (y + 0.5) / h, 0));
fs.writeFileSync('./public/icons/icon-512.png', png512);
fs.writeFileSync('./public/icon-512.png', png512);

// 5. Maskable 512px icon (with 15% safe-zone padding and full-bleed background)
const maskable512 = encodePng(512, 512, (x, y, w, h) => markPixel((x + 0.5) / w, (y + 0.5) / h, 0.14));
fs.writeFileSync('./public/icons/icon-maskable-512.png', maskable512);
fs.writeFileSync('./public/icon-maskable-512.png', maskable512);

// 6. Default 1200x630 Open Graph image
const ogPng = createOgPng();
fs.writeFileSync('./public/og-default.png', ogPng);

console.log('Generated MenoVerdict favicon.ico (16/32/48), apple-touch-icon.png (180), icon-192.png, icon-512.png, icon-maskable-512.png, and og-default.png (1200x630).');
