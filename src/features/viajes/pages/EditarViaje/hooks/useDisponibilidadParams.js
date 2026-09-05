import { useMemo } from "react";
import dayjs from "dayjs";

import { toLocalDateTimeString } from "../utils";

/**
 * Ventana `desde`/`hasta` para `GET /vehiculo/disponibles` y
 * `GET /user/choferes-disponibles` (`SHG-BE-006`), derivada de las fechas
 * planificadas cargadas en el form. Devuelve `undefined` en ambas si falta
 * alguna fecha o si `hasta <= desde` (el backend rechazaría esa ventana con
 * `400`).
 *
 * Versión local (sin `EnviosFormContext`, que es específico del wizard de
 * `CrearViaje`) del mismo patrón que `CrearViaje/hooks/useDisponibilidadParams.js`
 * — acá recibe las fechas ya resueltas en vez de leerlas de un contexto.
 */
export const useDisponibilidadParams = (
  fechaHoraInicioPlanificada,
  fechaHoraFinPlanificada,
) =>
  useMemo(() => {
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
