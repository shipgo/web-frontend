import dayjs from 'dayjs';

/**
 * Formato que espera el backend para campos `java.time.LocalDateTime`
 * (`MantenimientoReqDTO.fechaHoraMantenimiento` / `fechaHoraRegistro`): Jackson
 * los deserializa con `DateTimeFormatter.ISO_LOCAL_DATE_TIME`, que NO acepta
 * offset/zona (`Z` o `+00:00`) — sólo `yyyy-MM-ddTHH:mm:ss`.
 *
 * ⚠️ NO usar `dayjs(...).toISOString()` acá: convierte a UTC, agrega el sufijo
 * `Z` + milisegundos (rompe el parseo del backend) y corre la hora local ~3hs
 * (AR = UTC-3). Se manda la hora de pared que eligió el usuario, tal cual.
 * Mismo bug/patrón que `ViajeReqDTO` (ver `CrearViaje/utils.js`, `SHG-FE-008`).
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {string|null}
 */
const LOCAL_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

export const toLocalDateTimeString = (value) => {
  if (value == null) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(LOCAL_DATE_TIME_FORMAT) : null;
};

/**
 * `values` del form (`MANTENIMIENTO_SCHEMA`) -> `MantenimientoReqDTO` del backend.
 * `fechaHoraRegistro` lo resuelve el backend en el alta; en edición se puede
 * pasar `fechaHoraRegistro` para que el `modelMapper` del backend no lo pise con
 * `null` (ver bitácora de `SHG-FE-020`).
 *
 * @param {Object} values
 * @param {{ fechaHoraRegistro?: string }} [extra]
 */
export const buildMantenimientoReqDTO = (values, extra = {}) => {
  const payload = {
    nombreMecanico: values.nombreMecanico.trim(),
    apellidoMecanico: values.apellidoMecanico.trim(),
    vehiculoID: Number(values.vehiculoID),
    tipoMantenimientoID: Number(values.tipoMantenimientoID),
    fechaHoraMantenimiento: toLocalDateTimeString(values.fechaHoraMantenimiento),
    descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
  };

  if (extra.fechaHoraRegistro) {
    payload.fechaHoraRegistro = toLocalDateTimeString(extra.fechaHoraRegistro);
  }

  return payload;
};

/**
 * `MantenimientoDTO` del backend -> `values` iniciales del form (inversa de
 * `buildMantenimientoReqDTO`). Los ids van como string (valor de `Select`) y la
 * fecha como `Date` (lo que espera el `DateTimePicker` de este stack, igual que
 * `EditarViaje`).
 *
 * @param {Object} mantenimiento - `MantenimientoDTO`
 */
export const buildMantenimientoFormValues = (mantenimiento) => ({
  nombreMecanico: mantenimiento.nombreMecanico ?? '',
  apellidoMecanico: mantenimiento.apellidoMecanico ?? '',
  vehiculoID: mantenimiento.vehiculo?.id != null ? String(mantenimiento.vehiculo.id) : '',
  tipoMantenimientoID:
    mantenimiento.tipoMantenimiento?.id != null
      ? String(mantenimiento.tipoMantenimiento.id)
      : '',
  fechaHoraMantenimiento: mantenimiento.fechaHoraMantenimiento
    ? new Date(mantenimiento.fechaHoraMantenimiento)
    : null,
  descripcion: mantenimiento.descripcion ?? '',
});
