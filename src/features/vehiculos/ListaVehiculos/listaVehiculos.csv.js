import { estadoLabel } from '@domain/estados';

/** Columnas del CSV de vehículos. */
export const VEHICULOS_CSV_COLUMNS = [
  { header: 'Patente', value: (v) => v.patente },
  { header: 'Marca', value: (v) => v.modelo?.marca?.nombre },
  { header: 'Modelo', value: (v) => v.modelo?.nombre },
  { header: 'Tipo', value: (v) => v.tipoVehiculo?.nombre ?? v.tipo },
  { header: 'Sucursal', value: (v) => v.sucursal?.nombre },
  {
    header: 'Estado',
    value: (v) =>
      v.estado ? estadoLabel('vehiculo', v.estado) : '',
  },
  { header: 'Año de compra', value: (v) => v.anioCompra },
];
