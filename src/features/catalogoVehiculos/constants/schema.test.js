import { describe, expect, it } from "vitest";

import {
  MARCA_SCHEMA,
  MARCA_INITIAL_VALUES,
  MODELO_SCHEMA,
  MODELO_INITIAL_VALUES,
} from "./schema";

describe("MARCA_SCHEMA", () => {
  it("acepta una marca con nombre", () => {
    expect(MARCA_SCHEMA.safeParse({ nombre: "Mercedes-Benz" }).success).toBe(true);
  });

  it("rechaza nombre vacío o en blanco", () => {
    expect(MARCA_SCHEMA.safeParse(MARCA_INITIAL_VALUES).success).toBe(false);
    expect(MARCA_SCHEMA.safeParse({ nombre: "   " }).success).toBe(false);
  });
});

describe("MODELO_SCHEMA", () => {
  const VALID_MODELO = { nombre: "Sprinter", marcaID: "1", anio: 2020 };

  it("acepta un modelo con todos los campos requeridos", () => {
    expect(MODELO_SCHEMA.safeParse(VALID_MODELO).success).toBe(true);
  });

  it("rechaza los initial values vacíos", () => {
    const result = MODELO_SCHEMA.safeParse({
      ...MODELO_INITIAL_VALUES,
      nombre: "",
    });
    expect(result.success).toBe(false);
    const paths = result.error.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["nombre", "marcaID"]));
  });

  it("rechaza marca sin seleccionar (null y string vacío)", () => {
    expect(
      MODELO_SCHEMA.safeParse({ ...VALID_MODELO, marcaID: null }).success
    ).toBe(false);
    expect(
      MODELO_SCHEMA.safeParse({ ...VALID_MODELO, marcaID: "" }).success
    ).toBe(false);
  });

  it("rechaza un año fuera de rango (anterior a 1900 o muy futuro)", () => {
    expect(
      MODELO_SCHEMA.safeParse({ ...VALID_MODELO, anio: 1899 }).success
    ).toBe(false);
    expect(
      MODELO_SCHEMA.safeParse({
        ...VALID_MODELO,
        anio: new Date().getFullYear() + 5,
      }).success
    ).toBe(false);
  });

  it("rechaza año vacío o no numérico", () => {
    expect(
      MODELO_SCHEMA.safeParse({ ...VALID_MODELO, anio: "" }).success
    ).toBe(false);
    expect(
      MODELO_SCHEMA.safeParse({ ...VALID_MODELO, anio: null }).success
    ).toBe(false);
  });
});
