import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-map-gl/mapbox', () => ({
  Layer: ({ id, beforeId }) => <div data-testid="layer" data-id={id} data-before={beforeId ?? ''} />,
  Source: ({ id, data, children }) => (
    <div data-testid="source" data-id={id} data-coords={JSON.stringify(data?.geometry?.coordinates ?? null)}>
      {children}
    </div>
  ),
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({ current: null }),
}));
vi.mock('mapbox-gl', () => ({ LngLatBounds: class { extend() {} } }));

const mockGetHistorial = vi.fn();
vi.mock('@api/tracking.api', () => ({ trackingApi: { getHistorial: (...a) => mockGetHistorial(...a) } }));

const mockSelected = vi.fn();
vi.mock('../contexts/selectedViaje', () => ({ useSelectedViaje: () => mockSelected() }));
vi.mock('../hooks/useViajesConUbicacion', () => ({
  useViajesConUbicacion: () => ({
    viajes: [
      { id: 1, patente: 'A', choferNombre: 'C', currentLocation: [-58.39, -34.59], ultimaActualizacion: new Date().toISOString() },
      { id: 2, patente: 'B', choferNombre: 'D', currentLocation: [-58.5, -34.7], ultimaActualizacion: new Date().toISOString() },
    ],
  }),
}));
const mockRoute = vi.fn();
vi.mock('../hooks/useGetRoute', () => ({ useGetRoute: () => mockRoute() }));

import MapRoute from './MapRoute';

const renderIt = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MantineProvider>
        <MapRoute />
      </MantineProvider>
    </QueryClientProvider>,
  );

describe('MapRoute historial', () => {
  beforeEach(() => {
    mockGetHistorial.mockReset();
    mockSelected.mockReturnValue({ selectedViajeId: 1 });
    mockRoute.mockReturnValue({ viaje: null, paradas: [], progreso: null, route: null });
  });

  it('pide el historial y dibuja la línea extendida hasta la ubicación actual', async () => {
    mockGetHistorial.mockResolvedValue([
      { orden: 2, latitud: -34.595, longitud: -58.395 },
      { orden: 1, latitud: -34.6, longitud: -58.4 },
    ]);
    renderIt();
    await waitFor(() => expect(screen.getByTestId('source')).toBeInTheDocument());
    expect(mockGetHistorial).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('source').dataset.id).toBe('historial-1');
    expect(JSON.parse(screen.getByTestId('source').dataset.coords)).toEqual([
      [-58.4, -34.6],
      [-58.395, -34.595],
      [-58.39, -34.59],
    ]);
  });

  it('sin historial no hay capa', async () => {
    mockGetHistorial.mockResolvedValue([]);
    renderIt();
    await waitFor(() => expect(mockGetHistorial).toHaveBeenCalled());
    expect(screen.queryByTestId('source')).toBeNull();
  });

  it('si el historial falla, no hay capa ni error', async () => {
    mockGetHistorial.mockRejectedValue(new Error('404'));
    renderIt();
    await waitFor(() => expect(mockGetHistorial).toHaveBeenCalled());
    expect(screen.queryByTestId('source')).toBeNull();
  });

  const historialLayer = () =>
    screen.getAllByTestId('layer').find((l) => l.dataset.id.startsWith('historial-line'));

  it('sin ruta el Layer del historial no recibe beforeId', async () => {
    mockGetHistorial.mockResolvedValue([
      { orden: 1, latitud: -34.6, longitud: -58.4 },
      { orden: 2, latitud: -34.595, longitud: -58.395 },
    ]);
    renderIt();
    await waitFor(() => expect(historialLayer()).toBeTruthy());
    expect(historialLayer().dataset.before).toBe('');
  });

  it('con ruta el Layer del historial recibe beforeId="route" y se declara después', async () => {
    mockRoute.mockReturnValue({
      viaje: null,
      paradas: [],
      progreso: null,
      route: { geometry: {}, waypoints: [[-58.4, -34.6]], legDistances: [], totalDistance: 0 },
    });
    mockGetHistorial.mockResolvedValue([
      { orden: 1, latitud: -34.6, longitud: -58.4 },
      { orden: 2, latitud: -34.595, longitud: -58.395 },
    ]);
    renderIt();
    await waitFor(() => expect(historialLayer()).toBeTruthy());
    expect(historialLayer().dataset.before).toBe('route');
    const ids = screen.getAllByTestId('layer').map((l) => l.dataset.id);
    expect(ids.indexOf('route')).toBeLessThan(ids.findIndex((i) => i.startsWith('historial-line')));
  });

  it('al cambiar de viaje pide el historial del nuevo y el trazo anterior desaparece', async () => {
    mockGetHistorial.mockImplementation((id) =>
      Promise.resolve(
        id === 1
          ? [{ orden: 1, latitud: -34.6, longitud: -58.4 }, { orden: 2, latitud: -34.595, longitud: -58.395 }]
          : [{ orden: 1, latitud: -34.7, longitud: -58.5 }, { orden: 2, latitud: -34.69, longitud: -58.49 }],
      ),
    );
    const { rerender } = renderIt();
    await waitFor(() => expect(screen.getByTestId('source').dataset.id).toBe('historial-1'));
    mockSelected.mockReturnValue({ selectedViajeId: 2 });
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MantineProvider>
          <MapRoute />
        </MantineProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('source').dataset.id).toBe('historial-2'));
    expect(mockGetHistorial).toHaveBeenCalledWith(2);
    expect(screen.getAllByTestId('source')).toHaveLength(1);
    expect(JSON.parse(screen.getByTestId('source').dataset.coords)[0]).toEqual([-58.5, -34.7]);
  });
});
