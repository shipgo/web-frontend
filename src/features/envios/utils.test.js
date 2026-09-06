import { describe, expect, it } from "vitest";

import { buildEnvioFormValues, buildEnvioReqDTO } from "./utils";

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

describe("buildEnvioFormValues", () => {
  const ENVIO = {
    id: 9,
    nombre: "Juan",
    apellido: "García",
    emailRemitente: "remitente@test.com",
    emailReceptor: "receptor@test.com",
    prefijo: "351",
    telefono: "1234567",
    estado: "creado",
    destino: {
      id: 3,
      nombreCalle: "Av. Colón",
      numeroCalle: "1234",
      latitud: -31.4,
      longitud: -64.18,
      localidad: {
        id: 5,
        nombre: "Córdoba",
        provincia: { id: 2, nombre: "Córdoba" },
      },
    },
    detalleEnvios: [
      { id: 11, categoria: { id: 1, nombre: "Documentación" }, descripcion: "Sobre", peso: 0.5 },
    ],
  };

  it("mapea el EnvioDTO al shape de los values del form (provincia/localidad como string, coordenadas)", () => {
    expect(buildEnvioFormValues(ENVIO)).toEqual({
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
      detalleEnvios: [
        { id: 11, categoriaID: "1", descripcion: "Sobre", peso: 0.5 },
      ],
    });
  });

  it("el resultado round-trips a buildEnvioReqDTO conservando ids de destino y paquetes", () => {
    const values = buildEnvioFormValues(ENVIO);
    const payload = buildEnvioReqDTO(values, { id: ENVIO.destino.id });

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
    ]);
  });

  it("tolera un envío sin destino/localidad/paquetes", () => {
    expect(buildEnvioFormValues({ nombre: "Ana" })).toEqual({
      nombre: "Ana",
      apellido: "",
      emailRemitente: "",
      emailReceptor: "",
      prefijo: "",
      telefono: "",
      nombreCalle: "",
      numeroCalle: "",
      provinciaID: "",
      localidadID: "",
      coordenadas: null,
      detalleEnvios: [],
    });
  });
});
