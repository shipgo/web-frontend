import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Route } from 'wouter';

import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('@hooks/useIsMobile', () => ({
  useIsMobile: () => true,
  MOBILE_QUERY: '',
}));

vi.mock('@api', () => ({
  viajeApi: { getById: vi.fn(), finalizar: vi.fn(), reanudar: vi.fn(), cancelar: vi.fn() },
  trackingApi: { getUltimaUbicacion: vi.fn(), getHistorial: vi.fn() },
}));
vi.mock('@components/Map', () => ({
  default: ({ children }) => <div data-testid="mapa-viaje">{children}</div>,
}));
vi.mock('react-map-gl/mapbox', () => ({
  Marker: ({ children }) => <div>{children}</div>,
  Source: ({ children }) => <div>{children}</div>,
  Layer: () => null,
  useMap: () => ({ current: null }),
}));

import { trackingApi, viajeApi } from '@api';
import { useAuthStore, Usuario } from '@stores/auth.store';
import DetalleViaje from './index';

const VIAJE = {
  id: 42,
  estado: 'planificado',
  fechaHoraInicioPlanificada: '2026-08-01T09:00:00',
  fechaHoraFinPlanificada: '2026-08-01T17:00:00',
  vehiculo: { id: 5, patente: 'AB123CD', modelo: { nombre: 'Hilux' } },
  choferes: [{ id: 10, nombre: 'Juan', apellido: 'Perez' }],
  sucursal: { id: 2, nombre: 'Sucursal Centro' },
  recorridos: [
    {
      id: 1,
      orden: 1,
      estado: 'planificado',
      puntoEntrega: { nombreCalle: 'Av. Colón', numeroCalle: '1234' },
      detalleRecorridos: [
        { id: 100, envio: { id: 200, codigoSeguimiento: 'ABC123', nombre: 'Pedro', apellido: 'Ruiz' } },
      ],
    },
  ],
  historialEstado: [{ id: 1, estado: 'creado', fechaHoraInicio: '2026-08-01T08:00:00' }],
};

describe('DetalleViaje en mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viajeApi.getById.mockResolvedValue(VIAJE);
    trackingApi.getUltimaUbicacion.mockResolvedValue(null);
    trackingApi.getHistorial.mockResolvedValue([]);
    useAuthStore.setState({
      user: new Usuario({ id: 1, username: 'admin1', authorities: ['ROLE_ADMIN'] }),
      isAuthenticated: true,
    });
  });

  const render = () =>
    renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, { route: '/viajes/42' });

  it('la acción principal va en la barra fija y Cancelar viaje en su menú', async () => {
    const user = userEvent.setup();
    render();
    await screen.findByText('Viaje #42');

    const barra = screen.getByTestId('sticky-action-bar');
    expect(barra).toHaveTextContent('Editar');
    // No quedan botones sueltos en el encabezado de la tarjeta.
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Cancelar viaje' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Más acciones' }));
    expect(await screen.findByRole('menuitem', { name: 'Cancelar viaje', hidden: true })).toBeInTheDocument();
  });

  it('las paradas son plegables y la primera viene abierta', async () => {
    render();
    await screen.findByText('Viaje #42');

    const control = screen.getByRole('button', { name: /Parada 1/ });
    expect(control).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(screen.getByText('ABC123')).toBeVisible());
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
