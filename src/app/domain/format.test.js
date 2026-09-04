import { describe, expect, it } from "vitest";

import {
  EMPTY,
  formatDesdeAhora,
  formatDireccion,
  formatFecha,
  formatFechaHora,
  formatPeso,
  formatTelefono,
} from "./format";

describe("formatFecha / formatFechaHora", () => {
  it("formatea en DD/MM/YYYY", () => {
    expect(formatFecha("2026-01-31")).toBe("31/01/2026");
    expect(formatFechaHora("2026-01-31T09:30:00")).toBe("31/01/2026 09:30");
  });

  it("devuelve EMPTY para fechas inválidas o nulas", () => {
    expect(formatFecha(null)).toBe(EMPTY);
    expect(formatFecha("no-es-fecha")).toBe(EMPTY);
    expect(formatFechaHora(undefined)).toBe(EMPTY);
  });
});

describe("formatDesdeAhora", () => {
  it("da un relativo en español", () => {
    const hace2Dias = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    expect(formatDesdeAhora(hace2Dias)).toMatch(/hace/i);
  });

  it("EMPTY para valor inválido", () => {
    expect(formatDesdeAhora("x")).toBe(EMPTY);
  });
});

describe("formatTelefono", () => {
  it("junta prefijo y teléfono", () => {
    expect(formatTelefono("+54", "3411234567")).toBe("+54 3411234567");
    expect(formatTelefono({ prefijo: "+54", telefono: "11" })).toBe("+54 11");
  });

  it("tolera partes faltantes", () => {
    expect(formatTelefono(null, "11")).toBe("11");
    expect(formatTelefono(null, null)).toBe(EMPTY);
  });
});

describe("formatDireccion", () => {
  const destino = {
    nombreCalle: "Av. Corrientes",
    numeroCalle: 1234,
    localidad: { nombre: "CABA", provincia: { nombre: "Buenos Aires" } },
  };

  it("por defecto sólo calle y número", () => {
    expect(formatDireccion(destino)).toBe("Av. Corrientes 1234");
  });

  it("completa agrega localidad y provincia", () => {
    expect(formatDireccion(destino, { completa: true })).toBe(
      "Av. Corrientes 1234 · CABA, Buenos Aires"
    );
  });

  it("EMPTY sin destino", () => {
    expect(formatDireccion(null)).toBe(EMPTY);
    expect(formatDireccion({})).toBe(EMPTY);
  });
});

describe("formatPeso", () => {
  it("formatea con separadores es-AR y unidad", () => {
    expect(formatPeso(1234.5)).toBe("1.234,5 kg");
    expect(formatPeso(0)).toBe("0 kg");
  });

  it("EMPTY para valores no numéricos", () => {
    expect(formatPeso(null)).toBe(EMPTY);
    expect(formatPeso("")).toBe(EMPTY);
    expect(formatPeso("abc")).toBe(EMPTY);
  });
});
