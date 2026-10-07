import Axios from "axios";
import { API_URLS } from "@constants/apiUrls";
import { isProtectedPath } from "@utils/protectedPaths";
import { isConnectionError } from "@utils/connectionError";
import { CSV_MAX_ROWS } from "@utils/csv";
import { EMPRESA_REQUERIDA_EVENT, esEmpresaRequerida } from "@domain/empresa";

import {
  DEFAULT_TIMEOUT_MS,
  EXPORT_TIMEOUT_MS,
} from "@constants/timeouts";

export {
  DEFAULT_TIMEOUT_MS,
  BOOTSTRAP_TIMEOUT_MS,
  EXPORT_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
} from "@constants/timeouts";

export const restclient = Axios.create({
  withCredentials: true, // Envía cookies automáticamente
  timeout: DEFAULT_TIMEOUT_MS,
  baseURL: "/api", // Proxy de Vite manejará la redirección
  // Contrato de listados (CONTRACTS.md §4): los params de tipo array se envían
  // como parámetro REPETIDO sin corchetes ni índices — `estado=creado&estado=en_camino`,
  // NO `estado=creado,en_camino` ni `estado[]=...`. `sort` viaja como string
  // (`?sort=campo:asc` / `campo:desc`, NO el `campo,asc` de Spring).
  paramsSerializer: { indexes: null },
});

// Variable para controlar el refresh en progreso
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor para manejo de errores de autenticación con refresh token
restclient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es del endpoint de login o refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes(API_URLS.LOGIN_URL) &&
      !originalRequest.url.includes(API_URLS.REFRESH_TOKEN_URL)
    ) {
      if (isRefreshing) {
        // Si ya hay un refresh en progreso, agregar a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return restclient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token
        await restclient.get(API_URLS.REFRESH_TOKEN_URL);

        // Si el refresh fue exitoso, procesar la cola
        processQueue(null);
        isRefreshing = false;

        // Reintentar la petición original
        return restclient(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, procesar la cola con error y redirigir a login
        processQueue(refreshError);
        isRefreshing = false;

        // Redirigir a login sólo si la ruta actual EXIGE sesión (SHG-FE-104):
        // una ruta pública o desconocida (→ 404 pública) se queda donde está.
        // Ver `@utils/protectedPaths`. Si el refresh falló por timeout/red/5xx
        // (SHG-FE-110) no sabemos si la sesión sigue vigente: no se manda a login.
        if (
          !isConnectionError(refreshError) &&
          isProtectedPath(window.location.pathname)
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // SHG-FE-116: un SUPERUSER sin empresa recibe `409 empresa_requerida` en
    // los endpoints que la necesitan. Se avisa (ProtectedRoutes re-lee la
    // sesión y lo lleva al onboarding); el error igual se rechaza para que la
    // pantalla muestre el mensaje del backend.
    if (esEmpresaRequerida(error) && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EMPRESA_REQUERIDA_EVENT));
    }

    // Para otros errores, simplemente rechazar
    return Promise.reject(error);
  }
);

// Interceptor de request (opcional, para agregar headers adicionales si es necesario)
restclient.interceptors.request.use(
  (config) => {
    // Aquí podrías agregar headers adicionales si fuera necesario
    // Por ejemplo, un CSRF token si tu backend lo requiere

    // Export CSV (SHG-FE-110): página de `CSV_MAX_ROWS` filas → timeout largo.
    // Heurística y límites: se detecta por `params.size >= CSV_MAX_ROWS`, así que
    // CUALQUIER listado pedido con `size >= 5000` recibe 60 s; y como "timeout no
    // fijado" se detecta comparando con el default, un `timeout` explícito igual a
    // 15000 se trata como no fijado (se amplía). Cualquier otro valor explícito
    // se respeta.
    if (
      config.timeout === DEFAULT_TIMEOUT_MS &&
      Number(config.params?.size) >= CSV_MAX_ROWS
    ) {
      config.timeout = EXPORT_TIMEOUT_MS;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
