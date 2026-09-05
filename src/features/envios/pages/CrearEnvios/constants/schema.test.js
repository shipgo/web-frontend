import { describe, expect, it } from "vitest";

import { CREAR_ENVIO_SCHEMA, PAQUETE_SCHEMA } from "./schema";

const VALID_ENVIO = {
  nombre: "Juan",
  apellido: "García",
  emailRemitente: "remitente@test.com",
  emailReceptor: "receptor@test.com",
  prefijo: "351",
  telefono: "1234567",
  nombreCalle: "Av. Colón",
  numeroCalle: "1234",
  provinciaID: "2",
  localidadID: "5",
  coordenadas: { lat: -31.4, lng: -64.18 },
  detalleEnvios: [{ categoriaID: "1", peso: "2", descripcion: "" }],
};

describe("CREAR_ENVIO_SCHEMA", () => {
  it("acepta un envío con todos los campos requeridos por EnvioReqDTO", () => {
    const result = CREAR_ENVIO_SCHEMA.safeParse(VALID_ENVIO);
    expect(result.success).toBe(true);
  });

  it("rechaza sin al menos un paquete", () => {
    const result = CREAR_ENVIO_SCHEMA.safeParse({
      ...VALID_ENVIO,
      detalleEnvios: [],
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["detalleEnvios"]);
  });

  it("rechaza sin coordenadas geocodificadas", () => {
    const result = CREAR_ENVIO_SCHEMA.safeParse({
      ...VALID_ENVIO,
      coordenadas: null,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["coordenadas"]);
  });

  it("rechaza sin provincia ni localidad seleccionadas", () => {
    const sinProvincia = CREAR_ENVIO_SCHEMA.safeParse({
      ...VALID_ENVIO,
      provinciaID: "",
    });
    const sinLocalidad = CREAR_ENVIO_SCHEMA.safeParse({
      ...VALID_ENVIO,
      localidadID: "",
    });
    expect(sinProvincia.success).toBe(false);
    expect(sinLocalidad.success).toBe(false);
  });

  it("rechaza emails inválidos", () => {
    const result = CREAR_ENVIO_SCHEMA.safeParse({
      ...VALID_ENVIO,
      emailRemitente: "no-es-un-email",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["emailRemitente"]);
  });

  it("permite numeroCalle vacío (direcciones sin número)", () => {
    const result = CREAR_ENVIO_SCHEMA.safeParse({
      ...VALID_ENVIO,
      numeroCalle: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("PAQUETE_SCHEMA", () => {
  it("acepta un paquete válido sin descripción", () => {
    const result = PAQUETE_SCHEMA.safeParse({ categoriaID: "1", peso: "3.5" });
    expect(result.success).toBe(true);
  });

  it("rechaza sin categoría", () => {
    const result = PAQUETE_SCHEMA.safeParse({ categoriaID: "", peso: "3.5" });
    expect(result.success).toBe(false);
  });

  it("rechaza peso <= 0", () => {
    const result = PAQUETE_SCHEMA.safeParse({ categoriaID: "1", peso: "0" });
    expect(result.success).toBe(false);
  });

  it("rechaza peso no numérico", () => {
    const result = PAQUETE_SCHEMA.safeParse({ categoriaID: "1", peso: "abc" });
    expect(result.success).toBe(false);
  });
});
