import { useQueryClient, useQuery } from '@tanstack/react-query';

import dayjs from 'dayjs';

import { useParams } from '@hooks/useParams';

import VEHICULOS from '../mocks';

const PAGE_LIMIT = 10;

const getVehiculos = (params) =>
  new Promise((resolve) => {
    const { page, filters } = params;
    const offset = (page - 1) * PAGE_LIMIT;

    let results = [...VEHICULOS];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (v) =>
          v.patente.toLowerCase().includes(term) ||
          v.marca.toLowerCase().includes(term) ||
          v.modelo.toLowerCase().includes(term),
      );
    }

    if (filters.tipo?.length > 0) {
      results = results.filter((v) => filters.tipo.includes(v.tipo));
    }

    if (filters.estado?.length > 0) {
      results = results.filter((v) => filters.estado.includes(v.estado));
    }

    if (filters.date?.[0] && filters.date?.[1]) {
      const from = dayjs(filters.date[0]).startOf('day');
      const to = dayjs(filters.date[1]).endOf('day');
      results = results.filter((v) => {
        const d = dayjs(v.fecha_incorporacion);
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

export const useGetVehiculos = () => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  const vehiculosQuery = useQuery({
    queryFn: () => getVehiculos(paramsOptions.params),
    queryKey: ['vehiculos', JSON.stringify(paramsOptions.params)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ['vehiculos'] });
    vehiculosQuery.refetch();
  };

  return { vehiculosQuery, refetch, PAGE_LIMIT, ...paramsOptions };
};
