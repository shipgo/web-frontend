import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";

import { renderWithProviders as renderRaw } from "../../../../test/renderWithProviders";

// `Footer` usa `AppShellFooter`, que requiere un `<AppShell>` ancestro (lo
// provee `src/app/layout` en la app real).
const renderWithProviders = (ui) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>);

const mockNavigate = vi.fn();

vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useLocation: () => ["/viajes/crear", mockNavigate],
  };
});

vi.mock("@contexts/auth", () => ({
  useAuth: () => ({ user: { sucursal: { nombre: "Sucursal Centro" } } }),
}));

// El mapa (Mapbox GL) no corre en jsdom (requiere WebGL) — se stubea, no es
// parte de lo que este test verifica.
vi.mock("@components", async () => {
  const actual = await vi.importActual("@components");
  return { ...actual, Map: () => null };
});

// react-virtuoso no renderiza filas en jsdom (mide alturas reales vía
// ResizeObserver, que acá es un stub) — se reemplaza por un render simple y
// síncrono de todos los items, suficiente para lo que este test verifica.
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

// `DateTimePicker` real (calendario + selector de hora en un popover) es
// muy costoso de manejar con userEvent en jsdom. Se reemplaza por un input
// de texto simple: `getInputProps('campo')` en Mantine siempre expone
// `{ value: Date|null, onChange: (Date|null) => void }` sin importar el
// picker concreto, así que el resto de `SeccionDetalles`/el form no se
// entera del cambio. Escribir "yyyy-MM-ddTHH:mm" (sin "Z") hace que
// `new Date(...)` lo interprete como hora LOCAL (spec ECMA-262), igual que
// el `DateTimePicker` real — deterministico sin importar el TZ del runner.
vi.mock("@mantine/dates", async () => {
  const actual = await vi.importActual("@mantine/dates");
  return {
    ...actual,
    DateTimePicker: ({ label, value, onChange }) => (
      <input
        aria-label={label}
        value={value ? value.toISOString() : ""}
        onChange={(event) =>
          onChange(event.target.value ? new Date(event.target.value) : null)
        }
      />
    ),
  };
});

const mockGetParaViaje = vi.fn();
const mockGetDisponibles = vi.fn();
const mockGetChoferesDisponibles = vi.fn();
const mockSaveViaje = vi.fn();
const mockGetSucursalesRestantes = vi.fn();

vi.mock("@api", () => ({
  envioApi: { getParaViaje: (...args) => mockGetParaViaje(...args) },
  vehiculoApi: { getDisponibles: (...args) => mockGetDisponibles(...args) },
  usuarioApi: {
    getChoferesDisponibles: (...args) => mockGetChoferesDisponibles(...args),
  },
  viajeApi: { save: (...args) => mockSaveViaje(...args) },
  sucursalApi: {
    getSucursalesRestantes: (...args) => mockGetSucursalesRestantes(...args),
  },
}));

import CrearViaje from "./index";

const ENVIOS_PARA_VIAJE = [
  {
    localidad: {
      id: 1,
      nombre: "Villa María",
      provincia: { nombre: "Córdoba" },
    },
    envios: [
      {
        id: 200,
        codigoSeguimiento: "SHG-DEV-0001",
        estado: "en_sucursal",
        peso: 12,
        destino: {
          id: 5,
          nombreCalle: "Calle Falsa",
          numeroCalle: "123",
          localidad: {
            id: 1,
            nombre: "Villa María",
            provincia: { nombre: "Córdoba" },
          },
        },
      },
    ],
  },
];

