import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('wouter', () => ({
  Link: ({ children, to, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('./MapCard', () => ({
  default: ({ children }) => <div data-testid="mapbox-map">{children}</div>,
}));
vi.mock('./MapTruckMarkers', () => ({ default: () => null }));
vi.mock('./MapRoute', () => ({ default: () => null }));
vi.mock('./MapDetalles', () => ({ default: () => null }));
vi.mock('./MapTrackingStatus', () => ({ default: () => null }));

const mockViajes = vi.fn();
const mockSelected = vi.fn();
vi.mock('../hooks/useViajesConUbicacion', () => ({
  useViajesConUbicacion: () => mockViajes(),
}));
vi.mock('../contexts/selectedViaje', () => ({
  useSelectedViaje: () => mockSelected(),
}));

import MapaMobile from './MapaMobile';

const viaje = (id, patente) => ({
  id,
  patente,
  choferNombre: 'Carlos',
  sucursalNombre: 'CABA',
  fechaHoraFinPlanificada: '2026-01-01T18:00:00',
  ultimaActualizacion: new Date().toISOString(),
  currentLocation: [-58.4, -34.6],
  chofer: {},
});

describe('MapaMobile', () => {
  beforeEach(() => {
    mockViajes.mockReturnValue({ viajes: [viaje(1, 'AAA111'), viaje(2, 'BBB222')], isLoading: false });
    mockSelected.mockReturnValue({
      selectedViajeId: null,
      setSelectedViajeId: vi.fn(),
      selectedSucursal: 'todas',
      setSelectedSucursal: vi.fn(),
    });
  });

  const renderIt = () =>
    render(
      <MantineProvider>
        <MapaMobile />
      </MantineProvider>,
    );

  it('renderiza el mapa, el buscador y la hoja con el contador', () => {
    renderIt();
    expect(screen.getByTestId('mapbox-map')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar por patente o chofer')).toBeInTheDocument();
    expect(screen.getByTestId('map-bottom-sheet-title')).toHaveTextContent('2 viajes en curso');
    expect(screen.getByLabelText('Nuevo viaje')).toHaveAttribute('href', '/viajes/crear');
  });

  it('la hoja arranca asomada y el asa cicla las alturas', async () => {
    renderIt();
    const sheet = screen.getByTestId('map-bottom-sheet');
    expect(sheet).toHaveAttribute('data-snap', 'peek');
    const asa = screen.getByTestId('map-bottom-sheet-handle');
    await userEvent.click(asa);
    expect(sheet).toHaveAttribute('data-snap', 'half');
    await userEvent.click(asa);
    expect(sheet).toHaveAttribute('data-snap', 'full');
    await userEvent.click(asa);
    expect(sheet).toHaveAttribute('data-snap', 'peek');
  });

  it('filtra la lista al buscar y actualiza el contador', async () => {
    renderIt();
    await userEvent.type(screen.getByLabelText('Buscar por patente o chofer'), 'AAA');
    expect(screen.getByTestId('map-bottom-sheet-title')).toHaveTextContent('1 viaje en curso');
  });

  it('al seleccionar un viaje la hoja vuelve a asomada', async () => {
    const { rerender } = renderIt();
    await userEvent.click(screen.getByTestId('map-bottom-sheet-handle'));
    expect(screen.getByTestId('map-bottom-sheet')).toHaveAttribute('data-snap', 'half');
    mockSelected.mockReturnValue({
      selectedViajeId: 1,
      setSelectedViajeId: vi.fn(),
      selectedSucursal: 'todas',
      setSelectedSucursal: vi.fn(),
    });
    rerender(
      <MantineProvider>
        <MapaMobile />
      </MantineProvider>,
    );
    expect(screen.getByTestId('map-bottom-sheet')).toHaveAttribute('data-snap', 'peek');
  });
});
