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

  it('cuando todas las paradas están entregadas no calcula una ETA con la hora actual', () => {
    mockUseGetRoute.mockReturnValue({
      viaje: VIAJE,
      paradas: [
        { ...PARADAS[0], estado: 'finalizado' },
        { ...PARADAS[1], estado: 'finalizado' },
      ],
      progreso: { paradasEntregadas: 2, paradasTotales: 2, enviosPendientes: 0 },
      route: { legDurations: [600, 900] },
    });

    renderWithProviders(<MapDetalles />);

    // Sin próxima parada (todas entregadas) no hay ETA que calcular: si el
    // fix se revirtiera, `restanteSegundos` caería a 0 (slice vacío) y esto
    // renderizaría una ETA basada en `Date.now()` en lugar de este mensaje.
    expect(screen.getByText('Sin datos de ruta')).toBeInTheDocument();
    expect(screen.getByText('Sin paradas pendientes')).toBeInTheDocument();
    expect(screen.queryByText('Belgrano 200')).not.toBeInTheDocument();
  });

  describe('link de WhatsApp del chofer', () => {
    const renderConPrefijo = (prefijo) => {
      mockUseGetRoute.mockReturnValue({
        viaje: { ...VIAJE, chofer: { ...VIAJE.chofer, prefijo, telefono: '3510000003' } },
        paradas: PARADAS,
        progreso: { paradasEntregadas: 1, paradasTotales: 2, enviosPendientes: 3 },
        route: { legDurations: [600, 900] },
      });
      renderWithProviders(<MapDetalles />);
      return screen.getByRole('link', { name: 'Contactar por WhatsApp' });
    };

    it('con prefijo "11" (area code, formato usado en los mocks de mapa) arma wa.me/54<prefijo><telefono>', () => {
      const link = renderConPrefijo('11');
      expect(link).toHaveAttribute('href', 'https://wa.me/54113510000003');
    });

    it('con prefijo "351" (formato real confirmado contra el seed dev, SHG-DEV viaje id 2) arma wa.me/54<prefijo><telefono>', () => {
      const link = renderConPrefijo('351');
      expect(link).toHaveAttribute('href', 'https://wa.me/543513510000003');
    });

    it('con prefijo "+54" (código de país con "+") lo despoja y no duplica el "54"', () => {
      const link = renderConPrefijo('+54');
      expect(link).toHaveAttribute('href', 'https://wa.me/543510000003');
    });
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
