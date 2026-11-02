/**
 * Textos compartidos de la web (guía `planning/WORDING.md`).
 * Voseo, sentence case, sin jerga técnica. Las pantallas que repiten un
 * texto lo importan de acá en vez de escribir el literal.
 */

/** Estados de pantalla genéricos (`ScreenContainer`). */
export const PANTALLA = {
  errorTitulo: 'No pudimos cargar esta información',
  errorDescripcion: 'Probá de nuevo en unos minutos.',
  errorDatoTitulo: 'No pudimos cargar este dato',
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
/** Cierre estándar de los mensajes de error recuperable. */
export const REINTENTAR_MAS_TARDE = 'Probá de nuevo en unos minutos.';

export const ERROR_GENERICO = `Algo salió mal. ${REINTENTAR_MAS_TARDE}`;

/**
 * Estados de listado (`Lista*`): un solo patrón para todas.
 * @param {{ singular: string, plural: string, genero: 'm'|'f' }} entidad
 */
export const listaEstados = ({ singular, plural, genero }) => {
  const f = genero === 'f';
  return {
    cargando: `Cargando ${plural}...`,
    error: `No pudimos cargar ${f ? 'las' : 'los'} ${plural}`,
    vacioTitulo: `Todavía no hay ${plural}`,
    vacioDescripcion: `Cuando crees ${f ? 'una' : 'uno'}, ${f ? 'la' : 'lo'} vas a ver acá.`,
    sinResultadosTitulo: 'Sin resultados',
    sinResultadosDescripcion: `${f ? 'Ninguna' : 'Ningún'} ${singular} coincide con los filtros.`,
  };
};
