import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppShell } from "@mantine/core";
import { Route } from "wouter";

import { renderWithProviders as renderRaw } from "../../../../test/renderWithProviders";

// El `Footer` canónico usa `AppShellFooter`, que requiere un `<AppShell>`
// ancestro (lo provee `src/app/layout` en la app real).
const renderWithProviders = (ui, options) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>, options);

// `SeccionDetalles`/`SeccionEnvios`/`SeccionResumen` (reusados de `CrearViaje`,
// `SHG-FE-049`) muestran la sucursal del usuario logueado en un campo de sólo
// lectura y la usan para el origen del mapa/cálculo de ruta.
vi.mock("@contexts/auth", () => ({
  useAuth: () => ({ user: { sucursal: { nombre: "Sucursal Centro" } } }),
}));

// El mapa (Mapbox GL) no corre en jsdom (requiere WebGL) — se stubea, no es
// parte de lo que este test verifica (mismo criterio que `CrearViaje/index.test.jsx`).
vi.mock("@components", async () => {
  const actual = await vi.importActual("@components");
  return { ...actual, Map: () => null };
});

// react-virtuoso no renderiza filas en jsdom (mide alturas reales vía
// ResizeObserver, que acá es un stub) — se reemplaza por un render simple y
// síncrono de todos los items, igual que en `CrearViaje/index.test.jsx`.
vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data = [], itemContent, components = {} }) => {
    if (data.length === 0 && components.EmptyPlaceholder) {
      return <components.EmptyPlaceholder />;
    }
    return (
      <div>
        {data.map((item, index) => (
          <div key={item?.id ?? index}>{itemContent(index, item)}</div>
        ))}
        {components.Footer ? <components.Footer /> : null}
      </div>
    );
  },
  GroupedVirtuoso: ({
    groupCounts = [],
    groupContent,
    itemContent,
    components = {},
  }) => {
    if (groupCounts.length === 0 && components.EmptyPlaceholder) {
      return <components.EmptyPlaceholder />;
    }
    const rows = [];
    let index = 0;
    groupCounts.forEach((count, groupIndex) => {
      rows.push(<div key={`group-${groupIndex}`}>{groupContent(groupIndex)}</div>);
      for (let i = 0; i < count; i += 1) {
        rows.push(<div key={`item-${index}`}>{itemContent(index, groupIndex)}</div>);
        index += 1;
      }
    });
    return <div>{rows}</div>;
  },
}));

vi.mock("@api/viaje.api", () => ({
  viajeApi: {
    getById: vi.fn(),
    update: vi.fn(),
  },
  detalleRecorridoApi: {},
}));

vi.mock("@api", () => ({
  envioApi: { getParaViaje: vi.fn() },
  vehiculoApi: { getDisponibles: vi.fn() },
  usuarioApi: { getChoferesDisponibles: vi.fn() },
  sucursalApi: { getSucursalesRestantes: vi.fn() },
}));

import { viajeApi } from "@api/viaje.api";
import { envioApi, vehiculoApi, usuarioApi, sucursalApi } from "@api";
import EditarViaje from "./index";

// Envíos ya asignados al viaje (uno por recorrido) — el DTO real incluye
// `destino`/`peso`/`codigoSeguimiento` completos dentro de
// `recorrido.detalleRecorridos[].envio` (verificado contra el backend real,
// `GET /api/viaje/{id}`, ver bitácora de `SHG-FE-049`).
const ENVIO_200 = {
  id: 200,
  codigoSeguimiento: "SEED000200",
  peso: 12,
  destino: {
    id: 50,
    nombreCalle: "Calle Falsa",
    numeroCalle: "123",
    localidad: { nombre: "San Rafael", provincia: { nombre: "Mendoza" } },
  },
};

const ENVIO_201 = {
  id: 201,
  codigoSeguimiento: "SEED000201",
  peso: 8,
  destino: {
    id: 51,
    nombreCalle: "Otra Calle",
    numeroCalle: "456",
    localidad: { nombre: "Villa Maria", provincia: { nombre: "Córdoba" } },
  },
};

