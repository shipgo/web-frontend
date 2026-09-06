import { useQuery } from '@tanstack/react-query';

import { publicTrackingApi } from '../api/tracking.api';

/**
 * Clasifica el error del endpoint público de tracking a partir del status HTTP.
 *
 * - `404` → el backend no revela si el código existe: mensaje genérico "no encontrado".
 * - `429` → rate-limit por IP (`PublicTrackingRateLimitFilter`): "demasiadas consultas".
 * - sin `response` → problema de red / servidor caído.
 *
 * @param {unknown} error
 * @returns {'not_found'|'rate_limited'|'network'|'unknown'|null}
 */
export const clasificarErrorTracking = (error) => {
  if (!error) return null;
  const status = error?.response?.status;
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status == null) return 'network';
  return 'unknown';
};

/**
 * Consulta el estado público de un envío por su código de seguimiento.
 *
 * @param {string|null|undefined} codigo Código ya normalizado. Si es falsy la query queda inactiva.
 * @param {{ enabled?: boolean }} [options]
 */
export const usePublicTracking = (codigo, { enabled = true } = {}) => {
  const query = useQuery({
    queryKey: ['public-tracking', codigo],
    queryFn: () => publicTrackingApi.track(codigo),
    enabled: Boolean(codigo) && enabled,
    retry: false,
  });

  return { ...query, errorKind: clasificarErrorTracking(query.error) };
};
