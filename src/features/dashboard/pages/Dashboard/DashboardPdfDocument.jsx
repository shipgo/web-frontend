import dayjs from 'dayjs';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import {
  getEnviosTotal,
  getFlotaTotal,
  mapDesvioViajes,
  mapEnviosDonut,
  mapFlotaDonut,
  mapResumenToKpis,
  mapVolumenPorCategoria,
  mapVolumenPorDia,
  mapVolumenPorSucursal,
} from './dashboard.mappers';

/**
 * Documento PDF del Dashboard, generado 100% client-side con `@react-pdf/renderer`
 * (layout propio — `CONTRACT-010`). Los charts van como **tablas de datos** (no
 * como captura de pantalla): react-pdf no rasteriza los SVG de Recharts y una
 * tabla es más legible y liviana. Se importa de forma dinámica desde
 * `exportarDashboard.js` para que la librería NO entre al bundle inicial.
 */

const COLORS = {
  primary: '#004d40',
  text: '#1f2937',
  dimmed: '#6b7280',
  border: '#e5e7eb',
  headerBg: '#f3f4f6',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 40,
    fontSize: 10,
    color: COLORS.text,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 10,
    marginBottom: 16,
  },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.primary },
  brandSub: { fontSize: 9, color: COLORS.dimmed, marginTop: 2 },
  metaBox: { alignItems: 'flex-end' },
  metaLine: { fontSize: 9, color: COLORS.dimmed },
  metaStrong: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.text },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginTop: 18,
    marginBottom: 8,
  },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
  },
  kpiLabel: { fontSize: 9, color: COLORS.dimmed, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.text },
  kpiHint: { fontSize: 8, color: COLORS.dimmed, marginTop: 3 },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4 },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  trLast: { flexDirection: 'row' },
  th: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: COLORS.headerBg,
  },
  td: { flex: 1, padding: 6, fontSize: 9 },
  tdRight: { flex: 1, padding: 6, fontSize: 9, textAlign: 'right' },
  empty: { fontSize: 9, color: COLORS.dimmed, fontStyle: 'italic', padding: 4 },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.dimmed,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
});

const fmtFecha = (d) => (dayjs(d).isValid() ? dayjs(d).format('DD/MM/YYYY') : '—');

const periodoTexto = (filtros, params) => {
  if (filtros?.quickFilterLabel) return filtros.quickFilterLabel;
  if (params?.desde && params?.hasta) {
    return `${fmtFecha(params.desde)} – ${fmtFecha(params.hasta)}`;
  }
  const [desde, hasta] = filtros?.date ?? [];
  if (desde && hasta) return `${fmtFecha(desde)} – ${fmtFecha(hasta)}`;
  return '—';
};

const sucursalTexto = (filtros, params) => {
  if (filtros?.sucursalLabel) return filtros.sucursalLabel;
  if (params?.sucursalId != null) return `Sucursal #${params.sucursalId}`;
  return 'Todas las sucursales';
};

const pct = (v) => (v == null ? '—' : `${Math.round(v)}%`);

const rowKey = (row, index) =>
  `${row.name ?? row.fecha ?? row.sucursal ?? row.viaje ?? 'row'}-${index}`;

