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

// Vertical metallic gradient for the letterforms. Real polished metal isn't a
// linear fade — it has a bright specular band where the light source reflects,
// a darker turn below it, then a bounce-light lift near the base. These stops
// fake that reflection profile.
const METAL_STOPS = [
  { t: 0, rgb: [214, 221, 228] }, // upper face, in shade
  { t: 0.34, rgb: [255, 255, 255] }, // specular hit
  { t: 0.46, rgb: [236, 241, 245] },
  { t: 0.62, rgb: [151, 161, 173] }, // turn away from the light
  { t: 0.88, rgb: [186, 195, 205] }, // bounce light off the ground
  { t: 1, rgb: [166, 175, 186] },
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
//
// Proportions are typographic rather than arbitrary: stroke is 0.155 × cap
// height (a confident-but-not-chunky weight — the earlier 0.215 read as Lego
// bricks), bars carry small optical corrections, and sidebearings are tuned
// per letter pair instead of one uniform gap. Terminals are softly rounded so
// the mark reads as drawn rather than assembled from blocks.
// ---------------------------------------------------------------------------
function wordmarkVerticalExtent(size) {
  const u = size / 1024;
  const H = 236 * u;
  const y0 = (size - H) / 2;
  return { y0, H };
}

function wordmarkRects(size) {
  const u = size / 1024; // scale factor from reference units
  const S = 36 * u; // stroke
  const wide = 132 * u; // advance width of L, F, E
  const { y0, H } = wordmarkVerticalExtent(size);
  const r = S * 0.18; // terminal softening

  // Optical sidebearings. A bare I stem needs more air than a letter with a
  // closed left side, and E following F's open right side needs less.
  const gapLI = 62 * u;
  const gapIF = 60 * u;
  const gapFE = 50 * u;

  // Middle bars sit a touch above true center (classic optical correction —
  // a mathematically centered bar looks low) and run slightly short of the
  // full width so the letters don't read as closed boxes.
  const midY = y0 + H * 0.425;
  const barMid = wide * 0.72;
  const barTop = wide * 0.94;

  const totalW = wide + gapLI + S + gapIF + wide + gapFE + wide;
  const x0 = (size - totalW) / 2;

  const rects = [];
  let x = x0;

  // L: stem + foot (foot runs full width — it's the letter's whole identity)
  rects.push([x, y0, S, H, r], [x, y0 + H - S, wide, S, r]);
  x += wide + gapLI;

  // I: single stem
  rects.push([x, y0, S, H, r]);
  x += S + gapIF;

  // F: stem + arm + shortened mid bar
  rects.push([x, y0, S, H, r], [x, y0, barTop, S, r], [x, midY, barMid, S, r]);
  x += wide + gapFE;

  // E: stem + arm + mid bar + foot
  rects.push(
    [x, y0, S, H, r],
    [x, y0, barTop, S, r],
    [x, midY, barMid, S, r],
    [x, y0 + H - S, barTop, S, r]
  );

  return rects;
}

// ---------------------------------------------------------------------------
// Rasterize rounded rects via signed distance field — gives true analytic
// antialiasing (smooth, even edges at every size) rather than the stair-
// stepping that supersampled hard rects produce at icon scale.
// ---------------------------------------------------------------------------
function roundedRectSdf(px, py, rx, ry, rw, rh, r) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const hx = rw / 2 - r;
  const hy = rh / 2 - r;
  const dx = Math.max(Math.abs(px - cx) - hx, 0);
  const dy = Math.max(Math.abs(py - cy) - hy, 0);
  return Math.hypot(dx, dy) - r;
}

function renderMask(size) {
  const rects = wordmarkRects(size);
  const px = new Uint8Array(size * size);
  const aa = 0.7; // edge softness in pixels

  for (const [rx, ry, rw, rh, r] of rects) {
    const pad = Math.ceil(r + aa + 1);
    const xMin = Math.max(0, Math.floor(rx) - pad);
    const xMax = Math.min(size - 1, Math.ceil(rx + rw) + pad);
    const yMin = Math.max(0, Math.floor(ry) - pad);
    const yMax = Math.min(size - 1, Math.ceil(ry + rh) + pad);

    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const d = roundedRectSdf(x + 0.5, y + 0.5, rx, ry, rw, rh, r);
        const cover = Math.max(0, Math.min(1, 0.5 - d / aa));
        const v = Math.round(cover * 255);
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

/**
 * Two-layer glow. A single wide blur just fogs the mark; real emitted light
 * has a tight bright rim right at the edge plus a much fainter wide bloom.
 * Keeping the rim tight is what preserves the crispness of the letterforms.
 */
function glow(mask, size) {
  const rimRadius = Math.max(1, Math.round(size * 0.006));
  let rim = mask;
  for (let pass = 0; pass < 2; pass++) rim = boxBlur(rim, size, rimRadius);

  const bloomRadius = Math.max(2, Math.round(size * 0.022));
  let bloom = mask;
  for (let pass = 0; pass < 2; pass++) bloom = boxBlur(bloom, size, bloomRadius);

  const out = new Uint8Array(size * size);
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.min(255, rim[i] * 1.5 + bloom[i] * 0.7);
  }
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
