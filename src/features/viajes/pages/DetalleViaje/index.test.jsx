import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Route } from 'wouter';

import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('@api', () => ({
  viajeApi: { getById: vi.fn() },
  trackingApi: { getUltimaUbicacion: vi.fn() },
}));

// El mini-mapa (Mapbox GL) no funciona sobre jsdom (requiere WebGL real);
// se reemplaza por un stub liviano para poder testear el resto de la pantalla.
vi.mock('@components/Map', () => ({
  default: ({ children }) => <div data-testid="mapa-viaje">{children}</div>,
}));
vi.mock('react-map-gl/mapbox', () => ({
  Marker: ({ children }) => <div>{children}</div>,
}));

import { trackingApi, viajeApi } from '@api';
import DetalleViaje from './index';

const EXISTING_VIAJE = {
  id: 42,
  estado: 'en_camino',
  fechaHoraInicioPlanificada: '2026-08-01T09:00:00',
  fechaHoraFinPlanificada: '2026-08-01T17:00:00',
  fechaHoraInicio: '2026-08-01T09:15:00',
  fechaHoraFin: null,
  vehiculo: { id: 5, patente: 'AB123CD', modelo: { nombre: 'Hilux' } },
  choferes: [{ id: 10, nombre: 'Juan', apellido: 'Perez' }],
  responsable: { id: 1, nombre: 'Ana', apellido: 'Gomez' },
  sucursal: { id: 2, nombre: 'Sucursal Centro' },
  recorridos: [
    {
      id: 1,
      orden: 1,
      estado: 'planificado',
      puntoEntrega: { nombreCalle: 'Av. Colón', numeroCalle: '1234', latitud: -31.4, longitud: -64.18 },
      sucursalDestino: null,
      detalleRecorridos: [
        {
          id: 100,
          envio: {
            id: 200,
            codigoSeguimiento: 'ABC123',
            nombre: 'Pedro',
            apellido: 'Ruiz',
            detalleEnvios: [{ id: 1, peso: 2.5 }],
          },
        },
      ],
    },
  ],
  historialEstado: [
    { id: 1, estado: 'creado', fechaHoraInicio: '2026-08-01T08:00:00' },
    { id: 2, estado: 'en_camino', fechaHoraInicio: '2026-08-01T09:15:00' },
  ],
};

describe('DetalleViaje', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viajeApi.getById.mockResolvedValue(EXISTING_VIAJE);
    trackingApi.getUltimaUbicacion.mockResolvedValue({ latitud: -31.41, longitud: -64.19 });
  });

  it('carga el viaje y muestra header, recorridos, historial y envíos', async () => {
    renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
      route: '/viajes/42',
    });

    await waitFor(() => {
      expect(viajeApi.getById).toHaveBeenCalledWith('42');
    });

    expect(await screen.findByText('Viaje #42')).toBeInTheDocument();
    expect(screen.getAllByText('En camino').length).toBeGreaterThan(0);
    expect(screen.getByText('AB123CD - Hilux')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Ana Gomez')).toBeInTheDocument();
    expect(screen.getAllByText('Sucursal Centro').length).toBeGreaterThan(0);

    expect(screen.getByText('Recorrido #1')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Pedro Ruiz')).toBeInTheDocument();

    expect(screen.getByText('Historial de estados')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();

    expect(screen.getByTestId('mapa-viaje')).toBeInTheDocument();
  });

  it('muestra un error si falla la carga del viaje', async () => {
    viajeApi.getById.mockRejectedValue(new Error('boom'));

    renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
      route: '/viajes/42',
    });

    expect(await screen.findByText('No se pudo cargar el viaje')).toBeInTheDocument();
  });
});
