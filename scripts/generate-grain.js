#!/usr/bin/env node
/**
 * Generates the film-grain tile the app lays over its whole surface.
 *
 * Flat digital gradients are the single most reliable tell of a cheap dark
 * interface: real materials are never perfectly smooth, and a screen full of
 * mathematically clean ramps reads as a render rather than a thing. A few
 * percent of monochrome grain breaks that up, hides the banding that 8-bit
 * gradients produce on large dark areas, and is most of why premium dark
 * products look "expensive" at a glance.
 *
 * Written with no image dependency for the same reason as the icon generator:
 * PNG is simple enough to emit by hand through Node's zlib.
 *
 * Run: node scripts/generate-grain.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 160; // Large enough that the repeat isn't legible as a pattern.

/**
 * Deterministic PRNG (mulberry32). A fixed seed means regenerating the tile
 * produces byte-identical output, so it doesn't churn in git.
 */
function rng(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Grain in both directions. Only-white speckle washes a dark ground out and
 * only-black speckle muddies it; alternating gives texture that reads as
 * surface rather than as dirt or haze.
 */
function grainRgba() {
  const next = rng(0x11f3a7);
  const buf = Buffer.alloc(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const lift = next() < 0.5;
    // Squared so most pixels are nearly invisible and only a few carry weight —
    // uniform alpha reads as a flat scrim, not as grain.
    const a = Math.round(next() ** 2 * (lift ? 26 : 34));
    const v = lift ? 255 : 0;
    const o = i * 4;
    buf[o] = v;
    buf[o + 1] = v;
    buf[o + 2] = v;
    buf[o + 3] = a;
  }
  return buf;
}

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

function encodePngRgba(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: truecolor + alpha

  const raw = Buffer.alloc(size * (1 + size * 4));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    rgba.copy(raw, o, y * size * 4, (y + 1) * size * 4);
    o += size * 4;
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = path.join(__dirname, '..', 'assets', 'images', 'grain.png');
fs.writeFileSync(out, encodePngRgba(SIZE, grainRgba()));
console.log(`wrote ${path.relative(path.join(__dirname, '..'), out)} (${SIZE}x${SIZE})`);
