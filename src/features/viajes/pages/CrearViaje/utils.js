import dayjs from "dayjs";

/**
 * Formato que espera el backend para campos `java.time.LocalDateTime`
 * (`ViajeDTO.fechaHoraInicioPlanificada`/`fechaHoraFinPlanificada`): Jackson
 * los deserializa con `DateTimeFormatter.ISO_LOCAL_DATE_TIME`, que NO acepta
 * offset/zona (`Z` o `+00:00`) — sólo `yyyy-MM-ddTHH:mm:ss`.
 *
 * ⚠️ NO usar `dayjs(...).toISOString()` acá: convierte a UTC y agrega el
 * sufijo `Z` + milisegundos, lo que rompe el parseo en el backend
 * (`DateTimeParseException`) y además corre la hora local ~3hs (AR = UTC-3).
 * Lo que hay que mandar es la hora de pared que eligió el usuario en el
 * `DateTimePicker`, tal cual, sin conversión de zona.
 */
const LOCAL_DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";

/** `Date` (o cualquier valor que entienda dayjs) -> `LocalDateTime` string del backend. */
export const toLocalDateTimeString = (value) =>
  dayjs(value).format(LOCAL_DATE_TIME_FORMAT);

/**
 * `enviosIncluidos` (Map, ver `contexts/EnviosFormProvider.jsx`) -> `enviosPuntoEntrega`
 * de `ViajeReqDTO` (`CONTRACTS.md §8`). El orden del array = el orden de
 * inserción del Map = el orden en que el backend arma los recorridos.
 *
 * Cada entrada del Map ya es 1:1 con un recorrido: `puntoEntregaID` XOR
 * `sucursalDestinoID` (uno de los dos siempre `null`, igual que
 * `EditarViaje` — el backend valida que sea exactamente uno de los dos).
 */
export const buildEnviosPuntoEntrega = (enviosIncluidos) =>
  Array.from(enviosIncluidos.values()).map(
    ({ puntoEntregaID, sucursalDestinoID, packages }) => ({
      enviosID: Array.from(packages.keys()),
      puntoEntregaID: puntoEntregaID ?? null,
      sucursalDestinoID: sucursalDestinoID ?? null,
    }),
  );

/**
 * Arma el `ViajeReqDTO` completo a partir de los `values` del form.
 * `responsable`/`sucursal` los resuelve el backend server-side; las fechas
 * reales (`fechaHoraInicio`/`fechaHoraFin`) NO se mandan en creación —
 * quedan `null` hasta `iniciar`/`finalizar` (SHG-BE-021).
 */
export const buildViajeReqDTO = (values) => ({
  viaje: {
    fechaHoraInicioPlanificada: toLocalDateTimeString(
      values.fechaHoraInicioPlanificada,
    ),
    fechaHoraFinPlanificada: toLocalDateTimeString(
      values.fechaHoraFinPlanificada,
    ),
    vehiculoID: Number(values.vehiculo.id),
    choferesID: values.choferes.map((chofer) => Number(chofer.id)),
  },
  enviosPuntoEntrega: buildEnviosPuntoEntrega(values.enviosIncluidos),
});
