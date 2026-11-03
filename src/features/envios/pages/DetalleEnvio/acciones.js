import { normalizarEstado } from '@domain/estados';
import { isAdminOrSuper } from '@domain/roles';

import { TIPO_ENTREGA } from '../../constants';

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

/**
 * Acción "Confirmar retiro" (`SHG-FE-080` / `SHG-CONTRACT-012`): sólo para
 * envíos con `tipoEntrega = 'sucursal'` que ya llegaron a la sucursal de
 * retiro elegida por el remitente (`estado = 'en_sucursal'`). Distinta de
 * `puedeAccionarEntrega` (esa es para la entrega a domicilio, `en_camino`/
 * `en_vehiculo`) — los rangos de estado de ambas acciones no se solapan, así
 * que nunca se muestran los dos botones a la vez.
 *
 * Reusa el mismo endpoint `PUT /envio/{id}/entregar` que `entregar` de
 * arriba (`ENDPOINTS.md §4`, sección "retiro en sucursal") — el backend
 * (`EnvioService.validarRetiroEnSucursal`) es quien valida que
 * `envio.sucursal` (ubicación física actual) coincida con
 * `envio.sucursalEntrega`; acá sólo se decide si se ofrece el botón.
 */
export const puedeConfirmarRetiro = (user, envio) =>
  isAdminOrSuper(user) &&
  normalizarEstado(envio?.estado) === 'en_sucursal' &&
  envio?.tipoEntrega === TIPO_ENTREGA.SUCURSAL;
