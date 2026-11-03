/**
 * Detecta que un error de la API es un 404 (recurso inexistente o de otra
 * sucursal, que el backend también responde 404). Sirve para distinguirlo de
 * un error genérico/transitorio, donde sí tiene sentido "Reintentar"
 * (SHG-FE-104).
 */
export const isNotFoundError = (error) => error?.response?.status === 404;
