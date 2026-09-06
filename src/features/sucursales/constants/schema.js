import { z } from "zod";

/**
 * Validación de `SucursalForm` (crear/editar) con Zod + `schemaResolver` nativo de
 * `@mantine/form`, alineado al patrón canónico de `CrearEnvios`/`CrearViaje`.
 *
 * Reemplaza el objeto `validate: {...}` manual que estaba duplicado en
 * `CrearSucursal/index.jsx` y `EditarSucursal/index.jsx`. NO cambia la forma del
 * payload (`puntoEntrega` anidado) — eso es alcance de `SHG-FE-019`.
 *
 * `provinciaID`/`localidadID` viajan como string (id del `Select`) o `null` cuando
 * no hay selección — por eso el `.nullable().refine(...)` en vez de sólo `.min(1)`.
 */
export const SUCURSAL_SCHEMA = z.object({
  nombre: z.string().trim().min(1, "Debes ingresar el nombre"),
  email: z.email("El email no es válido"),
  prefijo: z.string().trim().min(1, "Debes ingresar el prefijo"),
  telefono: z.string().trim().min(1, "Debes ingresar el teléfono"),
  nombreCalle: z.string().trim().min(1, "Debes ingresar la calle"),
  numeroCalle: z.string().trim().min(1, "Debes ingresar el número"),
  provinciaID: z
    .string()
    .min(1, "Debes seleccionar una provincia")
    .nullable()
    .refine((value) => !!value, "Debes seleccionar una provincia"),
  localidadID: z
    .string()
    .min(1, "Debes seleccionar una localidad")
    .nullable()
    .refine((value) => !!value, "Debes seleccionar una localidad"),
});

export const SUCURSAL_INITIAL_VALUES = {
  nombre: "",
  email: "",
  prefijo: "",
  telefono: "",
  nombreCalle: "",
  numeroCalle: "",
  provinciaID: null,
  localidadID: null,
};
