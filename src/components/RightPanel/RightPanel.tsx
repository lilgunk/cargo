import { useState } from 'react';
import { MoreVertical, Trash2, FileText, Zap } from 'lucide-react';
import type { CargoStore } from '../../hooks/useCargoStore';
import { useSettings } from '../../contexts/SettingsContext';

export function RightPanel({ store }: { store: CargoStore }) {
  const { t } = useSettings();
  const [optimizing, setOptimizing] = useState(false);
  const { occupancy, usedVolume, maxVolume, totalWeight, totalItems, freeVolume, vehicle, cargoItems, placed } = store;

  function handleOptimize() {
    setOptimizing(true);
    setTimeout(() => { store.optimize(); setOptimizing(false); }, 800);
  }

  const badge =
    occupancy >= 60 ? { label: t.right_optimal, cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-700' } :
    occupancy >= 30 ? { label: t.right_partial, cls: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-700' } :
                      { label: t.right_low,     cls: 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600' };

  const placedDisplay = cargoItems
    .map(item => {
      const units = placed.filter(u => u.cargoId === item.id);
      if (!units.length) return null;
      return { ...item, pos: `(${units[0].x}, ${units[0].y}, ${units[0].z})`, placedCount: units.length };
    })
    .filter(Boolean) as (typeof cargoItems[0] & { pos: string; placedCount: number })[];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.right_title}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-slate-400">{t.right_occupied}</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{occupancy}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gray-900 dark:bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${occupancy}%` }} />
        </div>
        <div className="space-y-2.5">
          {[
            { label: t.right_volume, value: `${usedVolume.toFixed(2)} м³ / ${maxVolume.toFixed(1)} м³` },
            { label: t.right_weight, value: `${totalWeight} кг / ${vehicle.maxWeight} кг` },
            { label: t.right_places, value: `${totalItems} шт.` },
            { label: t.right_free,   value: `${freeVolume.toFixed(2)} м³` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
              <span className="text-xs text-gray-900 dark:text-gray-100 font-medium tabular-nums">{value}</span>
            </div>
          ))}
        </div>
        <button onClick={handleOptimize} disabled={optimizing}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 dark:bg-blue-600 text-white text-xs font-semibold hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-70 transition-colors">
          {optimizing
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Zap size={13} />}
          {optimizing ? t.right_optimizing : t.right_optimize}
        </button>
      </div>

      {/* Placed */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {t.right_placed} ({placed.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {placedDisplay.map(item => (
            <div key={item.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}55` }}>
                <svg viewBox="0 0 18 18" className="w-4 h-4" style={{ fill: item.color + 'cc' }}>
                  <rect x="2" y="5" width="14" height="9" rx="1" />
                  <rect x="4" y="2" width="10" height="5" rx="1" opacity="0.6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-900 dark:text-gray-100 font-medium leading-tight">
                  {item.length} × {item.width} × {item.height} мм
                </div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                  {item.weight} кг · {item.placedCount} шт.
                </div>
                <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{item.pos}</div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all flex-shrink-0">
                <MoreVertical size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 space-y-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">{t.right_actions}</div>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
          <Trash2 size={13} className="text-gray-400" />
          {t.right_clear}
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
          <FileText size={13} className="text-gray-400" />
          {t.right_report}
        </button>
      </div>
    </aside>
  );
}
