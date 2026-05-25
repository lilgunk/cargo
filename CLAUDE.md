# Проект

Дипломный проект:
Aplikacja wspomagająca planowanie załadunku pojazdów dostawczych

## Стек

- React
- TypeScript
- Vite
- TailwindCSS
- Node.js (планируется)
- Express (планируется)
- SQLite (планируется)

## Цель

Приложение для визуального планирования загрузки грузового автомобиля.

Пользователь может:
- выбрать автомобиль
- задать размеры грузов
- добавлять коробки
- видеть пошаговую укладку
- просматривать 2D/3D визуализацию

## Важно

- Двигаться маленькими шагами
- Не создавать огромную архитектуру
- Не усложнять проект
- Код должен быть читаемым
- Использовать TypeScript типы
- Разделять компоненты по папкам
- Не добавлять Redux
- Использовать функциональные React components

## Запуск

```bash
npm run dev
```

Сервер поднимается на **http://localhost:5173**

Если ошибка `Cannot find native binding` у rolldown — удалить node_modules и переустановить:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## История изменений

### Этап 1 — Базовый layout (2026-05-25)

**Создана структура проекта** на React + TypeScript + Vite + TailwindCSS.

**Компоненты созданы:**

```
src/
├── types/index.ts          — типы: Vehicle, CargoItem, PlacementStep (единицы — мм)
├── data/mockData.ts        — моковые данные: 3 авто, 3 типа груза, 5 шагов укладки
├── App.tsx                 — главный layout
└── components/
    ├── NavSidebar/         — левый nav: лого LoadOpti + меню + профиль пользователя
    ├── Header/             — шапка: название проекта + Сохранить/Экспорт/Новый проект
    ├── LeftPanel/          — выбор авто + форма добавления груза + список грузов
    ├── ContainerView/      — 3D SVG фургона + 2D проекции (сверху/сбоку/сзади)
    ├── RightPanel/         — результат оптимизации + метрики + действия
    ├── StatsPanel/         — (устарел, заменён RightPanel)
    ├── Sidebar/            — (устарел, заменён NavSidebar + LeftPanel)
    └── StepsPanel/         — шаги укладки (временно скрыт из layout)
```

**Layout:**
```
[ NavSidebar ] [ Header                                        ]
               [ LeftPanel ] [ ContainerView ] [ RightPanel   ]
```

**Дизайн-референс:** Figma-макет LoadOpti (скрины предоставлены пользователем).
Стиль: dark dashboard, цветовая схема Tailwind slate.

---

**Данные (mockData.ts):**

Автомобили (единицы — мм, кг):
- Furgon S: 2800×1600×1650, 800 кг
- Mercedes Sprinter L2H2: 3665×1787×1940, 1100 кг
- Mercedes Sprinter L3H2: 4325×1787×1940, 1350 кг

Груз (3 типа, 14 единиц итого):
- Box A: 600×400×300 мм, 15 кг × 8 шт. (цвет: indigo #818cf8)
- Box B: 800×600×400 мм, 25 кг × 4 шт. (цвет: green #34d399)
- Box C: 1000×500×500 мм, 30 кг × 2 шт. (цвет: tan #fbbf24)

Шаги укладки (MOCK_STEPS): 5 шагов с координатами позиций.

---

**Что НЕ реализовано (следующие этапы):**
- Алгоритм оптимизации укладки
- Backend (Node.js + Express + SQLite)
- Реальная 3D-визуализация (Three.js или WebGL)
- Сохранение проектов
- Экспорт отчётов
- Интерактивное добавление/удаление груза (форма есть, логика — нет)
- Пошаговый просмотр укладки (StepsPanel готов, скрыт)
