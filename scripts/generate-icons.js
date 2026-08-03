#!/usr/bin/env node
/**
 * Generates the LIFE app icon set: a bespoke geometric "LIFE" wordmark
 * (white, rectilinear letterforms) centered on pure black. Zero dependencies —
 * the letters L/I/F/E are axis-aligned rectangles, rasterized straight into a
 * PNG encoded with Node's zlib.
 *
 * Outputs:
 *   public/apple-touch-icon.png  180×180  (Safari Add to Home Screen)
 *   public/icons/icon-192.png    192×192  (manifest)
 *   public/icons/icon-512.png    512×512  (manifest)
 *   assets/images/favicon.png     64×64   (browser tab)
 *
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------------------------------------------------------------------
// Wordmark geometry, defined at a 1024 reference size and scaled per output.
// Stroke ≈ 0.215 × cap height gives a confident bold weight; total width sits
// well inside the 80% maskable-icon safe zone.
// ---------------------------------------------------------------------------
function wordmarkRects(size) {
  const u = size / 1024; // scale factor from reference units
  const S = 42 * u; // stroke
  const H = 196 * u; // cap height
  const wide = 122 * u; // width of L, F, E
  const narrow = S; // width of I
  const gap = 46 * u;
  const barLen = 100 * u; // F/E middle bar length

  const totalW = wide + gap + narrow + gap + wide + gap + wide;
  const x0 = (size - totalW) / 2;
  const y0 = (size - H) / 2;

  const rects = [];
  let x = x0;

  // L: stem + bottom bar
  rects.push([x, y0, S, H], [x, y0 + H - S, wide, S]);
  x += wide + gap;

  // I: stem
  rects.push([x, y0, narrow, H]);
  x += narrow + gap;

  // F: stem + top bar + middle bar
  rects.push([x, y0, S, H], [x, y0, wide, S], [x, y0 + H * 0.44, barLen, S]);
  x += wide + gap;

  // E: stem + top + middle + bottom bars
  rects.push(
    [x, y0, S, H],
    [x, y0, wide, S],
    [x, y0 + H * 0.44, barLen, S],
    [x, y0 + H - S, wide, S]
  );

  return rects;
}

// ---------------------------------------------------------------------------
// Rasterize axis-aligned rects with 4×4 supersampling for clean edges.
// ---------------------------------------------------------------------------
function render(size) {
  const rects = wordmarkRects(size);
  const px = new Uint8Array(size * size); // white coverage 0-255
  const SS = 4;
  const step = 1 / SS;

  for (const [rx, ry, rw, rh] of rects) {
    const xMin = Math.max(0, Math.floor(rx));
    const xMax = Math.min(size - 1, Math.ceil(rx + rw));
    const yMin = Math.max(0, Math.floor(ry));
    const yMax = Math.min(size - 1, Math.ceil(ry + rh));
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        let cover = 0;
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const cx = x + (sx + 0.5) * step;
            const cy = y + (sy + 0.5) * step;
            if (cx >= rx && cx <= rx + rw && cy >= ry && cy <= ry + rh) cover++;
          }
        }
        const v = Math.round((cover / (SS * SS)) * 255);
        const i = y * size + x;
        if (v > px[i]) px[i] = v;
      }
    }
  }
  return px;
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder (8-bit RGB, filter 0).
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, coverage) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  // compression 0, filter 0, interlace 0 (already zeroed)

  const raw = Buffer.alloc(size * (1 + size * 3));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const v = coverage[y * size + x];
      raw[o++] = v;
      raw[o++] = v;
      raw[o++] = v;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------

const root = path.join(__dirname, '..');
const outputs = [
  ['public/apple-touch-icon.png', 180],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['assets/images/favicon.png', 64],
];

for (const [rel, size] of outputs) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(size, render(size)));
  console.log(`wrote ${rel} (${size}×${size})`);
}
