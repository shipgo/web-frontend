import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../../test/renderWithProviders";
import { OperatingContext } from "@contexts/operatingContext";

vi.mock("@api", () => ({
  envioApi: { save: vi.fn() },
  categoriaApi: { getAll: vi.fn() },
  provinciaApi: { getAll: vi.fn() },
  localidadApi: { getByProvincia: vi.fn() },
}));

// Por default un ADMIN con sucursal propia (comportamiento de siempre, previo
// a SHG-FE-052). Los tests del guard de SUPERUSER-sin-sucursal la pisan
// envolviendo con `OperatingContext.Provider` (ver más abajo).
let mockUser = { sucursal: { id: 1, nombre: "Centro" } };
vi.mock("@contexts/auth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// El mapa (mapbox-gl / react-map-gl) no corre en jsdom; solo nos interesa
// que reciba las coordenadas correctas, así que lo reemplazamos por un stub.
vi.mock("@features/mapa/components/MapCard", () => ({
  default: ({ children }) => <div data-testid="map-card">{children}</div>,
}));
vi.mock("react-map-gl/mapbox", () => ({
  Marker: () => null,
}));

// El geocoding real (Mapbox Search JS) se prueba en useAddressAutofill.
// Acá stubeamos el hook para simular directamente la selección de una
// sugerencia y así fijar `nombreCalle`/`numeroCalle`/`coordenadas` y disparar
// el auto-match de provincia/localidad.
let capturedOnSelect;
vi.mock("./hooks/useAddressAutofill", () => ({
  useAddressAutofill: (opts) => {
    capturedOnSelect = opts.onSelect;
    return {
      autocompleteData: [],
      handleChange: vi.fn(),
      handleSelect: vi.fn(),
      loadingInput: false,
      loadingMap: false,
      selectedId: null,
    };
  },
}));

import {
  envioApi,
  categoriaApi,
  provinciaApi,
  localidadApi,
} from "@api";
import CrearEnvios from "./index";

// Mantine keeps every Select's option list mounted in the DOM (hidden via
// CSS) even when its dropdown is closed, so a role-based lookup against the
// whole document can match a closed select's options too. Scope the lookup
// to the listbox the just-opened combobox controls (see CrearVehiculo's
// index.test.jsx for the same pattern).
const selectOption = async (user, container, comboboxName, optionName) => {
  const combobox = within(container).getByRole("combobox", {
    name: comboboxName,
  });
  await user.click(combobox);
  const listboxId = combobox.getAttribute("aria-controls");
  const listbox = document.getElementById(listboxId);
  const option = await within(listbox).findByText(optionName);
  await user.click(option);
};

// `Footer` usa `AppShellFooter`, que requiere un `AppShell` ancestro.
// `operatingContextValue` permite simular al SUPERUSER (`isSuperUser: true`)
// para los tests del guard de SHG-FE-052 — sin pasarlo, el contexto usa su
// default (`isSuperUser: false`), que es el comportamiento de siempre.
const renderCrearEnvios = (operatingContextValue) => {
  const content = (
    <AppShell footer={{ height: 60 }}>
      <CrearEnvios />
    </AppShell>
  );

  return renderWithProviders(
    operatingContextValue ? (
      <OperatingContext.Provider value={operatingContextValue}>
        {content}
      </OperatingContext.Provider>
    ) : (
      content
    ),
  );
};

describe("CrearEnvios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnSelect = undefined;
    mockUser = { sucursal: { id: 1, nombre: "Centro" } };

    categoriaApi.getAll.mockResolvedValue([
      { id: 1, nombre: "Documentación" },
      { id: 2, nombre: "Electrónica" },
    ]);
    provinciaApi.getAll.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    localidadApi.getByProvincia.mockResolvedValue([
      { id: 5, nombre: "Córdoba" },
    ]);
    envioApi.save.mockResolvedValue({ id: 9, codigoSeguimiento: "SHG-DEV-0009" });
  });

  const fillRemitenteYReceptor = async (user) => {
    await user.type(screen.getByLabelText(/^nombre/i), "Juan");
    await user.type(screen.getByLabelText(/apellido/i), "García");
    await user.type(screen.getByLabelText(/email del remitente/i), "remitente@test.com");
    await user.type(screen.getByLabelText(/email del receptor/i), "receptor@test.com");
    await user.type(screen.getByLabelText(/^prefijo/i), "351");
    await user.type(screen.getByLabelText(/^teléfono/i), "1234567");
  };

  const geocodeDireccion = async () => {
    await waitFor(() => expect(provinciaApi.getAll).toHaveBeenCalled());
    await waitFor(() => expect(capturedOnSelect).toBeInstanceOf(Function));

    await act(async () => {
      capturedOnSelect({
        addressLine1: "Av. Colón 1234",
        provincia: "Córdoba",
        localidad: "Córdoba",
        coordenadas: { lat: -31.4, lng: -64.18 },
      });
    });

    await waitFor(() =>
      expect(localidadApi.getByProvincia).toHaveBeenCalledWith("2"),
    );
  };

  const agregarPaquete = async (user) => {
    await user.click(screen.getByRole("button", { name: /añadir paquete/i }));

    // Mantine's Modal mounts its content after its enter transition tick.
    const modal = await screen.findByRole("dialog");
    await selectOption(user, modal, /categoría/i, "Documentación");
    await user.type(within(modal).getByLabelText(/peso/i), "3");
    await user.click(within(modal).getByRole("button", { name: /agregar paquete/i }));
  };

  it("carga las categorías al montar", async () => {
    renderCrearEnvios();
    await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalledTimes(1));
  });

  it("arma el EnvioReqDTO (destino.localidad / detalleEnvios.categoria anidados) y lo envía", async () => {
    const user = userEvent.setup();
    renderCrearEnvios();

    await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

    await fillRemitenteYReceptor(user);
    await geocodeDireccion();
    await agregarPaquete(user);

    await user.click(screen.getByRole("button", { name: /registrar envío/i }));

    await waitFor(() => expect(envioApi.save).toHaveBeenCalledTimes(1));

    expect(envioApi.save).toHaveBeenCalledWith({
      nombre: "Juan",
      apellido: "García",
      emailRemitente: "remitente@test.com",
      emailReceptor: "receptor@test.com",
      prefijo: "351",
      telefono: "1234567",
      destino: {
        nombreCalle: "Av. Colón",
        numeroCalle: "1234",
        localidad: { id: 5 },
        latitud: -31.4,
        longitud: -64.18,
      },
      detalleEnvios: [
        {
          categoria: { id: 1 },
          descripcion: null,
          peso: 3,
        },
      ],
    });

    await screen.findByText(/código de seguimiento: shg-dev-0009/i);
  });

  it("no envía el formulario si falta geocodificar la dirección", async () => {
    const user = userEvent.setup();
    renderCrearEnvios();

    await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

    await fillRemitenteYReceptor(user);
    await agregarPaquete(user);

    await user.click(screen.getByRole("button", { name: /registrar envío/i }));

    expect(envioApi.save).not.toHaveBeenCalled();
    await screen.findByText(
      "Elegí una sugerencia del buscador de direcciones para ubicar el envío en el mapa",
    );
  });

  it("muestra el mensaje del backend en un toast cuando el POST falla sin field-errors (409)", async () => {
    const user = userEvent.setup();
    envioApi.save.mockRejectedValue({
      response: {
        status: 409,
        data: {
          statusCode: 409,
          message: "Ya existe un envío en curso para este remitente.",
        },
      },
    });

    renderCrearEnvios();

    await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

    await fillRemitenteYReceptor(user);
    await geocodeDireccion();
    await agregarPaquete(user);

    await user.click(screen.getByRole("button", { name: /registrar envío/i }));

    await waitFor(() => expect(envioApi.save).toHaveBeenCalledTimes(1));

    expect(
      await screen.findByText("Ya existe un envío en curso para este remitente."),
    ).toBeInTheDocument();
    // Seguimos en el form de creación (no en la pantalla de éxito post-navegación).
    expect(
      screen.getByRole("button", { name: /registrar envío/i }),
    ).toBeInTheDocument();
  });

  it("marca el error de campo devuelto por la API bajo el input correspondiente (prefijo destino.* stripeado)", async () => {
    // `envioApi.save` envía `destino` anidado (CONTRACTS.md §2), pero el form
    // usa el campo plano `nombreCalle` (ver `constants/schema.js`). El backend
    // devuelve el field-error con el path real del DTO (`destino.nombreCalle`);
    // `applyApiError` lo mapea al campo plano detectando el prefijo común
    // (`@domain/apiError`, `detectCommonPrefix`) cuando TODOS los field-errors
    // comparten el mismo prefijo.
    const user = userEvent.setup();
    envioApi.save.mockRejectedValue({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          message: "Error en la validación de los campos.",
          fields: [
            {
              field: "destino.nombreCalle",
              error: "Ya existe un punto de entrega con esa dirección.",
            },
          ],
        },
      },
    });

    renderCrearEnvios();

    await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

    await fillRemitenteYReceptor(user);
    await geocodeDireccion();
    await agregarPaquete(user);

    await user.click(screen.getByRole("button", { name: /registrar envío/i }));

    await waitFor(() => expect(envioApi.save).toHaveBeenCalledTimes(1));

    expect(
      await screen.findByText("Ya existe un punto de entrega con esa dirección."),
    ).toBeInTheDocument();
  });

  it("maneja 400 mixto: campo de raíz + destino.campo (stripPrefix resalta ambos)", async () => {
    // Este test reproduce el caso descrito en CONTRACTS.md §2 donde un 400
    // de Bean Validation contiene campos de la raíz del DTO (`nombre`) y
    // campos anidados bajo `destino` (`destino.numeroCalle`) en la misma
    // respuesta. Sin `stripPrefix: "destino"`, la auto-detección de
    // `detectCommonPrefix` devuelve null (porque no todos los campos comparten
    // prefijo) y los campos anidados no se pelan.
    // Con `stripPrefix: "destino"`, se pelan solo los prefijados y ambos
    // field-errors se resaltan en los inputs correctos.
    const user = userEvent.setup();
    envioApi.save.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: "Validación fallida",
          fields: [
            { field: "nombre", error: "El nombre es requerido" },
            {
              field: "destino.numeroCalle",
              error: "El número de calle es requerido",
            },
          ],
        },
      },
    });

    renderCrearEnvios();

    await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

    await fillRemitenteYReceptor(user);
    await geocodeDireccion();
    await agregarPaquete(user);

    await user.click(screen.getByRole("button", { name: /registrar envío/i }));

    await waitFor(() => expect(envioApi.save).toHaveBeenCalledTimes(1));

    // Verificamos que ambos field-errors se resaltaron en el DOM.
    // Sin `stripPrefix: "destino"`, el campo anidado no se pelaría y no aparecería aquí.
    expect(
      await screen.findByText("El nombre es requerido"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El número de calle es requerido"),
    ).toBeInTheDocument();
  });

  describe("SHG-FE-052 — guard SUPERUSER sin sucursal propia", () => {
    it("no bloquea a un SUPERUSER que sí tiene sucursal propia", async () => {
      mockUser = { sucursal: { id: 1, nombre: "Centro" } };
      renderCrearEnvios({ isSuperUser: true });

      await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

      expect(
        screen.queryByText(/no podés crear envíos todavía/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /registrar envío/i }),
      ).toBeEnabled();
    });

    it("bloquea el submit y avisa cuando un SUPERUSER no tiene sucursal propia (evita el 500 de backend)", async () => {
      mockUser = { sucursal: null };
      renderCrearEnvios({ isSuperUser: true });

      await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

      expect(
        await screen.findByText(/no podés crear envíos todavía/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /registrar envío/i }),
      ).toBeDisabled();
      expect(envioApi.save).not.toHaveBeenCalled();
    });

    it("un ADMIN sin sucursal propia (dato inconsistente) no dispara el guard — sólo aplica a SUPERUSER", async () => {
      mockUser = { sucursal: null };
      // `isSuperUser: false` (default del contexto, sin wrap): el guard es
      // específico del caso SUPERUSER — un ADMIN sin sucursal es un estado de
      // datos inconsistente que está fuera del alcance de esta tarea.
      renderCrearEnvios();

      await waitFor(() => expect(categoriaApi.getAll).toHaveBeenCalled());

      expect(
        screen.queryByText(/no podés crear envíos todavía/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /registrar envío/i }),
      ).toBeEnabled();
    });
  });
});
