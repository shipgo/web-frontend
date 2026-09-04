import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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
});
