import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const LOCAL_DATE_FORMAT = 'DD/MM/YYYY HH:mm';

export const toLocalDate = (date, format = LOCAL_DATE_FORMAT) => {
  const dateToFormat = dayjs(date);
  if (dateToFormat.isValid()) return dateToFormat.format(format);
  return '-';
};

export const timeFromNow = (date) => {
  const dateToFormat = dayjs(date);
  if (dateToFormat.isValid()) return dateToFormat.fromNow();
  return '-';
};