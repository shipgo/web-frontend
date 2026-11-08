/**
 * Fases del envío tal como las entiende quien lo espera (tracking público y
 * portal del cliente). El backend tiene 6 estados "felices" (`creado`,
 * `en_sucursal`, `asignado_a_viaje`, `en_vehiculo`, `en_camino`, `entregado`) y
 * varios son pasos internos que a quien espera el paquete no le dicen nada.
 * Se agrupan en 4 fases:
 *
 * | Fase | Estados que cubre |
 * |---|---|
 * | 0 Recibido | `creado`, `en_sucursal` (antes de salir de viaje) |
 * | 1 En preparación | `asignado_a_viaje`, `en_vehiculo`, `en_sucursal` si volvió tras un viaje (domicilio) |
 * | 2 En camino | `en_camino` |
 * | 3 Entregado / Retiro en sucursal | `entregado`; en retiro, `en_sucursal` tras un viaje ("listo para retirar") |
 *
 * `rechazado` no es una fase: es una salida alternativa, la barra se queda en la
 * última fase alcanzada. Sin `tipoEntrega` (backend viejo) se asume `domicilio`.
 *
 * Todo esto sale de `estado`, `historial` y `tipoEntrega` del `PublicTrackingDTO`.
 */

import dayjs from 'dayjs';

import { estadoLabel, normalizarEstado } from '@domain/estados';

const ESTADOS_DE_VIAJE = ['asignado_a_viaje', 'en_vehiculo', 'en_camino'];

/** Índices de las fases. */
export const FASE = { RECIBIDO: 0, PREPARACION: 1, EN_CAMINO: 2, FINAL: 3 };

/** `true` si el envío se retira en una sucursal (`tipoEntrega = sucursal`). */
export const esRetiro = (tipoEntrega) => String(tipoEntrega ?? '').toLowerCase() === 'sucursal';

/** Las 4 fases con su etiqueta; la última depende del tipo de entrega. */
export const fasesDelEnvio = (tipoEntrega) => [
  { id: 'recibido', label: 'Recibido' },
  { id: 'preparacion', label: 'En preparación' },
  { id: 'en_camino', label: 'En camino' },
  { id: 'final', label: esRetiro(tipoEntrega) ? 'Retiro en sucursal' : 'Entregado' },
];

/** Historial en orden cronológico (más antiguo primero); los sin fecha válida van al final. */
const cronologico = (historial) =>
  (historial ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const da = dayjs(a.item?.fecha);
      const db = dayjs(b.item?.fecha);
      const va = da.isValid();
      const vb = db.isValid();
      if (va && vb && !da.isSame(db)) return da.valueOf() - db.valueOf();
      if (va !== vb) return va ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);

/** Fase y "tipo" de un estado. `en_sucursal` depende de si el envío ya viajó. */
const faseDeEstado = (estado, huboViaje, tipoEntrega) => {
  switch (estado) {
    case 'creado':
      return { fase: FASE.RECIBIDO, tipo: null };
    case 'asignado_a_viaje':
    case 'en_vehiculo':
      return { fase: FASE.PREPARACION, tipo: null };
    case 'en_camino':
      return { fase: FASE.EN_CAMINO, tipo: null };
    case 'entregado':
      return { fase: FASE.FINAL, tipo: 'entregado' };
    case 'en_sucursal':
      if (!huboViaje) return { fase: FASE.RECIBIDO, tipo: null };
      return esRetiro(tipoEntrega)
        ? { fase: FASE.FINAL, tipo: 'listo' }
        : { fase: FASE.PREPARACION, tipo: null };
    case 'rechazado':
      return { fase: null, tipo: 'rechazado' };
    default:
      return { fase: null, tipo: null };
  }
};

const eventosConFase = (historial, tipoEntrega) => {
  let huboViaje = false;
  return cronologico(historial).map((item) => {
    const estado = normalizarEstado(item?.estado);
    const { fase, tipo } = faseDeEstado(estado, huboViaje, tipoEntrega);
    if (ESTADOS_DE_VIAJE.includes(estado)) huboViaje = true;
    return { estado, fecha: item?.fecha, fase, tipo };
  });
};

const hayViajeEn = (historial) =>
  (historial ?? []).some((h) => ESTADOS_DE_VIAJE.includes(normalizarEstado(h?.estado)));

