import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppShell } from "@mantine/core";

import { renderWithProviders as renderRaw } from "../../../test/renderWithProviders";

// `UsuarioForm` monta `<PageFooter>` (`AppShellFooter`), que necesita un
// `<AppShell>` ancestro — lo provee `src/app/layout` en la app real.
const renderWithProviders = (ui, options) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>, options);

vi.mock("@api", () => ({
  usuarioApi: { save: vi.fn() },
  sucursalApi: { getAll: vi.fn() },
  authorityApi: { getAll: vi.fn() },
  catalogsApi: { getTiposDocumento: vi.fn(), getSexos: vi.fn() },
  locationApi: { getProvincias: vi.fn(), getLocalidadesByProvincia: vi.fn() },
}));

import {
  usuarioApi,
  sucursalApi,
  authorityApi,
  catalogsApi,
  locationApi,
} from "@api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import CrearUsuario from "./index";

// Mantine agrega un `<span aria-hidden>` con " *" DENTRO del <label> de los
// campos `required`, así que el texto accesible es "Campo *", no "Campo" —
// hay que tolerar ese sufijo opcional al anclar el fin del match.
const exactLabel = (text) => new RegExp(`^${text}\\s*\\*?$`, "i");

const selectOption = async (user, label, optionText) => {
  const input = screen.getByRole("combobox", { name: new RegExp(`^${label}`, "i") });
  await user.click(input);
  const listboxId = input.getAttribute("aria-controls");
  const listbox = within(document.getElementById(listboxId));
  await user.click(await listbox.findByText(optionText));
};

const fillMinimalForm = async (user) => {
  await user.type(screen.getByLabelText(exactLabel("usuario")), "jperez");
  await user.type(screen.getByLabelText(exactLabel("nombre")), "Juan");
  await user.type(screen.getByLabelText(exactLabel("apellido")), "Pérez");

  // Día > 12 para que sea inequívoco (DD/MM) independientemente de cómo
  // termine interpretándose el string tipeado.
  const fechaInput = screen.getByLabelText(/fecha de nacimiento/i);
  await user.type(fechaInput, "15/09/2000");

  await selectOption(user, "Tipo de Documento", "DNI");
  await user.type(screen.getByLabelText(exactLabel("dni")), "30111222");
  await selectOption(user, "Sexo", "Masculino");

  await user.type(screen.getByLabelText(exactLabel("email")), "juan@example.com");
  await user.type(screen.getByLabelText(exactLabel("prefijo")), "11");
  await user.type(screen.getByLabelText(exactLabel("tel[eé]fono")), "1122334455");

  await user.type(
    screen.getByLabelText(exactLabel("nombre de calle")),
    "Av. Siempreviva"
  );
  await user.type(screen.getByLabelText(exactLabel("n[uú]mero de calle")), "742");

  await selectOption(user, "Provincia", "Córdoba");
  await waitFor(() =>
    expect(locationApi.getLocalidadesByProvincia).toHaveBeenCalled()
  );
  await selectOption(user, "Localidad", "Córdoba Capital");

  await selectOption(user, "Roles", "Administrador");
};

