import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../test/renderWithProviders";

vi.mock("@hooks/useIsMobile", () => ({
  useIsMobile: () => true,
  MOBILE_QUERY: "",
}));

vi.mock("@api", () => ({
  envioApi: {
    getParaViaje: vi.fn().mockResolvedValue([
      { envios: [{ id: 1, codigoSeguimiento: "SG-0001", tipoEntrega: "domicilio", peso: 2 }] },
    ]),
  },
}));

import { Accordion } from "@mantine/core";
import { FormProvider, useForm } from "../contexts/EnviosFormContext";
import SeccionEnvios from "./index";

const Wrapper = ({ children }) => {
  const form = useForm({ initialValues: { enviosIncluidos: new Map() } });
  return <FormProvider form={form}>{children}</FormProvider>;
};

describe("SeccionEnvios en mobile", () => {
  it("separa pendientes e incluidos en pestañas con contador", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Wrapper>
        <Accordion multiple defaultValue={["envios"]}>
          <SeccionEnvios />
        </Accordion>
      </Wrapper>,
    );

    expect(await screen.findByRole("tab", { name: "Pendientes · 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Incluidos · 0" })).toBeInTheDocument();
    expect(await screen.findByText("Envíos pendientes")).toBeInTheDocument();
    expect(screen.queryByText("Envíos seleccionados")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Incluidos · 0" }));
    expect(await screen.findByText("Envíos seleccionados")).toBeInTheDocument();
  });
});
