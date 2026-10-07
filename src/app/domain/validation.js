import { z } from 'zod';

/**
 * Reglas de validación COMPARTIDAS por los formularios (SHG-FE-107).
 *
 * El backend todavía no fija largos (SHG-BE-086 dice "numéricos con largo
 * acotado" sin números; ni los DTOs ni `CONTRACTS.md` los definen), así que se
 * eligió una regla conservadora que no rechaza números argentinos reales:
 *
 * - `prefijo` (característica): sólo dígitos, 2 a 5 (11, 351, 2965, ...).
 * - `telefono`: sólo dígitos, 6 a 15. El piso cubre el abonado local (6-8) y el
 *   techo el número completo con característica (registro) y E.164 (15).
 * - Texto: `NOMBRE_MAX` para nombre/apellido y `TEXTO_MAX` para el resto; los
 *   campos `String` de las entidades son `varchar(255)`, y pasarse termina en un
 *   500 del backend (ej. un nombre de 300 caracteres en `/portal/perfil`).
 *
 * Cuando el backend fije otros largos hay que tocar sólo este archivo.
 */

export const PREFIJO_MIN = 2;
export const PREFIJO_MAX = 5;
export const TELEFONO_MIN = 6;
export const TELEFONO_MAX = 15;
export const NOMBRE_MAX = 100;
export const TEXTO_MAX = 255;
export const PASSWORD_MIN = 8;

const SOLO_DIGITOS = /^\d+$/;

/** Mensaje "X no puede superar N caracteres". */
const maxMsg = (max) => `No puede superar los ${max} caracteres`;

/**
 * Texto obligatorio (con `trim`) y largo acotado.
 * @param {string} requiredMsg
 * @param {number} [max]
 */
export const textoRequerido = (requiredMsg, max = TEXTO_MAX) =>
  z.string().trim().min(1, requiredMsg).max(max, maxMsg(max));

/** Texto opcional (puede venir vacío) con largo acotado. */
export const textoOpcional = (max = TEXTO_MAX) =>
  z.string().trim().max(max, maxMsg(max));

/** Nombre/apellido obligatorio. */
export const nombreRequerido = (requiredMsg) =>
  textoRequerido(requiredMsg, NOMBRE_MAX);

const digitos = (requiredMsg, label, min, max) =>
  z
    .string()
    .trim()
    .min(1, requiredMsg)
    .regex(SOLO_DIGITOS, `${label} sólo puede tener números`)
    .min(min, `${label} debe tener al menos ${min} dígitos`)
    .max(max, `${label} no puede tener más de ${max} dígitos`);

/** Prefijo telefónico obligatorio: sólo dígitos, `PREFIJO_MIN`..`PREFIJO_MAX`. */
export const prefijoRequerido = (requiredMsg = 'El prefijo es requerido') =>
  digitos(requiredMsg, 'El prefijo', PREFIJO_MIN, PREFIJO_MAX);

/** Teléfono obligatorio: sólo dígitos, `TELEFONO_MIN`..`TELEFONO_MAX`. */
export const telefonoRequerido = (requiredMsg = 'El teléfono es requerido') =>
  digitos(requiredMsg, 'El teléfono', TELEFONO_MIN, TELEFONO_MAX);

/** Email obligatorio: vacío → "requerido", mal formado → "inválido". */
export const emailRequerido = (
  requiredMsg = 'El email es requerido',
  invalidMsg = 'Email inválido',
) =>
  z
    .string()
    .trim()
    .min(1, requiredMsg)
    .max(TEXTO_MAX, maxMsg(TEXTO_MAX))
    .pipe(z.email(invalidMsg));