describe("CrearUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: new Usuario({
        id: 1,
        username: "admin1",
        authorities: ["ROLE_ADMIN"],
        sucursal: { id: 7, nombre: "Sucursal Centro" },
      }),
      isAuthenticated: true,
    });

    authorityApi.getAll.mockResolvedValue([
      { id: 1, name: "ROLE_SUPERUSER" },
      { id: 2, name: "ROLE_ADMIN" },
      { id: 3, name: "ROLE_CHOFER" },
      { id: 4, name: "ROLE_CARGA" },
      { id: 5, name: "ROLE_CUSTOMER" },
    ]);
    catalogsApi.getTiposDocumento.mockResolvedValue([{ id: 1, nombre: "DNI" }]);
    catalogsApi.getSexos.mockResolvedValue([
      { id: 1, nombre: "Masculino" },
      { id: 2, nombre: "Femenino" },
    ]);
    locationApi.getProvincias.mockResolvedValue([
      { id: 2, nombre: "Córdoba" },
    ]);
    locationApi.getLocalidadesByProvincia.mockResolvedValue([
      { id: 5, nombre: "Córdoba Capital" },
    ]);
    sucursalApi.getAll.mockResolvedValue([]);
  });

  it("envía fechaNacimiento como YYYY-MM-DD (LocalDate) y la sucursal propia del ADMIN, sin permitir elegirla", async () => {
    const user = userEvent.setup();
    usuarioApi.save.mockResolvedValue({ id: 99 });

    renderWithProviders(<CrearUsuario />);

    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalledTimes(1));

    await fillMinimalForm(user);

    await user.click(screen.getByRole("button", { name: /crear usuario/i }));

    await waitFor(() => expect(usuarioApi.save).toHaveBeenCalledTimes(1));

    expect(usuarioApi.save).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "jperez",
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan@example.com",
        authorities: ["ROLE_ADMIN"],
        // ADMIN nunca eligió sucursal (el campo ni se muestra): el payload
        // lleva igual la sucursal propia del ADMIN logueado, forzada por
        // UsuarioForm — ver test dedicado en UsuarioForm.test.jsx.
        sucursalID: 7,
        dni: "30111222",
      })
    );

    // `fechaNacimiento` (UserReqDTO.fechaNacimiento, `java.time.LocalDate`):
    // sólo `YYYY-MM-DD`, sin hora/offset. El valor exacto tipeado en el
    // DateInput no se aserta acá: el `DateInput` de Mantine recalcula su
    // valor en cada blur dentro de jsdom de forma no determinística en este
    // entorno de test — el formato de salida (sin `.toISOString()`) es lo
    // que cubre esta tarea y está además cubierto por `utils.test.js`
    // (`toBackendDate`), que sí fija el valor esperado.
    const [payload] = usuarioApi.save.mock.calls[0];
    expect(payload.fechaNacimiento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("muestra el error de campo devuelto por POST /api/user (400 de validación)", async () => {
    const user = userEvent.setup();
    usuarioApi.save.mockRejectedValue({
      response: {
        data: {
          statusCode: 400,
          message: "Error en la validación de los campos.",
          fields: [{ field: "email", error: "El email ya está en uso." }],
        },
      },
    });

    renderWithProviders(<CrearUsuario />);

    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalledTimes(1));

    await fillMinimalForm(user);
    await user.click(screen.getByRole("button", { name: /crear usuario/i }));

    await waitFor(() => expect(usuarioApi.save).toHaveBeenCalledTimes(1));

    expect(
      await screen.findByText("El email ya está en uso.")
    ).toBeInTheDocument();
  });

  it("enviar vacío muestra errores inline en español, sin tooltip nativo ni POST (SHG-FE-107)", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<CrearUsuario />);
    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: /crear usuario/i }));

    expect(
      await screen.findByText("El campo username no puede estar vacío")
    ).toBeInTheDocument();
    expect(screen.getByText("El campo email no puede estar vacío")).toBeInTheDocument();
    expect(container.querySelector("form")).toHaveAttribute("novalidate");
    expect(usuarioApi.save).not.toHaveBeenCalled();
  });

  it("prefijo y teléfono no numéricos → error inline (SHG-FE-107)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrearUsuario />);
    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText(exactLabel("prefijo")), "abc");
    await user.type(screen.getByLabelText(exactLabel("tel[eé]fono")), "12x");
    await user.click(screen.getByRole("button", { name: /crear usuario/i }));

    expect(await screen.findByText("El prefijo sólo puede tener números")).toBeInTheDocument();
    expect(screen.getByText("El teléfono sólo puede tener números")).toBeInTheDocument();
    expect(usuarioApi.save).not.toHaveBeenCalled();
  });

  describe("SUPERUSER: sucursal obligatoria (SHG-FE-116)", () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: new Usuario({
          id: 2,
          username: "super",
          authorities: ["ROLE_SUPERUSER"],
          sucursal: { id: 7, nombre: "Sucursal Centro" },
        }),
        isAuthenticated: true,
      });
      sucursalApi.getAll.mockResolvedValue([
        { id: 7, nombre: "Sucursal Centro" },
        { id: 8, nombre: "Sucursal Norte" },
      ]);
    });

    it("el campo Sucursal ya no dice '(opcional)' y es requerido", async () => {
      renderWithProviders(<CrearUsuario />);
      await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());

      const combo = await screen.findByRole("combobox", { name: /^Sucursal/i });
      expect(combo).toBeRequired();
      expect(combo).toHaveAttribute("placeholder", "Seleccioná una sucursal");
      expect(screen.queryByPlaceholderText(/opcional/i)).not.toBeInTheDocument();
    });

    it("sin elegir sucursal no se envía y marca el error en el campo", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CrearUsuario />);
      await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());

      await fillMinimalForm(user);
      await user.click(screen.getByRole("button", { name: /crear usuario/i }));

      expect(
        await screen.findByText("Debes seleccionar una sucursal")
      ).toBeInTheDocument();
      expect(usuarioApi.save).not.toHaveBeenCalled();
    });

    it("eligiendo la sucursal, el POST lleva su sucursalID", async () => {
      const user = userEvent.setup();
      usuarioApi.save.mockResolvedValue({ id: 99 });
      renderWithProviders(<CrearUsuario />);
      await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());

      await fillMinimalForm(user);
      await selectOption(user, "Sucursal", "Sucursal Norte");
      await user.click(screen.getByRole("button", { name: /crear usuario/i }));

      await waitFor(() => expect(usuarioApi.save).toHaveBeenCalledTimes(1));
      expect(usuarioApi.save.mock.calls[0][0].sucursalID).toBe(8);
    });

    it("un 409 empresa_requerida muestra el mensaje del backend, no uno genérico", async () => {
      const user = userEvent.setup();
      usuarioApi.save.mockRejectedValue({
        response: {
          status: 409,
          data: {
            statusCode: 409,
            message: "Primero tenés que crear tu empresa",
            code: "empresa_requerida",
          },
        },
      });
      renderWithProviders(<CrearUsuario />);
      await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());

      await fillMinimalForm(user);
      await selectOption(user, "Sucursal", "Sucursal Norte");
      await user.click(screen.getByRole("button", { name: /crear usuario/i }));

      expect(
        await screen.findByText("Primero tenés que crear tu empresa")
      ).toBeInTheDocument();
    });
  });
});
