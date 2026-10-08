import { nombreRequerido } from "@domain/validation";
import {
  SUCURSAL_SCHEMA,
  SUCURSAL_INITIAL_VALUES,
} from "@features/sucursales/constants/schema";

/**
 * Validación del onboarding de empresa (SHG-FE-116): `EmpresaReqDTO { nombre,
 * sucursal }`. El form es plano: el nombre de la empresa va en `empresaNombre`
 * (para no chocar con `nombre`, que es el de la sucursal) y el resto reutiliza
 * las reglas de `SUCURSAL_SCHEMA` (teléfono/prefijo sólo dígitos, largos, dirección).
 */
export const EMPRESA_ONBOARDING_SCHEMA = SUCURSAL_SCHEMA.extend({
  empresaNombre: nombreRequerido("Ingresá el nombre de la empresa"),
});

export const EMPRESA_ONBOARDING_INITIAL_VALUES = {
  empresaNombre: "",
  ...SUCURSAL_INITIAL_VALUES,
};

/** Arma el `EmpresaReqDTO` a partir de los valores del form. */
export const buildEmpresaReqDTO = (values) => ({
  nombre: values.empresaNombre.trim(),
  sucursal: {
    nombre: values.nombre,
    // `email` es opcional: `null` en vez de "" (igual que `CrearSucursal`).
    email: values.email?.trim() || null,
    prefijo: values.prefijo,
    telefono: values.telefono,
    puntoEntrega: {
      numeroCalle: values.numeroCalle,
      nombreCalle: values.nombreCalle,
      localidadID: parseInt(values.localidadID),
    },
  },
});

/**
 * Los `field` del backend para el body anidado son `nombre` (empresa),
 * `sucursal.nombre`, `sucursal.puntoEntrega.nombreCalle`, ... Como `nombre` y
 * `sucursal.nombre` colisionarían al pelar el prefijo, el `nombre` de la empresa
 * se renombra a `empresaNombre` antes de pasar el error a `applyApiError`.
 */
export const remapEmpresaFieldErrors = (error) => {
  const data = error?.response?.data;
  if (!data || !Array.isArray(data.fields)) return error;
  return {
    ...error,
    response: {
      ...error.response,
      data: {
        ...data,
        fields: data.fields.map((item) =>
          item?.field === "nombre" ? { ...item, field: "empresaNombre" } : item,
        ),
      },
    },
  };
};
