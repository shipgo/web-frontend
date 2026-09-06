import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Route } from 'wouter';

import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('@api', () => ({
  viajeApi: {
    getById: vi.fn(),
    iniciar: vi.fn(),
    finalizar: vi.fn(),
    cancelar: vi.fn(),
  },
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
import { useAuthStore, Usuario } from '@stores/auth.store';
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
    useAuthStore.setState({
      user: new Usuario({ id: 1, username: 'admin1', authorities: ['ROLE_ADMIN'] }),
      isAuthenticated: true,
    });
  });

  it('carga el viaje y muestra header, recorridos, historial y envíos', async () => {
    renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
      route: '/viajes/42',
    });

    await waitFor(() => {
      expect(viajeApi.getById).toHaveBeenCalledWith('42');
    });

    expect(await screen.findByText('Viaje #42')).toBeInTheDocument();

    // Header canónico: breadcrumbs `Viajes / Detalle de viaje` + botón de ayuda.
    expect(screen.getByText('Detalle de viaje')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /necesito ayuda/i })).toHaveAttribute(
      'href',
      'https://shipgo.gitbook.io/manual',
    );

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

  describe('acciones de ciclo de vida (SHG-FE-012)', () => {
    const VIAJE_PLANIFICADO = { ...EXISTING_VIAJE, estado: 'planificado' };

    it('inicia un viaje planificado tras confirmar y refetchea el detalle', async () => {
      const user = userEvent.setup();
      viajeApi.getById.mockResolvedValue(VIAJE_PLANIFICADO);
      viajeApi.iniciar.mockResolvedValue({ ...VIAJE_PLANIFICADO, estado: 'en_camino' });

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await user.click(await screen.findByRole('button', { name: 'Iniciar' }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Sí, iniciar' }));

      await waitFor(() => {
        expect(viajeApi.iniciar).toHaveBeenCalledWith('42');
      });
      expect(await screen.findByText('Viaje iniciado')).toBeInTheDocument();
      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledTimes(2);
      });
    });

    it('cancela un viaje planificado con motivo opcional', async () => {
      const user = userEvent.setup();
      viajeApi.getById.mockResolvedValue(VIAJE_PLANIFICADO);
      viajeApi.cancelar.mockResolvedValue({ ...VIAJE_PLANIFICADO, estado: 'cancelado' });

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

      const dialog = await screen.findByRole('dialog');
      await user.type(within(dialog).getByLabelText('Motivo (opcional)'), 'Vehículo con desperfecto');
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar viaje' }));

      await waitFor(() => {
        expect(viajeApi.cancelar).toHaveBeenCalledWith('42', { motivo: 'Vehículo con desperfecto' });
      });
      expect(await screen.findByText('Viaje cancelado')).toBeInTheDocument();
    });

    it('cancela un viaje sin motivo (opcional)', async () => {
      const user = userEvent.setup();
      viajeApi.getById.mockResolvedValue(VIAJE_PLANIFICADO);
      viajeApi.cancelar.mockResolvedValue({ ...VIAJE_PLANIFICADO, estado: 'cancelado' });

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar viaje' }));

      await waitFor(() => {
        expect(viajeApi.cancelar).toHaveBeenCalledWith('42', { motivo: undefined });
      });
    });

    it('muestra una advertencia si el backend rechaza la transición (409)', async () => {
      const user = userEvent.setup();
      viajeApi.finalizar.mockRejectedValue({
        response: { status: 409, data: { message: 'El viaje no está en camino' } },
      });

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await user.click(await screen.findByRole('button', { name: 'Finalizar' }));

      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Sí, finalizar' }));

      expect(await screen.findByText('No se puede completar la acción')).toBeInTheDocument();
      expect(screen.getByText('El viaje no está en camino')).toBeInTheDocument();
    });
  });

  describe('reconciliación de puedeEditar (SHG-FE-029)', () => {
    it('no muestra el botón "Editar" para viajes en_camino', async () => {
      const VIAJE_EN_CAMINO = { ...EXISTING_VIAJE, estado: 'en_camino' };
      viajeApi.getById.mockResolvedValue(VIAJE_EN_CAMINO);

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledWith('42');
      });

      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });

    it('no muestra el botón "Editar" para viajes en_proceso_de_carga', async () => {
      const VIAJE_EN_CARGA = { ...EXISTING_VIAJE, estado: 'en_proceso_de_carga' };
      viajeApi.getById.mockResolvedValue(VIAJE_EN_CARGA);

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledWith('42');
      });

      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });

    it('no muestra el botón "Editar" para viajes con_problemas', async () => {
      const VIAJE_CON_PROBLEMAS = { ...EXISTING_VIAJE, estado: 'con_problemas' };
      viajeApi.getById.mockResolvedValue(VIAJE_CON_PROBLEMAS);

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledWith('42');
      });

      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });

    it('muestra el botón "Editar" para viajes creado', async () => {
      const VIAJE_CREADO = { ...EXISTING_VIAJE, estado: 'creado' };
      viajeApi.getById.mockResolvedValue(VIAJE_CREADO);

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledWith('42');
      });

      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });

    it('muestra el botón "Editar" para viajes planificado', async () => {
      const VIAJE_PLANIFICADO = { ...EXISTING_VIAJE, estado: 'planificado' };
      viajeApi.getById.mockResolvedValue(VIAJE_PLANIFICADO);

      renderWithProviders(<Route path="/viajes/:id" component={DetalleViaje} />, {
        route: '/viajes/42',
      });

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledWith('42');
      });

      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });
  });
});
