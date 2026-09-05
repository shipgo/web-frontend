import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

import { envioApi } from '@api';

/**
 * Hook para manejar la eliminación de envíos con confirmación.
 *
 * `DELETE /api/envio/{id}` (SHG-BE-019) — soft-delete real:
 * - `200` → éxito, se dispara `onSuccess` (refetch de la lista).
 * - `404` → el envío no existe (o ya fue borrado) → toast de **error**.
 * - `409` → el envío está en un estado no borrable (`asignado_a_viaje` /
 *   `en_vehiculo` / `en_camino` / `entregado`) → toast de **warning** (no error
 *   genérico) con el `message` que manda el backend. Es un caso esperable, no
 *   rompe la lista.
 */
export const useDeleteEnvio = (onSuccess) => {
  const confirmDelete = (envio) => {
    const identificador = envio.codigoSeguimiento || `envío #${envio.id}`;

    modals.openConfirmModal({
      title: 'Eliminar envío',
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar el envío <strong>{identificador}</strong>? Esta acción no se
          puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await envioApi.delete(envio.id);

          notifications.show({
            title: 'Envío eliminado',
            message: `El envío ${identificador} fue eliminado correctamente`,
            color: 'green',
            icon: <IconCheck />,
          });

          onSuccess?.();
        } catch (error) {
          const status = error.response?.status;
          const backendMessage = error.response?.data?.message;

          if (status === 409) {
            notifications.show({
              title: 'No se puede eliminar',
              message:
                backendMessage || `El envío ${identificador} está en un estado que no permite eliminarlo`,
              color: 'yellow',
              icon: <IconAlertTriangle />,
            });
            return;
          }

          if (status === 404) {
            notifications.show({
              title: 'Envío no encontrado',
              message: backendMessage || `El envío ${identificador} ya no existe`,
              color: 'red',
              icon: <IconX />,
            });
            return;
          }

          console.error('Error eliminando envío:', error);
          notifications.show({
            title: 'Error',
            message: backendMessage || 'No se pudo eliminar el envío',
            color: 'red',
            icon: <IconX />,
          });
        }
      },
    });
  };

  return { confirmDelete };
};
