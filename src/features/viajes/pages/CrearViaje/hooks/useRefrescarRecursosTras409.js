import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const QUERY_KEYS_RECURSOS = [
  "vehiculos-disponibles",
  "vehiculos-en-mantenimiento",
  "choferes-disponibles",
  // Opcional (SHG-FE-130): el otro viaje pudo haber tomado envíos pendientes.
  "envios-para-viaje",
];

/**
 * SHG-FE-130 — devuelve un callback para el `onError` del guardado de un
 * viaje (alta o edición). Ante un `409` (vehículo o chofer ocupado por otro
 * viaje que se solapa, SHG-BE-129/132) invalida los listados de recursos
 * disponibles; los efectos de `ListaVehiculosDisponibles`/`ListadoChoferes`
 * (Crear) y de `EditarViaje/SeccionRecursos` (SHG-FE-128) quitan solos lo que
 * deja de figurar. Con cualquier otro error no hace nada.
 */
export const useRefrescarRecursosTras409 = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (error) => {
      if (error?.response?.status !== 409) return;
      QUERY_KEYS_RECURSOS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    [queryClient],
  );
};
