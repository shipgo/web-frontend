/**
 * Verdad única de roles y chequeos de permisos (ver `CONTRACTS.md §3`).
 *
 * Valores canónicos del backend (`UserRoleName`, prefijo `ROLE_`):
 * - `ROLE_SUPERUSER` — todo, cross-empresa. (NO existe `ROLE_SUPER`.)
 * - `ROLE_ADMIN`     — gestión operativa de su sucursal.
 * - `ROLE_CHOFER`    — ejecuta viajes. Sólo app mobile.
 * - `ROLE_CARGA`     — carga de envíos al vehículo. Sólo app mobile.
 * - `ROLE_CUSTOMER`  — cliente final autorregistrado. Sólo el portal.
 *
 * La web es exclusiva SUPERUSER / ADMIN.
 */

export const ROLE_SUPERUSER = 'ROLE_SUPERUSER';
export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_CHOFER = 'ROLE_CHOFER';
export const ROLE_CARGA = 'ROLE_CARGA';
export const ROLE_CUSTOMER = 'ROLE_CUSTOMER';

/** Roles que pueden operar el panel web. */
export const ROLES_WEB = [ROLE_SUPERUSER, ROLE_ADMIN];

/** Home del panel de admin (SUPERUSER / ADMIN). */
export const ADMIN_HOME_PATH = '/';
/** Base de las rutas del portal CUSTOMER (SHG-FE-026). */
export const PORTAL_BASE_PATH = '/portal';
/** Home del portal CUSTOMER — a donde va un CUSTOMER recién autenticado. */
export const PORTAL_HOME_PATH = `${PORTAL_BASE_PATH}/envios`;

/** `valor canónico -> { label, color (paleta Mantine) }`. */
export const ROL = {
  [ROLE_SUPERUSER]: { label: 'Superusuario', color: 'grape' },
  [ROLE_ADMIN]: { label: 'Administrador', color: 'red' },
  [ROLE_CHOFER]: { label: 'Chofer', color: 'blue' },
  [ROLE_CARGA]: { label: 'Carga', color: 'teal' },
  [ROLE_CUSTOMER]: { label: 'Cliente', color: 'gray' },
};

const FALLBACK = { label: 'Usuario', color: 'gray' };

/**
 * Normaliza cualquier forma de rol a su valor canónico `ROLE_*` en mayúsculas.
 * Acepta `{ name }`, `{ authority }`, `"admin"`, `"ROLE_ADMIN"`, `"Administrador"`.
 */
export const normalizarRol = (rol) => {
  const raw =
    typeof rol === 'string' ? rol : rol?.name ?? rol?.authority ?? '';
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (!upper) return '';
  return upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`;
};

/**
 * Lista de roles canónicos (`['ROLE_ADMIN', ...]`) a partir de un usuario,
 * un array de authorities, o un array de strings.
 */
export const rolesDe = (user) => {
  if (!user) return [];
  const raw = Array.isArray(user)
    ? user
    : user.authorities ?? user.roles ?? [];
  return raw.map(normalizarRol).filter(Boolean);
};

/** `true` si el usuario tiene ese rol. */
export const hasRole = (user, role) => rolesDe(user).includes(normalizarRol(role));

/** `true` si el usuario tiene al menos uno de esos roles. */
export const hasAnyRole = (user, roles = []) => {
  const propios = rolesDe(user);
  return roles.map(normalizarRol).some((r) => propios.includes(r));
};

/** Atajo para la guarda web más común. */
export const isAdminOrSuper = (user) =>
  hasAnyRole(user, [ROLE_ADMIN, ROLE_SUPERUSER]);

/** `true` si el usuario es un cliente autorregistrado (portal). */
export const isCustomer = (user) => hasRole(user, ROLE_CUSTOMER);

/**
 * Ruta a la que va un usuario recién autenticado según su rol
 * (post-login y redirect "ya autenticado" de las rutas públicas):
 * CUSTOMER → portal; SUPERUSER / ADMIN → panel de admin.
 */
export const landingPathFor = (user) =>
  isCustomer(user) ? PORTAL_HOME_PATH : ADMIN_HOME_PATH;

/** `{ label, color }` para pintar un `<Badge>` de rol. */
export const rolBadge = (rol) => ROL[normalizarRol(rol)] ?? FALLBACK;

/** Sólo el label legible del rol. */
export const rolLabel = (rol) => {
  const canonico = normalizarRol(rol);
  if (ROL[canonico]) return ROL[canonico].label;
  return canonico.replace(/^ROLE_/, '').replace(/_/g, ' ') || FALLBACK.label;
};

/** Opciones `{ value, label }` para selects de rol. `value` = valor canónico. */
export const rolOptions = (roles = Object.keys(ROL)) =>
  roles.map((value) => ({ value, label: rolLabel(value) }));
