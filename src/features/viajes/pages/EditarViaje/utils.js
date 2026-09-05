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
 * Mismo bug (y mismo fix) que `CrearViaje/utils.js` (`SHG-FE-008`, ver
 * `planning/coordination/frontend.md` entrada del 2026-09-05).
 */
const LOCAL_DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";

/** `Date` (o cualquier valor que entienda dayjs) -> `LocalDateTime` string del backend. */
export const toLocalDateTimeString = (value) =>
  dayjs(value).format(LOCAL_DATE_TIME_FORMAT);

/**
 * Reconstruye el arreglo `enviosPuntoEntrega` a partir de los recorridos
 * existentes del viaje, agrupando los envíos ya asignados a cada recorrido.
 * Esta pantalla no permite modificar qué envíos viajan ni su punto de
 * entrega/sucursal destino: solo reenvía lo que ya existía para que el PUT
 * (que exige el contrato completo) no pierda esa información.
 */
export const buildEnviosPuntoEntrega = (recorridos = []) =>
  recorridos.map((recorrido) => ({
    enviosID: (recorrido.detalleRecorridos || []).map(
      (detalle) => detalle.envio?.id,
    ),
    puntoEntregaID: recorrido.puntoEntrega?.id ?? null,
    sucursalDestinoID: recorrido.sucursalDestino?.id ?? null,
  }));

export const vehiculoLabel = (vehiculo) =>
  [vehiculo.patente, vehiculo.modelo?.nombre].filter(Boolean).join(" - ");

export const choferLabel = (chofer) =>
  [chofer.nombre, chofer.apellido].filter(Boolean).join(" ") ||
  chofer.username ||
  `Chofer ${chofer.id}`;

/**
 * Arma el `ViajeReqDTO` completo a partir de los `values` del form y el
 * viaje original (para no perder los envíos/recorridos ya asignados).
 *
 * `fechaHoraInicio`/`fechaHoraFin` (las fechas REALES) no se mandan: según
 * `SHG-BE-021`/`CONTRACTS.md §8`, son nullable y las completa el backend
 * server-side (`iniciar`/`finalizar`). Esta pantalla sólo edita viajes en
 * `creado`/`planificado`, donde esas fechas siempre son `null` — mandarlas
 * de nuevo (aunque sea el mismo valor `null` reenviado) es innecesario y,
 * si algún día se editara un viaje ya iniciado, sería activamente peligroso:
 * `ViajeService.update` hace `modelMapper.map(viajeR.getViaje(), viaje)`,
 * que pisaría la fecha real ya seteada con lo que mande el cliente.
 */
export const buildViajeReqDTO = (values, viajeOriginal) => ({
  viaje: {
    fechaHoraInicioPlanificada: toLocalDateTimeString(
      values.fechaHoraInicioPlanificada,
    ),
    fechaHoraFinPlanificada: toLocalDateTimeString(
      values.fechaHoraFinPlanificada,
    ),
    vehiculoID: Number(values.vehiculoID),
    choferesID: values.choferesID.map(Number),
  },
  enviosPuntoEntrega: buildEnviosPuntoEntrega(viajeOriginal.recorridos),
});
