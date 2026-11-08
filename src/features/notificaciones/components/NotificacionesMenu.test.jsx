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
const mockMarcarTodasLeidas = vi.fn();

vi.mock('@api/catalogs.api', () => ({
  notificacionesApi: {
    getMias: (...args) => mockGetMias(...args),
    save: vi.fn(),
    update: vi.fn(),
    delete: (...args) => mockDelete(...args),
    vaciarTodas: (...args) => mockVaciarTodas(...args),
    marcarTodasLeidas: (...args) => mockMarcarTodasLeidas(...args),
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

const renderMenu = ({ portal = false, base = '' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { hook, history } = memoryLocation({ path: '/', record: true });

  render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <ModalsProvider>
          <Router hook={hook} base={base}>
            <NotificacionesMenu portal={portal} />
          </Router>
          <Notifications />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>,
  );

  return { history, queryClient };
};

const sinResolver = () => new Promise(() => {});

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
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

  it('portal: el aviso de un envío lleva a /portal/envios/:codigo y muestra la fecha DD/MM/YYYY 24 h', async () => {
    mockGetMias.mockResolvedValue([
      {
        id: 11,
        title: 'Tu envío está en camino - ShipGO',
        body: 'Va en camino.',
        visto: false,
        fecha: '2026-10-17T15:30:00',
        data: JSON.stringify({
          evento: 'ENVIO_EN_CAMINO',
          resource_type: 'envio',
          resource_id: 5,
          codigoSeguimiento: 'ABC-123',
        }),
      },
    ]);
    const { history } = renderMenu({ portal: true, base: '/portal' });

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    expect(await screen.findByText('17/10/2026 15:30')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Tu envío está en camino - ShipGO'));

    await waitFor(() => expect(history.at(-1)).toBe('/portal/envios/ABC-123'));
    expect(mockDelete).toHaveBeenCalledWith(11);
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

  describe('"Ver todas" (SHG-FE-142)', () => {
    it('lleva al historial del panel (/notificaciones) y cierra el dropdown', async () => {
      mockGetMias.mockResolvedValue(NOTIFS);
      const { history } = renderMenu();

      await userEvent.click(await screen.findByLabelText(/Notificaciones/));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Ver todas' }));

      await waitFor(() => expect(history.at(-1)).toBe('/notificaciones'));
      await waitFor(() =>
        expect(screen.queryByRole('menuitem', { name: 'Ver todas' })).not.toBeInTheDocument(),
      );
    });

    it('portal: lleva a /portal/notificaciones (ruta absoluta desde el nest /portal)', async () => {
      mockGetMias.mockResolvedValue(NOTIFS);
      const { history } = renderMenu({ portal: true, base: '/portal' });

      await userEvent.click(await screen.findByLabelText(/Notificaciones/));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Ver todas' }));

      await waitFor(() => expect(history.at(-1)).toBe('/portal/notificaciones'));
    });

    it('no se ofrece sin notificaciones', async () => {
      mockGetMias.mockResolvedValue([]);
      renderMenu();

      await userEvent.click(await screen.findByLabelText('Notificaciones'));
      await screen.findByText('No tenés notificaciones.');

      expect(screen.queryByRole('menuitem', { name: 'Ver todas' })).not.toBeInTheDocument();
    });
  });

  describe('actualización optimista (SHG-FE-141)', () => {
    it('al hacer click en una notificación sin leer, la marca como leída antes de que responda el backend y navega sin esperar', async () => {
      mockGetMias.mockResolvedValue(NOTIFS);
      mockDelete.mockReturnValue(sinResolver());
      const { history } = renderMenu();

      await userEvent.click(
        await screen.findByLabelText('Notificaciones, 1 sin leer'),
      );
      await userEvent.click(await screen.findByText('Viaje planificado'));

      // el DELETE sigue en vuelo, pero la pantalla ya cambió...
      expect(mockDelete).toHaveBeenCalledWith(1);
      await waitFor(() => expect(screen.queryByText('Sin leer')).not.toBeInTheDocument());
      expect(screen.queryByLabelText(/sin leer/)).not.toBeInTheDocument();
      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
      // ...y la navegación no esperó a la respuesta.
      expect(history.at(-1)).toBe('/viajes/7');
    });

    it('al tocar la tilde, la marca como leída al instante (sin punto, sin botón y sin contador)', async () => {
      mockGetMias.mockResolvedValue(NOTIFS);
      mockDelete.mockReturnValue(sinResolver());
      renderMenu();

      await userEvent.click(await screen.findByLabelText(/Notificaciones/));
      await userEvent.click(await screen.findByLabelText('Marcar como leída'));

      await waitFor(() =>
        expect(screen.queryByLabelText('Marcar como leída')).not.toBeInTheDocument(),
      );
      expect(screen.queryByText('Sin leer')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/sin leer/)).not.toBeInTheDocument();
    });

    it('si el DELETE falla, la notificación vuelve a figurar sin leer y se muestra un aviso sin términos internos', async () => {
      mockGetMias.mockResolvedValueOnce(NOTIFS).mockReturnValue(sinResolver());
      mockDelete.mockRejectedValue({
        response: { status: 500, data: { message: 'Error interno del servidor' } },
      });
      renderMenu();

      await userEvent.click(
        await screen.findByLabelText('Notificaciones, 1 sin leer'),
      );
      await userEvent.click(await screen.findByLabelText('Marcar como leída'));

      expect(
        await screen.findByText('No se pudo marcar la notificación como leída'),
      ).toBeInTheDocument();
      expect(screen.getByText('Probá de nuevo en unos minutos.')).toBeInTheDocument();
      // el mensaje crudo del backend no se muestra
      expect(screen.queryByText('Error interno del servidor')).not.toBeInTheDocument();

      // rollback (el refetch de onSettled nunca resuelve: no es él quien restaura)
      expect(screen.getByText('Sin leer')).toBeInTheDocument();
      expect(screen.getByLabelText('Marcar como leída')).toBeInTheDocument();
      expect(screen.getByLabelText('Notificaciones, 1 sin leer')).toBeInTheDocument();
    });

    it('un refetch en curso no pisa el cambio optimista (se cancela la query al empezar)', async () => {
      const stale = deferred();
      mockGetMias
        .mockResolvedValueOnce(NOTIFS)
        .mockReturnValueOnce(stale.promise)
        .mockReturnValue(sinResolver());
      mockDelete.mockReturnValue(sinResolver());
      const { queryClient } = renderMenu();

      await userEvent.click(
        await screen.findByLabelText('Notificaciones, 1 sin leer'),
      );
      // refetch en vuelo (como el del intervalo o el de un push)...
      void queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      await waitFor(() => expect(mockGetMias).toHaveBeenCalledTimes(2));

      await userEvent.click(await screen.findByLabelText('Marcar como leída'));
      await waitFor(() => expect(screen.queryByText('Sin leer')).not.toBeInTheDocument());

      // ...que responde tarde con la lista vieja (sin leer): no tiene que volver a pintarla.
      stale.resolve(NOTIFS);
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 20));
      expect(screen.queryByText('Sin leer')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/sin leer/)).not.toBeInTheDocument();
    });

    it('si falla marcar una, no revierte otra que sí se marcó', async () => {
      const dos = [
        { ...NOTIFS[0] },
        { ...NOTIFS[0], id: 3, title: 'Otro aviso' },
      ];
      mockGetMias.mockResolvedValueOnce(dos).mockReturnValue(sinResolver());
      mockDelete.mockImplementation((id) =>
        id === 1 ? Promise.reject(new Error('boom')) : sinResolver(),
      );
      renderMenu();

      await userEvent.click(
        await screen.findByLabelText('Notificaciones, 2 sin leer'),
      );
      const tildes = await screen.findAllByLabelText('Marcar como leída');
      await userEvent.click(tildes[1]);
      await userEvent.click(tildes[0]);

      await screen.findByText('No se pudo marcar la notificación como leída');
      // sólo vuelve la que falló
      expect(screen.getAllByText('Sin leer')).toHaveLength(1);
      expect(screen.getByLabelText('Notificaciones, 1 sin leer')).toBeInTheDocument();
    });

    it('"Vaciar todas" deja el listado vacío al instante y lo restaura si falla', async () => {
      mockGetMias.mockResolvedValueOnce(NOTIFS).mockReturnValue(sinResolver());
      const rechazo = deferred();
      mockVaciarTodas.mockReturnValue(rechazo.promise);
      renderMenu();

      await userEvent.click(
        await screen.findByLabelText('Notificaciones, 1 sin leer'),
      );
      await userEvent.click(
        await screen.findByLabelText('Vaciar todas las notificaciones'),
      );
      await userEvent.click(
        await screen.findByRole('button', { name: 'Vaciar todas' }),
      );

      expect(await screen.findByText('No tenés notificaciones.')).toBeInTheDocument();

      rechazo.resolve(Promise.reject({ response: { status: 500, data: {} } }));
      expect(
        await screen.findByText('No se pudieron vaciar las notificaciones'),
      ).toBeInTheDocument();
      expect(await screen.findByText('Viaje planificado')).toBeInTheDocument();
      expect(screen.getByText('Viaje rechazado')).toBeInTheDocument();
    });
  });
});

describe('NotificacionesMenu — "Marcar todas como leídas"', () => {
  const ETIQUETA = 'Marcar todas las notificaciones como leídas';

  beforeEach(() => {
    mockGetMias.mockReset();
    mockMarcarTodasLeidas.mockReset();
    mockMarcarTodasLeidas.mockResolvedValue({});
    notifications.clean();
    notifications.cleanQueue();
  });

  it('no se ofrece si todas ya están leídas', async () => {
    mockGetMias.mockResolvedValue(NOTIFS.map((n) => ({ ...n, visto: true })));
    renderMenu();

    await userEvent.click(await screen.findByLabelText(/Notificaciones/));
    await screen.findByText('Viaje planificado');

    expect(screen.queryByLabelText(ETIQUETA)).not.toBeInTheDocument();
  });

  it('pide PUT /api/notificaciones/leidas y deja todo leído al instante (sin contador ni botón)', async () => {
    mockGetMias.mockResolvedValueOnce(NOTIFS).mockReturnValue(sinResolver());
    const pendiente = deferred();
    mockMarcarTodasLeidas.mockReturnValue(pendiente.promise);
    renderMenu();

    await userEvent.click(await screen.findByLabelText('Notificaciones, 1 sin leer'));
    await userEvent.click(await screen.findByLabelText(ETIQUETA));

    expect(mockMarcarTodasLeidas).toHaveBeenCalledTimes(1);
    // optimista: el backend todavía no respondió
    await waitFor(() =>
      expect(screen.queryByLabelText('Notificaciones, 1 sin leer')).not.toBeInTheDocument(),
    );
    expect(screen.queryByLabelText(ETIQUETA)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Marcar como leída')).not.toBeInTheDocument();

    pendiente.resolve({});
  });

  it('si el PUT falla, vuelven las no leídas y se avisa', async () => {
    mockGetMias.mockResolvedValueOnce(NOTIFS).mockReturnValue(sinResolver());
    const rechazo = deferred();
    mockMarcarTodasLeidas.mockReturnValue(rechazo.promise);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderMenu();

    await userEvent.click(await screen.findByLabelText('Notificaciones, 1 sin leer'));
    await userEvent.click(await screen.findByLabelText(ETIQUETA));
    await waitFor(() =>
      expect(screen.queryByLabelText('Notificaciones, 1 sin leer')).not.toBeInTheDocument(),
    );

    rechazo.resolve(Promise.reject({ response: { status: 500, data: {} } }));

    expect(
      await screen.findByText('No se pudieron marcar las notificaciones como leídas'),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Notificaciones, 1 sin leer')).toBeInTheDocument();
  });
});
