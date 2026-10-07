import { PORTAL_BASE_PATH } from '@domain/roles';

// Única fuente de verdad de los paths de las secciones que EXIGEN sesión.
// `PROTECTED_SECTIONS` de `routes/index.jsx` los consume para armar las
// `<Route>` (mapeándolos a su componente/roles), y este módulo los usa para
// `isProtectedPath`, que deciden `restclient.js` (interceptor del 401) y
// `AuthProvider` para mandar a `/login`. Módulo sin imports lazy a propósito:
// así `restclient` no arrastra las páginas. SHG-FE-104: antes se enumeraban las
// rutas públicas y todo lo demás —incluida una URL inexistente— terminaba en
// `/login`, tapando la 404 pública (regresión de SHG-FE-100). Ahora sólo se
// redirige si la ruta es una protegida real.
//
// Si agregás una sección protegida, agregá su path acá y usalo en
// `PROTECTED_SECTIONS`.
export const SECTION_PATHS = {
  mapa: '/mapa',
  dashboard: '/dashboard',
  envios: '/envios',
  viajes: '/viajes',
  usuarios: '/usuarios',
  sucursales: '/sucursales',
  vehiculos: '/vehiculos',
  catalogoVehiculos: '/catalogo-vehiculos',
  mantenimientos: '/mantenimientos',
};

// Secciones de gestión + portal CUSTOMER (requiere sesión, salvo la entrada
// pública de abajo).
export const PROTECTED_PATH_PREFIXES = [...Object.values(SECTION_PATHS), PORTAL_BASE_PATH];

// Única excepción pública dentro de `/portal` (SHG-FE-044).
const PUBLIC_PORTAL_ENTRY = '/portal/ingresar';

const matchesPrefix = (path, prefix) =>
  path === prefix || path.startsWith(`${prefix}/`);

/** true si `path` es una ruta protegida real (requiere sesión). */
export const isProtectedPath = (path) =>
  !matchesPrefix(path, PUBLIC_PORTAL_ENTRY) &&
  PROTECTED_PATH_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
