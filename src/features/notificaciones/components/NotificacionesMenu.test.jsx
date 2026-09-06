import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

const mockGetMias = vi.fn();
const mockDelete = vi.fn();

vi.mock('@api/catalogs.api', () => ({
  notificacionesApi: {
    getMias: (...args) => mockGetMias(...args),
    save: vi.fn(),
    update: vi.fn(),
    delete: (...args) => mockDelete(...args),
  },
}));

import NotificacionesMenu from './NotificacionesMenu';

const NOTIFS = [
  {
    id: 1,
    title: 'Viaje planificado',
    body: 'Un chofer aceptó la solicitud.',
    visto: false,
    fecha: new Date().toISOString(),
    data: '{"resource_type":"viaje","resource_id":7}',
  },
  {
    id: 2,
    title: 'Viaje rechazado',
    body: 'Todos los choferes rechazaron.',
    visto: true,
    fecha: new Date(Date.now() - 3600_000).toISOString(),
    data: '{"resource_type":"viaje","resource_id":9}',
  },
];

const renderMenu = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { hook, history } = memoryLocation({ path: '/', record: true });

  render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Router hook={hook}>
          <NotificacionesMenu />
        </Router>
      </MantineProvider>
    </QueryClientProvider>,
  );

  return { history };
};

describe('NotificacionesMenu', () => {
  beforeEach(() => {
    mockGetMias.mockReset();
    mockDelete.mockReset();
    mockDelete.mockResolvedValue({});
  });

  it('muestra el contador de no leídas', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    expect(
      await screen.findByLabelText('Notificaciones, 1 sin leer'),
    ).toBeInTheDocument();
  });

  it('lista las notificaciones al abrir el menú', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));

    expect(await screen.findByText('Viaje planificado')).toBeInTheDocument();
    expect(screen.getByText('Viaje rechazado')).toBeInTheDocument();
  });

  it('marca una notificación como leída (DELETE /api/notificaciones/{id})', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    await userEvent.click(await screen.findByLabelText('Marcar como leída'));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(1));
  });

  it('navega al recurso al hacer click en la notificación', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    const { history } = renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    await userEvent.click(await screen.findByText('Viaje planificado'));

    await waitFor(() => expect(history.at(-1)).toBe('/viajes/7'));
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it('muestra el estado vacío sin notificaciones', async () => {
    mockGetMias.mockResolvedValue([]);
    renderMenu();

    await userEvent.click(await screen.findByLabelText('Notificaciones'));
    expect(await screen.findByText('No tenés notificaciones.')).toBeInTheDocument();
  });
});
