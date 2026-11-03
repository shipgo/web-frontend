import { createElement, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

import { notificacionesApi } from '@api';
import { REINTENTAR_MAS_TARDE } from '@copy/common';

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
 * Ambas acciones son optimistas (SHG-FE-141): el cache cambia en `onMutate`,
 * se revierte en `onError` y se revalida en `onSettled`.
 *
 * "Vaciar todas" es `DELETE /api/notificaciones` (sin `{id}`, `SHG-BE-058`):
 * marca `oculta=true` en todas las notificaciones del usuario, así que el
 * listado (y el conteo de no leídas) queda en blanco tras invalidar la query.
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

  // Actualización optimista (SHG-FE-141): la notificación pasa a leída en
  // pantalla (punto rojo, negrita y contador) sin esperar al backend. Si el
  // pedido falla se restaura sólo esa notificación (no el snapshot entero, para
  // no pisar otras marcas en vuelo) y se avisa.
  const marcarLeida = useMutation({
    mutationFn: (id) => notificacionesApi.delete(id),
    onMutate: async (id) => {
      // Sin esto, un refetch en vuelo (intervalo o push) pisaría el cambio
      // optimista con datos viejos al resolver.
      await queryClient.cancelQueries({ queryKey: NOTIFICACIONES_QUERY_KEY });
      const previo = queryClient.getQueryData(NOTIFICACIONES_QUERY_KEY);
      queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, (actuales) =>
        Array.isArray(actuales)
          ? actuales.map((n) => (n?.id === id ? { ...n, visto: true } : n))
          : actuales,
      );
      return { previo };
    },
    onError: (error, id, context) => {
      const original = context?.previo?.find((n) => n?.id === id);
      if (original) {
        queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, (actuales) =>
          Array.isArray(actuales)
            ? actuales.map((n) => (n?.id === id ? original : n))
            : actuales,
        );
      }
      console.error('Error al marcar la notificación como leída:', error);
      notifications.show({
        title: 'No se pudo marcar la notificación como leída',
        message: REINTENTAR_MAS_TARDE,
        color: 'red',
        icon: createElement(IconX),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_QUERY_KEY }),
  });

  // "Vaciar todas" también es optimista: ya hay un modal de confirmación y el
  // listado queda vacío al instante; si falla, vuelve el listado original.
  const vaciarTodas = useMutation({
    mutationFn: () => notificacionesApi.vaciarTodas(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICACIONES_QUERY_KEY });
      const previo = queryClient.getQueryData(NOTIFICACIONES_QUERY_KEY);
      queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, []);
      return { previo };
    },
    onError: (error, _vars, context) => {
      if (context?.previo !== undefined) {
        queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, context.previo);
      }
      console.error('Error al vaciar las notificaciones:', error);
      notifications.show({
        title: 'No se pudieron vaciar las notificaciones',
        message:
          error.response?.data?.message ||
          REINTENTAR_MAS_TARDE,
        color: 'red',
        icon: createElement(IconX),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_QUERY_KEY }),
  });

  return {
    ...query,
    notificaciones,
    unreadCount,
    marcarLeida,
    vaciarTodas,
  };
};
