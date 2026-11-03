import { formatDesdeAhora, formatFecha, formatFechaHora } from "@domain/format";

/**
 * Wrappers históricos sobre `@domain/format` (fuente única de formato).
 * Fecha vacía / inválida (`null`, `undefined`, texto no parseable) -> `EMPTY`
 * (`—`, de `@domain/format`), el mismo texto en pantalla y en el CSV.
 */
export const toLocalDate = (date, format) => formatFecha(date, format);

export const toLocalDateTime = (date, format) => formatFechaHora(date, format);

export const timeFromNow = (date) => formatDesdeAhora(date);
