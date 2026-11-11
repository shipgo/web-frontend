import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Route } from 'wouter';

import { renderWithProviders } from '../../../../test/renderWithProviders';

const mobile = { value: true };
vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: () => mobile.value,
  MOBILE_QUERY: '',
}));

vi.mock('@api', () => ({
  envioApi: {
    getById: vi.fn(),
    entregar: vi.fn(),
    falloEntrega: vi.fn(),
  },
}));

import { envioApi } from '@api';
import { useAuthStore, Usuario } from '@stores/auth.store';
import DetalleEnvio from './index';

const ENVIO = {
  id: 9,
  nombre: 'Juan',
  apellido: 'García',
  emailRemitente: 'remitente@test.com',
  estado: 'en_camino',
  codigoSeguimiento: 'ABC123XYZ',
  sucursalOrigen: { id: 2, nombre: 'Sucursal Norte' },
  destino: {
    id: 3,
    nombreCalle: 'Av. Colón',
    numeroCalle: '1234',
    localidad: { id: 5, nombre: 'Córdoba', provincia: { id: 2, nombre: 'Córdoba' } },
  },
  detalleEnvios: [{ id: 11, categoria: { id: 1, nombre: 'Documentación' }, descripcion: 'Sobre', peso: 0.5 }],
  historialEstado: [{ id: 1, estado: 'creado', fechaHoraInicio: '2026-09-01T08:00:00' }],
  detalleRecorridos: [],
};

describe('DetalleEnvio en mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobile.value = true;
    envioApi.getById.mockResolvedValue(ENVIO);
    useAuthStore.setState({
      user: new Usuario({ id: 1, username: 'admin1', authorities: ['ROLE_ADMIN'] }),
      isAuthenticated: true,
    });
  });

  it('la acción principal "Entregar" va en la barra fija y la entrega fallida en su menú', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, { route: '/envios/9' });

    const barra = await screen.findByTestId('sticky-action-bar');
    expect(barra).toHaveTextContent('Entregar');

    await user.click(screen.getByRole('button', { name: 'Más acciones' }));
    expect(await screen.findByRole('menuitem', { name: /Registrar entrega fallida/, hidden: true })).toBeInTheDocument();
  });

  it('las secciones son un acordeón con la primera abierta', async () => {
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, { route: '/envios/9' });

    await screen.findByTestId('sticky-action-bar');
    const ubicacion = screen.getByRole('button', { name: 'Ubicación actual y seguimiento' });
    const paquetes = screen.getByRole('button', { name: 'Paquetes' });
    expect(ubicacion).toHaveAttribute('aria-expanded', 'true');
    expect(paquetes).toHaveAttribute('aria-expanded', 'false');
  });

  it('en escritorio no hay barra fija y "Entregar" está en el encabezado', async () => {
    mobile.value = false;
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, { route: '/envios/9' });

    expect(await screen.findByRole('button', { name: /^Entregar$/ })).toBeInTheDocument();
    expect(screen.queryByTestId('sticky-action-bar')).not.toBeInTheDocument();
  });
});
