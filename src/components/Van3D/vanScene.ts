// 3D van viewer (three.js). The body is the author's blueprint-style van
// (van-blueprint.js): a loft of cross-sections drawn as lines with a faint fill,
// so the cargo stays visible through the walls. Generalised to any vehicle of
// the catalog via vanLayout(); cargo comes from the packing plan.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PlacedUnit, Vehicle } from '../../types';
import { unitBox, vanLayout, type VanLayout } from './vanLayout';

export type ViewName = 'persp' | 'side' | 'rear' | 'top';
export type ThemeName = 'light' | 'dark';

export interface Palette {
  bg: number; line: number; soft: number; fill: number; accent: number;
  arch: number; grid1: number; grid2: number; text: string; labelBg: string;
  wood: number; woodEdge: number; noStack: number;
}

export const PALETTES: Record<ThemeName, Palette> = {
  light: {
    bg: 0xf8fafc, line: 0x475569, soft: 0x94a3b8, fill: 0x64748b, accent: 0x2563eb,
    arch: 0xf59e0b, grid1: 0xd5dde7, grid2: 0xebeff4, text: '#334155', labelBg: 'rgba(255,255,255,0.88)',
    wood: 0xc9a067, woodEdge: 0x8a6a3c, noStack: 0xdc2626,
  },
  dark: {
    bg: 0x0f172a, line: 0xcbd5e1, soft: 0x64748b, fill: 0x94a3b8, accent: 0x60a5fa,
    arch: 0xfbbf24, grid1: 0x2b3a50, grid2: 0x1b2537, text: '#e2e8f0', labelBg: 'rgba(15,23,42,0.85)',
    wood: 0xb08a55, woodEdge: 0x6b5030, noStack: 0xf87171,
  },
};

export interface DimLabels { wheelbase: string; between: string; arch: string }

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ── van body ─────────────────────────────────────────────────────────────────

