import { isAdminOrSuper } from '@domain/roles';

/**
 * Acciones de ciclo de vida de Envío disponibles en `DetalleEnvio` (`SHG-FE-007`).
 * Es una excepción/corrección al flujo normal (lo hace el chofer desde mobile,
 * `SHG-MOB-009`): un ADMIN/SUPERUSER puede marcar entregado o fallo de entrega
 * desde la web.
 *
 * - `entregar`      -> `PUT /envio/{id}/entregar` (SU/AD/CH), sin motivo.
 * - `falloEntrega`  -> `PUT /envio/{id}/falloEntrega` (SU/AD/CH), `motivo` obligatorio
 *   (`FalloEntregaEnvioReqDTO`).
 *
 * Ambas comparten la misma condición de visibilidad: sólo con el envío
 * "en camino" (en vehículo / en tránsito) — confirmado contra `CONTRACTS.md §1`
 * (valores canónicos de `@domain/estados`).
 */
const ESTADOS_ACCIONABLES = ['en_vehiculo', 'en_camino'];

export const puedeAccionarEntrega = (user, estado) =>
  isAdminOrSuper(user) && ESTADOS_ACCIONABLES.includes(estado);
