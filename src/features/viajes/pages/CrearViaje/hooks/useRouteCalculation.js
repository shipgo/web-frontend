import { useMemo, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

import { fetchMapboxDirections } from "@utils/mapboxDirections";

import { useFormContext } from "../contexts/EnviosFormContext";

const DEFAULT_CALCULATED_STATE = { orderKey: null, returnOrigin: false };

/**
 * "Para qué selección/orden de paradas se calculó la última ruta": junta las
 * keys del Map en su orden actual (`local_5`, `sucursal_3`, ...). Cualquier
 * cambio de selección de paquetes O de orden (`SeccionEnvios/utils.moverParada`,
 * `SHG-FE-048`) produce una key distinta, invalidando el cálculo anterior —
 * antes (`SHG-FE-008`) sólo se comparaba el `Set` de IDs de paquetes, que no
 * cambia al reordenar paradas con los mismos paquetes.
 */
const orderKeyOf = (enviosIncluidos) => Array.from(enviosIncluidos.keys()).join("|");

/**
 * Ruta sugerida del viaje: dispara `POST` a Mapbox Directions (vía
 * `@utils/mapboxDirections`, mismo servicio que usa el mapa en vivo de
 * `features/mapa` y `app-mobile`) con las paradas de `enviosIncluidos` EN SU
 * ORDEN ACTUAL + la sucursal de origen del usuario (si se conoce), y
 * opcionalmente un regreso a esa misma sucursal al final (`returnOrigin`).
 *
 * Reemplaza la simulación aleatoria de éxito/error de `SHG-FE-008`
 * (`Math.random() < 0.5`): ahora "Calcular trayecto sugerido" hace una
 * llamada real y sólo falla si Mapbox falla (red, sin ruta posible, etc.) o
 * si no hay al menos 2 puntos con coordenadas conocidas.
 *
 * @param {[number, number]|null} origenCoords `[lng, lat]` de
 *   `user.sucursal.puntoEntrega`, o `null` si no se conoce (p. ej. SUPERUSER
 *   sin sucursal propia — ver `SeccionDetalles.jsx`).
 * @param {Array<[number, number]|null>} groupCoords Coords de cada parada en
 *   el orden actual (`SeccionEnvios/utils.getGroupProperties`).
 */
const useRouteCalculation = (origenCoords, groupCoords) => {
  const {
    values: { enviosIncluidos },
  } = useFormContext();

  const [returnOrigin, setReturnOrigin] = useState(false);
  const [calculatedState, setCalculatedState] = useState(
    DEFAULT_CALCULATED_STATE,
  );

  const waypoints = useMemo(() => {
    const paradasConCoords = groupCoords.filter(Boolean);
    const puntos = origenCoords
      ? [origenCoords, ...paradasConCoords]
      : paradasConCoords;

    return returnOrigin && origenCoords && puntos.length > 1
      ? [...puntos, origenCoords]
      : puntos;
  }, [groupCoords, origenCoords, returnOrigin]);

  const { data, mutate, reset, isPending, isError } = useMutation({
    mutationFn: () => {
      if (waypoints.length < 2) {
        return Promise.reject(
          new Error(
            "No hay suficientes paradas con coordenadas conocidas para calcular una ruta.",
          ),
        );
      }
      return fetchMapboxDirections(waypoints);
    },
    mutationKey: ["calculatedRoute"],
    onSuccess: () =>
      setCalculatedState({
        orderKey: orderKeyOf(enviosIncluidos),
        returnOrigin,
      }),
    onError: (error) =>
      notifications.show({
        color: "red",
        title: "Error al calcular la ruta",
        message:
          error?.message ??
          "Ocurrió un error al calcular el trayecto. Intentá nuevamente.",
      }),
  });

  useEffect(() => {
    if (enviosIncluidos.size === 0) {
      setCalculatedState(DEFAULT_CALCULATED_STATE);
      reset();
    }
  }, [enviosIncluidos.size, reset]);

  const canCalculateNewRoute =
    !isPending &&
    enviosIncluidos.size > 0 &&
    (calculatedState.orderKey !== orderKeyOf(enviosIncluidos) ||
      calculatedState.returnOrigin !== returnOrigin);

  const showAlert = !!data && canCalculateNewRoute;

  const handleRouteCalculation = () => mutate();

  return {
    data,
    isError,
    isPending,
    returnOrigin,
    setReturnOrigin,
    canCalculateNewRoute,
    showAlert,
    handleRouteCalculation,
  };
};

export default useRouteCalculation;
