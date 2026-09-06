import { createFormContext } from "@mantine/form";

/**
 * Contexto de formulario compartido entre `CrearVehiculo` y `EditarVehiculo`
 * (mismo patrón que `CrearEnvioContext` / `EnviosFormContext`): el schema Zod y
 * los `initialValues` viven en `../constants/schema`, y cada pantalla monta el
 * `useForm` una sola vez y lo provee vía `VehiculoFormProvider`.
 */
export const [VehiculoFormProvider, useVehiculoFormContext, useVehiculoForm] =
  createFormContext();
