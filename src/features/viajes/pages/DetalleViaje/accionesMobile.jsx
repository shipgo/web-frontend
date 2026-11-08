import { IconBan, IconEdit, IconFlagCheck, IconPlayerPlay } from '@tabler/icons-react';

import { puedeCancelar, puedeEditar, puedeFinalizar, puedeReanudar } from './acciones';

/**
 * Acciones disponibles según rol + estado, para la barra fija de mobile.
 * La principal es la primera aplicable (editar > finalizar > reanudar); el resto
 * va al menú de tres puntos, con "Cancelar viaje" (destructiva) siempre ahí
 * salvo que sea la única.
 */
export const buildAccionesMobile = (user, viaje, { onEditar, onFinalizar, onReanudar, onCancelar }) => {
  const lista = [];
  if (puedeEditar(user, viaje.estado)) lista.push({ key: 'editar', label: 'Editar', icon: <IconEdit size={18} />, onClick: onEditar });
  if (puedeFinalizar(user, viaje.estado)) lista.push({ key: 'finalizar', label: 'Finalizar', icon: <IconFlagCheck size={18} />, onClick: onFinalizar });
  if (puedeReanudar(user, viaje.estado)) lista.push({ key: 'reanudar', label: 'Reanudar', icon: <IconPlayerPlay size={18} />, onClick: onReanudar });
  if (puedeCancelar(user, viaje.estado)) {
    lista.push({ key: 'cancelar', label: 'Cancelar viaje', icon: <IconBan size={18} />, color: 'red', onClick: onCancelar, dividerBefore: true });
  }
  if (lista.length === 0) return null;
  const [primary, ...actions] = lista;
  return { primary, actions };
};
