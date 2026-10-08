import { z } from "zod";

import {
  nombreRequerido,
  prefijoRequerido,
  telefonoRequerido,
  textoOpcional,
  textoRequerido,
} from "@domain/validation";

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
 *
 * `email` es OPCIONAL: `SHG-BE-008` sacó el `@NotEmpty` de `SucursalReqDTO` y dejó
 * sólo `@Email` (formato, tolera vacío). Se valida el formato únicamente cuando se
 * informa un valor.
 */
export const SUCURSAL_SCHEMA = z.object({
  nombre: nombreRequerido("Ingresá el nombre"),
  email: textoOpcional()
    .refine(
      (value) => value === "" || /^\S+@\S+\.\S+$/.test(value),
      "El email no es válido"
    ),
  prefijo: prefijoRequerido("Ingresá el prefijo"),
  telefono: telefonoRequerido("Ingresá el teléfono"),
  nombreCalle: textoRequerido("Ingresá la calle"),
  numeroCalle: textoRequerido("Ingresá el número"),
  provinciaID: z
    .string()
    .min(1, "Seleccioná una provincia")
    .nullable()
    .refine((value) => !!value, "Seleccioná una provincia"),
  localidadID: z
    .string()
    .min(1, "Seleccioná una localidad")
    .nullable()
    .refine((value) => !!value, "Seleccioná una localidad"),
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
