import { CanceledError } from 'axios';

// Reintento ante `503` por contención de locks (SHG-FE-131, decisión sobre
// SHG-BE-118): el backend espera como máximo 5 s por un lock y, si se vence o hay
// deadlock, responde `503` con `Retry-After` (segundos) ANTES de confirmar la
// transacción, así que reintentar no duplica la escritura.
//
// - Sólo `503`: `500`, `502`, `504` y los `4xx` no se reintentan.
// - Hasta `MAX_503_RETRIES` reintentos, esperando lo que diga `Retry-After`
//   (o `DEFAULT_503_WAIT_MS` si no viene o no se entiende).
// - La espera ACUMULADA entre todos los reintentos de una request no pasa de
//   `MAX_503_TOTAL_WAIT_MS`: un `Retry-After` más largo se recorta al resto del
//   presupuesto, y con el presupuesto agotado ya no se reintenta.
// - Si la request se cancela (AbortSignal / cancelToken) durante la espera, se
//   corta enseguida con un `CanceledError` (no se reintenta).
export const MAX_503_RETRIES = 2;
export const DEFAULT_503_WAIT_MS = 1_000;
export const MAX_503_TOTAL_WAIT_MS = 10_000;

/**
 * Lee `Retry-After` (segundos, o una fecha HTTP) y lo devuelve en ms.
 * `null` si no vino o no se puede interpretar.
 */
export const parseRetryAfterMs = (headers, now = Date.now()) => {
  const raw =
    typeof headers?.get === 'function'
      ? headers.get('retry-after')
      : (headers?.['retry-after'] ?? headers?.['Retry-After']);
  if (raw === undefined || raw === null) return null;
  const value = String(raw).trim();
  if (value === '') return null;
  if (/^\d+(\.\d+)?$/.test(value)) return Math.round(Number(value) * 1000);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, date - now);
};

const isAlreadyCanceled = (config) =>
  Boolean(config?.signal?.aborted) || Boolean(config?.cancelToken?.reason);

/**
 * Devuelve cuántos ms esperar antes de reintentar este error, o `null` si NO
 * corresponde reintentar (no es 503, se agotó el tope, request cancelada, ...).
 */
export const nextRetryDelayMs = (error) => {
  const config = error?.config;
  if (!config || error?.response?.status !== 503) return null;
  if (isAlreadyCanceled(config)) return null;

  const attempts = config._retry503Count ?? 0;
  const waited = config._retry503WaitedMs ?? 0;
  if (attempts >= MAX_503_RETRIES) return null;

  const remaining = MAX_503_TOTAL_WAIT_MS - waited;
  if (remaining <= 0) return null;

  const requested = parseRetryAfterMs(error.response.headers) ?? DEFAULT_503_WAIT_MS;
  return Math.min(requested, remaining);
};

/**
 * Espera `ms` respetando la cancelación de la request: si se aborta durante la
 * espera, rechaza con `CanceledError` (`code: 'ERR_CANCELED'`, que
 * `classifyConnectionError` NO trata como problema de conexión).
 */
export const waitForRetry = (ms, config) =>
  new Promise((resolve, reject) => {
    const { signal, cancelToken } = config ?? {};
    let timer;
    let unsubscribeToken;

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', onSignalAbort);
      unsubscribeToken?.();
    };

    function onAbort(reason) {
      cleanup();
      reject(
        reason instanceof CanceledError
          ? reason
          : new CanceledError(undefined, config),
      );
    }

    function onSignalAbort() {
      onAbort();
    }

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    signal?.addEventListener?.('abort', onSignalAbort, { once: true });
    if (cancelToken?.subscribe) {
      cancelToken.subscribe(onAbort);
      unsubscribeToken = () => cancelToken.unsubscribe?.(onAbort);
    }
  });

/**
 * Si el error es un `503` reintentable, espera y repite la request con `client`.
 * Devuelve la promesa del reintento, o `null` si no corresponde reintentar.
 */
export const retryOn503 = (client, error) => {
  const delay = nextRetryDelayMs(error);
  if (delay === null) return null;

  const config = error.config;
  config._retry503Count = (config._retry503Count ?? 0) + 1;
  config._retry503WaitedMs = (config._retry503WaitedMs ?? 0) + delay;

  return waitForRetry(delay, config).then(() => client(config));
};