function buildBody(v: Vehicle, L: VanLayout, P: Palette, labels: DimLabels) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const cargo = new THREE.Group();
  const dims = new THREE.Group();
  group.add(body, cargo, dims);

  const lm = (c: number, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: o < 1, opacity: o });
  function pl(pts: THREE.Vector3[], c = P.line, o = 1, g: THREE.Group = body, closed = false, dash = false) {
    const p = pts.slice();
    if (closed) p.push(p[0]);
    const mat = dash
      ? new THREE.LineDashedMaterial({ color: c, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: o })
      : lm(c, o);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), mat);
    if (dash) line.computeLineDistances();
    g.add(line);
    return line;
  }
  const edges = (geo: THREE.BufferGeometry, c = P.line, th = 30, g: THREE.Group = body, o = 1) => {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, th), lm(c, o));
    g.add(e);
    return e;
  };
  const fill = (geo: THREE.BufferGeometry, c = P.fill, op = 0.05, g: THREE.Group = body) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
    g.add(m);
    return m;
  };

  const { LEN, HWX, H, FA, RA, fy, hwI, X0, X1, cabTop } = L;
  const TR = L.tireRadius;

  function sec(x: number) {
    const f = LEN - x;
    let top: number, t: number;
    if (x < 0.04) top = H - 0.04 + x;
    else if (f > 2.032) top = H;
    else if (f > 1.582) { t = (2.032 - f) / 0.45; top = H - ((H - cabTop) * (1 - Math.cos(t * Math.PI))) / 2; }
    else if (f > 0.832) top = cabTop - ((1.582 - f) / 0.75) * (cabTop - 1.42);
    else if (f > 0.132) top = 1.42 - ((0.832 - f) / 0.7) * 0.27;
    else { t = (0.132 - f) / 0.132; top = 1.15 - 0.1 * t * t; }
    const hw = x < 0.03 ? HWX - 0.025 : f < 0.532 ? HWX - 0.12 * Math.pow((0.532 - f) / 0.532, 2) : HWX;
    const hwt = f > 1.932 ? HWX - 0.06 : f > 1.332 ? HWX - 0.06 - ((1.932 - f) / 0.6) * 0.05 : HWX - 0.11 - Math.min(1, (1.332 - f) / 0.6) * 0.05;
    const r = f > 2.032 ? 0.3 : Math.min(0.3, Math.max(0.12, (top - 1.15) * 0.35));
    const belt = Math.min(1.15, top - r - 0.05);
    const yb = f < 0.182 ? 0.36 : 0.4;
    return { top, hw, hwt, r, belt, yb };
  }
  function ring(x: number) {
    const s = sec(x);
    const hh: [number, number][] = [[s.yb, 0], [s.yb, s.hw - 0.08], [s.yb + 0.08, s.hw], [s.belt, s.hw]];
    for (let i = 1; i <= 3; i++) hh.push([s.belt + ((s.top - s.r - s.belt) * i) / 3, s.hw + ((s.hwt - s.hw) * i) / 3]);
    for (let j = 1; j <= 8; j++) { const a = ((j / 8) * Math.PI) / 2; hh.push([s.top - s.r + s.r * Math.sin(a), s.hwt - s.r + s.r * Math.cos(a)]); }
    hh.push([s.top, 0]);
    const F = hh.map(p => V(x, p[0], p[1]));
    for (let k = 14; k >= 1; k--) F.push(V(x, hh[k][0], -hh[k][1]));
    return F;
  }
  const xs = [0, 0.01, 0.03];
  for (let x = 0.06; x < LEN - 0.132; x += 0.05) xs.push(x);
  for (let x = LEN - 0.132; x < LEN; x += 0.02) xs.push(x);
  xs.push(LEN);
  const rings = xs.map(ring), N = 30;
  const pos: number[] = [], idx: number[] = [];
  rings.forEach(r => r.forEach(p => pos.push(p.x, p.y, p.z)));
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < N; k++) {
    const a = i * N + k, b = i * N + ((k + 1) % N), c = (i + 1) * N + k, d = (i + 1) * N + ((k + 1) % N);
    idx.push(a, c, b, b, c, d);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  lg.setIndex(idx);
  fill(lg, P.fill, 0.07);
  const B = LEN - 1.982; // B-pillar
  [0, B, LEN - 1.582, LEN - 0.832, LEN].forEach(x => pl(ring(x), P.line, 0.9, body, true));
  [2, 3, 6, 10, 14, 16, 20, 24, 27, 28].forEach(k => {
    const soft = k === 10 || k === 20;
    pl(rings.map(r => r[k]), soft ? P.soft : P.line, soft ? 0.5 : 0.75);
  });

  function zAt(x: number, y: number, sd: number) {
    const s = sec(x);
    let z: number;
    if (y <= s.belt) z = s.hw;
    else if (y <= s.top - s.r) z = s.hw + ((s.hwt - s.hw) * (y - s.belt)) / (s.top - s.r - s.belt);
    else { const dy = y - (s.top - s.r); z = s.hwt - s.r + Math.sqrt(Math.max(0, s.r * s.r - dy * dy)); }
    return sd * (z + 0.008);
  }
  function side(p2: [number, number][], sd: number, c = P.line, o = 0.85, closed = true) {
    const q = p2.slice();
    if (closed) q.push(q[0]);
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < q.length - 1; i++) for (let t = 0; t < 12; t++) {
      const x = q[i][0] + ((q[i + 1][0] - q[i][0]) * t) / 12, y = q[i][1] + ((q[i + 1][1] - q[i][1]) * t) / 12;
      out.push(V(x, y, zAt(x, y, sd)));
    }
    const l = q[q.length - 1];
    out.push(V(l[0], l[1], zAt(l[0], l[1], sd)));
    pl(out, c, o);
  }
  function wheelArchCut(cx: number, sd: number) {
    const ra = TR + 0.075, a0 = Math.asin(Math.max(-1, Math.min(1, (0.4 - TR) / ra))), p: [number, number][] = [];
    for (let i = 0; i <= 30; i++) { const a = a0 + ((Math.PI - 2 * a0) * i) / 30; p.push([cx + ra * Math.cos(a), TR + ra * Math.sin(a)]); }
    side(p, sd, P.line, 0.85, false);
  }
  const winTop = Math.min(2.12, cabTop - 0.18);
  [1, -1].forEach(sd => {
    wheelArchCut(RA, sd);
    wheelArchCut(FA, sd);
    side([[B, 0.45], [B, Math.min(2.2, cabTop - 0.1)], [LEN - 1.552, Math.min(2.2, cabTop - 0.1)], [LEN - 0.952, 1.38], [LEN - 0.952, 0.84], [LEN - 1.412, 0.84], [LEN - 1.462, 0.45]], sd);
    side([[B + 0.05, 1.35], [B + 0.05, winTop], [LEN - 1.572, winTop], [LEN - 1.052, 1.42]], sd, P.soft, 0.8);
    side([[LEN - 0.512, 1.32], [LEN - 0.072, 1.16], [LEN - 0.052, 1.02], [LEN - 0.452, 1.12]], sd, P.soft, 0.8);
    const m = new THREE.BoxGeometry(0.12, 0.3, 0.2);
    m.translate(LEN - 1.432, Math.min(1.8, cabTop - 0.4), sd * (HWX + 0.12));
    edges(m, P.line, 30, body, 0.8);
  });
  // sliding side door — right (+z)
  const sdw = L.sideDoor.width, sdh = L.sideDoor.height;
  side([[B - 0.01 - sdw, 0.45], [B - 0.01 - sdw, fy + sdh], [B - 0.01, fy + sdh], [B - 0.01, 0.45]], 1);
  // front grille & bumper
  const fx = LEN + 0.005;
  pl([V(fx, 0.66, -0.55), V(fx, 0.66, 0.55), V(fx, 1.0, 0.55), V(fx, 1.0, -0.55)], P.line, 0.85, body, true);
  for (let i = 1; i < 4; i++) pl([V(fx, 0.66 + i * 0.085, -0.55), V(fx, 0.66 + i * 0.085, 0.55)], P.soft, 0.5);
  const bb = new THREE.BoxGeometry(0.14, 0.24, HWX * 2 - 0.06);
  bb.translate(LEN - 0.04, 0.5, 0);
  edges(bb, P.line, 30, body, 0.8);
  // rear door opening (clear width/height from the vehicle data) and rear bumper
  const rdw = L.rearDoor.width / 2, rdh = L.rearDoor.height, rx = -0.008;
  pl([V(rx, fy, -rdw), V(rx, fy, rdw), V(rx, fy + rdh, rdw), V(rx, fy + rdh, -rdw)], P.accent, 0.7, body, true);
  const rb = new THREE.BoxGeometry(0.16, 0.2, HWX * 2 - 0.04);
  rb.translate(0.04, 0.48, 0);
  edges(rb, P.line, 30, body, 0.8);
  // wheels
  function wheel(x: number, z: number) {
    const t = new THREE.CylinderGeometry(TR, TR, 0.235, 40);
    t.rotateX(Math.PI / 2); t.translate(x, TR, z);
    edges(t, P.line, 20); fill(t, P.fill, 0.1);
    const r = new THREE.CylinderGeometry(TR * 0.56, TR * 0.56, 0.24, 30);
    r.rotateX(Math.PI / 2); r.translate(x, TR, z);
    edges(r, P.soft, 20, body, 0.8);
  }
  const tz = L.track / 2;
  [RA, FA].forEach(x => { wheel(x, tz); wheel(x, -tz); });

  // ── cargo space as the algorithm models it: a box L × W × H (dashed) ──
  const ceil = fy + L.cargoH;
  const corners = (x: number) => [V(x, fy, -hwI), V(x, fy, hwI), V(x, ceil, hwI), V(x, ceil, -hwI)];
  const c0 = corners(X0), c1 = corners(X1);
  pl(c0, P.soft, 1, cargo, true, true);
  pl(c1, P.soft, 1, cargo, true, true);
  for (let k = 0; k < 4; k++) pl([c0[k], c1[k]], P.soft, 1, cargo, false, true);
  const fl = new THREE.PlaneGeometry(X1 - X0, 2 * hwI, Math.max(1, Math.round((X1 - X0) * 5)), 8);
  fl.rotateX(-Math.PI / 2); fl.translate((X0 + X1) / 2, fy + 0.001, 0);
  cargo.add(new THREE.LineSegments(new THREE.WireframeGeometry(fl), lm(P.soft, 0.18)));

  // ── wheel arches: rounded shape (author's model) inside the box the algorithm uses ──
  for (const a of L.arches) {
    const ah = a.h, ar = Math.min(0.12, ah * 0.4);
    const shape = new THREE.Shape();
    shape.moveTo(a.x0, 0); shape.lineTo(a.x0, ah - ar); shape.quadraticCurveTo(a.x0, ah, a.x0 + ar, ah);
    shape.lineTo(a.x1 - ar, ah); shape.quadraticCurveTo(a.x1, ah, a.x1, ah - ar); shape.lineTo(a.x1, 0); shape.lineTo(a.x0, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: a.z1 - a.z0, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, fy, a.z0);
    fill(g, P.arch, 0.28, cargo);
    edges(g, P.arch, 25, cargo);
  }

  // ── dimensions ──
  function label(txt: string, p: THREE.Vector3, color = P.text, sc = 1) {
    if (typeof document === 'undefined') return;
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    const g = cv.getContext('2d'); if (!g) return;
    g.font = '600 34px Inter, system-ui, sans-serif';
    const w = g.measureText(txt).width + 32;
    g.fillStyle = P.labelBg;
    g.beginPath(); g.roundRect(256 - w / 2, 20, w, 56, 14); g.fill();
    g.fillStyle = color; g.textAlign = 'center'; g.fillText(txt, 256, 60);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.6 * sc, 0.3 * sc, 1); sp.position.copy(p); sp.renderOrder = 10;
    dims.add(sp);
  }
  const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
  function dim(a: THREE.Vector3, b: THREE.Vector3, txt: string, lp: THREE.Vector3, c = P.soft) {
    pl([a, b], c, 1, dims, false, true);
    label(txt, lp, c === P.soft ? P.text : hex(c));
  }
  const exteriorLength = Math.round(LEN * 1000), exteriorHeight = Math.round(H * 1000);
  dim(V(0, 0.01, -HWX - 0.55), V(LEN, 0.01, -HWX - 0.55), `${exteriorLength} mm`, V(LEN / 2, 0.2, -HWX - 0.55));
  dim(V(RA, 0.01, HWX + 0.45), V(FA, 0.01, HWX + 0.45), `${labels.wheelbase} ${Math.round((FA - RA) * 1000)}`, V((RA + FA) / 2, 0.2, HWX + 0.45));
  dim(V(-0.45, 0, -HWX), V(-0.45, H, -HWX), `${exteriorHeight} mm`, V(-0.45, H + 0.2, -HWX));
  dim(V(X0, fy + 0.01, 0), V(X1, fy + 0.01, 0), `${v.length} mm`, V((X0 + X1) / 2, fy + 0.2, 0));
  dim(V(-0.02, fy + 0.05, -hwI), V(-0.02, fy + 0.05, hwI), `${v.width} mm`, V(-0.05, fy + 0.22, 0));
  dim(V(X1 - 0.05, fy, -0.2), V(X1 - 0.05, ceil, -0.2), `${v.height} mm`, V(X1 - 0.05, ceil + 0.18, -0.2));
  const arch = v.wheelArches?.[0];
  if (arch) {
    const ax = X1 - (arch.startX + arch.endX) / 2000, ah = arch.heightFromFloor / 1000;
    const between = v.width - 2 * arch.intrusionPerSide, inner = between / 2000;
    dim(V(ax, fy + ah + 0.17, -inner), V(ax, fy + ah + 0.17, inner), `${between} ${labels.between}`, V(ax, fy + ah + 0.35, 0), P.arch);
    label(`${labels.arch} h ${arch.heightFromFloor}`, V(ax, fy + 0.15, -HWX - 0.35), hex(P.arch), 0.8);
  }

  group.position.x = -LEN / 2; // centre the van on the grid
  return { group, body, cargo, dims };
}

