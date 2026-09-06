/**
 * Manejo unificado de errores de la API → toasts + errores de formulario por campo.
 *
 * Fuente de verdad: `planning/CONTRACTS.md §5` (contrato de errores, CERRADO).
 * Reemplaza el parseo ad-hoc que cada pantalla venía haciendo
 * (`error?.response?.data?.mensaje || error?.response?.data?.message`, más un
 * `form.setErrors(Object.fromEntries(...))` puntual en algunos forms).
 *
 * El backend expone exactamente dos shapes de error (ver contrato):
 *
 * - `ErrorResponse`  → `{ statusCode, message }` — TODOS los errores sin
 *   field-errors (400 de negocio, 401, 403, 404, 409, 500).
 * - `ApiFieldError`  → `{ statusCode, message, fields: [{ field, error }] }` —
 *   sólo el 400 de Bean Validation sobre el body.
 *
 * Además se tolera:
 * - El shape default de Spring Boot (`/error`): `{ timestamp, status, error, path }`
 *   (sin `message` ni `statusCode`) — cae al mensaje genérico por código HTTP.
 * - `mensaje` como key de mensaje (compat histórica — hoy el backend usa `message`).
 * - `fieldErrors` / `errors` como nombre del array de field-errors, y
 *   `message` / `mensaje` / `error` como key del texto de cada uno (compat con el
 *   parseo viejo de `CrearEnvios`).
 */

const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Intentá nuevamente.';
const FORBIDDEN_MESSAGE = 'No tenés permisos para esta acción.';
const SERVER_ERROR_MESSAGE =
  'Ocurrió un error en el servidor. Intentá nuevamente en unos minutos.';
const VALIDATION_FALLBACK_MESSAGE = 'Revisá los campos marcados.';

/** Toma el primer array de field-errors que exista, con los nombres conocidos. */
const pickRawFields = (data) => {
  if (Array.isArray(data?.fields)) return data.fields;
  if (Array.isArray(data?.fieldErrors)) return data.fieldErrors;
  if (Array.isArray(data?.errors)) return data.errors;
  return [];
};

/** Texto de mensaje a nivel top-level (`message`, con fallback histórico a `mensaje`). */
const pickMessage = (data) => {
  if (typeof data === 'string') return data.trim() || null;
  return data?.message || data?.mensaje || null;
};

/**
 * Normaliza los `stripPrefix` a un array de strings sin el punto final.
 * Acepta `undefined`, un string (`'viaje'`) o un array (`['viaje', 'puntoEntrega']`).
 */
const toPrefixList = (stripPrefix) => {
  if (!stripPrefix) return [];
  const list = Array.isArray(stripPrefix) ? stripPrefix : [stripPrefix];
  return list
    .filter((p) => typeof p === 'string' && p.length > 0)
    .map((p) => p.replace(/\.$/, ''));
};

/**
 * Cuando NO se pasó `stripPrefix` explícito, detecta un prefijo común: si TODOS
 * los `field` comparten el mismo primer segmento antes de un punto
 * (`viaje.vehiculoID`, `viaje.choferesID`, ...), se asume que el body es un DTO
 * anidado de un solo nivel y se saca ese segmento. Si los nombres están mezclados
 * (`nombre` + `puntoEntrega.numeroCalle`), no se toca nada y hay que pasar
 * `stripPrefix` a mano.
 */
const detectCommonPrefix = (fieldNames) => {
  if (fieldNames.length === 0) return null;
  const firstSegments = fieldNames.map((name) =>
    name.includes('.') ? name.slice(0, name.indexOf('.')) : null,
  );
  const [head] = firstSegments;
  if (head && firstSegments.every((segment) => segment === head)) return head;
  return null;
};

const stripKnownPrefix = (field, prefixes) => {
  for (const prefix of prefixes) {
    if (field.startsWith(`${prefix}.`)) return field.slice(prefix.length + 1);
  }
  return field;
};

/**
 * @typedef {Object} ParsedApiError
 * @property {Record<string, string>} fieldErrors  Listo para `form.setErrors(...)`.
 * @property {string} message                      Texto para el toast.
 * @property {number|null} status                  Código HTTP (o `null` si no hubo respuesta).
 */

/**
 * Parsea un error de axios/API al shape que consumen los formularios.
 *
 * @param {unknown} err  El error tal cual lo tira axios (`err.response.data`, ...).
 * @param {Object} [options]
 * @param {string|string[]} [options.stripPrefix]   Prefijo(s) a sacar de los
 *   nombres de campo cuando el body es anidado (`ViajeReqDTO.viaje` →
 *   `stripPrefix: 'viaje'`, `SucursalReqDTO.puntoEntrega` →
 *   `stripPrefix: 'puntoEntrega'`). Si se omite, se intenta detectar un prefijo
 *   común automáticamente.
 * @param {string} [options.fallbackMessage]        Mensaje si el backend no mandó
 *   uno (no aplica a 403/5xx, que tienen texto propio).
 * @returns {ParsedApiError}
 */
export const parseApiError = (err, options = {}) => {
  const response = err?.response;
  const status = typeof response?.status === 'number' ? response.status : null;
  const data = response?.data;

  const rawFields = pickRawFields(data);
  const parsedFields = rawFields
    .map((item) => ({
      field: item?.field ?? item?.campo,
      error: item?.error ?? item?.message ?? item?.mensaje,
    }))
    .filter((item) => item.field && item.error);

  const explicitPrefixes = toPrefixList(options.stripPrefix);
  const prefixes =
    explicitPrefixes.length > 0
      ? explicitPrefixes
      : [detectCommonPrefix(parsedFields.map((item) => item.field))].filter(
          Boolean,
        );

  const fieldErrors = {};
  for (const { field, error } of parsedFields) {
    const key = stripKnownPrefix(field, prefixes);
    // El primero gana: si el backend manda el mismo campo dos veces, se mantiene
    // el primer error (comportamiento estable).
    if (!(key in fieldErrors)) fieldErrors[key] = error;
  }

  let message;
  if (status === 403) {
    message = FORBIDDEN_MESSAGE;
  } else if (status != null && status >= 500) {
    message = SERVER_ERROR_MESSAGE;
  } else {
    message =
      pickMessage(data) ||
      options.fallbackMessage ||
      (Object.keys(fieldErrors).length > 0
        ? VALIDATION_FALLBACK_MESSAGE
        : DEFAULT_MESSAGE);
  }

  return { fieldErrors, message, status };
};

/**
 * Aplica un error de API a un formulario de `@mantine/form`: marca los campos con
 * error (si los hay) y devuelve el mensaje para el toast.
 *
 * @param {{ setErrors: (errors: Record<string, string>) => void }} form
 * @param {unknown} err
 * @param {Object} [options]  Igual que `parseApiError` (`stripPrefix`, `fallbackMessage`).
 * @returns {string}  El mensaje para mostrar en el toast.
 */
export const applyApiError = (form, err, options = {}) => {
  const { fieldErrors, message, status } = parseApiError(err, options);

  if (Object.keys(fieldErrors).length > 0) {
    form.setErrors(fieldErrors);
  }

  if (status != null && status >= 500) {
    // El 5xx siempre se loguea, más allá de que cada pantalla loguee o no.
    console.error('[apiError] 5xx del backend:', err);
  }

  return message;
};
