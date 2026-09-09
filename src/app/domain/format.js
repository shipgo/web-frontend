/**
 * Formateo de dominio: fechas, teléfono, dirección, peso.
 * Fuente única — las pantallas no arman estos strings a mano.
 */

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
// dayjs no publica `es-AR`; `es` comparte nombres de mes/día y formato D/M/YYYY
// con Argentina. Se aplica por llamada (`.locale('es')`), sin tocar el locale
// global de dayjs. El número (peso) usa `Intl` con `es-AR`.
const LOCALE_DAYJS = 'es';

export const LOCALE = 'es-AR';
const DATE_FORMAT = 'DD/MM/YYYY';
const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm';
export const EMPTY = '—';

/** Fecha corta: `31/12/2026` (o `—` si no es válida). */
export const formatFecha = (value, format = DATE_FORMAT) => {
  const d = dayjs(value).locale(LOCALE_DAYJS);
  return value != null && d.isValid() ? d.format(format) : EMPTY;
};

/** Fecha + hora: `31/12/2026 09:30`. */
export const formatFechaHora = (value, format = DATE_TIME_FORMAT) =>
  formatFecha(value, format);

/** Relativo a ahora: `hace 3 días`. */
export const formatDesdeAhora = (value) => {
  const d = dayjs(value).locale(LOCALE_DAYJS);
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

/**
 * Normaliza el `prefijo` de un contacto (chofer) para armar un link de
 * WhatsApp (`wa.me/54<prefijo><telefono>`) sin duplicar el código de país.
 *
 * En el DTO real que llega del backend (confirmado contra el seed dev —
 * `GET /api/viaje/{id}` → `chofer.prefijo`, ej. `"351"` para Córdoba) el
 * campo es el código de área, no el de país — coincide con la convención ya
 * usada en los mocks de `mapa` (`prefijo: '11'`). Por las dudas también se
 * despoja un código de país (`"+54"` / `"54"`) si alguien lo llegase a
 * cargar ahí, para no terminar con un `54` duplicado en el link.
 */
export const normalizarPrefijoWhatsapp = (prefijo) => {
  if (!prefijo) return "";
  let normalizado = String(prefijo).replace(/^\+/, "").trim();
  if (normalizado.startsWith("54")) {
    normalizado = normalizado.slice(2);
  }
  return normalizado;
};

/**
 * Dígitos (sin separadores) para armar `https://wa.me/54<digitos>` a partir
 * de `{ prefijo, telefono }` de un chofer/contacto.
 */
export const digitosWhatsapp = (prefijo, telefono) =>
  `${normalizarPrefijoWhatsapp(prefijo)}${telefono ?? ""}`.replace(/\D/g, "");

const pesoFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** Peso `1.234,5 kg`. `null`/`undefined` -> `—`. */
export const formatPeso = (kg, { unidad = 'kg' } = {}) => {
  if (kg == null || kg === '' || Number.isNaN(Number(kg))) return EMPTY;
  return `${pesoFmt.format(Number(kg))} ${unidad}`;
};
