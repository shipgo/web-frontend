import { useQuery } from '@tanstack/react-query';

import { viajeApi } from '@api/viaje.api';

/**
 * Viajes en_camino visibles para el usuario actual. El backend ya restringe
 * el resultado a la sucursal (ADMIN) o empresa (SUPERUSER) del usuario.
 *
 * @param {number} refetchTrigger - al cambiar, se refetchea el listado
 * (útil para sincronizar con eventos "viaje-iniciado" del stream SSE)
 */
export const useViajesEnCurso = (refetchTrigger = 0) => {
  const query = useQuery({
    queryKey: ['viajes-en-curso', refetchTrigger],
    // Un único valor: Spring lo bindea igual en el List<String> del filtro.
    // (axios serializaría un array como "estado[]=...", que Spring no bindea).
    queryFn: () => viajeApi.getAll({ estado: 'en_camino' }),
  });

  return { viajes: query.data ?? [], ...query };
};
