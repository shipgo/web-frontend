import { beforeEach, describe, expect, it, vi } from 'vitest';

const toBlob = vi.fn(() => Promise.resolve(new Blob(['%PDF-1.4'])));
const pdf = vi.fn(() => ({ toBlob }));

vi.mock('@react-pdf/renderer', () => ({ pdf }));
vi.mock('./DashboardPdfDocument', () => ({ default: () => null }));

const downloadBlob = vi.fn();
vi.mock('@utils/csv', () => ({ downloadBlob: (...args) => downloadBlob(...args) }));

const show = vi.fn();
const update = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args) => show(...args),
    update: (...args) => update(...args),
  },
}));

import { exportarDashboardPDF } from './exportarDashboard';

const RESUMEN = { envios: { total: 3, porEstado: {} }, flota: { total: 1, porEstado: {} } };
const SERIES = { volumenPorDia: [{ fecha: '2026-09-01', cantidad: 3 }] };

describe('exportarDashboardPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ya NO es un stub: genera el PDF con @react-pdf/renderer y dispara la descarga', async () => {
    await exportarDashboardPDF({ filtros: {}, params: { desde: '2026-09-01', hasta: '2026-09-07' }, resumen: RESUMEN, series: SERIES });

    expect(pdf).toHaveBeenCalledTimes(1);
    expect(toBlob).toHaveBeenCalledTimes(1);
    expect(downloadBlob).toHaveBeenCalledTimes(1);

    const [, filename] = downloadBlob.mock.calls[0];
    expect(filename).toMatch(/^dashboard_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('nunca muestra el mensaje "próximamente" del stub anterior', async () => {
    await exportarDashboardPDF({ resumen: RESUMEN, series: SERIES });
    const mensajes = [...show.mock.calls, ...update.mock.calls]
      .map(([arg]) => `${arg?.title ?? ''} ${arg?.message ?? ''}`)
      .join(' ');
    expect(mensajes.toLowerCase()).not.toContain('próximamente');
  });

  it('muestra un spinner (loading) mientras genera y lo cierra al terminar', async () => {
    await exportarDashboardPDF({ resumen: RESUMEN, series: SERIES });
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ loading: true }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ loading: false, color: 'green' }));
  });

  it('avisa y no genera nada si no hay datos', async () => {
    await exportarDashboardPDF({});
    expect(pdf).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ color: 'yellow' }));
  });

  it('reporta error si la generación falla', async () => {
    toBlob.mockRejectedValueOnce(new Error('boom'));
    await exportarDashboardPDF({ resumen: RESUMEN, series: SERIES });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });
});
