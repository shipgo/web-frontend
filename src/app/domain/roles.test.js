import { describe, expect, it } from "vitest";

import {
  hasAnyRole,
  hasRole,
  isAdminOrSuper,
  isCustomer,
  landingPathFor,
  normalizarRol,
  rolBadge,
  rolLabel,
  rolOptions,
  rolesDe,
  ADMIN_HOME_PATH,
  PORTAL_HOME_PATH,
  ROLE_ADMIN,
  ROLE_CHOFER,
  ROLE_CUSTOMER,
  ROLE_SUPERUSER,
} from "./roles";

const userAdmin = { authorities: [{ name: "ROLE_ADMIN" }] };
const userSuper = { authorities: [{ name: "ROLE_SUPERUSER" }] };
const userChofer = { authorities: ["ROLE_CHOFER"] };
const userMulti = { authorities: [{ name: "ROLE_ADMIN" }, { name: "ROLE_CHOFER" }] };

describe("constantes de rol", () => {
  it("usa ROLE_SUPERUSER, no ROLE_SUPER", () => {
    expect(ROLE_SUPERUSER).toBe("ROLE_SUPERUSER");
    expect(ROLE_CUSTOMER).toBe("ROLE_CUSTOMER");
  });
});

describe("normalizarRol", () => {
  it("canoniza cualquier forma a ROLE_*", () => {
    expect(normalizarRol("admin")).toBe("ROLE_ADMIN");
    expect(normalizarRol("ROLE_ADMIN")).toBe("ROLE_ADMIN");
    expect(normalizarRol({ name: "ROLE_CHOFER" })).toBe("ROLE_CHOFER");
    expect(normalizarRol({ authority: "superuser" })).toBe("ROLE_SUPERUSER");
  });

  it("devuelve string vacío para basura", () => {
    expect(normalizarRol(null)).toBe("");
    expect(normalizarRol("")).toBe("");
  });
});

describe("rolesDe", () => {
  it("extrae roles canónicos de un usuario", () => {
    expect(rolesDe(userMulti)).toEqual(["ROLE_ADMIN", "ROLE_CHOFER"]);
    expect(rolesDe(userChofer)).toEqual(["ROLE_CHOFER"]);
  });

  it("acepta un array suelto y devuelve [] sin usuario", () => {
    expect(rolesDe(["admin"])).toEqual(["ROLE_ADMIN"]);
    expect(rolesDe(null)).toEqual([]);
  });
});

describe("hasRole", () => {
  it("detecta el rol sin importar la forma pasada", () => {
    expect(hasRole(userAdmin, ROLE_ADMIN)).toBe(true);
    expect(hasRole(userAdmin, "admin")).toBe(true);
    expect(hasRole(userAdmin, ROLE_CHOFER)).toBe(false);
  });

  it("es falso para usuario nulo", () => {
    expect(hasRole(null, ROLE_ADMIN)).toBe(false);
  });
});

describe("hasAnyRole", () => {
  it("true si tiene al menos uno", () => {
    expect(hasAnyRole(userChofer, [ROLE_ADMIN, ROLE_CHOFER])).toBe(true);
    expect(hasAnyRole(userChofer, [ROLE_ADMIN, ROLE_SUPERUSER])).toBe(false);
    expect(hasAnyRole(userChofer, [])).toBe(false);
  });
});

describe("isAdminOrSuper", () => {
  it("true para ADMIN o SUPERUSER", () => {
    expect(isAdminOrSuper(userAdmin)).toBe(true);
    expect(isAdminOrSuper(userSuper)).toBe(true);
    expect(isAdminOrSuper(userChofer)).toBe(false);
    expect(isAdminOrSuper(null)).toBe(false);
  });
});

describe("rolBadge / rolLabel / rolOptions", () => {
  it("rolBadge da label y color por rol", () => {
    expect(rolBadge("ROLE_ADMIN")).toEqual({ label: "Administrador", color: "red" });
    expect(rolBadge({ name: "ROLE_SUPERUSER" }).label).toBe("Superusuario");
  });

  it("rolBadge hace fallback gris", () => {
    expect(rolBadge("ROLE_LO_QUE_SEA")).toEqual({ label: "Usuario", color: "gray" });
  });

  it("rolLabel legible incluso para roles desconocidos", () => {
    expect(rolLabel("ROLE_CHOFER")).toBe("Chofer");
    expect(rolLabel("ROLE_ALGO_RARO")).toBe("ALGO RARO");
  });

  it("rolOptions devuelve value canónico + label", () => {
    expect(rolOptions([ROLE_ADMIN, ROLE_CHOFER])).toEqual([
      { value: "ROLE_ADMIN", label: "Administrador" },
      { value: "ROLE_CHOFER", label: "Chofer" },
    ]);
  });
});

describe("isCustomer / landingPathFor (SHG-FE-026)", () => {
  const userCustomer = { authorities: [{ name: "ROLE_CUSTOMER" }] };

  it("isCustomer sólo es true para ROLE_CUSTOMER", () => {
    expect(isCustomer(userCustomer)).toBe(true);
    expect(isCustomer(userAdmin)).toBe(false);
    expect(isCustomer(userSuper)).toBe(false);
    expect(isCustomer(null)).toBe(false);
  });

  it("landingPathFor manda al portal a un CUSTOMER", () => {
    expect(landingPathFor(userCustomer)).toBe(PORTAL_HOME_PATH);
    expect(PORTAL_HOME_PATH).toBe("/portal/envios");
  });

  it("landingPathFor manda al panel de admin a SU/AD (y a desconocidos)", () => {
    expect(landingPathFor(userAdmin)).toBe(ADMIN_HOME_PATH);
    expect(landingPathFor(userSuper)).toBe(ADMIN_HOME_PATH);
    expect(landingPathFor({ id: 1 })).toBe(ADMIN_HOME_PATH);
    expect(ADMIN_HOME_PATH).toBe("/");
  });
});
