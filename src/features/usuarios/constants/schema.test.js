import { describe, expect, it } from "vitest";

import { USUARIO_INITIAL_VALUES, USUARIO_SCHEMA, buildUsuarioValidate } from "./schema";

const errores = (values) => {
  const result = USUARIO_SCHEMA.safeParse(values);
  if (result.success) return {};
  // Igual que `schemaResolver`: la primera issue por path gana.
  const acc = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!(path in acc)) acc[path] = issue.message;
  }
  return acc;
};

const VALID = {
  ...USUARIO_INITIAL_VALUES,
  username: "jperez",
  nombre: "Juan",
  apellido: "Pérez",
  fechaNacimiento: "2000-09-15",
  prefijo: "11",
  telefono: "1122334455",
  nombreCalle: "Av. Siempreviva",
  numeroCalle: "742",
  email: "juan@example.com",
  authorities: ["ROLE_ADMIN"],
  dni: "30111222",
  tipoDocumentoID: "1",
  sexoID: "1",
  localidadID: "5",
  provinciaID: "2",
};

describe("USUARIO_SCHEMA", () => {
  it("acepta un usuario completo y válido", () => {
    expect(USUARIO_SCHEMA.safeParse(VALID).success).toBe(true);
  });

  it("reporta cada campo requerido vacío con el mismo mensaje que el validate manual anterior", () => {
    const e = errores(USUARIO_INITIAL_VALUES);
    expect(e.username).toBe("Ingresá el usuario.");
    expect(e.nombre).toBe("Ingresá el nombre.");
    expect(e.apellido).toBe("Ingresá el apellido.");
    expect(e.fechaNacimiento).toBe(
      "Elegí la fecha de nacimiento.",
    );
    expect(e.prefijo).toBe("Ingresá el prefijo.");
    expect(e.telefono).toBe("Ingresá el teléfono.");
    expect(e.nombreCalle).toBe("Ingresá el nombre de la calle.");
    expect(e.numeroCalle).toBe("Ingresá el número de la calle.");
    expect(e.email).toBe("Ingresá el email.");
    expect(e.authorities).toBe("Elegí al menos un rol.");
    expect(e.dni).toBe("Ingresá el DNI.");
    expect(e.tipoDocumentoID).toBe("Elegí un tipo de documento.");
    expect(e.sexoID).toBe("Elegí un sexo.");
    expect(e.localidadID).toBe("Elegí una localidad.");
  });

  it("valida el formato del email", () => {
    expect(errores({ ...VALID, email: "no-es-un-email" }).email).toBe(
      "Ingresá un email válido.",
    );
  });

  it("acepta fechaNacimiento como Date además de string (compat DateInput / preload)", () => {
    expect(
      USUARIO_SCHEMA.safeParse({
        ...VALID,
        fechaNacimiento: new Date(2000, 8, 15),
      }).success,
    ).toBe(true);
  });

  it("no exige provinciaID ni sucursalID (no viajan en UserReqDTO)", () => {
    const e = errores(USUARIO_INITIAL_VALUES);
    expect(e.provinciaID).toBeUndefined();
    expect(e.sucursalID).toBeUndefined();
  });
});

describe("buildUsuarioValidate (SHG-FE-116: sucursal obligatoria para SUPERUSER, crear y editar)", () => {
  it("SUPERUSER sin sucursal → error en sucursalID", () => {
    const errors = buildUsuarioValidate(true)({ ...USUARIO_INITIAL_VALUES, sucursalID: null });
    expect(errors.sucursalID).toBe("Elegí una sucursal.");
  });

  it("SUPERUSER con sucursal → sin error de sucursalID", () => {
    const errors = buildUsuarioValidate(true)({ ...USUARIO_INITIAL_VALUES, sucursalID: "3" });
    expect(errors.sucursalID).toBeUndefined();
  });

  it("ADMIN no elige sucursal → sin error de sucursalID", () => {
    const errors = buildUsuarioValidate(false)({ ...USUARIO_INITIAL_VALUES, sucursalID: null });
    expect(errors.sucursalID).toBeUndefined();
  });
});
