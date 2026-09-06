import { describe, expect, it } from "vitest";

import { USUARIO_INITIAL_VALUES, USUARIO_SCHEMA } from "./schema";

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
  prefijo: "+54",
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
    expect(e.username).toBe("El campo username no puede estar vacío");
    expect(e.nombre).toBe("El campo nombre no puede estar vacío");
    expect(e.apellido).toBe("El campo apellido no puede estar vacío");
    expect(e.fechaNacimiento).toBe(
      "El campo fecha de nacimiento no puede estar vacío",
    );
    expect(e.prefijo).toBe("El campo prefijo no puede estar vacío");
    expect(e.telefono).toBe("El campo teléfono no puede estar vacío");
    expect(e.nombreCalle).toBe("El campo nombre de calle no puede estar vacío");
    expect(e.numeroCalle).toBe("El campo número de calle no puede estar vacío");
    expect(e.email).toBe("El campo email no puede estar vacío");
    expect(e.authorities).toBe("Debe seleccionar al menos un rol");
    expect(e.dni).toBe("El campo DNI no puede estar vacío");
    expect(e.tipoDocumentoID).toBe("Debe seleccionar un tipo de documento");
    expect(e.sexoID).toBe("Debe seleccionar un sexo");
    expect(e.localidadID).toBe("Debe seleccionar una localidad");
  });

  it("valida el formato del email", () => {
    expect(errores({ ...VALID, email: "no-es-un-email" }).email).toBe(
      "El email no es válido",
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
