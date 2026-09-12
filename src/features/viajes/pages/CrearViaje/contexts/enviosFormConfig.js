import dayjs from "dayjs";

/**
 * Shape del form compartido por `CrearViaje` (`EnviosFormProvider.jsx`) y
 * `EditarViaje` (`SHG-FE-049`) — mismos campos, misma validación, para poder
 * reusar sin duplicar `SeccionEnvios`/`SeccionResumen`/`SeccionDetalles` entre
 * ambas pantallas. `EditarViaje` arma sus valores iniciales a partir del
 * `ViajeDTO` ya persistido (ver `EditarViaje/utils.js`) en vez de estos
 * `INITIAL_VALUES` vacíos, pero usa la misma `validate`.
 */
export const INITIAL_VALUES = {
  fechaHoraInicioPlanificada: null,
  fechaHoraFinPlanificada: null,
  enviosIncluidos: new Map(),
  vehiculo: null,
  choferes: [],
};

export const validate = {
  fechaHoraInicioPlanificada: (value) =>
    !value ? "Seleccioná la fecha de salida planificada" : null,
  fechaHoraFinPlanificada: (value, values) => {
    if (!value) return "Seleccioná la fecha de llegada planificada";
    if (
      values.fechaHoraInicioPlanificada &&
      !dayjs(value).isAfter(dayjs(values.fechaHoraInicioPlanificada))
    ) {
      return "La llegada planificada debe ser posterior a la salida planificada";
    }
    return null;
  },
  enviosIncluidos: (value) =>
    !value || value.size === 0 ? "Agregá al menos un envío al viaje" : null,
  vehiculo: (value) => (!value ? "Seleccioná un vehículo" : null),
  choferes: (value) =>
    !value || value.length === 0 ? "Seleccioná al menos un chofer" : null,
};
