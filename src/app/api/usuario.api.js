import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

/**
 * API de Usuarios
 */
export const usuarioApi = {
  ...createCrudApi(API_URLS.USER_URL),

  /**
   * Obtener usuarios por rol
   */
  getByRol: async (rolId, params = {}) => {
    const response = await restclient.get(`${API_URLS.USER_URL}/rol/${rolId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener choferes
   */
  getChoferes: async (params = {}) => {
    const response = await restclient.get(`${API_URLS.USER_URL}/all`, {
      params: { ...params, authority: "CHOFER" },
    });
    return response.data;
  },

  /**
   * Actualizar token de notificaciones
   */
  updateToken: async (token) => {
    const response = await restclient.put(`${API_URLS.USER_URL}/updateToken`, {
      token,
    });
    return response.data;
  },

  /**
   * Subir archivo de perfil
   */
  uploadProfileFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await restclient.post(API_URLS.USER_FILES, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Resetear credenciales
   */
  resetCredentials: async (userId) => {
    const response = await restclient.post(
      `${API_URLS.RESET_CREDENTIALS_URL}/${userId}`
    );
    return response.data;
  },
};

/**
 * API de Roles
 */
export const rolApi = createCrudApi(API_URLS.ROL_URL);

/**
 * API de Authorities
 */
export const authorityApi = createCrudApi(API_URLS.AUTHORITY_URL);
