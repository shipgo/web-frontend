import { Button } from '@mantine/core';
import { IconFileTypeCsv } from '@tabler/icons-react';

/**
 * Botón compartido "Exportar CSV" para el header de los listados.
 * Muestra spinner mientras `useCsvExport` trae el dataset y arma el archivo.
 *
 * @param {Object}   props
 * @param {() => void} props.onExport   Handler de `useCsvExport().exportar`.
 * @param {boolean}  props.loading      `useCsvExport().isExporting`.
 * @param {boolean}  [props.disabled]   Deshabilita el botón (ej. mientras carga la lista).
 * @param {string}   [props.children]   Texto del botón. Default: `'Exportar CSV'`.
 */
const ExportCsvButton = ({ onExport, loading, disabled, children = 'Exportar CSV' }) => (
  <Button
    variant="subtle"
    leftSection={<IconFileTypeCsv size={18} />}
    onClick={onExport}
    loading={loading}
    disabled={disabled}
  >
    {children}
  </Button>
);

export default ExportCsvButton;
