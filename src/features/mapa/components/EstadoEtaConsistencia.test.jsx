import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import MapDetalles from './MapDetalles';
import MapListadoViajesItem from './MapListadoViajesItem';

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

const AHORA = new Date('2026-10-07T12:00:00Z');
const PARADAS = [
  {
    id: 1,
    orden: 1,
    estado: 'planificado',
    puntoEntrega: { nombreCalle: 'Belgrano', numeroCalle: '200' },
    coords: [-64.2, -31.5],
  },
];

// Los casos que antes se contradecían: sin señal, demorado (señal + planificada
// vencida) y a tiempo. `fuentePanel`: sin señal el panel cae a la planificada;
// con señal usa la ETA de ruta. La lista siempre muestra la planificada.
const CASOS = [
  {
    nombre: 'sin señal',
    ultima: null,
    plan: '2026-01-20T15:00:00',
    estado: 'Sin señal',
    fuentePanel: '(planificada)',
  },
  {
    nombre: 'demorado',
    ultima: '2026-10-07T11:59:00Z',
    plan: '2026-01-20T15:00:00',
    estado: 'Demorado',
    fuentePanel: '(según ruta)',
  },
  {
    nombre: 'a tiempo',
    ultima: '2026-10-07T11:59:00Z',
    plan: '2026-12-01T15:00:00',
    estado: 'A tiempo',
    fuentePanel: '(según ruta)',
  },
];

describe('estado y ETA: lista vs panel (SHG-FE-113)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    mockUseSelectedViaje
      .mockReset()
      .mockReturnValue({ selectedViajeId: 7, setSelectedViajeId: vi.fn() });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  CASOS.forEach(({ nombre, ultima, plan, estado, fuentePanel }) => {
    it(`${nombre}: ambas vistas muestran el mismo estado y rotulan la fuente de la ETA`, () => {
      const viaje = {
        id: 7,
        patente: 'AB123CD',
        choferNombre: 'Carlos',
        fechaHoraFinPlanificada: plan,
        ultimaActualizacion: ultima,
        currentLocation: ultima ? [-64.15, -31.45] : null,
      };
      mockUseViajesConUbicacion.mockReturnValue({ viajes: [viaje], isLoading: false });
      mockUseGetRoute.mockReturnValue({
        viaje: {
          id: 7,
          estado: 'en_camino',
          fechaHoraFinPlanificada: plan,
          vehiculo: { patente: 'AB123CD' },
        },
        paradas: PARADAS,
        progreso: { paradasEntregadas: 0, paradasTotales: 1, enviosPendientes: 1 },
        route: { legDurations: [600] },
      });

      const lista = renderWithProviders(<MapListadoViajesItem viaje={viaje} isLast />);
      expect(screen.getAllByText(estado)).toHaveLength(1);
      expect(lista.container.textContent).toContain('(planificada)');
      lista.unmount();

      renderWithProviders(<MapDetalles />);
      expect(screen.getAllByText(estado)).toHaveLength(1);
      expect(screen.queryByText('En camino')).not.toBeInTheDocument();
      expect(screen.getByText(new RegExp(`\\${fuentePanel.replace(')', '\\)')}$`))).toBeInTheDocument();
    });
  });
});
