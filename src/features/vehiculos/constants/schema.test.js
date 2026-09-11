import { afterEach, describe, expect, it } from "vitest";

import {
  VEHICULO_SCHEMA,
  resetCategoriaPorTipoVehiculoId,
  setCategoriaPorTipoVehiculoId,
} from "./schema";

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

  it("rechaza peso máximo <= 0", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, pesoMaximo: 0 }).success,
    ).toBe(false);
  });

  it("exige consumo promedio >= 0.1 (VehiculoReqDTO @DecimalMin)", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, consumoPromedio: 0 })
        .success,
    ).toBe(false);
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, consumoPromedio: 0.05 })
        .success,
    ).toBe(false);
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, consumoPromedio: 0.1 })
        .success,
    ).toBe(true);
  });

  it("exige al menos 4 ruedas para un tipoVehiculo sin categoría reconocida (automotor / legacy)", () => {
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 3 }).success,
    ).toBe(false);
    expect(
      VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 4 }).success,
    ).toBe(true);
  });

  describe("cantidadRuedas por categoría (SHG-BE-040 / SHG-FE-056)", () => {
    afterEach(() => {
      resetCategoriaPorTipoVehiculoId();
    });

    it("rechaza el piso genérico de Bean Validation (>=2) cuando la categoría no es moto", () => {
      setCategoriaPorTipoVehiculoId({ 1: "automotor" });

      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 2 })
          .success,
      ).toBe(false);
      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 4 })
          .success,
      ).toBe(true);
    });

    it("exige exactamente 2 ruedas cuando el tipoVehiculo es categoría moto", () => {
      setCategoriaPorTipoVehiculoId({ 1: "moto" });

      const conDosRuedas = VEHICULO_SCHEMA.safeParse({
        ...VALID_VEHICULO,
        cantidadRuedas: 2,
      });
      expect(conDosRuedas.success).toBe(true);

      const conCuatroRuedas = VEHICULO_SCHEMA.safeParse({
        ...VALID_VEHICULO,
        cantidadRuedas: 4,
      });
      expect(conCuatroRuedas.success).toBe(false);
      expect(conCuatroRuedas.error.issues[0].path).toEqual(["cantidadRuedas"]);
      expect(conCuatroRuedas.error.issues[0].message).toMatch(
        /exactamente 2 ruedas/i,
      );

      const conUnaRueda = VEHICULO_SCHEMA.safeParse({
        ...VALID_VEHICULO,
        cantidadRuedas: 1,
      });
      // Bajo el piso físico de Bean Validation (`@Min(2)`) — lo rechaza el
      // campo base, antes incluso de llegar al `superRefine` por categoría.
      expect(conUnaRueda.success).toBe(false);
    });

    it("vuelve a exigir mínimo 4 si se cambia a un tipoVehiculo no-moto (mismo id, catálogo actualizado)", () => {
      setCategoriaPorTipoVehiculoId({ 1: "moto" });
      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 2 })
          .success,
      ).toBe(true);

      setCategoriaPorTipoVehiculoId({ 1: "automotor" });
      expect(
        VEHICULO_SCHEMA.safeParse({ ...VALID_VEHICULO, cantidadRuedas: 2 })
          .success,
      ).toBe(false);
    });
  });
});
