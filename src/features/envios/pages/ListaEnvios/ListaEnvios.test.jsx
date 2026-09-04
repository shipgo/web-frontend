import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('@api', () => ({
  envioApi: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { envioApi } from '@api';
import ListaEnvios from './index';

const ENVIO_EN_SUCURSAL = {
  id: 1,
  nombre: 'Juan',
  apellido: 'García',
  codigoSeguimiento: 'SHG-DEV-0001',
  estado: 'en_sucursal',
  historialEstado: [
    { estado: 'creado', fechaHoraInicio: '2026-01-01T09:00:00' },
    { estado: 'en_sucursal', fechaHoraInicio: '2026-01-02T09:00:00' },
  ],
  destino: {
    id: 3,
    nombreCalle: 'Av. Colón',
    numeroCalle: '1234',
    localidad: { id: 5, nombre: 'Córdoba', provincia: { id: 2, nombre: 'Córdoba' } },
  },
};

const ENVIO_ENTREGADO = {
  id: 2,
  nombre: 'Ana',
  apellido: 'Pérez',
  codigoSeguimiento: 'SHG-DEV-0002',
  estado: 'entregado',
  historialEstado: [{ estado: 'creado', fechaHoraInicio: '2026-01-05T09:00:00' }],
  destino: {
    id: 4,
    nombreCalle: 'San Martín',
    numeroCalle: '99',
    localidad: { id: 6, nombre: 'Rosario', provincia: { id: 1, nombre: 'Santa Fe' } },
  },
};

describe('ListaEnvios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rows using EnvioDTO fields (codigo, destino, fecha de alta, estado badge)', async () => {
    envioApi.get.mockResolvedValue({
      content: [ENVIO_EN_SUCURSAL],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0001')).toBeInTheDocument();
    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.getByText('Av. Colón 1234')).toBeInTheDocument();
    expect(screen.getByText('Córdoba, Córdoba')).toBeInTheDocument();
    // Badge label from domain/estados, not the raw canonical value.
    expect(within(screen.getByRole('table')).getByText('En sucursal')).toBeInTheDocument();

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());
  });

  it('shows the empty state when there are no envíos', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('Sin envíos que mostrar')).toBeInTheDocument();
  });

  it('sends the EnvioFilter param names exactly as EnvioFilter expects (search/estado/fechaDesde/fechaHasta/destino)', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());

    await user.click(screen.getByRole('checkbox', { name: 'En camino' }));

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toEqual(['en_camino']);
      expect(lastCall).not.toHaveProperty('date');
    });
  });

  it('shows a warning toast (not a generic error) when deleting an envío returns 409', async () => {
    envioApi.get.mockResolvedValue({
      content: [ENVIO_ENTREGADO],
      totalElements: 1,
      totalPages: 1,
    });
    envioApi.delete.mockRejectedValue({
      response: {
        status: 409,
        data: {
          statusCode: 409,
          message:
            "No se puede eliminar el envío 2 porque está en estado 'entregado'. Solo se pueden eliminar envíos en estado 'creado', 'en_sucursal' o 'rechazado'.",
        },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0002')).toBeInTheDocument();

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button'));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('No se puede eliminar')).toBeInTheDocument();
    expect(
      await screen.findByText(/porque está en estado 'entregado'/),
    ).toBeInTheDocument();
  });

  it('refetches the list when deleting an envío succeeds', async () => {
    envioApi.get.mockResolvedValue({
      content: [ENVIO_EN_SUCURSAL],
      totalElements: 1,
      totalPages: 1,
    });
    envioApi.delete.mockResolvedValue({ codigo: 200, mensaje: 'El envío ha sido eliminado con éxito.' });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0001')).toBeInTheDocument();

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button'));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(envioApi.delete).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Envío eliminado')).toBeInTheDocument();
  });
});
