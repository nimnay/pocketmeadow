const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const eOut = x => 1 - Math.pow(1 - x, 3);
const eBack = x => { if (x <= 0) return 0; if (x >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return Math.max(0, 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)); };
const st = (g, a, b) => clamp((g - a) / (b - a));
const wrap = a => a - TAU * Math.round(a / TAU);
function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const flowAt = (x, y) => -1.95 + Math.sin(x * 0.0034 + y * 0.0011) * 0.5 + Math.cos(y * 0.0041 - x * 0.0013) * 0.45;
const windAt = (x, y, t) => Math.sin(t * 1.1 + x * 0.006 + y * 0.003) * 0.6 + Math.sin(t * 0.53 - x * 0.0025 + y * 0.005) * 0.4;

export const TYPES = {
  daisy: { R: 7, grow: 1.8 }, poppy: { R: 8, grow: 2.2 }, sunflower: { R: 12, grow: 3 },
  lavender: { R: 10, grow: 2.4 }, tulip: { R: 8, grow: 2 }, forget: { R: 9, grow: 2 }, tree: { R: 70, grow: 4.5, layer: 'high' },
  bush: { R: 26, grow: 2.6 }, cabbage: { R: 13, grow: 2.4 }, pumpkin: { R: 17, grow: 3 }, mushroom: { R: 22, grow: 2.2 },
  stone: { R: 11, grow: 0.35, layer: 'ground' }, blanket: { R: 40, grow: 0.7, layer: 'ground' }, pond: { R: 62, grow: 1.4, layer: 'pond' },
  lantern: { R: 8, grow: 0.8 }, cottage: { R: 62, grow: 1.2, layer: 'high' }, fence: { R: 5, grow: 0.4 },
  hay: { R: 11, grow: 0.6 }, pot: { R: 7, grow: 0.6 }, bench: { R: 13, grow: 0.6 }, birdbath: { R: 9, grow: 0.6 },
};
export const CRITTERS = ['rabbit', 'cat', 'duck', 'hedgehog', 'snail', 'cow', 'sheep'];
const FLOWERS = new Set(['daisy', 'poppy', 'sunflower', 'lavender', 'tulip', 'forget']);
const WILT = new Set([...FLOWERS, 'cabbage', 'pumpkin', 'mushroom']);
const LAYER = t => TYPES[t].layer || 'low';
const SWAY = { tree: 0, bush: 0.25, cabbage: 0.3, pumpkin: 0.12, mushroom: 0.1, stone: 0, blanket: 0, pond: 0, lantern: 0.5, cottage: 0, fence: 0, hay: 0, bench: 0, birdbath: 0, pot: 0.15 };
const ROOF_PALS = [['#ec6a3f', '#d0532f', '#9a3a22'], ['#6a83a0', '#4e6683', '#34465c'], ['#cfae5e', '#ad8c42', '#7d6430'], ['#8a9a6a', '#6e7e52', '#4c5838']];
const RABBIT_COLS = ['#c9b08f', '#8c6d52', '#efe9dd', '#a39a8e'];
const CAT_COLS = [['#e39a55', '#c0763a'], ['#8e8e8a', '#6a6a66'], ['#33302e', '#1e1c1b'], ['#efe4d0', '#c98a4a']];
const TEAL = ['#1f6b4f', '#2f8460', '#4fa070', '#86c48c', '#154d39'];
const TREE_PALS_S = {
  spring: [['#4f9a3c', '#66b245', '#8fcb57', '#c2e682', '#357a2c'], ['#e59ab0', '#efb3c4', '#f6ccd8', '#fde6ec', '#c27a90'], ['#7cbc3a', '#94cc46', '#b8e060', '#e2f39a', '#5a9a2a'], TEAL],
  summer: [['#2f7a3a', '#3f9445', '#62b04e', '#9ad36a', '#1f5a2c'], TEAL, ['#5f9e2e', '#7cbc3a', '#a6d553', '#d6ef8a', '#3f7a22'], ['#3d7f4a', '#55995a', '#7fb873', '#b5d99a', '#2a5e36']],
  autumn: [['#c8642c', '#de7f34', '#eea04a', '#f7c76a', '#9a4822'], ['#b8402e', '#d0563a', '#e57a4f', '#f2a77a', '#8a2e22'], ['#c9a43a', '#ddbb45', '#ecd067', '#f7e49a', '#9a7c2a'], TEAL],
  winter: [['#2c5a48', '#3b6e58', '#e6edf0', '#ffffff', '#1e4436'], ['#6e6052', '#857565', '#e9ecee', '#ffffff', '#4e4238'], ['#2c5a48', '#3b6e58', '#e6edf0', '#ffffff', '#1e4436'], ['#1f4e3e', '#2c6450', '#dfe8ec', '#ffffff', '#163a2e']],
};
const TREE_PALS = TREE_PALS_S.summer;
let curSeason = 'summer', iceAmt = 0;
const treePal = p => TREE_PALS_S[curSeason][(p.pal || 0) % 4];
export const SEASONS = {
  spring: { base: '#94cb4c', light: 'rgba(196,230,120,.45)', dark: 'rgba(96,165,64,.3)', strokes: ['#7fb840', '#8bc445', '#9ccf52', '#abd960', '#76ad3a', '#b8e070'], blades: ['#76b23a', '#84be42', '#92c94a', '#a2d457', '#b2dd64', '#6aa634'], speck: ['#ffffff', '#f7c2d2', '#fff1a0'], step: 1 },
  summer: { base: '#7dbd3a', light: 'rgba(170,215,90,.4)', dark: 'rgba(60,130,50,.32)', strokes: ['#6aa832', '#77b538', '#86c140', '#95cc4c', '#5f9c2e', '#a4d55a'], blades: ['#5f9e30', '#6dac36', '#7bb93d', '#8ac547', '#99d052', '#55922b'], speck: ['#fff6c8', '#ffffff', '#ffe27a'], step: 1 },
  autumn: { base: '#b5ad4a', light: 'rgba(225,200,100,.4)', dark: 'rgba(140,120,50,.32)', strokes: ['#a9a044', '#bdb04e', '#c9a043', '#d4b65c', '#9a9440', '#c48a3a'], blades: ['#a49a3e', '#b4a846', '#c2a648', '#ceb456', '#968e3a', '#c4893a'], speck: ['#e2763a', '#f2c14a', '#c8442e'], step: 1 },
  winter: { base: '#eef1ec', light: 'rgba(255,255,255,.6)', dark: 'rgba(200,214,220,.45)', strokes: ['#e2e7e5', '#f6f7f3', '#d5dedf', '#e9eeee', '#dfe6e2', '#fbfbf8'], blades: ['#e6ece2', '#d9e4d3', '#f1f4ee', '#cfdcc8', '#f7f8f4', '#a9c48e'], speck: [], step: 3 },
};
const PETAL = { daisy: '#fbf8ee', poppy: '#ec5a35', sunflower: '#f4c133', lavender: '#9883c8', tulip: '#f2a0bd', forget: '#9cc0ee', bush: '#4f7d2c' };
const BLADE_COLS = ['#55762c', '#618435', '#6e913f', '#7b9d47', '#8aaa52', '#9cb85f'];
const TOD = [
  { m: [244, 196, 202], ma: .32, gl: [255, 214, 170], ga: .16, n: 0, sh: .8 },
  { m: [255, 255, 255], ma: 0, gl: [255, 246, 214], ga: .07, n: 0, sh: 1 },
  { m: [247, 196, 110], ma: .38, gl: [255, 200, 100], ga: .2, n: 0, sh: 1.1 },
  { m: [170, 128, 190], ma: .5, gl: [255, 150, 120], ga: .14, n: .35, sh: .7 },
  { m: [38, 56, 108], ma: .76, gl: [110, 140, 220], ga: .05, n: 1, sh: .25 },
];

