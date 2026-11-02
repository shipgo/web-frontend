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
