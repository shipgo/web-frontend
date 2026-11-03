/**
 * Normaliza un texto para compararlo en una búsqueda: sin acentos ni
 * diacríticos y en minúsculas (`"Vehículos"` → `"vehiculos"`). Se aplica a los
 * DOS lados de la comparación, así `vehiculos` y `vehículos` se encuentran
 * entre sí. Misma idea que el `unaccent` del backend (SHG-BE-053).
 *
 * @param {string|null|undefined} texto
 * @returns {string}
 */
export const normalizarBusqueda = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Búsqueda de texto del lado del cliente: `true` si la consulta está vacía o si
 * alguno de los `campos` la contiene, sin distinguir mayúsculas ni acentos
 * (`jose` encuentra "José"). Los campos `null`/`undefined` no matchean.
 *
 * @param {string|null|undefined} consulta Lo que escribió la persona.
 * @param {Array<string|number|null|undefined>} campos Textos donde buscar.
 * @returns {boolean}
 */
export const coincideBusqueda = (consulta, campos) => {
  const termino = normalizarBusqueda(consulta).trim();
  if (!termino) return true;
  return campos.some((campo) => campo != null && normalizarBusqueda(campo).includes(termino));
};
