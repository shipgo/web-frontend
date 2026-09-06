import { z } from "zod";

/**
 * Validación de los formularios de recuperación de cuenta, alineada a los DTOs
 * del backend (`MailFormReq`, `ChangePasswordTokenForm`, `ChangePasswordForm`).
 * Se consume con `schemaResolver(SCHEMA, { sync: true })` — el resolver nativo de
 * `@mantine/form`, mismo patrón que `USUARIO_SCHEMA` / `CREAR_ENVIO_SCHEMA`.
 */

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// El backend guarda el hash sin límites explícitos; pedimos un mínimo razonable
// del lado del cliente para evitar reset a contraseñas triviales.
export const PASSWORD_MIN = 8;

/** Paso 1 de "olvidé mi contraseña": sólo el email. */
export const RECUPERAR_EMAIL_SCHEMA = z.object({
  userEmail: z
    .string()
    .trim()
    .min(1, "Ingresá tu email")
    .refine((v) => EMAIL_RE.test(v), "El email no es válido"),
});

export const RECUPERAR_EMAIL_INITIAL_VALUES = { userEmail: "" };

/** Paso 2: nueva contraseña + confirmación (el token viaja por la URL). */
export const NUEVA_PASSWORD_SCHEMA = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`),
    confirmPassword: z.string().min(1, "Repetí la contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export const NUEVA_PASSWORD_INITIAL_VALUES = {
  newPassword: "",
  confirmPassword: "",
};
