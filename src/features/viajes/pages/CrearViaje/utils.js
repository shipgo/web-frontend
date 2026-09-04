import dayjs from "dayjs";

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
    fechaHoraInicioPlanificada: dayjs(
      values.fechaHoraInicioPlanificada,
    ).toISOString(),
    fechaHoraFinPlanificada: dayjs(
      values.fechaHoraFinPlanificada,
    ).toISOString(),
    vehiculoID: Number(values.vehiculo.id),
    choferesID: values.choferes.map((chofer) => Number(chofer.id)),
  },
  enviosPuntoEntrega: buildEnviosPuntoEntrega(values.enviosIncluidos),
});
