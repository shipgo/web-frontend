import dayjs from "dayjs";

import { formatDesdeAhora } from "@domain/format";

const LOCAL_DATE_FORMAT = "DD/MM/YYYY";
const LOCAL_DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";

export const toLocalDate = (date, format = LOCAL_DATE_FORMAT) => {
  const dateToFormat = dayjs(date);
  if (dateToFormat.isValid()) return dateToFormat.format(format);
  return "-";
};

export const toLocalDateTime = (date, format = LOCAL_DATE_TIME_FORMAT) => {
  const dateToFormat = dayjs(date);
  if (dateToFormat.isValid()) return dateToFormat.format(format);
  return "-";
};

export const timeFromNow = (date) => {
  const dateToFormat = dayjs(date);
  // Relativo en español: misma fuente (locale `es` por llamada) que `formatDesdeAhora`.
  if (dateToFormat.isValid()) return formatDesdeAhora(date);
  return "-";
};
