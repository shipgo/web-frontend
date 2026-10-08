import dayjs from 'dayjs';

/**
 * De una lista de `MantenimientoDTO` (filtrada por `patente`, que en el backend es
 * "contains") devuelve el mantenimiento del vehículo que está vigente (inicio <= ahora < fin)
 * o, si no hay, el próximo (el de inicio más cercano). `null` si no hay ninguno.
 *
 * @param {Object[]} mantenimientos
 * @param {string} patente
 * @param {Date} [ahora]
 */
export const mantenimientoVigenteOProximo = (mantenimientos, patente, ahora = new Date()) => {
  const now = dayjs(ahora);
  const candidatos = (mantenimientos ?? [])
    .filter(
      (m) =>
        m.vehiculo?.patente === patente &&
        m.fechaHoraMantenimiento &&
        m.fechaHoraFin &&
        dayjs(m.fechaHoraFin).isAfter(now),
    )
    .sort((a, b) => dayjs(a.fechaHoraMantenimiento).diff(dayjs(b.fechaHoraMantenimiento)));
  return (
    candidatos.find((m) => !dayjs(m.fechaHoraMantenimiento).isAfter(now)) ??
    candidatos[0] ??
    null
  );
};
