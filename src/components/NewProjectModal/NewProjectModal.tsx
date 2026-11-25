import { useState } from 'react';
import { Check, Truck, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { vehicleService } from '../../services/vehicleService';
import type { VehicleId } from '../../types';

export function NewProjectModal({ onConfirm, onClose }: {
  onConfirm: (name: string, vehicleId: VehicleId) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const [name, setName] = useState('');
  const [vehicleId, setVehicleId] = useState<VehicleId>('large');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[520px] mx-4 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">{t.modal_title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.modal_name}</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder={t.modal_placeholder}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.modal_vehicle}</label>
            <div className="space-y-2">
              {vehicleService.getAll().map(v => (
                <button key={v.id} onClick={() => setVehicleId(v.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                    vehicleId === v.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}>
                  <div className="w-16 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {v.images?.side
                      ? <img src={v.images.side} alt="" className="w-full h-full object-contain" />
                      : <Truck size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                      {v.length / 1000}×{v.width / 1000}×{v.height / 1000} {t.modal_m} · {t.modal_up_to} {v.maxWeight} {t.modal_kg}
                    </div>
                  </div>
                  {vehicleId === v.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            {t.modal_cancel}
          </button>
          <button onClick={() => onConfirm(name.trim() || t.modal_title, vehicleId)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
            {t.modal_create}
          </button>
        </div>
      </div>
    </div>
  );
}
