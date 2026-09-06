import { toLocalDateTime } from '@utils/dates';

const mecanico = (m) =>
  `${m.nombreMecanico ?? ''} ${m.apellidoMecanico ?? ''}`.trim();

/** Columnas del CSV de mantenimientos. */
export const MANTENIMIENTOS_CSV_COLUMNS = [
  { header: 'Patente', value: (m) => m.vehiculo?.patente },
  { header: 'Marca', value: (m) => m.vehiculo?.modelo?.marca?.nombre },
  { header: 'Modelo', value: (m) => m.vehiculo?.modelo?.nombre },
  { header: 'Tipo de mantenimiento', value: (m) => m.tipoMantenimiento?.nombre },
  { header: 'Mecánico', value: mecanico },
  { header: 'Fecha de mantenimiento', value: (m) => toLocalDateTime(m.fechaHoraMantenimiento) },
  { header: 'Sucursal', value: (m) => m.sucursal?.nombre },
];
