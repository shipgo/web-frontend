import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import MapDetalles from './MapDetalles';

const mockUseSelectedViaje = vi.fn();
const mockUseViajesConUbicacion = vi.fn();
const mockUseGetRoute = vi.fn();

vi.mock('../contexts/selectedViaje', () => ({
  useSelectedViaje: (...args) => mockUseSelectedViaje(...args),
}));
vi.mock('../hooks/useViajesConUbicacion', () => ({
  useViajesConUbicacion: (...args) => mockUseViajesConUbicacion(...args),
}));
vi.mock('../hooks/useGetRoute', () => ({
  useGetRoute: (...args) => mockUseGetRoute(...args),
}));

const VIAJE = {
  id: 7,
  estado: 'en_camino',
  chofer: { nombre: 'Carlos', apellido: 'Méndez', prefijo: '11', telefono: '55554444' },
  vehiculo: { patente: 'AB123CD', modelo: { nombre: 'Sprinter' } },
};

const PARADAS = [
  {
    id: 1,
    orden: 1,
    estado: 'finalizado',
    puntoEntrega: { nombreCalle: 'San Martín', numeroCalle: '100' },
    coords: [-64.1, -31.4],
  },
  {
    id: 2,
    orden: 2,
    estado: 'planificado',
    puntoEntrega: { nombreCalle: 'Belgrano', numeroCalle: '200' },
    coords: [-64.2, -31.5],
  },
];

describe('MapDetalles', () => {
  let setSelectedViajeId;

  beforeEach(() => {
    setSelectedViajeId = vi.fn();
    mockUseSelectedViaje.mockReset().mockReturnValue({ selectedViajeId: 7, setSelectedViajeId });
    mockUseViajesConUbicacion.mockReset().mockReturnValue({
      viajes: [{ id: 7, currentLocation: [-64.15, -31.45] }],
      isLoading: false,
    });
    mockUseGetRoute.mockReset().mockReturnValue({
      viaje: VIAJE,
      paradas: PARADAS,
      progreso: { paradasEntregadas: 1, paradasTotales: 2, enviosPendientes: 3 },
      route: { legDurations: [600, 900] },
    });
  });

  it('no renderiza nada si no hay viaje seleccionado', () => {
    mockUseSelectedViaje.mockReturnValue({ selectedViajeId: null, setSelectedViajeId });

    renderWithProviders(<MapDetalles />);

    expect(screen.queryByText('AB123CD')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar panel' })).not.toBeInTheDocument();
  });

  it('muestra chofer, teléfono, vehículo, próxima parada y envíos pendientes del viaje seleccionado', () => {
    renderWithProviders(<MapDetalles />);

    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument();
    expect(screen.getByText('11 55554444')).toBeInTheDocument();
    expect(screen.getByText('AB123CD · Sprinter')).toBeInTheDocument();
    // La primer parada ya está finalizada: la próxima es la segunda.
    expect(screen.getByText('Belgrano 200')).toBeInTheDocument();
    expect(screen.queryByText('San Martín 100')).not.toBeInTheDocument();
    expect(screen.getByText('3 envío(s) pendiente(s)')).toBeInTheDocument();
    expect(screen.getByText('1/2 paradas')).toBeInTheDocument();
  });

  it('muestra una ETA calculada a partir de las duraciones de ruta restantes', () => {
    renderWithProviders(<MapDetalles />);

    expect(screen.queryByText('Sin datos de ruta')).not.toBeInTheDocument();
  });

  it('linkea al detalle real del viaje (~/viajes/:id)', () => {
    renderWithProviders(<MapDetalles />);

    const link = screen.getByRole('link', { name: 'Ver detalle completo' });
    expect(link).toHaveAttribute('href', '/viajes/7');
  });

  it('cierra el panel al hacer click en el botón de cerrar', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    renderWithProviders(<MapDetalles />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar panel' }));

    expect(setSelectedViajeId).toHaveBeenCalledWith(null);
  });

  it('limpia la selección si el viaje deja de estar activo (viaje-finalizado)', () => {
    mockUseViajesConUbicacion.mockReturnValue({ viajes: [], isLoading: false });

    renderWithProviders(<MapDetalles />);

    expect(setSelectedViajeId).toHaveBeenCalledWith(null);
  });

  it('no limpia la selección mientras el listado de viajes activos está cargando', () => {
    mockUseViajesConUbicacion.mockReturnValue({ viajes: [], isLoading: true });

    renderWithProviders(<MapDetalles />);

    expect(setSelectedViajeId).not.toHaveBeenCalled();
  });
});
