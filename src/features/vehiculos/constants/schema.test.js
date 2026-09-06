import { describe, expect, it } from "vitest";

import { VEHICULO_SCHEMA } from "./schema";

const currentYear = new Date().getFullYear();

const VALID_VEHICULO = {
  patente: "AB123CD",
  tipoVehiculoID: "1",
  marcaID: "2",
  modeloID: "3",
  combustibleID: "4",
  tipoRuedaID: "5",
  anioCompra: 2020,
  kilometraje: 50000,
  cantidadRuedas: 4,
  pesoMaximo: 1500,
  consumoPromedio: 8.5,
};

describe("VEHICULO_SCHEMA", () => {
  it("acepta un vehículo con todos los campos válidos", () => {
    const result = VEHICULO_SCHEMA.safeParse(VALID_VEHICULO);
    expect(result.success).toBe(true);
  });

  it("rechaza patente vacía", () => {
    const result = VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, patente: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["patente"]);
  });

  it("rechaza selects sin elegir (null o cadena vacía)", () => {
    for (const campo of [
      "tipoVehiculoID",
      "marcaID",
      "modeloID",
      "combustibleID",
      "tipoRuedaID",
    ]) {
      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, [campo]: null }).success,
      ).toBe(false);
      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, [campo]: "" }).success,
      ).toBe(false);
    }
  });

  it("rechaza año de compra fuera de rango", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, anioCompra: 1800 }).success,
    ).toBe(false);
    expect(
      VEHICULO_SCHEMA.safeParse({
        ...VALID_VEHICULO,
        anioCompra: currentYear + 1,
      }).success,
    ).toBe(false);
  });

  it("rechaza campos numéricos vacíos", () => {
    for (const campo of [
      "anioCompra",
      "kilometraje",
      "cantidadRuedas",
      "pesoMaximo",
      "consumoPromedio",
    ]) {
      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, [campo]: "" }).success,
      ).toBe(false);
    }
  });

  it("acepta kilometraje 0 pero rechaza negativo", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, kilometraje: 0 }).success,
    ).toBe(true);
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, kilometraje: -1 }).success,
    ).toBe(false);
  });

  it("rechaza peso máximo y consumo promedio <= 0", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, pesoMaximo: 0 }).success,
    ).toBe(false);
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, consumoPromedio: 0 })
        .success,
    ).toBe(false);
  });

  it("rechaza menos de 2 ruedas", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 1 }).success,
    ).toBe(false);
  });
});
