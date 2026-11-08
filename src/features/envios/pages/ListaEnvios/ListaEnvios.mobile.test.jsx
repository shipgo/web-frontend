import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../../test/renderWithProviders';

const mobile = { value: true };
vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: () => mobile.value,
  MOBILE_QUERY: '',
}));

vi.mock('@api', () => ({
  envioApi: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { envioApi } from '@api';
import ListaEnvios from './index';

const ENVIO = {
  id: 1,
  nombre: 'Juan',
  apellido: 'García',
  codigoSeguimiento: 'SHG-DEV-0001',
  estado: 'en_sucursal',
  historialEstado: [{ estado: 'creado', fechaHoraInicio: '2026-01-01T09:00:00' }],
  destino: {
    id: 3,
    nombreCalle: 'Av. Colón',
    numeroCalle: '1234',
    localidad: { id: 5, nombre: 'Córdoba', provincia: { id: 2, nombre: 'Córdoba' } },
  },
};

describe('ListaEnvios en mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobile.value = true;
    envioApi.get.mockResolvedValue({ content: [ENVIO], totalElements: 1, totalPages: 1 });
  });

  it('muestra tarjetas en vez de tabla, con código, remitente → destino y fecha', async () => {
    renderWithProviders(<ListaEnvios />);

    const card = await screen.findByTestId('list-card');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(within(card).getByText('SHG-DEV-0001')).toBeInTheDocument();
    expect(within(card).getByText('En sucursal')).toBeInTheDocument();
    expect(within(card).getByText(/Juan García → Av\. Colón 1234, Córdoba/)).toBeInTheDocument();
    expect(within(card).getByText('01/01/2026')).toBeInTheDocument();
    expect(within(card).getByRole('checkbox', { name: 'Seleccionar envío SHG-DEV-0001' })).toBeInTheDocument();
  });

  it('seleccionar una tarjeta muestra el banner de selección', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await user.click(await screen.findByRole('checkbox', { name: 'Seleccionar envío SHG-DEV-0001' }));
    expect(await screen.findByText(/1 envío seleccionado/)).toBeInTheDocument();
  });

  it('los filtros secundarios van en la hoja "Filtros" y el buscador queda afuera', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await screen.findByTestId('list-card');
    expect(screen.getByLabelText('Buscar envío')).toBeInTheDocument();
    expect(screen.queryByLabelText('Destino')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Filtros/ }));
    expect(await screen.findByLabelText('Destino')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver 1 resultados/ })).toBeInTheDocument();
  });

  it('en escritorio sigue mostrando la tabla', async () => {
    mobile.value = false;
    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByTestId('list-card')).not.toBeInTheDocument();
  });
});
