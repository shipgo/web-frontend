import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { portalApi } from '../../../api/portal.api';

export const PORTAL_ENVIOS_PAGE_SIZE = 10;

/**
 * Lista paginada de "mis envíos" (`GET /api/envio/mios`, sólo `ROLE_CUSTOMER`).
 *
 * @param {number} page  Página 1-indexed (UI). Se convierte a 0-indexed para el backend.
 */
export const useMisEnvios = (page = 1) => {
  const query = useQuery({
    queryKey: ['portal-envios-mios', page],
    queryFn: () =>
      portalApi.misEnvios({
        page: Math.max(0, page - 1),
        size: PORTAL_ENVIOS_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const data = query.data;
  return {
    ...query,
    envios: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
  };
};
