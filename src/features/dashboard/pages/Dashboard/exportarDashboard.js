import { notifications } from '@mantine/notifications';

/**
 * Stub de "Exportar PDF". La exportación real (client-side, `@react-pdf/renderer`
 * o jsPDF+html2canvas — ver `CONTRACTS.md §10`) es responsabilidad de
 * **`SHG-FE-028`**. Esta tarea (`SHG-FE-015`) sólo deja el botón visible y
 * cableado a esta función para que `SHG-FE-028` reemplace la implementación sin
 * tocar la pantalla.
 *
 * El caller ya le pasa `{ filtros, params, resumen, series }` (lo que va a
 * necesitar `SHG-FE-028` para armar el PDF); el stub lo ignora.
 */
export const exportarDashboardPDF = () => {
  notifications.show({
    title: 'Exportar PDF',
    message: 'La exportación del dashboard estará disponible próximamente (SHG-FE-028).',
    color: 'blue',
  });
};
