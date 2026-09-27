/** Columnas del CSV de modelos. */
export const MODELOS_CSV_COLUMNS = [
  { header: 'Nombre', value: (m) => m.nombre },
  { header: 'Marca', value: (m) => m.marca?.nombre },
  { header: 'Año', value: (m) => m.anio },
];
