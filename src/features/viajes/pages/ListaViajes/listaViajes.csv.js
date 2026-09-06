import { estadoLabel } from '@domain/estados';
import { toLocalDateTime } from '@utils/dates';

const nombrePersona = (persona) => {
  if (!persona) return '';
  if (persona.nombre && persona.apellido) return `${persona.nombre} ${persona.apellido}`;
  return persona.nombre || persona.username || '';
};

const choferViaje = (viaje) => {
  if (viaje.chofer) return nombrePersona(viaje.chofer);
  const [primero] = viaje.choferes ?? [];
  return primero ? nombrePersona(primero) : 'Sin chofer asignado';
};

const cantidadRecorridos = (viaje) => viaje.recorridos?.length ?? 0;

const cantidadEnvios = (viaje) =>
  viaje.recorridos?.reduce(
    (total, recorrido) => total + (recorrido.detalleRecorridos?.length ?? 0),
    0,
  ) ?? 0;

/** Columnas del CSV de viajes. */
export const VIAJES_CSV_COLUMNS = [
  { header: 'ID viaje', value: (v) => v.id },
  { header: 'Estado', value: (v) => estadoLabel('viaje', v.estado) },
  { header: 'Inicio planificado', value: (v) => toLocalDateTime(v.fechaHoraInicioPlanificada) },
  { header: 'Fin planificado', value: (v) => toLocalDateTime(v.fechaHoraFinPlanificada) },
  { header: 'Chofer', value: choferViaje },
  { header: 'Vehículo', value: (v) => v.vehiculo?.patente ?? 'Sin vehículo' },
  { header: 'Recorridos', value: cantidadRecorridos },
  { header: 'Envíos', value: cantidadEnvios },
];