const ENVIOS_MISMO_DESTINO_Y_OTRO = [
  {
    localidad: { id: 1, nombre: "Villa María", provincia: { nombre: "Córdoba" } },
    envios: [
      {
        id: 200,
        codigoSeguimiento: "SHG-DEV-0001",
        estado: "en_sucursal",
        peso: 12,
        destino: {
          id: 5,
          nombreCalle: "Calle Falsa",
          numeroCalle: "123",
          localidad: { id: 1, nombre: "Villa María", provincia: { nombre: "Córdoba" } },
        },
      },
      {
        id: 201,
        codigoSeguimiento: "SHG-DEV-0002",
        estado: "en_sucursal",
        peso: 8,
        // Mismo `destino.id` que el 200: deben terminar en el MISMO recorrido.
        destino: {
          id: 5,
          nombreCalle: "Calle Falsa",
          numeroCalle: "123",
          localidad: { id: 1, nombre: "Villa María", provincia: { nombre: "Córdoba" } },
        },
      },
      {
        id: 202,
        codigoSeguimiento: "SHG-DEV-0003",
        estado: "en_sucursal",
        peso: 5,
        // Destino distinto: debe generar un recorrido SEPARADO.
        destino: {
          id: 6,
          nombreCalle: "Otra Calle",
          numeroCalle: "456",
          localidad: { id: 1, nombre: "Villa María", provincia: { nombre: "Córdoba" } },
        },
      },
    ],
  },
];

