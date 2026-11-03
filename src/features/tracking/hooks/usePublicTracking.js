import { useQuery } from '@tanstack/react-query';

import { isCaptchaApiError } from '@config/captcha';
import { publicTrackingApi } from '../api/tracking.api';

/**
 * Clasifica el error del endpoint público de tracking a partir del status HTTP.
 *
 * - `404` → el backend no revela si el código existe: mensaje genérico "no encontrado".
 * - `429` → rate-limit por IP (`PublicTrackingRateLimitFilter`): "demasiadas consultas".
 * - `captcha_invalid` → token de Turnstile faltante/vencido (`SHG-BE-032`):
 *   hace falta resolver el captcha de nuevo, no es un error del código.
 * - sin `response` → problema de red / servidor caído.
 *
 * @param {unknown} error
 * @returns {'not_found'|'rate_limited'|'captcha_invalid'|'network'|'unknown'|null}
 */
export const clasificarErrorTracking = (error) => {
  if (!error) return null;
  if (isCaptchaApiError(error)) return 'captcha_invalid';
  const status = error?.response?.status;
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status == null) return 'network';
  return 'unknown';
};

/**
 * Consulta el estado público de un envío por su código de seguimiento.
 *
 * `captchaToken` es OPT-IN (SHG-FE-043): si se pasa (string o `null`), la
 * query queda inactiva hasta que sea un token vigente — así la autoconsulta
 * de `/tracking/:codigo` (guest, `TrackingPublicoPage`) espera a que el
 * widget de Turnstile resuelva antes de pegarle al backend. Si NO se pasa
 * (`undefined`, el default), la query se comporta como antes de esta tarea —
 * usado por `PortalEnvioDetalle` (SHG-FE-026), que muestra el mismo detalle a
 * un CUSTOMER ya autenticado y queda fuera del alcance de esta tarea (no es
 * una superficie pública; ver nota en `SHG-FE-043` sobre "no captcha detrás
 * de login"). Ver la entrada "SHG-FE-043 → BE, gap sin resolver" en
 * `coordination/backend.md` para el detalle de este gap y qué falta resolver
 * antes de activar `turnstile.enabled=true` en un ambiente real.
 *
 * @param {string|null|undefined} codigo Código ya normalizado. Si es falsy la query queda inactiva.
 * @param {{ enabled?: boolean, captchaToken?: string|null }} [options]
 */
export const usePublicTracking = (codigo, { enabled = true, captchaToken } = {}) => {
  const captchaRequired = captchaToken !== undefined;

  const query = useQuery({
    queryKey: ['public-tracking', codigo, captchaToken],
    queryFn: () => publicTrackingApi.track(codigo, captchaToken),
    enabled:
      Boolean(codigo) && enabled && (!captchaRequired || Boolean(captchaToken)),
    retry: false,
  });

  return { ...query, errorKind: clasificarErrorTracking(query.error) };
};
