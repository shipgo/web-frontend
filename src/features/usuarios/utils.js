import dayjs from 'dayjs';

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
