# CLAUDE.md — web-frontend

## Stack

- **Framework:** React 19 + Vite
- **UI:** Mantine v9 + Tabler Icons
- **Routing:** Wouter
- **Forms:** `@mantine/form` + Zod (`mantine-form-zod-resolver`)
- **Data fetching:** TanStack Query v5
- **Maps:** Mapbox GL / react-map-gl
- **Language:** JavaScript (ES Modules), JSX

## Commands

```bash
pnpm dev      # dev server
pnpm build    # production build
pnpm lint     # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── components/   # shared components (PageContainer, ScreenContainer, SelectableItemList…)
│   ├── constants/    # theme, colorPalette
│   ├── contexts/     # auth context
│   ├── hooks/        # shared hooks
│   ├── layout/       # AppShell layout + Header
│   ├── providers/    # AuthProvider
│   ├── routes/       # route definitions per feature
│   └── utils/        # maps, dates helpers
└── features/
    ├── envios/       # shipment management
    ├── viajes/       # trip management
    ├── mapa/         # live map view
    ├── usuarios/     # user management
    ├── home/
    └── login/
```

Each feature follows: `pages/<PageName>/index.jsx` + colocated components, hooks, and constants.

## Conventions

- Feature-scoped API calls live in `features/<feature>/api/<feature>.api.js`.
- Mock data is **only in `*.test.*` files** — all production code uses real API calls. ESLint rule `no-restricted-imports` prevents importing mock files from non-test code.
- Form state via `@mantine/form`; validation schema via Zod 4 with `schemaResolver` from `@mantine/form` (Standard Schema nativo, NO usar librerías externas de resolver).
- All data comes from the real API; mocks exist only in tests.
- Shared, reusable components go in `src/app/components/`; feature-specific ones stay inside the feature folder.
- Prefer `const` over `let`; never `var`.
- Trailing commas everywhere; single quotes; semicolons required.

## Resources

- Se usa `v8CssVariablesResolver` en `MantineProvider` (App.jsx) para mantener los colores de la variante `light` iguales a v8 (sólidos con transparencia en lugar de valores sólidos puros que introdujo v9).
- Mantine v9 component API reference for LLMs: https://mantine.dev/llms.txt (individual component docs at `https://mantine.dev/llms/<topic>.md`, e.g. `core-empty-state.md`)
