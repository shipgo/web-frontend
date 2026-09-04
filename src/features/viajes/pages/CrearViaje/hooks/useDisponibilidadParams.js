import { useMemo } from "react";
import dayjs from "dayjs";

import { useFormContext } from "../contexts/EnviosFormContext";
import { toLocalDateTimeString } from "../utils";

/**
 * Ventana `desde`/`hasta` para `GET /vehiculo/disponibles` y
 * `GET /user/choferes-disponibles` (SHG-BE-006), derivada de las fechas
 * planificadas cargadas en `SeccionDetalles`. Devuelve `undefined` en ambas
 * si falta alguna fecha o si `hasta <= desde` (el backend rechazaría esa
 * ventana con `400`).
 *
 * Igual que en `buildViajeReqDTO` (`../utils.js`): estos params los recibe
 * `ViajeFilter`/comparaciones contra `fechaHoraInicioPlanificada` que son
 * `LocalDateTime` — se manda la hora de pared elegida, sin convertir a UTC
 * (`toLocalDateTimeString`, NO `.toISOString()`).
 */
export const useDisponibilidadParams = () => {
  const {
    values: { fechaHoraInicioPlanificada, fechaHoraFinPlanificada },
  } = useFormContext();

  return useMemo(() => {
    const inicio = dayjs(fechaHoraInicioPlanificada);
    const fin = dayjs(fechaHoraFinPlanificada);

    if (
      !fechaHoraInicioPlanificada ||
      !fechaHoraFinPlanificada ||
      !inicio.isValid() ||
      !fin.isValid() ||
      !fin.isAfter(inicio)
    ) {
      return { desde: undefined, hasta: undefined };
    }

    return {
      desde: toLocalDateTimeString(inicio),
      hasta: toLocalDateTimeString(fin),
    };
  }, [fechaHoraInicioPlanificada, fechaHoraFinPlanificada]);
};
