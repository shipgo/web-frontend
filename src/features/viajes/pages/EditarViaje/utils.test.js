import { describe, it, expect } from "vitest";

import { getChoferesDeViaje } from "./utils";

const A = { id: 1, nombre: "Ana" };
const B = { id: 2, nombre: "Beto" };

describe("getChoferesDeViaje (SHG-FE-106)", () => {
  it("devuelve la lista cuando hay 2 o más choferes", () => {
    expect(getChoferesDeViaje({ choferes: [A, B] })).toEqual([A, B]);
  });

  it("con `choferes: []` y `chofer` singular, usa el singular", () => {
    expect(getChoferesDeViaje({ choferes: [], chofer: A })).toEqual([A]);
  });

  it("con sólo `chofer` singular, devuelve una lista de uno", () => {
    expect(getChoferesDeViaje({ chofer: A })).toEqual([A]);
  });

  it("sin choferes devuelve []", () => {
    expect(getChoferesDeViaje({})).toEqual([]);
    expect(getChoferesDeViaje(null)).toEqual([]);
  });

  it("con ambos presentes no duplica: gana la lista", () => {
    expect(getChoferesDeViaje({ choferes: [A], chofer: A })).toEqual([A]);
  });
});