// Envío pendiente (todavía no asignado a ningún viaje) que sí devuelve
// `GET /api/envio/paraViaje`, para probar el flujo de "agregar".
const ENVIO_300_PENDIENTE = {
  id: 300,
  codigoSeguimiento: "SEED000300",
  estado: "en_sucursal",
  peso: 5,
  destino: {
    id: 52,
    nombreCalle: "Nueva Calle",
    numeroCalle: "789",
    localidad: { nombre: "Rosario", provincia: { nombre: "Santa Fe" } },
  },
};

const EXISTING_VIAJE = {
  id: 42,
  estado: "planificado",
  fechaHoraInicio: null,
  fechaHoraFin: null,
  fechaHoraInicioPlanificada: "2026-08-01T09:00:00",
  fechaHoraFinPlanificada: "2026-08-01T17:00:00",
  vehiculo: { id: 5, patente: "AB123CD", modelo: { nombre: "Hilux" } },
  choferes: [{ id: 10, nombre: "Juan", apellido: "Perez" }],
  recorridos: [
    {
      id: 1,
      orden: 1,
      puntoEntrega: {
        id: 50,
        nombreCalle: "Calle Falsa",
        numeroCalle: "123",
        localidad: { nombre: "San Rafael", provincia: { nombre: "Mendoza" } },
      },
      sucursalDestino: null,
      detalleRecorridos: [{ id: 100, envio: ENVIO_200 }],
    },
    {
      id: 2,
      orden: 2,
      puntoEntrega: null,
      sucursalDestino: {
        id: 7,
        nombre: "Sucursal Norte",
        puntoEntrega: {
          id: 60,
          nombreCalle: "Gral Paz",
          numeroCalle: "567",
          localidad: { nombre: "Villa Maria", provincia: { nombre: "Córdoba" } },
        },
      },
      detalleRecorridos: [{ id: 101, envio: ENVIO_201 }],
    },
  ],
};

const VEHICULOS = [
  { id: 5, patente: "AB123CD", modelo: { nombre: "Hilux" } },
  { id: 6, patente: "ZZ999ZZ", modelo: { nombre: "Ranger" } },
];

const CHOFERES = [
  { id: 10, nombre: "Juan", apellido: "Perez" },
  { id: 11, nombre: "Maria", apellido: "Gomez" },
];

