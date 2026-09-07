import Axios from "axios";
import { API_URLS } from "@constants/apiUrls";

export const restclient = Axios.create({
  withCredentials: true, // Envía cookies automáticamente
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

        // Redirigir a login solo si no estamos ya en una ruta pública
        // Rutas públicas (SHG-FE-023 / SHG-FE-025 / SHG-FE-026): login, flujo de
        // recuperación de cuenta, tracking guest y registro CUSTOMER.
        // `/recuperar-cuenta/:token`, `/tracking/:codigo` y `/registro/verificar`
        // caen acá por el `startsWith`. `/portal` NO es público.
        const publicRoutes = [
          "/login",
          "/recuperar-cuenta",
          "/tracking",
          "/registro",
        ];
        const isPublicRoute = publicRoutes.some((route) =>
          window.location.pathname.startsWith(route)
        );

        if (!isPublicRoute) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
