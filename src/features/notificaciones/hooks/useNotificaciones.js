import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificacionesApi } from '@api';

import {
  NOTIFICACIONES_QUERY_KEY,
  NOTIFICACIONES_REFETCH_MS,
} from '../constants';

const porFechaDesc = (a, b) =>
  new Date(b?.fecha ?? 0).getTime() - new Date(a?.fecha ?? 0).getTime();

/**
 * Lista de notificaciones in-app del usuario logueado (`GET /api/notificaciones`,
 * top 10 más recientes según el backend) + contador de no leídas + acción
 * "marcar leída".
 *
 * "Marcar leída" es `DELETE /api/notificaciones/{id}`: el backend tiene
 * `@SQLDelete(... SET visto=true ...)`, así que el borrado es un soft-delete que
 * sólo marca la notificación como vista (sigue apareciendo en el listado, ya
 * leída). No hay endpoint de "marcar todas".
 *
 * El `refetchInterval` es el fallback in-app: si el push llega, el listener de
 * OneSignal (`usePushNotifications`) invalida esta query al instante.
 */
export const useNotificaciones = ({ enabled = true } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICACIONES_QUERY_KEY,
    queryFn: () => notificacionesApi.getMias(),
    enabled,
    refetchInterval: enabled ? NOTIFICACIONES_REFETCH_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const notificaciones = useMemo(
    () => [...(query.data ?? [])].sort(porFechaDesc),
    [query.data],
  );

  const unreadCount = useMemo(
    () => notificaciones.filter((n) => !n?.visto).length,
    [notificaciones],
  );

  const marcarLeida = useMutation({
    mutationFn: (id) => notificacionesApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_QUERY_KEY }),
  });

  return {
    ...query,
    notificaciones,
    unreadCount,
    marcarLeida,
  };
};
