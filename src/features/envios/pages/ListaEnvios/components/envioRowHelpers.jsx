import {
  IconEdit,
  IconFileDescription,
  IconMapSearch,
  IconPrinter,
  IconTrash,
} from '@tabler/icons-react';

import { ESTADOS_VIAJE_CON_TRACKING, normalizarEstado } from '@domain/estados';

import { esEnvioEditable, getViajeAsociado } from '../../../utils';

/** Fecha de alta = `historialEstado` con `estado === 'creado'` (CONTRACTS.md §4 / SHG-BE-004). */
export const getFechaAlta = (envio) =>
  (envio.historialEstado ?? []).find((h) => h.estado === 'creado')?.fechaHoraInicio ?? null;

/**
 * "Localizar" (SHG-FE-097): habilitado sólo si el envío tiene un viaje
 * asociado (`getViajeAsociado`) y ese viaje está en un estado trackeable
 * (`ESTADOS_VIAJE_CON_TRACKING`, mismo criterio que "Monitorear" en
 * `ListaViajesTabla`, SHG-FE-096). Si no, queda deshabilitado con un tooltip
 * que explica por qué (envío sin viaje vs. viaje todavía no despachado / ya
 * cerrado).
 */
const getLocalizarAction = (envio, onLocalizar) => {
  const viajeAsociado = getViajeAsociado(envio);
  const trackeable = !!viajeAsociado && ESTADOS_VIAJE_CON_TRACKING.includes(normalizarEstado(viajeAsociado.estado));

  if (trackeable) {
    return {
      icon: <IconMapSearch size={18} />,
      label: 'Ver en el mapa',
      onClick: () => onLocalizar(viajeAsociado.id),
    };
  }

  return {
    icon: <IconMapSearch size={18} />,
    label: 'Ver en el mapa',
    disabled: true,
    tooltip: viajeAsociado
      ? 'Disponible cuando el envío esté en camino.'
      : 'Este envío todavía no fue asignado a un viaje.',
  };
};

export const getActionsForRow = (envio, { onEditar, onVerDetalles, onEliminar, onLocalizar, onImprimirEtiqueta }) => {

  return [
    {
      name: 'Detalles',
      items: [
        getLocalizarAction(envio, onLocalizar),
        { icon: <IconFileDescription size={18} />, label: 'Ver detalles', onClick: onVerDetalles },
        {
          icon: <IconPrinter size={18} />,
          label: 'Imprimir etiqueta',
          disabled: !envio.codigoSeguimiento,
          tooltip: envio.codigoSeguimiento ? undefined : 'Este envío no tiene código de seguimiento.',
          onClick: onImprimirEtiqueta,
        },
      ],
    },
    {
      name: 'Opciones',
      items: [
        { icon: <IconEdit size={18} />, label: 'Editar', color: 'blue', disabled: !esEnvioEditable(envio), onClick: onEditar },
        { icon: <IconTrash size={18} />, label: 'Eliminar', color: 'red', onClick: onEliminar },
      ],
    },
  ];
};

