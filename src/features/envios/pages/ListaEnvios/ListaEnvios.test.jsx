import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';

import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('@api', () => ({
  envioApi: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { envioApi } from '@api';
import ListaEnvios from './index';

const ENVIO_EN_SUCURSAL = {
  id: 1,
  nombre: 'Juan',
  apellido: 'García',
  codigoSeguimiento: 'SHG-DEV-0001',
  estado: 'en_sucursal',
  historialEstado: [
    { estado: 'creado', fechaHoraInicio: '2026-01-01T09:00:00' },
    { estado: 'en_sucursal', fechaHoraInicio: '2026-01-02T09:00:00' },
  ],
  destino: {
    id: 3,
    nombreCalle: 'Av. Colón',
    numeroCalle: '1234',
    localidad: { id: 5, nombre: 'Córdoba', provincia: { id: 2, nombre: 'Córdoba' } },
  },
};

const ENVIO_ENTREGADO = {
  id: 2,
  nombre: 'Ana',
  apellido: 'Pérez',
  codigoSeguimiento: 'SHG-DEV-0002',
  estado: 'entregado',
  historialEstado: [{ estado: 'creado', fechaHoraInicio: '2026-01-05T09:00:00' }],
  destino: {
    id: 4,
    nombreCalle: 'San Martín',
    numeroCalle: '99',
    localidad: { id: 6, nombre: 'Rosario', provincia: { id: 1, nombre: 'Santa Fe' } },
  },
};

describe('ListaEnvios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rows using EnvioDTO fields (codigo, destino, fecha de alta, estado badge)', async () => {
    envioApi.get.mockResolvedValue({
      content: [ENVIO_EN_SUCURSAL],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0001')).toBeInTheDocument();
    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.getByText('Av. Colón 1234')).toBeInTheDocument();
    expect(screen.getByText('Córdoba, Córdoba')).toBeInTheDocument();
    // Badge label from domain/estados, not the raw canonical value.
    expect(within(screen.getByRole('table')).getByText('En sucursal')).toBeInTheDocument();

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());
  });

  it('un envío creado ahora dice "hace unos segundos" y la fecha de alta local, no "en 3 horas" (SHG-FE-111)', async () => {
    // Sólo se mockea Date (no los timers): react-query/waitFor siguen andando.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T02:31:00.000Z')); // 23:31 ART
    try {
      envioApi.get.mockResolvedValue({
        content: [
          {
            ...ENVIO_EN_SUCURSAL,
            historialEstado: [{ estado: 'creado', fechaHoraInicio: '2026-10-07T23:30:45.123' }],
          },
        ],
        totalElements: 1,
        totalPages: 1,
      });
      renderWithProviders(<ListaEnvios />);

      await screen.findByText('SHG-DEV-0001');
      expect(screen.getByText('07/10/2026')).toBeInTheDocument();
      expect(screen.getByText('a few seconds ago')).toBeInTheDocument();
      expect(screen.queryByText(/^in /)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('nunca muestra palabraEntrega (secreto remitente↔destinatario↔chofer), aunque el backend la mande por error (SHG-FE-058)', async () => {
    envioApi.get.mockResolvedValue({
      content: [{ ...ENVIO_ENTREGADO, palabraEntrega: 'AB23K9', dniReceptor: '30111222' }],
      totalElements: 1,
      totalPages: 1,
    });

    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0002')).toBeInTheDocument();
    expect(screen.queryByText('AB23K9')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no envíos', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('Sin envíos que mostrar')).toBeInTheDocument();
  });

  it('estado "vacío con filtros" muestra un CTA que limpia los filtros y vuelve a pedir sin ellos', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(screen.getByLabelText('Buscar envío')).not.toBeDisabled());
    await user.type(screen.getByLabelText('Buscar envío'), 'NoMatch');

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.search).toBe('NoMatch');
    });

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    const limpiarBtn = screen.getByRole('button', { name: 'Limpiar filtros' });

    await user.click(limpiarBtn);

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.search).toBeUndefined();
    });
    // El input del form (remontado) vuelve a estar vacío.
    expect(screen.getByLabelText('Buscar envío')).toHaveValue('');
  });

  it('sends the EnvioFilter param names exactly as EnvioFilter expects (search/estado/fechaDesde/fechaHasta/destino)', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());

    await user.click(screen.getByRole('checkbox', { name: 'En camino' }));

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toEqual(['en_camino']);
      expect(lastCall).not.toHaveProperty('date');
    });
  });

  it('shows a warning toast (not a generic error) when deleting an envío returns 409', async () => {
    envioApi.get.mockResolvedValue({
      content: [ENVIO_ENTREGADO],
      totalElements: 1,
      totalPages: 1,
    });
    envioApi.delete.mockRejectedValue({
      response: {
        status: 409,
        data: {
          statusCode: 409,
          message:
            "No se puede eliminar el envío 2 porque está en estado 'entregado'. Solo se pueden eliminar envíos en estado 'creado', 'en_sucursal' o 'rechazado'.",
        },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0002')).toBeInTheDocument();

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button'));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('No se puede eliminar')).toBeInTheDocument();
    expect(
      await screen.findByText(/porque está en estado 'entregado'/),
    ).toBeInTheDocument();
  });

  it('cambiar de página manda el índice 0-based que espera el backend', async () => {
    // UI: `Pagination` es 1-indexed (arranca en 1). Backend: `page` es 0-indexed
    // (CONTRACTS.md §4). `useGetEnvios` hace la conversión — esto verifica que
    // clickear "2" en la paginación termina en `page: 1`, no `page: 2`.
    envioApi.get.mockResolvedValue({ content: [ENVIO_EN_SUCURSAL], totalElements: 25, totalPages: 3 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
    expect(envioApi.get.mock.calls[0][0].page).toBe(0);

    // El botón de página existe desde el primer render (con `total` default),
    // pero queda `disabled` hasta que la data real (25 > PAGE_LIMIT) llega.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '2' })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(2));
    expect(envioApi.get.mock.calls.at(-1)[0].page).toBe(1);
  });

  it('combina varios filtros de texto a la vez en un solo request (search + destino)', async () => {
    // `search` y `destino` son campos independientes de `EnvioFilter`
    // (CONTRACTS.md §4) — deben viajar juntos en el mismo request sin que
    // uno pise al otro.
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText('Buscar envío'), 'García');
    await user.type(screen.getByLabelText('Destino'), 'Av. Colón');

    await waitFor(
      () => {
        const lastCall = envioApi.get.mock.calls.at(-1)[0];
        expect(lastCall.search).toBe('García');
        expect(lastCall.destino).toBe('Av. Colón');
        // Cambiar de filtro reinicia a la primera página.
        expect(lastCall.page).toBe(0);
      },
      { timeout: 2000 },
    );
  });

  it('tipear durante un fetch en curso conserva el valor y el foco ("Diego Ruiz" de corrido)', async () => {
    // El fetch inicial queda colgado: el input NO debe deshabilitarse ni perder el foco.
    let resolveInicial;
    envioApi.get.mockImplementationOnce(() => new Promise((resolve) => { resolveInicial = resolve; }));
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
    const input = screen.getByLabelText('Buscar envío');
    expect(input).not.toBeDisabled();

    await user.type(input, 'Diego');
    resolveInicial({ content: [], totalElements: 0, totalPages: 0 });
    await user.type(input, ' Ruiz');

    expect(screen.getByLabelText('Buscar envío')).toHaveValue('Diego Ruiz');
    expect(screen.getByLabelText('Buscar envío')).toHaveFocus();

    await waitFor(
      () => expect(envioApi.get.mock.calls.at(-1)[0].search).toBe('Diego Ruiz'),
      { timeout: 2000 },
    );
    expect(screen.getByLabelText('Buscar envío')).toHaveValue('Diego Ruiz');
  });

  it('el quick-filter "En camino" no deja residuos de un texto tipeado antes', async () => {
    // `handleQuickFilterChange` reemplaza TODO el form con `DEFAULT_VALUES` +
    // el propio quick-filter — si tenía texto tipeado en `search`/`destino`,
    // ese texto no debe viajar junto al quick-filter.
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText('Buscar envío')).not.toBeDisabled());

    await user.type(screen.getByLabelText('Buscar envío'), 'García');
    await user.click(screen.getByRole('checkbox', { name: 'En camino' }));

    await waitFor(() => {
      const lastCall = envioApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toEqual(['en_camino']);
      expect(lastCall.search).toBeUndefined();
    });
  });

  it('no existe el botón "Importar" (SHG-FE-097: no tenía onClick)', async () => {
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaEnvios />);

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Importar' })).not.toBeInTheDocument();
  });

  describe('"Localizar" (SHG-FE-097)', () => {
    // `MENU_ITEM_TIMEOUT`: mismo motivo que en `ListaViajes` (SHG-FE-096) — el
    // `Menu` de Mantine anima su apertura con un `setTimeout` real, que bajo
    // carga (suite corriendo en paralelo) puede tardar más que el default de
    // `findByRole` (1000ms).
    const MENU_ITEM_TIMEOUT = 3000;

    const abrirMenuDelEnvio = async (user, codigoSeguimiento) => {
      await user.click(await screen.findByRole('button', { name: `Acciones de ${codigoSeguimiento}` }));
    };

    const encontrarMenuItem = (name) =>
      screen.findByRole('menuitem', { name }, { timeout: MENU_ITEM_TIMEOUT });

    it('navega a /mapa?viaje=:id cuando el envío tiene un viaje en_camino', async () => {
      const envioConViajeEnCamino = {
        ...ENVIO_EN_SUCURSAL,
        detalleRecorridos: [
          { id: 1, recorrido: { id: 10, estado: 'en_camino', viaje: { id: 99, estado: 'en_camino' } } },
        ],
      };
      envioApi.get.mockResolvedValue({ content: [envioConViajeEnCamino], totalElements: 1, totalPages: 1 });

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);
      await abrirMenuDelEnvio(user, 'SHG-DEV-0001');

      const localizar = await encontrarMenuItem('Localizar');
      expect(localizar).not.toHaveAttribute('data-disabled');

      await user.click(localizar);

      await waitFor(() => expect(window.location.pathname).toBe('/mapa'));
      expect(window.location.search).toBe('?viaje=99');
    });

    it('también habilita "Localizar" cuando el viaje está con_problemas (sigue trackeable)', async () => {
      const envioConViajeConProblemas = {
        ...ENVIO_EN_SUCURSAL,
        detalleRecorridos: [
          { id: 1, recorrido: { id: 10, estado: 'en_camino', viaje: { id: 7, estado: 'con_problemas' } } },
        ],
      };
      envioApi.get.mockResolvedValue({ content: [envioConViajeConProblemas], totalElements: 1, totalPages: 1 });

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);
      await abrirMenuDelEnvio(user, 'SHG-DEV-0001');

      expect(await encontrarMenuItem('Localizar')).not.toHaveAttribute('data-disabled');
    });

    it('está deshabilitado con tooltip cuando el envío no tiene ningún viaje asociado', async () => {
      envioApi.get.mockResolvedValue({ content: [ENVIO_EN_SUCURSAL], totalElements: 1, totalPages: 1 });

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);
      await abrirMenuDelEnvio(user, 'SHG-DEV-0001');

      const localizar = await encontrarMenuItem('Localizar');
      expect(localizar).toHaveAttribute('data-disabled');

      await user.hover(localizar);
      expect(await screen.findByText('Este envío todavía no fue asignado a un viaje.')).toBeInTheDocument();
    });

    it('está deshabilitado con tooltip cuando el viaje asociado todavía no salió (planificado)', async () => {
      const envioConViajePlanificado = {
        ...ENVIO_EN_SUCURSAL,
        detalleRecorridos: [
          { id: 1, recorrido: { id: 10, estado: 'planificado', viaje: { id: 5, estado: 'planificado' } } },
        ],
      };
      envioApi.get.mockResolvedValue({ content: [envioConViajePlanificado], totalElements: 1, totalPages: 1 });

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);
      await abrirMenuDelEnvio(user, 'SHG-DEV-0001');

      const localizar = await encontrarMenuItem('Localizar');
      expect(localizar).toHaveAttribute('data-disabled');

      await user.hover(localizar);
      expect(await screen.findByText('El viaje asociado no está en camino en este momento.')).toBeInTheDocument();
    });
  });

  it('refetches the list when deleting an envío succeeds', async () => {
    envioApi.get.mockResolvedValue({
      content: [ENVIO_EN_SUCURSAL],
      totalElements: 1,
      totalPages: 1,
    });
    envioApi.delete.mockResolvedValue({ codigo: 200, mensaje: 'El envío ha sido eliminado con éxito.' });

    const user = userEvent.setup();
    renderWithProviders(<ListaEnvios />);

    expect(await screen.findByText('SHG-DEV-0001')).toBeInTheDocument();

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button'));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(envioApi.delete).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Envío eliminado')).toBeInTheDocument();
  });

  describe('acciones masivas del SelectionBanner (SHG-FE-095)', () => {
    let createObjectURL;

    beforeEach(() => {
      // El store de `@mantine/notifications` es un singleton fuera del árbol
      // de React: un toast de un test anterior de este mismo archivo puede
      // seguir montado y romper un `findByText` (ej. "multiple elements
      // found") en el siguiente.
      notifications.clean();
      createObjectURL = vi.fn(() => 'blob:fake');
      vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('"Exportar seleccionados" sólo incluye las filas tildadas, no todo el listado', async () => {
      envioApi.get.mockResolvedValue({
        content: [ENVIO_EN_SUCURSAL, ENVIO_ENTREGADO],
        totalElements: 2,
        totalPages: 1,
      });

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);

      await user.click(await screen.findByLabelText('Seleccionar envío SHG-DEV-0001'));

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Exportar seleccionados' }));

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const blob = createObjectURL.mock.calls[0][0];
      const contenido = await blob.text();
      expect(contenido).toContain('SHG-DEV-0001');
      expect(contenido).not.toContain('SHG-DEV-0002');

      expect(await screen.findByText('CSV generado')).toBeInTheDocument();
    });

    it('"Eliminar seleccionados" borra cada envío por separado, reporta el fallo 409 sin abortar el resto, refresca y limpia la selección', async () => {
      envioApi.get.mockResolvedValue({
        content: [ENVIO_EN_SUCURSAL, ENVIO_ENTREGADO],
        totalElements: 2,
        totalPages: 1,
      });
      envioApi.delete.mockImplementation((id) =>
        id === 1
          ? Promise.resolve({ codigo: 200 })
          : Promise.reject({
              response: {
                status: 409,
                data: { message: "El envío 2 está en estado 'entregado' y no se puede eliminar" },
              },
            }),
      );

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);

      await user.click(await screen.findByLabelText('Seleccionar envío SHG-DEV-0001'));
      await user.click(await screen.findByLabelText('Seleccionar envío SHG-DEV-0002'));

      expect(await screen.findByText('2 envíos seleccionados')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Eliminar seleccionados' }));

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/eliminar 2 envíos/)).toBeInTheDocument();

      await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(1));
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => expect(envioApi.delete).toHaveBeenCalledWith(1));
      await waitFor(() => expect(envioApi.delete).toHaveBeenCalledWith(2));

      expect(await screen.findByText('Eliminación parcial')).toBeInTheDocument();
      expect(screen.getByText(/Se eliminaron 1 de 2 envíos/)).toBeInTheDocument();
      expect(screen.getByText(/está en estado 'entregado'/)).toBeInTheDocument();

      // Refresca el listado (segundo `envioApi.get`) y limpia la selección
      // (el banner desaparece porque `selectedIds` queda vacío).
      await waitFor(() => expect(envioApi.get).toHaveBeenCalledTimes(2));
      expect(screen.queryByText(/envíos seleccionados/)).not.toBeInTheDocument();
    });

    it('un doble click sobre "Eliminar" con el borrado pendiente no duplica los DELETE', async () => {
      envioApi.get.mockResolvedValue({
        content: [ENVIO_EN_SUCURSAL],
        totalElements: 1,
        totalPages: 1,
      });

      let resolveDelete;
      envioApi.delete.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve;
          }),
      );

      const user = userEvent.setup();
      renderWithProviders(<ListaEnvios />);

      await user.click(await screen.findByLabelText('Seleccionar envío SHG-DEV-0001'));
      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Eliminar seleccionados' }));

      const dialog = await screen.findByRole('dialog');
      const confirmBtn = within(dialog).getByRole('button', { name: 'Eliminar' });

      // Doble click "de verdad": dos eventos síncronos sin esperar entre
      // medio a que React re-renderice el botón como `loading` (que recién
      // ahí quedaría disabled) — es el guard interno de `useBulkDelete` el
      // que tiene que frenar el segundo, no el `disabled` del botón.
      fireEvent.click(confirmBtn);
      fireEvent.click(confirmBtn);

      expect(envioApi.delete).toHaveBeenCalledTimes(1);

      resolveDelete({ codigo: 200 });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
});
