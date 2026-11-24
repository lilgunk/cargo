import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import type { CargoStore } from '../../hooks/useCargoStore';
import { useSettings } from '../../contexts/SettingsContext';

// Step-by-step loading preview: shows the plan up to the chosen step.
export function StepBar({ store }: { store: CargoStore }) {
  const { t } = useSettings();
  const { placed, step, setStep } = store;
  const [playing, setPlaying] = useState(false);
  const total = placed.length;

  // playback stops by itself at the last step
  const isPlaying = playing && step < total;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setTimeout(() => setStep(step + 1), 600);
    return () => clearTimeout(id);
  }, [isPlaying, step, setStep]);

  if (total === 0) return null;
  const current = step > 0 ? placed[step - 1] : null;
  // manual navigation stops playback
  const go = (n: number) => { setPlaying(false); setStep(n); };

  const btn = 'w-7 h-7 rounded flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors';

  return (
    <div className="mx-4 mb-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center gap-2">
      <button className={btn} onClick={() => go(0)} disabled={step === 0} aria-label={t.step_first}><SkipBack size={14} /></button>
      <button className={btn} onClick={() => go(step - 1)} disabled={step === 0} aria-label={t.step_prev}><ChevronLeft size={16} /></button>
      <button
        onClick={() => { if (step >= total) setStep(0); setPlaying(!isPlaying); }}
        aria-label={isPlaying ? t.step_pause : t.step_play}
        className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors">
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button className={btn} onClick={() => go(step + 1)} disabled={step === total} aria-label={t.step_next}><ChevronRight size={16} /></button>
      <button className={btn} onClick={() => go(total)} disabled={step === total} aria-label={t.step_last}><SkipForward size={14} /></button>

      <span className="text-xs text-gray-600 dark:text-slate-300 tabular-nums whitespace-nowrap ml-1">
        {t.step_label} <b>{step}</b> / {total}
      </span>
      <input type="range" min={0} max={total} value={step} onChange={e => go(Number(e.target.value))}
        aria-label={t.step_label} className="flex-1 accent-blue-600 min-w-16" />
      <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate max-w-64" title={current?.name}>
        {current
          ? <>{current.name} · {current.length}×{current.width}×{current.height} · {t[`support_${current.support}`]}</>
          : t.step_empty}
      </span>
    </div>
  );
}
