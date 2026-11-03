import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

const mockGetMias = vi.fn();
const mockGetHistorial = vi.fn();
const mockDelete = vi.fn();

vi.mock('@api/catalogs.api', () => ({
  notificacionesApi: {
    getMias: (...args) => mockGetMias(...args),
    getHistorial: (...args) => mockGetHistorial(...args),
    save: vi.fn(),
    update: vi.fn(),
    delete: (...args) => mockDelete(...args),
    vaciarTodas: vi.fn(),
  },
}));

import { NOTIFICACIONES_QUERY_KEY } from '../../constants';
import NotificacionesHistorialPage from './index';

const hace = (ms) => new Date(Date.now() - ms).toISOString();

const NOTIFS = [
  {
    id: 1,
    title: 'Viaje planificado',
    body: 'Un chofer aceptó la solicitud.',
    visto: false,
    fecha: hace(1000),
    data: { resource_type: 'viaje', resource_id: 7 },
  },
  {
    id: 2,
    title: 'Envío entregado',
    body: 'Tu envío llegó a destino.',
    visto: true,
    fecha: hace(3600_000),
    data: { resource_type: 'envio', resource_id: 9, codigoSeguimiento: 'SHG123' },
  },
];

const pagina = (content, extra = {}) => ({
  content,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  ...extra,
});

const renderPage = ({ portal = false } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  const { hook, history } = memoryLocation({
    path: portal ? '/portal/notificaciones' : '/notificaciones',
    record: true,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Router hook={hook}>
          <NotificacionesHistorialPage portal={portal} />
        </Router>
        <Notifications />
      </MantineProvider>
    </QueryClientProvider>,
  );

  return { history, queryClient };
};

describe('NotificacionesHistorialPage', () => {
  beforeEach(() => {
    mockGetMias.mockReset();
    mockGetHistorial.mockReset();
    mockDelete.mockReset();
    mockDelete.mockResolvedValue({});
    notifications.clean();
    notifications.cleanQueue();
  });

  it('lista las notificaciones del historial pidiendo la primera página (page=0)', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    renderPage();

    expect(await screen.findByText('Viaje planificado')).toBeInTheDocument();
    expect(screen.getByText('Envío entregado')).toBeInTheDocument();
    expect(mockGetHistorial).toHaveBeenCalledWith({ page: 0, size: 20 });
    // una sola página: sin paginador
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('pagina: cambiar de página pide page=1 (0-indexed) al backend', async () => {
    mockGetHistorial.mockImplementation(({ page }) =>
      Promise.resolve(
        page === 0
          ? pagina([NOTIFS[0]], { totalElements: 21, totalPages: 2 })
          : pagina([NOTIFS[1]], { number: 1, totalElements: 21, totalPages: 2 }),
      ),
    );
    renderPage();

    expect(await screen.findByText('Viaje planificado')).toBeInTheDocument();
    expect(screen.getByText('21 notificaciones')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '2' }));

    expect(await screen.findByText('Envío entregado')).toBeInTheDocument();
    expect(mockGetHistorial).toHaveBeenLastCalledWith({ page: 1, size: 20 });
  });

  it('estado vacío', async () => {
    mockGetHistorial.mockResolvedValue(pagina([], { totalPages: 0 }));
    renderPage();

    expect(await screen.findByText('No tenés notificaciones')).toBeInTheDocument();
  });

  it('estado de error con reintento', async () => {
    mockGetHistorial.mockRejectedValueOnce(new Error('boom'));
    renderPage();

    expect(
      await screen.findByText('No pudimos cargar tus notificaciones'),
    ).toBeInTheDocument();

    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Viaje planificado')).toBeInTheDocument();
  });

  it('click en una no leída la marca como leída al instante y navega a su recurso', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    let resolverDelete;
    mockDelete.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverDelete = resolve;
        }),
    );
    const { history } = renderPage();

    await userEvent.click(await screen.findByText('Viaje planificado'));

    // el DELETE sigue en vuelo y la fila ya pasó a leída
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(screen.queryByLabelText('Marcar como leída')).not.toBeInTheDocument(),
    );
    expect(history).toContain('/viajes/7');

    resolverDelete({});
  });

  it('click en una ya leída sólo navega (sin DELETE)', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    const { history } = renderPage();

    await userEvent.click(await screen.findByText('Envío entregado'));

    expect(history).toContain('/envios/9');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('marcar como leída desde el historial actualiza también la lista de la campana', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    mockGetMias.mockResolvedValue(NOTIFS);
    // El DELETE queda en vuelo: lo que se ve es la actualización optimista, hecha
    // sobre ambas cachés (todavía no hubo refetch con datos del "servidor").
    mockDelete.mockImplementation(() => new Promise(() => {}));
    const { queryClient } = renderPage();
    queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, NOTIFS);

    await userEvent.click(await screen.findByLabelText('Marcar como leída'));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(screen.queryByLabelText('Marcar como leída')).not.toBeInTheDocument(),
    );
    const campana = queryClient.getQueryData(NOTIFICACIONES_QUERY_KEY);
    expect(campana?.find((n) => n.id === 1)?.visto).toBe(true);
  });

  it('al terminar el DELETE se revalida el historial y la campana', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    mockGetMias.mockResolvedValue(NOTIFS);
    const { queryClient } = renderPage();
    queryClient.setQueryData(NOTIFICACIONES_QUERY_KEY, NOTIFS);

    await userEvent.click(await screen.findByLabelText('Marcar como leída'));

    // 1 carga inicial + 1 revalidación tras el DELETE (misma clave raíz)
    await waitFor(() => expect(mockGetHistorial).toHaveBeenCalledTimes(2));
    // la campana (sin observadores acá) queda marcada para revalidar
    expect(queryClient.getQueryState(NOTIFICACIONES_QUERY_KEY)?.isInvalidated).toBe(true);
  });

  it('si el DELETE falla se restaura la notificación y se avisa', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    mockDelete.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPage();

    await userEvent.click(await screen.findByLabelText('Marcar como leída'));

    expect(
      await screen.findByText('No se pudo marcar la notificación como leída'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText('Marcar como leída')).toBeInTheDocument(),
    );
  });

  it('portal: navega al envío por código de seguimiento (ruta absoluta bajo /portal)', async () => {
    mockGetHistorial.mockResolvedValue(pagina(NOTIFS));
    const { history } = renderPage({ portal: true });

    await userEvent.click(await screen.findByText('Envío entregado'));

    expect(history).toContain('/portal/envios/SHG123');
  });

  it('una notificación sin recurso se marca como leída pero no navega', async () => {
    mockGetHistorial.mockResolvedValue(
      pagina([{ id: 5, title: 'Aviso', visto: false, fecha: hace(1000), data: {} }]),
    );
    const { history } = renderPage();

    await userEvent.click(await screen.findByText('Aviso'));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(5));
    expect(history).toEqual(['/notificaciones']);
  });
});
