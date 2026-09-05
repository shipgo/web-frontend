import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

import { envioApi } from '@api';

import FalloEntregaModalBody from '../components/FalloEntregaModalBody';

/**
 * Notifica según el resultado de una transición de estado de Envío.
 * Mismo criterio que `useViajeAcciones` (`SHG-FE-012`): `SHG-FE-021` (helper
 * global de parseo de errores) todavía no existe.
 *
 * - `409` → el envío no está en un estado que permita la transición → toast
 *   de **warning** con el mensaje del backend (no es un error inesperado).
 * - `403` → rol sin permiso para la acción → toast de error puntual.
 * - Resto → error genérico (`console.error` + toast).
 */
const handleAccionError = (error, accionLabel) => {
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message;

  if (status === 409) {
    notifications.show({
      title: 'No se puede completar la acción',
      message: backendMessage || `El envío no está en un estado que permita ${accionLabel}`,
      color: 'yellow',
      icon: <IconAlertTriangle />,
    });
    return;
  }

  if (status === 403) {
    notifications.show({
      title: 'Sin permisos',
      message: backendMessage || `No tenés permisos para ${accionLabel}`,
      color: 'red',
      icon: <IconX />,
    });
    return;
  }

  console.error(`Error al ${accionLabel}:`, error);
  notifications.show({
    title: 'Error',
    message: backendMessage || `No se pudo completar la acción: ${accionLabel}`,
    color: 'red',
    icon: <IconX />,
  });
};

/**
 * Acciones de ciclo de vida de Envío disponibles en `DetalleEnvio` (`SHG-FE-007`).
 * Cada una abre una confirmación, ejecuta la llamada real (`api/envio.api.js`),
 * muestra un toast de resultado y dispara `onSuccess` (refetch del detalle) si
 * salió bien.
 *
 * `puedeAccionarEntrega` (`../acciones.js`) ya decide si los botones se
 * muestran según estado + rol; acá sólo se ejecuta la transición.
 */
export const useEnvioAcciones = (id, { onSuccess } = {}) => {
  const confirmEntregar = () => {
    modals.openConfirmModal({
      title: 'Entregar envío',
      centered: true,
      children: (
        <Text size="sm">
          ¿Confirmás que el envío #{id} fue entregado? El estado pasará a "Entregado".
        </Text>
      ),
      labels: { confirm: 'Sí, entregar', cancel: 'Volver' },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        try {
          await envioApi.entregar(id);
          notifications.show({
            title: 'Envío entregado',
            message: `El envío #${id} fue marcado como entregado`,
            color: 'green',
            icon: <IconCheck />,
          });
          onSuccess?.();
        } catch (error) {
          handleAccionError(error, 'marcar el envío como entregado');
        }
      },
    });
  };

  const ejecutarFalloEntrega = async (motivo) => {
    modals.closeAll();
    try {
      await envioApi.falloEntrega(id, { motivo });
      notifications.show({
        title: 'Fallo de entrega registrado',
        message: `El envío #${id} fue marcado como rechazado`,
        color: 'green',
        icon: <IconCheck />,
      });
      onSuccess?.();
    } catch (error) {
      handleAccionError(error, 'registrar el fallo de entrega');
    }
  };

  const confirmFalloEntrega = () => {
    modals.open({
      title: 'Marcar fallo de entrega',
      centered: true,
      children: (
        <FalloEntregaModalBody id={id} onConfirmar={ejecutarFalloEntrega} onVolver={() => modals.closeAll()} />
      ),
    });
  };

  return { confirmEntregar, confirmFalloEntrega };
};
