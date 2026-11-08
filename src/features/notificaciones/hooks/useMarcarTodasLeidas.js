import { createElement } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

import { notificacionesApi } from '@api';
import { REINTENTAR_MAS_TARDE } from '@copy/common';

import {
  NOTIFICACIONES_HISTORIAL_QUERY_KEY,
  NOTIFICACIONES_QUERY_KEY,
} from '../constants';

const marcarPaginaLeida = (pagina) =>
  Array.isArray(pagina?.content)
    ? {
        ...pagina,
        content: pagina.content.map((n) => (n?.visto ? n : { ...n, visto: true })),
      }
    : pagina;

/**
 * "Marcar todas como leídas" (`PUT /api/notificaciones/leidas`): una sola
 * operación en el backend sobre TODAS las notificaciones del usuario, no sólo
 * las que están cargadas (la campana trae las 10 más recientes y el historial
 * una página). No es "vaciar": no las oculta, quedan en el listado ya leídas.
 *
 * Optimista, igual que `useMarcarLeida`: actualiza la lista de la campana y las
 * páginas ya cargadas del historial al instante (el contador de no leídas baja
 * a 0), restaura el estado previo si falla y avisa, y revalida en `onSettled`.
 */
export const useMarcarTodasLeidas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificacionesApi.marcarTodasLeidas(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICACIONES_QUERY_KEY });
      const previo = queryClient.getQueryData(NOTIFICACIONES_QUERY_KEY);
      const previoHistorial = queryClient.getQueriesData({
        queryKey: NOTIFICACIONES_HISTORIAL_QUERY_KEY,
      });
      queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, (actuales) =>
        Array.isArray(actuales)
          ? actuales.map((n) => (n?.visto ? n : { ...n, visto: true }))
          : actuales,
      );
      queryClient.setQueriesData(
        { queryKey: NOTIFICACIONES_HISTORIAL_QUERY_KEY },
        marcarPaginaLeida,
      );
      return { previo, previoHistorial };
    },
    onError: (error, _vars, context) => {
      if (context?.previo !== undefined) {
        queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, context.previo);
      }
      (context?.previoHistorial ?? []).forEach(([key, paginaPrevia]) => {
        queryClient.setQueryData(key, paginaPrevia);
      });
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      notifications.show({
        title: 'No se pudieron marcar las notificaciones como leídas',
        message: REINTENTAR_MAS_TARDE,
        color: 'red',
        icon: createElement(IconX),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_QUERY_KEY }),
  });
};
