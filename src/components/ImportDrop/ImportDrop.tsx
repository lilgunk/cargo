import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { FileUp } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

/** Drop zone + file picker for an exported project (.loadopti.json). */
export function ImportDrop({ onImport }: { onImport: (text: string) => boolean }) {
  const { t } = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState(false);

  async function read(file: File | undefined) {
    if (!file) return;
    setError(!onImport(await file.text()));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <div onClick={() => input.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          over ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
        }`}>
        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
          <FileUp size={20} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{t.dash_drag}</p>
        <p className="text-xs text-blue-600 font-medium mt-1">{t.dash_or_file}</p>
        <input ref={input} type="file" accept=".json,application/json" className="hidden" aria-label={t.projects_import}
          onChange={e => { void read(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {error && <p className="mt-2 text-xs text-red-500" role="alert">{t.import_error}</p>}
    </div>
  );
}
