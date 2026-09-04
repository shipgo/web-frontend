import { describe, expect, it } from "vitest";

import { getHomeItems } from "./getHomeItems.js";

const userAdmin = { authorities: [{ name: "ROLE_ADMIN" }] };
const userSuper = { authorities: [{ name: "ROLE_SUPERUSER" }] };
const userChofer = { authorities: [{ name: "ROLE_CHOFER" }] };

const findSection = (items, title) => items.find((s) => s.title === title);
const optionTitles = (section) => section?.options.map((o) => o.title) ?? [];

describe("getHomeItems", () => {
  it("ADMIN ve Gestionar + Administrar + Opciones completos", () => {
    const items = getHomeItems(userAdmin);

    expect(optionTitles(findSection(items, "Gestionar"))).toEqual([
      "Mapa",
      "Viajes",
      "Envíos",
      "Dashboard",
    ]);
    expect(optionTitles(findSection(items, "Administrar"))).toEqual([
      "Usuarios",
      "Vehículos",
    ]);
    expect(optionTitles(findSection(items, "Opciones"))).toEqual([
      "Manual",
      "Alternar tema",
    ]);
  });

  it("SUPERUSER ve las mismas opciones que ADMIN (todas son ROLES_WEB)", () => {
    const items = getHomeItems(userSuper);
    expect(optionTitles(findSection(items, "Administrar"))).toEqual([
      "Usuarios",
      "Vehículos",
    ]);
  });

  it("un usuario sin rol web no ve Gestionar ni Administrar", () => {
    const items = getHomeItems(userChofer);

    expect(findSection(items, "Gestionar")).toBeUndefined();
    expect(findSection(items, "Administrar")).toBeUndefined();
    // "Opciones" no tiene roles restringidos, así que sigue visible.
    expect(optionTitles(findSection(items, "Opciones"))).toEqual([
      "Manual",
      "Alternar tema",
    ]);
  });

  it("sin usuario no rompe y no muestra secciones restringidas", () => {
    const items = getHomeItems(null);
    expect(findSection(items, "Gestionar")).toBeUndefined();
  });
});
