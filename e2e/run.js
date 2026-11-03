#!/usr/bin/env node
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

import config from "./lib/config.js";
import { RunLogger } from "./lib/logger.js";
import { ensureBackendUp, ensureWebUp, teardown } from "./lib/stack.js";

/**
 * Orquesta una corrida de smoke E2E: levanta backend + web (o reusa lo que
 * ya esté corriendo), corre los casos de `e2e/cases/*.js` con Chrome real, y
 * hace tear down de sólo lo que él mismo levantó.
 *
 * Uso:
 *   npm run e2e                      # todos los casos
 *   npm run e2e -- --case=smoke-happy-path
 *   E2E_HEADLESS=1 npm run e2e       # forzar headless (CI cae a esto solo)
 *
 * Ver `README.md` en este mismo directorio para el resto de las opciones
 * (`E2E_BACKEND_DIR`, `E2E_BACKEND_STRATEGY`, `E2E_WEB_URL`, etc.) y cómo
 * sumar un caso nuevo.
 */

const parseArgs = (argv) => {
  const only = argv.find((a) => a.startsWith("--case="))?.split("=")[1];
  return { only };
};

const loadCases = async (only) => {
  const casesDir = path.join(config.e2eDir, "cases");
  const files = readdirSync(casesDir).filter((f) => f.endsWith(".js"));
  const cases = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(casesDir, file)).href);
    const c = mod.default ?? mod;
    if (only && c.name !== only) continue;
    cases.push(c);
  }
  if (only && cases.length === 0) {
    throw new Error(`No se encontró el caso "${only}" en e2e/cases/`);
  }
  return cases;
};

async function main() {
  const { only } = parseArgs(process.argv.slice(2));
  const logger = new RunLogger();
  logger.log(`Iniciando corrida de e2e (headless=${config.headless}, backendDir=${config.backendDir}).`);

  const handles = [];
  let browser;
  let exitCode = 0;

  try {
    handles.push(await ensureBackendUp((l) => logger.log(l)));
    handles.push(await ensureWebUp((l) => logger.log(l)));

    const cases = await loadCases(only);
    logger.log(`Casos a correr: ${cases.map((c) => c.name).join(", ")}`);

    browser = await chromium.launch({ headless: config.headless });

    for (const testCase of cases) {
      logger.log(`▶ ${testCase.name}`);
      try {
        await testCase.run({ browser, logger, config });
        logger.recordCaseResult(testCase.name, "pass");
        logger.log(`✔ ${testCase.name} OK`);
      } catch (err) {
        logger.recordCaseResult(testCase.name, "fail", err);
        logger.log(`✘ ${testCase.name} FALLÓ: ${err.stack ?? err.message}`);
        exitCode = 1;
      }
    }
  } catch (err) {
    logger.log(`Error fatal orquestando la corrida: ${err.stack ?? err.message}`);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    teardown(handles, (l) => logger.log(l));
    const summary = logger.writeSummary();
    if (process.env.E2E_STRICT === "1" && summary.issues.length > 0) {
      exitCode = 1;
    }
  }

  process.exit(exitCode);
}

main();
