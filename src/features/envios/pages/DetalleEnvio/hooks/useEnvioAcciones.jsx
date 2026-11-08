import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

import { useIsMobile } from '@hooks/useIsMobile';
import { envioApi } from '@api';

import ConfirmarRetiroModalBody from '../components/ConfirmarRetiroModalBody';
import EntregarModalBody from '../components/EntregarModalBody';
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
const handleAccionError = (error, accionLabel, estadosPermitidos) => {
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message;

  if (status === 409) {
    notifications.show({
      title: 'Acción no disponible',
      message:
        backendMessage ||
        `Solo se puede ${accionLabel} cuando el envío está ${estadosPermitidos}.`,
      color: 'yellow',
      icon: <IconAlertTriangle />,
    });
    return;
  }

  if (status === 403) {
    notifications.show({
      title: 'Acción no permitida',
      message: backendMessage || 'No tenés permiso para hacer esto.',
      color: 'red',
      icon: <IconX />,
    });
    return;
  }

  console.error(`Error al ${accionLabel}:`, error);
  notifications.show({
    title: 'No se pudo completar la acción',
    message: backendMessage || `No se pudo ${accionLabel}. Probá de nuevo en unos minutos.`,
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
 * `tienePalabraEntrega` (`EnvioDTO`, `SHG-CONTRACT-024`/`025`): `false` oculta el
 * campo de la palabra en los modales de entrega y retiro; ausente = como antes.
 *
 * `puedeAccionarEntrega` (`../acciones.js`) ya decide si los botones se
 * muestran según estado + rol; acá sólo se ejecuta la transición.
 */
export const useEnvioAcciones = (id, { onSuccess, tienePalabraEntrega } = {}) => {
  // Web mobile: los modales de acción abren a pantalla completa (formulario + botones alcanzables).
  const isMobile = useIsMobile();

  const confirmEntregar = () => {
    modals.open({
      title: 'Entregar envío',
      centered: true,
      fullScreen: isMobile,
      children: (
        <EntregarModalBody
          id={id}
          tienePalabraEntrega={tienePalabraEntrega}
          onVolver={() => modals.closeAll()}
          onEntregado={() => {
            modals.closeAll();
            notifications.show({
              title: 'Envío entregado',
              message: `El envío #${id} quedó como Entregado.`,
              color: 'green',
              icon: <IconCheck />,
            });
            onSuccess?.();
          }}
          // Errores sin campo asociado (403/409/5xx/red) — el modal sigue
          // abierto (`EntregarModalBody` no lo cierra en error), acá sólo se
          // reutiliza el toast estándar del resto de las acciones del panel.
          onErrorInesperado={(_message, error) =>
            handleAccionError(error, 'marcar el envío como entregado', 'En vehículo o En camino')
          }
        />
      ),
    });
  };

  const ejecutarFalloEntrega = async (motivo) => {
    modals.closeAll();
    try {
      await envioApi.falloEntrega(id, { motivo });
      notifications.show({
        title: 'Entrega fallida registrada',
        message: `El envío #${id} quedó como No entregado.`,
        color: 'green',
        icon: <IconCheck />,
      });
      onSuccess?.();
    } catch (error) {
      handleAccionError(error, 'registrar la entrega fallida', 'En vehículo o En camino');
    }
  };

  const confirmFalloEntrega = () => {
    modals.open({
      title: 'Registrar entrega fallida',
      centered: true,
      fullScreen: isMobile,
      children: (
        <FalloEntregaModalBody id={id} onConfirmar={ejecutarFalloEntrega} onVolver={() => modals.closeAll()} />
      ),
    });
  };

  /**
   * "Confirmar retiro" en sucursal (`SHG-FE-080`) — mismo endpoint/transición
   * que `confirmEntregar`, distinto modal (DNI + palabra ambos obligatorios,
   * `puedeConfirmarRetiro` en `../acciones.js` decide cuándo se ofrece).
   */
  const confirmRetiroSucursal = () => {
    modals.open({
      title: 'Confirmar retiro en sucursal',
      centered: true,
      fullScreen: isMobile,
      children: (
        <ConfirmarRetiroModalBody
          id={id}
          tienePalabraEntrega={tienePalabraEntrega}
          onVolver={() => modals.closeAll()}
          onRetirado={() => {
            modals.closeAll();
            notifications.show({
              title: 'Retiro confirmado',
              message: `El envío #${id} quedó como Entregado.`,
              color: 'green',
              icon: <IconCheck />,
            });
            onSuccess?.();
          }}
          onErrorInesperado={(_message, error) =>
            handleAccionError(error, 'confirmar el retiro del envío', 'En sucursal')
          }
        />
      ),
    });
  };

  return { confirmEntregar, confirmFalloEntrega, confirmRetiroSucursal };
};
