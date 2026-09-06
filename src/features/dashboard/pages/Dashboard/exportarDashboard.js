import { createElement } from 'react';

import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

import { downloadBlob } from '@utils/csv';

/**
 * "Exportar PDF" del Dashboard — generación 100% client-side (`CONTRACT-010`).
 *
 * Herramienta: **`@react-pdf/renderer`** con layout propio (los charts van como
 * tablas de datos). Se eligió sobre `jsPDF + html2canvas` porque:
 *  - No hay que rasterizar los SVG de Recharts ni pelear con los colores `oklch`
 *    de Mantine v9 → salida determinística y liviana.
 *  - El PDF se arma sólo con los datos que ya tiene la pantalla
 *    (`resumen` + `series` de `SHG-BE-003`), sin capturar el DOM.
 *
 * La librería (~y sus deps) se cargan con **`await import(...)`** para que NO
 * entren al bundle inicial (criterio de aceptación de `SHG-FE-028`).
 *
 * @param {{ filtros?: object, params?: object, resumen?: object, series?: object }} [data]
 */
export const exportarDashboardPDF = async ({ filtros, params, resumen, series } = {}) => {
  if (!resumen && !series) {
    notifications.show({
      title: 'Exportar PDF',
      message: 'Todavía no hay datos del dashboard para exportar.',
      color: 'yellow',
    });
    return;
  }

  const notifId = 'dashboard-pdf-export';
  notifications.show({
    id: notifId,
    loading: true,
    title: 'Generando PDF',
    message: 'Armando el resumen del dashboard…',
    autoClose: false,
    withCloseButton: false,
  });

  try {
    const [{ pdf }, { default: DashboardPdfDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('./DashboardPdfDocument'),
    ]);

    const blob = await pdf(
      createElement(DashboardPdfDocument, { filtros, params, resumen, series }),
    ).toBlob();

    const filename = `dashboard_${dayjs().format('YYYY-MM-DD')}.pdf`;
    downloadBlob(blob, filename);

    notifications.update({
      id: notifId,
      loading: false,
      color: 'green',
      title: 'PDF generado',
      message: filename,
      autoClose: 3000,
      withCloseButton: true,
    });
  } catch (error) {
    console.error('Error generando el PDF del dashboard:', error);
    notifications.update({
      id: notifId,
      loading: false,
      color: 'red',
      title: 'Error al exportar',
      message: 'No se pudo generar el PDF del dashboard.',
      autoClose: 4000,
      withCloseButton: true,
    });
  }
};
