import { useState } from 'react';
import { RotateCcw, Maximize2, Eye, Box, Plus, Minus } from 'lucide-react';
import type { CargoStore } from '../../hooks/useCargoStore';
import type { PlacedUnit, Vehicle } from '../../types';

// ─── SVG constants for the cargo hold area ───────────────────────────────────
const HOLD_X1 = 165, HOLD_X2 = 455; // px, horizontal extent
const HOLD_Y1 = 70,  HOLD_Y2 = 240; // px, vertical extent (Y2 = floor)

// ─── Van 3D SVG ───────────────────────────────────────────────────────────────
function VanSVG({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const holdW = HOLD_X2 - HOLD_X1; // 290px
  const holdH = HOLD_Y2 - HOLD_Y1; // 170px
  const scaleX = holdW / vehicle.length;
  const scaleZ = holdH / vehicle.height;
  const dx = 9, dy = -7;

  type BoxRect = { svgX: number; svgY: number; w: number; h: number; color: string; srcY: number };

  // Sort by srcY descending so far boxes render before near boxes
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
    <svg viewBox="0 0 520 290" className="w-full h-full" style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.10))' }}>
      <defs>
        <clipPath id="cargoClip">
          <rect x={HOLD_X1} y={HOLD_Y1 - 8} width={holdW} height={holdH + 8} />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="270" cy="282" rx="230" ry="6" fill="rgba(0,0,0,0.05)" />

      {/* Cargo body */}
      <rect x={HOLD_X1} y={HOLD_Y1} width={holdW} height={holdH} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Cargo boxes with 3D effect */}
      <g clipPath="url(#cargoClip)">
        {boxes.map((b, i) => (
          <g key={i}>
            {/* Top face */}
            <polygon
              points={`${b.svgX},${b.svgY} ${b.svgX + b.w},${b.svgY} ${b.svgX + b.w + dx},${b.svgY + dy} ${b.svgX + dx},${b.svgY + dy}`}
              fill={b.color} fillOpacity="0.42" stroke={b.color} strokeOpacity="0.65" strokeWidth="0.5"
            />
            {/* Right side face */}
            <polygon
              points={`${b.svgX + b.w},${b.svgY} ${b.svgX + b.w + dx},${b.svgY + dy} ${b.svgX + b.w + dx},${b.svgY + dy + b.h} ${b.svgX + b.w},${b.svgY + b.h}`}
              fill={b.color} fillOpacity="0.32" stroke={b.color} strokeOpacity="0.65" strokeWidth="0.5"
            />
            {/* Front face */}
            <rect
              x={b.svgX} y={b.svgY} width={b.w} height={b.h}
              fill={b.color} fillOpacity="0.72" stroke={b.color} strokeOpacity="0.9" strokeWidth="0.8"
            />
          </g>
        ))}
      </g>

      {/* Cargo rear edge */}
      <line x1={HOLD_X2} y1={HOLD_Y1} x2={HOLD_X2} y2={HOLD_Y2} stroke="#94a3b8" strokeWidth="1.5" />
      {/* Cargo floor line */}
      <line x1={HOLD_X1} y1={HOLD_Y2} x2={HOLD_X2} y2={HOLD_Y2} stroke="#cbd5e1" strokeWidth="1" />

      {/* Cab body */}
      <path
        d="M 40,240 L 40,188 L 52,158 L 74,116 L 106,88 L 140,72 L 165,70 L 165,240 Z"
        fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"
      />

      {/* Windshield */}
      <path
        d="M 54,156 L 76,114 L 108,86 L 136,72 L 162,72 L 162,96 L 132,100 L 102,110 L 72,148 Z"
        fill="#bfdbfe" fillOpacity="0.65" stroke="#93c5fd" strokeOpacity="0.7" strokeWidth="0.8"
      />

      {/* Cab side window */}
      <path
        d="M 42,186 L 46,162 L 56,152 L 74,148 L 74,186 Z"
        fill="#bfdbfe" fillOpacity="0.35" stroke="#94a3b8" strokeWidth="0.8"
      />

      {/* Roof top edge */}
      <line x1="140" y1="72" x2={HOLD_X2} y2={HOLD_Y1} stroke="#94a3b8" strokeWidth="1" />

      {/* Wheel arches */}
      <path d="M 60,240 Q 60,264 82,270 Q 106,276 130,270 Q 150,264 150,240" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M 308,240 Q 308,264 330,270 Q 355,276 396,270 Q 416,264 416,240" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />

      {/* Wheels */}
      {[106, 355].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={264} r={26} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          <circle cx={cx} cy={264} r={14} fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
          <circle cx={cx} cy={264} r={4} fill="#64748b" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line
              key={deg}
              x1={cx + 5 * Math.cos((deg * Math.PI) / 180)}
              y1={264 + 5 * Math.sin((deg * Math.PI) / 180)}
              x2={cx + 13 * Math.cos((deg * Math.PI) / 180)}
              y2={264 + 13 * Math.sin((deg * Math.PI) / 180)}
              stroke="#475569" strokeWidth="1.2"
            />
          ))}
        </g>
      ))}

      {/* Mirror */}
      <rect x="38" y="155" width="8" height="14" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  );
}

