import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'wouter';
import { navigate } from 'wouter/use-browser-location';

import { renderWithProviders } from '../../../../test/renderWithProviders';

const mockTrack = vi.fn();
vi.mock('../../api/tracking.api', () => ({
  publicTrackingApi: { track: (...args) => mockTrack(...args) },
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
    // El captcha está desactivado bajo Vitest (SHG-FE-043, `@config/captcha`),
    // así que `track` recibe igual un token "listo" (sin widget real).
    expect(mockTrack).toHaveBeenCalledWith('7K2M9QX4TP', expect.any(String));
    // estado + destino + timeline
    expect(screen.getAllByText('En camino').length).toBeGreaterThan(0);
    expect(screen.getByText('Rosario, Santa Fe')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.queryByTestId('mapa-ubicacion')).not.toBeInTheDocument();
    expect(screen.queryByText(/ubicación aproximada/i)).not.toBeInTheDocument();
  });

  it('no muestra "Entrega estimada" ni "A definir" aunque el DTO traiga fechaEstimada (SHG-FE-143)', async () => {
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');

    await screen.findByText('7K2M9QX4TP');
    expect(screen.queryByText(/entrega estimada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/a definir/i)).not.toBeInTheDocument();
    // En camino: todavía no hay fecha de entrega.
    expect(screen.queryByText(/entregado el/i)).not.toBeInTheDocument();
  });

  it('entregado: muestra "Fecha de entrega" con la fecha del evento entregado (SHG-FE-143)', async () => {
    mockTrack.mockResolvedValue({
      ...DTO_OK,
      estado: 'entregado',
      estadoLabel: 'Entregado',
      historial: [
        ...DTO_OK.historial,
        { estado: 'entregado', fecha: '2026-09-04T15:30:00' },
      ],
      ultimaUbicacionAprox: undefined,
    });
    renderAt('/tracking/7K2M9QX4TP');

    expect(await screen.findByText('Entregado el 04/09/2026')).toBeInTheDocument();
    expect(screen.getByText('Paso 6 de 6')).toBeInTheDocument();
    expect(screen.queryByText(/entrega estimada/i)).not.toBeInTheDocument();
  });

  it('con más de un evento entregado usa el más reciente (SHG-FE-143)', async () => {
    mockTrack.mockResolvedValue({
      ...DTO_OK,
      estado: 'entregado',
      estadoLabel: 'Entregado',
      historial: [
        { estado: 'entregado', fecha: '2026-09-04T15:30:00' },
        { estado: 'en_camino', fecha: '2026-09-05T08:00:00' },
        { estado: 'entregado', fecha: '2026-09-06T10:00:00' },
      ],
      ultimaUbicacionAprox: undefined,
    });
    renderAt('/tracking/7K2M9QX4TP');

    expect(await screen.findByText('Entregado el 06/09/2026')).toBeInTheDocument();
    expect(screen.queryByText('Entregado el 04/09/2026')).not.toBeInTheDocument();
  });

  it('no muestra la palabra de entrega aunque el DTO la traiga (solo viaja por email)', async () => {
    mockTrack.mockResolvedValue({ ...DTO_OK, palabraEntrega: 'LUNA-PERRO' });
    renderAt('/tracking/7K2M9QX4TP');

    await screen.findByText('7K2M9QX4TP');
    expect(screen.queryByText('LUNA-PERRO')).not.toBeInTheDocument();
    expect(screen.queryByText(/palabra/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/decísela al chofer/i)).not.toBeInTheDocument();
  });

  it('historial en orden descendente y sin rojo si no hay rechazado', async () => {
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');

    await screen.findByText('7K2M9QX4TP');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('En camino');
    expect(items[0]).toHaveTextContent('03/09/2026 08:00');
    expect(items[2]).toHaveTextContent('Creado');
    expect(items[0]).toHaveAttribute('aria-current', 'step');
  });

  it('rechazado: hero "No pudimos entregarlo" y historial con el estado en rojo', async () => {
    mockTrack.mockResolvedValue({
      ...DTO_OK,
      estado: 'rechazado',
      estadoLabel: 'No entregado',
      historial: [
        ...DTO_OK.historial,
        { estado: 'rechazado', fecha: '2026-09-04T15:30:00' },
      ],
    });
    renderAt('/tracking/7K2M9QX4TP');

    expect(await screen.findByText('No pudimos entregarlo')).toBeInTheDocument();
    expect(screen.queryByText(/entregado el/i)).not.toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('No entregado');
    expect(screen.getByText('Paso 5 de 6')).toBeInTheDocument();
  });

  it('hero en camino: frase, destino y "Paso 5 de 6"', async () => {
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');

    expect(await screen.findByText('Tu envío va en camino')).toBeInTheDocument();
    expect(screen.getByText('Paso 5 de 6')).toBeInTheDocument();
    expect(screen.getAllByTestId('hero-segmento')).toHaveLength(6);
  });

  it('hero con estado desconocido degrada sin romper', async () => {
    mockTrack.mockResolvedValue({ ...DTO_OK, estado: 'desconocido', historial: [] });
    renderAt('/tracking/7K2M9QX4TP');

    expect(await screen.findByTestId('tracking-estado-hero')).toBeInTheDocument();
    expect(screen.queryByText(/paso \d de 6/i)).not.toBeInTheDocument();
  });

  it('búsqueda compacta con resultado: sin texto de ayuda y botón con ícono', async () => {
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');

    await screen.findByText('Tu envío va en camino');
    expect(screen.queryByText(/lo encontrás en el email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ingresá el código de seguimiento para ver/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /consultar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/código de seguimiento/i)).toHaveValue('7K2M9QX4TP');
  });

  it('sin resultado: formulario completo con texto de ayuda', () => {
    renderAt('/tracking');
    expect(screen.getByText(/lo encontrás en el email/i)).toBeInTheDocument();
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
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('7K2M9QX4TP', expect.any(String)),
    );
  });

  it('SHG-FE-112: una búsqueda inválida después de un resultado oculta el resultado anterior', async () => {
    const user = userEvent.setup();
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');
    expect(await screen.findByText('Rosario, Santa Fe')).toBeInTheDocument();

    const input = screen.getByLabelText(/código de seguimiento/i);
    await user.clear(input);
    await user.type(input, 'ab');
    await user.click(screen.getByRole('button', { name: /consultar/i }));

    await waitFor(() =>
      expect(screen.queryByText('Rosario, Santa Fe')).not.toBeInTheDocument(),
    );
  });

  it('SHG-FE-112: tras una búsqueda inválida, una válida vuelve a mostrar el resultado', async () => {
    const user = userEvent.setup();
    mockTrack.mockResolvedValue(DTO_OK);
    renderAt('/tracking/7K2M9QX4TP');
    expect(await screen.findByText('Rosario, Santa Fe')).toBeInTheDocument();

    const input = screen.getByLabelText(/código de seguimiento/i);
    await user.clear(input);
    await user.type(input, 'ab');
    await user.click(screen.getByRole('button', { name: /consultar/i }));
    await waitFor(() =>
      expect(screen.queryByText('Rosario, Santa Fe')).not.toBeInTheDocument(),
    );

    await user.clear(input);
    await user.type(input, '7K2M9QX4TP');
    await user.click(screen.getByRole('button', { name: /consultar/i }));
    expect(await screen.findByText('Rosario, Santa Fe')).toBeInTheDocument();
  });

  it('SHG-FE-112: un código inexistente (404) después de un resultado no deja el anterior', async () => {
    const user = userEvent.setup();
    mockTrack.mockImplementation((codigo) =>
      codigo === '7K2M9QX4TP'
        ? Promise.resolve(DTO_OK)
        : Promise.reject({ response: { status: 404 } }),
    );
    renderAt('/tracking/7K2M9QX4TP');
    expect(await screen.findByText('Rosario, Santa Fe')).toBeInTheDocument();

    const input = screen.getByLabelText(/código de seguimiento/i);
    await user.clear(input);
    await user.type(input, 'ZZZZZZZZZZ');
    await user.click(screen.getByRole('button', { name: /consultar/i }));

    expect(await screen.findByText(/no encontramos/i)).toBeInTheDocument();
    expect(screen.queryByText('Rosario, Santa Fe')).not.toBeInTheDocument();
  });

  it('SHG-FE-112: tras una búsqueda inválida, cambiar de código por la ruta (sin submit) muestra el nuevo resultado', async () => {
    const user = userEvent.setup();
    mockTrack.mockImplementation((codigo) =>
      Promise.resolve(
        codigo === '7K2M9QX4TP'
          ? DTO_OK
          : { ...DTO_OK, codigoSeguimiento: codigo, destino: { localidad: 'Salta', provincia: 'Salta' } },
      ),
    );
    renderAt('/tracking/7K2M9QX4TP');
    expect(await screen.findByText('Rosario, Santa Fe')).toBeInTheDocument();

    const input = screen.getByLabelText(/código de seguimiento/i);
    await user.clear(input);
    await user.type(input, 'ab');
    await user.click(screen.getByRole('button', { name: /consultar/i }));
    await waitFor(() =>
      expect(screen.queryByText('Rosario, Santa Fe')).not.toBeInTheDocument(),
    );

    // Navegación externa al formulario (link / botón "atrás").
    act(() => navigate('/tracking/9Z8Y7X6W5V'));
    expect(await screen.findByText('Salta, Salta')).toBeInTheDocument();
  });
});
