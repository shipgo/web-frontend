import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { notificacionesApi } from '@api';

import {
  NOTIFICACIONES_HISTORIAL_PAGE_SIZE,
  NOTIFICACIONES_HISTORIAL_QUERY_KEY,
} from '../constants';
import { useMarcarLeida } from './useMarcarLeida';

/**
 * Historial paginado de notificaciones del usuario logueado
 * (`GET /api/notificaciones/historial`, SHG-FE-142): todas, sin las vaciadas,
 * más recientes primero. Devuelve un `Page`.
 *
 * @param {number} page Página 1-indexed (UI). Se convierte a 0-indexed para el backend.
 */
export const useNotificacionesHistorial = (page = 1) => {
  const query = useQuery({
    queryKey: [...NOTIFICACIONES_HISTORIAL_QUERY_KEY, page],
    queryFn: () =>
      notificacionesApi.getHistorial({
        page: Math.max(0, page - 1),
        size: NOTIFICACIONES_HISTORIAL_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    retry: false,
  });

  // Optimista sobre la página en pantalla y sobre la campana (`useMarcarLeida`).
  const marcarLeida = useMarcarLeida();

  const data = query.data;
  return {
    ...query,
    notificaciones: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    marcarLeida,
  };
};
