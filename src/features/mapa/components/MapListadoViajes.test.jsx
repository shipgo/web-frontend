import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';

import MapListadoViajes from './MapListadoViajes';

const mockUseViajesConUbicacion = vi.fn();
const mockUseSelectedViaje = vi.fn();

vi.mock('../hooks/useViajesConUbicacion', () => ({
  useViajesConUbicacion: (...args) => mockUseViajesConUbicacion(...args),
}));

vi.mock('../contexts/selectedViaje', () => ({
  useSelectedViaje: (...args) => mockUseSelectedViaje(...args),
}));

const renderWithProviders = (ui) => render(<MantineProvider>{ui}</MantineProvider>);

const viajeBase = (overrides = {}) => ({
  id: 1,
  patente: 'AB123CD',
  choferNombre: 'Carlos Méndez',
  sucursalNombre: 'CABA',
  fechaHoraFinPlanificada: '2026-01-01T18:00:00',
  ultimaActualizacion: new Date().toISOString(),
  currentLocation: [-58.4, -34.6],
  chofer: { prefijo: '11', telefono: '34567890' },
  ...overrides,
});

describe('MapListadoViajes', () => {
  beforeEach(() => {
    mockUseViajesConUbicacion.mockReset();
    mockUseSelectedViaje.mockReset();
    mockUseSelectedViaje.mockReturnValue({
      selectedViajeId: null,
      setSelectedViajeId: vi.fn(),
      selectedSucursal: 'todas',
      setSelectedSucursal: vi.fn(),
    });
  });

  it('renderiza los viajes reales devueltos por el hook (sin VIAJES_MOCK)', () => {
    mockUseViajesConUbicacion.mockReturnValue({
      viajes: [
        viajeBase(),
        viajeBase({ id: 2, patente: 'EF456GH', choferNombre: 'Laura Gómez', sucursalNombre: 'Rosario' }),
      ],
      isLoading: false,
    });

    renderWithProviders(<MapListadoViajes />);

    expect(screen.getByText('AB123CD')).toBeInTheDocument();
    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument();
    expect(screen.getByText('EF456GH')).toBeInTheDocument();
  });

  it('filtra por patente o chofer con el buscador', async () => {
    mockUseViajesConUbicacion.mockReturnValue({
      viajes: [
        viajeBase(),
        viajeBase({ id: 2, patente: 'EF456GH', choferNombre: 'Laura Gómez', sucursalNombre: 'Rosario' }),
      ],
      isLoading: false,
    });

    renderWithProviders(<MapListadoViajes />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Buscar por patente o chofer'), 'laura');

    expect(screen.queryByText('AB123CD')).not.toBeInTheDocument();
    expect(screen.getByText('EF456GH')).toBeInTheDocument();
  });

  it('deriva las opciones de sucursal de los viajes reales', () => {
    mockUseViajesConUbicacion.mockReturnValue({
      viajes: [
        viajeBase({ sucursalNombre: 'CABA' }),
        viajeBase({ id: 2, sucursalNombre: 'Rosario' }),
      ],
      isLoading: false,
    });

    renderWithProviders(<MapListadoViajes />);

    const select = screen.getByPlaceholderText('Filtrar por sucursal');
    expect(select).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay viajes para los filtros', () => {
    mockUseViajesConUbicacion.mockReturnValue({ viajes: [], isLoading: false });

    renderWithProviders(<MapListadoViajes />);

    expect(screen.getByText('Sin viajes para los filtros seleccionados')).toBeInTheDocument();
  });
});
