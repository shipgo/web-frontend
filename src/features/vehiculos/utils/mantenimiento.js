import { formatFechaHora } from '@domain/format';

/**
 * Copy del mantenimiento de un vehículo (SHG-FE-115 / SHG-FE-118). Una sola fuente para
 * el detalle, la lista de vehículos y el selector de viaje.
 *
 * `mantenimiento` es el campo `VehiculoDTO.mantenimiento` (SHG-BE-108):
 * `{ id, fechaHoraMantenimiento, fechaHoraFin, vigente }`. `vigente: false` = próximo.
 *
 * @param {{ fechaHoraMantenimiento: string, fechaHoraFin: string, vigente?: boolean }} mantenimiento
 */
export const mantenimientoEtiqueta = ({ fechaHoraMantenimiento, fechaHoraFin, vigente }) =>
  vigente === false
    ? `Mantenimiento programado del ${formatFechaHora(fechaHoraMantenimiento)} al ${formatFechaHora(fechaHoraFin)}`
    : `En mantenimiento hasta el ${formatFechaHora(fechaHoraFin)}`;

/**
 * Motivo por el que un vehículo de `GET /api/vehiculo/enMantenimiento` no se puede elegir:
 * ahí `mantenimiento` es el período que bloquea la ventana del viaje (no necesariamente
 * el vigente), y el copy es siempre "En mantenimiento hasta …".
 *
 * @param {{ mantenimiento?: { fechaHoraFin: string } }} vehiculo
 */
export const motivoNoDisponible = (vehiculo) =>
  vehiculo?.mantenimiento?.fechaHoraFin
    ? `En mantenimiento hasta el ${formatFechaHora(vehiculo.mantenimiento.fechaHoraFin)}`
    : 'En mantenimiento';
