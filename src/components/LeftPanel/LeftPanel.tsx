import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';
import type { CargoStore } from '../../hooks/useCargoStore';
import { useSettings } from '../../contexts/SettingsContext';
import { allowedDims } from '../../algorithm/packCargo';
import type { RotationRule } from '../../types';

type Tab = 'box' | 'pallet';

// Standard pallet footprints (mm). Base height of a wooden pallet ≈ 144 mm.
const PALLETS = {
  eur: { length: 1200, width: 800 },
  half: { length: 800, width: 600 },
  industrial: { length: 1200, width: 1000 },
} as const;
type PalletType = keyof typeof PALLETS;
const PALLET_BASE_HEIGHT = 144;

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
  const [form, setForm] = useState({ name: '', length: '600', width: '400', height: '300', weight: '15', qty: '1' });
  const [rotation, setRotation] = useState<RotationRule>('horizontal');
  const [stackable, setStackable] = useState(true);
  const [floorOnly, setFloorOnly] = useState(false);
  const [palletType, setPalletType] = useState<PalletType>('eur');
  const [palletStackable, setPalletStackable] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalWeight = cargoItems.reduce((s, c) => s + c.weight * c.quantity, 0);
  const totalItems  = cargoItems.reduce((s, c) => s + c.quantity, 0);

  function handleAdd() {
    setFormError(null);
    const pallet = tab === 'pallet';
    // A pallet: fixed footprint, total height entered, may turn 90°, always on the floor.
    const l = pallet ? PALLETS[palletType].length : parseInt(form.length, 10);
    const w = pallet ? PALLETS[palletType].width : parseInt(form.width, 10);
    const h = parseInt(form.height, 10), wt = parseFloat(form.weight.replace(',', '.'));
    const qty = parseInt(form.qty, 10);
    if (!(l > 0 && w > 0 && h > 0 && wt > 0 && qty > 0)) { setFormError(t.left_err_numbers); return; }
    if (pallet && h <= PALLET_BASE_HEIGHT) { setFormError(t.left_err_pallet_height); return; }
    const rot: RotationRule = pallet ? 'horizontal' : rotation;

    // Z4: the item must fit the cargo space in at least one allowed orientation.
    const fits = allowedDims({ length: l, width: w, height: h, rotation: rot })
      .some(d => d.l <= vehicle.length && d.w <= vehicle.width && d.h <= vehicle.height);
    if (!fits) {
      setFormError(`${t.left_err_never_fits} (${vehicle.length} × ${vehicle.width} × ${vehicle.height} ${t.left_mm})`);
      return;
    }
    const name = form.name.trim() || (pallet ? `${t.left_pallet} ${t[`left_pallet_${palletType}`]}` : '');
    addCargo({
      name, length: l, width: w, height: h, weight: wt, quantity: qty, rotation: rot,
      stackable: pallet ? palletStackable : stackable,
      floorOnly: pallet ? true : floorOnly,
      kind: pallet ? 'pallet' : 'box',
    });
    setForm(f => ({ ...f, name: '', qty: '1' }));
  }

  const rotationShort: Record<RotationRule, string> = {
    none: t.left_rot_none_short, horizontal: t.left_rot_horizontal_short, any: t.left_rot_any_short,
  };

  const inputCls = 'w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 tabular-nums';

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col overflow-y-auto flex-shrink-0">
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
              {vehicleService.getAll().map(v => (
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
          <span className="text-gray-700 dark:text-gray-300 font-medium tabular-nums">{vehicle.maxWeight} {t.unit_kg}</span>
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
        <div className="mb-2">
          <label className="block text-[11px] text-gray-500 dark:text-slate-400 mb-1">{t.left_name}</label>
          <input type="text" value={form.name} placeholder={t.left_name_ph} maxLength={60}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls} />
        </div>
        {tab === 'pallet' && (
          <div className="mb-2">
            <label className="block text-[11px] text-gray-500 dark:text-slate-400 mb-1">{t.left_pallet_type}</label>
            <select value={palletType} onChange={e => setPalletType(e.target.value as PalletType)} className={inputCls}>
              {(Object.keys(PALLETS) as PalletType[]).map(p => (
                <option key={p} value={p}>{t[`left_pallet_${p}`]} · {PALLETS[p].length}×{PALLETS[p].width}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {(tab === 'pallet'
            ? [{ label: t.left_pallet_height, key: 'height' }, { label: t.left_weight_kg, key: 'weight' }]
            : [
              { label: t.left_length_mm, key: 'length' },
              { label: t.left_width_mm,  key: 'width' },
              { label: t.left_height_mm, key: 'height' },
              { label: t.left_weight_kg, key: 'weight' },
            ]).map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[11px] text-gray-500 dark:text-slate-400 mb-1">{label}</label>
              <input type="number" value={form[key as keyof typeof form]}
                onChange={e => { setFormError(null); setForm(f => ({ ...f, [key]: e.target.value })); }}
                className={inputCls} />
            </div>
          ))}
        </div>
        <div className="mb-2">
          <label className="block text-[11px] text-gray-500 dark:text-slate-400 mb-1">{t.left_qty}</label>
          <input type="number" value={form.qty}
            onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
            className={inputCls} />
        </div>
        {tab === 'box' ? (
          <>
            <div className="mb-2">
              <label className="block text-[11px] text-gray-500 dark:text-slate-400 mb-1">{t.left_rotation}</label>
              <select value={rotation} onChange={e => setRotation(e.target.value as RotationRule)} className={inputCls}>
                <option value="none">{t.left_rot_none}</option>
                <option value="horizontal">{t.left_rot_horizontal}</option>
                <option value="any">{t.left_rot_any}</option>
              </select>
            </div>
            <label className="flex items-start gap-2 mb-1.5 text-[11px] text-gray-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={stackable} onChange={e => setStackable(e.target.checked)} className="mt-0.5 accent-blue-600" />
              {t.left_stackable}
            </label>
            <label className="flex items-start gap-2 mb-3 text-[11px] text-gray-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={floorOnly} onChange={e => setFloorOnly(e.target.checked)} className="mt-0.5 accent-blue-600" />
              {t.left_floor_only}
            </label>
          </>
        ) : (
          <>
            <label className="flex items-start gap-2 mb-1.5 text-[11px] text-gray-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={palletStackable} onChange={e => setPalletStackable(e.target.checked)} className="mt-0.5 accent-blue-600" />
              {t.left_stackable}
            </label>
            <p className="mb-3 text-[10px] leading-snug text-gray-500 dark:text-slate-400">{t.left_pallet_note}</p>
          </>
        )}
        <button onClick={handleAdd}
          className="w-full py-2 rounded-lg bg-gray-900 dark:bg-blue-600 text-white text-xs font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors">
          {t.left_add}
        </button>
        {formError && <p className="mt-2 text-[10px] text-red-500 leading-snug">{formError}</p>}
      </div>

      {/* Cargo list */}
      <div className="flex flex-col px-4 pt-3">
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.left_list}</div>
        {cargoItems.length === 0 && (
          <p className="py-4 text-center text-[11px] leading-snug text-gray-400 dark:text-slate-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
            {t.left_list_empty}
          </p>
        )}
        <div className="space-y-1.5">
          {cargoItems.map(item => (
            <div key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 group">
              <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}66` }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-tight truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="text-[10px] text-gray-600 dark:text-slate-300 tabular-nums mt-0.5">
                  {item.length} × {item.width} × {item.height} {t.left_mm}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                  {item.weight} {t.unit_kg} · {item.quantity} {t.unit_pcs}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="px-1.5 py-px rounded text-[9px] bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-300">{rotationShort[item.rotation]}</span>
                  {item.floorOnly && (
                    <span className="px-1.5 py-px rounded text-[9px] bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">{t.left_floor_only_tag}</span>
                  )}
                  {!item.stackable && (
                    <span className="px-1.5 py-px rounded text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{t.left_not_stackable_tag}</span>
                  )}
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
            {t.left_total_weight}: <span className="text-gray-700 dark:text-gray-300 font-medium">{totalWeight} {t.unit_kg}</span>
          </span>
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            {t.left_total_items}: <span className="text-gray-700 dark:text-gray-300 font-medium">{totalItems}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
