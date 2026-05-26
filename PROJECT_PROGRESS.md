# PROJECT_PROGRESS — LoadOpti (Cargo Planner)

Дипломный проект: приложение для планирования загрузки грузовых автомобилей.
Студент: max.yankovenko06@gmail.com

---

## Стек

- React + TypeScript + Vite + TailwindCSS
- Node.js / Express / SQLite — **планируется**
- Three.js / WebGL — **планируется (не приоритет)**

## Запуск

```bash
npm run dev   # http://localhost:5173
```

При ошибке `Cannot find native binding` (rolldown):
```bash
rm -rf node_modules package-lock.json && npm install
```

---

## Структура проекта (актуальная)

```
src/
├── types/index.ts              — Vehicle, CargoItem, PlacedUnit, VehicleId
├── data/mockData.ts            — 3 авто, 3 типа груза (SAMPLE_CARGO), MOCK_STEPS
├── hooks/useCargoStore.ts      — весь стейт и логика (никакого Redux)
├── App.tsx                     — корневой layout
└── components/
    ├── NavSidebar/             — левая навигация: лого + меню + профиль
    ├── Header/                 — шапка: название + Сохранить / Экспорт / Новый
    ├── LeftPanel/              — выбор авто + форма груза + список грузов
    ├── ContainerView/          — 3D SVG фургона + 2D проекции
    ├── RightPanel/             — результат укладки + метрики + действия
    ├── StepsPanel/             — пошаговый просмотр (готов, скрыт из layout)
    ├── StatsPanel/             — устарел (заменён RightPanel)
    └── Sidebar/                — устарел (заменён NavSidebar + LeftPanel)
```

**Layout:**
```
[ NavSidebar ] [ Header                                         ]
               [ LeftPanel ] [ ContainerView ] [ RightPanel    ]
```

---

## Данные (mockData.ts)

### Автомобили (мм / кг)

| id       | Название                    | Длина | Ширина | Высота | Грузоподъёмность |
|----------|-----------------------------|-------|--------|--------|------------------|
| small    | Furgon S                    | 2800  | 1600   | 1650   | 800 кг           |
| medium   | Mercedes Sprinter L2H2      | 3665  | 1787   | 1940   | 1100 кг          |
| large    | Mercedes Sprinter L3H2      | 4325  | 1787   | 1940   | 1350 кг          |

По умолчанию выбран `large`.

### Грузы (SAMPLE_CARGO)

| Название | Размер (мм)       | Вес  | Кол-во | Цвет     |
|----------|-------------------|------|--------|----------|
| Box A    | 600 × 400 × 300   | 15 кг | 8 шт.  | #818cf8  |
| Box B    | 800 × 600 × 400   | 25 кг | 4 шт.  | #34d399  |
| Box C    | 1000 × 500 × 500  | 30 кг | 2 шт.  | #fbbf24  |

Палитра цветов для новых грузов (COLORS, циклически):
`#818cf8 #34d399 #fbbf24 #f87171 #60a5fa #a78bfa #fb923c #4ade80`

---

## Что реализовано

### Этап 1 — Базовый layout (2026-05-25)

- Весь визуальный скелет: NavSidebar, Header, LeftPanel, ContainerView, RightPanel
- SVG-рисунки фургона (вид спереди, сбоку, 3D-псевдоперспектива)
- Статичные 2D-проекции (вид сверху / сбоку / сзади — вкладки)
- Дизайн по Figma-макету LoadOpti (светлая тема, slate-серые тона)

### Этап 2 — Живая логика (2026-05-25)

**useCargoStore.ts** — единственный источник правды:

- `addCargo(fields)` — добавляет груз, присваивает автоматический цвет
- `removeCargo(id)` — удаляет груз из списка
- `placeCargo(items, vehicle)` — **жадный алгоритм укладки**:
  - Идём по X, при `curX + length > vehicle.length` → новая строка (curY += rowMaxY)
  - При `curY + width > vehicle.width` → новый слой (curZ += layerMaxZ)
  - При `curZ + height > vehicle.height` → стоп, остаток не влезает
  - Результат: массив `PlacedUnit[]` с координатами x/y/z
- Вычисляемые метрики: `totalWeight`, `totalItems`, `usedVolume`, `maxVolume`, `freeVolume`, `occupancy`

**LeftPanel.tsx:**

- Форма с полями: длина, ширина, высота (мм), вес (кг), количество
- Валидация: все поля > 0, груз не превышает габариты авто
- Сообщение об ошибке под кнопкой (на русском, указывает какая ось превышена)
- Список добавленных грузов с цветным маркером, hover → кнопка Trash2
- Итого: общий вес + количество мест

**ContainerView.tsx:**

- `VanSVG` — 3D SVG фургона с реальными коробками из `placed[]`
  - Три грани (фронт, верх, правая) с разной прозрачностью
  - Сортировка по Y (дальние рисуются раньше)
  - ClipPath ограничивает коробки областью кузова
- `TopViewSVG` — вид сверху с реальными позициями из `placed[]`
- Легенда под 3D-видом (цвет + размеры каждого типа груза)
- Вкладки 2D: Вид сверху (рабочий), Вид сбоку (заглушка), Вид сзади (заглушка)

**RightPanel.tsx:**

- Бейдж статуса: Оптимально (≥60%) / Частично (≥30%) / Мало груза
- Прогресс-бар заполненности кузова
- Список размещённых грузов с позицией первого экземпляра (x, y, z)

---

## Что НЕ реализовано (следующие этапы)

| Фича                               | Статус      |
|------------------------------------|-------------|
| Алгоритм оптимизации (кнопка Zap)  | UI есть, логика нет |
| Вкладка «Палета» в форме           | UI есть, логика нет |
| Вид сбоку / сзади (2D)             | заглушки    |
| Очистить загрузку (кнопка)         | UI есть, логика нет |
| Сгенерировать отчёт (кнопка)       | UI есть, логика нет |
| Пошаговый просмотр (StepsPanel)    | готов, скрыт из layout |
| Backend (Node.js + Express)        | не начат    |
| SQLite (сохранение проектов)       | не начат    |
| Экспорт PDF/отчётов                | не начат    |
| Real 3D (Three.js)                 | не планируется в ближайшее время |

---

## Важные договорённости

- **Не добавлять Redux** — только `useState` + `useMemo` в хуке
- **Маленькие шаги** — не усложнять архитектуру
- **Без излишних комментариев** в коде
- **Единицы измерения — мм** везде в данных, перевод в м³ только для UI
- **TypeScript типы** — обязательны, `any` не использовать
- **Компоненты по папкам** (каждый компонент в своей папке)
- Дизайн-референс: Figma-макет LoadOpti (скрины предоставлялись)

---

## Типы (types/index.ts)

```ts
type VehicleId = 'small' | 'medium' | 'large';

interface Vehicle {
  id: VehicleId;
  name: string;
  length: number; width: number; height: number; // мм
  maxWeight: number; // кг
}

interface CargoItem {
  id: string;
  name: string;
  length: number; width: number; height: number; // мм
  weight: number; // кг
  quantity: number;
  color: string; // hex
}

interface PlacedUnit {
  cargoId: string;
  color: string;
  x: number; y: number; z: number; // мм, позиция в кузове
  length: number; width: number; height: number;
}
```
