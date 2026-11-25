import {
  AlertTriangle, Activity, Boxes, DoorOpen, Layers, LayoutGrid, Lightbulb, MapPin, Maximize2, Scale, Weight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { CargoItem, UnplacedReason, UnplacedUnit } from '../../types';

const REASON_ICON: Record<UnplacedReason, LucideIcon> = {
  TOO_LARGE: Maximize2,
  DOOR_OPENING: DoorOpen,
  PAYLOAD_EXCEEDED: Weight,
  NO_SPACE: Boxes,
  NO_FLOOR_SPACE: LayoutGrid,
  NOT_STACKABLE: Layers,
  INSUFFICIENT_SUPPORT: Scale,
  UNSTABLE: Activity,
  DELIVERY_ORDER: MapPin,
};

interface Group { reason: UnplacedReason; count: number; items: { id: string; name: string; color: string; count: number }[] }

/** Cargo that did not fit — one card per reason, with the affected cargo and what to change. */
export function UnplacedList({ unplaced, cargoItems }: { unplaced: UnplacedUnit[]; cargoItems: CargoItem[] }) {
  const { t } = useSettings();
  const groups = new Map<UnplacedReason, Group>();
  for (const u of unplaced) {
    const g = groups.get(u.reason) ?? { reason: u.reason, count: 0, items: [] };
    g.count++;
    const it = g.items.find(i => i.id === u.cargoId);
    if (it) it.count++;
    else g.items.push({ id: u.cargoId, name: u.name, color: cargoItems.find(c => c.id === u.cargoId)?.color ?? '#94a3b8', count: 1 });
    groups.set(u.reason, g);
  }
  const sorted = [...groups.values()].sort((a, b) => b.count - a.count);
  const total = cargoItems.reduce((s, c) => s + c.quantity, 0);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <AlertTriangle size={13} /> {t.right_unplaced} ({unplaced.length})
        </span>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 tabular-nums">{unplaced.length} / {total} {t.unit_pcs}</span>
      </div>
      <div className="space-y-2">
        {sorted.map(g => {
          const Icon = REASON_ICON[g.reason] ?? AlertTriangle;
          return (
            <div key={g.reason} className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 p-2.5">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold leading-snug text-gray-900 dark:text-gray-100">{t[`reason_${g.reason}`]}</span>
                    <span className="flex-shrink-0 px-1.5 py-px rounded-full bg-amber-500 text-white text-[10px] font-semibold tabular-nums">× {g.count}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {g.items.slice(0, 6).map(i => (
                      <span key={i.id} className="flex items-center gap-1 max-w-full px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] text-gray-700 dark:text-gray-200">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: i.color }} />
                        <span className="truncate">{i.name}</span>
                        {i.count > 1 && <span className="text-gray-400">×{i.count}</span>}
                      </span>
                    ))}
                    {g.items.length > 6 && <span className="px-1.5 py-0.5 text-[10px] text-gray-400">+{g.items.length - 6}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/30 text-[10px] leading-snug text-gray-600 dark:text-slate-400">
                <Lightbulb size={12} className="flex-shrink-0 mt-px text-amber-500" />
                <span>{t[`hint_${g.reason}`]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
