import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../../../../../test/renderWithProviders';

vi.mock('@api', () => ({
  sucursalApi: { getAll: vi.fn() },
}));

import { sucursalApi } from '@api';
import { useAuthStore, Usuario } from '@stores/auth.store';
import { getDefaultFiltros } from '../dashboard.helpers';
import DashboardFiltros from './DashboardFiltros';

const setUser = (authorities) =>
  useAuthStore.setState({
    user: new Usuario({ id: 1, username: 'u', authorities }),
  });

describe('DashboardFiltros — gate del selector de sucursal por rol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sucursalApi.getAll.mockResolvedValue([
      { id: 1, nombre: 'Centro' },
      { id: 2, nombre: 'Norte' },
    ]);
  });

  it('ADMIN: no muestra el selector de sucursal ni pide el listado', async () => {
    setUser(['ROLE_ADMIN']);

    renderWithProviders(
      <DashboardFiltros value={getDefaultFiltros()} onChange={vi.fn()} />,
    );

    expect(
      screen.queryByPlaceholderText('Todas las sucursales'),
    ).not.toBeInTheDocument();
    // GET /api/sucursal/all es SUPERUSER-only → no debe llamarse para un ADMIN.
    await waitFor(() => expect(sucursalApi.getAll).not.toHaveBeenCalled());
  });

  it('SUPERUSER: muestra el selector y trae las sucursales', async () => {
    setUser(['ROLE_SUPERUSER']);

    renderWithProviders(
      <DashboardFiltros value={getDefaultFiltros()} onChange={vi.fn()} />,
    );

    expect(
      screen.getByPlaceholderText('Todas las sucursales'),
    ).toBeInTheDocument();
    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalledTimes(1));
  });

  it('SUPERUSER: elegir una sucursal emite el filtro con su id y label', async () => {
    setUser(['ROLE_SUPERUSER']);
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <DashboardFiltros value={getDefaultFiltros()} onChange={onChange} />,
    );
    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());

    await user.click(screen.getByPlaceholderText('Todas las sucursales'));
    await user.click(await screen.findByText('Norte'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sucursalId: '2', sucursalLabel: 'Norte' }),
    );
  });
});

describe('DashboardFiltros — quick filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUser(['ROLE_ADMIN']);
  });

  it('cambiar de quick-filter emite un rango nuevo y el label del chip', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <DashboardFiltros value={getDefaultFiltros()} onChange={onChange} />,
    );

    await user.click(screen.getByText('Último mes'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0];
    expect(emitted.quickFilterLabel).toBe('Último mes');
    expect(emitted.date[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(emitted.date[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
