import { hasAnyRole, isAdminOrSuper, ROLE_ADMIN, ROLE_CHOFER, ROLE_SUPERUSER } from '@domain/roles';
import { VIAJE_ESTADOS_EDITABLES } from '../../constants';

/**
 * Matriz estado -> acciones visibles, alineada al alcance documentado en
 * `SHG-FE-012` (que es quien implementa la lógica real: llamada, confirmación,
 * refetch). Acá sólo se decide si el botón se muestra/habilita según
 * `estado` + rol (`@domain/roles`) — sin ejecutar ninguna transición.
 *
 * - `iniciar`   -> **NO EXISTE en la web** (SHG-FE-083). El backend
 *   (`ViajeService.iniciarViaje`) solo acepta al chofer asignado, y la web es
 *   exclusiva SU/AD. Mobile inicia desde ROLE_CHOFER en su propio repo.
 * - `finalizar` -> `PUT /viaje/{id}/finalizar` (SU/AD/CH), sólo con el viaje en_camino.
 * - `reanudar`  -> `PUT /viaje/{id}/reanudar` (acá sólo SU/AD; el chofer reanuda desde
 *   mobile), sólo con el viaje con_problemas (SHG-BE-097, SHG-FE-126).
 * - `cancelar`  -> `PUT /viaje/{id}/cancelar` (SU/AD), estados cancelables (SHG-BE-009).
 * - `editar`    -> navega a `EditarViaje` (SU/AD), ya implementado; no es una
 *   transición de estado por lo que no está bloqueado por SHG-FE-012.
 */
// Se exporta para que `ListaViajesTabla` (SHG-FE-096) use la misma lista que
// `puedeCancelar` y no diverjan.
// Eliminables (`DELETE /api/viaje/{id}`): el backend rechaza con 409 un `con_problemas`.
export const ESTADOS_ELIMINABLES = ['creado', 'planificado', 'en_proceso_de_carga', 'listo_para_viaje'];

// Cancelables (`PUT /api/viaje/{id}/cancelar`): suman `con_problemas` desde SHG-BE-113.
export const ESTADOS_CANCELABLES = [...ESTADOS_ELIMINABLES, 'con_problemas'];

export const puedeEditar = (user, estado) =>
  isAdminOrSuper(user) && VIAJE_ESTADOS_EDITABLES.includes(estado);

export const puedeFinalizar = (user, estado) =>
  hasAnyRole(user, [ROLE_SUPERUSER, ROLE_ADMIN, ROLE_CHOFER]) && estado === 'en_camino';

export const puedeCancelar = (user, estado) =>
  isAdminOrSuper(user) && ESTADOS_CANCELABLES.includes(estado);

export const puedeReanudar = (user, estado) =>
  isAdminOrSuper(user) && estado === 'con_problemas';
