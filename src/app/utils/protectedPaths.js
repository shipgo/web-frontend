// Única fuente de verdad (junto con `PROTECTED_SECTIONS` de `routes/index.jsx`,
// que además mapea cada prefijo a su componente) de qué rutas EXIGEN sesión.
// Lo usan `restclient.js` (interceptor del 401) y `AuthProvider` para decidir si
// mandar a `/login`. SHG-FE-104: antes se enumeraban las rutas públicas y todo
// lo demás —incluida una URL inexistente— terminaba en `/login`, tapando la 404
// pública (regresión de SHG-FE-100). Ahora sólo se redirige si la ruta es una
// protegida real; una desconocida cae en la 404 de `AppRoutes`.
//
// Si agregás una sección a `PROTECTED_SECTIONS`, agregá su prefijo acá.
export const PROTECTED_PATH_PREFIXES = [
  '/mapa',
  '/dashboard',
  '/envios',
  '/viajes',
  '/usuarios',
  '/sucursales',
  '/vehiculos',
  '/catalogo-vehiculos',
  '/mantenimientos',
  // Portal CUSTOMER (requiere sesión), salvo la entrada pública de abajo.
  '/portal',
];

// Única excepción pública dentro de `/portal` (SHG-FE-044).
const PUBLIC_PORTAL_ENTRY = '/portal/ingresar';

const matchesPrefix = (path, prefix) =>
  path === prefix || path.startsWith(`${prefix}/`);

/** true si `path` es una ruta protegida real (requiere sesión). */
export const isProtectedPath = (path) =>
  !matchesPrefix(path, PUBLIC_PORTAL_ENTRY) &&
  PROTECTED_PATH_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
