import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { VEHICLES } from '../../data/mockData';
import type { CargoStore } from '../../hooks/useCargoStore';

type Tab = 'box' | 'pallet';

function VanFrontSVG() {
  return (
    <svg viewBox="0 0 90 70" className="w-full h-full">
      <rect x="10" y="8" width="70" height="48" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
      <rect x="14" y="12" width="62" height="26" rx="2" fill="#bfdbfe" fillOpacity="0.6" stroke="#93c5fd" strokeWidth="0.8" strokeOpacity="0.7" />
      <rect x="16" y="14" width="27" height="22" rx="1" fill="#dbeafe" fillOpacity="0.5" />
      <rect x="47" y="14" width="27" height="22" rx="1" fill="#dbeafe" fillOpacity="0.5" />
      <rect x="22" y="40" width="18" height="10" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.7" />
      <rect x="50" y="40" width="18" height="10" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.7" />
      <circle cx="22" cy="60" r="10" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
      <circle cx="22" cy="60" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
      <circle cx="68" cy="60" r="10" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
      <circle cx="68" cy="60" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
    </svg>
  );
}

function VanSideSVG() {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full">
      <rect x="30" y="12" width="82" height="44" rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
      <path d="M 8,56 L 8,35 L 12,24 L 22,14 L 32,12 L 32,56 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <path d="M 12,24 L 22,14 L 30,12 L 30,18 L 24,18 L 16,27 Z" fill="#bfdbfe" fillOpacity="0.6" stroke="#93c5fd" strokeWidth="0.8" strokeOpacity="0.5" />
      <rect x="38" y="16" width="22" height="16" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.6" />
      <rect x="64" y="16" width="22" height="16" rx="1" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.6" />
      <circle cx="22" cy="60" r="10" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
      <circle cx="22" cy="60" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
      <circle cx="95" cy="60" r="10" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
      <circle cx="95" cy="60" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
    </svg>
  );
}

interface Props {
  store: CargoStore;
}

export function LeftPanel({ store }: Props) {
  const { vehicleId, setVehicleId, vehicle, cargoItems, addCargo, removeCargo } = store;
  const [ddOpen, setDdOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('box');
  const [form, setForm] = useState({ length: '600', width: '400', height: '300', weight: '15', qty: '1' });
  const [formError, setFormError] = useState<string | null>(null);

  const totalWeight = cargoItems.reduce((s, c) => s + c.weight * c.quantity, 0);
  const totalItems = cargoItems.reduce((s, c) => s + c.quantity, 0);

  function handleAdd() {
    setFormError(null);
    const l = parseInt(form.length, 10);
    const w = parseInt(form.width, 10);
    const h = parseInt(form.height, 10);
    const wt = parseInt(form.weight, 10);
    const qty = parseInt(form.qty, 10);
    if (!(l > 0 && w > 0 && h > 0 && wt > 0 && qty > 0)) return;

    if (l > vehicle.length || w > vehicle.width || h > vehicle.height) {
      const over: string[] = [];
      if (l > vehicle.length) over.push(`длина ${l} > ${vehicle.length} мм`);
      if (w > vehicle.width)  over.push(`ширина ${w} > ${vehicle.width} мм`);
      if (h > vehicle.height) over.push(`высота ${h} > ${vehicle.height} мм`);
      setFormError(`Не влезет: ${over.join(', ')}`);
      return;
    }

    addCargo({ length: l, width: w, height: h, weight: wt, quantity: qty });
    setForm((f) => ({ ...f, qty: '1' }));
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
      {/* ─── Vehicle selection ─── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-800 mb-2">Выбор транспорта</div>

        {/* Dropdown */}
        <div className="relative mb-3">
          <button
            onClick={() => setDdOpen((o) => !o)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-700 hover:border-gray-400 transition-colors"
          >
            <span className="truncate">{vehicle.name}</span>
            <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 ml-1 transition-transform ${ddOpen ? 'rotate-180' : ''}`} />
          </button>
          {ddOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden z-20 shadow-lg">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVehicleId(v.id); setDdOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${vehicleId === v.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Van thumbnails */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 aspect-[4/3] bg-gray-50 rounded-lg border border-gray-200 p-1.5">
            <VanFrontSVG />
          </div>
          <div className="flex-1 aspect-[4/3] bg-gray-50 rounded-lg border border-gray-200 p-1.5">
            <VanSideSVG />
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { label: 'Длина', val: vehicle.length },
            { label: 'Ширина', val: vehicle.width },
            { label: 'Высота', val: vehicle.height },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <div className="text-[10px] text-gray-400">{label}</div>
              <div className="text-xs font-semibold text-gray-800 tabular-nums">{val.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">мм</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs px-0.5">
          <span className="text-gray-400">Грузоподъемность</span>
          <span className="text-gray-700 font-medium tabular-nums">{vehicle.maxWeight} кг</span>
        </div>
      </div>

      {/* ─── Add cargo ─── */}
      <div className="px-4 pt-3 pb-3 border-b border-gray-200 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-800 mb-2">Добавить груз</div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-3">
          {(['box', 'pallet'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 mr-4 text-xs transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'box' ? 'Коробка' : 'Палета'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[
            { label: 'Длина (мм)', key: 'length' },
            { label: 'Ширина (мм)', key: 'width' },
            { label: 'Высота (мм)', key: 'height' },
            { label: 'Вес (кг)', key: 'weight' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
              <input
                type="number"
                value={form[key as keyof typeof form]}
                onChange={(e) => { setFormError(null); setForm((f) => ({ ...f, [key]: e.target.value })); }}
                className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 tabular-nums"
              />
            </div>
          ))}
        </div>
        <div className="mb-3">
          <label className="block text-[10px] text-gray-500 mb-1">Количество</label>
          <input
            type="number"
            value={form.qty}
            onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          Добавить груз
        </button>
        {formError && (
          <p className="mt-2 text-[10px] text-red-500 leading-snug">{formError}</p>
        )}
      </div>

      {/* ─── Cargo list ─── */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3">
        <div className="text-xs font-semibold text-gray-800 mb-2">Список грузов</div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {cargoItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 group"
            >
              <div
                className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}66` }}
              >
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-800 font-medium leading-tight">
                  {item.length} × {item.width} × {item.height} мм
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {item.weight} кг · {item.quantity} шт.
                </div>
              </div>
              <button
                onClick={() => removeCargo(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer totals */}
        <div className="flex justify-between py-3 border-t border-gray-200 flex-shrink-0">
          <span className="text-[11px] text-gray-400">
            Общий вес: <span className="text-gray-700 font-medium">{totalWeight} кг</span>
          </span>
          <span className="text-[11px] text-gray-400">
            Всего мест: <span className="text-gray-700 font-medium">{totalItems}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
