import { useState } from 'react';
import { RotateCcw, Maximize2, Eye, Box, Plus, Minus } from 'lucide-react';
import type { CargoStore } from '../../hooks/useCargoStore';
import type { PlacedUnit, Vehicle } from '../../types';

// ─── SVG constants ────────────────────────────────────────────────────────────
// 3D side-view canvas
const HOLD_X1 = 165, HOLD_X2 = 455;
const HOLD_Y1 = 70,  HOLD_Y2 = 240;

// 2D top-view canvas  (x = cargo length, y = cargo width)
const TOP_OX = 80, TOP_OY = 15, TOP_W = 330, TOP_H = 140;

// 2D side-view canvas (x = cargo length, z = cargo height)
const SV_OX = 80, SV_OY = 10, SV_W = 330, SV_H = 130;

// 2D rear-view canvas (y = cargo width, z = cargo height)
const RV_OX = 100, RV_OY = 10, RV_W = 260, RV_H = 130;

// ─── 3D Van side SVG — Mercedes Sprinter profile ─────────────────────────────
//
// Sprinter distinctive features:
//  • Very blunt, nearly-vertical front face (no long hood)
//  • Steep windshield (~65° from horizontal)
//  • Cargo body noticeably taller than cab
//  • Visible step at A-pillar (cargo roof slightly higher than cab roof)
//  • Rear wheel arch bump visible on the lower cargo body side
//  • Boxy, utilitarian silhouette
//
function VanSVG({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const holdW = HOLD_X2 - HOLD_X1; // 290px
  const holdH = HOLD_Y2 - HOLD_Y1; // 170px
  const scaleX = holdW / vehicle.length;
  const scaleZ = holdH / vehicle.height;
  const dx = 9, dy = -7;

  // Rear wheel position in SVG x (≈ 75% along cargo length)
  const rearWheelX = HOLD_X1 + vehicle.length * 0.72 * scaleX;

  type BoxRect = { svgX: number; svgY: number; w: number; h: number; color: string; srcY: number };
  const boxes: BoxRect[] = placed
    .map((u) => ({
      svgX: HOLD_X1 + u.x * scaleX,
      svgY: HOLD_Y2 - (u.z + u.height) * scaleZ,
      w: u.length * scaleX,
      h: u.height * scaleZ,
      color: u.color,
      srcY: u.y,
    }))
    .sort((a, b) => b.srcY - a.srcY);

  return (
    <svg viewBox="0 0 520 295" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.08))' }}>
      <defs>
        <clipPath id="cargoClip">
          <rect x={HOLD_X1} y={HOLD_Y1 - 4} width={holdW} height={holdH + 4} />
        </clipPath>
        {/* Clip for rear wheel arch cutout on cargo body */}
        <clipPath id="cargoBodyClip">
          <path d={`
            M ${HOLD_X1},${HOLD_Y1}
            L ${HOLD_X2},${HOLD_Y1}
            L ${HOLD_X2},${HOLD_Y2}
            L ${rearWheelX + 34},${HOLD_Y2}
            A 34 28 0 0 0 ${rearWheelX - 34},${HOLD_Y2}
            L ${HOLD_X1},${HOLD_Y2}
            Z
          `} />
        </clipPath>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e8edf2" />
        </linearGradient>
        <linearGradient id="cabGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#dde3ea" />
          <stop offset="100%" stopColor="#c8d0da" />
        </linearGradient>
        <pattern id="archHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1.5" />
        </pattern>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="255" cy="285" rx="220" ry="5" fill="rgba(0,0,0,0.06)" />

      {/* ── CARGO BODY ── */}
      {/* Main cargo body — clipped to exclude rear wheel arch area */}
      <rect x={HOLD_X1} y={HOLD_Y1} width={holdW} height={holdH}
        fill="url(#bodyGrad)" stroke="#b0bcc8" strokeWidth="1.5" />

      {/* Rear wheel arch cutout on body exterior */}
      <path d={`M ${rearWheelX - 34},${HOLD_Y2} A 34 28 0 0 1 ${rearWheelX + 34},${HOLD_Y2}`}
        fill="#c8d0da" stroke="#94a3b8" strokeWidth="1.2" />

      {/* Wheel arch floor bumps (interior — cargo hatch area) */}
      {(vehicle.wheelArches ?? []).map((arch, i) => {
        const ax1 = HOLD_X1 + arch.startX * scaleX;
        const ax2 = HOLD_X1 + arch.endX   * scaleX;
        const ah  = arch.heightFromFloor   * scaleZ;
        return (
          <rect key={i}
            x={ax1} y={HOLD_Y2 - ah} width={ax2 - ax1} height={ah}
            fill="url(#archHatch)" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6"
            clipPath="url(#cargoClip)"
          />
        );
      })}

      {/* Cargo boxes */}
      <g clipPath="url(#cargoClip)">
        {boxes.map((b, i) => (
          <g key={i}>
            <polygon
              points={`${b.svgX},${b.svgY} ${b.svgX+b.w},${b.svgY} ${b.svgX+b.w+dx},${b.svgY+dy} ${b.svgX+dx},${b.svgY+dy}`}
              fill={b.color} fillOpacity="0.38" stroke={b.color} strokeOpacity="0.55" strokeWidth="0.5"
            />
            <polygon
              points={`${b.svgX+b.w},${b.svgY} ${b.svgX+b.w+dx},${b.svgY+dy} ${b.svgX+b.w+dx},${b.svgY+dy+b.h} ${b.svgX+b.w},${b.svgY+b.h}`}
              fill={b.color} fillOpacity="0.28" stroke={b.color} strokeOpacity="0.55" strokeWidth="0.5"
            />
            <rect x={b.svgX} y={b.svgY} width={b.w} height={b.h}
              fill={b.color} fillOpacity="0.70" stroke={b.color} strokeOpacity="0.85" strokeWidth="0.8"
            />
          </g>
        ))}
      </g>

      {/* Cargo body edges */}
      <line x1={HOLD_X2} y1={HOLD_Y1} x2={HOLD_X2} y2={HOLD_Y2} stroke="#8896a5" strokeWidth="1.5" />
      <line x1={HOLD_X1} y1={HOLD_Y1} x2={HOLD_X2} y2={HOLD_Y1} stroke="#8896a5" strokeWidth="1" />
      {/* Rear door split line */}
      <line x1={HOLD_X2 - 1} y1={HOLD_Y1 + 12} x2={HOLD_X2 - 1} y2={HOLD_Y2 - 6}
        stroke="#8896a5" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rear door horizontal midline */}
      <line x1={HOLD_X2 - 12} y1={(HOLD_Y1 + HOLD_Y2) / 2}
            x2={HOLD_X2 - 1}  y2={(HOLD_Y1 + HOLD_Y2) / 2}
        stroke="#b0bcc8" strokeWidth="0.8" />

      {/* Cargo body right side stripe / highlight */}
      <line x1={HOLD_X1} y1={HOLD_Y1 + 22} x2={HOLD_X2 - 1} y2={HOLD_Y1 + 22}
        stroke="#c8d2dc" strokeWidth="1" />

      {/* ── CAB — Mercedes Sprinter profile ── */}
      {/*
        Sprinter cab: nearly vertical front face, minimal hood,
        steep windshield, cab roof slightly lower than cargo roof.
        Front face: x≈30, almost vertical
        Hood/nose: very short slope before windshield
        Windshield: steep, ~65° from horizontal
        Cab roof: y≈82, connects to cargo roof at y=70 via small A-pillar step
      */}

      {/* Cab body */}
      <path d={`
        M 28,${HOLD_Y2}
        L 28,200
        Q 30,175 34,155
        Q 38,132 50,114
        Q 62,96  80,86
        L 152,74
        L 163,70
        L ${HOLD_X1},70
        L ${HOLD_X1},${HOLD_Y2}
        Z
      `} fill="url(#cabGrad)" stroke="#8896a5" strokeWidth="1.5" />

      {/* Windshield glass (main area) */}
      <path d={`
        M 82,88
        Q 96,82 152,75
        L 160,74
        L 160,96
        Q 128,102 95,116
        Q 76,124 68,130
        Z
      `} fill="#bfdbfe" fillOpacity="0.55" stroke="#93c5fd" strokeOpacity="0.6" strokeWidth="0.8" />

      {/* A-pillar step — small vertical at x=163 connecting cab roof (y=74) to cargo roof (y=70) */}
      <line x1="163" y1="70" x2="163" y2="74" stroke="#8896a5" strokeWidth="1.5" />

      {/* Cab side window (small vent triangle near A-pillar) */}
      <path d="M 66,132 L 86,120 L 86,148 L 68,155 Z"
        fill="#bfdbfe" fillOpacity="0.35" stroke="#94a3b8" strokeWidth="0.6" />

      {/* Cab door window */}
      <path d="M 36,155 L 40,130 L 62,120 L 64,155 Z"
        fill="#bfdbfe" fillOpacity="0.3" stroke="#94a3b8" strokeWidth="0.6" />

      {/* Cab door line */}
      <line x1="62" y1="116" x2="62" y2={HOLD_Y2}
        stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />

      {/* Headlight — rectangular, characteristic Sprinter shape */}
      <rect x="30" y="148" width="18" height="10" rx="2"
        fill="#fef9c3" stroke="#d4a017" strokeWidth="0.8" fillOpacity="0.85" />
      {/* DRL strip above headlight */}
      <rect x="30" y="144" width="18" height="3" rx="1"
        fill="#fef9c3" fillOpacity="0.6" />

      {/* Front grille — characteristic Sprinter vertical slats */}
      <rect x="29" y="160" width="16" height="22" rx="1"
        fill="#94a3b8" fillOpacity="0.4" stroke="#64748b" strokeWidth="0.7" />
      {[163, 167, 171, 175].map(y => (
        <line key={y} x1="29" y1={y} x2="45" y2={y}
          stroke="#64748b" strokeWidth="0.5" />
      ))}

      {/* Front bumper */}
      <path d="M 26,195 Q 24,215 25,230 L 28,230 L 28,195 Z"
        fill="#b0bcc8" stroke="#8896a5" strokeWidth="0.8" />
      <rect x="24" y="200" width="6" height="30" rx="2"
        fill="#94a3b8" stroke="#64748b" strokeWidth="0.7" />

      {/* Mirror */}
      <rect x="25" y="130" width="10" height="16" rx="2"
        fill="#dde3ea" stroke="#94a3b8" strokeWidth="0.8" />

      {/* Front wheel arch on cab */}
      <path d={`M 55,${HOLD_Y2} A 38 32 0 0 1 130,${HOLD_Y2}`}
        fill="#b8c4d0" stroke="#8896a5" strokeWidth="1.2" />

      {/* ── WHEELS ── */}
      {/* Front wheel: under cab */}
      {[{ cx: 92, r: 26 }, { cx: rearWheelX, r: 28 }].map(({ cx, r }, wi) => (
        <g key={wi}>
          {/* Tyre */}
          <circle cx={cx} cy={HOLD_Y2 + r - 4} r={r}
            fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Rim */}
          <circle cx={cx} cy={HOLD_Y2 + r - 4} r={r * 0.56}
            fill="#2d3a4a" stroke="#475569" strokeWidth="1.2" />
          {/* Hub cap */}
          <circle cx={cx} cy={HOLD_Y2 + r - 4} r={r * 0.18}
            fill="#64748b" />
          {/* Spokes */}
          {[0, 51, 102, 153, 204, 255, 306].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cy2 = HOLD_Y2 + r - 4;
            return (
              <line key={deg}
                x1={cx + r * 0.2 * Math.cos(rad)} y1={cy2 + r * 0.2 * Math.sin(rad)}
                x2={cx + r * 0.52 * Math.cos(rad)} y2={cy2 + r * 0.52 * Math.sin(rad)}
                stroke="#475569" strokeWidth="1.4"
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// ─── 2D Top view ─────────────────────────────────────────────────────────────
// Axes: SVG-X = cargo X (front→rear), SVG-Y = cargo Y (left wall→right wall)
// Arch shape from above: a rounded band along each side wall in the arch X zone.
// The inner edge is curved (convex inward) — not a sharp rectangle.
function TopViewSVG({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const scaleX = TOP_W / vehicle.length;
  const scaleY = TOP_H / vehicle.width;
  const arches = vehicle.wheelArches ?? [];

  return (
    <svg viewBox="0 0 460 170" className="w-full h-full max-h-36">
      <defs>
        <clipPath id="topCargoClip">
          <rect x={TOP_OX} y={TOP_OY} width={TOP_W} height={TOP_H} />
        </clipPath>
        <pattern id="topArchHatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth="1.2" />
        </pattern>
      </defs>

      {/* Van outline */}
      <rect x="10" y={TOP_OY} width={TOP_OX - 10 + TOP_W} height={TOP_H} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      {/* Cab zone */}
      <rect x="10" y={TOP_OY} width={TOP_OX - 10} height={TOP_H} rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      <text x="45" y="88" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform="rotate(-90,45,88)">КАБИНА</text>

      {/* Cargo boxes */}
      <g clipPath="url(#topCargoClip)">
        {placed.map((u, i) => {
          const x = TOP_OX + u.x * scaleX;
          const y = TOP_OY + u.y * scaleY;
          const w = u.length * scaleX;
          const h = u.width * scaleY;
          return (
            <rect key={i} x={x + 0.5} y={y + 0.5}
              width={Math.max(1, w - 1)} height={Math.max(1, h - 1)}
              fill={u.color} fillOpacity={u.z === 0 ? 0.65 : 0.35}
              stroke={u.color} strokeOpacity="0.9" strokeWidth="0.8"
            />
          );
        })}
      </g>

      {/* Wheel arches — drawn over cargo, curved inner edge */}
      <g clipPath="url(#topCargoClip)">
        {arches.map((arch, i) => {
          const ax  = TOP_OX + arch.startX * scaleX;
          const ax2 = TOP_OX + arch.endX   * scaleX;
          const aw  = ax2 - ax;
          // intrusion in SVG px
          const intr = arch.intrusionPerSide * scaleY;
          // Bottom of van = TOP_OY + TOP_H
          const yBot = TOP_OY + TOP_H;
          const yTop = TOP_OY;

          // Left arch: attached to top wall (y=TOP_OY), curved inner edge
          // Shape: flat along top wall, curved inward on inner side
          // Path: wall-left → wall-right → curve down-right → curve down-left → back
          const leftPath = [
            `M ${ax},${yTop}`,
            `L ${ax2},${yTop}`,
            `L ${ax2},${yTop + intr * 0.3}`,
            // cubic bezier: arch curves outward then back
            `C ${ax2},${yTop + intr} ${ax},${yTop + intr} ${ax},${yTop + intr * 0.3}`,
            'Z',
          ].join(' ');

          // Right arch: attached to bottom wall (y=yBot), mirrored
          const rightPath = [
            `M ${ax},${yBot}`,
            `L ${ax2},${yBot}`,
            `L ${ax2},${yBot - intr * 0.3}`,
            `C ${ax2},${yBot - intr} ${ax},${yBot - intr} ${ax},${yBot - intr * 0.3}`,
            'Z',
          ].join(' ');

          const midX  = (ax + ax2) / 2;
          const midY  = TOP_OY + TOP_H / 2;

          return (
            <g key={i}>
              <path d={leftPath}  fill="#94a3b8" fillOpacity="0.25" stroke="#64748b" strokeWidth="0.8" />
              <path d={leftPath}  fill="url(#topArchHatch)" fillOpacity="0.6" />
              <path d={rightPath} fill="#94a3b8" fillOpacity="0.25" stroke="#64748b" strokeWidth="0.8" />
              <path d={rightPath} fill="url(#topArchHatch)" fillOpacity="0.6" />

              {/* usable width label */}
              {aw > 35 && (
                <text x={midX} y={midY}
                  textAnchor="middle" fontSize="6.5" fill="#64748b" fontFamily="ui-monospace,monospace">
                  {(vehicle.width - arch.intrusionPerSide * 2).toLocaleString()} мм
                </text>
              )}
            </g>
          );
        })}
      </g>

      <text x={TOP_OX + TOP_W / 2} y="164" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace">
        ← {vehicle.length.toLocaleString()} мм →
      </text>
      <text x="452" y="88" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform="rotate(90,452,88)">
        {vehicle.width.toLocaleString()} мм
      </text>
    </svg>
  );
}

// ─── 2D Side view ─────────────────────────────────────────────────────────────
// Axes: SVG-X = cargo X, SVG-Y = cargo Z (inverted, floor at bottom)
// Arch from the side: a smooth rounded hump on the floor.
// Shape: rises from flat floor, peaks at heightFromFloor in the arch X centre, drops back.
function SideViewSVG({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const scaleX = SV_W / vehicle.length;
  const scaleZ = SV_H / vehicle.height;
  const arches = vehicle.wheelArches ?? [];
  const floorY = SV_OY + SV_H;

  return (
    <svg viewBox="0 0 460 155" className="w-full h-full max-h-36">
      <defs>
        <clipPath id="svCargoClip">
          <rect x={SV_OX} y={SV_OY} width={SV_W} height={SV_H} />
        </clipPath>
      </defs>

      <rect x={SV_OX} y={SV_OY} width={SV_W} height={SV_H} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" rx="2" />

      {/* Arch: smooth parabolic hump rising from floor */}
      <g clipPath="url(#svCargoClip)">
        {arches.map((arch, i) => {
          const ax  = SV_OX + arch.startX * scaleX;
          const ax2 = SV_OX + arch.endX   * scaleX;
          const aw  = ax2 - ax;
          const ah  = arch.heightFromFloor * scaleZ;
          const midX = ax + aw / 2;
          const peakY = floorY - ah;

          // Smooth arch: cubic bezier hump
          // rises gently from ax,floorY → peaks at midX,peakY → drops to ax2,floorY
          const archPath = [
            `M ${ax},${floorY}`,
            `C ${ax + aw * 0.25},${floorY} ${midX - aw * 0.1},${peakY} ${midX},${peakY}`,
            `C ${midX + aw * 0.1},${peakY} ${ax2 - aw * 0.25},${floorY} ${ax2},${floorY}`,
            'Z',
          ].join(' ');

          return (
            <g key={i}>
              <path d={archPath} fill="#cbd5e1" fillOpacity="0.7" stroke="#94a3b8" strokeWidth="0.9" />
              <text x={midX} y={peakY - 3}
                textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="ui-monospace,monospace">
                ~{arch.heightFromFloor} мм
              </text>
            </g>
          );
        })}
      </g>

      {/* Cargo boxes (side profile: X and Z) */}
      <g clipPath="url(#svCargoClip)">
        {placed.map((u, i) => {
          const x = SV_OX + u.x * scaleX;
          const y = SV_OY + SV_H - (u.z + u.height) * scaleZ;
          const w = u.length * scaleX;
          const h = u.height * scaleZ;
          return (
            <rect key={i} x={x + 0.5} y={y + 0.5}
              width={Math.max(1, w - 1)} height={Math.max(1, h - 1)}
              fill={u.color} fillOpacity="0.55"
              stroke={u.color} strokeOpacity="0.85" strokeWidth="0.8"
            />
          );
        })}
      </g>

      <text x={SV_OX + SV_W / 2} y="148" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace">
        ← {vehicle.length.toLocaleString()} мм →
      </text>
      <text x="76" y={SV_OY + SV_H / 2} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform={`rotate(-90,76,${SV_OY + SV_H / 2})`}>
        {vehicle.height.toLocaleString()} мм
      </text>
    </svg>
  );
}

// ─── 2D Rear view ─────────────────────────────────────────────────────────────
// Axes: SVG-X = cargo Y (left→right), SVG-Y = cargo Z (floor at bottom)
// Arch cross-section: quarter-ellipse attached to side wall + floor.
// Left arch: vertical wall on the left, curves inward-downward to floor level.
// Right arch: mirrored.
function RearViewSVG({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const scaleY = RV_W / vehicle.width;
  const scaleZ = RV_H / vehicle.height;
  const arches = vehicle.wheelArches ?? [];
  const floorY = RV_OY + RV_H;

  return (
    <svg viewBox="0 0 460 155" className="w-full h-full max-h-36">
      <defs>
        <clipPath id="rvCargoClip">
          <rect x={RV_OX} y={RV_OY} width={RV_W} height={RV_H} />
        </clipPath>
      </defs>

      <rect x={RV_OX} y={RV_OY} width={RV_W} height={RV_H} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" rx="2" />

      {/* Arch cross-sections — quarter-ellipse shapes */}
      <g clipPath="url(#rvCargoClip)">
        {arches.map((arch, i) => {
          const archW  = arch.intrusionPerSide * scaleY; // SVG width of arch
          const archH  = arch.heightFromFloor  * scaleZ; // SVG height of arch
          const leftX  = RV_OX;                          // left wall
          const rightX = RV_OX + RV_W;                  // right wall
          const peakY  = floorY - archH;                 // top of arch
          const midX   = RV_OX + (vehicle.width / 2) * scaleY;

          // Left arch: quarter-ellipse
          // Goes: up the left wall to peakY, then curves to floor at leftX + archW
          // Using cubic bezier to approximate quarter-ellipse (kappa ≈ 0.552)
          const k = 0.552;
          const leftArchPath = [
            `M ${leftX},${floorY}`,                                       // floor, left wall
            `L ${leftX},${peakY}`,                                        // up left wall
            `C ${leftX + archW * k},${peakY}`,                           // ctrl1
            `  ${leftX + archW},${floorY - archH * (1 - k)}`,            // ctrl2
            `  ${leftX + archW},${floorY}`,                               // inner edge at floor
            'Z',
          ].join(' ');

          // Right arch: mirrored quarter-ellipse
          const rightArchPath = [
            `M ${rightX},${floorY}`,
            `L ${rightX},${peakY}`,
            `C ${rightX - archW * k},${peakY}`,
            `  ${rightX - archW},${floorY - archH * (1 - k)}`,
            `  ${rightX - archW},${floorY}`,
            'Z',
          ].join(' ');

          // Dimension line between arch inner edges
          const dimY = peakY - 5;
          const lInner = leftX  + archW;
          const rInner = rightX - archW;

          return (
            <g key={i}>
              <path d={leftArchPath}  fill="#cbd5e1" fillOpacity="0.85" stroke="#94a3b8" strokeWidth="1" />
              <path d={rightArchPath} fill="#cbd5e1" fillOpacity="0.85" stroke="#94a3b8" strokeWidth="1" />

              {/* Dimension: width between arch inner edges */}
              <line x1={lInner} y1={dimY} x2={rInner} y2={dimY} stroke="#64748b" strokeWidth="0.8" />
              <line x1={lInner} y1={dimY - 3} x2={lInner} y2={dimY + 3} stroke="#64748b" strokeWidth="0.8" />
              <line x1={rInner} y1={dimY - 3} x2={rInner} y2={dimY + 3} stroke="#64748b" strokeWidth="0.8" />
              <text x={midX} y={dimY - 3}
                textAnchor="middle" fontSize="7" fill="#475569" fontFamily="ui-monospace,monospace" fontWeight="500">
                {(vehicle.width - arch.intrusionPerSide * 2).toLocaleString()} мм
              </text>

              {/* Arch height label */}
              <line x1={leftX - 4} y1={peakY} x2={leftX - 4} y2={floorY} stroke="#94a3b8" strokeWidth="0.7" />
              <text x={leftX - 6} y={(peakY + floorY) / 2}
                textAnchor="middle" fontSize="6" fill="#94a3b8" fontFamily="ui-monospace,monospace"
                transform={`rotate(-90,${leftX - 6},${(peakY + floorY) / 2})`}>
                ~{arch.heightFromFloor} мм
              </text>
            </g>
          );
        })}
      </g>

      {/* Cargo boxes (rear cross-section: Y and Z) */}
      <g clipPath="url(#rvCargoClip)">
        {placed.map((u, i) => {
          const x = RV_OX + u.y * scaleY;
          const y = RV_OY + RV_H - (u.z + u.height) * scaleZ;
          const w = u.width * scaleY;
          const h = u.height * scaleZ;
          return (
            <rect key={i} x={x + 0.5} y={y + 0.5}
              width={Math.max(1, w - 1)} height={Math.max(1, h - 1)}
              fill={u.color} fillOpacity="0.55"
              stroke={u.color} strokeOpacity="0.85" strokeWidth="0.8"
            />
          );
        })}
      </g>

      <text x={RV_OX + RV_W / 2} y="148" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace">
        ← {vehicle.width.toLocaleString()} мм →
      </text>
      <text x="88" y={RV_OY + RV_H / 2} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform={`rotate(-90,88,${RV_OY + RV_H / 2})`}>
        {vehicle.height.toLocaleString()} мм
      </text>
    </svg>
  );
}

// ─── Photo-based cargo view ───────────────────────────────────────────────────
// Single SVG: photo rendered as <image>, cargo boxes overlaid on top.
// Calibration constants map cargo mm coords → pixel coords in the source image.
function PhotoCargoView({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const cv = vehicle.cargoView!;
  const holdW = cv.cargoRight - cv.cargoLeft;
  const holdH = cv.cargoFloor - cv.cargoTop;
  const scaleX = holdW / vehicle.length;
  const scaleZ = holdH / vehicle.height;
  // Isometric depth hint (px in image coordinate space)
  const dx = 13, dy = -10;

  type BoxData = { svgX: number; svgY: number; w: number; h: number; color: string; srcY: number };
  const boxes: BoxData[] = placed
    .map((u) => ({
      svgX: cv.cargoLeft + u.x * scaleX,
      svgY: cv.cargoFloor - (u.z + u.height) * scaleZ,
      w:    u.length * scaleX,
      h:    u.height * scaleZ,
      color: u.color,
      srcY:  u.y,
    }))
    .sort((a, b) => b.srcY - a.srcY);

  const cropY = cv.cropY ?? 0;
  const cropH = cv.cropH ?? cv.imgH;

  return (
    <svg
      viewBox={`0 ${cropY} ${cv.imgW} ${cropH}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Photo background */}
      <image href={cv.src} x="0" y="0" width={cv.imgW} height={cv.imgH} />

      <defs>
        <clipPath id="photoCargoClip">
          <rect x={cv.cargoLeft} y={cv.cargoTop} width={holdW} height={holdH + 4} />
        </clipPath>
      </defs>

      {/* Cargo boxes clipped to hold area */}
      <g clipPath="url(#photoCargoClip)">
        {boxes.map((b, i) => (
          <g key={i}>
            {/* Top face */}
            <polygon
              points={`${b.svgX},${b.svgY} ${b.svgX+b.w},${b.svgY} ${b.svgX+b.w+dx},${b.svgY+dy} ${b.svgX+dx},${b.svgY+dy}`}
              fill={b.color} fillOpacity="0.55" stroke={b.color} strokeOpacity="0.8" strokeWidth="1.5"
            />
            {/* Depth face */}
            <polygon
              points={`${b.svgX+b.w},${b.svgY} ${b.svgX+b.w+dx},${b.svgY+dy} ${b.svgX+b.w+dx},${b.svgY+dy+b.h} ${b.svgX+b.w},${b.svgY+b.h}`}
              fill={b.color} fillOpacity="0.35" stroke={b.color} strokeOpacity="0.8" strokeWidth="1.5"
            />
            {/* Front face */}
            <rect x={b.svgX} y={b.svgY} width={b.w} height={b.h}
              fill={b.color} fillOpacity="0.72" stroke={b.color} strokeOpacity="0.9" strokeWidth="2"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Tab2D = 'top' | 'side' | 'rear';

export function ContainerView({ store }: { store: CargoStore }) {
  const { placed, vehicle, cargoItems } = store;
  const [tab2d, setTab2d] = useState<Tab2D>('top');

  const hasArches = (vehicle.wheelArches?.length ?? 0) > 0;

  const projViews: { id: Tab2D; label: string }[] = [
    { id: 'top',  label: 'Вид сверху' },
    { id: 'side', label: 'Вид сбоку'  },
    { id: 'rear', label: 'Вид сзади'  },
  ];

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="h-11 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">3D вид загрузки</span>
        <div className="flex-1" />
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Сбросить вид">
          <RotateCcw size={14} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="3D вид">
          <Box size={14} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Видимость">
          <Eye size={14} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Полный экран">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* 3D / photo view */}
      <div className="flex-1 flex items-center justify-center px-6 pt-4 pb-2 overflow-hidden min-h-0">
        {vehicle.cargoView
          ? <PhotoCargoView placed={placed} vehicle={vehicle} />
          : <VanSVG placed={placed} vehicle={vehicle} />
        }
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pb-2 flex-wrap px-4">
        {cargoItems.map(({ id, color, length, width, height }) => (
          <div key={id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-gray-500 dark:text-slate-400">{length}×{width}×{height} мм</span>
          </div>
        ))}
        {hasArches && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded flex-shrink-0 bg-slate-300 border border-slate-400" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #94a3b8 0, #94a3b8 1px, transparent 0, transparent 50%)',
              backgroundSize: '4px 4px',
            }} />
            <span className="text-[11px] text-gray-400 dark:text-slate-500">Колёсные арки</span>
          </div>
        )}
      </div>

      {/* 2D projections */}
      <div className="border-t border-gray-200 dark:border-slate-700 flex-shrink-0 px-4 pt-3 pb-4">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">2D проекции</div>
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-3">
          {projViews.map(({ id, label }) => (
            <button key={id} onClick={() => setTab2d(id)}
              className={`pb-2 mr-5 text-xs transition-colors border-b-2 -mb-px ${
                tab2d === id
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-1 h-36">
            {tab2d === 'top'  && <TopViewSVG  placed={placed} vehicle={vehicle} />}
            {tab2d === 'side' && <SideViewSVG placed={placed} vehicle={vehicle} />}
            {tab2d === 'rear' && <RearViewSVG placed={placed} vehicle={vehicle} />}
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Plus size={12} />
            </button>
            <button className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Minus size={12} />
            </button>
            <button className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
