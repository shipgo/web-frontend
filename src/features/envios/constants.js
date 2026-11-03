/**
 * Constantes de dominio de Envíos compartidas entre pantallas (`CrearEnvios`/
 * `EditarEnvio` en `SHG-FE-079`, `DetalleEnvio` en `SHG-FE-080`).
 *
 * Fuente de verdad de los valores: `CONTRACTS.md §12` / `ENDPOINTS.md §4`
 * (`SHG-CONTRACT-012` / `SHG-BE-061`). El backend usa minúscula
 * (`"domicilio"` / `"sucursal"`), no el `DOMICILIO`/`SUCURSAL` en mayúscula
 * del contrato de diseño original — desvío aceptado por el owner
 * (`planning/coordination/decisions.md`, 2026-09-22).
 */
export const TIPO_ENTREGA = {
  DOMICILIO: 'domicilio',
  SUCURSAL: 'sucursal',
};

/** Default del backend cuando `tipoEntrega` se omite en el `EnvioReqDTO`. */
export const TIPO_ENTREGA_DEFAULT = TIPO_ENTREGA.DOMICILIO;

/** Opciones para el `SegmentedControl` de elección de tipo de entrega (`SHG-FE-079`). */
export const TIPO_ENTREGA_OPTIONS = [
  { value: TIPO_ENTREGA.DOMICILIO, label: 'Entrega a domicilio' },
  { value: TIPO_ENTREGA.SUCURSAL, label: 'Retiro en sucursal' },
];
