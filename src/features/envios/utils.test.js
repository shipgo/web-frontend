import { describe, expect, it } from "vitest";

import { buildEnvioReqDTO } from "./utils";

describe("buildEnvioReqDTO", () => {
  const baseValues = {
    nombre: "Juan",
    apellido: "García",
    emailRemitente: "remitente@test.com",
    emailReceptor: "receptor@test.com",
    prefijo: "351",
    telefono: "1234567",
    nombreCalle: "Av. Colón",
    numeroCalle: "1234",
    localidadID: "5",
    detalleEnvios: [
      { categoriaID: "1", descripcion: "Sobre", peso: "0.5" },
    ],
  };

  it("arma el payload anidado (CrearEnvios): categoria/localidad como { id }, sin ids de destino/paquete", () => {
    const values = { ...baseValues, coordenadas: { lat: -31.4, lng: -64.18 } };

    expect(buildEnvioReqDTO(values)).toEqual({
      nombre: "Juan",
      apellido: "García",
      emailRemitente: "remitente@test.com",
      emailReceptor: "receptor@test.com",
      prefijo: "351",
      telefono: "1234567",
      destino: {
        nombreCalle: "Av. Colón",
        numeroCalle: "1234",
        localidad: { id: 5 },
        latitud: -31.4,
        longitud: -64.18,
      },
      detalleEnvios: [
        { categoria: { id: 1 }, descripcion: "Sobre", peso: 0.5 },
      ],
    });
  });

  it("reenvía el id del destino y de cada paquete existente (EditarEnvio)", () => {
    const values = {
      ...baseValues,
      detalleEnvios: [
        { id: 11, categoriaID: "1", descripcion: "Sobre", peso: "0.5" },
        { categoriaID: "2", descripcion: "", peso: "2" },
      ],
    };

    const payload = buildEnvioReqDTO(values, {
      id: 3,
      latitud: -31.4,
      longitud: -64.18,
    });

    expect(payload.destino).toEqual({
      id: 3,
      nombreCalle: "Av. Colón",
      numeroCalle: "1234",
      localidad: { id: 5 },
      latitud: -31.4,
      longitud: -64.18,
    });
    expect(payload.detalleEnvios).toEqual([
      { id: 11, categoria: { id: 1 }, descripcion: "Sobre", peso: 0.5 },
      { categoria: { id: 2 }, descripcion: null, peso: 2 },
    ]);
  });

  it("descripción vacía se manda como null (no string vacío)", () => {
    const values = { ...baseValues, coordenadas: { lat: 0, lng: 0 } };
    values.detalleEnvios = [{ categoriaID: "1", descripcion: "", peso: "1" }];

    expect(buildEnvioReqDTO(values).detalleEnvios[0].descripcion).toBeNull();
  });
});
