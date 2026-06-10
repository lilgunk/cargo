import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { VEHICLES } from '../../data/mockData';
import type { CargoStore } from '../../hooks/useCargoStore';
import { useSettings } from '../../contexts/SettingsContext';

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

export function LeftPanel({ store }: { store: CargoStore }) {
  const { vehicleId, setVehicleId, vehicle, cargoItems, addCargo, removeCargo } = store;
  const { t } = useSettings();
  const [ddOpen, setDdOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('box');
  const [form, setForm] = useState({ length: '600', width: '400', height: '300', weight: '15', qty: '1' });
  const [formError, setFormError] = useState<string | null>(null);

  const totalWeight = cargoItems.reduce((s, c) => s + c.weight * c.quantity, 0);
  const totalItems  = cargoItems.reduce((s, c) => s + c.quantity, 0);

  function handleAdd() {
    setFormError(null);
    const l = parseInt(form.length, 10), w = parseInt(form.width, 10);
    const h = parseInt(form.height, 10), wt = parseInt(form.weight, 10);
    const qty = parseInt(form.qty, 10);
    if (!(l > 0 && w > 0 && h > 0 && wt > 0 && qty > 0)) return;

    if (l > vehicle.length || w > vehicle.width || h > vehicle.height) {
      const over: string[] = [];
      if (l > vehicle.length) over.push(`${t.left_err_dim_length} ${l} > ${vehicle.length} ${t.left_mm}`);
      if (w > vehicle.width)  over.push(`${t.left_err_dim_width} ${w} > ${vehicle.width} ${t.left_mm}`);
      if (h > vehicle.height) over.push(`${t.left_err_dim_height} ${h} > ${vehicle.height} ${t.left_mm}`);
      setFormError(`${t.left_err_oversize}: ${over.join(', ')}`);
      return;
    }
    if (!addCargo({ length: l, width: w, height: h, weight: wt, quantity: qty })) {
      setFormError(t.left_err_volume); return;
    }
    setForm(f => ({ ...f, qty: '1' }));
  }

  const inputCls = 'w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 tabular-nums';

  return (
    <aside className="w-56 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden flex-shrink-0">
      {/* Vehicle */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.left_vehicle}</div>
        <div className="relative mb-3">
          <button onClick={() => setDdOpen(o => !o)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-xs text-gray-700 dark:text-gray-200 hover:border-gray-400 transition-colors">
            <span className="truncate">{vehicle.name}</span>
            <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 ml-1 transition-transform ${ddOpen ? 'rotate-180' : ''}`} />
          </button>
          {ddOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden z-20 shadow-lg">
              {VEHICLES.map(v => (
                <button key={v.id} onClick={() => { setVehicleId(v.id); setDdOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${vehicleId === v.id ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-3">
          {[vehicle.images?.side, vehicle.images?.front].map((src, i) => (
            <div key={i} className="flex-1 aspect-[10/9] bg-gray-50 dark:bg-slate-800 rounded-lg overflow-hidden">
              {src ? <img src={src} alt="" className="w-full h-full object-contain p-1" />
                   : <div className="p-1.5 w-full h-full">{i === 0 ? <VanSideSVG /> : <VanFrontSVG />}</div>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { label: t.left_length, val: vehicle.length },
            { label: t.left_width,  val: vehicle.width },
            { label: t.left_height, val: vehicle.height },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <div className="text-[10px] text-gray-400 dark:text-slate-500">{label}</div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{val.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 dark:text-slate-500">{t.left_mm}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs px-0.5">
          <span className="text-gray-400 dark:text-slate-500">{t.left_capacity}</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium tabular-nums">{vehicle.maxWeight} {t.left_mm === 'мм' ? 'кг' : t.left_mm === 'mm' ? 'kg' : 'kg'}</span>
        </div>
      </div>

      {/* Add cargo */}
      <div className="px-4 pt-3 pb-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.left_add}</div>
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-3">
          {(['box', 'pallet'] as Tab[]).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`pb-2 px-1 mr-4 text-xs transition-colors border-b-2 -mb-px ${
                tab === tb ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}>
              {tb === 'box' ? t.left_box : t.left_pallet}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[
            { label: t.left_length_mm, key: 'length' },
            { label: t.left_width_mm,  key: 'width' },
            { label: t.left_height_mm, key: 'height' },
            { label: t.left_weight_kg, key: 'weight' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">{label}</label>
              <input type="number" value={form[key as keyof typeof form]}
                onChange={e => { setFormError(null); setForm(f => ({ ...f, [key]: e.target.value })); }}
                className={inputCls} />
            </div>
          ))}
        </div>
        <div className="mb-3">
          <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">{t.left_qty}</label>
          <input type="number" value={form.qty}
            onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
            className={inputCls} />
        </div>
        <button onClick={handleAdd}
          className="w-full py-2 rounded-lg bg-gray-900 dark:bg-blue-600 text-white text-xs font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors">
          {t.left_add}
        </button>
        {formError && <p className="mt-2 text-[10px] text-red-500 leading-snug">{formError}</p>}
      </div>

      {/* Cargo list */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.left_list}</div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {cargoItems.map(item => (
            <div key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 group">
              <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}66` }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-tight">
                  {item.length} × {item.width} × {item.height} {t.left_mm}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                  {item.weight} {t.left_mm === 'мм' ? 'кг' : 'kg'} · {item.quantity} {t.left_mm === 'мм' ? 'шт.' : t.left_mm === 'mm' ? 'szt.' : 'pcs.'}
                </div>
              </div>
              <button onClick={() => removeCargo(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-between py-3 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            {t.left_total_weight}: <span className="text-gray-700 dark:text-gray-300 font-medium">{totalWeight} {t.left_mm === 'мм' ? 'кг' : 'kg'}</span>
          </span>
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            {t.left_total_items}: <span className="text-gray-700 dark:text-gray-300 font-medium">{totalItems}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
