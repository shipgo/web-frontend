import { describe, it, expect } from "vitest";

import { buildEnviosPuntoEntrega, buildViajeReqDTO } from "./utils";

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

describe("buildViajeReqDTO", () => {
  it("arma el ViajeReqDTO completo: solo fechas planificadas, sin fechas reales", () => {
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
    expect(dto.viaje.fechaHoraInicioPlanificada).toBe(
      new Date("2026-09-10T08:00:00").toISOString(),
    );
    expect(dto.viaje.fechaHoraFinPlanificada).toBe(
      new Date("2026-09-10T18:00:00").toISOString(),
    );
    expect(dto.enviosPuntoEntrega).toEqual([
      { enviosID: [1], puntoEntregaID: 5, sucursalDestinoID: null },
    ]);
  });
});
