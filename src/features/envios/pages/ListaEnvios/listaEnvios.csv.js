import { estadoLabel } from '@domain/estados';
import { toLocalDateTime } from '@utils/dates';

/** Fecha de alta = `historialEstado` con `estado === 'creado'` (idéntico a la tabla). */
const fechaAlta = (envio) =>
  (envio.historialEstado ?? []).find((h) => h.estado === 'creado')?.fechaHoraInicio ?? null;

const nombreCompleto = (envio) =>
  `${envio.nombre ?? ''} ${envio.apellido ?? ''}`.trim();

const direccionDestino = (envio) => {
  const d = envio.destino ?? {};
  return [d.nombreCalle, d.numeroCalle].filter(Boolean).join(' ');
};

/** Columnas del CSV de envíos (encabezados es-AR, ver `useCsvExport`). */
export const ENVIOS_CSV_COLUMNS = [
  { header: 'Código de seguimiento', value: (e) => e.codigoSeguimiento },
  { header: 'Remitente', value: nombreCompleto },
  { header: 'Email remitente', value: (e) => e.emailRemitente },
  { header: 'Teléfono', value: (e) => [e.prefijo, e.telefono].filter(Boolean).join(' ') },
  { header: 'Dirección de destino', value: direccionDestino },
  { header: 'Localidad', value: (e) => e.destino?.localidad?.nombre },
  { header: 'Provincia', value: (e) => e.destino?.localidad?.provincia?.nombre },
  { header: 'Estado', value: (e) => estadoLabel('envio', e.estado) },
  { header: 'Fecha de alta', value: (e) => toLocalDateTime(fechaAlta(e)) },
];
