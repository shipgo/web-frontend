import dayjs from 'dayjs';

const FMT = 'YYYY-MM-DD';

/** `dayjs` → `'YYYY-MM-DD'` (lo que espera el backend para `desde` / `hasta`). */
const iso = (d) => dayjs(d).format(FMT);

/**
 * Quick-filters de período. Todos abarcan >= 2 días distintos a propósito: el
 * backend (`DashboardService.validarPeriodo`) exige `hasta > desde` y rechaza con
 * 400 un rango de un solo día. El más chico es "Últimos 7 días", que también es el
 * default al entrar a la pantalla.
 */
export const QUICK_FILTERS = [
  { label: 'Últimos 7 días', getRange: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { label: 'Últimos 15 días', getRange: () => [dayjs().subtract(14, 'day'), dayjs()] },
  { label: 'Último mes', getRange: () => [dayjs().subtract(1, 'month'), dayjs()] },
  { label: '3 meses', getRange: () => [dayjs().subtract(3, 'month'), dayjs()] },
  { label: '6 meses', getRange: () => [dayjs().subtract(6, 'month'), dayjs()] },
];

export const DEFAULT_QUICK_FILTER = QUICK_FILTERS[0].label;

/** Rango `[desde, hasta]` (strings `YYYY-MM-DD`) del quick-filter default. */
export const getDefaultDateRange = () => QUICK_FILTERS[0].getRange().map(iso);

/** Estado inicial de los filtros del dashboard. */
export const getDefaultFiltros = () => ({
  date: getDefaultDateRange(),
  sucursalId: null,
  quickFilterLabel: DEFAULT_QUICK_FILTER,
});

/** Rango `[desde, hasta]` (strings) de un quick-filter por label. */
export const getQuickFilterRange = (label) => {
  const found = QUICK_FILTERS.find((f) => f.label === label);
  return found ? found.getRange().map(iso) : null;
};

/**
 * Traduce el estado de filtros al shape que consumen los endpoints del dashboard.
 * Devuelve `null` mientras el rango esté incompleto (el usuario todavía no eligió
 * las dos puntas), para que las queries queden deshabilitadas.
 *
 * Si `desde === hasta` (rango de un día que el usuario armó a mano en el
 * calendario) se corre `hasta` un día para adelante: el backend rechaza los rangos
 * de un solo día. Ver "Bitácora" en `planning/tasks/SHG-FE-015.md` (se sugiere
 * relajar esa validación en backend).
 */
export const toDashboardParams = (filtros) => {
  const [desde, hastaRaw] = filtros?.date ?? [];
  if (!desde || !hastaRaw) return null;

  const hasta = desde === hastaRaw ? iso(dayjs(hastaRaw).add(1, 'day')) : hastaRaw;
  const sucursalId =
    filtros.sucursalId != null && filtros.sucursalId !== ''
      ? Number(filtros.sucursalId)
      : null;

  return { desde, hasta, sucursalId };
};

/** Texto del período para el subtítulo de cada card. */
export const getPeriodoLabel = (filtros, sucursalLabel) => {
  const [desde, hasta] = filtros?.date ?? [];
  let periodo;
  if (filtros?.quickFilterLabel) {
    periodo = filtros.quickFilterLabel;
  } else if (desde && hasta) {
    periodo = `${dayjs(desde).format('DD/MM')} – ${dayjs(hasta).format('DD/MM')}`;
  } else {
    periodo = DEFAULT_QUICK_FILTER;
  }

  return sucursalLabel ? `${periodo} · ${sucursalLabel}` : periodo;
};
