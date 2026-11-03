import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../../../test/renderWithProviders";

const mockDisponibles = vi.fn();
const mockEnMantenimiento = vi.fn();

vi.mock("../hooks/useGetVehiculosDisponibles", () => ({
  useGetVehiculosDisponibles: (...args) => mockDisponibles(...args),
}));
vi.mock("../hooks/useGetVehiculosEnMantenimiento", () => ({
  useGetVehiculosEnMantenimiento: (...args) => mockEnMantenimiento(...args),
}));
// react-virtuoso no renderiza filas en jsdom (mide alturas reales): se
// reemplaza por un render simple y síncrono, igual que en `CrearViaje/index.test.jsx`.
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
  GroupedVirtuoso: () => null,
}));
vi.mock("../hooks/useDisponibilidadParams", () => ({
  useDisponibilidadParams: () => ({
    desde: "2026-08-01T09:00:00",
    hasta: "2026-08-01T17:00:00",
  }),
}));

import ListadoVehiculos from "./ListadoVehiculos";
import { FormProvider, useForm } from "../contexts/EnviosFormContext";

const KANGOO = {
  id: 1,
  patente: "AA111AA",
  pesoMaximo: 800,
  modelo: { nombre: "Kangoo", marca: { nombre: "Citroën" } },
};
const HILUX = {
  id: 2,
  patente: "BB222BB",
  pesoMaximo: 3000,
  modelo: { nombre: "Hilux", marca: { nombre: "Toyota" } },
};

const consulta = (data) => ({
  data,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
});

const Harness = () => {
  const form = useForm({ initialValues: { vehiculo: null, enviosIncluidos: new Map() } });
  return (
    <FormProvider form={form}>
      <ListadoVehiculos />
    </FormProvider>
  );
};

describe("ListadoVehiculos — buscador sin acentos (SHG-FE-139)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDisponibles.mockReturnValue(consulta([KANGOO, HILUX]));
    mockEnMantenimiento.mockReturnValue(consulta([]));
  });

  it.each(["citroen", "CITROËN"])("buscar %s encuentra la Kangoo (marca Citroën) y oculta la Hilux", async (texto) => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    expect(await screen.findByText(/AA111AA/)).toBeInTheDocument();
    expect(screen.getByText(/BB222BB/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscá por patente o modelo..."), texto);

    // El buscador tiene debounce: la Hilux desaparece recién cuando se aplica.
    await waitFor(() => expect(screen.queryByText(/BB222BB/)).not.toBeInTheDocument());
    expect(screen.getByText(/AA111AA/)).toBeInTheDocument();
  });
});
