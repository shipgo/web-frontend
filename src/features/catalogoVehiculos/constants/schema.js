import { z } from "zod";

/**
 * Validación de `MarcaForm` / `ModeloForm` (crear/editar) con Zod +
 * `schemaResolver` nativo de `@mantine/form`, alineado al patrón canónico de
 * `CrearEnvios`/`CrearViaje`/`VehiculoForm` (`SHG-FE-018`/`SHG-FE-019`).
 *
 * Reglas alineadas con `MarcaReqDTO { nombre }` y
 * `ModeloReqDTO { nombre, marcaID, anio }` (`ENDPOINTS.md` §11/§12).
 */

const currentYear = new Date().getFullYear();

// Select controlado: el valor vacío es `null` (initialValues) o `""`.
const requiredSelect = (msg) =>
  z.preprocess((value) => (value == null ? "" : value), z.string().min(1, msg));

// NumberInput controlado: vacío es `""` o `null`; si no, un number.
const numberField = (schema) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    schema,
  );

export const MARCA_SCHEMA = z.object({
  nombre: z.string().trim().min(1, "Debes ingresar el nombre"),
});

export const MARCA_INITIAL_VALUES = {
  nombre: "",
};

/**
 * `anio` — el backend no expone un rango explícito en el DTO, pero un modelo
 * de vehículo no puede ser de un año "inexistente": se acota a `[1900,
 * añoActual + 1]` (tolera modelos del año próximo, como hace la industria
 * automotriz) igual que `anioCompra` en `vehiculos/constants/schema.js`.
 */
export const MODELO_SCHEMA = z.object({
  nombre: z.string().trim().min(1, "Debes ingresar el nombre"),
  marcaID: requiredSelect("Debes seleccionar una marca"),
  anio: numberField(
    z
      .number({ error: "Debes ingresar el año" })
      .int("El año debe ser un número entero")
      .gte(1900, "El año debe ser mayor a 1900")
      .lte(currentYear + 1, `El año no puede ser mayor a ${currentYear + 1}`),
  ),
});

export const MODELO_INITIAL_VALUES = {
  nombre: "",
  marcaID: null,
  anio: currentYear,
};
