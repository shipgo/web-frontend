import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";

import { renderWithProviders as renderRaw } from "../../../../test/renderWithProviders";

// `Footer` usa `AppShellFooter`, que requiere un `<AppShell>` ancestro.
const renderWithProviders = (ui) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>);

const mockNavigate = vi.fn();
vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return { ...actual, useLocation: () => ["/viajes/crear", mockNavigate] };
});

vi.mock("@api", () => ({ viajeApi: { save: vi.fn() } }));

import Footer from "./Footer";
import EnviosFormProvider from "./contexts/EnviosFormProvider";
import { useFormContext } from "./contexts/EnviosFormContext";

const ConEnvios = () => {
  const form = useFormContext();
  useEffect(() => {
    form.setFieldValue(
      "enviosIncluidos",
      new Map([
        [
          "r1",
          {
            puntoEntregaID: 1,
            sucursalDestinoID: null,
            label: "Calle Falsa 123",
            packages: new Map([[200, { id: 200, codigoSeguimiento: "SHG-1", peso: 3 }]]),
          },
        ],
      ]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

describe("CrearViaje Footer — Cancelar (SHG-FE-106)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("con el formulario recién abierto sale sin pedir confirmación", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EnviosFormProvider>
        <Footer />
      </EnviosFormProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("~/viajes");
  });

  it("con envíos cargados pide confirmar antes de salir", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EnviosFormProvider>
        <ConEnvios />
        <Footer />
      </EnviosFormProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
