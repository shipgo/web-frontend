import { describe, expect, it } from "vitest";

import { toBackendDate } from "./utils";

describe("toBackendDate", () => {
  it("formatea un Date local a YYYY-MM-DD sin conversión de zona horaria", () => {
    // Medianoche LOCAL del 5/9/2026 — `.toISOString()` la convertiría a UTC,
    // que puede correr la fecha un día según el desfase horario (bug documentado
    // para `ViajeReqDTO` en SHG-FE-008, mismo patrón que UserReqDTO.fechaNacimiento).
    const date = new Date(2026, 8, 5);
    expect(toBackendDate(date)).toBe("2026-09-05");
  });

  it("no agrega hora ni offset (LocalDate, no LocalDateTime)", () => {
    const date = new Date(2026, 8, 5);
    expect(toBackendDate(date)).not.toMatch(/T/);
  });

  it("pasa strings ya en formato YYYY-MM-DD sin modificarlos", () => {
    expect(toBackendDate("2000-01-15")).toBe("2000-01-15");
  });

  it("devuelve null para valores vacíos o inválidos", () => {
    expect(toBackendDate(null)).toBeNull();
    expect(toBackendDate(undefined)).toBeNull();
    expect(toBackendDate("")).toBeNull();
  });
});
