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

  it('estado "vacío con filtros" muestra un CTA que limpia los filtros y vuelve a pedir sin ellos', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(screen.getByLabelText('Buscar envío')).not.toBeDisabled());
    await user.type(screen.getByLabelText('Buscar envío'), 'NoMatch');

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.search).toBe('NoMatch');
    });

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    const limpiarBtn = screen.getByRole('button', { name: 'Limpiar filtros' });

    await user.click(limpiarBtn);

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.search).toBeUndefined();
    });
    // El input del form (remontado) vuelve a estar vacío.
    expect(screen.getByLabelText('Buscar envío')).toHaveValue('');
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

  it('cambiar de página manda el índice 0-based que espera el backend', async () => {
    // UI: `Pagination` es 1-indexed (arranca en 1). Backend: `page` es 0-indexed
    // (CONTRACTS.md §4). `useGetEnvios` hace la conversión — esto verifica que
    // clickear "2" en la paginación termina en `page: 1`, no `page: 2`.
    envioApi.get.mockResolvedValue({ content: [ENVIO_EN_SUCURSAL], totalElements: 25, totalPages: 3 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
    expect(envioApi.get.mock.calls[0][0].page).toBe(0);

    // El botón de página existe desde el primer render (con `total` default),
    // pero queda `disabled` hasta que la data real (25 > PAGE_LIMIT) llega.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '2' })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(2));
    expect(envioApi.get.mock.calls.at(-1)[0].page).toBe(1);
  });

  it('combina varios filtros de texto a la vez en un solo request (search + destino)', async () => {
    // `search` y `destino` son campos independientes de `EnvioFilter`
    // (CONTRACTS.md §4) — deben viajar juntos en el mismo request sin que
    // uno pise al otro.
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
    // Esperar a que termine el fetch inicial: mientras `isFetching` es `true`
    // los inputs del filtro están `disabled` (`enhanceGetInputProps`), así que
    // tipear antes de esto no queda registrado.
    await waitFor(() => expect(screen.getByLabelText('Buscar envío')).not.toBeDisabled());

    await user.type(screen.getByLabelText('Buscar envío'), 'García');
    await user.type(screen.getByLabelText('Destino'), 'Av. Colón');

    await waitFor(
      () => {
        const lastCall = envioApi.get.mock.calls.at(-1)[0];
        expect(lastCall.search).toBe('García');
        expect(lastCall.destino).toBe('Av. Colón');
        // Cambiar de filtro reinicia a la primera página.
        expect(lastCall.page).toBe(0);
      },
      { timeout: 2000 },
    );
  });

  it('el quick-filter "En camino" no deja residuos de un texto tipeado antes', async () => {
    // `handleQuickFilterChange` reemplaza TODO el form con `DEFAULT_VALUES` +
    // el propio quick-filter — si tenía texto tipeado en `search`/`destino`,
    // ese texto no debe viajar junto al quick-filter.
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText('Buscar envío')).not.toBeDisabled());

    await user.type(screen.getByLabelText('Buscar envío'), 'García');
    await user.click(screen.getByRole('checkbox', { name: 'En camino' }));

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toEqual(['en_camino']);
      expect(lastCall.search).toBeUndefined();
    });
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
