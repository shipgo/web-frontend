import { useCallback, useState } from 'react';

import { notifications } from '@mantine/notifications';

import { CSV_MAX_ROWS, csvFilename, toCsv } from '@utils/csv';

/**
 * Hook para el botón "Exportar CSV" de los listados.
 *
 * - Trae el dataset **completo que matchea los filtros actuales** (no sólo la
 *   página visible): pide una sola página de `CSV_MAX_ROWS` con los mismos
 *   params de filtro. Si el total supera ese límite, exporta las primeras
 *   `CSV_MAX_ROWS` filas y avisa por notification que se truncó.
 * - Expone `isExporting` para el spinner del botón.
 * - Nunca llama a los endpoints de reporte del backend: reusa el `GET` paginado
 *   de la entidad (`CONTRACTS.md §10`).
 *
 * @param {Object}   opts
 * @param {(limit: number) => Promise<{ rows: any[], total: number }>} opts.fetchRows
 *   Trae hasta `limit` filas crudas de la API con los filtros aplicados.
 * @param {import('@utils/csv').CsvColumn[]} opts.columns  Definición de columnas del CSV.
 * @param {string}   opts.entidad        Slug para el nombre de archivo (ej. `'envios'`).
 * @param {string}   [opts.entidadLabel] Texto para los mensajes (ej. `'envíos'`). Default: `entidad`.
 * @returns {{ exportar: () => Promise<void>, isExporting: boolean }}
 */
export const useCsvExport = ({ fetchRows, columns, entidad, entidadLabel }) => {
  const [isExporting, setIsExporting] = useState(false);
  const label = entidadLabel ?? entidad;

  const exportar = useCallback(async () => {
    setIsExporting(true);
    try {
      const { rows, total } = await fetchRows(CSV_MAX_ROWS);

      if (!rows || rows.length === 0) {
        notifications.show({
          title: 'Sin datos para exportar',
          message: `No hay ${label} que coincidan con los filtros aplicados.`,
          color: 'yellow',
        });
        return;
      }

      const exportadas = Math.min(rows.length, CSV_MAX_ROWS);
      const filas = rows.slice(0, CSV_MAX_ROWS);
      const truncado = (total ?? filas.length) > exportadas;

      toCsv(filas, columns, csvFilename(entidad));

      if (truncado) {
        notifications.show({
          title: 'Exportación truncada',
          message: `Se exportaron ${exportadas} de ${total} ${label}. Refiná los filtros para exportar el resto.`,
          color: 'yellow',
          autoClose: 8000,
        });
      } else {
        notifications.show({
          title: 'CSV generado',
          message: `Se exportaron ${exportadas} ${label}.`,
          color: 'green',
        });
      }
    } catch (error) {
      console.error(`Error exportando ${entidad} a CSV:`, error);
      notifications.show({
        title: 'Error al exportar',
        message: `No se pudo generar el CSV de ${label}.`,
        color: 'red',
      });
    } finally {
      setIsExporting(false);
    }
  }, [fetchRows, columns, entidad, label]);

  return { exportar, isExporting };
};
