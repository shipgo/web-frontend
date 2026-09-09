import { describe, expect, it } from "vitest";

import {
  ESTADO_ENVIO,
  ESTADO_RECORRIDO,
  ESTADO_VEHICULO,
  ESTADO_VIAJE,
  ESTADOS_TERMINALES,
  esEstadoTerminal,
  estadoBadge,
  estadoLabel,
  estadoOptions,
  normalizarEstado,
} from "./estados";

describe("mapas de estado canónicos", () => {
  it("usan el valor snake_case del backend como clave", () => {
    expect(Object.keys(ESTADO_ENVIO)).toContain("en_sucursal");
    expect(Object.keys(ESTADO_VIAJE)).toContain("en_proceso_de_carga");
    expect(Object.keys(ESTADO_RECORRIDO)).toContain("finalizado_con_problemas");
    expect(Object.keys(ESTADO_VEHICULO)).toContain("fuera_de_servicio");
  });

  it("cada entrada tiene label y color", () => {
    for (const mapa of [ESTADO_ENVIO, ESTADO_VIAJE, ESTADO_RECORRIDO, ESTADO_VEHICULO]) {
      for (const meta of Object.values(mapa)) {
        expect(meta).toHaveProperty("label");
        expect(meta).toHaveProperty("color");
      }
    }
  });
});

describe("normalizarEstado", () => {
  it("pasa a snake_case en minúsculas", () => {
    expect(normalizarEstado("EN_CAMINO")).toBe("en_camino");
    expect(normalizarEstado("En Camino")).toBe("en_camino");
    expect(normalizarEstado("  en_sucursal ")).toBe("en_sucursal");
  });

  it("deja pasar valores no-string", () => {
    expect(normalizarEstado(null)).toBeNull();
    expect(normalizarEstado(undefined)).toBeUndefined();
  });
});

describe("estadoBadge", () => {
  it("resuelve label y color de un valor canónico", () => {
    expect(estadoBadge("envio", "en_camino")).toEqual({
      label: "En camino",
      color: "orange",
      // Ajuste de contraste del variant `light` de Badge (SHG-FE-041) — ver
      // `BADGE_TEXT_CONTRAST_OVERRIDE` en estados.js.
      textColor: "#99350a",
    });
    expect(estadoBadge("viaje", "con_problemas")).toEqual({
      label: "Con problemas",
      color: "red",
    });
  });

  it("acepta labels históricos en mayúsculas / con espacios", () => {
    expect(estadoBadge("envio", "EN_CAMINO").label).toBe("En camino");
    expect(estadoBadge("vehiculo", "Fuera De Servicio").color).toBe("red");
  });

  it("hace fallback gris usando el valor crudo para estados desconocidos", () => {
    expect(estadoBadge("envio", "teletransportado")).toEqual({
      label: "teletransportado",
      color: "gray",
    });
  });

  it("hace fallback para una entidad desconocida", () => {
    expect(estadoBadge("marciano", "x")).toEqual({ label: "x", color: "gray" });
  });

  it("tolera valor nulo", () => {
    expect(estadoBadge("envio", null)).toEqual({ label: "—", color: "gray" });
  });
});

describe("estadoLabel / estadoOptions", () => {
  it("estadoLabel devuelve sólo el texto", () => {
    expect(estadoLabel("viaje", "planificado")).toBe("Planificado");
  });

  it("estadoOptions devuelve value canónico + label", () => {
    const opciones = estadoOptions("recorrido");
    expect(opciones).toContainEqual({ value: "en_camino", label: "En camino" });
    expect(estadoOptions("marciano")).toEqual([]);
  });
});

describe("esEstadoTerminal", () => {
  it("las claves de ESTADOS_TERMINALES existen en su mapa de estados", () => {
    expect(ESTADOS_TERMINALES.envio.every((v) => v in ESTADO_ENVIO)).toBe(true);
    expect(ESTADOS_TERMINALES.viaje.every((v) => v in ESTADO_VIAJE)).toBe(true);
    expect(ESTADOS_TERMINALES.recorrido.every((v) => v in ESTADO_RECORRIDO)).toBe(true);
  });

  it("true para estados terminales de envío", () => {
    expect(esEstadoTerminal("envio", "entregado")).toBe(true);
    expect(esEstadoTerminal("envio", "rechazado")).toBe(true);
    expect(esEstadoTerminal("envio", "ENTREGADO")).toBe(true);
  });

  it("false para estados en curso o desconocidos", () => {
    expect(esEstadoTerminal("envio", "en_camino")).toBe(false);
    expect(esEstadoTerminal("envio", "creado")).toBe(false);
    expect(esEstadoTerminal("envio", null)).toBe(false);
    expect(esEstadoTerminal("envio", "lo_que_sea")).toBe(false);
  });

  it("cubre viaje y recorrido, y vehículo no tiene terminales", () => {
    expect(esEstadoTerminal("viaje", "finalizado")).toBe(true);
    expect(esEstadoTerminal("viaje", "cancelado")).toBe(true);
    expect(esEstadoTerminal("viaje", "en_camino")).toBe(false);
    expect(esEstadoTerminal("recorrido", "finalizado_con_problemas")).toBe(true);
    expect(esEstadoTerminal("vehiculo", "fuera_de_servicio")).toBe(false);
  });

  it("entidad desconocida => false", () => {
    expect(esEstadoTerminal("marciano", "x")).toBe(false);
  });
});