/**
 * Progreso del envío en fases.
 *
 * @param {{ estado: string, historial?: Array<{estado: string, fecha?: string}>, tipoEntrega?: string }} envio
 * @returns {{ fases: Array<{id: string, label: string}>, actual: number,
 *   etiqueta: string, tipo: string | null, rechazado: boolean, retiro: boolean }}
 *   `actual`: índice de la fase actual (-1 si el estado es desconocido). `tipo`:
 *   `'listo'` (listo para retirar), `'entregado'`, `'rechazado'` o `null`.
 */
export const progresoEnvio = ({ estado, historial, tipoEntrega }) => {
  // Sin `estado` explícito se toma el del último evento del historial.
  const e = normalizarEstado(estado ?? cronologico(historial).at(-1)?.estado);
  const fases = fasesDelEnvio(tipoEntrega);
  const retiro = esRetiro(tipoEntrega);

  if (e === 'rechazado') {
    const previa = [...eventosConFase(historial, tipoEntrega)].reverse().find((ev) => ev.fase !== null);
    return {
      fases,
      actual: previa?.fase ?? FASE.RECIBIDO,
      etiqueta: estadoLabel('envio', 'rechazado'),
      tipo: 'rechazado',
      rechazado: true,
      retiro,
    };
  }

  const { fase, tipo } = faseDeEstado(e, hayViajeEn(historial), tipoEntrega);
  if (fase === null) {
    return { fases, actual: -1, etiqueta: estadoLabel('envio', estado), tipo: null, rechazado: false, retiro };
  }

  let etiqueta = fases[fase].label;
  if (fase === FASE.FINAL && retiro) etiqueta = tipo === 'entregado' ? 'Retirado' : 'Listo para retirar';

  return { fases, actual: fase, etiqueta, tipo, rechazado: false, retiro };
};

const ETIQUETA_ENTRADA = {
  [FASE.RECIBIDO]: 'Envío registrado',
  [FASE.PREPARACION]: 'En preparación',
  [FASE.EN_CAMINO]: 'En camino',
};

/**
 * Historial para mostrar a quien espera el envío: una entrada por fase alcanzada
 * (con la fecha en que se alcanzó por primera vez), sin los estados internos
 * (en sucursal, asignado a viaje, en vehículo), sin repetidos y sin fases que ya
 * no valen porque el envío retrocedió (p. ej. un viaje cancelado). Más reciente
 * primero.
 *
 * @param {{ estado: string, historial?: Array<{estado: string, fecha?: string}>, tipoEntrega?: string }} envio
 * @returns {Array<{ clave: string, etiqueta: string, fecha?: string, rechazado: boolean }>}
 */
export const historialPublico = ({ estado, historial, tipoEntrega }) => {
  const { actual } = progresoEnvio({ estado, historial, tipoEntrega });
  const retiro = esRetiro(tipoEntrega);
  const vistos = new Set();
  const entradas = [];

  eventosConFase(historial, tipoEntrega).forEach((ev) => {
    if (ev.tipo === 'rechazado') {
      entradas.push({ clave: 'rechazado', etiqueta: 'No entregado', fecha: ev.fecha, rechazado: true });
      return;
    }
    if (ev.fase === null || ev.fase > actual) return;

    const clave = ev.fase === FASE.FINAL ? `final-${ev.tipo}` : String(ev.fase);
    if (vistos.has(clave)) return;
    vistos.add(clave);

    let etiqueta = ETIQUETA_ENTRADA[ev.fase];
    if (ev.fase === FASE.FINAL) {
      if (ev.tipo === 'listo') etiqueta = 'Listo para retirar en la sucursal';
      else etiqueta = retiro ? 'Retirado' : 'Entregado';
    }
    entradas.push({ clave, etiqueta, fecha: ev.fecha, rechazado: false });
  });

  return entradas.reverse();
};

/** Color de Mantine del estado visto por el cliente (badges del portal). */
export const colorPublicoEnvio = ({ actual, tipo }) => {
  if (tipo === 'rechazado') return 'red';
  if (tipo === 'listo') return 'cyan';
  return ['gray', 'blue', 'orange', 'green'][actual] ?? 'gray';
};
