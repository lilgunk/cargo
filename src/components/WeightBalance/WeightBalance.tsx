import { AlertTriangle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { weightDistribution } from '../../algorithm/weightDistribution';
import type { PlacedUnit, Vehicle } from '../../types';

function SplitBar({ left, labelLeft, labelRight, warn }: { left: number; labelLeft: string; labelRight: string; warn?: boolean }) {
  const l = Math.round(left * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 mb-1">
        <span>{labelLeft} <b className="text-gray-800 dark:text-gray-100 tabular-nums">{l}%</b></span>
        <span><b className="text-gray-800 dark:text-gray-100 tabular-nums">{100 - l}%</b> {labelRight}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div className={`absolute inset-y-0 left-0 ${warn ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${l}%` }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white dark:bg-slate-900" />
      </div>
    </div>
  );
}

/** Centre of gravity and left/right, front/rear split of the computed plan. */
export function WeightBalance({ placed, vehicle }: { placed: PlacedUnit[]; vehicle: Vehicle }) {
  const { t } = useSettings();
  const wd = weightDistribution(placed, vehicle);
  if (!wd.centre) return null;
  const warnings = [wd.lateralImbalance && t.weight_warn_lateral, wd.highCentre && t.weight_warn_high].filter(Boolean) as string[];

  return (
    <div className="px-4 pt-3 pb-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 space-y-2.5">
      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t.weight_title}</div>
      <SplitBar left={wd.leftShare} labelLeft={t.weight_left} labelRight={t.weight_right} warn={wd.lateralImbalance} />
      <SplitBar left={wd.frontShare} labelLeft={t.weight_front} labelRight={t.weight_rear} />
      <div className="text-[10px] text-gray-500 dark:text-slate-400 space-y-0.5">
        <div className="flex justify-between"><span>{t.weight_centre_x}</span><span className="tabular-nums text-gray-800 dark:text-gray-200">{Math.round(wd.centre.x)} mm</span></div>
        <div className="flex justify-between"><span>{t.weight_centre_z}</span><span className="tabular-nums text-gray-800 dark:text-gray-200">{Math.round(wd.centre.z)} mm</span></div>
      </div>
      {warnings.map(w => (
        <p key={w} className="flex gap-1.5 text-[10px] leading-snug text-amber-700 dark:text-amber-400">
          <AlertTriangle size={12} className="flex-shrink-0 mt-px" />{w}
        </p>
      ))}
    </div>
  );
}
