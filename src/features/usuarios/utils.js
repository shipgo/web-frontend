import dayjs from 'dayjs';
import { ROLE_ADMIN, ROLE_SUPERUSER, hasAnyRole, hasRole } from '@domain/roles';

/**
 * Formatea una fecha para el backend (`UserReqDTO.fechaNacimiento`, `java.time.LocalDate`).
 * Devuelve `YYYY-MM-DD` **sin** conversión de zona horaria — `Date#toISOString()` serializa
 * en UTC y puede correr la fecha un día según el desfase horario del usuario (mismo bug
 * documentado para `ViajeReqDTO` en `SHG-FE-008`, ver `planning/coordination/frontend.md`).
 * `LocalDate` no acepta hora/offset, así que tampoco debe llevar sufijo `T00:00:00`.
 *
 * @param {Date|string|null} date
 * @returns {string|null}
 */
export const toBackendDate = (date) => {
  if (!date) return null;
  const d = dayjs(date);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
};

/**
 * SHG-FE-121 / SHG-BE-107: un ADMIN sólo puede editar o borrar usuarios que no
 * sean ADMIN ni SUPERUSER (el backend responde 404), salvo su propio perfil
 * (edición). Un SUPERUSER puede con todos. Se usa para ocultar "Editar" /
 * "Eliminar", deshabilitar la selección masiva y bloquear la ruta de edición.
 *
 * @param {Object} currentUser  Usuario logueado.
 * @param {Object} target       Usuario de la fila / del detalle.
 * @returns {boolean}
 */
export const canManageUsuario = (currentUser, target) => {
  if (hasRole(currentUser, ROLE_SUPERUSER)) return true;
  if (
    currentUser?.id != null &&
    target?.id != null &&
    String(currentUser.id) === String(target.id)
  ) {
    return true;
  }
  return !hasAnyRole(target, [ROLE_ADMIN, ROLE_SUPERUSER]);
};
