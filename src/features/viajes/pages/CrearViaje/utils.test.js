import { describe, it, expect } from "vitest";

import {
  buildEnviosPuntoEntrega,
  buildViajeReqDTO,
  toLocalDateTimeString,
} from "./utils";

// Formato que acepta `LocalDateTime.parse` en el backend (Jackson,
// `DateTimeFormatter.ISO_LOCAL_DATE_TIME`): sin offset/zona ni milisegundos.
// `dayjs(...).toISOString()` NO cumple esto (agrega "Z" + ".SSS" y convierte
// a UTC) — es justo el bug que este archivo verifica que no vuelva a pasar.
const LOCAL_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

describe("buildEnviosPuntoEntrega", () => {
  it("arma un recorrido por cada entrada, respetando el orden del Map", () => {
    const enviosIncluidos = new Map([
      [
        "local_5",
        {
          puntoEntregaID: 5,
          sucursalDestinoID: null,
          label: "Calle Falsa 123",
          packages: new Map([
            [200, { id: 200 }],
            [201, { id: 201 }],
          ]),
        },
      ],
      [
        "sucursal_7",
        {
          puntoEntregaID: null,
          sucursalDestinoID: 7,
          label: "Sucursal Sur",
          packages: new Map([[202, { id: 202 }]]),
        },
      ],
    ]);

    expect(buildEnviosPuntoEntrega(enviosIncluidos)).toEqual([
      { enviosID: [200, 201], puntoEntregaID: 5, sucursalDestinoID: null },
      { enviosID: [202], puntoEntregaID: null, sucursalDestinoID: 7 },
    ]);
  });

  it("nunca manda puntoEntregaID y sucursalDestinoID no-nulos a la vez (XOR)", () => {
    const enviosIncluidos = new Map([
      [
        "local_5",
        {
          puntoEntregaID: 5,
          sucursalDestinoID: null,
          label: "x",
          packages: new Map([[1, { id: 1 }]]),
        },
      ],
    ]);

    const [recorrido] = buildEnviosPuntoEntrega(enviosIncluidos);
    expect([recorrido.puntoEntregaID, recorrido.sucursalDestinoID].filter(
      (v) => v != null,
    )).toHaveLength(1);
  });
});

describe("toLocalDateTimeString", () => {
  it("nunca produce offset/zona (Z) ni milisegundos — LocalDateTime.parse los rechaza", () => {
    const value = toLocalDateTimeString(new Date("2026-09-10T08:00:00"));

    expect(value).toBe("2026-09-10T08:00:00");
    expect(value).toMatch(LOCAL_DATE_TIME_RE);
    expect(value).not.toMatch(/Z$/);
    expect(value).not.toContain(".");
  });

  it("manda la hora de pared elegida tal cual, sin correrla a UTC", () => {
    // Regresión del bug que reportó el revisor: `.toISOString()` convierte a
    // UTC (en AR, UTC-3) y corre "08:00 local" a "11:00Z" — acá NO debe pasar.
    const value = toLocalDateTimeString(new Date(2026, 8, 10, 8, 0, 0));
    expect(value).toBe("2026-09-10T08:00:00");
  });
});

describe("buildViajeReqDTO", () => {
  it("arma el ViajeReqDTO completo: solo fechas planificadas (formato LocalDateTime), sin fechas reales", () => {
    const values = {
      fechaHoraInicioPlanificada: new Date("2026-09-10T08:00:00"),
      fechaHoraFinPlanificada: new Date("2026-09-10T18:00:00"),
      vehiculo: { id: "3" },
      choferes: [{ id: "10" }, { id: "11" }],
      enviosIncluidos: new Map([
        [
          "local_5",
          {
            puntoEntregaID: 5,
            sucursalDestinoID: null,
            label: "x",
            packages: new Map([[1, { id: 1 }]]),
          },
        ],
      ]),
    };

    const dto = buildViajeReqDTO(values);

    expect(dto.viaje).not.toHaveProperty("fechaHoraInicio");
    expect(dto.viaje).not.toHaveProperty("fechaHoraFin");
    expect(dto.viaje.vehiculoID).toBe(3);
    expect(dto.viaje.choferesID).toEqual([10, 11]);

    // Formato LocalDateTime que acepta el backend — NO ISO-8601 con "Z".
    expect(dto.viaje.fechaHoraInicioPlanificada).toBe("2026-09-10T08:00:00");
    expect(dto.viaje.fechaHoraFinPlanificada).toBe("2026-09-10T18:00:00");
    expect(dto.viaje.fechaHoraInicioPlanificada).toMatch(LOCAL_DATE_TIME_RE);
    expect(dto.viaje.fechaHoraFinPlanificada).toMatch(LOCAL_DATE_TIME_RE);

    expect(dto.enviosPuntoEntrega).toEqual([
      { enviosID: [1], puntoEntregaID: 5, sucursalDestinoID: null },
    ]);
  });
});
