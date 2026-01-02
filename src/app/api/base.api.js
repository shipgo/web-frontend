import { restclient } from "@config/restclient";

/**
 * Crea un API CRUD genérico para una entidad
 * @param {string} baseUrl - URL base del endpoint (ej: '/envio')
 * @returns {Object} Objeto con métodos CRUD
 */
export const createCrudApi = (baseUrl) => ({
  /**
   * Obtener todos los registros sin paginación
   * @param {Object} params - Parámetros de query
   */
  getAll: async (params = {}) => {
    const response = await restclient.get(`${baseUrl}/all`, { params });
    return response.data;
  },

  /**
   * Obtener registros con paginación
   * @param {Object} params - Parámetros de query (page, size, etc.)
   */
  get: async (params = {}) => {
    const response = await restclient.get(baseUrl, { params });
    return response.data;
  },

  /**
   * Obtener un registro por ID
   * @param {number|string} id - ID del registro
   */
  getById: async (id) => {
    const response = await restclient.get(`${baseUrl}/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo registro
   * @param {Object} data - Datos del nuevo registro
   */
  save: async (data) => {
    const response = await restclient.post(baseUrl, data);
    return response.data;
  },

  /**
   * Actualizar un registro existente
   * @param {number|string} id - ID del registro a actualizar
   * @param {Object} data - Datos actualizados
   */
  update: async (id, data) => {
    const response = await restclient.put(`${baseUrl}/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un registro
   * @param {number|string} id - ID del registro a eliminar
   */
  delete: async (id) => {
    const response = await restclient.delete(`${baseUrl}/${id}`);
    return response.data;
  },
});

