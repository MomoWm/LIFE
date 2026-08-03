#!/usr/bin/env node
/**
 * Generates the LIFE app icon set: a bespoke geometric "LIFE" wordmark with a
 * metallic (silver-to-steel vertical gradient) fill and a soft white glow, on
 * black. Zero dependencies — letters are axis-aligned rectangles, the glow is
 * a box-blurred copy of the same coverage mask, and the PNG is encoded by
 * hand via Node's zlib.
 *
 * Outputs:
 *   public/apple-touch-icon.png      180×180  (Safari Add to Home Screen)
 *   public/apple-touch-icon-152.png  152×152  (iPad)
 *   public/apple-touch-icon-167.png  167×167  (iPad Pro)
 *   public/icons/icon-192.png        192×192  (manifest)
 *   public/icons/icon-512.png        512×512  (manifest)
 *   assets/images/favicon.png         64×64   (browser tab)
 *
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const GLOW_COLOR = [255, 255, 255];

// Vertical metallic gradient stops for the letterforms: bright silver at the
// top, cooling to a darker steel by the baseline — the classic brushed-metal
// light-catches-the-top look.
const METAL_STOPS = [
  { t: 0, rgb: [255, 255, 255] },
  { t: 0.5, rgb: [219, 224, 227] },
  { t: 1, rgb: [172, 180, 186] },
];

function metalColorAt(t) {
  const clamped = Math.max(0, Math.min(1, t));
  let a = METAL_STOPS[0];
  let b = METAL_STOPS[METAL_STOPS.length - 1];
  for (let i = 0; i < METAL_STOPS.length - 1; i++) {
    if (clamped >= METAL_STOPS[i].t && clamped <= METAL_STOPS[i + 1].t) {
      a = METAL_STOPS[i];
      b = METAL_STOPS[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const localT = (clamped - a.t) / span;
  return a.rgb.map((v, i) => Math.round(v + (b.rgb[i] - v) * localT));
}

// ---------------------------------------------------------------------------
// Wordmark geometry, defined at a 1024 reference size and scaled per output.
// Stroke ≈ 0.215 × cap height gives a confident bold weight; total width sits
// well inside the 80% maskable-icon safe zone.
// ---------------------------------------------------------------------------
function wordmarkVerticalExtent(size) {
  const u = size / 1024;
  const H = 196 * u;
  const y0 = (size - H) / 2;
  return { y0, H };
}

function wordmarkRects(size) {
  const u = size / 1024; // scale factor from reference units
  const S = 42 * u; // stroke
  const wide = 122 * u; // width of L, F, E
  const narrow = S; // width of I
  const gap = 46 * u;
  const barLen = 100 * u; // F/E middle bar length
  const { y0, H } = wordmarkVerticalExtent(size);

  const totalW = wide + gap + narrow + gap + wide + gap + wide;
  const x0 = (size - totalW) / 2;

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
function renderMask(size) {
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

// Separable box blur (a few passes approximates a soft Gaussian glow) without
// pulling in any image-processing dependency.
function boxBlur(src, size, radius) {
  const norm = 1 / (radius * 2 + 1);
  const tmp = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += src[y * size + Math.min(size - 1, Math.max(0, x))];
    for (let x = 0; x < size; x++) {
      tmp[y * size + x] = sum * norm;
      const outIdx = Math.min(size - 1, Math.max(0, x - radius));
      const inIdx = Math.min(size - 1, Math.max(0, x + radius + 1));
      sum += src[y * size + inIdx] - src[y * size + outIdx];
    }
  }

  const out = new Float32Array(size * size);
  for (let x = 0; x < size; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(size - 1, Math.max(0, y)) * size + x];
    for (let y = 0; y < size; y++) {
      out[y * size + x] = sum * norm;
      const outIdx = Math.min(size - 1, Math.max(0, y - radius));
      const inIdx = Math.min(size - 1, Math.max(0, y + radius + 1));
      sum += tmp[inIdx * size + x] - tmp[outIdx * size + x];
    }
  }
  return out;
}

function glow(mask, size) {
  const radius = Math.max(1, Math.round(size * 0.018));
  let blurred = mask;
  for (let pass = 0; pass < 3; pass++) blurred = boxBlur(blurred, size, radius);
  // Blurring dilutes peak intensity; boost it back up so the halo actually reads.
  const boost = 2.2;
  const out = new Uint8Array(size * size);
  for (let i = 0; i < out.length; i++) out[i] = Math.min(255, blurred[i] * boost);
  return out;
}

/** Black ground, blurred white glow halo underneath, metallic letters on top. */
function compositeRgb(size) {
  const letterMask = renderMask(size);
  const glowMask = glow(letterMask, size);
  const { y0, H } = wordmarkVerticalExtent(size);
  const rgb = new Uint8Array(size * size * 3);

  // One metal color per row — the gradient only varies vertically.
  const rowColor = new Array(size);
  for (let y = 0; y < size; y++) rowColor[y] = metalColorAt((y - y0) / H);

  for (let y = 0; y < size; y++) {
    const metal = rowColor[y];
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const g = glowMask[i] / 255;
      const l = letterMask[i] / 255;
      for (let c = 0; c < 3; c++) {
        const withGlow = GLOW_COLOR[c] * g; // black background lerped toward white glow
        const withLetter = withGlow + (metal[c] - withGlow) * l; // metallic letters on top
        rgb[i * 3 + c] = Math.round(Math.max(0, Math.min(255, withLetter)));
      }
    }
  }
  return rgb;
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

function encodePng(size, rgb) {
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
      const i = (y * size + x) * 3;
      raw[o++] = rgb[i];
      raw[o++] = rgb[i + 1];
      raw[o++] = rgb[i + 2];
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
  ['public/apple-touch-icon-152.png', 152],
  ['public/apple-touch-icon-167.png', 167],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['assets/images/favicon.png', 64],
];

for (const [rel, size] of outputs) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(size, compositeRgb(size)));
  console.log(`wrote ${rel} (${size}×${size})`);
}
