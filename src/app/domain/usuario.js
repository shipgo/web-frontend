/**
 * Nombre visible de un usuario (SHG-FE-133, `SHG-BE-154`).
 *
 * El primer SUPERUSER nace sólo con email: su `UserDTO` no trae `nombre` ni
 * `apellido`. Ninguna pantalla debe armar `${nombre} ${apellido}` a mano: usar
 * estos helpers, que nunca devuelven "undefined".
 */

const limpio = (value) => (typeof value === 'string' ? value.trim() : '');

/** `true` si el usuario ya cargó su nombre (completó la cuenta). */
export const tieneNombre = (user) => limpio(user?.nombre) !== '';

/**
 * Nombre completo si lo hay (`nombre apellido`, o sólo el que exista); si no,
 * `username`, si no `email`; si tampoco, `fallback` (`''` por defecto).
 */
export const nombreCompleto = (user, fallback = '') => {
  const partes = [limpio(user?.nombre), limpio(user?.apellido)].filter(Boolean);
  if (partes.length) return partes.join(' ');
  return limpio(user?.username) || limpio(user?.email) || fallback;
};

/**
 * Iniciales en mayúscula: de nombre/apellido si existen; si no, de la primera
 * letra de `username`/`email`. `''` si no hay nada.
 */
export const iniciales = (user) => {
  const desdeNombre = [limpio(user?.nombre), limpio(user?.apellido)]
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .join('');
  const base = desdeNombre || (limpio(user?.username) || limpio(user?.email)).charAt(0);
  return base.toUpperCase();
};

/**
 * "Completá tu cuenta" (SHG-FE-133): el usuario ya tiene empresa/sucursal (pasó
 * el onboarding; el `PUT /api/user/{id}` sobre sí mismo da `409 empresa_requerida`
 * antes) y todavía no cargó su nombre.
 */
export const necesitaCompletarCuenta = (user) =>
  Boolean(user) && Boolean(user.sucursal) && !tieneNombre(user);
