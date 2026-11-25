# NaStyk — planowanie załadunku

Aplikacja wspomagająca planowanie załadunku pojazdów dostawczych (praca inżynierska).

- wybór pojazdu (wymiary przestrzeni ładunkowej, nadkola, drzwi tylne, ładowność),
- lista ładunków: kartony, palety, ładunki niestandardowe (tylko na podłodze, „nie stawiać na górze”),
- plan załadunku: heurystyka Extreme Points z ograniczeniami i niezależną weryfikacją planu (`ALGORITHM.md`),
- wizualizacja 3D i 2D, podgląd krok po kroku,
- konta z potwierdzeniem e-mail i zapisywanie projektów (Supabase), eksport JSON / CSV.

## Stos

React 19 · TypeScript · Vite · Tailwind CSS · three.js · Supabase (Auth + PostgreSQL z Row Level Security)

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run typecheck
npm run lint
```

Baza danych: `supabase/migrations/` (uruchamiane w Supabase SQL Editor).
Wdrożenie: Cloudflare Pages buduje `npm run build` → `dist/` przy każdym pushu do `main`.