// ── cargo ────────────────────────────────────────────────────────────────────

const INSET = 0.004; // touching boxes would z-fight

function shade(hex: string, k: number): THREE.Color {
  const c = new THREE.Color(hex);
  return k >= 0 ? c.lerp(new THREE.Color(0xffffff), k) : c.multiplyScalar(1 + k);
}

/** One placed unit: a carton (with tape on the lid) or a load on a wooden pallet. */
function buildUnit(L: VanLayout, u: PlacedUnit, P: Palette, highlight: boolean): THREE.Group {
  const g = new THREE.Group();
  const { center, size } = unitBox(L, u);
  g.position.set(center.x, center.y, center.z);
  const sx = size.x - INSET, sy = size.y - INSET, sz = size.z - INSET;
  const accent = new THREE.Color(P.accent);
  const mat = (color: THREE.Color | number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o, ...(highlight ? { emissive: accent, emissiveIntensity: 0.25 } : {}) });
  const outline = (geo: THREE.BufferGeometry, color: THREE.Color | number, opacity = 1) =>
    new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));

  let loadBottom = -sy / 2;
  if (u.kind === 'pallet' && sy > 0.2) {
    // EUR-style pallet base, 144 mm: bottom boards · blocks · top deck (boards along the long side)
    const base = 0.144;
    const alongX = sx >= sz;
    const long = alongX ? sx : sz, short = alongX ? sz : sx;
    const wood = mat(P.wood, { roughness: 0.95 });
    const board = (len: number, wid: number, h: number, offShort: number, y: number) => {
      const geo = alongX ? new THREE.BoxGeometry(len, h, wid) : new THREE.BoxGeometry(wid, h, len);
      const m = new THREE.Mesh(geo, wood);
      m.position.set(alongX ? 0 : offShort, y, alongX ? offShort : 0);
      m.add(outline(geo, P.woodEdge, 0.8));
      g.add(m);
    };
    const yb = -sy / 2;
    for (const o of [-1, 0, 1]) board(long, short * 0.12, 0.022, o * short * 0.42, yb + 0.011);              // bottom boards
    for (const o of [-1, 0, 1]) for (const p of [-1, 0, 1]) {                                                // 9 blocks
      const geo = new THREE.BoxGeometry(alongX ? long * 0.12 : short * 0.14, 0.1, alongX ? short * 0.14 : long * 0.12);
      const m = new THREE.Mesh(geo, wood);
      const a = p * long * 0.44, b = o * short * 0.42;
      m.position.set(alongX ? a : b, yb + 0.022 + 0.05, alongX ? b : a);
      m.add(outline(geo, P.woodEdge, 0.8));
      g.add(m);
    }
    for (let i = 0; i < 5; i++) board(long, short * 0.14, 0.022, (i - 2) * short * 0.215, yb + base - 0.011); // top deck
    loadBottom = yb + base;
  }

  // the cargo body (whole unit, or the load above the pallet)
  const h = sy / 2 - loadBottom;
  const geo = new THREE.BoxGeometry(sx * (u.kind === 'pallet' ? 0.98 : 1), h, sz * (u.kind === 'pallet' ? 0.98 : 1));
  // the current step is drawn in the accent colour (same as in the 2D projections)
  const bodyColor = highlight ? accent.clone() : new THREE.Color(u.color);
  const mesh = new THREE.Mesh(geo, mat(bodyColor, u.kind === 'pallet' ? { roughness: 0.35 } : {}));
  mesh.position.y = loadBottom + h / 2;
  mesh.add(outline(geo, highlight ? accent : u.kind === 'pallet' ? shade(u.color, 0.55) : shade(u.color, -0.35)));
  g.add(mesh);

  // packing tape across the lid of a carton
  if (u.kind !== 'pallet' && sx > 0.15 && sz > 0.15) {
    const alongX = sx >= sz;
    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(alongX ? sx * 1.001 : Math.min(0.06, sx * 0.18), 0.003, alongX ? Math.min(0.06, sz * 0.18) : sz * 1.001),
      mat(shade(u.color, 0.35), { roughness: 0.4 }),
    );
    tape.position.y = sy / 2 + 0.0015;
    g.add(tape);
  }

  // "do not stack": red outline around the lid
  if (u.stackable === false) {
    const y = sy / 2 + 0.004, hx = sx / 2 - 0.01, hz = sz / 2 - 0.01;
    const pts = [V(-hx, y, -hz), V(hx, y, -hz), V(hx, y, hz), V(-hx, y, hz), V(-hx, y, -hz)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: P.noStack })));
  }

  // a soft halo around the current step
  if (highlight) {
    const halo = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.04, sy + 0.04, sz + 0.04),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }));
    g.add(halo);
  }
  return g;
}

