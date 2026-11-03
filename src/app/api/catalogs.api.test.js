import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
vi.mock('@config/restclient', () => ({
  restclient: { get: (...args) => mockGet(...args) },
}));

import { notificacionesApi } from './catalogs.api';

describe('notificacionesApi.getHistorial (SHG-FE-142)', () => {
  beforeEach(() => mockGet.mockReset());

  it('GET /notificaciones/historial con page/size y devuelve el Page', async () => {
    const pagina = { content: [{ id: 1 }], totalPages: 1, totalElements: 1 };
    mockGet.mockResolvedValue({ data: pagina });

    const res = await notificacionesApi.getHistorial({ page: 2, size: 20 });

    expect(mockGet).toHaveBeenCalledWith('/notificaciones/historial', {
      params: { page: 2, size: 20 },
    });
    expect(res).toBe(pagina);
  });
});
