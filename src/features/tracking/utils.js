/**
 * Helpers del tracking público (guest).
 *
 * El `codigoSeguimiento` que genera el backend (`CodigoSeguimientoGenerator`,
 * `SHG-BE-012`) son 10 caracteres de un alfabeto tipo Crockford Base32
 * (`0-9 A-Z` sin `I`, `L`, `O`, `U`). La validación local es intencionalmente
 * permisiva: sólo evita pegarle al backend con basura obvia (vacío, símbolos,
 * longitud disparatada). El "no encontrado" real lo resuelve el `404`.
 */

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
