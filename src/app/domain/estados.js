/**
 * Verdad única de estados de dominio.
 *
 * La **clave** de cada mapa es SIEMPRE el valor canónico snake_case que
 * devuelve el backend (ver `planning/GLOSSARY.md` y `CONTRACTS.md §1`).
 * El front nunca envía ni compara labels: sólo mapea `valor -> { label, color }`.
 * `color` es un color de la paleta de Mantine.
 */

export const ESTADO_ENVIO = {
  creado: { label: 'Creado', color: 'gray' },
  en_sucursal: { label: 'En sucursal', color: 'cyan' },
  asignado_a_viaje: { label: 'Asignado a viaje', color: 'blue' },
  en_vehiculo: { label: 'En vehículo', color: 'indigo' },
  en_camino: { label: 'En camino', color: 'orange' },
  entregado: { label: 'Entregado', color: 'green' },
  rechazado: { label: 'Rechazado', color: 'red' },
};

export const ESTADO_VIAJE = {
  creado: { label: 'Creado', color: 'gray' },
  planificado: { label: 'Planificado', color: 'blue' },
  en_proceso_de_carga: { label: 'En carga', color: 'cyan' },
  en_camino: { label: 'En camino', color: 'orange' },
  finalizado: { label: 'Finalizado', color: 'green' },
  cancelado: { label: 'Cancelado', color: 'red' },
  con_problemas: { label: 'Con problemas', color: 'red' },
};

export const ESTADO_RECORRIDO = {
  planificado: { label: 'Planificado', color: 'blue' },
  en_camino: { label: 'En camino', color: 'orange' },
  finalizado: { label: 'Finalizado', color: 'green' },
  finalizado_con_problemas: { label: 'Finalizado c/problemas', color: 'orange' },
};

export const ESTADO_VEHICULO = {
  disponible: { label: 'Disponible', color: 'green' },
  asignado_a_viaje: { label: 'Asignado a viaje', color: 'blue' },
  en_viaje: { label: 'En viaje', color: 'orange' },
  en_service: { label: 'En service', color: 'yellow' },
  fuera_de_servicio: { label: 'Fuera de servicio', color: 'red' },
};

/** Entidades válidas para `estadoBadge` / `estadoOptions`. */
export const ENTIDADES_CON_ESTADO = {
  envio: ESTADO_ENVIO,
  viaje: ESTADO_VIAJE,
  recorrido: ESTADO_RECORRIDO,
  vehiculo: ESTADO_VEHICULO,
};

const FALLBACK = { label: '—', color: 'gray' };

/**
 * Ajuste de contraste para `<Badge variant="light">`: el shade más oscuro de
 * "orange"/"green" en la paleta default de Mantine (el que ya usa ese
 * variant) da ~3.8:1 contra su propio fondo tintado — por debajo del 4.5:1
 * de WCAG 2 AA. Confirmado por axe-core (`color-contrast`, serio) en
 * `/envios` y `/viajes` (SHG-FE-041: estados "En camino"/"Entregado"/
 * "Finalizado"). El resto de los colores usados en `ESTADO_*`
 * (`gray`/`blue`/`cyan`/`indigo`/`red`/`yellow`) ya pasa con su shade
 * default, así que no necesitan entrada acá.
 *
 * `estadoBadge` expone esto como `textColor` — quien pinte el `<Badge>`
 * decide si lo pasa a `c` (ver `ListaEnviosTabla`/`ListaViajesTabla`); no
 * cambia nada para quien no lo use.
 */
const BADGE_TEXT_CONTRAST_OVERRIDE = {
  orange: '#99350a',
  green: '#1f6e33',
};

/**
 * Normaliza un valor de estado al canónico snake_case en minúsculas.
 * Acepta la basura histórica del front (`"EN_CAMINO"`, `"En curso"`, `null`).
 */
export const normalizarEstado = (valor) =>
  typeof valor === 'string' ? valor.trim().toLowerCase().replace(/\s+/g, '_') : valor;

/**
 * Devuelve `{ label, color }` para pintar un `<Badge>`.
 * @param {'envio'|'viaje'|'recorrido'|'vehiculo'} entidad
 * @param {string} valor valor canónico del backend
 */
export const estadoBadge = (entidad, valor) => {
  const mapa = ENTIDADES_CON_ESTADO[entidad];
  const meta = mapa?.[normalizarEstado(valor)] ?? { ...FALLBACK, label: valor ?? FALLBACK.label };
  return { ...meta, textColor: BADGE_TEXT_CONTRAST_OVERRIDE[meta.color] };
};

/** Sólo el label (o el valor crudo si no se conoce). */
export const estadoLabel = (entidad, valor) => estadoBadge(entidad, valor).label;

/**
 * Opciones `{ value, label }` para selects / filtros de listado.
 * `value` es SIEMPRE el valor canónico (lo que espera el backend).
 */
export const estadoOptions = (entidad) =>
  Object.entries(ENTIDADES_CON_ESTADO[entidad] ?? {}).map(([value, { label }]) => ({
    value,
    label,
  }));

/**
 * Estados terminales por entidad: la máquina de estados del backend ya no
 * permite salir de ellos, así que el front no ofrece editar / accionar sobre
 * una entidad que está en uno de estos.
 */
export const ESTADOS_TERMINALES = {
  envio: ['entregado', 'rechazado'],
  viaje: ['finalizado', 'cancelado'],
  recorrido: ['finalizado', 'finalizado_con_problemas'],
  vehiculo: [],
};

/**
 * `true` si el estado es terminal para esa entidad (p. ej. un envío
 * `entregado` / `rechazado` ya no es editable).
 * @param {'envio'|'viaje'|'recorrido'|'vehiculo'} entidad
 * @param {string} valor valor canónico del backend
 */
export const esEstadoTerminal = (entidad, valor) =>
  (ESTADOS_TERMINALES[entidad] ?? []).includes(normalizarEstado(valor));