// ─── 2D top-view SVG ─────────────────────────────────────────────────────────
// Cargo hold spans x=80..410 (330px wide) and y=15..155 (140px tall) in SVG coords.
const TOP_OX = 80, TOP_OY = 15, TOP_W = 330, TOP_H = 140;

function TopViewSVG({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const scaleX = TOP_W / vehicle.length;
  const scaleY = TOP_H / vehicle.width;

  return (
    <svg viewBox="0 0 460 170" className="w-full h-full max-h-36">
      <defs>
        <clipPath id="topCargoClip">
          <rect x={TOP_OX} y={TOP_OY} width={TOP_W} height={TOP_H} />
        </clipPath>
      </defs>
      {/* Van outline */}
      <rect x="10" y="15" width="400" height="140" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      {/* Cab */}
      <rect x="10" y="15" width="70" height="140" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      <text x="45" y="88" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform="rotate(-90,45,88)">КАБИНА</text>
      {/* Cargo boxes */}
      <g clipPath="url(#topCargoClip)">
        {placed.map((u, i) => {
          const x = TOP_OX + u.x * scaleX;
          const y = TOP_OY + u.y * scaleY;
          const w = u.length * scaleX;
          const h = u.width * scaleY;
          return (
            <rect key={i} x={x + 0.5} y={y + 0.5} width={Math.max(1, w - 1)} height={Math.max(1, h - 1)}
              fill={u.color} fillOpacity="0.55" stroke={u.color} strokeOpacity="0.9" strokeWidth="0.8" />
          );
        })}
      </g>
      {/* Dimension labels */}
      <text x="230" y="164" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace">
        ← {vehicle.length.toLocaleString()} мм →
      </text>
      <text x="450" y="88" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="ui-monospace,monospace" transform="rotate(90,450,88)">
        {vehicle.width.toLocaleString()} мм
      </text>
    </svg>
  );
}

function SideViewSVG() {
  return (
    <svg viewBox="0 0 460 170" className="w-full h-full max-h-36">
      <rect x="10" y="10" width="440" height="130" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="230" y="80" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="ui-sans-serif,sans-serif">Вид сбоку — данные поступят позже</text>
    </svg>
  );
}

function RearViewSVG() {
  return (
    <svg viewBox="0 0 460 170" className="w-full h-full max-h-36">
      <rect x="80" y="10" width="300" height="130" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="230" y="80" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="ui-sans-serif,sans-serif">Вид сзади — данные поступят позже</text>
    </svg>
  );
}

type Tab2D = 'top' | 'side' | 'rear';

interface Props {
  store: CargoStore;
}

export function ContainerView({ store }: Props) {
  const { placed, vehicle, cargoItems } = store;
  const [tab2d, setTab2d] = useState<Tab2D>('top');

  const projViews: { id: Tab2D; label: string }[] = [
    { id: 'top',  label: 'Вид сверху' },
    { id: 'side', label: 'Вид сбоку'  },
    { id: 'rear', label: 'Вид сзади'  },
  ];

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden min-w-0">
      {/* ── 3D header ── */}
      <div className="h-11 border-b border-gray-200 flex items-center px-4 gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800">3D вид загрузки</span>
        <div className="flex-1" />
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Сбросить вид">
          <RotateCcw size={14} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="3D вид">
          <Box size={14} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Видимость">
          <Eye size={14} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Полный экран">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* ── 3D view ── */}
      <div className="flex-1 flex items-center justify-center px-6 pt-4 pb-2 overflow-hidden min-h-0">
        <VanSVG placed={placed} vehicle={vehicle} />
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-4 pb-3 flex-wrap px-4">
        {cargoItems.map(({ id, color, length, width, height }) => (
          <div key={id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-gray-500">{length}×{width}×{height} мм</span>
          </div>
        ))}
      </div>

      {/* ── 2D projections ── */}
      <div className="border-t border-gray-200 flex-shrink-0 px-4 pt-3 pb-4">
        <div className="text-sm font-semibold text-gray-800 mb-2">2D проекции</div>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-3">
          {projViews.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab2d(id)}
              className={`pb-2 mr-5 text-xs transition-colors border-b-2 -mb-px ${
                tab2d === id
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Projection + zoom controls */}
        <div className="flex items-start gap-2">
          <div className="flex-1 h-36">
            {tab2d === 'top'  && <TopViewSVG placed={placed} vehicle={vehicle} />}
            {tab2d === 'side' && <SideViewSVG />}
            {tab2d === 'rear' && <RearViewSVG />}
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <Plus size={12} />
            </button>
            <button className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <Minus size={12} />
            </button>
            <button className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
