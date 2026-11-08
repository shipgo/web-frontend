import { coincideBusqueda } from '@utils/text';

import { getEstadoVisualViaje } from './estadoVisual';

/** Opciones del selector de sucursal a partir de los viajes en curso. */
export const getSucursalesOptions = (viajes) => {
  const nombres = [...new Set(viajes.map((v) => v.sucursalNombre).filter(Boolean))].sort();
  return [
    { value: 'todas', label: 'Todas las sucursales' },
    ...nombres.map((nombre) => ({ value: nombre, label: nombre })),
  ];
};

/** Filtra por sucursal + búsqueda (patente/chofer) y ordena por prioridad de estado. */
export const filtrarViajes = (viajes, { sucursal, search }) =>
  viajes
    .filter((v) => {
      const matchSucursal = sucursal === 'todas' || v.sucursalNombre === sucursal;
      const matchSearch = coincideBusqueda(search, [v.patente, v.choferNombre]);
      return matchSucursal && matchSearch;
    })
    .sort((a, b) => {
      const prioridadA = getEstadoVisualViaje(a, a.ultimaActualizacion).prioridad;
      const prioridadB = getEstadoVisualViaje(b, b.ultimaActualizacion).prioridad;
      return prioridadA - prioridadB;
    });
