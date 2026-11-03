import { notifications } from '@mantine/notifications';

import { csvFilename, toCsv } from '@utils/csv';

/**
 * Hook para "Exportar seleccionados" (`SelectionBanner`, SHG-FE-095).
 *
 * A diferencia de `useCsvExport` (que trae TODO el dataset filtrado desde el
 * backend), acá sólo se exportan las filas ya presentes en memoria (`rows`,
 * normalmente `data.results` de la página actual) cuyo `id` está en
 * `selectedIds`. La selección de cada listado está acotada a la página
 * visible — se limpia al cambiar de página/filtro (ver el `useEffect` sobre
 * `data.results` en cada `index.jsx`) — así que no hace falta un fetch
 * aparte ni truncar por `CSV_MAX_ROWS`.
 *
 * Reusa el helper CSV existente (`@utils/csv`), que ya neutraliza CSV
 * injection y arma el archivo con BOM/`;`/CRLF para Excel es-AR.
 *
 * @param {Object}   opts
 * @param {import('@utils/csv').CsvColumn[]} opts.columns  Definición de columnas del CSV.
 * @param {string}   opts.entidad        Slug para el nombre de archivo (ej. `'envios-seleccionados'`).
 * @param {string}   [opts.entidadLabel] Texto para los mensajes (ej. `'envíos'`). Default: `entidad`.
 * @returns {{ exportarSeleccionados: (rows: any[], selectedIds: Set<any>) => void }}
 */
export const useExportSelectedCsv = ({ columns, entidad, entidadLabel }) => {
  const label = entidadLabel ?? entidad;

  const exportarSeleccionados = (rows, selectedIds) => {
    const filas = (rows ?? []).filter((row) => selectedIds?.has(row.id));

    if (filas.length === 0) {
      notifications.show({
        title: 'Sin datos para exportar',
        message: `No hay ${label} seleccionados para exportar.`,
        color: 'yellow',
      });
      return;
    }

    toCsv(filas, columns, csvFilename(entidad));

    notifications.show({
      title: 'CSV generado',
      message: `Se exportaron ${filas.length} ${label}.`,
      color: 'green',
    });
  };

  return { exportarSeleccionados };
};
