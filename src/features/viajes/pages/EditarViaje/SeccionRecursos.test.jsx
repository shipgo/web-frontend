import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  vehiculoApi: { getDisponibles: vi.fn(), getEnMantenimiento: vi.fn() },
  usuarioApi: { getChoferesDisponibles: vi.fn() },
}));

import { vehiculoApi, usuarioApi } from "@api";
import SeccionRecursos from "./SeccionRecursos";
import {
  FormProvider,
  useForm,
} from "../CrearViaje/contexts/EnviosFormContext";
import { validate } from "../CrearViaje/contexts/enviosFormConfig";

const INICIO_ORIGINAL = "2026-08-01T09:00:00";
const FIN_ORIGINAL = "2026-08-01T17:00:00";
const NUEVA = "2026-08-02T09:00:00";
const OTRA_NUEVA = "2026-08-03T09:00:00";

const AUTO_ACTUAL = { id: 5, patente: "AB123CD", modelo: { nombre: "Hilux" } };
const AUTO_OTRO = { id: 6, patente: "ZZ999ZZ", modelo: { nombre: "Ranger" } };
const JUAN = { id: 10, nombre: "Juan", apellido: "Perez" };
const MARIA = { id: 11, nombre: "Maria", apellido: "Gomez" };
const PEDRO = { id: 12, nombre: "Pedro", apellido: "Lopez" };

// Mueve la ventana del form igual que lo haría `SeccionDetalles`.
const Harness = ({
  inicioOriginal = INICIO_ORIGINAL,
  finOriginal = FIN_ORIGINAL,
}) => {
  const [validando, setValidando] = useState(false);
  const form = useForm({
    initialValues: {
      fechaHoraInicioPlanificada: new Date(INICIO_ORIGINAL),
      fechaHoraFinPlanificada: new Date(FIN_ORIGINAL),
      vehiculo: AUTO_ACTUAL,
      choferes: [JUAN, MARIA],
    },
    validate: {
      vehiculo: validate.vehiculo,
      choferes: validate.choferes,
    },
  });
  const moverVentana = (inicio, fin) => {
    form.setFieldValue("fechaHoraInicioPlanificada", new Date(inicio));
    form.setFieldValue("fechaHoraFinPlanificada", new Date(fin));
  };
  return (
    <FormProvider form={form}>
      <SeccionRecursos
        viajeIdExcluido={42}
        vehiculoActual={AUTO_ACTUAL}
        choferesActuales={[JUAN, MARIA]}
        inicioOriginal={inicioOriginal}
        finOriginal={finOriginal}
        onValidandoChange={setValidando}
      />
      <button
        onClick={() => moverVentana(NUEVA, "2026-08-02T17:00:00")}
      >
        ventana nueva
      </button>
      <button onClick={() => moverVentana(INICIO_ORIGINAL, FIN_ORIGINAL)}>
        ventana original
      </button>
      <button onClick={() => moverVentana(OTRA_NUEVA, "2026-08-03T17:00:00")}>
        otra ventana nueva
      </button>
      <button onClick={() => form.validate()}>validar</button>
      <button disabled={validando}>guardar</button>
    </FormProvider>
  );
};

const esNueva = (params) => params.desde === NUEVA;

const vehiculoCombo = () => screen.getByRole("combobox", { name: /^vehículo/i });

// Choferes elegidos = pills del MultiSelect (los nombres también aparecen como
// opciones del dropdown).
const choferesElegidos = () =>
  Array.from(document.querySelectorAll(".mantine-Pill-root")).map((el) =>
    el.textContent.replace(/\s+$/, ""),
  );

