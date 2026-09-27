import { useQuery } from '@tanstack/react-query';

import { portalApi } from '../../../api/portal.api';

/** Query key compartida por `MiPerfilPage` para poder actualizar el cache tras el `PUT`. */
export const MI_PERFIL_QUERY_KEY = ['portal-mi-perfil'];

/**
 * Datos del CUSTOMER logueado (`GET /api/customer/me`, `SHG-BE-024`) para la
 * pantalla "Mi perfil" (`SHG-FE-102`).
 */
export const useMiPerfil = () =>
  useQuery({
    queryKey: MI_PERFIL_QUERY_KEY,
    queryFn: portalApi.me,
    retry: false,
  });
