import { mapValues } from "es-toolkit";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { usuarioApi } from "../../api/usuarios.api";

const PAGE_LIMIT = 10;

/**
 * Hook para obtener usuarios con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetUsuarios = (pageLimit = PAGE_LIMIT) => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const usuariosQuery = useQuery({
    queryFn: async () => {
      const response = await usuarioApi.get(normalizedParams);
      return {
        total: response?.totalElements || 0,
        results: response?.content || [],
      };
    },
    queryKey: ["usuarios", JSON.stringify(normalizedParams)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["usuarios"] });
    usuariosQuery.refetch();
  };

  return { usuariosQuery, refetch, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