const renderSeccion = async (props) => {
  renderWithProviders(<Harness {...props} />);
  await waitFor(() => expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux"));
  await waitFor(() => expect(vehiculoCombo()).toBeEnabled());
};

describe("EditarViaje/SeccionRecursos — disponibilidad en la ventana (SHG-FE-128)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehiculoApi.getDisponibles.mockResolvedValue([AUTO_ACTUAL, AUTO_OTRO]);
    vehiculoApi.getEnMantenimiento.mockResolvedValue([]);
    usuarioApi.getChoferesDisponibles.mockResolvedValue([JUAN, MARIA, PEDRO]);
  });

  it("con la ventana original conserva el vehículo y los choferes aunque no figuren en disponibles", async () => {
    vehiculoApi.getDisponibles.mockResolvedValue([AUTO_OTRO]);
    usuarioApi.getChoferesDisponibles.mockResolvedValue([PEDRO]);
    await renderSeccion();

    await waitFor(() =>
      expect(usuarioApi.getChoferesDisponibles).toHaveBeenCalled(),
    );
    expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux");
    expect(choferesElegidos()).toEqual(["Juan Perez", "Maria Gomez"]);
    expect(screen.queryByText(/no está disponible/i)).toBeNull();
  });

  it("al correr las fechas a una ventana donde el vehículo está ocupado, lo quita, avisa y no deja validar", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockImplementation(async (params) =>
      esNueva(params) ? [AUTO_OTRO] : [AUTO_ACTUAL, AUTO_OTRO],
    );
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));

    expect(
      await screen.findByText("AB123CD no está disponible en esas fechas"),
    ).toBeInTheDocument();
    await waitFor(() => expect(vehiculoCombo()).toHaveValue(""));
    // Los choferes siguen elegidos.
    expect(choferesElegidos()).toEqual(["Juan Perez", "Maria Gomez"]);

    await user.click(screen.getByRole("button", { name: "validar" }));
    expect(await screen.findByText("Seleccioná un vehículo")).toBeInTheDocument();
  });

  it("si el vehículo pasa a estar en mantenimiento en la ventana nueva, lo quita y lo deja deshabilitado", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockImplementation(async (params) =>
      esNueva(params) ? [AUTO_OTRO] : [AUTO_ACTUAL, AUTO_OTRO],
    );
    vehiculoApi.getEnMantenimiento.mockImplementation(async (params) =>
      esNueva(params)
        ? [
            {
              ...AUTO_ACTUAL,
              mantenimiento: {
                id: 3,
                fechaHoraMantenimiento: "2026-08-02T08:00:00.000",
                fechaHoraFin: "2026-08-03T21:28:38.376",
                vigente: false,
              },
            },
          ]
        : [],
    );
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));

    expect(
      await screen.findByText("AB123CD no está disponible en esas fechas"),
    ).toBeInTheDocument();
    await waitFor(() => expect(vehiculoCombo()).toHaveValue(""));
    await user.click(vehiculoCombo());
    const opcion = await screen.findByText(/AB123CD - Hilux - En mantenimiento/);
    expect(opcion.closest('[role="option"]')).toHaveAttribute(
      "data-combobox-disabled",
      "true",
    );
  });

  it("quita sólo el chofer que tiene otro viaje en la ventana nueva y avisa cuál", async () => {
    const user = userEvent.setup();
    usuarioApi.getChoferesDisponibles.mockImplementation(async (params) =>
      esNueva(params) ? [MARIA, PEDRO] : [JUAN, MARIA, PEDRO],
    );
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));

    expect(
      await screen.findByText("Juan Perez no está disponible en esas fechas"),
    ).toBeInTheDocument();
    expect(choferesElegidos()).toEqual(["Maria Gomez"]);
    expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux");
    expect(screen.queryByText(/AB123CD no está disponible/)).toBeNull();
  });

  it("en una ventana nueva donde los recursos del viaje no tienen otro viaje, siguen elegidos", async () => {
    const user = userEvent.setup();
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() =>
      expect(vehiculoApi.getDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ desde: NUEVA, viajeIdExcluido: 42 }),
      ),
    );
    await waitFor(() =>
      expect(usuarioApi.getChoferesDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ desde: NUEVA, viajeIdExcluido: 42 }),
      ),
    );
    await waitFor(() => expect(vehiculoCombo()).toBeEnabled());

    expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux");
    expect(choferesElegidos()).toEqual(["Juan Perez", "Maria Gomez"]);
    expect(screen.queryByText(/no está disponible/i)).toBeNull();
  });

  it("si la consulta de disponibles falla en la ventana nueva, no toca la selección", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockImplementation(async (params) => {
      if (esNueva(params)) throw new Error("boom");
      return [AUTO_ACTUAL, AUTO_OTRO];
    });
    usuarioApi.getChoferesDisponibles.mockImplementation(async (params) => {
      if (esNueva(params)) throw new Error("boom");
      return [JUAN, MARIA];
    });
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() =>
      expect(vehiculoApi.getDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ desde: NUEVA }),
      ),
    );
    await waitFor(() => expect(vehiculoCombo()).toBeEnabled());

    expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux");
    expect(choferesElegidos()).toEqual(["Juan Perez", "Maria Gomez"]);
    expect(screen.queryByText(/no está disponible/i)).toBeNull();
  });

  it("no revisa la selección mientras la consulta de la ventana nueva está cargando", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockImplementation((params) =>
      esNueva(params)
        ? new Promise(() => {})
        : Promise.resolve([AUTO_ACTUAL, AUTO_OTRO]),
    );
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() =>
      expect(vehiculoApi.getDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ desde: NUEVA }),
      ),
    );

    expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux");
    expect(screen.queryByText(/no está disponible/i)).toBeNull();
  });

  it("al volver a la ventana original, lo asignado vuelve a ser elegible y el aviso desaparece", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockResolvedValue([AUTO_OTRO]);
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await screen.findByText("AB123CD no está disponible en esas fechas");

    await user.click(screen.getByRole("button", { name: "ventana original" }));
    await waitFor(() =>
      expect(
        screen.queryByText("AB123CD no está disponible en esas fechas"),
      ).toBeNull(),
    );
    await waitFor(() => expect(vehiculoCombo()).toBeEnabled());
    await user.click(vehiculoCombo());
    expect(await screen.findByText("AB123CD - Hilux")).toBeInTheDocument();
  });

  it("carrera: elegir un vehículo disponible mientras enMantenimiento sigue pendiente en la ventana nueva no lo quita", async () => {
    const user = userEvent.setup();
    vehiculoApi.getEnMantenimiento.mockImplementation(
      () => new Promise(() => {}),
    );
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() => expect(vehiculoCombo()).toBeEnabled());
    await user.click(vehiculoCombo());
    await user.click(await screen.findByText("ZZ999ZZ - Ranger"));

    expect(vehiculoCombo()).toHaveValue("ZZ999ZZ - Ranger");
    expect(screen.queryByText(/no está disponible/i)).toBeNull();
  });

  it("con una ventana distinta, Guardar queda deshabilitado mientras cargan las consultas y se habilita al terminar", async () => {
    const user = userEvent.setup();
    let resolver;
    vehiculoApi.getDisponibles.mockImplementation((params) =>
      esNueva(params)
        ? new Promise((resolve) => {
            resolver = resolve;
          })
        : Promise.resolve([AUTO_ACTUAL, AUTO_OTRO]),
    );
    await renderSeccion();
    expect(screen.getByRole("button", { name: "guardar" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "guardar" })).toBeDisabled(),
    );

    resolver([AUTO_ACTUAL, AUTO_OTRO]);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "guardar" })).toBeEnabled(),
    );
  });

  it("si la consulta de la ventana nueva falla, Guardar no queda bloqueado", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockImplementation(async (params) => {
      if (esNueva(params)) throw new Error("boom");
      return [AUTO_ACTUAL];
    });
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() =>
      expect(vehiculoApi.getDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ desde: NUEVA }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "guardar" })).toBeEnabled(),
    );
  });

  it("al pasar de una ventana nueva a otra, el aviso de la primera desaparece", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockImplementation((params) =>
      params.desde === OTRA_NUEVA
        ? new Promise(() => {})
        : Promise.resolve(esNueva(params) ? [AUTO_OTRO] : [AUTO_ACTUAL]),
    );
    await renderSeccion();

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await screen.findByText("AB123CD no está disponible en esas fechas");

    await user.click(screen.getByRole("button", { name: "otra ventana nueva" }));
    await waitFor(() =>
      expect(
        screen.queryByText("AB123CD no está disponible en esas fechas"),
      ).toBeNull(),
    );
  });

  it("sin fechas originales conserva lo asignado y no revisa", async () => {
    const user = userEvent.setup();
    vehiculoApi.getDisponibles.mockResolvedValue([AUTO_OTRO]);
    usuarioApi.getChoferesDisponibles.mockResolvedValue([PEDRO]);
    await renderSeccion({ inicioOriginal: null, finOriginal: null });

    await user.click(screen.getByRole("button", { name: "ventana nueva" }));
    await waitFor(() =>
      expect(vehiculoApi.getDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ desde: NUEVA }),
      ),
    );
    await waitFor(() => expect(vehiculoCombo()).toBeEnabled());

    expect(vehiculoCombo()).toHaveValue("AB123CD - Hilux");
    expect(choferesElegidos()).toEqual(["Juan Perez", "Maria Gomez"]);
    expect(screen.queryByText(/no está disponible/i)).toBeNull();
    expect(screen.getByRole("button", { name: "guardar" })).toBeEnabled();
  });
});
