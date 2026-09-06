import { z } from "zod";

/**
 * Validación de `VehiculoForm` (crear / editar). Migrada 1:1 desde el objeto
 * `validate: {...}` manual que vivía duplicado en `CrearVehiculo` y
 * `EditarVehiculo`, para alinear con el patrón canónico de `CrearEnvios`
 * (`schemaResolver` + Zod).
 *
 * Reglas alineadas con `VehiculoReqDTO` (backend, `SHG-BE-008`):
 * - `anioCompra` (Long) — `@Min(1900)`.
 * - `kilometraje` (Integer) — `@Min(0)`.
 * - `cantidadRuedas` (Integer) — `@Min(4)`.
 * - `pesoMaximo` (Double) — `@DecimalMin("0.0")` (el front exige `> 0`).
 * - `consumoPromedio` (Double) — `@DecimalMin("0.1")`.
 */

const currentYear = new Date().getFullYear();

// Selects controlados: el valor vacío es `null` (initialValues) o `""`.
const requiredSelect = (msg) =>
  z.preprocess((value) => (value == null ? "" : value), z.string().min(1, msg));

// NumberInput controlado: vacío es `""` o `null`; si no, un number.
const numberField = (schema) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    schema,
  );

export const VEHICULO_SCHEMA = z.object({
  patente: z.string().trim().min(1, "El campo patente no puede estar vacío"),
  tipoVehiculoID: requiredSelect("Debe seleccionar un tipo de vehículo"),
  marcaID: requiredSelect("Debe seleccionar una marca"),
  modeloID: requiredSelect("Debe seleccionar un modelo"),
  combustibleID: requiredSelect("Debe seleccionar un combustible"),
  tipoRuedaID: requiredSelect("Debe seleccionar un tipo de rueda"),
  anioCompra: numberField(
    z
      .number({ error: "El campo año de compra no puede estar vacío" })
      .gte(1900, "El año debe ser mayor a 1900")
      .lte(currentYear, "El año no puede ser mayor al actual"),
  ),
  kilometraje: numberField(
    z
      .number({ error: "El campo kilometraje no puede estar vacío" })
      .gte(0, "El kilometraje debe ser mayor o igual a 0"),
  ),
  cantidadRuedas: numberField(
    z
      .number({ error: "El campo cantidad de ruedas no puede estar vacío" })
      .gte(4, "La cantidad de ruedas debe ser al menos 4"),
  ),
  pesoMaximo: numberField(
    z
      .number({ error: "El campo peso máximo no puede estar vacío" })
      .gt(0, "El peso máximo debe ser mayor a 0"),
  ),
  consumoPromedio: numberField(
    z
      .number({ error: "El campo consumo promedio no puede estar vacío" })
      .gte(0.1, "El consumo promedio debe ser mayor o igual a 0.1"),
  ),
});

export const VEHICULO_INITIAL_VALUES = {
  patente: "",
  tipoVehiculoID: null,
  marcaID: null,
  modeloID: null,
  combustibleID: null,
  tipoRuedaID: null,
  anioCompra: currentYear,
  kilometraje: 0,
  cantidadRuedas: 4,
  pesoMaximo: 0,
  consumoPromedio: 0,
};
