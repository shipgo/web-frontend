/**
 * Helpers del tracking público (guest).
 *
 * El `codigoSeguimiento` que genera el backend (`CodigoSeguimientoGenerator`,
 * `SHG-BE-012`) son 10 caracteres de un alfabeto tipo Crockford Base32
 * (`0-9 A-Z` sin `I`, `L`, `O`, `U`). La validación local es intencionalmente
 * permisiva: sólo evita pegarle al backend con basura obvia (vacío, símbolos,
 * longitud disparatada). El "no encontrado" real lo resuelve el `404`.
 */

import dayjs from 'dayjs';

const CODIGO_MIN = 6;
const CODIGO_MAX = 16;
const CODIGO_REGEX = /^[0-9A-Z]+$/;

/** Normaliza el input del usuario: sin espacios ni guiones, en mayúsculas. */
export const normalizarCodigo = (valor) =>
  typeof valor === 'string' ? valor.replace(/[\s-]+/g, '').toUpperCase() : '';

/** `true` si el código tiene forma plausible para consultar al backend. */
export const codigoEsValido = (valor) => {
  const normalizado = normalizarCodigo(valor);
  return (
    normalizado.length >= CODIGO_MIN &&
    normalizado.length <= CODIGO_MAX &&
    CODIGO_REGEX.test(normalizado)
  );
};

export const CODIGO_INVALIDO_MSG =
  'Ingresá un código de seguimiento válido (letras y números, sin espacios).';

/**
 * Fecha de entrega: la del evento `entregado` más reciente del `historial`
 * (`fecha` = cuándo el envío entró a ese estado, `fechaHoraInicio` en el
 * backend). `null` si el envío no fue entregado (no hay evento) o si ninguna
 * fecha es válida.
 */
export const fechaEntrega = (historial) => {
  const fechas = (historial ?? [])
    .filter((h) => h?.estado === 'entregado' && dayjs(h.fecha).isValid())
    .map((h) => h.fecha);
  if (!fechas.length) return null;
  return fechas.reduce((max, f) => (dayjs(f).isAfter(dayjs(max)) ? f : max));
};
