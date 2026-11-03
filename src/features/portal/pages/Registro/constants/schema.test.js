import { describe, expect, it } from "vitest";

import { REGISTRO_SCHEMA, PASSWORD_MIN } from "./schema";

const VALID = {
  nombre: "Carla",
  apellido: "Cliente",
  email: "carla@mail.com",
  telefono: "3511234567",
  password: "unclave123",
};

describe("REGISTRO_SCHEMA", () => {
  it("acepta un registro con todos los campos de RegisterReqDTO", () => {
    expect(REGISTRO_SCHEMA.safeParse(VALID).success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const r = REGISTRO_SCHEMA.safeParse({ ...VALID, email: "no-es-email" });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toEqual(["email"]);
  });

  it(`rechaza password con menos de ${PASSWORD_MIN} caracteres`, () => {
    const r = REGISTRO_SCHEMA.safeParse({ ...VALID, password: "1234567" });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toEqual(["password"]);
  });

  it("acepta password de exactamente el mínimo", () => {
    const r = REGISTRO_SCHEMA.safeParse({ ...VALID, password: "a".repeat(PASSWORD_MIN) });
    expect(r.success).toBe(true);
  });

  it("rechaza nombre / apellido / teléfono vacíos", () => {
    expect(REGISTRO_SCHEMA.safeParse({ ...VALID, nombre: "  " }).success).toBe(false);
    expect(REGISTRO_SCHEMA.safeParse({ ...VALID, apellido: "" }).success).toBe(false);
    expect(REGISTRO_SCHEMA.safeParse({ ...VALID, telefono: "" }).success).toBe(false);
  });
});
