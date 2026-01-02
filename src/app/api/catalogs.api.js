import { createCrudApi } from "./base.api";
import { API_URLS } from "@constants/apiUrls";

/**
 * API de Categorías
 */
export const categoriaApi = createCrudApi(API_URLS.CATEGORIA_URL);

/**
 * API de Sexo
 */
export const sexoApi = createCrudApi(API_URLS.SEXO_URL);

/**
 * API de Tipos de Documento
 */
export const tipoDocumentoApi = createCrudApi(API_URLS.TIPO_DOC_URL);

/**
 * API de Calificación de Chofer
 */
export const calificacionChoferApi = createCrudApi(
  API_URLS.CALIFICACION_CHOFER_URL
);

/**
 * API de Calificación de Ruta
 */
export const calificacionRutaApi = createCrudApi(
  API_URLS.CALIFICACION_RUTA_URL
);

/**
 * API de Huella de Carbono
 */
export const huellaCarbonoApi = createCrudApi(API_URLS.HUELLA_CARBONO_URL);

/**
 * API de Notificaciones
 */
export const notificacionesApi = createCrudApi(API_URLS.NOTIFICACIONES_URL);

/**
 * API de Empresa
 */
export const empresaApi = createCrudApi(API_URLS.EMPRESA_URL);

/**
 * API agregada de catálogos con métodos convenientes
 */
export const catalogsApi = {
  getSexos: () => sexoApi.getAll(),
  getTiposDocumento: () => tipoDocumentoApi.getAll(),
  getCategorias: () => categoriaApi.getAll(),
};