// ---------- pixel art ----------
let PIX = 3, ZOOM = 1;
const HX = {};
const rgb = h => HX[h] || (HX[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const lit = (h, k) => '#' + rgb(h).map(v => Math.round(clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255)).toString(16).padStart(2, '0')).join('');
const hash = (i, j, s) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
const vnoise = (x, y, s) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
const ramp = (pal, l) => pal[Math.floor(clamp(l, 0, 0.999) * pal.length)];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function sprite(w, h, f, ol = 0.45) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const W2 = w + 2, H2 = h + 2, c = mk(W2, H2), g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(W2, H2), d = im.data, cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const col = f(x - cx, y - cy, x, y); if (!col) continue;
    const v = rgb(col), o = ((y + 1) * W2 + x + 1) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = 255;
  }
  if (ol > 0) {
    const a = new Uint8ClampedArray(d); ol = 1 - (1 - ol) * 0.38;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const o = (y * W2 + x) * 4; if (a[o + 3]) continue;
      for (const [dx, dy] of N4) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W2 || yy >= H2) continue; const q = (yy * W2 + xx) * 4; if (a[q + 3]) { d[o] = a[q] * ol; d[o + 1] = a[q + 1] * ol; d[o + 2] = a[q + 2] * ol; d[o + 3] = 255; break; } }
    }
  }
  g.putImageData(im, 0, 0); c.ox = Math.floor(W2 / 2); c.oy = Math.floor(H2 / 2); return c;
}
function mapSprite(map, cols, flip = false, ol = 0.4) { const w = map[0].length; return sprite(w, map.length, (x, y, X, Y) => { const ch = map[Y][flip ? w - 1 - X : X]; return ch === '.' ? null : cols[ch]; }, ol); }
function shadowOf(s) { if (s._sh) return s._sh; const c = mk(s.width, s.height), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#14240c'; g.fillRect(0, 0, c.width, c.height); return (s._sh = c); }
function disc(rx, ry, pal, seed, o = {}) {
  const w = 2 * Math.ceil(rx) + 1, h = 2 * Math.ceil(ry) + 1, bump = o.bump ?? 0.18, fq = o.fq ?? 1.4, cl = o.cl ?? Math.max(2, rx / 3), tex = o.tex ?? 0.5;
  return sprite(w, h, (x, y, X, Y) => {
    const a = Math.atan2(y / ry, x / rx), d = Math.hypot(x / (rx + 0.5), y / (ry + 0.5)), e = 1 - bump + vnoise(Math.cos(a) * fq + seed, Math.sin(a) * fq + seed * 0.37, 3) * bump;
    if (d > e) return null;
    const l = 0.52 + (-x / rx - y / ry) * 0.3 + (vnoise((x + seed * 5) / cl, (y - seed * 3) / cl, 5) - 0.5) * tex + (bay(X, Y) - 0.5) * 0.16 - (d > e - 0.12 ? 0.12 : 0);
    if (o.dec) { const r = o.dec(x, y, l, d / e, X, Y); if (r) return r; }
    return ramp(pal, l);
  }, o.ol ?? 0.45);
}
function flower(rad, o) {
  const R = Math.max(1.6, rad * 0.95), L = Math.max(R + 1, rad * 1.18), w = 2 * Math.ceil(L) + 1, cr = Math.max(0.7, R * o.crk);
  return sprite(w, w, (x, y) => {
    const d = Math.hypot(x, y), a = Math.atan2(y, x);
    if (d <= cr) return o.cen[2] && ((x + y) & 1) ? o.cen[2] : x + y < 0 ? o.cen[1] : o.cen[0];
    if (d <= R + 0.35 && Math.cos(o.n * (a + o.rot)) > o.sharp) return x + y < -R * 0.4 ? o.pet[2] : x + y > R * 0.5 ? o.pet[0] : o.pet[1];
    if (o.leaf && d > R * 0.5 && d <= L && Math.cos(2 * (a + o.lrot)) > 0.9) return d > L - 1 ? o.leaf[0] : o.leaf[1];
    return null;
  }, 0.42);
}
const FL = {
  daisy: () => ({ n: 8, sharp: 0.05, pet: ['#d9d2bd', '#fbf8ee', '#ffffff'], cen: ['#d4901c', '#f2bf2e'], crk: 0.32, leaf: ['#4f7a2c', '#6f9640'] }),
  poppy: () => ({ n: 5, sharp: -0.45, pet: ['#b8382a', '#e5492f', '#f2734a'], cen: ['#2a201c', '#3a2a24'], crk: 0.24, leaf: ['#6f8c4c', '#7f9c5c'] }),
  sunflower: () => ({ n: 14, sharp: -0.05, pet: ['#d48a1c', '#efa823', '#f7cf3c'], cen: ['#3e2614', '#5b3a1f', '#8b5a2b'], crk: 0.46, leaf: ['#3f6a24', '#5b8a33'] }),
  tulip: r => { const H = [['#f08db0', '#f6b0c8', '#c9557f'], ['#f4a24a', '#f8c178', '#c96a22'], ['#f2e4a0', '#fbf2c8', '#cbb05a'], ['#d64a4a', '#ea7a72', '#9a2a35']][Math.floor(r() * 4)]; return { n: 3, sharp: -0.55, pet: [H[2], H[0], H[1]], cen: [H[2], H[2]], crk: 0.2, leaf: ['#5f8a40', '#6f9a4c'] }; },
};
let _sprout = null;
const SPROUT = () => _sprout || (_sprout = mapSprite(['g.g', '.g.'], { g: '#6f9640' }, false, 0.4));
const LANTERN = ['.kkk.', 'kyYyk', 'kYwYk', 'kyYyk', '.kkk.'], LANTC = { k: '#5a4a32', y: '#f3d08a', Y: '#e6b860', w: '#fff4cf' };
const DECOR = {
  hay: () => [['.yyyyyyy.', 'yyYyyyYyy', 'yyyyyyyyy', 'bbbbbbbbb', 'yyyyYyyyy', '.yyyyyyy.'], { y: '#ecd17a', Y: '#d9b85a', b: '#b8924a' }],
  pot: () => [['.r.p.', 'rgrpp', '.ggg.', 'ttttt', '.tTt.', '.ttt.'], { t: '#d08458', T: '#b86c44', g: '#79a352', r: '#ef7a68', p: '#f6bccf' }],
  bench: () => [['wwwwwwwwwww', 'WWWWWWWWWWW', 'wwwwwwwwwww', '.k.......k.', '.k.......k.'], { w: '#c89a68', W: '#ad8254', k: '#7e6248' }],
  birdbath: win => [['.sssssss.', 'sbbbbbbbs', '.sssssss.', '....S....', '....S....', '...sSs...', '..sssss..'], { s: '#e2ddd0', S: '#c8c1b2', b: win ? '#eef5f8' : '#9fd2ec' }],
};
const BASKET = ['.hhhhh.', 'h.....h', 'bbbbbbb', 'bRrRrRb', '.bbbbb.'], BASKC = { h: '#7a5428', b: '#a8783e', R: '#c94a3e', r: '#e8806a' };
const BOOK = ['BBBBB', 'BwBwB', 'BwBwB', 'BBBBB'], BOOKC = { B: '#3f5f8a', w: '#f7f2e4' };
const CUP = ['.ww.', 'wccw', '.ww.'], CUPC = { w: '#fbfaf5', c: '#9a6a3a' };
function genPlant(p, rad, st) {
  const t = p.type, r = rng(p.seed || 1), win = curSeason === 'winter', sd = (p.seed || 1) % 997;
  if (st === 0) return SPROUT();
  if (FL[t]) { const o = FL[t](r); o.rot = r() * TAU; o.lrot = r() * TAU; return flower(rad, o); }
  if (t === 'lavender') {
    const RR = Math.max(2, rad), n = 7, rays = [], LP = ['#7a62ad', '#9883c8', '#b4a3dc'];
    for (let i = 0; i < n; i++) rays.push([i / n * TAU + (r() - 0.5) * 0.5, RR * (0.7 + r() * 0.3)]);
    return sprite(2 * Math.ceil(RR) + 1, 2 * Math.ceil(RR) + 1, (x, y, X, Y) => {
      for (const [a, L] of rays) { const ca = Math.cos(a), sa = Math.sin(a), pr = x * ca + y * sa, pp = Math.abs(-x * sa + y * ca); if (pr < 0 || pr > L + 0.4) continue; const tip = pr > L * 0.45; if (pp < (tip ? 0.85 : 0.55)) return tip ? LP[(X * 2 + Y) % 3] : '#7c8f62'; }
      return null;
    }, 0.42);
  }
  if (t === 'forget') {
    const RR = Math.max(2, rad * 0.95), fl = [];
    for (let i = 0; i < Math.max(3, Math.round(RR * 1.1)); i++) { const a = r() * TAU, d = Math.sqrt(r()) * RR * 0.7; fl.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d), r() < 0.5 ? '#8db6ea' : '#a6c6f0']); }
    return sprite(2 * Math.ceil(RR) + 1, 2 * Math.ceil(RR) + 1, (x, y) => {
      for (const [fx, fy, c] of fl) { const m = Math.abs(x - fx) + Math.abs(y - fy); if (m === 0) return '#fbf3c4'; if (m === 1) return c; }
      const d = Math.hypot(x, y); if (d <= RR && vnoise((x + sd) / 2, (y - sd) / 2, 4) > 0.38 + d / RR * 0.3) return x + y < 0 ? '#86ad62' : '#5f8a3c';
      return null;
    }, 0.42);
  }
  if (t === 'bush') return disc(Math.max(2, rad * 0.95), Math.max(2, rad * 0.88), win ? ['#24401a', '#2f5420', '#3f6a2a', '#e6edf0', '#ffffff'] : ['#24401a', '#2f5420', '#3f6a2a', '#527f33', '#86ad55'], sd, { bump: 0.22, fq: 1.8, cl: Math.max(2, rad / 2.6), tex: 0.7, dec: (x, y, l, dn, X, Y) => { if (st < 2 || win || p.picked) return null; const h = hash(X, Y, sd); return h < 0.07 && dn < 0.85 ? (h < 0.02 ? '#f6c6c6' : '#c8323a') : null; } });
  if (t === 'tree') {
    const P = treePal(p), RR = Math.max(2, rad * 0.95), pi = (p.pal || 0) % 4;
    return disc(RR, RR * 0.96, [P[4], P[0], P[1], P[2], P[3]], sd, { bump: 0.28, fq: 2.2, cl: Math.max(2, RR / 3.2), tex: 0.85, ol: 0.5, dec: (x, y, l, dn, X, Y) => { const h = hash(X, Y, sd); if (curSeason === 'autumn' && h < 0.035) return '#c8442e'; if (curSeason === 'summer' && pi === 2 && l > 0.45 && h < 0.03) return '#e0533d'; if (curSeason === 'spring' && pi !== 1 && l > 0.5 && h < 0.03) return h < 0.012 ? '#fffaf0' : '#f7b7c4'; return null; } });
  }
  if (t === 'cabbage') {
    const RR = Math.max(2, rad * 0.95);
    return sprite(2 * Math.ceil(RR) + 1, 2 * Math.ceil(RR) + 1, (x, y, X, Y) => {
      const d = Math.hypot(x, y) / RR, a = Math.atan2(y, x); if (d > 1 - (Math.cos(a * 6) < -0.6 ? 0.12 : 0)) return null;
      if (Math.abs(Math.sin(a * 3)) < 0.15 && d > 0.35) return '#6b9a4c';
      const l = (-x - y) / (RR * 3) + (bay(X, Y) - 0.5) * 0.1;
      if (d > 0.68) return l > 0 ? '#9cc77a' : '#8fba6c'; if (d > 0.38) return l > 0 ? '#c2dca4' : '#b3d491'; return '#d5e9b4';
    }, 0.45);
  }
  if (t === 'pumpkin') {
    const PR = Math.max(1.5, rad * 0.7), L = Math.max(2.5, rad * 1.3), PP = ['#b85a22', '#d9702a', '#e8862f', '#f4a24a', '#f8c078'], LG = ['#3f6a24', '#4f7d2c', '#5f8d36', '#82ab55'];
    return sprite(2 * Math.ceil(L) + 1, 2 * Math.ceil(L) + 1, (x, y, X, Y) => {
      const d = Math.hypot(x, y * 1.1), a = Math.atan2(y, x);
      if (st === 2 && d <= PR) { if (d < 1) return '#6b5a2c'; return ramp(PP, 0.5 + (-x - y) / (PR * 2.5) + Math.cos(a * 7 + 0.3) * 0.25 + (bay(X, Y) - 0.5) * 0.15); }
      const dd = Math.hypot(x, y), lv = vnoise((x + sd) / 2.5, (y - sd) / 2.5, 4);
      if (dd <= L && lv > 0.42 + dd / L * 0.25) return ramp(LG, 0.4 + (-x - y) / (L * 2) + (lv - 0.5));
      return null;
    }, 0.45);
  }
  if (t === 'mushroom') {
    const E = Math.max(2, rad * 0.95), red = r() < 0.5, caps = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + (r() - 0.5) * 0.3, d = rad * (0.62 + (r() - 0.5) * 0.15); caps.push([Math.cos(a) * d, Math.sin(a) * d, Math.max(1, rad * (0.13 + r() * 0.1))]); }
    return sprite(2 * Math.ceil(E) + 1, 2 * Math.ceil(E) + 1, (x, y, X, Y) => {
      for (const [cx, cy, cr] of caps) { const dx = x - cx, dy = y - cy, dd = Math.hypot(dx, dy); if (dd <= cr + 0.2) { if (red) return hash(X, Y, 7) < 0.25 && dd < cr * 0.8 ? '#fbf6ea' : dx + dy < 0 ? '#de6a5a' : '#c9443a'; return dd < cr * 0.4 ? '#c8a878' : dx + dy < 0 ? '#f6efe0' : '#e9dcc0'; } }
      return null;
    }, 0.45);
  }
  if (t === 'stone') return disc(Math.max(1.5, rad * 0.95), Math.max(1, rad * 0.68), win ? ['#b8bcbc', '#d5dade', '#eef1f2', '#ffffff'] : ['#a89c80', '#c4b89c', '#e8dfc8', '#f5efe0'], sd, { bump: 0.2, fq: 1.2, cl: 2, tex: 0.3, ol: 0.5, dec: (x, y, l, dn, X, Y) => !win && hash(X, Y, sd) < 0.1 && l < 0.45 ? '#7d9445' : null });
  if (t === 'lantern') return mapSprite(LANTERN, LANTC, false, 0.4);
  if (DECOR[t]) { const [m, c] = DECOR[t](win); return mapSprite(m, c, false, 0.45); }
  if (t === 'fence') return mapSprite(['wwl', 'wwl', 'lll'], { w: win ? '#ffffff' : '#f7f2e6', l: '#c9bea4' }, false, 0.5);
  if (t === 'blanket') {
    const w = Math.max(4, Math.round(rad * 1.6)), h = Math.max(3, Math.round(rad * 1.15));
    const items = st === 2 && w >= 14 ? [[BASKET, BASKC, Math.round(w * 0.6), Math.round(h * 0.15)], [BOOK, BOOKC, Math.round(w * 0.12), Math.round(h * 0.55)], [CUP, CUPC, Math.round(w * 0.42), Math.round(h * 0.6)]] : [];
    return sprite(w, h, (x, y, X, Y) => {
      for (const [m, c, mx, my] of items) { const ix = X - mx, iy = Y - my; if (iy >= 0 && iy < m.length && ix >= 0 && ix < m[0].length) { const ch = m[iy][ix]; if (ch !== '.') return c[ch]; } }
      const a = (X >> 1) & 1, b = (Y >> 1) & 1; return a && b ? '#8fb07c' : a || b ? '#c9d6b4' : '#f1ead6';
    }, 0.5);
  }
  if (t === 'cottage') {
    const P = ROOF_PALS[(p.pal || 0) % 4], w = Math.max(10, Math.round(rad * 1.5)), h = Math.max(9, Math.round(rad * 1.15)), rh = Math.round(h * 0.48), chx = w - Math.round(w * 0.3);
    const dw = Math.max(3, Math.round(w * 0.14)), dx0 = Math.round((w - dw) / 2), dh = Math.max(4, Math.round((h - rh) * 0.72)), ws = Math.max(3, Math.round(w * 0.13)), wy0 = rh + Math.max(1, Math.round((h - rh) * 0.2)), wins = [Math.round(w * 0.18), w - Math.round(w * 0.18) - ws];
    const R0 = win ? '#f6f9fa' : P[0], R1 = win ? '#e2ebf0' : P[1], R2 = win ? '#cbd8e0' : P[2];
    return sprite(w, h, (x, y, X, Y) => {
      if (Y < rh) {
        const ins = Math.round((rh - 1 - Y) * 0.9);
        if (X >= ins && X <= w - 1 - ins) return Y === rh - 1 ? R2 : X === ins || X === w - 1 - ins || Y % 3 === 2 ? R1 : R0;
        if (X >= chx && X <= chx + 2 && Y < rh * 0.6) return Y === 0 ? '#7e5e4c' : win && Y === 1 ? '#ffffff' : '#b97a62';
        return null;
      }
      if (X < 2 || X > w - 3) return null;
      if (X >= dx0 && X < dx0 + dw && Y >= h - dh) return X === dx0 + dw - 2 && Y === h - Math.round(dh / 2) ? '#f2c86a' : Y === h - dh ? '#73492c' : '#93603a';
      for (const wx of wins) {
        if (X >= wx && X < wx + ws && Y >= wy0 && Y < wy0 + ws) return X === wx + (ws >> 1) || Y === wy0 + (ws >> 1) ? '#fbf6ea' : '#9cc8da';
        if (!win && Y === wy0 + ws && X >= wx - 1 && X <= wx + ws) return (X & 1) ? '#ef7a68' : '#79a352';
      }
      if (!win && X <= 3 && Y > rh + 1 && hash(X, Y, sd) < 0.55) return '#79a352';
      return Y === h - 1 ? '#ddcba6' : '#f4e9cf';
    }, 0.45);
  }
  if (t === 'pond') {
    const rx = Math.max(3, rad * 0.95), ry = rx * 0.74, pads = [];
    for (let i = 0; i < 5; i++) { const a = r() * TAU, d = 0.3 + r() * 0.4; pads.push([Math.cos(a) * rx * d, Math.sin(a) * ry * d, Math.max(1.1, rx * (0.08 + r() * 0.05))]); }
    return sprite(2 * Math.ceil(rx * 1.2) + 1, 2 * Math.ceil(ry * 1.2) + 1, (x, y, X, Y) => {
      const a = Math.atan2(y / ry, x / rx), d = Math.hypot(x / rx, y / ry) - (vnoise(Math.cos(a) * 1.6 + sd, Math.sin(a) * 1.6, 3) - 0.5) * 0.22;
      if (d > 1.17) return null;
      if (d > 1.09) return hash(X, Y, sd) < 0.3 ? (win ? '#dfe6e2' : '#5d7d33') : (win ? '#cfdcc8' : '#4f8f34');
      if (d > 0.99) return bay(X, Y) > 0.5 ? (win ? '#f6f7f3' : '#eee4c8') : (win ? '#e2e7e5' : '#ddd0aa');
      const tq = d + (bay(X, Y) - 0.5) * 0.12;
      if (win) return hash(X, Y, sd + 1) < 0.025 ? '#9fbfd2' : tq < 0.6 ? '#cfe2ec' : tq < 0.86 ? '#e2eff6' : '#f3f9fb';
      for (let i = 0; i < pads.length; i++) { const [px, py, pr] = pads[i], dd = Math.hypot(x - px, y - py); if (dd <= pr) { if (i === 2 && dd < 0.8) return '#f6d36a'; if (i === 2 && dd < 1.5) return '#f4b8c8'; return x - px + y - py < 0 ? '#86b45a' : '#6f9a48'; } }
      if ((Y * 7 + Math.floor(X / 3)) % 13 === 0 && tq < 0.9) return '#a9dcf5';
      return tq < 0.5 ? '#2a7fc8' : tq < 0.76 ? '#3b93d8' : tq < 0.92 ? '#5fb3ea' : '#8fd0f2';
    }, 0);
  }
  return SPROUT();
}
const CAT_SIT = ['....b.b', '....bbb', '....byb', '.....bp', '..bbbb.', '.bsbsb.', 'bbsbsbb', 'b.bbbb.'];
const CMAP = {
  rabbit: { sit: ['....b.b.', '....e.e.', '....bbbb', '.bbbbbkb', 'tbbbbbbn', '.bbllbb.', '..bb.bb.'], hop: ['...bb...', '....bbbb', '.bbbbbkb', 'tbbbbbbn', 'bb....bb'] },
  cat: { sit: CAT_SIT, pet: CAT_SIT.map(r => r.replace(/y/g, 'k')), w1: ['b.......b.b', '.b......bbb', '..bsbsbbbyb', '..bbbbbbbbp', '..bbbbbbb..', '..b.b..b.b.'], w2: ['b.......b.b', '.b......bbb', '..bsbsbbbyb', '..bbbbbbbbp', '..bbbbbbb..', '...bb...bb.'], sleep: ['..bbbbb..', '.bsbsbbbb', 'bbbbbbkbb', 'bsbbbbbbp', '.bbbbbbb.'] },
  duck: { swim: ['.....hh.', '....hhko', '.bb.hh..', 'bbwwbbb.', '.bbbbbb.'], dab: ['........', '........', 'bb......', 'bbwwbb..', '.bbbbbb.'], kid: ['..yy.', '..yko', 'yyyy.', '.yy..'] },
  hedgehog: { w1: ['..qQqQ...', '.qQqQqq..', 'qQqQqqssk', 'qqqqqsss.', '.f...f...'], w2: ['..qQqQ...', '.qQqQqq..', 'qQqQqqssk', 'qqqqqsss.', '..f...f..'], curl: ['.qQq.', 'qQqQq', 'qqQqQ', 'qQqqq', '.qqq.'] },
  cow: { w1: ['..........h.h', 't.........www', 'twwkkwwwwwwew', '.wkkkwwwwkwpp', '.wwwwwwwkkw..', '..l.l...l.l..', '..l.l...l.l..'], w2: ['..........h.h', 't.........www', 'twwkkwwwwwwew', '.wkkkwwwwkwpp', '.wwwwwwwkkw..', '..ll....ll...', '.l..l..l..l..'], graze: ['.............', 't............', 'twwkkwwwwww..', '.wkkkwwwwkwww', '.wwwwwwwkkwew', '..l.l...l.lpp', '..l.l...l.l..'] },
  sheep: { w1: ['........dd.', '.ffffffddde', 'fffFfffdddd', 'ffffffFfdd.', '.fffFfff...', '..d.d.d.d..', '..d.d.d.d..'], w2: ['........dd.', '.ffffffddde', 'fffFfffdddd', 'ffffffFfdd.', '.fffFfff...', '..dd..dd...', '.d..d.d..d.'], graze: ['...........', '.ffffff....', 'fffFffffd..', 'ffffffFfddd', '.fffFffddde', '..d.d.d.d..', '..d.d.d.d..'] },
  snail: { go: ['..sss....a', '.shSss..b.', '.sSssSs.b.', '.ssSSss.bb', 'bbbbbbbbbb'], hide: ['..sss.....', '.shSss....', '.sSssSs...', '.ssSSss...', '..........'] },
};
function critterCols(a) {
  const k = a.kind;
  if (k === 'rabbit') { const b = a.col || RABBIT_COLS[0]; return { b, l: lit(b, 0.35), e: '#e9b4a8', k: '#2a2220', n: '#d98a8a', t: '#f8f5ee' }; }
  if (k === 'cat') { const [b, s2] = a.col || CAT_COLS[0]; return { b, s: s2, y: '#c9b440', p: '#d98a8a', k: '#2a2220' }; }
  if (k === 'duck') return a.duckling ? { y: '#f2d36b', o: '#d99a3a', k: '#1e1c1b' } : a.style ? { h: '#f6f3ea', b: '#f6f3ea', w: '#ddd6c6', o: '#e8a53a', k: '#1e1c1b' } : { h: '#2f6b4a', b: '#9a8a72', w: '#6f604c', o: '#e8a53a', k: '#1e1c1b' };
  if (k === 'cow') return { w: '#f6f1e6', k: a.col || '#3e3630', p: '#efb6aa', h: '#e6dabf', e: '#2a2220', l: '#6a5c50', t: a.col || '#3e3630' };
  if (k === 'sheep') return a.col === '#5e524a' ? { f: '#5e524a', F: '#50463f', d: '#2e2622', e: '#e8e2d6' } : { f: '#f6f2e8', F: '#e6e0d2', d: '#4e423a', e: '#f6f2e8' };
  if (k === 'hedgehog') return { q: '#3e3226', Q: '#a08a6a', s: '#d9c4a4', k: '#2a2220', f: '#4a3a2a' };
  return { s: '#b0763c', S: '#6e441e', h: '#e3a868', b: '#cdb99a', a: '#5a4a3a' };
}
function critterFrame(a) {
  const k = a.kind, s = a.state;
  if (k === 'rabbit') return s === 'hop' ? 'hop' : 'sit';
  if (k === 'cat') return s === 'sleep' ? 'sleep' : s === 'pet' ? 'pet' : a.moving ? (Math.floor((a.wp || 0) / 1.6) % 2 ? 'w2' : 'w1') : 'sit';
  if (k === 'duck') return a.duckling ? 'kid' : a.dab > 0 ? 'dab' : 'swim';
  if (k === 'cow' || k === 'sheep') return s === 'graze' ? 'graze' : a.moving && Math.floor((a.wp || 0) / 1.4) % 2 ? 'w2' : 'w1';
  if (k === 'hedgehog') return s === 'curl' ? 'curl' : Math.floor((a.wp || 0) / 1.2) % 2 ? 'w2' : 'w1';
  return s === 'hide' ? 'hide' : 'go';
}
const CCACHE = new Map();
function critterSprite(a, flip) {
  const f = critterFrame(a), key = a.kind + f + String(a.col || '') + (a.style ? 1 : 0) + (a.duckling ? 1 : 0) + (flip ? 1 : 0);
  let s = CCACHE.get(key); if (!s) { s = mapSprite(CMAP[a.kind][f], critterCols(a), flip, 0.4); CCACHE.set(key, s); } return s;
}
const GL = {};
function glowSpr(R, col) {
  const k = R + col; if (GL[k]) return GL[k];
  const w = 2 * R + 1, c = mk(w, w), g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(w, w), v = rgb(col);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const t = Math.hypot(x - R, y - R) / R + (bay(x, y) - 0.5) * 0.12; const a = t < 0.22 ? 1 : t < 0.45 ? 0.55 : t < 0.7 ? 0.3 : t < 1 ? 0.12 : 0; if (!a) continue; const o = (y * w + x) * 4; im.data[o] = v[0]; im.data[o + 1] = v[1]; im.data[o + 2] = v[2]; im.data[o + 3] = a * 255; }
  g.putImageData(im, 0, 0); c.R = R; return (GL[k] = c);
}
const GRADE = [
  { t: [255, 206, 200], k: 0.3, sat: 0.95, bri: 1.0, n: 0 },
  { t: [255, 255, 255], k: 0, sat: 1, bri: 1, n: 0 },
  { t: [255, 190, 110], k: 0.34, sat: 1.12, bri: 1.02, n: 0 },
  { t: [190, 140, 210], k: 0.4, sat: 0.78, bri: 0.86, n: 0.3 },
  { t: [255, 255, 255], k: 0, sat: 0.6, bri: 1, n: 1 },
];
const NIGHT = ['#0b1226', '#15224a', '#22356b', '#30508a', '#4a74a8', '#7aa2c8', '#b9d3ea'].map(rgb);
let LUT = null, lutKey = '';
function gradeAt(pos, rain, storm) {
  const i = Math.floor(pos) % 5, j = (i + 1) % 5, f = pos - Math.floor(pos), A = GRADE[i], B = GRADE[j];
  return { t: A.t.map((v, k) => lerp(v, B.t[k], f)), k: lerp(A.k, B.k, f), sat: lerp(A.sat, B.sat, f) * (1 - rain * 0.3), bri: lerp(A.bri, B.bri, f) * (1 - rain * 0.16 - storm * 0.12), n: lerp(A.n, B.n, f), rain };
}
function buildLUT(G) {
  const L = LUT || (LUT = new Uint8ClampedArray(32768 * 3));
  for (let ri = 0; ri < 32; ri++) for (let gi = 0; gi < 32; gi++) for (let bi = 0; bi < 32; bi++) {
    let r = ri * 8 + 4, g = gi * 8 + 4, b = bi * 8 + 4; const l = r * 0.3 + g * 0.59 + b * 0.11;
    r = l + (r - l) * G.sat; g = l + (g - l) * G.sat; b = l + (b - l) * G.sat;
    r *= lerp(1, G.t[0] / 255, G.k) * G.bri; g *= lerp(1, G.t[1] / 255, G.k) * G.bri; b *= lerp(1, G.t[2] / 255, G.k) * G.bri;
    if (G.rain > 0) b += 10 * G.rain;
    if (G.n > 0) { const q = NIGHT[Math.min(6, Math.floor(Math.pow(clamp(l / 255), 1.25) * 7))]; r = lerp(r, q[0] * 0.8 + r * 0.12, G.n); g = lerp(g, q[1] * 0.8 + g * 0.12, G.n); b = lerp(b, q[2] * 0.8 + b * 0.12, G.n); }
    const o = (ri * 1024 + gi * 32 + bi) * 3; L[o] = r; L[o + 1] = g; L[o + 2] = b;
  }
}
const DIGS = { '+': ['...', '.w.', 'www', '.w.', '...'], 0: ['www', 'w.w', 'w.w', 'w.w', 'www'], 1: ['.w.', 'ww.', '.w.', '.w.', 'www'], 2: ['www', '..w', 'www', 'w..', 'www'], 3: ['www', '..w', '.ww', '..w', 'www'], 4: ['w.w', 'w.w', 'www', '..w', '..w'], 5: ['www', 'w..', 'www', '..w', 'www'], 6: ['www', 'w..', 'www', 'w.w', 'www'], 7: ['www', '..w', '..w', '.w.', '.w.'], 8: ['www', 'w.w', 'www', 'w.w', 'www'], 9: ['www', 'w.w', 'www', '..w', 'www'] };
const DCACHE = {};
const digSpr = c => DCACHE[c] || (DCACHE[c] = mapSprite(DIGS[c], { w: '#fffdf4' }, false, 0.15));
let _pop = null;
const POP = () => _pop || (_pop = { cabbage: mapSprite(['.gg.', 'gGGg', 'gGGg', '.gg.'], { g: '#8fba6c', G: '#d5e9b4' }, false, 0.4), pumpkin: mapSprite(['..s.', 'oOOo', 'oOOo', '.oo.'], { s: '#6b5a2c', o: '#e07a2a', O: '#f4a24a' }, false, 0.4), berries: mapSprite(['.r.r', 'rRr.', '.rr.'], { r: '#c8323a', R: '#f6c6c6' }, false, 0.4) });
const VMAP = {
  fox: { w1: ['.........o.o', '.........ooo', 'w.......ooko', 'wdoooooooook', '.dowwwwwoo..', '..k.k...k.k.'], w2: ['.........o.o', '.........ooo', 'w.......ooko', 'wdoooooooook', '.dowwwwwoo..', '...k.k..k.k.'], sniff: ['............', '.........o.o', 'w........ooo', 'wdooooooooko', '.dowwwwwook.', '..k.k...k.k.'] },
  deer: { w1: ['.........a.a.', '.........aaa.', '.........bbb.', '........bbkbb', '........bb...', 'w.bbbbbbbb...', 'wbbbllbbbb...', '.bbbbbbbbb...', '.b.b....b.b..', '.k.k....k.k..'], w2: ['.........a.a.', '.........aaa.', '.........bbb.', '........bbkbb', '........bb...', 'w.bbbbbbbb...', 'wbbbllbbbb...', '.bbbbbbbbb...', '..b.b..b.b...', '..k.k..k.k...'], graze: ['.............', '.............', '.............', '.............', '.............', 'w.bbbbbbbb...', 'wbbbllbbbbb.a', '.bbbbbbbb.bba', '.b.b....b.bbk', '.k.k....k.k..'] },
};
const VCOL = { fox: { o: '#d9702a', w: '#fbf3e4', d: '#a8501e', k: '#2a2220' }, deer: { b: '#a8703f', l: '#e8d0a8', w: '#f4eee0', k: '#2a2220', a: '#d9c4a4' } };
const ICON_RAD = { daisy: 8, poppy: 8, sunflower: 8, lavender: 10, tulip: 8, forget: 10, tree: 10, bush: 10, cabbage: 10, pumpkin: 7.5, mushroom: 10, stone: 9, blanket: 13, pond: 8.5, cottage: 13 };
const ICON_SEED = { daisy: 3, poppy: 8, sunflower: 2, lavender: 4, tulip: 1, forget: 6, tree: 9, bush: 4, cabbage: 2, pumpkin: 5, mushroom: 3, stone: 7, blanket: 1, pond: 11, lantern: 1, cottage: 2 };
const ICON_WATER = ['...b...', '..bdb..', '..bdb..', '.bdddb.', 'bdwdddb', 'bwddddb', 'bddddeb', '.beeeb.', '..bbb..'];
const ICON_DIG = ['........hh', '.......hh.', '......hh..', '.....hh...', '..ss.h....', '.sSssh....', 'sSsss.....', 'sssss.....', '.sss......', '..s.......'];
export function drawIcon(c, type) {
  const x = c.getContext('2d', { willReadFrequently: true }), S = c.width; x.clearRect(0, 0, S, S); x.imageSmoothingEnabled = false;
  let spr, k = 1;
  if (type === 'water') { spr = mapSprite(ICON_WATER, { b: '#4f86b8', d: '#86b9e4', w: '#e6f3ff', e: '#6a9fd0' }, false, 0); k = 2; }
  else if (type === 'dig') { spr = mapSprite(ICON_DIG, { h: '#8a5a2b', s: '#aab3b8', S: '#e2e8ea' }, false, 0); k = 2; }
  else if (CRITTERS.includes(type)) { spr = critterSprite({ kind: type, state: type === 'cat' ? 'sleep' : type === 'hedgehog' || type === 'snail' ? 'walk' : 'sit', style: 1, col: null, wp: 0 }, false); k = 2; }
  else if (type === 'fence') spr = sprite(20, 9, (xx, yy, X, Y) => (X % 7) < 3 && Y >= 1 && Y <= 7 ? ((X % 7) === 2 || Y === 7 ? '#c9bea4' : '#f7f2e6') : (Y === 3 || Y === 5) ? '#efe7d4' : null, 0.5);
  else if (type === 'harvest') { spr = mapSprite(['.hhhhh.', 'h.ggo.h', 'bbbbbbb', 'bRrRrRb', '.bbbbb.'], { ...BASKC, g: '#8fba6c', o: '#e07a2a' }, false, 0.4); k = 2; }
  else if (type === 'path') spr = sprite(20, 20, (xx, yy, X, Y) => { const dd = Math.abs(X + Y - 19); return dd > 3.5 ? null : dd > 2.5 ? '#a8966c' : hash(X, Y, 4) < 0.12 ? '#efe6cc' : '#d8c9a0'; }, 0.4);
  else if (type === 'bed') spr = sprite(20, 14, (xx, yy, X, Y) => X === 0 || Y === 0 || X === 19 || Y === 13 ? '#8a6a44' : (X === 5 || X === 13) && Y % 3 === 2 ? '#6f9640' : Y % 3 === 0 ? '#56391f' : '#6e4c2c', 0.4);
  else if (type === 'lantern' || DECOR[type]) { spr = genPlant({ type, seed: 1 }, 3, 2); k = 2; }
  else spr = genPlant({ type, seed: ICON_SEED[type] || 1, sc: 1, pal: 0 }, ICON_RAD[type] || 8, 2);
  const w = spr.width * k, h = spr.height * k; x.drawImage(spr, Math.floor((S - w) / 2), Math.floor((S - h) / 2), w, h);
}
function makeGround(cw, ch, season) {
  const S = SEASONS[season], lum = v => v[0] * 0.3 + v[1] * 0.59 + v[2] * 0.11, tones = S.strokes.concat([S.base]).map(rgb).sort((a, b) => lum(a) - lum(b));
  const c = mk(cw, ch), g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(cw, ch), d = im.data, win = season === 'winter', sp = S.speck.map(rgb), GP = ['#6f9e44', '#7fb24c', '#8fbf5a'].map(rgb), WH = [255, 255, 255];
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const n = vnoise(x / 38, y / 38, 1) * 0.55 + vnoise(x / 12, y / 12, 2) * 0.3 + vnoise(x / 4, y / 4, 4) * 0.15, b = bay(x, y);
    const t = clamp((n - 0.22) / 0.56 + (b - 0.5) * 0.3, 0, 0.999); let col = tones[Math.floor(t * tones.length)];
    if (win && vnoise(x / 16, y / 16, 13) + (b - 0.5) * 0.08 > 0.7) col = GP[Math.min(2, Math.floor(n * 3))];
    const h = hash(x, y, 3);
    if (sp.length && vnoise(x / 22, y / 22, 9) > 0.6 && h < 0.05) col = sp[Math.floor(h / 0.05 * sp.length)]; else if (win && h < 0.006) col = WH;
    const o = (y * cw + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const r = rng(11), dk = tones.slice(0, 2).map(v => 'rgb(' + v.join(',') + ')');
  for (let k = 0; k < 2; k++) { g.fillStyle = dk[k]; g.beginPath(); for (let i = 0; i < cw * ch / 90; i++) { const x = (r() * cw) | 0, y = (r() * ch) | 0, a = flowAt(x * PIX, y * PIX); g.rect(x, y, 1, 1); g.rect(x + Math.round(Math.cos(a)), y + Math.round(Math.sin(a)), 1, 1); } g.fill(); }
  return c;
}
function makeCanopy(cw, ch) {
  const pad = 24, w = cw + pad * 2, h = ch + pad * 2, c = mk(w, h), g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(w, h), d = im.data, m = Math.min(cw, ch);
  const A = [[-0.04 * cw, 0.08 * ch, 0.42 * m], [0.82 * cw, -0.06 * ch, 0.36 * m], [1.04 * cw, 0.6 * ch, 0.34 * m], [0.04 * cw, 1.04 * ch, 0.32 * m]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x - pad, Y = y - pad; let f = 0; for (const [ax, ay, r] of A) f = Math.max(f, 1 - Math.hypot(X - ax, Y - ay) / r); if (f <= 0) continue;
    if (f * 1.2 + (vnoise(X / 8, Y / 8, 21) - 0.5) * 0.8 + (vnoise(X / 2.5, Y / 2.5, 22) - 0.5) * 0.3 > 0.5) { const o = (y * w + x) * 4; d[o] = 16; d[o + 1] = 34; d[o + 2] = 10; d[o + 3] = 255; }
  }
  g.putImageData(im, 0, 0); return { c, pad };
}
function todState(pos) {
  const i = Math.floor(pos) % 5, j = (i + 1) % 5, f = pos - Math.floor(pos), A = TOD[i], B = TOD[j];
  return { m: A.m.map((v, k) => lerp(v, B.m[k], f)), ma: lerp(A.ma, B.ma, f), gl: A.gl.map((v, k) => lerp(v, B.gl[k], f)), ga: lerp(A.ga, B.ga, f), n: lerp(A.n, B.n, f), sh: lerp(A.sh, B.sh, f) };
}

// ---------- engine ----------
export function createGarden(canvas, opts) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const STORE = 'small-meadow-v3';
  let W = 1, H = 1, dpr = 1, ground = null, canopy = null, buckets = [], curDensity = -1;
  let grounds = {}, prevGround = null, gFade = 1, season = 'summer', winterK = 0, flakes = [], fenceLast = null;
  const groundFor = s => grounds[s] || (grounds[s] = makeGround(canvas.width, canvas.height, s));
  let plants = [], parts = [], bflies = [], ffs = [];
  let animals = [], bees = [], birds = [], birdT = 5, lastMove = 0, mspeed = 0, rain = 0, rainTarget = 0, saveTick = 0;
  const mouse = { x: -9999, y: -9999, on: false };
  let down = false, last = null, tool = 'daisy', todTarget = 1, todPos = 1, lastTodIdx = 1;
  let gust = null, gustId = 0, raf = 0, prevT = performance.now() / 1000, statT = 0, saveTO = 0, next = null, ghost = null, started = false;
  const now = () => performance.now() / 1000;
  const isSeed = t => !!TYPES[t];
  const sfx = (n, d) => { try { opts.sfx && opts.sfx(n, d); } catch (e) { } };
  let weather = 'clear', stormK = 0, fogK = 0, rbT = 0, flash = 0, bolt = null, boltT = 2, lightN = 0, visT = 4;
  let visitors = [], perched = [], puddles = [], paint = [], mask = new Uint8Array(1), terC = null, terDirty = true, litC = null, litN = 0, fogC = null, rbC = null;
  const basket = { cabbage: 0, pumpkin: 0, berries: 0 }, found = new Set();
  const disc_ = id => { if (found.has(id)) return; found.add(id); try { opts.onDiscover && opts.onDiscover(id); } catch (e) { } };
  const L2c = v => Math.round(v / PIX);
  function nearest(f, x, y, maxD) { let best = null, bd = maxD; for (const p of plants) { if (!f(p)) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return best; }
  function stampMask(q) {
    const cw = canvas.width, ch = canvas.height, cx = q.nx * W / PIX, cy = q.ny * H / PIX, r = (q.k === 'bed' ? 11 : 8) / PIX, v = q.k === 'bed' ? 2 : 1;
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { if (x < 0 || y < 0 || x >= cw || y >= ch) continue; if (Math.hypot(x - cx, y - cy) + (hash(x, y, 41) - 0.5) * 0.9 <= r) mask[y * cw + x] = v; }
  }
  function rebuildMask() { mask = new Uint8Array(canvas.width * canvas.height); paint.forEach(stampMask); terDirty = true; }
  function buildTerrain() {
    const cw = canvas.width, ch = canvas.height; if (!terC || terC.width !== cw || terC.height !== ch) terC = mk(cw, ch);
    const g = terC.getContext('2d', { willReadFrequently: true }), im = g.createImageData(cw, ch), d = im.data, win = season === 'winter';
    const PC = (win ? ['#eef1f2', '#dfe5e8', '#c3ccd1', '#ffffff', '#b8c2c8'] : ['#d8c9a0', '#cbb98c', '#a8966c', '#efe6cc', '#9c8a64']).map(rgb), BC = (win ? ['#e7ecee', '#8a7a6a', '#d5dde0', '#c9d2d6'] : ['#6e4c2c', '#56391f', '#8a6a44', '#7a5634']).map(rgb);
    for (let i = 0; i < mask.length; i++) {
      const v = mask[i]; if (!v) continue;
      const x = i % cw, y = (i / cw) | 0, edge = (x > 0 && mask[i - 1] !== v) || (x < cw - 1 && mask[i + 1] !== v) || (y > 0 && mask[i - cw] !== v) || (y < ch - 1 && mask[i + cw] !== v), h = hash(x, y, 43);
      const c = v === 1 ? (edge ? PC[2] : h < 0.05 ? PC[3] : h < 0.08 ? PC[4] : bay(x, y) + vnoise(x / 4, y / 4, 44) * 0.6 > 0.75 ? PC[1] : PC[0]) : (edge ? BC[2] : y % 3 === 0 ? BC[1] : h < 0.12 ? BC[3] : BC[0]);
      const o = i * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); terDirty = false;
  }
  const onBed = p => { const cw = canvas.width, X = L2c(p.x), Y = L2c(p.y); return X >= 0 && Y >= 0 && X < cw && mask[Y * cw + X] === 2; };
  function paintAt(x, y, k) { const q = { k, nx: x / W, ny: y / H }; paint.push(q); if (paint.length > 4000) { paint.splice(0, 500); rebuildMask(); } else stampMask(q); terDirty = true; disc_(k); if (Math.random() < 0.35) sfx('scrape', { x: x / W, bed: k === 'bed' }); save(); }
  function eraseAt(x, y) {
    const n0 = paint.length; paint = paint.filter(q => Math.hypot(q.nx * W - x, q.ny * H - y) > 16); if (paint.length !== n0) { rebuildMask(); save(); }
    if (litC) litC.getContext('2d', { willReadFrequently: true }).clearRect(L2c(x) - 5, L2c(y) - 5, 11, 11);
  }
  function seedLitter() {
    const cw = canvas.width, ch = canvas.height; if (!litC || litC.width !== cw || litC.height !== ch) litC = mk(cw, ch);
    const g = litC.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, cw, ch); litN = 0; const r = rng(77 + season.length);
    const dot = (x, y, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); litN++; };
    const trees = plants.filter(p => p.type === 'tree' && !p.die);
    if (season === 'autumn') {
      const A = ['#c8642c', '#de7f34', '#eea04a', '#b8402e', '#c9a43a', '#9a4822', '#e0823a'];
      for (const p of trees) { const Rr = pR(p) / PIX, cx = p.x / PIX, cy = p.y / PIX; for (let i = 0; i < 150 * p.sc; i++) { const a = r() * TAU, d = Rr * (0.75 + r() * 0.65); dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, A[(r() * A.length) | 0]); } }
      for (let i = 0; i < cw * ch / 260; i++) dot(r() * cw, r() * ch, A[(r() * A.length) | 0]);
    } else if (season === 'spring') {
      const B = ['#f6ccd8', '#efb3c4', '#fde6ec'];
      for (const p of trees) { if ((p.pal || 0) % 4 !== 1) continue; const Rr = pR(p) / PIX, cx = p.x / PIX, cy = p.y / PIX; for (let i = 0; i < 110 * p.sc; i++) { const a = r() * TAU, d = Rr * (0.7 + r() * 0.6); dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, B[(r() * 3) | 0]); } }
    } else if (season === 'winter') {
      for (const p of trees) { const Rr = pR(p) / PIX, cx = p.x / PIX + Rr * 0.35, cy = p.y / PIX + Rr * 0.8; for (let y = -Rr * 0.4; y <= Rr * 0.4; y++) for (let x = -Rr; x <= Rr; x++) { const e = (x / Rr) ** 2 + (y / (Rr * 0.38)) ** 2; if (e < 1 - vnoise((cx + x) / 3, (cy + y) / 3, 8) * 0.5) dot(cx + x, cy + y, e < 0.45 ? '#ffffff' : '#e6edf0'); } }
      g.fillStyle = '#ffffff'; for (const p of plants) if (p.type === 'fence' && !p.die) { const cx = Math.round(p.x / PIX), cy = Math.round(p.y / PIX); g.fillRect(cx - 2, cy + 2, 5, 1); g.fillRect(cx - 1, cy + 3, 3, 1); }
    }
  }
  function stampLitter(x, y, col) { if (!litC || litN > 6000) return; const g = litC.getContext('2d', { willReadFrequently: true }); g.fillStyle = col; g.fillRect(L2c(x), L2c(y), 1, 1); litN++; }
  function pollinate(p, chance) {
    if (!p || p.die || !FLOWERS.has(p.type) || season === 'winter' || Math.random() > chance) return;
    if (plants.filter(q => !q.die).length > 560) return;
    if (plants.filter(q => q.type === p.type && !q.die && Math.hypot(q.x - p.x, q.y - p.y) < 90).length > 7) return;
    for (let k = 0; k < 5; k++) {
      const a = Math.random() * TAU, d = 24 + Math.random() * 44, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d, R0 = TYPES[p.type].R;
      if (x < 20 || y < 20 || x > W - 20 || y > H - 20) continue;
      if (plants.some(q => !q.die && ((q.type === 'pond' && inPond(q, x, y)) || (LAYER(q.type) !== 'pond' && LAYER(q.type) !== 'ground' && Math.hypot(q.x - x, q.y - y) < (R0 + pR(q)) * 0.6)))) continue;
      randPlant(p.type, x, y, 0); spark(x, y, 3, 8); sfx('bloom', { type: p.type, x: x / W }); disc_('pollinate'); save(); return;
    }
  }
  function harvestAt(x, y) {
    let best = null, bd = 1e9;
    for (const p of plants) { if (p.die || !p.done) continue; const ok = p.type === 'cabbage' || p.type === 'pumpkin' || (p.type === 'bush' && !p.picked && season !== 'winter'); if (!ok) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < pR(p) + 10 && d < bd) { bd = d; best = p; } }
    if (!best) return;
    let kind, n = 1;
    if (best.type === 'bush') { kind = 'berries'; n = 3 + ((Math.random() * 3) | 0); best.picked = now() + 45; best._sk = null; } else { kind = best.type; best.die = now(); }
    basket[kind] = (basket[kind] || 0) + n;
    parts.push({ k: 'pop', x: best.x, y: best.y - 6, life: 0, max: 1.2, item: kind, n });
    spark(best.x, best.y, 4, pR(best) * 0.6); sfx('harvest', { x: best.x / W });
    disc_('harvest'); if (basket.cabbage + basket.pumpkin + basket.berries >= 10) disc_('harvest10');
    opts.onBasket && opts.onBasket({ ...basket }); save();
  }
  function pickSpot() {
    const trees = plants.filter(p => p.type === 'tree' && p.done && !p.die), posts = plants.filter(p => p.type === 'fence' && p.done && !p.die && !perched.some(b => b.spot.p === p));
    if (trees.length && (!posts.length || Math.random() < 0.6)) { const p = trees[(Math.random() * trees.length) | 0], Rr = pR(p) * 0.55, a = Math.random() * TAU, d = Math.sqrt(Math.random()) * Rr; return { p, ox: Math.cos(a) * d, oy: Math.sin(a) * d - 4, key: () => p.y + pR(p) * 0.35 + 1 }; }
    if (posts.length) { const p = posts[(Math.random() * posts.length) | 0]; return { p, ox: 0, oy: -3, key: () => p.y + 1 }; }
    return null;
  }
  const spotOk = sp => plants.includes(sp.p) && !sp.p.die;
  const perchPos = sp => [sp.p.x + sp.ox, sp.p.y + sp.oy];
  function updPerched(dt) {
    for (let i = perched.length - 1; i >= 0; i--) {
      const b = perched[i], md = mouse.on ? Math.hypot(b.x - mouse.x, b.y - mouse.y) : 9999; b.t -= dt;
      if (spotOk(b.spot)) { const [x, y] = perchPos(b.spot); b.x = x + (b.hx || 0); b.y = y; }
      if (b.spot.p.type === 'tree' && Math.random() < dt * 0.35) b.hx = (Math.random() - 0.5) * 6;
      if (Math.random() < dt * 0.3) b.f = !b.f;
      if (Math.random() < dt * 0.12) sfx('chirp', { x: b.x / W });
      if (b.t <= 0 || !spotOk(b.spot) || (md < 55 && mspeed > 60) || (gust && Math.abs(b.x + b.y * 0.3 - gust.x) < 220) || rain > 0.5 || lightN > 0.6) {
        perched.splice(i, 1); const away = md < 160 ? Math.atan2(b.y - mouse.y, b.x - mouse.x) : -0.6 - Math.random() * 0.8;
        birds.push({ x: b.x, y: b.y, h: away, ph: Math.random() * TAU, s: 9, st: 'leave', alt: 0, col: b.col, tried: true }); sfx('flutter', { x: b.x / W });
      }
    }
  }
  function spawnVisitor(kind) {
    const ep = () => { const m = 80; return Math.random() < 0.6 ? [Math.random() < 0.5 ? -m : W + m, H * (0.2 + Math.random() * 0.6)] : [W * (0.1 + Math.random() * 0.8), Math.random() < 0.5 ? -m : H + m]; };
    const [sx, sy] = ep(), wps = []; for (let i = 0; i < 2 + ((Math.random() * 2) | 0); i++) wps.push([W * (0.15 + Math.random() * 0.7), H * (0.25 + Math.random() * 0.55)]);
    const v = { kind, x: sx, y: sy, st: 'walk', wps, exit: ep(), leaving: false, ph: 0, wp: 0, f: false, t: 0 }; [v.tx, v.ty] = v.wps.shift(); visitors.push(v);
  }
  function updVisitors(dt) {
    visT -= dt;
    if (visT <= 0) {
      visT = 8 + Math.random() * 12; const dawn = todPos < 0.6 || todPos > 4.6;
      if (lightN > 0.6 && !visitors.some(v => v.kind === 'fox') && Math.random() < 0.7) spawnVisitor('fox');
      else if (dawn && lightN < 0.4 && !visitors.some(v => v.kind === 'deer') && Math.random() < 0.75) spawnVisitor('deer');
    }
    for (let i = visitors.length - 1; i >= 0; i--) {
      const v = visitors[i], md = mouse.on ? Math.hypot(v.x - mouse.x, v.y - mouse.y) : 9999; v.ph += dt;
      if (!v.seen && v.x > 20 && v.x < W - 20 && v.y > 20 && v.y < H - 20) { v.seen = true; disc_(v.kind); }
      const scare = md < (v.kind === 'deer' ? 120 : 80) || (v.kind === 'fox' && lightN < 0.3) || (v.kind === 'deer' && lightN > 0.7);
      if (v.st !== 'run' && scare) {
        v.st = 'run'; const m = md < 9999 ? md || 1 : 1, dx = md < 9999 ? (v.x - mouse.x) / m : (v.x < W / 2 ? -1 : 1), dy = md < 9999 ? (v.y - mouse.y) / m : 0;
        v.tx = v.x + dx * 3000; v.ty = v.y + dy * 3000; if (md < 200) sfx(v.kind === 'deer' ? 'snort' : 'yip', { x: v.x / W });
      }
      if (v.st === 'pause') { v.t -= dt; if (v.t <= 0) v.st = 'walk'; }
      else {
        const dx = v.tx - v.x, dy = v.ty - v.y, d = Math.hypot(dx, dy) || 1, sp = v.st === 'run' ? (v.kind === 'deer' ? 170 : 140) : v.kind === 'deer' ? 22 : 32;
        if (v.st !== 'run' && d < 5) {
          if (v.wps.length) { v.st = 'pause'; v.t = v.kind === 'deer' ? 4 + Math.random() * 5 : 1.5 + Math.random() * 2.5; [v.tx, v.ty] = v.wps.shift(); if (v.kind === 'fox' && Math.random() < 0.4) sfx('yip', { x: v.x / W, soft: true }); }
          else if (!v.leaving) { v.leaving = true; [v.tx, v.ty] = v.exit; }
          else { visitors.splice(i, 1); continue; }
        } else { v.x += dx / d * sp * dt; v.y += dy / d * sp * dt; v.f = dx < 0; v.wp += dt * sp * 0.12; }
      }
      if (v.x < -300 || v.x > W + 300 || v.y < -300 || v.y > H + 300) { visitors.splice(i, 1); continue; }
      if (v.kind === 'fox') for (const a of animals) if (a.kind === 'rabbit' && a.state !== 'hop') { const ad = Math.hypot(a.x - v.x, a.y - v.y); if (ad < 90) { const m = ad || 1; a.flee = 3; hopTo(a, a.x + (a.x - v.x) / m * 40, a.y + (a.y - v.y) / m * 40, 0.26); } }
    }
  }
  const VCACHE = new Map();
  function drawVisitor(v) {
    const f = v.st === 'pause' ? (v.kind === 'fox' ? 'sniff' : 'graze') : Math.floor(v.wp) % 2 ? 'w2' : 'w1', k = v.kind + f + v.f;
    let sp = VCACHE.get(k); if (!sp) { sp = mapSprite(VMAP[v.kind][f], VCOL[v.kind], v.f, 0.4); VCACHE.set(k, sp); }
    const X = Math.round(v.x / PIX) - sp.ox, Yb = Math.round(v.y / PIX) - sp.oy, Y = Yb - (v.st === 'run' && v.kind === 'deer' ? Math.round(Math.abs(Math.sin(v.ph * 9)) * 3) : 0);
    ctx.fillStyle = 'rgba(20,36,12,.28)'; ctx.fillRect(X + 2, Yb + sp.height - 1, sp.width - 4, 1); ctx.drawImage(sp, X, Y);
  }
  function ambientCalls() {
    if (lightN > 0.5) {
      if (season !== 'winter') for (const p of plants) if (p.type === 'pond' && p.done && !p.die && Math.random() < 0.3) sfx('frog', { x: p.x / W });
      if (Math.random() < 0.06) { const t = plants.filter(p => p.type === 'tree' && !p.die); if (t.length) sfx('owl', { x: t[(Math.random() * t.length) | 0].x / W }); }
    }
    if (winterK > 0.8 && plants.some(p => p.type === 'pond' && !p.die)) disc_('frost');
    if (fogK > 0.6) disc_('fog');
  }
  function makeFog() {
    const cw = canvas.width * 2, ch = canvas.height, c = mk(cw, ch), g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(cw, ch), d = im.data;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const v = vnoise(x / 28, y / 10, 31) * 0.7 + vnoise(x / 9, y / 5, 32) * 0.3 + (bay(x, y) - 0.5) * 0.22; if (v > 0.5) { const o = (y * cw + x) * 4; d[o] = 238; d[o + 1] = 242; d[o + 2] = 238; d[o + 3] = v > 0.6 ? 255 : 150; } }
    g.putImageData(im, 0, 0); return c;
  }
  function makeRainbow() {
    const cw = canvas.width, ch = canvas.height, c = mk(cw, ch), g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(cw, ch), d = im.data, cx = cw * 0.78, cy = ch * 1.25, R0 = ch * 0.95, C = ['#8a6fd0', '#4f9ee0', '#7cc45a', '#f4d24a', '#f29a3a', '#e85a4a'].map(rgb), bw = Math.max(2, Math.round(ch / 70));
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const b = Math.floor((Math.hypot(x - cx, y - cy) - R0) / bw); if (b < 0 || b > 5) continue; const v = C[b], o = (y * cw + x) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }
  function makeBolt() { const ch = canvas.height; let x = canvas.width * (0.15 + Math.random() * 0.7), y = -2; const pts = [[x, y]], end = ch * (0.25 + Math.random() * 0.4); while (y < end) { x += (Math.random() - 0.5) * 8; y += 3 + Math.random() * 5; pts.push([x, y]); } return { pts, x }; }
  const PUD = new Map();
  const pudSpr = (r, v, win) => { const k = r + '_' + v + win; if (!PUD.has(k)) PUD.set(k, disc(r, Math.max(1, r * 0.6), win ? ['#c6d8e2', '#d9e8f0', '#eaf3f8', '#ffffff'] : ['#3b6f9e', '#4f8cc0', '#78b0dc', '#a9d4f0'], v * 13 + 3, { bump: 0.3, fq: 1.6, tex: 0.35, ol: 0 })); return PUD.get(k); };

  function buildBlades(density) {
    curDensity = density; const r = rng(7), cw = canvas.width, ch = canvas.height, n = Math.min(6000, Math.floor(cw * ch / 40 * density));
    buckets = BLADE_COLS.map(() => []);
    for (let i = 0; i < n; i++) buckets[(r() * 6) | 0].push({ x: (r() * cw) | 0, y: (r() * ch) | 0, c: 0 });
  }
  function resize() {
    const rc = (canvas.parentElement || canvas).getBoundingClientRect(), cw = Math.max(1, Math.ceil(rc.width * ZOOM / PIX)), ch = Math.max(1, Math.ceil(rc.height * ZOOM / PIX));
    if (cw * PIX === W && ch * PIX === H && dpr === PIX && ground) return;
    const pixChanged = dpr !== PIX; dpr = PIX; W = cw * PIX; H = ch * PIX;
    canvas.width = cw; canvas.height = ch; canvas.style.width = W / ZOOM + 'px'; canvas.style.height = H / ZOOM + 'px'; canvas.style.imageRendering = 'pixelated';
    grounds = {}; prevGround = null; ground = groundFor(season); flakes = []; canopy = makeCanopy(cw, ch); buildBlades(opts.getOpts().density); rebuildMask(); seedLitter(); fogC = null; rbC = null;
    if (!ffs.length) { const r = rng(3); for (let i = 0; i < 46; i++) ffs.push({ x: r() * W, y: r() * H, ph: r() * TAU, sp: 0.6 + r() * 0.8 }); }
    plants.forEach(p => { p.x = p.nx * W; p.y = p.ny * H; if (pixChanged) p._sk = null; });
    if (pixChanged) ghost = null;
  }
  function save() {
    clearTimeout(saveTO);
    saveTO = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify({ p: plants.filter(p => !p.die).map(p => ({ type: p.type, nx: +p.nx.toFixed(4), ny: +p.ny.toFixed(4), seed: p.seed, rot: +p.rot.toFixed(3), sc: +p.sc.toFixed(3), pal: p.pal, prev: p.prev ?? null })), c: animals.map(a => ({ kind: a.kind, nx: +(a.x / W).toFixed(4), ny: +(a.y / H).toFixed(4), col: a.col || null, style: a.style || 0, duckling: !!a.duckling })), pt: paint.map(q => [q.k === 'bed' ? 1 : 0, +q.nx.toFixed(4), +q.ny.toFixed(4)]), bk: basket, fm: 1 })); } catch (e) { } }, 400);
  }
  const rotFor = t => t === 'tree' || t === 'pond' || t === 'fence' ? 0 : t === 'cottage' ? 0 : Math.random() * TAU;
  const scFor = t => { const R = Math.random(); return t === 'tree' ? 0.8 + R * 0.45 : t === 'cottage' ? 0.9 + R * 0.2 : t === 'pond' ? 0.9 + R * 0.4 : t === 'stone' ? 0.7 + R * 0.6 : t === 'blanket' ? 0.9 + R * 0.2 : 0.85 + R * 0.3; };
  function rollNext() {
    if (!isSeed(tool)) { next = null; ghost = null; return; }
    next = { type: tool, seed: (Math.random() * 1e9) | 0, rot: rotFor(tool), sc: scFor(tool), pal: (Math.random() * 4) | 0 };
    ghost = null;
  }
  function addPlant(type, x, y, o = {}) {
    const p = { type, x, y, nx: x / W, ny: y / H, seed: o.seed, rot: o.rot || 0, sc: o.sc || 1, pal: o.pal || 0, born: now() + (o.delay || 0), bounce: 0, done: false, die: 0, gid: -1, _ox: 0, _oy: 0, _ang: 0, _s: 1, _g: 0 };
    plants.push(p); return p;
  }
  function randPlant(type, x, y, delay) { return addPlant(type, x, y, { seed: (Math.random() * 1e9) | 0, rot: rotFor(type), sc: scFor(type), pal: (Math.random() * 4) | 0, delay }); }
  function load() {
    try {
      const sv = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (sv && sv.p && sv.p.length) {
        sv.p.forEach((q, i) => { if (!TYPES[q.type]) return; const p = addPlant(q.type, q.nx * W, q.ny * H, { ...q, delay: 0.3 + Math.min(i * 0.04, 2.5) }); p.nx = q.nx; p.ny = q.ny; p.prev = q.prev ?? null; });
        (sv.c || []).forEach(q => spawnCritter(q.kind, q.nx * W, q.ny * H, q)); if (!sv.fm) { farm(); save(); }
        (sv.pt || []).forEach(q => paint.push({ k: q[0] ? 'bed' : 'path', nx: q[1], ny: q[2] })); if (sv.bk) Object.assign(basket, sv.bk); rebuildMask(); opts.onBasket && opts.onBasket({ ...basket });
        return;
      }
    } catch (e) { }
    starter();
  }
  function farm() { spawnCritter('cow', 0.36 * W, 0.24 * H); spawnCritter('cow', 0.27 * W, 0.3 * H); for (let i = 0; i < 3; i++) spawnCritter('sheep', (0.14 + i * 0.04) * W, (0.16 + (i % 2) * 0.05) * H); }
  function starter() {
    let d = 0.4; const R = Math.random, pick = a => a[(R() * a.length) | 0];
    const add = (type, nx, ny, o = {}) => { const p = randPlant(type, nx * W, ny * H, d); Object.assign(p, o); d += 0.03; return p; };
    const cluster = (type, cx, cy, n, spread) => { for (let i = 0; i < n; i++) { const a = R() * TAU, dd = Math.sqrt(R()) * spread; add(type, cx + Math.cos(a) * dd / W, cy + Math.sin(a) * dd / H); } };
    const ring = (types, cx, cy, n, r, o) => { for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * 0.2; add(types[i % types.length], cx + Math.cos(a) * r / W, cy + Math.sin(a) * r / H, o); } };
    // smooth catmull-rom curve through normalized points, sampled roughly every `step` px
    const curve = (pts, step) => {
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], e = pts[Math.min(pts.length - 1, i + 2)], n = Math.max(1, Math.ceil(Math.hypot((c[0] - b[0]) * W, (c[1] - b[1]) * H) / step));
        for (let j = i ? 1 : 0; j <= n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t, f = k => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - e[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + e[k]) * t3); out.push([f(0), f(1)]); }
      }
      return out;
    };
    const path = pts => curve(pts, 5).forEach(([nx, ny]) => paint.push({ k: 'path', nx, ny }));
    const border = (pts, types, off, every, skip = 0.2) => {
      const c = curve(pts, every);
      c.forEach(([x, y], i) => {
        if (i === 0 || i === c.length - 1) return; const [ax, ay] = c[i - 1], [bx, by] = c[i + 1], tx = (bx - ax) * W, ty = (by - ay) * H, l = Math.hypot(tx, ty) || 1;
        for (const s of [-1, 1]) if (R() > skip) add(pick(types), x - ty / l * off * s / W + (R() - 0.5) * 6 / W, y + tx / l * off * s / H + (R() - 0.5) * 6 / H);
      });
    };
    const fence = pts => {
      let prevF = null;
      for (let e = 0; e < pts.length - 1; e++) { const [ax, ay] = pts[e], [bx, by] = pts[e + 1], n = Math.max(1, Math.round(Math.hypot((bx - ax) * W, (by - ay) * H) / 22)); for (let i = e ? 1 : 0; i <= n; i++) { const t = i / n, p = add('fence', lerp(ax, bx, t), lerp(ay, by, t)); p.rot = 0; p.prev = prevF ? prevF.seed : null; prevF = p; } }
    };
    const bed = (x0, y0, x1, y1) => { for (let y = y0 * H; y <= y1 * H; y += 12) for (let x = x0 * W; x <= x1 * W; x += 12) paint.push({ k: 'bed', nx: x / W, ny: y / H }); };

    // paths: cottage door down to the pond, a branch to the pasture gate, and one to the vegetable plot
    const main = [[0.74, 0.27], [0.70, 0.38], [0.58, 0.47], [0.47, 0.53], [0.36, 0.61], [0.27, 0.69]];
    const gate = [[0.19, 0.42], [0.22, 0.48], [0.33, 0.51], [0.47, 0.53]];
    const veg = [[0.70, 0.38], [0.76, 0.47], [0.83, 0.51]];
    path(main); path(gate); path(veg); bed(0.85, 0.43, 0.95, 0.61); rebuildMask();

    // the pond and a picnic on its bank
    const pond = add('pond', 0.24, 0.72, { sc: 1.3 });
    add('blanket', 0.37, 0.75, { rot: -0.15, sc: 1 });
    cluster('forget', 0.13, 0.83, 5, 40); cluster('forget', 0.27, 0.86, 4, 35);

    // cottage, with a little garden round the birdbath
    add('cottage', 0.74, 0.17, { rot: 0, pal: 0, sc: 1 }); add('pot', 0.69, 0.27); add('pot', 0.79, 0.27); add('bench', 0.65, 0.3);
    add('birdbath', 0.6, 0.21); ring(['lavender', 'tulip'], 0.6, 0.21, 8, 38);

    // fenced pasture with a gate onto the path
    fence([[0.165, 0.43], [0.05, 0.43], [0.05, 0.17], [0.3, 0.17], [0.3, 0.43], [0.215, 0.43]]);
    add('hay', 0.08, 0.22); add('hay', 0.105, 0.245); add('hay', 0.27, 0.39);

    // vegetable plot: dug bed, cabbage rows, pumpkins, sunflowers peeking over the back fence
    fence([[0.83, 0.47], [0.83, 0.40], [0.97, 0.40], [0.97, 0.64], [0.83, 0.64], [0.83, 0.55]]);
    for (let rr = 0; rr < 2; rr++) for (let c = 0; c < 4; c++) add('cabbage', 0.865 + c * 0.026, 0.455 + rr * 0.055);
    add('pumpkin', 0.87, 0.585); add('pumpkin', 0.905, 0.59); add('pumpkin', 0.94, 0.582);
    for (let i = 0; i < 4; i++) add('sunflower', 0.85 + i * 0.035, 0.365 + (R() - 0.5) * 0.01);

    // flower borders and lanterns along the paths
    border(main, ['daisy', 'tulip', 'forget', 'poppy'], 22, 30);
    border(gate, ['daisy', 'daisy', 'poppy'], 20, 34, 0.35);
    add('lantern', 0.715, 0.33); add('lantern', 0.6, 0.51); add('lantern', 0.42, 0.53); add('lantern', 0.36, 0.6);

    // wildflower meadow, stepping stones to a fairy ring at the wood's edge
    cluster('poppy', 0.5, 0.64, 7, 60); cluster('daisy', 0.45, 0.68, 6, 50); cluster('tulip', 0.42, 0.42, 5, 45);
    add('tree', 0.62, 0.6, { sc: 0.9, pal: 0 }); add('tree', 0.7, 0.66, { sc: 0.85, pal: 2 }); cluster('lavender', 0.66, 0.55, 3, 30);
    curve([[0.42, 0.74], [0.5, 0.77], [0.6, 0.78], [0.68, 0.76]], 24).forEach(([x, y]) => add('stone', x + (R() - 0.5) * 0.004, y + (R() - 0.5) * 0.006));
    ring(['mushroom'], 0.73, 0.76, 7, 44);

    // trees and bushes framing the edges
    add('tree', 0.92, 0.86, { sc: 1.25, pal: 1 }); add('tree', 0.82, 0.97, { sc: 0.95, pal: 0 }); add('tree', 0.38, 0.2, { sc: 1.05, pal: 2 });
    add('tree', 0.95, 0.07, { sc: 0.85, pal: 3 }); add('tree', 0.03, 0.56, { sc: 1.2, pal: 0 }); add('tree', 0.07, 0.97, { sc: 1, pal: 2 });
    add('bush', 0.5, 0.1); add('bush', 0.88, 0.25); add('bush', 0.14, 0.53); add('bush', 0.6, 0.96); add('bush', 0.98, 0.7);

    setTimeout(() => {
      spawnCritter('duck', pond.x, pond.y, { style: 0, duckling: false }); spawnCritter('duck', pond.x, pond.y, { style: 1, duckling: false });
      for (let i = 0; i < 3; i++) spawnCritter('duck', pond.x, pond.y, { duckling: true });
      spawnCritter('rabbit', 0.78 * W, 0.6 * H); spawnCritter('rabbit', 0.76 * W, 0.67 * H);
      const cat = spawnCritter('cat', 0.37 * W - 10, 0.75 * H + 4); if (cat) { cat.state = 'sleep'; cat.idle = 99; }
      spawnCritter('hedgehog', 0.86 * W, 0.76 * H); spawnCritter('snail', 0.3 * W, 0.92 * H);
      spawnCritter('cow', 0.24 * W, 0.28 * H); spawnCritter('cow', 0.13 * W, 0.36 * H); for (let i = 0; i < 3; i++) spawnCritter('sheep', (0.1 + i * 0.04) * W, (0.24 + (i % 2) * 0.04) * H); save();
    }, 1600);
  }
  function spark(x, y, n, spread) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = Math.random() * spread; parts.push({ k: 'spark', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, life: -Math.random() * 0.3, max: 0.7, s: 2.5 + Math.random() * 2.5 }); } }
  function dirt(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 70; parts.push({ k: 'dirt', col, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.6 + Math.random() * 0.4, s: 1 + Math.random() * 1.6 }); } }
  function petal(x, y, col, big) { parts.push({ k: big ? 'leaf' : 'petal', x, y, vx: 20 + Math.random() * 30, vy0: (Math.random() - 0.5) * 20, life: 0, max: 7 + Math.random() * 4, ph: Math.random() * TAU, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, col, s: big ? 4 + Math.random() * 2 : 2.4 + Math.random() * 1.4 }); }
  const pcol = p => p.type === 'tree' ? treePal(p)[2] : PETAL[p.type] || '#9ab760';
  const pR = p => TYPES[p.type].R * p.sc;

  function act(x, y) {
    if (isSeed(tool)) {
      if (plants.filter(p => !p.die).length > 600 || !next) return;
      if (tool === 'fence' && !fenceLast) { let near = null, nd = 1e9; for (const q of plants) if (q.type === 'fence' && !q.die) { const dd = Math.hypot(q.x - x, q.y - y); if (dd < nd) { nd = dd; near = q; } } if (near && nd < 32) { fenceLast = near; if (nd < 12) return; } }
      const lay = LAYER(tool), Rn = TYPES[tool].R * next.sc, f = lay === 'high' ? 0.75 : tool === 'stone' ? 0.9 : 0.6;
      const block = plants.find(p => !p.die && LAYER(p.type) === lay && Math.hypot(p.x - x, p.y - y) < (Rn + pR(p)) * f);
      if (block) { if (block.done) block.bounce = 1; return; }
      const p = addPlant(tool, x, y, next); p.nx = x / W; p.ny = y / H;
      if (tool === 'fence') { p.prev = fenceLast && Math.hypot(fenceLast.x - x, fenceLast.y - y) < 48 ? fenceLast.seed : null; fenceLast = p; }
      if (tool === 'pond') parts.push({ k: 'ring', x, y, life: 0, max: 1.4, r0: 10, r1: 60 }); else dirt(x, y, lay === 'high' ? 14 : 6);
      sfx(tool === 'pond' ? 'splash' : lay === 'high' ? 'thunk' : tool === 'fence' || tool === 'stone' ? 'tap' : 'plant', { type: tool, x: x / W });
      rollNext(); save();
    } else if (CRITTERS.includes(tool)) { const a = spawnCritter(tool, x, y); if (a && a.duckling) disc_('ducklings'); if (a) sfx(tool === 'duck' ? 'quack' : 'critter', { kind: tool, x: x / W }); save(); }
    else if (tool === 'path' || tool === 'bed') paintAt(x, y, tool);
    else if (tool === 'harvest') harvestAt(x, y);
    else if (tool === 'water') {
      parts.push({ k: 'ring', x, y, life: 0, max: 1.1, r0: 4, r1: 46 }); parts.push({ k: 'ring', x, y, life: -0.18, max: 1.1, r0: 2, r1: 30 });
      for (let i = 0; i < 9; i++) { const a = Math.random() * TAU, v = 20 + Math.random() * 60; parts.push({ k: 'drop', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + Math.random() * 0.3, s: 1 + Math.random() * 1.5 }); }
      plants.forEach(p => { if (p.die) return; const d = Math.hypot(p.x - x, p.y - y); if (d < 70 + pR(p) * 0.5) { if (!p.done) p.born -= TYPES[p.type].grow * 0.35; else { p.bounce = 1; spark(p.x, p.y, 2, pR(p)); } } }); sfx('water', { x: x / W });
    } else if (tool === 'dig') {
      eraseAt(x, y);
      const ai = animals.findIndex(a => Math.hypot(a.x - x, a.y - y) < 14);
      if (ai >= 0) { const a = animals[ai]; dirt(a.x, a.y, 8); animals.forEach(b => { if (b.leader === a) b.leader = a.leader || null; }); animals.splice(ai, 1); save(); sfx('dig'); }
      else {
        const ord = ['high', 'low', 'ground', 'pond'].flatMap(l => plants.filter(p => LAYER(p.type) === l).reverse());
        const t = ord.find(p => !p.die && Math.hypot(p.x - x, p.y - y) < pR(p) * (LAYER(p.type) === 'high' ? 0.7 : 1) + 6);
        if (t) { t.die = now(); dirt(t.x, t.y, LAYER(t.type) === 'high' ? 26 : 12); if (FLOWERS.has(t.type) || t.type === 'tree') for (let i = 0; i < 4; i++) petal(t.x, t.y, pcol(t), t.type === 'tree'); save(); sfx('dig'); }
      }
    }
    opts.onAction && opts.onAction();
  }
  const spacing = () => tool === 'path' || tool === 'bed' ? 5 : tool === 'harvest' ? 20 : CRITTERS.includes(tool) ? 1e9 : isSeed(tool) ? (tool === 'stone' ? 24 : tool === 'fence' ? 22 : TYPES[tool].R * (LAYER(tool) === 'high' ? 1.5 : 1.25)) : tool === 'water' ? 34 : 18;
  const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * ZOOM, (e.clientY - r.top) * ZOOM]; };
  const onDown = e => { try { canvas.setPointerCapture(e.pointerId); } catch (_) { } down = true; fenceLast = null; const [x, y] = pos(e); mouse.x = x; mouse.y = y; mouse.on = true; act(x, y); last = [x, y]; };
  const onMove = e => { const [x, y] = pos(e); const tn = now(); mspeed = Math.hypot(x - mouse.x, y - mouse.y) / Math.max(0.008, tn - lastMove); lastMove = tn; mouse.x = x; mouse.y = y; mouse.on = true; if (down && last && Math.hypot(x - last[0], y - last[1]) > spacing()) { act(x, y); last = [x, y]; } };
  const onUp = e => { down = false; last = null; if (e.pointerType !== 'mouse') mouse.on = false; };
  const onLeave = () => { if (!down) mouse.on = false; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('pointerleave', onLeave);
  const ro = new ResizeObserver(() => resize()); ro.observe(canvas.parentElement || canvas);

  // butterflies
  const BCOL = [['#f7e7a1', '#c9a94a'], ['#fbfaf3', '#bdb8a2'], ['#a9c8ef', '#5f86b8'], ['#f3a65a', '#b0642a'], ['#ecbcd8', '#b77a9c']];
  function edgePoint() { const s = (Math.random() * 4) | 0, m = 40; return s === 0 ? [-m, Math.random() * H] : s === 1 ? [W + m, Math.random() * H] : s === 2 ? [Math.random() * W, -m] : [Math.random() * W, H + m]; }
  function pickFlower(not) { const f = plants.filter(p => FLOWERS.has(p.type) && p.done && !p.die && p !== not && p._s > 0.5); return f.length ? f[(Math.random() * f.length) | 0] : null; }
  function updFlies(dt, T) {
    const nFlowers = plants.filter(p => FLOWERS.has(p.type) && p.done && !p.die).length, want = rain > 0.3 || season === 'winter' ? 0 : Math.min(season === 'autumn' ? 3 : 7, Math.floor(nFlowers / 3)), active = bflies.filter(b => !b.leaving);
    if (active.length < want && Math.random() < dt * 0.7) { const [x, y] = edgePoint(), c = BCOL[(Math.random() * BCOL.length) | 0]; bflies.push({ x, y, vx: 0, vy: 0, h: 0, state: 'fly', target: pickFlower(), rx: 0, ry: 0, ph: Math.random() * TAU, col: c[0], edge: c[1], size: 6 + Math.random() * 2.5, timer: 0, leaving: false }); }
    if (active.length > want) { const b = active[0]; b.leaving = true; b.state = 'fly'; const [ex, ey] = edgePoint(); b.ex = ex; b.ey = ey; }
    for (let i = bflies.length - 1; i >= 0; i--) {
      const b = bflies[i];
      if (b.target && (b.target.die || !plants.includes(b.target))) { b.target = pickFlower(); b.state = 'fly'; }
      let md = mouse.on ? Math.hypot(b.x - mouse.x, b.y - mouse.y) : 9999, thx = mouse.x, thy = mouse.y;
      for (const c of animals) if (c.kind === 'cat') { const cd = Math.hypot(b.x - c.x, b.y - c.y); if (cd < md) { md = cd; thx = c.x; thy = c.y; } }
      if (b.state === 'rest') {
        b.timer -= dt; b.x = b.target.x + b.target._ox + b.rx; b.y = b.target.y + b.target._oy + b.ry;
        if (b.timer <= 0 && md >= 55) pollinate(b.target, 0.12);
        if (b.timer <= 0 || md < 55) { b.state = 'fly'; b.target = pickFlower(b.target); if (md < 55) { const d = md || 1; b.vx = (b.x - thx) / d * 160; b.vy = (b.y - thy) / d * 160; } }
        continue;
      }
      let tx, ty;
      if (b.leaving) { tx = b.ex; ty = b.ey; } else if (b.target) { tx = b.target.x + b.rx; ty = b.target.y + b.ry; } else { if (!b.wx || Math.hypot(b.wx - b.x, b.wy - b.y) < 30) { b.wx = Math.random() * W; b.wy = Math.random() * H; } tx = b.wx; ty = b.wy; }
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1, sp = b.leaving ? 120 : 75 * clamp(d / 40, 0.35, 1);
      let ax = dx / d * sp, ay = dy / d * sp; const wig = Math.sin(T * 2.3 + b.ph) * 55 * clamp(d / 60, 0.2, 1); ax += -dy / d * wig; ay += dx / d * wig;
      if (md < 90) { const f = (1 - md / 90) * 300, m = md || 1; ax += (b.x - thx) / m * f; ay += (b.y - thy) / m * f; }
      const k = Math.min(1, dt * 2.6); b.vx += (ax - b.vx) * k; b.vy += (ay - b.vy) * k; b.x += b.vx * dt; b.y += b.vy * dt;
      if (Math.hypot(b.vx, b.vy) > 8) b.h = Math.atan2(b.vy, b.vx);
      if (!b.leaving && b.target && d < 7) { b.state = 'rest'; b.timer = 2 + Math.random() * 5; b.rx = (Math.random() - 0.5) * 4; b.ry = (Math.random() - 0.5) * 4; }
      if (b.leaving && (b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80)) bflies.splice(i, 1);
    }
  }
  const pring = (cx, cy, r) => { if (r < 0.5) { ctx.fillRect(Math.round(cx), Math.round(cy), 1, 1); return; } const n = Math.max(8, Math.ceil(r * 6.3)); for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); } };
  const pline = (x0, y0, x1, y1) => { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let k = 0; k < 2000; k++) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
  const HEART = mapSprite(['.p.p.', 'ppppp', '.ppp.', '..p..'], { p: '#f28fa8' }, false, 0.5), ZZ = mapSprite(['zzzz', '..z.', '.z..', 'zzzz'], { z: '#fbf7e9' }, false, 0.4);
  const BF = { o: ['cc.cc', 'cebec', '.c.c.'], c: ['.c.c.', '..b..', '.c.c.'] }, BFC = new Map();
  const bfSpr = (col, edge, f) => { const k = col + f; if (!BFC.has(k)) BFC.set(k, mapSprite(BF[f], { c: col, e: edge, b: '#3a2e22' }, false, 0)); return BFC.get(k); };
  function drawFly(b, T) {
    const rest = b.state === 'rest', open = rest ? Math.sin(T * 2.2 + b.ph) > -0.3 : Math.sin(T * 15 + b.ph) > 0, s = bfSpr(b.col, b.edge, open ? 'o' : 'c'), X = Math.round(b.x / PIX) - s.ox, Y = Math.round(b.y / PIX) - s.oy, alt = rest ? 1 : 3;
    ctx.globalAlpha = 0.18; ctx.drawImage(shadowOf(s), X + alt, Y + alt + 1); ctx.globalAlpha = 1; ctx.drawImage(s, X, Y);
  }

  const turn = (h, t, k) => h + wrap(t - h) * Math.min(1, k);
  const local = (p, lx, ly) => [p.x + lx * p.sc, p.y + ly * p.sc];
  function glowAt(x, y, R, col) { const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2); }
  function pondPoint(p, k) { const an = Math.random() * TAU, d = Math.sqrt(Math.random()) * k; return [p.x + Math.cos(an) * 62 * p.sc * 0.68 * d, p.y + Math.sin(an) * 62 * p.sc * 0.5 * d]; }
  function inPond(p, x, y) { const dx = (x - p.x) / (62 * p.sc * 0.72), dy = (y - p.y) / (62 * p.sc * 0.53); return dx * dx + dy * dy < 1; }
  function spawnCritter(kind, x, y, o = {}) {
    if (!CRITTERS.includes(kind) || animals.length >= 36) return null;
    const R = Math.random, a = { kind, x, y, h: R() * TAU, state: 'sit', timer: 0.5 + R(), ph: R() * TAU, wp: 0, moving: false, tx: null, ty: null };
    if (kind === 'rabbit') a.col = o.col || RABBIT_COLS[(R() * RABBIT_COLS.length) | 0];
    if (kind === 'cat') { a.col = o.col || CAT_COLS[(R() * CAT_COLS.length) | 0]; a.timer = 2; a.idle = 0; }
    if (kind === 'hedgehog' || kind === 'snail') { a.state = 'walk'; a.trail = []; }
    if (kind === 'cow') { a.col = o.col || (R() < 0.5 ? '#3e3630' : '#9a6440'); a.state = 'graze'; a.timer = 1 + R() * 3; }
    if (kind === 'sheep') { a.col = o.col || (R() < 0.15 ? '#5e524a' : '#f6f2e8'); a.state = 'graze'; a.timer = 1 + R() * 3; }
    if (kind === 'duck') {
      let pond = null, best = 1e9;
      for (const p of plants) if (p.type === 'pond' && !p.die) { const d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; pond = p; } }
      if (!pond || best > 62 * pond.sc * 1.2) { pond = addPlant('pond', x, y, { seed: (R() * 1e9) | 0, rot: 0, sc: 0.9 + R() * 0.4, pal: 0 }); parts.push({ k: 'ring', x, y, life: 0, max: 1.4, r0: 10, r1: 60 }); }
      a.pond = pond; a.style = o.style ?? (R() < 0.5 ? 1 : 0); a.state = 'swim'; a.timer = 0;
      const adults = animals.filter(b => b.kind === 'duck' && b.pond === pond && !b.duckling);
      const dl = o.duckling ?? (adults.length > 0 && R() < 0.65);
      if (dl && adults.length) { a.duckling = true; let tail = adults[(R() * adults.length) | 0]; for (let n = 0; n < 20; n++) { const nx = animals.find(b => b.leader === tail); if (!nx) break; tail = nx; } a.leader = tail; }
      const [px, py] = pondPoint(pond, 0.5); a.x = px; a.y = py;
      parts.push({ k: 'ring', x: a.x, y: a.y, life: 0, max: 1, r0: 3, r1: 20 });
    } else dirt(x, y, 4);
    animals.push(a); return a;
  }
  function hopTo(a, tx, ty, d) { tx = clamp(tx, 20, W - 20); ty = clamp(ty, 20, H - 20); a.state = 'hop'; a.hp = 0; a.hd = d; a.hx = a.x; a.hy = a.y; a.tx = tx; a.ty = ty; a.h = Math.atan2(ty - a.y, tx - a.x); }
  function walker(a, dt, sp, range) {
    if (a.tx == null || Math.hypot(a.tx - a.x, a.ty - a.y) < 4) { const an = a.h + (Math.random() - 0.5) * 2; a.tx = clamp(a.x + Math.cos(an) * range, 30, W - 30); a.ty = clamp(a.y + Math.sin(an) * range, 30, H - 30); }
    a.h = turn(a.h, Math.atan2(a.ty - a.y, a.tx - a.x), dt * 1.5); a.x += Math.cos(a.h) * sp * dt; a.y += Math.sin(a.h) * sp * dt; a.moving = true; a.wp += dt * sp * 0.6;
  }
  function updAnimals(dt, T) {
    const still = now() - lastMove;
    for (let i = animals.length - 1; i >= 0; i--) {
      const a = animals[i], md = mouse.on ? Math.hypot(a.x - mouse.x, a.y - mouse.y) : 9999;
      a.moving = false;
      if (a.kind === 'rabbit') {
        if (a.state === 'hop') { a.hp += dt / a.hd; const e = eOut(Math.min(1, a.hp)); a.x = lerp(a.hx, a.tx, e); a.y = lerp(a.hy, a.ty, e); if (a.hp >= 1) { a.state = 'sit'; a.timer = a.flee > 0 ? 0.05 : 0.6 + Math.random() * 2.8; a.flee = Math.max(0, (a.flee || 0) - 1); } }
        else {
          a.timer -= dt;
          if (md < 85) { if (!(a.flee > 0)) sfx('thump', { x: a.x / W }); a.flee = 4; const m = md || 1; hopTo(a, a.x + (a.x - mouse.x) / m * 40, a.y + (a.y - mouse.y) / m * 40, 0.26); }
          else if (a.timer <= 0 && a.state === 'nibble') {
            const c = a.food; a.state = 'sit'; a.food = null; a.timer = 1 + Math.random() * 2;
            if (c && !c.die && c.done) { c.bites = (c.bites || 0) + 1; dirt(c.x, c.y, 5, '#9cc77a'); sfx('nibble', { x: c.x / W }); disc_('nibble'); if (c.bites >= 3) { c.bites = 0; c.done = false; c.born = now(); } }
          }
          else if (a.timer <= 0) {
            if (a.food && (a.food.die || !a.food.done)) a.food = null;
            if (!a.food && Math.random() < 0.55) a.food = nearest(p => p.type === 'cabbage' && p.done && !p.die, a.x, a.y, 260);
            let tx, ty; const f = !a.food && Math.random() < 0.5 && pickFlower();
            if (a.food && Math.hypot(a.food.x - a.x, a.food.y - a.y) < 18) { a.state = 'nibble'; a.timer = 2.4; a.h = Math.atan2(a.food.y - a.y, a.food.x - a.x); continue; }
            if (a.food) { tx = a.food.x - 12; ty = a.food.y; }
            else if (f && Math.hypot(f.x - a.x, f.y - a.y) < 260) { tx = f.x - 14; ty = f.y; } else { const an = Math.random() * TAU; tx = a.x + Math.cos(an) * 40; ty = a.y + Math.sin(an) * 40; }
            const d = Math.hypot(tx - a.x, ty - a.y) || 1, s = Math.min(34, d); hopTo(a, a.x + (tx - a.x) / d * s, a.y + (ty - a.y) / d * s, 0.34);
          }
        }
      } else if (a.kind === 'cat') {
        const pet = md < 18 && mspeed > 15 && still < 0.15;
        if (pet) { sfx('purr'); disc_('pet'); }
        if (pet && Math.random() < dt * 4) parts.push({ k: 'heart', x: a.x + (Math.random() - 0.5) * 10, y: a.y - 6, life: 0, max: 1.4, ph: Math.random() * TAU });
        if (a.state === 'sleep') {
          if (md < 60 && mspeed > 700) { a.state = 'sit'; a.timer = 1; a.idle = 0; }
          if (Math.random() < dt * 0.5) parts.push({ k: 'z', x: a.x + 6, y: a.y - 8, life: 0, max: 2.4 });
        } else if (pet || a.state === 'pet') {
          if (pet) { a.state = 'pet'; a.petT = 0.7; a.idle = 0; } a.petT -= dt; if (a.petT <= 0) { a.state = 'sit'; a.timer = 3; }
        } else if (a.state === 'stalk' || a.state === 'pounce') {
          const b = a.prey;
          if (!b || !bflies.includes(b)) { a.state = 'sit'; a.timer = 2; }
          else {
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, sp = a.state === 'pounce' ? 220 : 24;
            a.h = turn(a.h, Math.atan2(dy, dx), dt * 6); a.x += Math.cos(a.h) * sp * dt; a.y += Math.sin(a.h) * sp * dt; a.moving = true; a.wp += dt * (a.state === 'pounce' ? 26 : 6);
            if (a.state === 'stalk' && d < 45) { a.state = 'pounce'; a.timer = 0.35; }
            if (a.state === 'pounce') { a.timer -= dt; if (a.timer <= 0) { a.state = 'sit'; a.timer = 2 + Math.random() * 2; } }
            if (d > 280) { a.state = 'sit'; a.timer = 1; }
          }
        } else if (mouse.on && md < 280 && md > 30 && still < 1.2) {
          a.h = turn(a.h, Math.atan2(mouse.y - a.y, mouse.x - a.x), dt * 5); const sp = md > 120 ? 70 : 40;
          a.x += Math.cos(a.h) * sp * dt; a.y += Math.sin(a.h) * sp * dt; a.moving = true; a.wp += dt * sp * 0.25; a.state = 'walk'; a.idle = 0; a.tx = null;
        } else if (a.tx != null) {
          const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
          if (d < 4) { a.tx = null; a.state = 'sit'; a.timer = 2 + Math.random() * 4; }
          else { a.state = 'walk'; a.h = turn(a.h, Math.atan2(dy, dx), dt * 4); a.x += Math.cos(a.h) * 32 * dt; a.y += Math.sin(a.h) * 32 * dt; a.moving = true; a.wp += dt * 8; }
        } else {
          a.state = 'sit'; a.timer -= dt; a.idle = (a.idle || 0) + dt;
          if (a.idle > 16) a.state = 'sleep';
          else if (a.timer <= 0) {
            const b = bflies.find(b => Math.hypot(b.x - a.x, b.y - a.y) < 200);
            if (b && Math.random() < 0.6) { a.state = 'stalk'; a.prey = b; }
            else { const an = Math.random() * TAU; a.tx = clamp(a.x + Math.cos(an) * 90, 30, W - 30); a.ty = clamp(a.y + Math.sin(an) * 90, 30, H - 30); }
          }
        }
      } else if (a.kind === 'duck') {
        const p = a.pond;
        if (!p || p.die || !plants.includes(p)) { parts.push({ k: 'ring', x: a.x, y: a.y, life: 0, max: 0.8, r0: 2, r1: 16 }); animals.forEach(b => { if (b.leader === a) b.leader = null; }); animals.splice(i, 1); continue; }
        if (a.dab > 0) a.dab -= dt;
        if (Math.random() < dt * 0.02) sfx('quack', { x: a.x / W, soft: true });
        let tx = a.tx, ty = a.ty, sp = 16;
        if (a.leader && animals.includes(a.leader)) { const Ld = a.leader, bk = Ld.h + Math.PI, gap = Ld.duckling ? 7 : 10; tx = Ld.x + Math.cos(bk) * gap; ty = Ld.y + Math.sin(bk) * gap; sp = 30; }
        else {
          a.leader = null;
          if (tx == null || Math.hypot(tx - a.x, ty - a.y) < 3) { tx = null; a.timer -= dt; if (a.timer <= 0) { [a.tx, a.ty] = pondPoint(p, 0.95); a.timer = 1 + Math.random() * 3; if (Math.random() < 0.25) a.dab = 1.4; } }
          if (md < 60) { const m = md || 1, nx = a.x + (a.x - mouse.x) / m * 30, ny = a.y + (a.y - mouse.y) / m * 30; if (inPond(p, nx, ny)) { a.tx = tx = nx; a.ty = ty = ny; sp = 45; } }
        }
        if (tx != null) {
          const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
          if (d > 1.5) { const v = Math.min(sp, d * 3); a.h = turn(a.h, Math.atan2(dy, dx), dt * 3); a.x += Math.cos(a.h) * v * dt; a.y += Math.sin(a.h) * v * dt; a.wk = (a.wk || 0) + dt * v; if (a.wk > 9) { a.wk = 0; parts.push({ k: 'wake', x: a.x - Math.cos(a.h) * 6, y: a.y - Math.sin(a.h) * 6, h: a.h, life: 0, max: 1.2, s: a.duckling ? 0.6 : 1 }); } }
        }
        if (!inPond(p, a.x, a.y)) { a.x = lerp(a.x, p.x, 0.05); a.y = lerp(a.y, p.y, 0.05); }
      } else if (a.kind === 'hedgehog') {
        if (a.state === 'curl') { a.timer -= dt; if (a.timer <= 0 && md > 70) a.state = 'walk'; }
        else if (md < 55) { a.state = 'curl'; a.timer = 2.5; }
        else { walker(a, dt, 14, 120); if (Math.random() < dt * 0.12) sfx('snuffle', { x: a.x / W }); }
      } else if (a.kind === 'cow' || a.kind === 'sheep') {
        const sh = a.kind === 'sheep', sp = sh ? 13 : 9;
        if (md < (sh ? 70 : 45)) { const m = md || 1; a.tx = clamp(a.x + (a.x - mouse.x) / m * 60, 30, W - 30); a.ty = clamp(a.y + (a.y - mouse.y) / m * 60, 30, H - 30); a.state = 'walk'; a.run = 1; }
        if (a.state === 'graze') {
          a.timer -= dt; if (Math.random() < dt * (sh ? 0.04 : 0.025)) sfx('critter', { kind: a.kind, x: a.x / W });
          if (a.timer <= 0) { a.state = 'walk'; a.run = 0; const mates = sh ? animals.filter(b => b !== a && b.kind === 'sheep') : [], m = mates.length && Math.random() < 0.6 ? mates[(Math.random() * mates.length) | 0] : null, an = Math.random() * TAU, d = m ? 18 : 30 + Math.random() * 60; a.tx = clamp((m ? m.x : a.x) + Math.cos(an) * d, 30, W - 30); a.ty = clamp((m ? m.y : a.y) + Math.sin(an) * d * 0.7, 30, H - 30); }
        } else {
          const dx = (a.tx ?? a.x) - a.x, dy = (a.ty ?? a.y) - a.y, d = Math.hypot(dx, dy);
          if (d < 3) { a.state = 'graze'; a.timer = 3 + Math.random() * 7; a.tx = null; a.run = 0; }
          else { const v = sp * (a.run ? 2.6 : 1); a.h = Math.atan2(dy, dx); a.x += dx / d * v * dt; a.y += dy / d * v * dt; a.moving = true; a.wp += dt * v * 0.35; }
        }
      } else if (a.kind === 'snail') {
        if (a.state === 'hide') { a.timer -= dt; if (a.timer <= 0 && md > 40) a.state = 'walk'; }
        else if (md < 30) { a.state = 'hide'; a.timer = 2.5; }
        else {
          walker(a, dt, 4, 60);
          const lt = a.trail[a.trail.length - 1];
          if (!lt || Math.hypot(lt[0] - a.x, lt[1] - a.y) > 3) { a.trail.push([a.x - Math.cos(a.h) * 6, a.y - Math.sin(a.h) * 6, T]); if (a.trail.length > 200) a.trail.shift(); }
        }
        while (a.trail.length && T - a.trail[0][2] > 60) a.trail.shift();
      }
      a.x = clamp(a.x, -40, W + 40); a.y = clamp(a.y, -40, H + 40);
    }
  }
  function drawAnimal(a, T) {
    if (a.kind === 'duck' && a.pond && a.pond._g < 0.9) return;
    const P = PIX;
    if (a.kind === 'snail' && a.trail.length > 1) { ctx.fillStyle = 'rgba(232,240,244,.42)'; for (const q of a.trail) ctx.fillRect(Math.round(q[0] / P), Math.round(q[1] / P), 1, 1); }
    const flip = a.kind === 'cat' && a.state === 'sleep' ? Math.cos(a.ph) < 0 : Math.cos(a.h) < 0, s = critterSprite(a, flip);
    const lift = a.kind === 'rabbit' && a.state === 'hop' ? Math.sin(a.hp * Math.PI) * 9 : a.kind === 'cat' && a.state === 'pounce' ? 5 : 0;
    const X = Math.round(a.x / P) - s.ox, Y0 = Math.round(a.y / P) - s.oy, Y = Math.round((a.y - lift) / P) - s.oy + (a.kind === 'duck' && Math.sin(T * 2 + a.ph) > 0.5 ? 1 : 0) + (a.state === 'nibble' && Math.sin(T * 16) > 0 ? 1 : 0);
    if (a.kind !== 'duck') { ctx.fillStyle = 'rgba(20,36,12,.28)'; ctx.fillRect(X + 2, Y0 + s.height - 1, s.width - 4, 1); }
    else { ctx.fillStyle = 'rgba(235,248,245,.45)'; ctx.fillRect(X + 1, Y + s.height - 1, s.width - 2, 1); }
    ctx.drawImage(s, X, Y);
  }
  function updBees(dt, T) {
    const hosts = plants.filter(p => (p.type === 'lavender' || p.type === 'sunflower' || p.type === 'bush') && p.done && !p.die);
    const want = rain > 0.3 || season === 'winter' ? 0 : Math.min(12, Math.ceil(hosts.length * 1.2)), act = bees.filter(b => !b.leaving);
    if (act.length < want && Math.random() < dt * 1.5) { const [x, y] = edgePoint(); bees.push({ x, y, vx: 0, vy: 0, t: null, hover: 0, ph: Math.random() * TAU, ox: 0, oy: 0 }); }
    if (act.length > want && Math.random() < dt * 2) act[0].leaving = true;
    for (let i = bees.length - 1; i >= 0; i--) {
      const b = bees[i];
      if (!b.leaving && (!b.t || !plants.includes(b.t) || b.t.die)) { b.t = hosts.length ? hosts[(Math.random() * hosts.length) | 0] : null; b.ox = (Math.random() - 0.5) * 18; b.oy = (Math.random() - 0.5) * 18; if (!b.t) b.leaving = true; }
      let tx, ty;
      if (b.leaving) { if (b.ex == null) [b.ex, b.ey] = edgePoint(); tx = b.ex; ty = b.ey; } else { tx = b.t.x + b.ox; ty = b.t.y + b.oy; }
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
      if (d < 4 && !b.leaving) { b.hover += dt; if (b.hover > 0.8 + Math.random() * 2) { b.hover = 0; pollinate(b.t, 0.1); if (Math.random() < 0.4) b.t = null; else { b.ox = (Math.random() - 0.5) * 18; b.oy = (Math.random() - 0.5) * 18; } } }
      const k = Math.min(1, d / 20); let ax = dx / d * 90 * k + Math.sin(T * 13 + b.ph) * 40, ay = dy / d * 90 * k + Math.cos(T * 11 + b.ph) * 40;
      if (mouse.on) { const m = Math.hypot(b.x - mouse.x, b.y - mouse.y); if (m < 40) { ax += (b.x - mouse.x) / (m || 1) * 200; ay += (b.y - mouse.y) / (m || 1) * 200; } }
      b.vx += (ax - b.vx) * Math.min(1, dt * 6); b.vy += (ay - b.vy) * Math.min(1, dt * 6); b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.leaving && (b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40)) bees.splice(i, 1);
    }
  }
  function drawBee(b, T) {
    const X = Math.round(b.x / PIX), Y = Math.round(b.y / PIX);
    ctx.fillStyle = 'rgba(20,36,12,.22)'; ctx.fillRect(X + 1, Y + 2, 2, 1);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(X, Y, 2, 1); ctx.fillStyle = '#2a2220'; ctx.fillRect(X + (b.vx > 0 ? 0 : 1), Y, 1, 1);
    if (Math.sin(T * 40 + b.ph) > 0) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(X, Y - 1, 2, 1); }
  }
  function updBirds(dt) {
    birdT -= dt;
    if (birdT <= 0) {
      birdT = 14 + Math.random() * 18; const n = 3 + ((Math.random() * 4) | 0), fromLeft = Math.random() < 0.6, h = fromLeft ? 0.25 + (Math.random() - 0.5) * 0.4 : Math.PI / 2 - 0.3;
      const sx = fromLeft ? -150 : Math.random() * W * 0.6, sy = fromLeft ? Math.random() * H * 0.7 : -150;
      for (let i = 0; i < n; i++) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1; birds.push({ x: sx - Math.cos(h) * row * 26 - Math.sin(h) * side * row * 22, y: sy - Math.sin(h) * row * 26 + Math.cos(h) * side * row * 22, h, ph: Math.random() * TAU, s: 9 + Math.random() * 3 }); }
    }
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      if (b.st === 'land') {
        if (!spotOk(b.spot)) { b.st = 'leave'; b.h = -0.7; continue; }
        const [tx, ty] = perchPos(b.spot), dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
        if (d < 4) { birds.splice(i, 1); perched.push({ spot: b.spot, x: tx, y: ty, f: dx < 0, t: 8 + Math.random() * 18, ph: Math.random() * TAU, col: b.col }); disc_(b.spot.p.type === 'tree' ? 'perch_tree' : 'perch_fence'); sfx('chirp', { x: tx / W }); continue; }
        b.h = Math.atan2(dy, dx); const sp = Math.min(150, 30 + d * 1.6); b.x += dx / d * sp * dt; b.y += dy / d * sp * dt; b.alt = Math.min(1, d / 140); continue;
      }
      if (b.st === 'leave') b.alt = Math.min(1, (b.alt || 0) + dt * 1.2);
      b.x += Math.cos(b.h) * 150 * dt; b.y += Math.sin(b.h) * 150 * dt;
      if (!b.st && !b.tried && b.x > 60 && b.x < W - 60 && b.y > 60 && b.y < H - 60) { b.tried = true; if (Math.random() < 0.45 && perched.length + birds.filter(q => q.st === 'land').length < 14 && lightN < 0.4 && rain < 0.3) { const sp = pickSpot(); if (sp) { b.st = 'land'; b.spot = sp; b.col = (Math.random() * 3) | 0; } } }
      if (b.x > W + 400 || b.y > H + 400 || b.x < -400 || b.y < -400) birds.splice(i, 1);
    }
    updPerched(dt);
  }
  const BIRD = [mapSprite(['k...k', '.k.k.', '..k..'], { k: '#2b2a26' }, false, 0), mapSprite(['.....', 'kkkkk', '..k..'], { k: '#2b2a26' }, false, 0)];
  const SPAR = { a: ['...bb.', '..bbko', 'bbbww.', '..k.k.'], p: ['......', '..bbb.', 'bbbwwb', '..k.ko'] }, SPC = [{ b: '#8a6a4a', w: '#d8c4a4', k: '#2a2220', o: '#e0a040' }, { b: '#7a5a42', w: '#e07a3a', k: '#2a2220', o: '#d9a040' }, { b: '#5f86b8', w: '#f2d36b', k: '#2a2220', o: '#e0a040' }], SPCACHE = new Map();
  const sparSpr = (c, f, fl) => { const k = c + f + fl; if (!SPCACHE.has(k)) SPCACHE.set(k, mapSprite(SPAR[f], SPC[c], fl, 0.4)); return SPCACHE.get(k); };
  function drawBirds(T) {
    for (const b of birds) {
      const al = b.alt ?? 1, X = Math.round(b.x / PIX), Y = Math.round(b.y / PIX), fl = Math.cos(b.h) < 0;
      if (b.col != null && al < 0.3) { const c = sparSpr(b.col, 'a', fl); ctx.drawImage(c, X - c.ox, Y - c.oy); continue; }
      const sh = BIRD[Math.sin(T * (b.col != null ? 14 : 7) + b.ph) > 0 ? 0 : 1];
      ctx.globalAlpha = 0.16; ctx.drawImage(shadowOf(sh), X - sh.ox + Math.round(23 * al), Y - sh.oy + Math.round(30 * al)); ctx.globalAlpha = 1;
      if (b.col != null) { const c = sparSpr(b.col, 'a', fl); ctx.drawImage(c, X - c.ox, Y - c.oy); } else ctx.drawImage(sh, X - sh.ox, Y - sh.oy);
    }
  }
  function drawPerch(b, T) { const sp = sparSpr(b.col, Math.sin(T * 2.3 + b.ph) > 0.8 ? 'p' : 'a', b.f), X = Math.round(b.x / PIX), Y = Math.round(b.y / PIX); ctx.fillStyle = 'rgba(20,36,12,.25)'; ctx.fillRect(X - 2, Y + 2, 4, 1); ctx.drawImage(sp, X - sp.ox, Y - sp.oy); }
  function frame(ms) {
    raf = requestAnimationFrame(frame);
    const T = ms / 1000, dt = Math.min(0.05, Math.max(0, T - prevT)); prevT = T;
    const o = opts.getOpts(), wk = o.wind * (1 + stormK * 0.9);
    if (o.pix && o.pix !== PIX) { PIX = o.pix; resize(); }
    if (o.zoom && o.zoom !== ZOOM) { ZOOM = o.zoom; resize(); }
    if (Math.abs(o.density - curDensity) > 0.01) buildBlades(o.density);
    if (!started) { started = true; load(); rollNext(); seedLitter(); }
    if (o.auto) { todPos = (todPos + dt * 0.03) % 5; todTarget = todPos; const idx = Math.round(todPos) % 5; if (idx !== lastTodIdx) { lastTodIdx = idx; opts.onTod && opts.onTod(idx); } }
    else todPos += (todTarget - todPos) * Math.min(1, dt * 1.5);
    const L = todState(todPos); lightN = L.n;
    rain += (rainTarget - rain) * Math.min(1, dt * 0.8);
    stormK += ((weather === 'storm' ? 1 : 0) - stormK) * Math.min(1, dt * 0.8); fogK += ((weather === 'fog' ? 1 : 0) - fogK) * Math.min(1, dt * 0.4); flash = Math.max(0, flash - dt * 3.5); if (rbT > 0) rbT -= dt;
    if (stormK > 0.6) { boltT -= dt; if (boltT <= 0) { boltT = 3 + Math.random() * 7; flash = 1; bolt = makeBolt(); disc_('storm'); const bx = bolt.x / canvas.width; setTimeout(() => sfx('thunder', { x: bx }), 250 + Math.random() * 1400); } if (!gust && Math.random() < dt * 0.06) { gustId++; gust = { x: -300 }; } }
    winterK += ((season === 'winter' ? 1 : 0) - winterK) * Math.min(1, dt * 0.6); iceAmt = winterK;
    if (gust) { gust.x += dt * 620; if (gust.x > W + H * 0.3 + 400) gust = null; }
    const gustAt = (x, y) => { if (!gust) return 0; const g = (x + y * 0.3 - gust.x) / 150; return g > -3 && g < 3 ? Math.exp(-g * g) : 0; };

    // update plants
    for (let i = plants.length - 1; i >= 0; i--) {
      const p = plants[i], tree = p.type === 'tree', high = LAYER(p.type) === 'high', sw = tree ? 0 : (SWAY[p.type] ?? 1);
      if (p.die && T > p.die) { const k = (T - p.die) / 0.4; if (k >= 1) { plants.splice(i, 1); continue; } p._s = 1 - k * k; } else p._s = 1;
      if (WILT.has(p.type)) p._s *= 1 - winterK;
      const g = clamp((T - p.born) / TYPES[p.type].grow); p._g = g;
      if (g >= 1 && !p.done) { p.done = true; if (FLOWERS.has(p.type)) disc_('bloom'); sfx('bloom', { type: p.type, x: p.x / W }); spark(p.x, p.y, high ? 6 : 3, pR(p) * 0.9); }
      if (!p.done && rain > 0.2) p.born -= dt * 0.8 * rain;
      if (!p.done && onBed(p)) p.born -= dt * 0.6;
      if (p.picked && now() > p.picked) { p.picked = 0; p._sk = null; }
      if (p.type === 'cottage' && p.done && !p.die && Math.random() < dt * 2.5) { const [cx, cy] = local(p, 25, -24); parts.push({ k: 'smoke', x: cx, y: cy, life: 0, max: 4 + Math.random() * 2, ph: Math.random() * TAU }); }
      const w = windAt(p.x, p.y, T) * wk, gf = gustAt(p.x, p.y);
      let ox = tree ? w * 1.6 + gf * 6 : gf * 4 * sw, oy = tree ? w * 0.8 : 0, ang = tree ? w * 0.012 + gf * 0.03 : (w * 0.07 + gf * 0.25) * sw;
      if (mouse.on && sw > 0) { const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy); if (d < 60 && d > 0.1) { const f = (1 - d / 60) * sw; ox += dx / d * f * 5; oy += dy / d * f * 5; ang += f * 0.25 * Math.sign(dx); } }
      if (gust && gf > 0.6 && p.gid !== gustId && p.done && (FLOWERS.has(p.type) || tree)) { p.gid = gustId; for (let k = 0; k < (tree ? 3 : 2); k++) petal(p.x, p.y, pcol(p), tree); }
      p._ox = ox; p._oy = oy; p._ang = ang;
      if (p.bounce > 0) p.bounce = Math.max(0, p.bounce - dt * 1.3);
    }
    // ambient drift
    if (Math.random() < dt * (season === 'autumn' ? 3 : 0.9)) { const f = plants.filter(p => p.done && !p.die && p._s > 0.5 && (FLOWERS.has(p.type) || p.type === 'tree')); if (f.length) { const p = f[(Math.random() * f.length) | 0]; if (p.type !== 'tree' || Math.random() < 0.6) petal(p.x, p.y, pcol(p), p.type === 'tree'); } }

    const P = PIX, cw = canvas.width, ch = canvas.height, L2 = v => Math.round(v / P);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
    if (gFade < 1 && prevGround) { ctx.drawImage(prevGround, 0, 0); gFade = Math.min(1, gFade + dt * 0.6); ctx.globalAlpha = gFade; }
    ctx.drawImage(groundFor(season), 0, 0); ctx.globalAlpha = 1;

    const STAGED = t => FLOWERS.has(t) || t === 'cabbage' || t === 'pumpkin';
    const sprOf = p => {
      const st = STAGED(p.type) ? (p._g < 0.35 ? 0 : p._g < 0.75 ? 1 : 2) : p.type === 'pond' || p.type === 'fence' || p.type === 'lantern' ? 2 : (p._g < 0.45 ? 1 : 2);
      const key = st + curSeason + P + (p.picked ? 'p' : '');
      if (p._sk !== key) { p._sk = key; p._spr = genPlant(p, TYPES[p.type].R * p.sc / P * (st === 1 ? 0.6 : 1), st); }
      return p._spr;
    };
    const visible = p => p._g > 0 && p._s > 0.5 && !(p.die && ((T * 20) | 0) % 2);

    if (terDirty) buildTerrain(); if (terC) ctx.drawImage(terC, 0, 0);
    if (litC) ctx.drawImage(litC, 0, 0);
    if (rain > 0.4 && season !== 'winter' && puddles.length < 14 && Math.random() < dt * 0.5 * rain) { const x = 30 + Math.random() * (W - 60), y = 30 + Math.random() * (H - 60); if (!plants.some(p => !p.die && (p.type === 'pond' ? inPond(p, x, y) : LAYER(p.type) !== 'ground' && Math.hypot(p.x - x, p.y - y) < pR(p) + 10))) puddles.push({ x, y, r: 0, max: 16 + Math.random() * 26, v: (Math.random() * 4) | 0 }); }
    for (let i = puddles.length - 1; i >= 0; i--) { const q = puddles[i]; q.r = rain > 0.3 ? Math.min(q.max, q.r + dt * 4) : q.r - dt * 0.7; if (q.r <= 0) { puddles.splice(i, 1); continue; } const rr = Math.round(q.r / P); if (rr < 2) continue; const sp = pudSpr(rr, q.v, season === 'winter'); ctx.drawImage(sp, L2(q.x) - sp.ox, L2(q.y) - sp.oy); }
    if (winterK > 0.5) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 46; i++) { const ph = T * 1.5 + i * 0.37, slot = Math.floor(ph), kq = ph - slot, rr = rng(slot * 97 + i * 13), X = (rr() * cw) | 0, Y = (rr() * ch) | 0; if (kq > 0.5) continue; ctx.fillRect(X, Y, 1, 1); if (kq > 0.18 && kq < 0.32) { ctx.fillRect(X - 1, Y, 3, 1); ctx.fillRect(X, Y - 1, 1, 3); } } }

    // hard pixel shadows
    const shk = L.sh * (1 - rain * 0.6);
    for (const p of plants) {
      if (p.type === 'pond' || !visible(p)) continue;
      const s = sprOf(p), tree = LAYER(p.type) === 'high', ox = Math.round((tree ? 5 : 1) * shk), oy = Math.round((tree ? 6 : 1) * shk); if (!ox && !oy) continue;
      ctx.globalAlpha = (tree ? 0.26 : 0.18) * clamp(shk, 0.25, 1); ctx.drawImage(shadowOf(s), L2(p.x + p._ox) - s.ox + ox, L2(p.y + p._oy) - s.oy + oy);
    }
    ctx.globalAlpha = 1;

    // grass tufts
    const mxb = mouse.on ? mouse.x / P : -999, myb = mouse.on ? mouse.y / P : -999, SB = SEASONS[season];
    for (let b = 0; b < buckets.length; b++) {
      ctx.fillStyle = SB.blades[b]; ctx.beginPath();
      const arr = buckets[b], bstep = SB.step;
      for (let i = 0; i < arr.length; i += bstep) {
        const bl = arr[i], wx = bl.x * P, wy = bl.y * P; let t = windAt(wx, wy, T) * 1.1 * wk;
        if (gust) t += gustAt(wx, wy) * 2.6;
        const dx = bl.x - mxb, dy = bl.y - myb, d2 = dx * dx + dy * dy; if (d2 < 144) t += (dx >= 0 ? 1 : -1) * (2.2 - Math.sqrt(d2) / 6);
        bl.c += (t - bl.c) * 0.2; const o = Math.round(clamp(bl.c, -2, 2));
        ctx.rect(bl.x, bl.y, 1, 1); ctx.rect(bl.x + Math.round(o * 0.5), bl.y - 1, 1, 1); ctx.rect(bl.x + o, bl.y - 2, 1, 1);
      }
      ctx.fill();
    }

    const drawP = p => { if (!visible(p)) return; const s = sprOf(p); let Y = L2(p.y + p._oy) - s.oy; if (p.bounce > 0) Y -= Math.round(Math.abs(Math.sin((1 - p.bounce) * 12)) * p.bounce * 2); ctx.drawImage(s, L2(p.x + p._ox) - s.ox, Y); };
    for (const p of plants) if (p.type === 'pond') drawP(p);
    if (season !== 'winter') for (const p of plants) {
      if (p.type !== 'pond' || !p.done) continue; const rx = 62 * p.sc * 0.6, ry = rx * 0.7;
      for (let i = 0; i < 3; i++) { const ph = T * 0.45 + i * 0.37 + (p.seed % 7), base = Math.floor(ph), k = ph - base, rr = rng(p.seed + base * 31 + i * 7), a = rr() * TAU, d = Math.sqrt(rr()); ctx.fillStyle = 'rgba(232,247,255,' + (Math.sin(k * Math.PI) * 0.85).toFixed(2) + ')'; ctx.fillRect(L2(p.x + Math.cos(a) * rx * d), L2(p.y + Math.sin(a) * ry * d), 2, 1); }
    }
    for (const p of plants) if (LAYER(p.type) === 'ground') drawP(p);
    const fmap = {}; for (const p of plants) if (p.type === 'fence') fmap[p.seed] = p;
    for (const p of plants) {
      if (p.type !== 'fence' || p.prev == null) continue; const q = fmap[p.prev]; if (!q || !visible(q) || !visible(p)) continue;
      const kk = clamp(Math.min(p._g, q._g) * 1.2), x1 = q.x / P, y1 = q.y / P, x2 = lerp(q.x, p.x, kk) / P, y2 = lerp(q.y, p.y, kk) / P, hz = Math.abs(x2 - x1) >= Math.abs(y2 - y1), fx = hz ? 0 : 1, fy = hz ? 1 : 0;
      ctx.fillStyle = 'rgba(20,50,20,.25)'; pline(x1 + 1 + fx, y1 + 1 + fy, x2 + 1 + fx, y2 + 1 + fy);
      ctx.fillStyle = season === 'winter' ? '#ffffff' : '#efe7d4'; pline(x1 - fx, y1 - fy, x2 - fx, y2 - fy); pline(x1 + fx, y1 + fy, x2 + fx, y2 + fy);
    }
    updAnimals(dt, T); updVisitors(dt);
    const ds = [];
    for (const p of plants) { const lay = LAYER(p.type); if (lay === 'low') ds.push([p.y, 0, p]); else if (lay === 'high') ds.push([p.y + pR(p) * (p.type === 'tree' ? 0.35 : 0.45), 0, p]); }
    for (const a of animals) ds.push([a.y + 3, 1, a]);
    for (const v of visitors) ds.push([v.y + 4, 2, v]);
    for (const b of perched) ds.push([b.spot.key(), 3, b]);
    ds.sort((a, b) => a[0] - b[0]);
    for (const [, kd, ob] of ds) kd === 0 ? drawP(ob) : kd === 1 ? drawAnimal(ob, T) : kd === 2 ? drawVisitor(ob) : drawPerch(ob, T);
    updBees(dt, T); for (const b of bees) drawBee(b, T);
    updFlies(dt, T); for (const b of bflies) drawFly(b, T);

    // dappled canopy shade
    ctx.globalAlpha = 0.3 * clamp(L.sh, 0.2, 1.1) * (1 - rain * 0.75) * (1 - winterK * 0.45);
    ctx.drawImage(canopy.c, -canopy.pad + Math.round(Math.sin(T * 0.31) * 4 + Math.sin(T * 0.83) * wk), -canopy.pad + Math.round(Math.cos(T * 0.27) * 3)); ctx.globalAlpha = 1;
    updBirds(dt); drawBirds(T);

    // particles
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i]; q.life += dt; if (q.life > q.max) { if ((q.k === 'leaf' || q.k === 'petal') && season !== 'winter') stampLitter(q.x, q.y, q.col); parts.splice(i, 1); continue; } if (q.life < 0) continue;
      const k = q.life / q.max;
      if (q.k === 'ring') { ctx.fillStyle = 'rgba(228,243,255,' + ((1 - k) * (q.a || 0.85)).toFixed(2) + ')'; pring(q.x / P, q.y / P, (q.r0 + eOut(k) * q.r1) / P); }
      else if (q.k === 'drop') { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#e6f3ff'; ctx.fillRect(L2(q.x), L2(q.y), 1, 1); ctx.globalAlpha = 1; }
      else if (q.k === 'dirt') { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.88; q.vy *= 0.88; ctx.globalAlpha = 1 - k; ctx.fillStyle = q.col || '#6b4a2b'; ctx.fillRect(L2(q.x), L2(q.y), 1, 1); ctx.globalAlpha = 1; }
      else if (q.k === 'smoke') { const w = windAt(q.x, q.y, T) * wk; q.x += (14 + w * 10 + gustAt(q.x, q.y) * 220) * dt; q.y += (-7 + Math.sin(T + q.ph) * 4) * dt; const z = 1 + Math.floor(k * 3.5); ctx.fillStyle = 'rgba(238,234,228,' + ((1 - k) * 0.5).toFixed(2) + ')'; ctx.fillRect(L2(q.x) - (z >> 1), L2(q.y) - (z >> 1), z, z); }
      else if (q.k === 'heart') { q.y -= 16 * dt; q.x += Math.sin(T * 3 + q.ph) * 10 * dt; ctx.globalAlpha = 1 - k; ctx.drawImage(HEART, L2(q.x) - HEART.ox, L2(q.y) - HEART.oy); ctx.globalAlpha = 1; }
      else if (q.k === 'z') { q.y -= 9 * dt; q.x += 5 * dt; ctx.globalAlpha = Math.min(1, (1 - k) * 1.5); ctx.drawImage(ZZ, L2(q.x), L2(q.y)); ctx.globalAlpha = 1; }
      else if (q.k === 'wake') { const l = (3 + k * 14 * q.s) / P; ctx.fillStyle = 'rgba(235,248,245,' + ((1 - k) * 0.6).toFixed(2) + ')'; for (const sd of [-1, 1]) { const an = q.h + Math.PI + sd * 0.45; ctx.fillRect(Math.round(q.x / P + Math.cos(an) * l), Math.round(q.y / P + Math.sin(an) * l), 1, 1); } }
      else if (q.k === 'pop') { q.y -= 26 * dt; const sp = POP()[q.item], X = L2(q.x), Y = L2(q.y), str = '+' + q.n; ctx.globalAlpha = Math.min(1, (1 - k) * 2.5); ctx.drawImage(sp, X - sp.ox - 4, Y - sp.oy); for (let c = 0; c < str.length; c++) ctx.drawImage(digSpr(str[c]), X + 1 + c * 4, Y - 3); ctx.globalAlpha = 1; }
      else if (q.k === 'spark') { const sz = q.s * Math.sin(k * Math.PI), X = L2(q.x), Y = L2(q.y); ctx.fillStyle = '#fff6cf'; ctx.fillRect(X, Y, 1, 1); if (sz > 2) { ctx.fillRect(X - 1, Y, 3, 1); ctx.fillRect(X, Y - 1, 1, 3); } }
      else {
        const w = windAt(q.x, q.y, T) * wk, gf = gustAt(q.x, q.y); q.vx += ((30 + w * 35) * (0.4 + wk * 0.6) + gf * 260 - q.vx) * Math.min(1, dt * 1.5);
        q.x += q.vx * dt; q.y += (Math.sin(T * 1.7 + q.ph) * 16 + q.vy0) * dt; q.rot += q.vr * dt;
        const a = Math.min(1, q.life * 3, (q.max - q.life) * 1.5), fl = 0.3 + 0.7 * Math.abs(Math.cos(T * 3 + q.ph)), X = L2(q.x), Y = L2(q.y), big = q.k === 'leaf';
        ctx.globalAlpha = a * 0.18; ctx.fillStyle = '#14240c'; ctx.fillRect(X + 2, Y + 2, big ? 2 : 1, 1);
        ctx.globalAlpha = a; ctx.fillStyle = q.col; if (big) ctx.fillRect(X, Y, fl > 0.6 ? 2 : 1, fl > 0.6 ? 1 : 2); else ctx.fillRect(X, Y, 1, 1); ctx.globalAlpha = 1;
        if (q.x > W + 30) parts.splice(i, 1);
      }
    }

    if (rain > 0.02) {
      const n = Math.floor(rain * (1 + stormK) * cw * ch / 900); ctx.fillStyle = 'rgba(214,228,244,.55)'; ctx.beginPath();
      for (let i = 0; i < n; i++) { const x = (Math.random() * cw) | 0, y = (Math.random() * ch) | 0; ctx.rect(x, y, 1, 2); ctx.rect(x + 1, y - 2, 1, 2); }
      ctx.fill();
      if (Math.random() < rain) for (let i = 0; i < Math.ceil(rain * dt * 70); i++) parts.push({ k: 'ring', x: Math.random() * W, y: Math.random() * H, life: 0, max: 0.45, r0: 1, r1: 7, a: 0.55 });
    }
    if (winterK > 0.02) {
      if (!flakes.length) for (let i = 0; i < 240; i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, s: 0.8 + Math.random() * 1.8, ph: Math.random() * TAU, v: 0.5 + Math.random() });
      const n = Math.floor(flakes.length * winterK); ctx.fillStyle = 'rgba(255,255,255,.95)';
      for (let i = 0; i < n; i++) { const f = flakes[i]; f.x += (12 + windAt(f.x, f.y, T) * 18 * wk + gustAt(f.x, f.y) * 200) * dt * f.v; f.y += (Math.sin(T * 0.8 + f.ph) * 10 + 6) * dt; if (f.x > W + 10) f.x = -10; if (f.y > H + 10) f.y = -10; const z = f.s > 1.9 ? 2 : 1; ctx.fillRect(L2(f.x), L2(f.y), z, z); }
    }
    if (rbT > 0) { if (!rbC) rbC = makeRainbow(); ctx.globalAlpha = 0.38 * Math.min(1, (14 - rbT) / 1.5, rbT / 3); ctx.drawImage(rbC, 0, 0); ctx.globalAlpha = 1; }
    if (fogK > 0.02) { if (!fogC) fogC = makeFog(); const off = (T * 4) % (2 * cw), tri = off < cw ? off : 2 * cw - off; ctx.globalAlpha = fogK * 0.6; ctx.drawImage(fogC, -Math.round(tri), 0); ctx.globalAlpha = 1; }
    // palette-swap light
    const G = gradeAt(todPos, rain, stormK);
    if (G.k > 0.01 || G.n > 0.01 || rain > 0.02 || stormK > 0.02 || Math.abs(G.sat - 1) > 0.01 || Math.abs(G.bri - 1) > 0.01) {
      const gk = todPos.toFixed(2) + '|' + rain.toFixed(2) + '|' + stormK.toFixed(2); if (gk !== lutKey) { lutKey = gk; buildLUT(G); }
      const im = ctx.getImageData(0, 0, cw, ch), dd = im.data, Lt = LUT;
      for (let i = 0; i < dd.length; i += 4) { const o = ((dd[i] >> 3) * 1024 + (dd[i + 1] >> 3) * 32 + (dd[i + 2] >> 3)) * 3; dd[i] = Lt[o]; dd[i + 1] = Lt[o + 1]; dd[i + 2] = Lt[o + 2]; }
      ctx.putImageData(im, 0, 0);
    }
    ctx.globalCompositeOperation = 'screen';
    const gl = (x, y, Rc, col, a) => { const g = glowSpr(Math.max(2, Math.round(Rc / P)), col); ctx.globalAlpha = clamp(a); ctx.drawImage(g, L2(x) - g.R, L2(y) - g.R); };
    if (L.n > 0.02 && mouse.on) gl(mouse.x, mouse.y, 180, '#ffd696', 0.38 * L.n);
    if (L.n > 0.05) {
      for (const p of plants) {
        if (!p.done || p.die) continue;
        if (p.type === 'lantern') { const fl = 0.85 + Math.sin(T * 9 + p.seed) * 0.05 + Math.sin(T * 23 + p.seed) * 0.04; gl(p.x, p.y, 95, '#ffc878', 0.6 * L.n * fl); gl(p.x, p.y, 14, '#fff0c8', 0.8 * L.n); }
        else if (p.type === 'cottage') { const [x2, y2] = local(p, -27, -24); gl(x2, y2, 60, '#ffcd82', 0.5 * L.n); }
        else if (p.type === 'mushroom') { gl(p.x, p.y, 40 * p.sc, '#a0f0d2', 0.3 * L.n); if (L.n > 0.6) disc_('glow'); }
      }
    }
    ctx.globalAlpha = 1;
    if (L.n > 0.03) {
      ctx.globalCompositeOperation = 'lighter';
      for (const f of ffs) {
        f.x += Math.cos(T * 0.3 * f.sp + f.ph) * 14 * dt + Math.sin(T * 1.3 + f.ph) * 6 * dt; f.y += Math.sin(T * 0.37 * f.sp + f.ph * 1.3) * 14 * dt;
        if (mouse.on) { const dx = f.x - mouse.x, dy = f.y - mouse.y, d = Math.hypot(dx, dy); if (d < 160 && d > 30) { f.x -= dx / d * 18 * dt; f.y -= dy / d * 18 * dt; } }
        if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20; if (f.y < -20) f.y = H + 20; if (f.y > H + 20) f.y = -20;
        const a = L.n * Math.pow(0.5 + 0.5 * Math.sin(T * 1.6 * f.sp + f.ph), 3); if (a < 0.02) continue;
        const X = L2(f.x), Y = L2(f.y); ctx.fillStyle = 'rgba(230,240,120,' + (a * 0.35).toFixed(2) + ')'; ctx.fillRect(X - 1, Y, 3, 1); ctx.fillRect(X, Y - 1, 1, 3); ctx.fillStyle = 'rgba(255,252,190,' + a.toFixed(2) + ')'; ctx.fillRect(X, Y, 1, 1);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    if (flash > 0.01) {
      if (bolt && flash > 0.35) { ctx.fillStyle = 'rgba(190,210,255,.6)'; for (let i = 1; i < bolt.pts.length; i++) pline(bolt.pts[i - 1][0] + 1, bolt.pts[i - 1][1], bolt.pts[i][0] + 1, bolt.pts[i][1]); ctx.fillStyle = '#fffbe8'; for (let i = 1; i < bolt.pts.length; i++) pline(bolt.pts[i - 1][0], bolt.pts[i - 1][1], bolt.pts[i][0], bolt.pts[i][1]); }
      ctx.fillStyle = 'rgba(235,240,255,' + (flash * 0.45).toFixed(2) + ')'; ctx.fillRect(0, 0, cw, ch);
    }

    // cursor
    if (mouse.on) {
      const mxl = L2(mouse.x), myl = L2(mouse.y);
      if (isSeed(tool) && next) { if (!ghost) ghost = genPlant(next, TYPES[next.type].R * next.sc / P, 2); ctx.globalAlpha = 0.5 + Math.sin(T * 4) * 0.1; ctx.drawImage(ghost, mxl - ghost.ox, myl - ghost.oy); ctx.globalAlpha = 1; }
      if (CRITTERS.includes(tool)) { const cs = critterSprite({ kind: tool, state: tool === 'hedgehog' || tool === 'snail' ? 'walk' : 'sit', style: 1, wp: 0 }, false); ctx.globalAlpha = 0.55; ctx.drawImage(cs, mxl - cs.ox, myl - cs.oy); ctx.globalAlpha = 1; }
      const rad = isSeed(tool) ? TYPES[tool].R * (next ? next.sc : 1) * (LAYER(tool) === 'high' || tool === 'pond' ? 0.9 : 1.15) + 4 : CRITTERS.includes(tool) ? 16 : tool === 'water' ? 36 : tool === 'path' ? 9 : tool === 'bed' ? 12 : 20;
      const rl = rad / P, n = Math.max(12, Math.round(rl * 6.3)), off = Math.floor(T * 8);
      ctx.fillStyle = L.n > 0.5 ? 'rgba(255,230,180,.85)' : 'rgba(251,247,233,.9)';
      for (let i = 0; i < n; i++) { if ((i + off) % 6 >= 3) continue; const a = i / n * TAU; ctx.fillRect(Math.round(mxl + Math.cos(a) * rl), Math.round(myl + Math.sin(a) * rl), 1, 1); }
      ctx.fillRect(mxl, myl, 1, 1);
    }

    statT += dt;
    if (statT > 0.4) { statT = 0; ambientCalls(); if (++saveTick % 25 === 0) save(); sfx('env', { wind: wk, rain, night: L.n, season, gust: !!gust, storm: stormK }); opts.onStats && opts.onStats({ blooms: plants.filter(p => FLOWERS.has(p.type) && p.done && !p.die).length, trees: plants.filter(p => p.type === 'tree' && !p.die).length, critters: animals.length, visitors: bflies.length + bees.length }); }
  }

  resize();
  raf = requestAnimationFrame(frame);

  return {
    setTool(t) { tool = t; if (isSeed(t)) rollNext(); },
    setTod(i) { todTarget = i; lastTodIdx = i; },
    gust() { gustId++; gust = { x: -300 }; sfx('gust'); },
    setSeason(sn) { if (sn === season || !SEASONS[sn]) return; prevGround = groundFor(season); season = sn; curSeason = sn; gFade = 0; ghost = null; seedLitter(); terDirty = true; sfx('season'); },
    setRain(b) { this.setWeather(b ? 'rain' : 'clear'); },
    setWeather(w) { const was = weather; weather = w; rainTarget = w === 'rain' ? 0.75 : w === 'storm' ? 1 : 0; if ((was === 'rain' || was === 'storm') && (w === 'clear' || w === 'fog') && lightN < 0.35) { rbT = 14; disc_('rainbow'); sfx('rainbow'); } },
    rainbow() { rbT = 14; sfx('rainbow'); },
    celebrate() {
      rbT = 14; sfx('rainbow');
      const C = ['#f2b3c6', '#f7e7a1', '#e0823a', '#ffffff', '#b48fc4', '#f2b45a'];
      for (let i = 0; i < 90; i++) petal(Math.random() * W * 1.1 - W * 0.2, Math.random() * H, C[(Math.random() * C.length) | 0], false);
      for (let i = 0; i < 12; i++) spark(Math.random() * W, Math.random() * H, 4, 14);
    },
    postcard(cap) {
      const cw = canvas.width, ch = canvas.height, sc = Math.max(2, Math.round(1600 / cw)), b = 6 * sc, capH = 16 * sc, out = mk(cw * sc + b * 2, ch * sc + b * 2 + capH), x = out.getContext('2d');
      const ink = cap.gold ? '#b8862a' : '#24361a';
      x.imageSmoothingEnabled = false; x.fillStyle = ink; x.fillRect(0, 0, out.width, out.height); x.fillStyle = cap.gold ? '#f7e7a1' : '#f6f1e2'; x.fillRect(sc * 2, sc * 2, out.width - sc * 4, out.height - sc * 4);
      x.drawImage(canvas, b, b, cw * sc, ch * sc); x.fillStyle = ink; x.fillRect(b - sc, b - sc, cw * sc + sc * 2, sc); x.fillRect(b - sc, b + ch * sc, cw * sc + sc * 2, sc); x.fillRect(b - sc, b, sc, ch * sc); x.fillRect(b + cw * sc, b, sc, ch * sc);
      for (const [cx, cy] of [[0, 0], [out.width - sc * 2, 0], [0, out.height - sc * 2], [out.width - sc * 2, out.height - sc * 2]]) x.clearRect(cx, cy, sc * 2, sc * 2);
      x.fillStyle = '#24361a'; x.font = (12 * sc) + 'px "Jersey 10", monospace'; x.textBaseline = 'middle'; const ty = b + ch * sc + capH / 2 + sc * 2;
      x.textAlign = 'left'; x.fillText(cap.left || '', b, ty); x.textAlign = 'right'; x.fillText(cap.right || '', out.width - b, ty);
      disc_('postcard'); sfx('shutter'); return out.toDataURL('image/png');
    },
    clear() { paint = []; rebuildMask(); puddles = []; if (litC) litC.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, litC.width, litC.height); litN = 0; const T = now(); plants.forEach(p => { if (!p.die) { p.die = T + (p.x / W) * 0.8; setTimeout(() => dirt(p.x, p.y, 5), (p.x / W) * 800); } }); localStorage.removeItem(STORE); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); clearTimeout(saveTO);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('pointerleave', onLeave);
    },
  };
}