describe("EditarViaje", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    viajeApi.getById.mockResolvedValue(EXISTING_VIAJE);
    viajeApi.update.mockResolvedValue({ id: 42 });
    vehiculoApi.getDisponibles.mockResolvedValue(VEHICULOS);
    usuarioApi.getChoferesDisponibles.mockResolvedValue(CHOFERES);
    envioApi.getParaViaje.mockResolvedValue([]);
    sucursalApi.getSucursalesRestantes.mockResolvedValue([]);
  });

  it("muestra el header canónico (breadcrumbs Viajes / Editar viaje + ayuda)", async () => {
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    expect(screen.getByText("Viajes")).toBeInTheDocument();
    expect(screen.getByText("Editar viaje")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /necesito ayuda/i })
    ).toHaveAttribute("href", "https://shipgo.gitbook.io/manual");
  });

  it("prefills el vehículo, choferes, fechas planificadas y envíos/recorridos del viaje", async () => {
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(viajeApi.getById).toHaveBeenCalledWith("42");
    });

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });

    expect(screen.getAllByText("Juan Perez").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/salida planificada/i)).toHaveTextContent(
      "01/08/2026 09:00"
    );
    expect(screen.getByLabelText(/llegada planificada/i)).toHaveTextContent(
      "01/08/2026 17:00"
    );

    // Los envíos ya asignados al viaje aparecen en "Envíos seleccionados"
    // (SHG-FE-049) aunque su estado (`asignado_a_viaje`) los excluya de
    // `GET /api/envio/paraViaje`.
    expect(await screen.findByText("SEED000200")).toBeInTheDocument();
    expect(await screen.findByText("SEED000201")).toBeInTheDocument();

    // Usa los endpoints de disponibilidad (SHG-BE-006), no `getAll`/`getChoferes`,
    // reinyectando el viaje propio (`viajeIdExcluido`) para que su vehículo/chofer
    // actuales no cuenten como "ocupados por sí mismos".
    await waitFor(() => {
      expect(vehiculoApi.getDisponibles).toHaveBeenCalledWith({
        desde: "2026-08-01T09:00:00",
        hasta: "2026-08-01T17:00:00",
        sucursalId: undefined,
        viajeIdExcluido: 42,
      });
      expect(usuarioApi.getChoferesDisponibles).toHaveBeenCalledWith({
        desde: "2026-08-01T09:00:00",
        hasta: "2026-08-01T17:00:00",
        sucursalId: undefined,
        viajeIdExcluido: 42,
      });
    });
  });

  it("submits the edited vehículo/choferes/fechas while keeping the existing envíos grouping, without sending fechas reales", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });
    await screen.findByText("SEED000200");

    // Cambiar el vehículo seleccionado
    await user.click(screen.getByRole("combobox", { name: /^vehículo/i }));
    await user.click(await screen.findByText("ZZ999ZZ - Ranger"));

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(viajeApi.update).toHaveBeenCalledTimes(1);
    });

    const [calledId, payload] = viajeApi.update.mock.calls[0];
    expect(calledId).toBe("42");

    // `fechaHoraInicio`/`fechaHoraFin` (reales) no se mandan (CONTRACTS.md §8,
    // SHG-BE-021): son nullable y las completa el backend server-side.
    expect(payload.viaje).not.toHaveProperty("fechaHoraInicio");
    expect(payload.viaje).not.toHaveProperty("fechaHoraFin");

    // Las planificadas van en formato `LocalDateTime` (sin offset/zona ni
    // milisegundos) — NO `.toISOString()`.
    expect(payload.viaje).toEqual({
      fechaHoraInicioPlanificada: "2026-08-01T09:00:00",
      fechaHoraFinPlanificada: "2026-08-01T17:00:00",
      vehiculoID: 6,
      choferesID: [10],
    });

    expect(payload.enviosPuntoEntrega).toEqual([
      { enviosID: [200], puntoEntregaID: 50, sucursalDestinoID: null },
      { enviosID: [201], puntoEntregaID: null, sucursalDestinoID: 7 },
    ]);
  });

  it("agrega un envío pendiente al viaje y lo incluye en el payload al guardar (SHG-FE-049)", async () => {
    envioApi.getParaViaje.mockResolvedValue([
      {
        localidad: { id: 9, nombre: "Rosario", provincia: { nombre: "Santa Fe" } },
        envios: [ENVIO_300_PENDIENTE],
      },
    ]);

    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });
    await screen.findByText("SEED000200");

    // El envío pendiente aparece en "Envíos pendientes" junto con los que ya
    // están en el viaje.
    await user.click(await screen.findByText("SEED000300"));
    await user.click(
      await screen.findByRole("button", { name: /marcar envíos para/i }),
    );
    await user.click(await screen.findByText(/entrega a destino final/i));

    // Pasa a "Envíos seleccionados" y desaparece de "pendientes" (el switch
    // "ocultar ya agregados" está activo por defecto, mismo comportamiento
    // que `CrearViaje`) — sigue habiendo una única aparición en pantalla.
    await waitFor(() => {
      expect(screen.getAllByText("SEED000300")).toHaveLength(1);
    });
    expect(
      screen.getByText("SEED000300").closest("li").querySelector(".tabler-icon-trash"),
    ).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(viajeApi.update).toHaveBeenCalledTimes(1));

    const [, payload] = viajeApi.update.mock.calls[0];
    expect(payload.enviosPuntoEntrega).toEqual(
      expect.arrayContaining([
        { enviosID: [200], puntoEntregaID: 50, sucursalDestinoID: null },
        { enviosID: [201], puntoEntregaID: null, sucursalDestinoID: 7 },
        { enviosID: [300], puntoEntregaID: 52, sucursalDestinoID: null },
      ]),
    );
    expect(payload.enviosPuntoEntrega).toHaveLength(3);
  });

  it("quita un envío del viaje (recorrido completo) y lo excluye del payload al guardar (SHG-FE-049)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });
    const item200 = (await screen.findByText("SEED000200")).closest("li");
    expect(item200).not.toBeNull();

    const trashIcon = item200.querySelector(".tabler-icon-trash");
    expect(trashIcon).not.toBeNull();
    await user.click(trashIcon);

    // El envío 200 era el único de su recorrido: al quitarlo sale de "Envíos
    // seleccionados" (ya no tiene botón eliminar) — vuelve a aparecer en
    // "Envíos pendientes", ahora seleccionable (dejó de estar "Incluido").
    await waitFor(() => {
      const li = screen.getByText("SEED000200").closest("li");
      expect(li.querySelector(".tabler-icon-trash")).toBeNull();
    });
    expect(
      screen.getByText("SEED000201").closest("li").querySelector(".tabler-icon-trash"),
    ).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(viajeApi.update).toHaveBeenCalledTimes(1));

    const [, payload] = viajeApi.update.mock.calls[0];
    expect(payload.enviosPuntoEntrega).toEqual([
      { enviosID: [201], puntoEntregaID: null, sucursalDestinoID: 7 },
    ]);
  });

  it("no deja guardar si se quitan TODOS los envíos del viaje (misma validación que crear)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
        "AB123CD - Hilux"
      );
    });

    const item200 = (await screen.findByText("SEED000200")).closest("li");
    await user.click(item200.querySelector(".tabler-icon-trash"));

    await waitFor(() => {
      const li = screen.getByText("SEED000200").closest("li");
      expect(li.querySelector(".tabler-icon-trash")).toBeNull();
    });

    const item201 = screen.getByText("SEED000201").closest("li");
    await user.click(item201.querySelector(".tabler-icon-trash"));

    // Sin ningún recorrido, "Envíos seleccionados" vuelve a su estado vacío.
    expect(
      await screen.findByText("No hay envíos seleccionados"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/agregá al menos un envío al viaje/i).length,
      ).toBeGreaterThan(0);
    });
    expect(viajeApi.update).not.toHaveBeenCalled();
  });

  it("blocks editing (no form, no submit) when the viaje is not in creado/planificado", async () => {
    viajeApi.getById.mockResolvedValue({
      ...EXISTING_VIAJE,
      estado: "en_camino",
    });

    renderWithProviders(
      <Route path="/viajes/:id/editar" component={EditarViaje} />,
      { route: "/viajes/42/editar" }
    );

    await waitFor(() => {
      expect(viajeApi.getById).toHaveBeenCalledWith("42");
    });

    expect(
      await screen.findByText(/no se puede editar en su estado actual/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("combobox", { name: /^vehículo/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /guardar cambios/i })
    ).not.toBeInTheDocument();

    expect(vehiculoApi.getDisponibles).not.toHaveBeenCalled();
    expect(usuarioApi.getChoferesDisponibles).not.toHaveBeenCalled();
    expect(envioApi.getParaViaje).not.toHaveBeenCalled();
  });

  describe("estados de carga/error (SHG-QA-003)", () => {
    it("muestra el estado de error cuando viajeApi.getById rechaza, y reintentar hace una nueva llamada", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      error.response = { status: 500 };
      viajeApi.getById.mockRejectedValueOnce(error);

      renderWithProviders(
        <Route path="/viajes/:id/editar" component={EditarViaje} />,
        { route: "/viajes/42/editar" }
      );

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledWith("42");
      });

      expect(await screen.findByText("No se pudo cargar el viaje")).toBeInTheDocument();
      expect(screen.getByText("Ocurrió un error al obtener la información del viaje.")).toBeInTheDocument();

      const reintentar = screen.getByRole("button", { name: /reintentar/i });
      expect(reintentar).toBeInTheDocument();

      viajeApi.getById.mockResolvedValueOnce(EXISTING_VIAJE);
      await user.click(reintentar);

      await waitFor(() => {
        expect(viajeApi.getById).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByRole("combobox", { name: /^vehículo/i })).toHaveValue(
          "AB123CD - Hilux"
        );
      });
    });
  });
});
