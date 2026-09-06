import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'wouter';

import { renderWithProviders } from '../../../../test/renderWithProviders';

const mockTrack = vi.fn();
vi.mock('../../api/tracking.api', () => ({
  publicTrackingApi: { track: (...args) => mockTrack(...args) },
}));

// El mini-mapa depende de mapbox-gl (no anda en jsdom): lo stubeamos.
vi.mock('../../components/TrackingUbicacionMapa', () => ({
  default: () => <div data-testid="mapa-ubicacion" />,
}));

import TrackingPublicoPage from './index';

const DTO_OK = {
  codigoSeguimiento: '7K2M9QX4TP',
  estado: 'en_camino',
  estadoLabel: 'En camino',
  historial: [
    { estado: 'creado', fecha: '2026-09-01T10:00:00' },
    { estado: 'en_sucursal', fecha: '2026-09-02T09:00:00' },
    { estado: 'en_camino', fecha: '2026-09-03T08:00:00' },
  ],
  destino: { localidad: 'Rosario', provincia: 'Santa Fe' },
  fechaEstimada: '2026-09-05',
  ultimaUbicacionAprox: { lat: -32.94, lng: -60.65, fecha: '2026-09-03T12:00:00' },
};

// Se monta bajo un <Route> igual que en `app/routes/index.jsx` para que
// `useParams()` de wouter resuelva `:codigo`.
const renderAt = (route) =>
  renderWithProviders(
    <Route path="/tracking/:codigo?" component={TrackingPublicoPage} />,
    { route },
  );

beforeEach(() => {
  mockTrack.mockReset();
});

describe('TrackingPublicoPage', () => {
  it('no exige login: renderiza el buscador sin sesión ni AuthProvider', () => {
    renderAt('/tracking');
    expect(
      screen.getByRole('heading', { name: /seguí tu envío/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/código de seguimiento/i)).toBeInTheDocument();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('autoconsulta en /tracking/:codigo y muestra el resultado sin PII', async () => {
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');

    expect(await screen.findByText('7K2M9QX4TP')).toBeInTheDocument();
    expect(mockTrack).toHaveBeenCalledWith('7K2M9QX4TP');
    // estado + destino + ETA + timeline
    expect(screen.getAllByText('En camino').length).toBeGreaterThan(0);
    expect(screen.getByText('Rosario, Santa Fe')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByTestId('mapa-ubicacion')).toBeInTheDocument();
  });

  it('código con formato inválido: no llama al backend y avisa', async () => {
    renderAt('/tracking/@@@');
    expect(await screen.findByText(/código inválido/i)).toBeInTheDocument();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('404: muestra "no encontramos ese envío"', async () => {
    mockTrack.mockRejectedValue({ response: { status: 404 } });
    renderAt('/tracking/7K2M9QX4TP');
    expect(
      await screen.findByText(/no encontramos ese envío/i),
    ).toBeInTheDocument();
  });

  it('429: muestra el mensaje de rate-limit', async () => {
    mockTrack.mockRejectedValue({ response: { status: 429 } });
    renderAt('/tracking/7K2M9QX4TP');
    expect(await screen.findByText(/demasiadas consultas/i)).toBeInTheDocument();
    expect(screen.getByText(/probá de nuevo en un minuto/i)).toBeInTheDocument();
  });

  it('desde /tracking, enviar el form navega a /tracking/:codigo y consulta', async () => {
    const user = userEvent.setup();
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking');

    await user.type(
      screen.getByLabelText(/código de seguimiento/i),
      '7k2m9qx4tp',
    );
    await user.click(screen.getByRole('button', { name: /consultar/i }));

    await waitFor(() =>
      expect(window.location.pathname).toBe('/tracking/7K2M9QX4TP'),
    );
    await waitFor(() => expect(mockTrack).toHaveBeenCalledWith('7K2M9QX4TP'));
  });
});