const DataTable = ({ columns, rows, emptyLabel = 'Sin datos en el período' }) => {
  if (!rows || rows.length === 0) {
    return (
      <View style={styles.table}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        {columns.map((col) => (
          <Text key={col.key} style={styles.th}>
            {col.header}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        return (
          <View key={rowKey(row, index)} style={isLast ? styles.trLast : styles.tr}>
            {columns.map((col) => (
              <Text key={col.key} style={col.align === 'right' ? styles.tdRight : styles.td}>
                {String(row[col.key] ?? '—')}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const KpiCard = ({ label, value, hint }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
    {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
  </View>
);

/**
 * @param {{ filtros?: object, params?: object, resumen?: object, series?: object }} props
 */
const DashboardPdfDocument = ({ filtros, params, resumen, series }) => {
  const kpis = mapResumenToKpis(resumen);
  const generadoEl = dayjs().format('DD/MM/YYYY HH:mm');
  const periodo = periodoTexto(filtros, params);
  const sucursal = sucursalTexto(filtros, params);

  const volumenDia = mapVolumenPorDia(series).map((r) => ({
    fecha: r.fecha,
    cantidad: r.cantidad,
  }));
  const volumenSucursal = mapVolumenPorSucursal(series);
  const volumenCategoria = mapVolumenPorCategoria(series).map((r) => ({
    name: r.name,
    value: r.value,
  }));
  const desvios = mapDesvioViajes(series).map((r) => ({
    viaje: r.viaje,
    desvio: `${r.desvio > 0 ? '+' : ''}${r.desvio} min`,
  }));
  const enviosDonut = mapEnviosDonut(resumen).map((r) => ({ name: r.name, value: r.value }));
  const flotaDonut = mapFlotaDonut(resumen).map((r) => ({ name: r.name, value: r.value }));

  return (
    <Document
      title={`Dashboard ShipGo · ${periodo}`}
      author="ShipGo"
      subject="Resumen operativo del dashboard"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>ShipGo</Text>
            <Text style={styles.brandSub}>Resumen operativo del dashboard</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaStrong}>{periodo}</Text>
            <Text style={styles.metaLine}>{sucursal}</Text>
            <Text style={styles.metaLine}>Generado el {generadoEl}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Indicadores del período</Text>
        <View style={styles.kpiRow}>
          <KpiCard
            label="Envíos del período"
            value={kpis ? String(kpis.envios.value) : '—'}
            hint={
              kpis
                ? `${kpis.envios.entregados} entregados · ${kpis.envios.pendientes} pendientes`
                : undefined
            }
          />
          <KpiCard
            label="Viajes activos"
            value={kpis ? String(kpis.viajesActivos.value) : '—'}
            hint={
              kpis
                ? `${kpis.viajesActivos.planificados} planificados · ${kpis.viajesActivos.finalizados} finalizados`
                : undefined
            }
          />
          <KpiCard
            label="Incidencias"
            value={kpis ? String(kpis.incidencias.value) : '—'}
            hint={
              kpis
                ? `${kpis.incidencias.viajesConProblemas} viajes · ${kpis.incidencias.enviosRechazados} envíos rechazados`
                : undefined
            }
          />
          <KpiCard
            label="Entregas a tiempo"
            value={kpis ? pct(kpis.entregasATiempo.porcentaje) : '—'}
            hint={
              kpis
                ? `${kpis.entregasATiempo.aTiempo} de ${kpis.entregasATiempo.base} entregas con viaje`
                : undefined
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Volumen de envíos por día</Text>
        <DataTable
          columns={[
            { key: 'fecha', header: 'Fecha' },
            { key: 'cantidad', header: 'Envíos', align: 'right' },
          ]}
          rows={volumenDia}
        />

        <Text style={styles.sectionTitle}>Volumen por sucursal</Text>
        <DataTable
          columns={[
            { key: 'sucursal', header: 'Sucursal' },
            { key: 'cantidad', header: 'Envíos', align: 'right' },
          ]}
          rows={volumenSucursal}
        />

        <Text style={styles.sectionTitle}>Volumen por categoría</Text>
        <DataTable
          columns={[
            { key: 'name', header: 'Categoría' },
            { key: 'value', header: 'Envíos', align: 'right' },
          ]}
          rows={volumenCategoria}
        />

        <Text style={styles.sectionTitle}>
          Envíos por estado (total: {getEnviosTotal(resumen)})
        </Text>
        <DataTable
          columns={[
            { key: 'name', header: 'Estado' },
            { key: 'value', header: 'Envíos', align: 'right' },
          ]}
          rows={enviosDonut}
        />

        <Text style={styles.sectionTitle}>
          Flota por estado (total: {getFlotaTotal(resumen)})
        </Text>
        <DataTable
          columns={[
            { key: 'name', header: 'Estado' },
            { key: 'value', header: 'Vehículos', align: 'right' },
          ]}
          rows={flotaDonut}
        />

        <Text style={styles.sectionTitle}>Desvío de viajes finalizados</Text>
        <DataTable
          columns={[
            { key: 'viaje', header: 'Viaje' },
            { key: 'desvio', header: 'Desvío', align: 'right' },
          ]}
          rows={desvios}
          emptyLabel="Sin viajes finalizados en el período"
        />

        <View style={styles.footer} fixed>
          <Text>ShipGo · Dashboard operativo</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

export default DashboardPdfDocument;
