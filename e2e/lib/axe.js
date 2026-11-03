import { readFileSync } from "node:fs";
import path from "node:path";
import config from "./config.js";

const AXE_PATH = path.join(config.repoRoot, "node_modules/axe-core/axe.min.js");
const AXE_SOURCE = readFileSync(AXE_PATH, "utf-8");

/**
 * Impactos de axe-core que esta auditoría (SHG-FE-041) exige corregir. `moderate`/
 * `minor` quedan fuera de alcance (ver task file: "corregir violaciones críticas/serias").
 */
export const BLOCKING_IMPACTS = ["critical", "serious"];

/**
 * Inyecta axe-core (leído una sola vez de `node_modules`, ver `AXE_SOURCE`) en la
 * `page` actual y corre el audit contra las reglas WCAG 2.0 A/AA + 2.1 AA — el mismo
 * set que pide la nota de implementación de la tarea.
 */
export async function runAxe(page) {
  await page.addScriptTag({ content: AXE_SOURCE });
  return page.evaluate(async () => {
    /* eslint-disable no-undef */
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    });
    /* eslint-enable no-undef */
  });
}

/** Sólo las violaciones con impacto `critical`/`serious` (ver `BLOCKING_IMPACTS`). */
export const blockingViolations = (results) =>
  (results.violations ?? []).filter((v) => BLOCKING_IMPACTS.includes(v.impact));

/** Resumen corto por violación, para loguear sin volcar el nodo HTML completo. */
export const summarizeViolation = (v) =>
  `${v.id} [${v.impact}] (${v.nodes.length} nodo(s)) — ${v.help} (${v.helpUrl})`;

export default { runAxe, blockingViolations, summarizeViolation, BLOCKING_IMPACTS };
