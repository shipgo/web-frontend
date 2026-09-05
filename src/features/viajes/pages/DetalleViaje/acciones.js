import { hasAnyRole, isAdminOrSuper, ROLE_ADMIN, ROLE_CHOFER, ROLE_SUPERUSER } from '@domain/roles';

/**
 * Matriz estado -> acciones visibles, alineada al alcance documentado en
 * `SHG-FE-012` (que es quien implementa la lógica real: llamada, confirmación,
 * refetch). Acá sólo se decide si el botón se muestra/habilita según
 * `estado` + rol (`@domain/roles`) — sin ejecutar ninguna transición.
 *
 * - `iniciar`   -> `PUT /viaje/{id}/iniciar` (SU/AD/CH), desde creado/planificado/en carga.
 * - `finalizar` -> `PUT /viaje/{id}/finalizar` (SU/AD/CH), sólo con el viaje en_camino.
 * - `cancelar`  -> `PUT /viaje/{id}/cancelar` (SU/AD), estados cancelables (SHG-BE-009).
 * - `editar`    -> navega a `EditarViaje` (SU/AD), ya implementado; no es una
 *   transición de estado por lo que no está bloqueado por SHG-FE-012.
 */
const ESTADOS_INICIABLES = ['creado', 'planificado', 'en_proceso_de_carga'];
const ESTADOS_CANCELABLES = ['creado', 'planificado', 'en_proceso_de_carga'];

export const puedeEditar = (user, estado) =>
  isAdminOrSuper(user) && !['finalizado', 'cancelado'].includes(estado);

export const puedeIniciar = (user, estado) =>
  hasAnyRole(user, [ROLE_SUPERUSER, ROLE_ADMIN, ROLE_CHOFER]) && ESTADOS_INICIABLES.includes(estado);

export const puedeFinalizar = (user, estado) =>
  hasAnyRole(user, [ROLE_SUPERUSER, ROLE_ADMIN, ROLE_CHOFER]) && estado === 'en_camino';

export const puedeCancelar = (user, estado) =>
  isAdminOrSuper(user) && ESTADOS_CANCELABLES.includes(estado);
