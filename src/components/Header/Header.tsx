import { Edit2, Save, Users, Plus, Sun } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 flex-shrink-0">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">Новый проект</span>
          <button className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <Edit2 size={12} />
          </button>
        </div>
        <span className="text-[11px] text-gray-400">Последнее сохранение: сегодня, 14:32</span>
      </div>

      <div className="flex-1" />

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0">
        <Save size={13} />
        Сохранить проект
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0">
        <Users size={13} />
        Экспорт
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 ml-0.5 fill-current text-gray-400">
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-900 text-white hover:bg-gray-800 transition-colors flex-shrink-0">
        <Plus size={13} />
        Новый проект
      </button>
      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0">
        <Sun size={15} />
      </button>
    </header>
  );
}