function disposeTree(o: THREE.Object3D) {
  o.traverse(n => {
    const m = n as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach(x => { (x as THREE.SpriteMaterial).map?.dispose(); x.dispose(); });
  });
}

// ── viewer ───────────────────────────────────────────────────────────────────

export interface VanViewer {
  setScene(vehicle: Vehicle, theme: ThemeName, labels: DimLabels): void;
  setCargo(units: PlacedUnit[], highlightIndex: number | null): void;
  setView(view: ViewName): void;
  setBodyVisible(visible: boolean): void;
  setDimsVisible(visible: boolean): void;
  resetView(): void;
  dispose(): void;
}

/** Throws if WebGL is not available — callers show a 2D fallback then. */
export function createVanViewer(container: HTMLElement): VanViewer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7280, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-3, 10, 5);
  scene.add(sun);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
  fillLight.position.set(6, 3, -4);
  scene.add(fillLight);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 3;
  controls.maxDistance = 30;

  let vehicle: Vehicle | null = null;
  let layout: VanLayout | null = null;
  let palette = PALETTES.light;
  let parts: ReturnType<typeof buildBody> | null = null;
  let grid: THREE.GridHelper | null = null;
  const cargo = new THREE.Group();
  scene.add(cargo);
  let units: PlacedUnit[] = [];
  let highlight: number | null = null;
  let view: ViewName = 'persp';
  let bodyVisible = true, dimsVisible = false;
  let anim = null as { to: THREE.Vector3 } | null;
  const target = new THREE.Vector3(0, 1.1, 0);

  function viewPos(name: ViewName): THREE.Vector3 {
    // distance scaled to the vehicle, so every van fills the view the same way
    const d = 9.2 * Math.max(0.8, (layout?.LEN ?? 6) / 5.9);
    switch (name) {
      case 'side': return V(0, 1.2, d * 1.05);           // from the right (sliding-door) side
      case 'rear': return V(-d * 0.75, 1.6, 0.001);      // from behind the rear doors
      case 'top': return V(0, d * 1.15, 0.001);
      default: return V(-d * 0.6, d * 0.42, d * 0.6);    // rear-right three-quarter view, looking in
    }
  }

  function rebuildCargo() {
    disposeTree(cargo);
    cargo.clear();
    if (!layout || !parts) return;
    units.forEach((u, i) => cargo.add(buildUnit(layout!, u, palette, i === highlight)));
    cargo.position.copy(parts.group.position);
  }

  function resize() {
    const w = container.clientWidth || 600, h = container.clientHeight || 400;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let raf = 0;
  (function loop() {
    if (anim) {
      camera.position.lerp(anim.to, 0.12);
      controls.target.lerp(target, 0.12);
      if (camera.position.distanceTo(anim.to) < 0.01) anim = null;
    }
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  })();
  controls.addEventListener('start', () => { anim = null; });

  const api: VanViewer = {
    setScene(v, theme, labels) {
      const first = !vehicle;
      vehicle = v;
      layout = vanLayout(v);
      palette = PALETTES[theme];
      renderer.setClearColor(palette.bg);
      if (parts) { scene.remove(parts.group); disposeTree(parts.group); }
      if (grid) { scene.remove(grid); grid.geometry.dispose(); (grid.material as THREE.Material).dispose(); }
      parts = buildBody(v, layout, palette, labels);
      parts.body.visible = bodyVisible;
      parts.dims.visible = dimsVisible;
      scene.add(parts.group);
      grid = new THREE.GridHelper(30, 60, palette.grid1, palette.grid2);
      scene.add(grid);
      rebuildCargo();
      if (first) { camera.position.copy(viewPos(view)); controls.target.copy(target); }
    },
    setCargo(next, hl) { units = next; highlight = hl; rebuildCargo(); },
    setView(name) { view = name; anim = { to: viewPos(name) }; },
    setBodyVisible(b) { bodyVisible = b; if (parts) parts.body.visible = b; },
    setDimsVisible(b) { dimsVisible = b; if (parts) parts.dims.visible = b; },
    resetView() { anim = { to: viewPos(view) }; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      if (parts) disposeTree(parts.group);
      disposeTree(cargo);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return api;
}
