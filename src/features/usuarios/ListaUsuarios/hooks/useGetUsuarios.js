import { useQueryClient, useQuery } from '@tanstack/react-query';

import dayjs from 'dayjs';

import { useParams } from '@hooks/useParams';

import USUARIOS from '../mocks';

const PAGE_LIMIT = 10;

const getUsuarios = (params) =>
  new Promise((resolve) => {
    const { page, filters } = params;
    const offset = (page - 1) * PAGE_LIMIT;

    let results = [...USUARIOS];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      );
    }

    if (filters.rol) {
      results = results.filter((u) => u.rol === filters.rol);
    }

    if (filters.estado?.length > 0) {
      results = results.filter((u) => filters.estado.includes(u.estado));
    }

    if (filters.date?.[0] && filters.date?.[1]) {
      const from = dayjs(filters.date[0]).startOf('day');
      const to = dayjs(filters.date[1]).endOf('day');
      results = results.filter((u) => {
        const d = dayjs(u.fecha_alta);
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

export const useGetUsuarios = () => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  const usuariosQuery = useQuery({
    queryFn: () => getUsuarios(paramsOptions.params),
    queryKey: ['usuarios', JSON.stringify(paramsOptions.params)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ['usuarios'] });
    usuariosQuery.refetch();
  };

  return { usuariosQuery, refetch, PAGE_LIMIT, ...paramsOptions };
};
