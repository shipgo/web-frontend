import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../test/renderWithProviders";
import { OperatingContext } from "@contexts/operatingContext";

let mockUser = { sucursal: { nombre: "Sucursal Centro" } };
vi.mock("@contexts/auth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { FormProvider, useForm } from "./contexts/EnviosFormContext";
import SeccionDetalles from "./SeccionDetalles";

// `SeccionDetalles` sólo lee `getInputProps` de fechas del form — un form real
// (sin valores) alcanza para montarlo.
const Wrapper = ({ children, initialValues }) => {
  const form = useForm({
    initialValues: {
      fechaHoraInicioPlanificada: null,
      fechaHoraFinPlanificada: null,
      ...initialValues,
    },
  });
  return <FormProvider form={form}>{children}</FormProvider>;
};

const renderSeccionDetalles = (operatingContextValue, initialValues) =>
  renderWithProviders(
    <OperatingContext.Provider value={operatingContextValue}>
      <Wrapper initialValues={initialValues}>
        <SeccionDetalles />
      </Wrapper>
    </OperatingContext.Provider>,
  );

describe("SeccionDetalles — SHG-FE-052 (aviso de sucursal de origen para SUPERUSER)", () => {
  it("ADMIN (isSuperUser: false): no muestra ningún aviso, sólo el campo de sólo lectura", () => {
    mockUser = { sucursal: { nombre: "Sucursal Centro" } };
    renderSeccionDetalles({ isSuperUser: false, activeSucursal: null });

    expect(screen.getByDisplayValue("Sucursal Centro")).toBeInTheDocument();
    expect(
      screen.queryByText(/sucursal de origen del viaje/i),
    ).not.toBeInTheDocument();
  });

  it("SUPERUSER con sucursal propia: avisa que la sucursal operativa elegida no se aplica todavía", () => {
    mockUser = { sucursal: { nombre: "Sucursal Centro" } };
    renderSeccionDetalles({
      isSuperUser: true,
      activeSucursal: { id: 2, nombre: "Sucursal Norte" },
    });

    expect(screen.getByDisplayValue("Sucursal Centro")).toBeInTheDocument();
    expect(
      screen.getByText(/sucursal de origen del viaje/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sucursal Norte/)).toBeInTheDocument();
  });

  it("SUPERUSER sin sucursal propia: avisa que el viaje se crea sin sucursal asociada", () => {
    mockUser = { sucursal: null };
    renderSeccionDetalles({ isSuperUser: true, activeSucursal: null });

    expect(screen.getByDisplayValue("—")).toBeInTheDocument();
    expect(
      screen.getByText(/no tiene una sucursal propia asignada/i),
    ).toBeInTheDocument();
  });
});

describe("SeccionDetalles — SHG-FE-090 (un clic abre el otro DateTimePicker aunque el primero ya se haya usado)", () => {
  beforeEach(() => {
    mockUser = { sucursal: { nombre: "Sucursal Centro" } };
  });

  it("un solo clic en 'Llegada planificada' abre su calendario después de usar y cerrar 'Salida planificada'", async () => {
    const user = userEvent.setup();
    // "Salida planificada" ya tiene un valor confirmado (como si el usuario
    // ya hubiese elegido fecha y hora y tocado el botón ✓) — el escenario
    // reportado es justo el clic siguiente, sobre el otro selector.
    renderSeccionDetalles(
      { isSuperUser: false, activeSucursal: null },
      { fechaHoraInicioPlanificada: new Date(2026, 8, 25, 10, 0) },
    );

    await user.click(screen.getByLabelText("Salida planificada"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    // Un solo clic — sin reintentos — tiene que abrir el calendario de
    // "Llegada planificada".
    await user.click(screen.getByLabelText("Llegada planificada"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("un solo clic en 'Salida planificada' abre su calendario después de usar y cerrar 'Llegada planificada'", async () => {
    const user = userEvent.setup();
    renderSeccionDetalles(
      { isSuperUser: false, activeSucursal: null },
      { fechaHoraFinPlanificada: new Date(2026, 8, 27, 12, 0) },
    );

    await user.click(screen.getByLabelText("Llegada planificada"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText("Salida planificada"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
