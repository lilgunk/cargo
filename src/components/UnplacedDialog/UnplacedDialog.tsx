import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { CargoItem, UnplacedUnit } from '../../types';
import { UnplacedList } from '../UnplacedList/UnplacedList';

/** Centered pop-up with the cargo that did not fit and what to change. */
export function UnplacedDialog({ unplaced, cargoItems, onClose }: {
  unplaced: UnplacedUnit[]; cargoItems: CargoItem[]; onClose: () => void;
}) {
  const { t } = useSettings();
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // portal: a transformed ancestor (tab animation) must not clip the overlay
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="unplaced-title"
        className="w-full max-w-md max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 id="unplaced-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">{t.unplaced_dialog_title}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t.unplaced_dialog_sub}</p>
          </div>
          <button ref={closeBtn} onClick={onClose} aria-label={t.common_close}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto">
          <UnplacedList unplaced={unplaced} cargoItems={cargoItems} />
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-blue-600 text-white text-xs font-semibold hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors">
            {t.unplaced_dialog_ok}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
