const direccionSucursal = (s) => {
  const puntoEntrega = s.puntoEntrega ?? {};
  return `${puntoEntrega.nombreCalle ?? ''} ${puntoEntrega.numeroCalle ?? ''}`.trim();
};

const telefonoSucursal = (s) =>
  s.prefijo ? `${s.prefijo} ${s.telefono ?? ''}`.trim() : (s.telefono ?? '');

/**
 * Columnas del CSV de "Exportar seleccionados" en Sucursales (SHG-FE-095).
 * Sucursales todavía no tiene un export de listado completo (no hay
 * `useCsvExport` ni botón en `ListaSucursalesHeader`) — estas columnas son
 * sólo para la acción masiva del `SelectionBanner`. Sin "Fecha de registro":
 * `SucursalDTO` no tiene ningún campo de fecha (a diferencia de otras
 * entidades) — pedido de review, SHG-FE-095.
 */
export const SUCURSALES_CSV_COLUMNS = [
  { header: 'Nombre', value: (s) => s.nombre },
  { header: 'Dirección', value: direccionSucursal },
  { header: 'Localidad', value: (s) => s.puntoEntrega?.localidad?.nombre },
  { header: 'Provincia', value: (s) => s.puntoEntrega?.localidad?.provincia?.nombre },
  { header: 'Teléfono', value: telefonoSucursal },
  { header: 'Email', value: (s) => s.email },
];
