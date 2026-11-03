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

const marcarEnPagina = (pagina, id, cambio) =>
  Array.isArray(pagina?.content)
    ? {
        ...pagina,
        content: pagina.content.map((n) => (n?.id === id ? cambio(n) : n)),
      }
    : pagina;

/**
 * "Marcar como leída" (`DELETE /api/notificaciones/{id}`: soft-delete que sólo
 * pone `visto=true`) con actualización optimista (SHG-FE-141) sobre las DOS
 * vistas de la misma notificación: la lista de la campana
 * (`NOTIFICACIONES_QUERY_KEY`, array) y las páginas ya cargadas del historial
 * (`NOTIFICACIONES_HISTORIAL_QUERY_KEY`, `Page`; SHG-FE-142). Así marcar desde
 * cualquiera de las dos pantallas actualiza la otra (punto rojo, negrita y
 * contador) sin esperar al backend.
 *
 * Si el pedido falla se restaura sólo esa notificación (no el snapshot entero,
 * para no pisar otras marcas en vuelo) y se avisa. En `onSettled` se invalida
 * la clave raíz: revalida la campana y el historial.
 */
export const useMarcarLeida = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificacionesApi.delete(id),
    onMutate: async (id) => {
      // Sin esto, un refetch en vuelo (intervalo o push) pisaría el cambio
      // optimista con datos viejos al resolver. Cancela también el historial
      // (cuelga de la misma clave raíz).
      await queryClient.cancelQueries({ queryKey: NOTIFICACIONES_QUERY_KEY });
      const previo = queryClient.getQueryData(NOTIFICACIONES_QUERY_KEY);
      const previoHistorial = queryClient.getQueriesData({
        queryKey: NOTIFICACIONES_HISTORIAL_QUERY_KEY,
      });
      queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, (actuales) =>
        Array.isArray(actuales)
          ? actuales.map((n) => (n?.id === id ? { ...n, visto: true } : n))
          : actuales,
      );
      queryClient.setQueriesData(
        { queryKey: NOTIFICACIONES_HISTORIAL_QUERY_KEY },
        (pagina) => marcarEnPagina(pagina, id, (n) => ({ ...n, visto: true })),
      );
      return { previo, previoHistorial };
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
      (context?.previoHistorial ?? []).forEach(([key, paginaPrevia]) => {
        const originalHistorial = paginaPrevia?.content?.find((n) => n?.id === id);
        if (originalHistorial) {
          queryClient.setQueryData(key, (pagina) =>
            marcarEnPagina(pagina, id, () => originalHistorial),
          );
        }
      });
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
};
