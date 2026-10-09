import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

vi.mock("@api", () => ({
  usuarioApi: {
    delete: vi.fn(),
    requestPasswordReset: vi.fn(),
  },
}));

import { useAuthStore } from "@stores/auth.store";
import ListaUsuariosTabla from "./ListaUsuariosTabla";

const LOGGED_IN_USER = { id: 1, username: "yo", authorities: ["ROLE_SUPERUSER"] };

const SELF = {
  id: 1,
  nombre: "Yo",
  apellido: "Mismo",
  username: "yo",
  email: "yo@shipgo.com",
  authorities: ["ROLE_ADMIN"],
};

const OTRO_MULTI_ROL = {
  id: 2,
  nombre: "Otra",
  apellido: "Persona",
  username: "otra",
  email: "otra@shipgo.com",
  authorities: ["ROLE_ADMIN", "ROLE_SUPERUSER"],
};

const renderWithProviders = (ui) =>
  render(
    <MantineProvider>
      <ModalsProvider>{ui}</ModalsProvider>
    </MantineProvider>
  );

describe("ListaUsuariosTabla (SHG-FE-094)", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: LOGGED_IN_USER });
  });

  it("no ofrece 'Eliminar' en la fila del propio usuario logueado", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Yo Mismo"));

    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });

  it("sí ofrece 'Eliminar' en la fila de otro usuario", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Otra Persona"));

    expect(await screen.findByText("Eliminar")).toBeInTheDocument();
  });

  it("no tiene la acción 'Desactivar' en ninguna fila", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF, OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Yo Mismo"));
    expect(screen.queryByText("Desactivar")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Acciones de Otra Persona"));
    expect(screen.queryByText("Desactivar")).not.toBeInTheDocument();
  });

  it("compara id como string vs number (misma persona): no ofrece 'Eliminar'", async () => {
    // El store puede traer `currentUser.id` como string (ej. viene de un
    // `useParams()` en otra pantalla) mientras que `usuario.id` en el listado
    // es number (tal cual lo devuelve la API) — la comparación debe normalizar
    // ambos a string, no usar `===` estricto.
    useAuthStore.setState({ user: { id: "1", username: "yo" } });
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Yo Mismo"));

    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });

  it("con user null / sin id en el store, muestra 'Eliminar' (default: no se asume auto-eliminación)", async () => {
    useAuthStore.setState({ user: null });
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[{ ...SELF, authorities: ["ROLE_CHOFER"] }]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Yo Mismo"));

    expect(await screen.findByText("Eliminar")).toBeInTheDocument();
  });

  it("deshabilita el checkbox de la propia fila (SHG-FE-095: no se puede auto-seleccionar para el bulk delete)", () => {
    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF, OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(
      screen.getByRole("checkbox", { name: "No podés seleccionar tu propio usuario" })
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Seleccionar usuario otra" })
    ).not.toBeDisabled();
  });

  it('"Seleccionar todos" (cabecera) queda tildado si sólo faltan seleccionar filas no seleccionables (la propia)', () => {
    // Si el cálculo de "todos seleccionados" no excluyera la propia fila, este
    // checkbox nunca llegaría a `checked` con una sola fila ajena en la
    // página — se quedaría indeterminado para siempre.
    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF, OTRO_MULTI_ROL]}
        selectedIds={new Set([OTRO_MULTI_ROL.id])}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Seleccionar todos los usuarios" })).toBeChecked();
  });

  it("muestra un badge por cada rol (authority) del usuario", () => {
    renderWithProviders(
      <ListaUsuariosTabla
        items={[OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const row = screen.getByText("Otra Persona").closest("tr");
    expect(within(row).getByText("Administrador")).toBeInTheDocument();
    expect(within(row).getByText("Superusuario")).toBeInTheDocument();
  });
});

describe("ListaUsuariosTabla — ADMIN sobre otros ADMIN (SHG-FE-121)", () => {
  const ADMIN_LOGUEADO = { id: 1, username: "yo", authorities: ["ROLE_ADMIN"] };
  const OTRO_ADMIN = { id: 2, nombre: "Otro", apellido: "Admin", username: "otroadmin", authorities: ["ROLE_ADMIN"] };
  const CHOFER = { id: 3, nombre: "Cho", apellido: "Fer", username: "chofer", authorities: ["ROLE_CHOFER"] };

  const renderTabla = (items) =>
    renderWithProviders(
      <ListaUsuariosTabla
        items={items}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

  beforeEach(() => {
    useAuthStore.setState({ user: ADMIN_LOGUEADO });
  });

  it("no ofrece Editar ni Eliminar sobre otro ADMIN y su checkbox está deshabilitado", async () => {
    const user = userEvent.setup();
    renderTabla([OTRO_ADMIN]);

    await user.click(screen.getByRole("button", { name: "Acciones de Otro Admin" }));
    expect(await screen.findByText("Ver detalles")).toBeInTheDocument();
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
    expect(screen.queryByText("Resetear contraseña")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /No podés seleccionar a otroadmin/ })).toBeDisabled();
  });

  it("sobre un chofer ofrece Editar y Eliminar", async () => {
    const user = userEvent.setup();
    renderTabla([CHOFER]);

    await user.click(screen.getByRole("button", { name: "Acciones de Cho Fer" }));
    expect(await screen.findByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
    expect(screen.getByText("Resetear contraseña")).toBeInTheDocument();
  });

  it("no ofrece Resetear contraseña sobre el SUPERUSER", async () => {
    const user = userEvent.setup();
    renderTabla([{ id: 4, nombre: "Su", apellido: "Per", username: "su", authorities: ["ROLE_SUPERUSER"] }]);

    await user.click(screen.getByRole("button", { name: "Acciones de Su Per" }));
    expect(await screen.findByText("Ver detalles")).toBeInTheDocument();
    expect(screen.queryByText("Resetear contraseña")).not.toBeInTheDocument();
  });

  it("un SUPERUSER ve Resetear contraseña sobre otro ADMIN", async () => {
    useAuthStore.setState({ user: { id: 9, username: "su", authorities: ["ROLE_SUPERUSER"] } });
    const user = userEvent.setup();
    renderTabla([OTRO_ADMIN]);

    await user.click(screen.getByRole("button", { name: "Acciones de Otro Admin" }));
    expect(await screen.findByText("Resetear contraseña")).toBeInTheDocument();
  });

  it("sobre el propio usuario ADMIN ofrece Editar pero no Eliminar", async () => {
    const user = userEvent.setup();
    renderTabla([SELF]);

    await user.click(screen.getByRole("button", { name: "Acciones de Yo Mismo" }));
    expect(await screen.findByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Resetear contraseña")).toBeInTheDocument();
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });
});
