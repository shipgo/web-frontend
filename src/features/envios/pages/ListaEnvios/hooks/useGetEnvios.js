import { useQueryClient, useQuery } from '@tanstack/react-query';

import dayjs from 'dayjs';

import { useParams } from '@hooks/useParams';

import ENVIOS from '../items';

const PAGE_LIMIT = 10;

const getEnvios = (params) =>
  new Promise((resolve) => {
    const { page, filters } = params;
    const offset = (page - 1) * PAGE_LIMIT;

    let results = [...ENVIOS];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.codigo_envio.toLowerCase().includes(term) ||
          e.direccion.toLowerCase().includes(term) ||
          e.localidad.toLowerCase().includes(term),
      );
    }

    if (filters.estado?.length > 0) {
      results = results.filter((e) => filters.estado.includes(e.estado));
    }

    if (filters.provincia) {
      results = results.filter((e) =>
        e.provincia.toLowerCase().includes(filters.provincia.toLowerCase()),
      );
    }

    if (filters.date?.[0] && filters.date?.[1]) {
      const from = dayjs(filters.date[0]).startOf('day');
      const to = dayjs(filters.date[1]).endOf('day');
      results = results.filter((e) => {
        const d = dayjs(e.fecha_registro);
        return d.isAfter(from) && d.isBefore(to);
      });
    }

    setTimeout(() => {
      resolve({
        total: results.length,
        totalPages: Math.ceil(results.length / PAGE_LIMIT),
        results: results.slice(offset, offset + PAGE_LIMIT),
      });
    }, 600);
  });

export const useGetEnvios = () => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  const enviosQuery = useQuery({
    queryFn: () => getEnvios(paramsOptions.params),
    queryKey: ['envios', JSON.stringify(paramsOptions.params)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ['envios'] });
    enviosQuery.refetch();
  };

  return { enviosQuery, refetch, PAGE_LIMIT, ...paramsOptions };
};
