import { useQueryClient, useQuery } from '@tanstack/react-query';

import { useParams } from '@hooks/useParams';

import SUCURSALES from '../mocks';

const PAGE_LIMIT = 10;

const getSucursales = (params) =>
  new Promise((resolve) => {
    const { page, filters } = params;
    const offset = (page - 1) * PAGE_LIMIT;

    let results = [...SUCURSALES];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.nombre.toLowerCase().includes(term) ||
          s.direccion.toLowerCase().includes(term) ||
          s.localidad.toLowerCase().includes(term),
      );
    }

    if (filters.estado?.length > 0) {
      results = results.filter((s) => filters.estado.includes(s.estado));
    }

    setTimeout(() => {
      resolve({
        total: results.length,
        totalPages: Math.ceil(results.length / PAGE_LIMIT),
        results: results.slice(offset, offset + PAGE_LIMIT),
      });
    }, 600);
  });

export const useGetSucursales = () => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  const sucursalesQuery = useQuery({
    queryFn: () => getSucursales(paramsOptions.params),
    queryKey: ['sucursales', JSON.stringify(paramsOptions.params)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ['sucursales'] });
    sucursalesQuery.refetch();
  };

  return { sucursalesQuery, refetch, PAGE_LIMIT, ...paramsOptions };
};
