/**
 * Textos compartidos de la web (guía `planning/WORDING.md`).
 * Voseo, sentence case, sin jerga técnica. Las pantallas que repiten un
 * texto lo importan de acá en vez de escribir el literal.
 */

/** Estados de pantalla genéricos (`ScreenContainer`). */
export const PANTALLA = {
  errorTitulo: 'No pudimos cargar esta información',
  errorDescripcion: 'Intentá de nuevo en unos minutos.',
  vacioTitulo: 'Todavía no hay nada para mostrar',
  vacioDescripcion: 'Cuando haya información, la vas a ver acá.',
  sinResultadosTitulo: 'Sin resultados',
  sinResultadosDescripcion: 'Probá cambiando o limpiando los filtros.',
};

/** Diálogo de salida de un formulario con cambios (todos los formularios). */
export const SALIR_SIN_GUARDAR = {
  titulo: '¿Salir sin guardar?',
  mensaje: 'Vas a perder los cambios.',
  salir: 'Salir',
  seguir: 'Seguir editando',
};

/** Cabecera del toast cuando el formulario tiene errores. */
export const FORMULARIO_INVALIDO = {
  titulo: 'Revisá los datos ingresados',
  mensaje: 'Completá los campos marcados.',
};

/** Fallback cuando el backend no manda un mensaje legible. */
export const ERROR_GENERICO = 'Algo salió mal. Probá de nuevo en unos minutos.';

/** Función de la API que todavía no existe (nunca se muestra el detalle técnico). */
export const FUNCION_NO_DISPONIBLE = 'Esta función todavía no está disponible.';

/**
 * Estados de listado (`Lista*`): un solo patrón para todas.
 * @param {{ singular: string, plural: string, genero: 'm'|'f' }} entidad
 */
export const listaEstados = ({ singular, plural, genero }) => {
  const f = genero === 'f';
  return {
    cargando: `Cargando ${plural}...`,
    error: `No pudimos cargar ${f ? 'las' : 'los'} ${plural}.`,
    vacioTitulo: `Todavía no hay ${plural}`,
    vacioDescripcion: `Cuando crees ${f ? 'una' : 'uno'}, ${f ? 'la' : 'lo'} vas a ver acá.`,
    sinResultadosTitulo: 'Sin resultados',
    sinResultadosDescripcion: `${f ? 'Ninguna' : 'Ningún'} ${singular} coincide con los filtros.`,
  };
};

/** Mensajes de validación (Ingresá… / Elegí…). */
export const validar = {
  ingresa: (que) => `Ingresá ${que}.`,
  elegi: (que) => `Elegí ${que}.`,
  maximo: (que, max) => `${que} puede tener hasta ${max} caracteres.`,
  emailInvalido: 'Ingresá un email válido.',
};
