import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@config/restclient', () => ({
  restclient: { get: vi.fn() },
}));

import { restclient } from '@config/restclient';
import { dashboardApi } from './dashboard.api';

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restclient.get.mockResolvedValue({ data: { ok: true } });
  });

  it('getResumen pega a /dashboard/resumen con desde/hasta', async () => {
    await dashboardApi.getResumen({ desde: '2026-09-01', hasta: '2026-09-07', sucursalId: null });
    expect(restclient.get).toHaveBeenCalledWith('/dashboard/resumen', {
      params: { desde: '2026-09-01', hasta: '2026-09-07' },
    });
  });

  it('getSeries incluye sucursalId sólo cuando viene informado', async () => {
    await dashboardApi.getSeries({ desde: '2026-09-01', hasta: '2026-09-07', sucursalId: 3 });
    expect(restclient.get).toHaveBeenCalledWith('/dashboard/series', {
      params: { desde: '2026-09-01', hasta: '2026-09-07', sucursalId: 3 },
    });
  });

  it('devuelve response.data', async () => {
    restclient.get.mockResolvedValue({ data: { total: 42 } });
    await expect(
      dashboardApi.getResumen({ desde: '2026-09-01', hasta: '2026-09-07' }),
    ).resolves.toEqual({ total: 42 });
  });
});
