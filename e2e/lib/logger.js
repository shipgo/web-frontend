import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import config from "./config.js";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

const slugify = (label) =>
  label
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Log + evidencia de una corrida completa de `npm run e2e`. Todo queda bajo
 * `e2e/artifacts/<runId>/`:
 *   run.log            — log plano de toda la corrida (todos los casos)
 *   summary.json        — resultado por caso + issues (console/4xx/5xx) resaltados
 *   <caso>/NN-paso.png  — screenshot por paso, en orden
 */
export class RunLogger {
  constructor(runId = new Date().toISOString().replace(/[:.]/g, "-")) {
    this.runId = runId;
    this.runDir = path.join(config.artifactsDir, runId);
    mkdirSync(this.runDir, { recursive: true });
    this.logPath = path.join(this.runDir, "run.log");
    this.issues = [];
    this.caseResults = [];
    this.stepCounters = {};
  }

  log(line) {
    const stamped = `[${new Date().toISOString()}] ${line}`;
    console.log(stamped);
    appendFileSync(this.logPath, stamped + "\n");
  }

  caseDir(caseName) {
    const dir = path.join(this.runDir, caseName);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** Instrumenta una `page` de Playwright: consola, errores JS sin catchear y responses. */
  attachPage(page, caseName) {
    page.on("console", (msg) => {
      const type = msg.type();
      if (type === "error") {
        this.log(`[${caseName}] console.error: ${msg.text()}`);
        this.issues.push({ case: caseName, type: "console-error", detail: msg.text() });
      }
    });

    page.on("pageerror", (err) => {
      this.log(`[${caseName}] pageerror: ${err.message}`);
      this.issues.push({ case: caseName, type: "pageerror", detail: err.message });
    });

    page.on("response", (res) => {
      const status = res.status();
      if (status >= 400) {
        const detail = `${status} ${res.request().method()} ${res.url()}`;
        this.log(`[${caseName}] response ${detail}`);
        this.issues.push({ case: caseName, type: status >= 500 ? "http-5xx" : "http-4xx", detail });
      }
    });
  }

  /** Screenshot numerado (en orden) + entrada de log para un paso del caso. */
  async step(page, caseName, label) {
    const n = (this.stepCounters[caseName] = (this.stepCounters[caseName] ?? 0) + 1);
    const fileName = `${String(n).padStart(2, "0")}-${slugify(label)}.png`;
    const filePath = path.join(this.caseDir(caseName), fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    this.log(`[${caseName}] paso ${n}: ${label} -> ${path.relative(this.runDir, filePath)}`);
  }

  recordCaseResult(name, status, error) {
    this.caseResults.push({ name, status, error: error?.message ?? null });
  }

  /** Escribe `summary.json` y deja el resumen resaltado en `run.log`/stdout. */
  writeSummary() {
    const summary = {
      runId: this.runId,
      cases: this.caseResults,
      issues: this.issues,
      issueCounts: this.issues.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] ?? 0) + 1;
        return acc;
      }, {}),
    };
    writeFileSync(path.join(this.runDir, "summary.json"), JSON.stringify(summary, null, 2));

    this.log("──────── RESUMEN ────────");
    this.caseResults.forEach((c) => {
      this.log(`${c.status === "pass" ? "PASS" : "FAIL"} - ${c.name}${c.error ? ` (${c.error})` : ""}`);
    });
    if (this.issues.length === 0) {
      this.log("Sin errores de consola ni responses 4xx/5xx.");
    } else {
      this.log(`⚠ ${this.issues.length} issue(s) resaltado(s) durante la corrida:`);
      this.issues.forEach((i) => this.log(`  [${i.type}] (${i.case}) ${i.detail}`));
    }
    this.log(`Artefactos en: ${this.runDir}`);
    return summary;
  }
}

export default RunLogger;
