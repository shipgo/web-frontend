import { describe, expect, it } from "vitest";

import { SUCURSAL_SCHEMA, SUCURSAL_INITIAL_VALUES } from "./schema";

const VALID_SUCURSAL = {
  nombre: "Sucursal Norte",
  email: "norte@shipgo.com",
  prefijo: "+54",
  telefono: "3511234567",
  nombreCalle: "Av. Colón",
  numeroCalle: "1234",
  provinciaID: "2",
  localidadID: "5",
};

describe("SUCURSAL_SCHEMA", () => {
  it("acepta una sucursal con todos los campos requeridos", () => {
    const result = SUCURSAL_SCHEMA.safeParse(VALID_SUCURSAL);
    expect(result.success).toBe(true);
  });

  it("rechaza los initial values vacíos (todos los campos son requeridos)", () => {
    const result = SUCURSAL_SCHEMA.safeParse(SUCURSAL_INITIAL_VALUES);
    expect(result.success).toBe(false);
    const paths = result.error.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "nombre",
        "email",
        "prefijo",
        "telefono",
        "nombreCalle",
        "numeroCalle",
        "provinciaID",
        "localidadID",
      ])
    );
  });

  it("rechaza un email inválido", () => {
    const result = SUCURSAL_SCHEMA.safeParse({
      ...VALID_SUCURSAL,
      email: "no-es-un-email",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["email"]);
  });

  it("rechaza provincia o localidad sin seleccionar (null y string vacío)", () => {
    expect(
      SUCURSAL_SCHEMA.safeParse({ ...VALID_SUCURSAL, provinciaID: null }).success
    ).toBe(false);
    expect(
      SUCURSAL_SCHEMA.safeParse({ ...VALID_SUCURSAL, provinciaID: "" }).success
    ).toBe(false);
    expect(
      SUCURSAL_SCHEMA.safeParse({ ...VALID_SUCURSAL, localidadID: null }).success
    ).toBe(false);
    expect(
      SUCURSAL_SCHEMA.safeParse({ ...VALID_SUCURSAL, localidadID: "" }).success
    ).toBe(false);
  });

  it("rechaza nombre/dirección en blanco (sólo espacios)", () => {
    expect(
      SUCURSAL_SCHEMA.safeParse({ ...VALID_SUCURSAL, nombre: "   " }).success
    ).toBe(false);
    expect(
      SUCURSAL_SCHEMA.safeParse({ ...VALID_SUCURSAL, numeroCalle: "" }).success
    ).toBe(false);
  });
});
