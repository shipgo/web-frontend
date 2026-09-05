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
 * `puedeIniciar`/`puedeFinalizar`/`puedeCancelar` (`../acciones.js`) ya deciden
 * si el botón se muestra según estado + rol; acá sólo se ejecuta la transición.
 */
export const useViajeAcciones = (id, { onSuccess } = {}) => {
  const confirmIniciar = () => {
    modals.openConfirmModal({
      title: 'Iniciar viaje',
      centered: true,
      children: <Text size="sm">¿Confirmás el inicio del viaje #{id}? El estado pasará a "En camino".</Text>,
      labels: { confirm: 'Sí, iniciar', cancel: 'Volver' },
      confirmProps: { color: 'blue' },
      onConfirm: async () => {
        try {
          await viajeApi.iniciar(id);
          notifications.show({
            title: 'Viaje iniciado',
            message: `El viaje #${id} se inició correctamente`,
            color: 'green',
            icon: <IconCheck />,
          });
          onSuccess?.();
        } catch (error) {
          handleAccionError(error, 'iniciar el viaje');
        }
      },
    });
  };

  const confirmFinalizar = () => {
    modals.openConfirmModal({
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
      onConfirm: async () => {
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
        }
      },
    });
  };

  const ejecutarCancelar = async (motivo) => {
    modals.closeAll();
    try {
      await viajeApi.cancelar(id, { motivo: motivo?.trim() || undefined });
      notifications.show({
        title: 'Viaje cancelado',
        message: `El viaje #${id} fue cancelado correctamente`,
        color: 'green',
        icon: <IconCheck />,
      });
      onSuccess?.();
    } catch (error) {
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

  return { confirmIniciar, confirmFinalizar, confirmCancelar };
};
