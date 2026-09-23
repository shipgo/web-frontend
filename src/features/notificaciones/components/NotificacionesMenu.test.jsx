import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications, notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { formatFechaHora } from '@domain/format';

const mockGetMias = vi.fn();
const mockDelete = vi.fn();
const mockVaciarTodas = vi.fn();

vi.mock('@api/catalogs.api', () => ({
  notificacionesApi: {
    getMias: (...args) => mockGetMias(...args),
    save: vi.fn(),
    update: vi.fn(),
    delete: (...args) => mockDelete(...args),
    vaciarTodas: (...args) => mockVaciarTodas(...args),
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
        <ModalsProvider>
          <Router hook={hook}>
            <NotificacionesMenu />
          </Router>
          <Notifications />
        </ModalsProvider>
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
    mockVaciarTodas.mockReset();
    mockVaciarTodas.mockResolvedValue({});
    // el store de notificaciones de Mantine es un singleton fuera de React:
    // sin esto, un toast mostrado en un test queda en cola/pantalla para el
    // siguiente (contaminación entre tests).
    notifications.clean();
    notifications.cleanQueue();
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

  it('expone el indicador de no leída (VisuallyHidden "Sin leer") cuando visto:false', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));

    // Buscar el texto "Sin leer" que aparece en VisuallyHidden dentro de la fila de no leída
    const sinLeerText = await screen.findByText('Sin leer');
    expect(sinLeerText).toBeInTheDocument();
  });

  it('no expone "Sin leer" cuando visto:true', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));

    // Verificar que la notificación leída existe
    expect(await screen.findByText('Viaje rechazado')).toBeInTheDocument();

    // Verificar que sólo hay UN "Sin leer" (el de la notificación no leída, no el de la leída)
    const sinLeerTexts = screen.getAllByText('Sin leer');
    expect(sinLeerTexts).toHaveLength(1);
  });

  it('expone el horario absoluto (formatFechaHora) vía tooltip al pasar el mouse', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));

    // Esperar a que la notificación sea visible
    await screen.findByText('Viaje planificado');

    // Obtener el elemento de texto relativo ("hace" + tiempo)
    const relativeTimeElements = screen.getAllByText(/hace/);
    expect(relativeTimeElements.length).toBeGreaterThan(0);

    const relativeTimeElement = relativeTimeElements[0];

    // Pasar el mouse sobre el elemento para triggear el tooltip
    await userEvent.hover(relativeTimeElement);

    // Esperar a que el tooltip con el horario absoluto aparezca
    const absoluteTime = formatFechaHora(NOTIFS[0].fecha);
    const tooltip = await screen.findByText(absoluteTime);
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveRole('tooltip');
  });

  it('muestra la acción "vaciar todas" sólo cuando hay notificaciones', async () => {
    mockGetMias.mockResolvedValue([]);
    renderMenu();

    await userEvent.click(await screen.findByLabelText('Notificaciones'));
    await screen.findByText('No tenés notificaciones.');

    expect(
      screen.queryByLabelText('Vaciar todas las notificaciones'),
    ).not.toBeInTheDocument();
  });

  it('vacía todas las notificaciones al confirmar (DELETE /api/notificaciones)', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    expect(
      await screen.findByLabelText('Notificaciones, 1 sin leer'),
    ).toBeInTheDocument();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    await userEvent.click(
      await screen.findByLabelText('Vaciar todas las notificaciones'),
    );

    mockGetMias.mockResolvedValue([]);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Vaciar todas' }),
    );

    await waitFor(() => expect(mockVaciarTodas).toHaveBeenCalled());

    // el listado queda vacío sin recargar la página...
    expect(
      await screen.findByText('No tenés notificaciones.'),
    ).toBeInTheDocument();

    // ...y el badge de la campana vuelve a 0.
    expect(
      await screen.findByLabelText('Notificaciones'),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/sin leer/),
    ).not.toBeInTheDocument();
  });

  it('no vacía las notificaciones si se cancela la confirmación', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    await userEvent.click(
      await screen.findByLabelText('Vaciar todas las notificaciones'),
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancelar' }),
    );

    expect(mockVaciarTodas).not.toHaveBeenCalled();
  });

  it('muestra un toast de error y no vacía el listado si el DELETE falla', async () => {
    mockGetMias.mockResolvedValue(NOTIFS);
    mockVaciarTodas.mockRejectedValue({
      response: { status: 500, data: { message: 'Error interno del servidor' } },
    });
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    await userEvent.click(
      await screen.findByLabelText('Vaciar todas las notificaciones'),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Vaciar todas' }),
    );

    await waitFor(() => expect(mockVaciarTodas).toHaveBeenCalled());

    expect(
      await screen.findByText('Error interno del servidor'),
    ).toBeInTheDocument();

    // la lista no desaparece: sigue mostrando las notificaciones originales.
    expect(screen.getByText('Viaje planificado')).toBeInTheDocument();
    expect(screen.getByText('Viaje rechazado')).toBeInTheDocument();
    expect(
      screen.queryByText('No tenés notificaciones.'),
    ).not.toBeInTheDocument();
  });
});
