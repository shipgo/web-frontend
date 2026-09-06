import { useQuery } from '@tanstack/react-query';

import { sucursalApi } from '@api';
import { useAuthStore } from '@stores/auth.store';

import { dashboardApi } from '../../../api/dashboard.api';

const STALE_TIME = 60_000;

/**
 * `useDashboardResumen` / `useDashboardSeries` — cada uno pega a su endpoint con
 * los mismos `params` (`{ desde, hasta, sucursalId }`). Los `params` van enteros en
 * la `queryKey`: cambiar cualquier filtro dispara un refetch real (no un
 * `setTimeout` simulado como en la versión hardcodeada).
 *
 * `enabled` sólo cuando hay `desde` + `hasta` (mientras el usuario elige el rango
 * en el calendario, la query queda quieta).
 */

export const useDashboardResumen = (params) =>
  useQuery({
    queryKey: ['dashboard', 'resumen', params],
    queryFn: () => dashboardApi.getResumen(params),
    enabled: Boolean(params?.desde && params?.hasta),
    staleTime: STALE_TIME,
  });

export const useDashboardSeries = (params) =>
  useQuery({
    queryKey: ['dashboard', 'series', params],
    queryFn: () => dashboardApi.getSeries(params),
    enabled: Boolean(params?.desde && params?.hasta),
    staleTime: STALE_TIME,
  });

/**
 * Opciones del selector de sucursal del filtro. `GET /api/sucursal/all` es
 * SUPERUSER-only (igual que el selector: `CONTRACTS.md §3`, un ADMIN sólo ve su
 * propia sucursal y no elige), así que la query queda deshabilitada para ADMIN.
 *
 * @returns {{ isSuperUser: boolean, options: {value:string,label:string}[], isLoading: boolean }}
 */
export const useSucursalesOptions = () => {
  const isSuperUser = useAuthStore((state) =>
    Boolean(state.user?.isSuperUser?.()),
  );

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'sucursales'],
    queryFn: () => sucursalApi.getAll(),
    enabled: isSuperUser,
    staleTime: 5 * STALE_TIME,
  });

  const options = (data ?? []).map((sucursal) => ({
    value: String(sucursal.id),
    label: sucursal.nombre,
  }));

  return { isSuperUser, options, isLoading };
};
