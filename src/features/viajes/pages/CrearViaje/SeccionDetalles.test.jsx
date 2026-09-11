import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
const Wrapper = ({ children }) => {
  const form = useForm({
    initialValues: {
      fechaHoraInicioPlanificada: null,
      fechaHoraFinPlanificada: null,
    },
  });
  return <FormProvider form={form}>{children}</FormProvider>;
};

const renderSeccionDetalles = (operatingContextValue) =>
  renderWithProviders(
    <OperatingContext.Provider value={operatingContextValue}>
      <Wrapper>
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
