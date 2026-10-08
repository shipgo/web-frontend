import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@mantine/form";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppShell } from "@mantine/core";

import { renderWithProviders as renderRaw } from "../../../test/renderWithProviders";

// `UsuarioForm` monta `<PageFooter>` (`AppShellFooter`), que necesita un
// `<AppShell>` ancestro — lo provee `src/app/layout` en la app real.
const renderWithProviders = (ui, options) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>, options);

vi.mock("@api", () => ({
  sucursalApi: { getAll: vi.fn() },
  authorityApi: { getAll: vi.fn() },
  catalogsApi: { getTiposDocumento: vi.fn(), getSexos: vi.fn() },
  locationApi: { getProvincias: vi.fn(), getLocalidadesByProvincia: vi.fn() },
}));

import { sucursalApi, authorityApi, catalogsApi, locationApi } from "@api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import UsuarioForm from "./UsuarioForm";

// Catálogo real de `GET /api/authority/all` — incluye roles que la web NUNCA
// debe ofrecer (ROLE_CUSTOMER) para validar que el filtro funciona sobre datos
// reales del backend, no sobre una lista hardcodeada.
const ALL_AUTHORITIES = [
  { id: 1, name: "ROLE_SUPERUSER" },
  { id: 2, name: "ROLE_ADMIN" },
  { id: 3, name: "ROLE_CHOFER" },
  { id: 4, name: "ROLE_CARGA" },
  { id: 5, name: "ROLE_CUSTOMER" },
];

const FormHarness = ({ onSubmit = vi.fn(), isEdit = false }) => {
  const form = useForm({
    initialValues: {
      username: "",
      nombre: "",
      apellido: "",
      fechaNacimiento: null,
      prefijo: "",
      telefono: "",
      nombreCalle: "",
      numeroCalle: "",
      email: "",
      sucursalID: null,
      authorities: [],
      dni: "",
      tipoDocumentoID: null,
      sexoID: null,
      localidadID: null,
      provinciaID: null,
    },
  });

  return (
    <UsuarioForm
      form={form}
      onSubmit={onSubmit}
      loading={false}
      onCancel={vi.fn()}
      isEdit={isEdit}
    />
  );
};

const openRolesListbox = async (user) => {
  const rolesInput = screen.getByRole("combobox", { name: /^roles/i });
  await user.click(rolesInput);
  const listboxId = rolesInput.getAttribute("aria-controls");
  return within(document.getElementById(listboxId));
};

describe("UsuarioForm — roles y sucursal (CONTRACTS.md §3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });

    authorityApi.getAll.mockResolvedValue(ALL_AUTHORITIES);
    catalogsApi.getTiposDocumento.mockResolvedValue([]);
    catalogsApi.getSexos.mockResolvedValue([]);
    locationApi.getProvincias.mockResolvedValue([]);
    sucursalApi.getAll.mockResolvedValue([
      { id: 1, nombre: "Sucursal Centro" },
      { id: 2, nombre: "Sucursal Norte" },
    ]);
  });

  it("para un ADMIN: opciones de rol reales sin ROLE_SUPERUSER ni ROLE_CUSTOMER, y sucursal fija (no seleccionable)", async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: new Usuario({
        id: 1,
        username: "admin1",
        authorities: ["ROLE_ADMIN"],
        sucursal: { id: 7, nombre: "Sucursal Centro" },
      }),
      isAuthenticated: true,
    });

    renderWithProviders(<FormHarness />);

    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalledTimes(1));
    // El ADMIN no dispara el fetch de sucursales (Select sólo para SUPERUSER).
    expect(sucursalApi.getAll).not.toHaveBeenCalled();

    const listbox = await openRolesListbox(user);
    expect(listbox.queryByText("Administrador")).not.toBeInTheDocument();
    expect(listbox.getByText("Chofer")).toBeInTheDocument();
    expect(listbox.getByText("Carga")).toBeInTheDocument();
    expect(listbox.queryByText("Superusuario")).not.toBeInTheDocument();
    expect(listbox.queryByText("Cliente")).not.toBeInTheDocument();

    // Sucursal: input de sólo lectura con el nombre de la sucursal propia, no un Select.
    const sucursalInput = screen.getByRole("textbox", { name: /^sucursal/i });
    expect(sucursalInput).toBeDisabled();
    expect(sucursalInput).toHaveValue("Sucursal Centro");
  });

  it("para un SUPERUSER: ROLE_SUPERUSER está disponible como opción y la sucursal es un Select libre", async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: new Usuario({
        id: 2,
        username: "super1",
        authorities: ["ROLE_SUPERUSER"],
        sucursal: null,
      }),
      isAuthenticated: true,
    });

    renderWithProviders(<FormHarness />);

    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalledTimes(1));

    const listbox = await openRolesListbox(user);
    expect(listbox.getByText("Superusuario")).toBeInTheDocument();
    expect(listbox.getByText("Administrador")).toBeInTheDocument();
    expect(listbox.queryByText("Cliente")).not.toBeInTheDocument();

    const sucursalInput = screen.getByRole("combobox", { name: /^sucursal/i });
    expect(sucursalInput).not.toBeDisabled();
  });

  it("SHG-FE-121: ADMIN editando a un ADMIN ve el rol actual, el campo está bloqueado y el valor no cambia", async () => {
    useAuthStore.setState({
      user: new Usuario({ id: 1, username: "admin1", authorities: ["ROLE_ADMIN"], sucursal: { id: 7, nombre: "Sucursal Centro" } }),
      isAuthenticated: true,
    });
    let formRef;
    const Harness = () => {
      const form = useForm({ initialValues: { authorities: ["ROLE_ADMIN"], sucursalID: "7" } });
      formRef = form;
      return <UsuarioForm form={form} onSubmit={vi.fn()} loading={false} onCancel={vi.fn()} isEdit />;
    };

    renderWithProviders(<Harness />);

    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalled());
    expect(await screen.findByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText(/sólo un superusuario puede cambiar este rol/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^roles/i })).toBeDisabled();
    expect(formRef.values.authorities).toEqual(["ROLE_ADMIN"]);
  });

  it("SUPERUSER editando (SHG-FE-116): Sucursal es obligatoria y no se puede limpiar", async () => {
    useAuthStore.setState({
      user: new Usuario({ id: 2, username: "super1", authorities: ["ROLE_SUPERUSER"], sucursal: { id: 1, nombre: "Sucursal Centro" } }),
      isAuthenticated: true,
    });

    renderWithProviders(<FormHarness isEdit />);
    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalledTimes(1));

    expect(screen.getByRole("combobox", { name: /^sucursal/i })).toBeRequired();
    expect(screen.queryByRole("button", { name: /clear|limpiar/i })).not.toBeInTheDocument();
  });
});
