import { z } from "zod";

/**
 * Validación de `VehiculoForm` (crear / editar). Migrada 1:1 desde el objeto
 * `validate: {...}` manual que vivía duplicado en `CrearVehiculo` y
 * `EditarVehiculo`, para alinear con el patrón canónico de `CrearEnvios`
 * (`schemaResolver` + Zod).
 *
 * Reglas alineadas con `VehiculoReqDTO` (backend, `SHG-BE-008`/`SHG-BE-040`):
 * - `anioCompra` (Long) — `@Min(1900)`.
 * - `kilometraje` (Integer) — `@Min(0)`.
 * - `cantidadRuedas` (Integer) — `@Min(2)` a nivel de Bean Validation (piso
 *   físico), pero el mínimo REAL depende de la categoría del `tipoVehiculo`
 *   elegido y se valida server-side en `VehiculoService`, no en el DTO:
 *   `moto` → exactamente 2, cualquier otra categoría (incluido un
 *   `TipoVehiculo` legacy sin `categoria`) → `>= 4`. Se replica esa misma
 *   regla acá (ver `superRefine` más abajo) para dar un mensaje claro antes
 *   de pegarle al backend.
 * - `pesoMaximo` (Double) — `@DecimalMin("0.0")` (el front exige `> 0`).
 * - `consumoPromedio` (Double) — `@DecimalMin("0.1")`.
 */

/** Valores posibles de `TipoVehiculoDTO.categoria` (`SHG-BE-040`). */
export const CATEGORIA_VEHICULO = {
  MOTO: "moto",
  AUTOMOTOR: "automotor",
};

/**
 * Mapa `tipoVehiculoID (string) -> categoria` del catálogo `GET
 * /api/tipoVehiculo/all`, cargado en runtime por `VehiculoForm` (el schema se
 * define una sola vez al importar el módulo, antes de que el catálogo esté
 * disponible). El `superRefine` de abajo lee el valor *actual* de esta
 * variable en cada validación, no el que había al definir el schema — por
 * eso alcanza con mutarla vía `setCategoriaPorTipoVehiculoId`.
 */
let categoriaPorTipoVehiculoId = {};

/** Sincroniza el mapa de categorías (lo llama `VehiculoForm` al cargar el catálogo). */
export const setCategoriaPorTipoVehiculoId = (mapa) => {
  categoriaPorTipoVehiculoId = mapa || {};
};

/** Sólo para tests: vuelve el mapa a su estado inicial (vacío). */
export const resetCategoriaPorTipoVehiculoId = () => {
  categoriaPorTipoVehiculoId = {};
};

/**
 * Cantidad de ruedas exigida por categoría, igual que `VehiculoService`
 * (backend): moto = exactamente 2; cualquier otra (o sin categoría
 * reconocida) = mínimo 4.
 * @param {string|undefined} categoria
 */
export const cantidadRuedasValidaParaCategoria = (categoria, cantidadRuedas) =>
  categoria === CATEGORIA_VEHICULO.MOTO
    ? cantidadRuedas === 2
    : cantidadRuedas >= 4;

/** Mensaje de error a mostrar según la categoría del tipo de vehículo elegido. */
export const cantidadRuedasErrorMessage = (categoria) =>
  categoria === CATEGORIA_VEHICULO.MOTO
    ? "Una moto debe tener exactamente 2 ruedas"
    : "La cantidad de ruedas debe ser al menos 4 (salvo motos)";

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

export const VEHICULO_SCHEMA = z
  .object({
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
    // Piso físico (`@Min(2)` de `VehiculoReqDTO`, `SHG-BE-040`) — la regla
    // real por categoría se aplica abajo, en el `superRefine`.
    cantidadRuedas: numberField(
      z
        .number({ error: "El campo cantidad de ruedas no puede estar vacío" })
        .gte(2, "La cantidad de ruedas debe ser al menos 2"),
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
  })
  .superRefine((data, ctx) => {
    // Sólo evalúa la regla por categoría si `cantidadRuedas` ya es un número
    // válido (si no, el error "no puede estar vacío" de arriba ya alcanza).
    if (typeof data.cantidadRuedas !== "number") return;

    const categoria = categoriaPorTipoVehiculoId[data.tipoVehiculoID];
    if (!cantidadRuedasValidaParaCategoria(categoria, data.cantidadRuedas)) {
      ctx.addIssue({
        code: "custom",
        path: ["cantidadRuedas"],
        message: cantidadRuedasErrorMessage(categoria),
      });
    }
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
