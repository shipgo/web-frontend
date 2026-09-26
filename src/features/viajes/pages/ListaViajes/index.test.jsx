import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api/viaje.api", () => ({
  viajeApi: { get: vi.fn(), cancelar: vi.fn() },
  detalleRecorridoApi: {},
}));

import { viajeApi } from "@api/viaje.api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import ListaViajes from "./index";

const VIAJE = {
  id: 42,
  estado: "planificado",
  fechaHoraInicioPlanificada: "2026-09-10T09:00:00",
  vehiculo: { id: 5, patente: "AB123CD" },
  chofer: null,
  choferes: [{ id: 10, nombre: "Juan", apellido: "Perez" }],
  recorridos: [
    { id: 1, detalleRecorridos: [{ id: 100 }, { id: 101 }] },
    { id: 2, detalleRecorridos: [{ id: 102 }] },
  ],
};

describe("ListaViajes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: new Usuario({ id: 1, username: "admin1", authorities: ["ROLE_ADMIN"] }),
      isAuthenticated: true,
    });
  });

  it("renderiza los viajes devueltos por viajeApi.get con las columnas nuevas", async () => {
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalled());

    expect(await screen.findByText("AB123CD")).toBeInTheDocument();

    const table = within(screen.getByRole("table"));
    expect(table.getByText("Planificado")).toBeInTheDocument();
    expect(table.getByText("Juan Perez")).toBeInTheDocument();
    expect(table.getByText("2 recorridos · 3 envíos")).toBeInTheDocument();
  });

  it("no manda ningún filtro por defecto (sin quick-filter preseleccionada)", async () => {
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalled());

    const params = viajeApi.get.mock.calls[0][0];
    expect(params.page).toBe(0);
    expect(params.estado).toBeUndefined();
    expect(params.search).toBeUndefined();
  });

  it("clickear la fila navega al detalle del viaje", async () => {
    const user = userEvent.setup();
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

    renderWithProviders(<ListaViajes />);

    const row = await screen.findByText("AB123CD");
    await user.click(row);

    await waitFor(() => expect(window.location.pathname).toBe("/42"));
  });

  it("clickear 'En curso' vuelve a pedir los viajes con estado=en_camino", async () => {
    const user = userEvent.setup();
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaViajes />);
    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByText("En curso"));

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(2));
    const params = viajeApi.get.mock.calls.at(-1)[0];
    expect(params.estado).toEqual(["en_camino"]);
  });

  it("muestra el estado vacío cuando no hay viajes", async () => {
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<ListaViajes />);

    expect(await screen.findByText("Sin viajes que mostrar")).toBeInTheDocument();
  });

  it('estado "vacío con filtros" muestra un CTA que limpia los filtros y vuelve a pedir sin ellos', async () => {
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(1));
    await user.click(screen.getByText("En curso"));

    await waitFor(() => {
      const lastCall = viajeApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toEqual(["en_camino"]);
    });

    const limpiarBtn = await screen.findByRole("button", { name: "Limpiar filtros" });
    await user.click(limpiarBtn);

    await waitFor(() => {
      const lastCall = viajeApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toBeUndefined();
    });
  });

  it("cambiar de página manda el índice 0-based que espera el backend", async () => {
    // UI: `Pagination` es 1-indexed (arranca en 1). Backend: `page` es
    // 0-indexed (CONTRACTS.md §4). `useGetViajes` hace la conversión — esto
    // verifica que clickear "2" en la paginación termina en `page: 1`.
    viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 25, totalPages: 3 });

    const user = userEvent.setup();
    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(1));
    expect(viajeApi.get.mock.calls[0][0].page).toBe(0);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "2" })).not.toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(2));
    expect(viajeApi.get.mock.calls.at(-1)[0].page).toBe(1);
  });

  it("combina la quick-filter con el buscador de texto en un solo request", async () => {
    // `estado` (quick-filter "En curso") y `search` (texto libre) son filtros
    // independientes de `ViajeFilter` (CONTRACTS.md §4) — deben poder viajar
    // juntos sin que uno pise al otro.
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const user = userEvent.setup();
    renderWithProviders(<ListaViajes />);

    await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByText("En curso"));
    await waitFor(() => {
      const lastCall = viajeApi.get.mock.calls.at(-1)[0];
      expect(lastCall.estado).toEqual(["en_camino"]);
    });

    await waitFor(() =>
      expect(screen.getByLabelText("Buscar viaje")).not.toBeDisabled(),
    );
    await user.type(screen.getByLabelText("Buscar viaje"), "AB123CD");

    await waitFor(
      () => {
        const lastCall = viajeApi.get.mock.calls.at(-1)[0];
        expect(lastCall.estado).toEqual(["en_camino"]);
        expect(lastCall.search).toBe("AB123CD");
      },
      { timeout: 2000 },
    );
  });

  describe("menú de fila (SHG-FE-096)", () => {
    // Nota: pedirle a testing-library el MISMO nombre accesible dos veces
    // seguidas (ej. dos `findByRole(..., { name: "Ver hoja de ruta" })`
    // consecutivos) es flaky acá — el segundo poll puede pisar la transición
    // de apertura del `Menu` de Mantine y no encontrarlo. Por eso cada test
    // resuelve el ítem que va a click-ear en UNA sola query y reusa esa
    // referencia, y usa un nombre *distinto* al confirmar que el menú está
    // abierto antes de una aserción de ausencia.
    const abrirMenuDelViaje = async (user, id) => {
      await user.click(await screen.findByRole("button", { name: `Acciones del viaje ${id}` }));
    };

    it('"Ver hoja de ruta" navega al detalle del viaje', async () => {
      const user = userEvent.setup();
      viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);
      await user.click(await screen.findByRole("menuitem", { name: "Ver hoja de ruta" }));

      await waitFor(() => expect(window.location.pathname).toBe("/42"));
    });

    it('"Editar viaje" se muestra en estado planificado y navega a editar', async () => {
      const user = userEvent.setup();
      viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);
      await user.click(await screen.findByRole("menuitem", { name: "Editar viaje" }));

      await waitFor(() => expect(window.location.pathname).toBe("/42/editar"));
    });

    it('"Editar viaje" NO se muestra en en_proceso_de_carga (VIAJE_ESTADOS_EDITABLES no lo incluye, aunque sí sea cancelable)', async () => {
      const user = userEvent.setup();
      const VIAJE_EN_CARGA = { ...VIAJE, estado: "en_proceso_de_carga" };
      viajeApi.get.mockResolvedValue({ content: [VIAJE_EN_CARGA], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);

      // Confirma que el menú ya montó vía un ítem que SÍ está en este estado
      // (distinto del que se busca ausente, para no repetir el mismo query).
      expect(await screen.findByRole("menuitem", { name: "Cancelar viaje" })).toBeInTheDocument();
      expect(screen.queryByRole("menuitem", { name: "Editar viaje" })).not.toBeInTheDocument();
    });

    it('"Cancelar viaje" pide confirmación, llama a la API real y refresca el listado', async () => {
      const user = userEvent.setup();
      viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });
      viajeApi.cancelar.mockResolvedValue({ ...VIAJE, estado: "cancelado" });

      renderWithProviders(<ListaViajes />);
      await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(1));

      await abrirMenuDelViaje(user, 42);
      await user.click(await screen.findByRole("menuitem", { name: "Cancelar viaje" }));

      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Cancelar viaje" }));

      await waitFor(() => expect(viajeApi.cancelar).toHaveBeenCalledWith(42, { motivo: undefined }));
      expect(await screen.findByText("Viaje cancelado")).toBeInTheDocument();
      // Refetch tras cancelar (SHG-FE-096): `useGetViajes().refetch` invalida
      // la query y vuelve a pedir el listado.
      await waitFor(() => expect(viajeApi.get).toHaveBeenCalledTimes(2));
    });

    it('"Cancelar viaje" maneja un 409 del backend igual que el detalle (toast de warning, sin refetch)', async () => {
      const user = userEvent.setup();
      viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });
      viajeApi.cancelar.mockRejectedValue({
        response: { status: 409, data: { message: "El viaje ya está en curso" } },
      });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);
      await user.click(await screen.findByRole("menuitem", { name: "Cancelar viaje" }));

      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Cancelar viaje" }));

      expect(await screen.findByText("No se puede completar la acción")).toBeInTheDocument();
      expect(screen.getByText("El viaje ya está en curso")).toBeInTheDocument();
    });

    it('"Monitorear" sólo aparece en estados con tracking (en_camino) y navega a /mapa?viaje=:id', async () => {
      const user = userEvent.setup();
      const VIAJE_EN_CAMINO = { ...VIAJE, estado: "en_camino" };
      viajeApi.get.mockResolvedValue({ content: [VIAJE_EN_CAMINO], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);
      const monitorear = await screen.findByRole("menuitem", { name: "Monitorear" });

      // En en_camino ya no es cancelable ni editable: no debería quedar
      // ninguna acción sin sentido (ver ESTADOS_CANCELABLES/VIAJE_ESTADOS_EDITABLES).
      expect(screen.queryByRole("menuitem", { name: "Editar viaje" })).not.toBeInTheDocument();
      expect(screen.queryByRole("menuitem", { name: "Cancelar viaje" })).not.toBeInTheDocument();

      await user.click(monitorear);

      await waitFor(() => expect(window.location.pathname).toBe("/mapa"));
      expect(window.location.search).toBe("?viaje=42");
    });

    it('"Monitorear" también aparece con_problemas (estado no terminal, sigue trackeable)', async () => {
      const user = userEvent.setup();
      const VIAJE_CON_PROBLEMAS = { ...VIAJE, estado: "con_problemas" };
      viajeApi.get.mockResolvedValue({ content: [VIAJE_CON_PROBLEMAS], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);

      expect(await screen.findByRole("menuitem", { name: "Monitorear" })).toBeInTheDocument();
    });

    it('"Monitorear" NO aparece en un viaje planificado (todavía no salió)', async () => {
      const user = userEvent.setup();
      viajeApi.get.mockResolvedValue({ content: [VIAJE], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);

      // Confirma apertura vía "Ver hoja de ruta" (siempre presente) antes de
      // afirmar la ausencia de "Monitorear".
      expect(await screen.findByRole("menuitem", { name: "Ver hoja de ruta" })).toBeInTheDocument();
      expect(screen.queryByRole("menuitem", { name: "Monitorear" })).not.toBeInTheDocument();
    });

    it('no quedan las acciones muertas "Reportar incidente" ni "Desvincular chofer" en ningún estado', async () => {
      const user = userEvent.setup();
      const VIAJE_EN_CAMINO = { ...VIAJE, estado: "en_camino" };
      viajeApi.get.mockResolvedValue({ content: [VIAJE_EN_CAMINO], totalElements: 1, totalPages: 1 });

      renderWithProviders(<ListaViajes />);
      await abrirMenuDelViaje(user, 42);

      expect(await screen.findByRole("menuitem", { name: "Ver hoja de ruta" })).toBeInTheDocument();
      expect(screen.queryByRole("menuitem", { name: "Reportar incidente" })).not.toBeInTheDocument();
      expect(screen.queryByRole("menuitem", { name: "Desvincular chofer" })).not.toBeInTheDocument();
    });
  });
});
