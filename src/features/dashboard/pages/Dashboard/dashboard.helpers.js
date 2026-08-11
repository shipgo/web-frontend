import dayjs from 'dayjs';

export const SUCURSALES = [
  { value: 'caba-centro', label: 'CABA Centro' },
  { value: 'rosario', label: 'Rosario' },
  { value: 'cordoba', label: 'Córdoba' },
  { value: 'mendoza', label: 'Mendoza' },
  { value: 'la-plata', label: 'La Plata' },
];

// Each entry only defines the date range — sucursal is always preserved from the current form state.
export const QUICK_FILTERS = [
  { label: 'Hoy', getDateRange: () => [dayjs().startOf('day'), dayjs()] },
  { label: 'Últimos 7 días', getDateRange: () => [dayjs().subtract(7, 'day'), dayjs()] },
  { label: 'Último mes', getDateRange: () => [dayjs().subtract(1, 'month'), dayjs()] },
  { label: '3 meses', getDateRange: () => [dayjs().subtract(3, 'month'), dayjs()] },
  { label: '6 meses', getDateRange: () => [dayjs().subtract(6, 'month'), dayjs()] },
];

export const getTodayDateRange = () => [dayjs().startOf('day'), dayjs()];

// Returns the time granularity for the dynamic X-axis of charts.
// When all sucursales are selected: group by sucursal.
// When a specific sucursal is selected: group by time based on the date range width.
export const getTimeGranularity = ({ sucursal, date }) => {
  if (!sucursal) return 'sucursales';
  if (!date[0] || !date[1]) return 'dias';
  const diff = dayjs(date[1]).diff(dayjs(date[0]), 'day');
  if (diff <= 7) return 'dias';
  if (diff <= 60) return 'semanas';
  return 'meses';
};

export const getSucursalLabel = (value) =>
  SUCURSALES.find((s) => s.value === value)?.label ?? 'Todas las sucursales';

export const getPeriodoLabel = ({ quickFilterLabel, date, sucursalLabel }) => {
  let periodo;
  if (quickFilterLabel) {
    periodo = quickFilterLabel;
  } else if (date[0] && date[1]) {
    periodo = `${dayjs(date[0]).format('DD/MM')} – ${dayjs(date[1]).format('DD/MM')}`;
  } else {
    periodo = 'Hoy';
  }

  return sucursalLabel && sucursalLabel !== 'Todas las sucursales'
    ? `${periodo} · ${sucursalLabel}`
    : periodo;
};
