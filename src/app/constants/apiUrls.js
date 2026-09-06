/**
 * Mapa canónico de URLs de la API ShipGo.
 *
 * Fuente de verdad: `planning/ENDPOINTS.md` (generado desde `rest/*Controller.java`
 * + verificado contra `/v3/api-docs`). Todos los paths cuelgan de `/api`
 * (la instancia axios usa `baseURL: '/api'`), así que acá van SIN el prefijo `/api`.
 *
 * Regla: cada valor de este objeto tiene que corresponder a un controller real
 * verificado en `ENDPOINTS.md`. No se agregan sufijos de conveniencia que el
 * backend no expone. Ver `CONTRACTS.md §6`.
 */
export const API_URLS = {
  // --- Autenticación y sesión (ENDPOINTS.md §1) ---
  LOGIN_URL: '/login', // POST form-urlencoded, lo maneja Spring Security
  LOGOUT_URL: '/logout', // POST, lo maneja Spring Security
  REFRESH_TOKEN_URL: '/refresh', // GET
  WHOAMI_URL: '/whoami', // GET
  SIGNUP_URL: '/signup', // POST UserReqDTO (SU/AD)
  CHANGE_PASSWORD_URL: '/changePassword', // POST ChangePasswordForm (usuario logueado)
  TOKEN_URL: '/token', // GET /token/{token} — valida token de reset

  // --- Recuperación de contraseña (públicos) ---
  RECUPERAR_CUENTA_URL: '/user/resetPassword', // POST { userEmail }
  RECUPERAR_CUENTA_CONTRASEÑA_URL: '/user/changePassword', // POST { token, newPassword }

  // --- Usuarios (ENDPOINTS.md §2) ---
  USER_URL: '/user',

  // --- Authorities / roles (ENDPOINTS.md §3) — el recurso "rol" no existe en la API ---
  AUTHORITY_URL: '/authority',

  // --- Envíos (ENDPOINTS.md §4) ---
  ENVIO_URL: '/envio',
  DETALLE_ENVIO_URL: '/detalleEnvio', // §5
  PUNTO_ENTREGA_URL: '/puntoEntrega', // §6

  // --- Viajes (ENDPOINTS.md §7) ---
  VIAJE_URL: '/viaje',
  DETALLE_RECORRIDO_URL: '/detalleRecorrido', // §8

  // --- Tracking en tiempo real (ENDPOINTS.md §9) ---
  TRACKING_URL: '/tracking',

  // --- Tracking público / guest (CONTRACTS.md §7 · SHG-BE-001 / SHG-FE-025) ---
  // GET /api/public/tracking/{codigo} — sin auth, rate-limited (429).
  PUBLIC_TRACKING_URL: '/public/tracking',

  // --- Vehículos y catálogo de flota (ENDPOINTS.md §10-13) ---
  VEHICULO_URL: '/vehiculo',
  MARCA_URL: '/marca',
  MODELO_URL: '/modelo',
  TIPO_VEHICULO_URL: '/tipoVehiculo',
  COMBUSTIBLE_URL: '/combustible',
  TIPO_RUEDA_URL: '/tipoRueda',
  MANTENIMIENTO_URL: '/mantenimiento',
  TIPO_MANTENIMIENTO_URL: '/tipoMantenimiento',

  // --- Sucursales / Empresa (ENDPOINTS.md §14-15) ---
  SUCURSAL_URL: '/sucursal',
  EMPRESA_URL: '/empresa',

  // --- Categorías (ENDPOINTS.md §16) ---
  CATEGORIA_URL: '/categoria',

  // --- Catálogos read-only (ENDPOINTS.md §17) ---
  SEXO_URL: '/sexo',
  TIPO_DOC_URL: '/tipoDocumento',
  PROVINCIAS_URL: '/provincias',
  LOCALIDADES_URL: '/localidades',

  // --- Calificaciones (ENDPOINTS.md §18-19) ---
  CALIFICACION_CHOFER_URL: '/calificacionChofer',
  CALIFICACION_RUTA_URL: '/calificacionRuta',

  // --- Huella de carbono (ENDPOINTS.md §20) ---
  HUELLA_CARBONO_URL: '/huellaCarbono',

  // --- Notificaciones (ENDPOINTS.md §21) ---
  NOTIFICACIONES_URL: '/notificaciones',

  // --- Archivos (ENDPOINTS.md §22) — subir foto de perfil = POST /api/files ---
  FILES_URL: '/files',
};
