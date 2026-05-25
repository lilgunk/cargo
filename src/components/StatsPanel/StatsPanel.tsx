import { useState } from 'react';
import { ChevronDown, Zap, Trash2 } from 'lucide-react';
import { VEHICLES } from '../../data/mockData';
import type { VehicleId } from '../../types';

interface StatBarProps {
  label: string;
  value: string;
  percent: number;
  color: string;
}

function StatBar({ label, value, percent, color }: StatBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs text-slate-400 tabular-nums">{value}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function StatsPanel() {
  const [selectedId, setSelectedId] = useState<VehicleId>('large');
  const [open, setOpen] = useState(false);

  const vehicle = VEHICLES.find((v) => v.id === selectedId) ?? VEHICLES[2];
  const volumeM3 = ((vehicle.length * vehicle.width * vehicle.height) / 1e9).toFixed(1);

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden flex-shrink-0">
      {/* Section: Vehicle */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800 flex-shrink-0">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Selected Vehicle
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800 text-sm text-slate-200 hover:bg-slate-750 border border-slate-700/50 hover:border-slate-600 transition-colors"
          >
            <span className="truncate">{vehicle.name}</span>
            <ChevronDown
              size={14}
              className={`text-slate-500 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden z-10 shadow-xl">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedId(v.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedId === v.id
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dimensions grid */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Length', value: `${vehicle.length}` },
            { label: 'Width', value: `${vehicle.width}` },
            { label: 'Height', value: `${vehicle.height}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800/60 rounded-lg p-2 text-center border border-slate-700/30">
              <div className="text-xs text-slate-600 mb-0.5">{label}</div>
              <div className="text-xs font-semibold text-slate-200 tabular-nums">{value}</div>
              <div className="text-xs text-slate-600">mm</div>
            </div>
          ))}
        </div>

        {/* Max weight */}
        <div className="mt-2.5 flex justify-between items-center px-1">
          <span className="text-xs text-slate-500">Max weight</span>
          <span className="text-xs font-semibold text-slate-300 tabular-nums">{vehicle.maxWeight} kg</span>
        </div>
      </div>

      {/* Section: Load Statistics */}
      <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Load Statistics
        </div>

        {/* Occupancy */}
        <div className="text-center py-2">
          <div className="text-5xl font-bold text-slate-100 tabular-nums leading-none">0%</div>
          <div className="text-xs text-slate-500 mt-2">Space occupied</div>
          <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>

        {/* Stat bars */}
        <div className="space-y-3.5">
          <StatBar
            label="Used volume"
            value={`0.0 / ${volumeM3} m³`}
            percent={0}
            color="#6366f1"
          />
          <StatBar
            label="Total weight"
            value={`0 / ${vehicle.maxWeight} kg`}
            percent={0}
            color="#10b981"
          />
          <StatBar
            label="Cargo items"
            value="0 pcs"
            percent={0}
            color="#f59e0b"
          />
        </div>

        {/* Free volume info */}
        <div className="px-3 py-2.5 bg-slate-800/40 rounded-lg border border-slate-700/30">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Free volume</span>
            <span className="text-slate-300 tabular-nums">{volumeM3} m³</span>
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span className="text-slate-500">Remaining weight</span>
            <span className="text-slate-300 tabular-nums">{vehicle.maxWeight} kg</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-2 flex-shrink-0">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
          <Zap size={14} />
          Run Optimization
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <Trash2 size={13} />
          Clear Load
        </button>
      </div>
    </aside>
  );
}
