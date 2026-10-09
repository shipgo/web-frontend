import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

import { viajeApi } from '@api';

import CancelarViajeModalBody from '../components/CancelarViajeModalBody';

/**
 * Notifica según el resultado de una transición de estado de Viaje.
 *
 * - `409` → el viaje no está en un estado que permita la transición (matriz
 *   de `CONTRACT-001` / `acciones.js`) → toast de **warning** con el mensaje
 *   del backend (no es un error inesperado).
 * - `403` → rol sin permiso para la acción → toast de error puntual.
 * - Resto → error genérico (`console.error` + toast).
 */
const handleAccionError = (error, accionLabel) => {
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message;

  if (status === 409) {
    notifications.show({
      title: 'No se puede completar la acción',
      message: backendMessage || `El viaje no está en un estado que permita ${accionLabel}`,
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
 * Acciones de ciclo de vida de Viaje disponibles en `DetalleViaje`
 * (`SHG-FE-012`). Cada una abre una confirmación, ejecuta la llamada real
 * (`api/viaje.api.js`), muestra un toast de resultado y dispara `onSuccess`
 * (refetch del detalle) si salió bien.
 *
 * "Iniciar" no se expone — solo el chofer asignado puede iniciar (backend
 * valida en ViajeService.iniciarViaje), y la web es exclusiva SU/AD (SHG-FE-083).
 * Mobile inicia desde ROLE_CHOFER en su propio repo.
 */
export const useViajeAcciones = (id, { onSuccess } = {}) => {
  const confirmReanudar = () => {
    // Mismo guard contra doble click que `confirmFinalizar`.
    let isRunning = false;
    const modalId = modals.openConfirmModal({
      title: 'Reanudar viaje',
      centered: true,
      children: (
        <Text size="sm">
          ¿Confirmás que el viaje #{id} se reanuda? El estado pasará a "En camino".
        </Text>
      ),
      labels: { confirm: 'Sí, reanudar', cancel: 'Volver' },
      confirmProps: { color: 'green' },
      closeOnConfirm: false,
      onConfirm: async () => {
        if (isRunning) return;
        isRunning = true;
        modals.updateModal({ modalId, confirmProps: { color: 'green', loading: true } });
        try {
          await viajeApi.reanudar(id);
          notifications.show({
            title: 'Viaje reanudado',
            message: `El viaje #${id} volvió a estar en camino`,
            color: 'green',
            icon: <IconCheck />,
          });
          onSuccess?.();
        } catch (error) {
          handleAccionError(error, 'reanudar el viaje');
          // 409: el estado en pantalla puede estar viejo (otro usuario o el
          // chofer ya lo reanudó, o el chofer tiene otro viaje en camino).
          if (error.response?.status === 409) onSuccess?.();
        } finally {
          modals.close(modalId);
        }
      },
    });
  };

  const confirmFinalizar = () => {
    // Guard contra doble click (mismo patrón que `useBulkDelete`): cierra
    // sobre esta apertura del modal y descarta `onConfirm` repetidos.
    let isRunning = false;
    const modalId = modals.openConfirmModal({
      title: 'Finalizar viaje',
      centered: true,
      children: (
        <Text size="sm">
          ¿Confirmás la finalización del viaje #{id}? Usá esta opción sólo para cierres de emergencia; el
          estado pasará a "Finalizado".
        </Text>
      ),
      labels: { confirm: 'Sí, finalizar', cancel: 'Volver' },
      confirmProps: { color: 'green' },
      closeOnConfirm: false,
      onConfirm: async () => {
        if (isRunning) return;
        isRunning = true;
        modals.updateModal({ modalId, confirmProps: { color: 'green', loading: true } });
        try {
          await viajeApi.finalizar(id);
          notifications.show({
            title: 'Viaje finalizado',
            message: `El viaje #${id} fue finalizado correctamente`,
            color: 'green',
            icon: <IconCheck />,
          });
          onSuccess?.();
        } catch (error) {
          handleAccionError(error, 'finalizar el viaje');
        } finally {
          modals.close(modalId);
        }
      },
    });
  };

  const ejecutarCancelar = async (motivo) => {
    // El modal queda abierto (con el botón en loading) hasta que la request
    // termina, y recién ahí se cierra (éxito o error).
    try {
      await viajeApi.cancelar(id, { motivo: motivo?.trim() || undefined });
      notifications.show({
        title: 'Viaje cancelado',
        message: `El viaje #${id} fue cancelado correctamente`,
        color: 'green',
        icon: <IconCheck />,
      });
      modals.closeAll();
      onSuccess?.();
    } catch (error) {
      modals.closeAll();
      handleAccionError(error, 'cancelar el viaje');
    }
  };

  const confirmCancelar = () => {
    modals.open({
      title: 'Cancelar viaje',
      centered: true,
      children: (
        <CancelarViajeModalBody id={id} onCancelar={ejecutarCancelar} onVolver={() => modals.closeAll()} />
      ),
    });
  };

  return { confirmFinalizar, confirmReanudar, confirmCancelar };
};
