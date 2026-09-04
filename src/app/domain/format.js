/**
 * Formateo de dominio: fechas, teléfono, dirección, peso.
 * Fuente única — las pantallas no arman estos strings a mano.
 */

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
// dayjs no publica `es-AR`; `es` comparte nombres de mes/día y formato
// D/M/YYYY con Argentina. El número (peso) usa `Intl` con `es-AR`.
dayjs.locale('es');

export const LOCALE = 'es-AR';
const DATE_FORMAT = 'DD/MM/YYYY';
const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm';
export const EMPTY = '—';

/** Fecha corta: `31/12/2026` (o `—` si no es válida). */
export const formatFecha = (value, format = DATE_FORMAT) => {
  const d = dayjs(value);
  return value != null && d.isValid() ? d.format(format) : EMPTY;
};

/** Fecha + hora: `31/12/2026 09:30`. */
export const formatFechaHora = (value, format = DATE_TIME_FORMAT) =>
  formatFecha(value, format);

/** Relativo a ahora: `hace 3 días`. */
export const formatDesdeAhora = (value) => {
  const d = dayjs(value);
  return value != null && d.isValid() ? d.fromNow() : EMPTY;
};

/**
 * Teléfono `+54 3411234567`. Acepta `(prefijo, telefono)` o un objeto
 * `{ prefijo, telefono }`.
 */
export const formatTelefono = (prefijo, telefono) => {
  const p = prefijo && typeof prefijo === 'object' ? prefijo : { prefijo, telefono };
  const partes = [p.prefijo, p.telefono]
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter(Boolean);
  return partes.length ? partes.join(' ') : EMPTY;
};

/**
 * Dirección legible a partir de un `PuntoEntrega`-like
 * `{ nombreCalle, numeroCalle, localidad: { nombre, provincia: { nombre } } }`.
 * `opts.completa` agrega localidad y provincia.
 */
export const formatDireccion = (destino, { completa = false } = {}) => {
  if (!destino) return EMPTY;
  const calle = [destino.nombreCalle, destino.numeroCalle]
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter(Boolean)
    .join(' ');
  if (!completa) return calle || EMPTY;

  const localidad = destino.localidad?.nombre;
  const provincia = destino.localidad?.provincia?.nombre;
  const resto = [localidad, provincia].filter(Boolean).join(', ');
  return [calle, resto].filter(Boolean).join(' · ') || EMPTY;
};

const pesoFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** Peso `1.234,5 kg`. `null`/`undefined` -> `—`. */
export const formatPeso = (kg, { unidad = 'kg' } = {}) => {
  if (kg == null || kg === '' || Number.isNaN(Number(kg))) return EMPTY;
  return `${pesoFmt.format(Number(kg))} ${unidad}`;
};
