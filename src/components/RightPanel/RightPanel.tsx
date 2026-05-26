import { MoreVertical, Trash2, FileText, Zap } from 'lucide-react';
import type { CargoStore } from '../../hooks/useCargoStore';

interface Props {
  store: CargoStore;
}

export function RightPanel({ store }: Props) {
  const {
    occupancy, usedVolume, maxVolume, totalWeight, totalItems,
    freeVolume, vehicle, cargoItems, placed,
  } = store;

  const badge =
    occupancy >= 60 ? { label: 'Оптимально', cls: 'bg-green-50 text-green-600 border-green-200' } :
    occupancy >= 30 ? { label: 'Частично',   cls: 'bg-yellow-50 text-yellow-600 border-yellow-200' } :
                      { label: 'Мало груза', cls: 'bg-gray-50 text-gray-500 border-gray-200' };

  const placedDisplay = cargoItems
    .map((item) => {
      const units = placed.filter((u) => u.cargoId === item.id);
      if (units.length === 0) return null;
      const u = units[0];
      return { ...item, pos: `(${u.x}, ${u.y}, ${u.z})`, placedCount: units.length };
    })
    .filter(Boolean) as (typeof cargoItems[0] & { pos: string; placedCount: number })[];

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">Результат оптимизации</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Occupancy bar */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">Занято пространства</span>
          <span className="text-xs font-semibold text-gray-900 tabular-nums">{occupancy}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300"
            style={{ width: `${occupancy}%` }}
          />
        </div>

        {/* Stats grid */}
        <div className="space-y-2.5">
          {[
            { label: 'Используемый объем', value: `${usedVolume.toFixed(2)} м³ / ${maxVolume.toFixed(1)} м³` },
            { label: 'Общий вес',          value: `${totalWeight} кг / ${vehicle.maxWeight} кг` },
            { label: 'Количество мест',    value: `${totalItems} шт.` },
            { label: 'Свободный объем',    value: `${freeVolume.toFixed(2)} м³` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs text-gray-900 font-medium tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        {/* Optimize button */}
        <button
          onClick={store.optimize}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          <Zap size={13} />
          Запустить оптимизацию
        </button>
      </div>

      {/* ── Placed cargo ── */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3">
        <div className="text-xs font-semibold text-gray-800 mb-2">
          Размещённые грузы ({placed.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {placedDisplay.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-200 group"
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}55` }}
              >
                <svg viewBox="0 0 18 18" className="w-4 h-4" style={{ fill: item.color + 'cc' }}>
                  <rect x="2" y="5" width="14" height="9" rx="1" />
                  <rect x="4" y="2" width="10" height="5" rx="1" opacity="0.6" />
                </svg>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-900 font-medium leading-tight">
                  {item.length} × {item.width} × {item.height} мм
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {item.weight} кг · {item.placedCount} шт.
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.pos}</div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all flex-shrink-0">
                <MoreVertical size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0 space-y-2">
        <div className="text-xs font-semibold text-gray-500 mb-2">Действия</div>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors">
          <Trash2 size={13} className="text-gray-400" />
          Очистить загрузку
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors">
          <FileText size={13} className="text-gray-400" />
          Сгенерировать отчет
        </button>
      </div>
    </aside>
  );
}