describe("CrearViaje", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetParaViaje.mockResolvedValue(ENVIOS_PARA_VIAJE);
    mockGetDisponibles.mockResolvedValue([]);
    mockGetChoferesDisponibles.mockResolvedValue([]);
    mockGetSucursalesRestantes.mockResolvedValue([]);
  });

  it("lista los envíos reales de GET /api/envio/paraViaje (cero PACKAGES.json)", async () => {
    renderWithProviders(<CrearViaje />);

    await waitFor(() => expect(mockGetParaViaje).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("SHG-DEV-0001")).toBeInTheDocument();
  });

  it("mueve un envío seleccionado a 'Envíos seleccionados' al elegir entrega a destino final", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    const item = await screen.findByText("SHG-DEV-0001");
    await user.click(item);

    await user.click(
      await screen.findByRole("button", { name: /marcar envíos para/i }),
    );
    await user.click(await screen.findByText(/entrega a destino final/i));

    await waitFor(() => {
      expect(
        screen.queryByText("No hay envíos seleccionados"),
      ).not.toBeInTheDocument();
    });

    // el envío ahora vive en "Envíos seleccionados" y desaparece de
    // "pendientes" (el switch "ocultar ya agregados" está activo por defecto)
    expect(screen.getAllByText("SHG-DEV-0001")).toHaveLength(1);
  });

  it("no postea si faltan datos obligatorios (fechas, vehículo, chofer)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    await user.click(screen.getByRole("button", { name: /crear viaje/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/seleccioná la fecha de salida planificada/i)
          .length,
      ).toBeGreaterThan(0);
    });
    expect(mockSaveViaje).not.toHaveBeenCalled();
  });

  it("cancela sin postear cuando el formulario no tiene cambios", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    await user.click(screen.getByRole("button", { name: /^cancelar$/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("~/viajes"),
    );
    expect(mockSaveViaje).not.toHaveBeenCalled();
  });

  it("postea el ViajeReqDTO completo (fechas + vehículo + chofer + envío) y navega al éxito", async () => {
    mockGetDisponibles.mockResolvedValue([
      {
        id: 9,
        patente: "AB123CD",
        pesoMaximo: 3000,
        modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
      },
    ]);
    mockGetChoferesDisponibles.mockResolvedValue([
      { id: 15, nombre: "Juan", apellido: "Perez", email: "juan@shipgo.dev" },
    ]);
    mockSaveViaje.mockResolvedValue({ id: 99, estado: "planificado" });

    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    // 1. envío: entrega a destino final
    const item = await screen.findByText("SHG-DEV-0001");
    await user.click(item);
    await user.click(
      await screen.findByRole("button", { name: /marcar envíos para/i }),
    );
    await user.click(await screen.findByText(/entrega a destino final/i));

    // 2. fechas planificadas (habilita las queries de disponibilidad)
    fireEvent.change(screen.getByLabelText(/salida planificada/i), {
      target: { value: "2026-09-10T08:00" },
    });
    fireEvent.change(screen.getByLabelText(/llegada planificada/i), {
      target: { value: "2026-09-10T18:00" },
    });

    await waitFor(() => {
      expect(mockGetDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: "2026-09-10T08:00:00",
          hasta: "2026-09-10T18:00:00",
        }),
      );
      expect(mockGetChoferesDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: "2026-09-10T08:00:00",
          hasta: "2026-09-10T18:00:00",
        }),
      );
    });

    // 3. vehículo + chofer
    await user.click(await screen.findByText("AB123CD"));
    await user.click(await screen.findByText("Juan Perez"));

    // 4. submit
    await user.click(screen.getByRole("button", { name: /crear viaje/i }));

    await waitFor(() => expect(mockSaveViaje).toHaveBeenCalledTimes(1));

    expect(mockSaveViaje).toHaveBeenCalledWith({
      viaje: {
        fechaHoraInicioPlanificada: "2026-09-10T08:00:00",
        fechaHoraFinPlanificada: "2026-09-10T18:00:00",
        vehiculoID: 9,
        choferesID: [15],
      },
      enviosPuntoEntrega: [
        { enviosID: [200], puntoEntregaID: 5, sucursalDestinoID: null },
      ],
    });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("~/viajes"),
    );
    expect(await screen.findByText(/viaje creado/i)).toBeInTheDocument();
  });

  it("muestra un toast de error y NO navega si el POST falla", async () => {
    mockGetDisponibles.mockResolvedValue([
      {
        id: 9,
        patente: "AB123CD",
        pesoMaximo: 3000,
        modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
      },
    ]);
    mockGetChoferesDisponibles.mockResolvedValue([
      { id: 15, nombre: "Juan", apellido: "Perez", email: "juan@shipgo.dev" },
    ]);
    mockSaveViaje.mockRejectedValue({
      response: { data: { message: "El vehículo ya no está disponible." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    const item = await screen.findByText("SHG-DEV-0001");
    await user.click(item);
    await user.click(
      await screen.findByRole("button", { name: /marcar envíos para/i }),
    );
    await user.click(await screen.findByText(/entrega a destino final/i));

    fireEvent.change(screen.getByLabelText(/salida planificada/i), {
      target: { value: "2026-09-10T08:00" },
    });
    fireEvent.change(screen.getByLabelText(/llegada planificada/i), {
      target: { value: "2026-09-10T18:00" },
    });

    await user.click(await screen.findByText("AB123CD"));
    await user.click(await screen.findByText("Juan Perez"));

    await user.click(screen.getByRole("button", { name: /crear viaje/i }));

    await waitFor(() => expect(mockSaveViaje).toHaveBeenCalledTimes(1));

    expect(
      await screen.findByText(/el vehículo ya no está disponible/i),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith("~/viajes");
  });

  it("agrupa envíos con el mismo destino en UN recorrido y crea recorridos separados por destino distinto, incluso en acciones separadas", async () => {
    // Caso "propenso a bugs silenciosos" (SHG-QA-001): el agrupamiento real
    // pasa por `handleOnSelectedAction` (`ListadoEnviosPendientes.jsx`), no por
    // `buildEnviosPuntoEntrega` (que sólo aplana un Map ya armado). Acá se
    // ejercita ese código agregando envíos al mismo destino en DOS acciones
    // separadas (200 primero, 201 después) para probar el merge con una
    // entrada ya existente (`prev = updated.get(key)`), y un tercer envío a
    // un destino distinto para confirmar que arma un recorrido aparte.
    mockGetParaViaje.mockResolvedValue(ENVIOS_MISMO_DESTINO_Y_OTRO);
    mockGetDisponibles.mockResolvedValue([
      {
        id: 9,
        patente: "AB123CD",
        pesoMaximo: 3000,
        modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
      },
    ]);
    mockGetChoferesDisponibles.mockResolvedValue([
      { id: 15, nombre: "Juan", apellido: "Perez", email: "juan@shipgo.dev" },
    ]);
    mockSaveViaje.mockResolvedValue({ id: 100, estado: "planificado" });

    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    const marcarEntregaLocal = async () => {
      await user.click(
        await screen.findByRole("button", { name: /marcar envíos para/i }),
      );
      await user.click(await screen.findByText(/entrega a destino final/i));
    };

    // 1º acción: sólo el envío 200 (destino 5) → crea el recorrido "local_5".
    await user.click(await screen.findByText("SHG-DEV-0001"));
    await marcarEntregaLocal();

    // 2º acción, por separado: el envío 201, MISMO destino 5 → debe fusionarse
    // con el recorrido ya creado, no generar uno nuevo.
    await user.click(await screen.findByText("SHG-DEV-0002"));
    await marcarEntregaLocal();

    // 3º acción: el envío 202, destino 6 (distinto) → recorrido aparte.
    await user.click(await screen.findByText("SHG-DEV-0003"));
    await marcarEntregaLocal();

    fireEvent.change(screen.getByLabelText(/salida planificada/i), {
      target: { value: "2026-09-10T08:00" },
    });
    fireEvent.change(screen.getByLabelText(/llegada planificada/i), {
      target: { value: "2026-09-10T18:00" },
    });

    await user.click(await screen.findByText("AB123CD"));
    await user.click(await screen.findByText("Juan Perez"));

    await user.click(screen.getByRole("button", { name: /crear viaje/i }));

    await waitFor(() => expect(mockSaveViaje).toHaveBeenCalledTimes(1));

    const { enviosPuntoEntrega } = mockSaveViaje.mock.calls[0][0];
    expect(enviosPuntoEntrega).toHaveLength(2);

    const recorridoDestino5 = enviosPuntoEntrega.find((r) => r.puntoEntregaID === 5);
    expect(recorridoDestino5).toEqual({
      enviosID: [200, 201],
      puntoEntregaID: 5,
      sucursalDestinoID: null,
    });

    const recorridoDestino6 = enviosPuntoEntrega.find((r) => r.puntoEntregaID === 6);
    expect(recorridoDestino6).toEqual({
      enviosID: [202],
      puntoEntregaID: 6,
      sucursalDestinoID: null,
    });
  });

  it("arma un recorrido con sucursalDestinoID al transferir envíos a una sucursal", async () => {
    mockGetSucursalesRestantes.mockResolvedValue([
      { id: 3, nombre: "Sucursal Norte" },
    ]);
    mockGetDisponibles.mockResolvedValue([
      {
        id: 9,
        patente: "AB123CD",
        pesoMaximo: 3000,
        modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
      },
    ]);
    mockGetChoferesDisponibles.mockResolvedValue([
      { id: 15, nombre: "Juan", apellido: "Perez", email: "juan@shipgo.dev" },
    ]);
    mockSaveViaje.mockResolvedValue({ id: 101, estado: "planificado" });

    const user = userEvent.setup();
    renderWithProviders(<CrearViaje />);

    const item = await screen.findByText("SHG-DEV-0001");
    await user.click(item);
    await user.click(
      await screen.findByRole("button", { name: /marcar envíos para/i }),
    );
    await user.click(await screen.findByText(/transferencia a sucursal/i));

    const modal = await screen.findByRole("dialog");
    const sucursalSelect = await within(modal).findByRole("combobox", {
      name: /sucursal a transferir/i,
    });
    await waitFor(() => expect(sucursalSelect).not.toBeDisabled());
    await user.click(sucursalSelect);
    const listboxId = sucursalSelect.getAttribute("aria-controls");
    const listbox = await waitFor(() => {
      const el = document.getElementById(listboxId);
      if (!el) throw new Error("listbox not mounted yet");
      return el;
    });
    await user.click(await within(listbox).findByText("Sucursal Norte"));
    await user.click(within(modal).getByRole("button", { name: /confirmar/i }));

    fireEvent.change(screen.getByLabelText(/salida planificada/i), {
      target: { value: "2026-09-10T08:00" },
    });
    fireEvent.change(screen.getByLabelText(/llegada planificada/i), {
      target: { value: "2026-09-10T18:00" },
    });

    await user.click(await screen.findByText("AB123CD"));
    await user.click(await screen.findByText("Juan Perez"));

    await user.click(screen.getByRole("button", { name: /crear viaje/i }));

    await waitFor(() => expect(mockSaveViaje).toHaveBeenCalledTimes(1));

    expect(mockSaveViaje.mock.calls[0][0].enviosPuntoEntrega).toEqual([
      { enviosID: [200], puntoEntregaID: null, sucursalDestinoID: 3 },
    ]);
  });
});
